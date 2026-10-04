// src/services/youtubeImportService.js
// Servicio para importar canciones desde YouTube y YouTube Music sin requerir API keys de Google.
// Soporta videos individuales, listas de URLs y listas de reproducción (playlists).

import { extractYouTubeVideoId, loadYouTubeApi } from '../player/mediaPlayer.js'
import { saveSong } from './songService.js'
import { createLibrary, addSongToLibrary, listLibraries, getNextUniqueLibraryName } from './libraryService.js'

export { extractYouTubeVideoId }

/**
 * Extrae el identificador de una lista de reproducción de YouTube o YouTube Music.
 * Soporta:
 * - https://www.youtube.com/playlist?list=PL...
 * - https://music.youtube.com/playlist?list=PL...
 * - https://www.youtube.com/watch?v=...&list=PL...
 * - https://music.youtube.com/watch?v=...&list=RDAMVM...
 * - Identificadores directos (PL..., RD..., etc.)
 *
 * @param {string} url
 * @returns {string|null}
 */
export function extractYouTubePlaylistId(url) {
  if (!url) return null
  const str = String(url).trim()
  try {
    const urlObj = new URL(str.startsWith('http') ? str : `https://${str}`)
    if (urlObj.searchParams.has('list')) {
      const list = urlObj.searchParams.get('list')
      if (list && list.length >= 2) return list
    }
  } catch (_) {}

  const match = str.match(/[?&]list=([a-zA-Z0-9_-]+)/)
  if (match) return match[1]

  if (/^(?:PL|UU|LL|FL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/.test(str)) {
    return str
  }
  return null
}

/**
 * Extrae múltiples Video IDs a partir de un texto multilinea o separado por comas.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function extractVideoIdsFromText(text) {
  if (!text) return []
  const lines = text.split(/[\r\n,]+/)
  const ids = []
  const seen = new Set()

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const vid = extractYouTubeVideoId(trimmed)
    if (vid && !seen.has(vid)) {
      seen.add(vid)
      ids.push(vid)
    }
  }
  return ids
}

/**
 * Analiza y limpia el título y el autor de un video de YouTube para separar Artista y Título.
 *
 * @param {string} title
 * @param {string} [authorName='']
 * @returns {{ artist: string, title: string }}
 */
export function parseYouTubeVideoMeta(title, authorName = '') {
  let cleanAuthor = (authorName || '').trim()
  cleanAuthor = cleanAuthor
    .replace(/\s*-\s*Topic$/i, '')
    .replace(/\s*VEVO$/i, '')
    .trim()

  let rawTitle = (title || '').trim()

  // Limpiar etiquetas típicas de videos musicales entre paréntesis o corchetes
  const cleanupPatterns = [
    /\s*[\(\[](?:[^\)\]]*(?:official|video|audio|remaster|4k|hd|live|visualizer|clip|lyric)[^\)\]]*)[\)\]]/gi,
    /\s*[\(\[]\s*[\)\]]/g
  ]

  for (const pat of cleanupPatterns) {
    rawTitle = rawTitle.replace(pat, '').trim()
  }

  // Si hay separador " - ", " – " o " — " entre artista y canción
  const separatorMatch = rawTitle.match(/^(.*?)\s*[-–—]\s*(.*)$/)
  if (separatorMatch && separatorMatch[1].trim() && separatorMatch[2].trim()) {
    return {
      artist: separatorMatch[1].trim(),
      title: separatorMatch[2].trim()
    }
  }

  return {
    artist: cleanAuthor || 'Artista Desconocido',
    title: rawTitle || 'Canción de YouTube'
  }
}

/**
 * Obtiene metadatos de un video mediante el servicio oficial oEmbed de YouTube (sin API Key).
 *
 * @param {string} videoId
 * @returns {Promise<{ videoId: string, title: string, artist: string, rawTitle: string, authorName: string, thumbnail: string, videoUrl: string }>}
 */
export async function fetchYouTubeVideoMeta(videoId) {
  if (!videoId) {
    throw new Error('ID de video de YouTube no especificado.')
  }

  const endpoint = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&format=json`
  const res = await fetch(endpoint)
  if (!res.ok) {
    throw new Error(`No se pudo obtener información del video ${videoId} (código ${res.status})`)
  }

  const data = await res.json()
  const parsed = parseYouTubeVideoMeta(data.title, data.author_name)

  return {
    videoId,
    title: parsed.title,
    artist: parsed.artist,
    rawTitle: data.title || '',
    authorName: data.author_name || '',
    thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    videoUrl: `https://www.youtube.com/watch?v=${videoId}`
  }
}

/**
 * Obtiene los IDs de los videos de una playlist de YouTube usando la YouTube IFrame API.
 * No requiere API key ni backend.
 *
 * @param {string} playlistId
 * @param {object} [options]
 * @param {number} [options.timeoutMs=15000]
 * @returns {Promise<string[]>}
 */
export async function fetchYouTubePlaylistVideoIds(playlistId, { timeoutMs = 15000 } = {}) {
  const cleanId = extractYouTubePlaylistId(playlistId) || playlistId
  if (!cleanId) {
    throw new Error('Identificador de playlist de YouTube inválido.')
  }

  const YT = await loadYouTubeApi()
  if (!YT || !YT.Player) {
    throw new Error('No se pudo inicializar la API IFrame de YouTube.')
  }

  return new Promise((resolve, reject) => {
    let resolved = false
    let player = null
    let pollInterval = null
    const tempDiv = document.createElement('div')
    const tempId = `yt-temp-pl-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    tempDiv.id = tempId
    tempDiv.style.cssText = 'position:fixed;width:200px;height:200px;right:0;bottom:0;opacity:0.01;pointer-events:none;z-index:-9999;'
    document.body.appendChild(tempDiv)

    const timer = setTimeout(() => {
      cleanup()
      if (!resolved) {
        reject(new Error('Tiempo de espera agotado al consultar la lista en YouTube. Verifica que sea pública.'))
      }
    }, timeoutMs)

    function cleanup() {
      clearTimeout(timer)
      if (pollInterval) {
        clearInterval(pollInterval)
        pollInterval = null
      }
      if (player && typeof player.destroy === 'function') {
        try {
          player.destroy()
        } catch (_) {}
      }
      if (tempDiv.parentNode) {
        tempDiv.parentNode.removeChild(tempDiv)
      }
    }

    function checkPlaylist() {
      if (resolved || !player) return
      try {
        if (typeof player.getPlaylist === 'function') {
          const list = player.getPlaylist()
          if (Array.isArray(list) && list.length > 0) {
            resolved = true
            cleanup()
            resolve(list)
          }
        }
      } catch (_) {}
    }

    const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
      ? window.location.origin
      : 'https://localhost'

    try {
      player = new YT.Player(tempId, {
        height: '200',
        width: '200',
        host: 'https://www.youtube.com',
        playerVars: {
          listType: 'playlist',
          list: cleanId,
          origin,
          enablejsapi: 1,
          autoplay: 0,
          controls: 0,
          rel: 0,
          playsinline: 1
        },
        events: {
          onReady: (event) => {
            try {
              if (typeof event.target.cuePlaylist === 'function') {
                event.target.cuePlaylist({
                  listType: 'playlist',
                  list: cleanId
                })
              }
            } catch (_) {}
            checkPlaylist()
          },
          onStateChange: () => {
            checkPlaylist()
          },
          onError: (e) => {
            checkPlaylist()
            if (resolved) return

            // Si el video actual tiene restricciones de inserción (error 150/101),
            // intentar avanzar en la lista para que getPlaylist() responda
            try {
              if (typeof player.nextVideo === 'function') {
                player.nextVideo()
              }
            } catch (_) {}

            setTimeout(checkPlaylist, 300)
            setTimeout(checkPlaylist, 800)
            setTimeout(() => {
              checkPlaylist()
              if (!resolved) {
                cleanup()
                const errCode = e?.data || 'desconocido'
                let hint = ''
                if (errCode === 150 || errCode === 101) {
                  hint = ' (los propietarios de los videos de esta lista restringen la inserción o reproducción en reproductores externos). Tip: Podés copiar y pegar las URLs de los videos directamente en este cuadro para importarlos todos juntos.'
                }
                reject(new Error(`Error de YouTube al consultar la lista: código ${errCode}${hint}`))
              }
            }, 1500)
          }
        }
      })

      // Iniciar sondeo activo continuo en intervalos cortos
      pollInterval = setInterval(checkPlaylist, 150)
    } catch (err) {
      cleanup()
      reject(err)
    }
  })
}

/**
 * Consulta los metadatos de múltiples videos de YouTube en paralelo controlado.
 *
 * @param {string[]} videoIds
 * @param {object} [options]
 * @param {function} [options.onProgress]
 * @param {number} [options.batchSize=4]
 * @returns {Promise<Array<{ videoId: string, title: string, artist: string, thumbnail: string, videoUrl: string }>>}
 */
export async function fetchMultipleYouTubeVideosMeta(videoIds, { onProgress = null, batchSize = 4 } = {}) {
  const results = []
  const total = videoIds.length

  for (let i = 0; i < total; i += batchSize) {
    const chunk = videoIds.slice(i, i + batchSize)
    const chunkPromises = chunk.map(async (vid) => {
      try {
        return await fetchYouTubeVideoMeta(vid)
      } catch (_) {
        // En caso de video bloqueado o error en oEmbed, proveer metadatos de rescate
        return {
          videoId: vid,
          title: `Video ${vid}`,
          artist: 'Artista Desconocido',
          rawTitle: '',
          authorName: '',
          thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${vid}`
        }
      }
    })

    const chunkResults = await Promise.all(chunkPromises)
    results.push(...chunkResults)

    if (onProgress) {
      onProgress(Math.min(i + chunk.length, total), total)
    }
  }

  return results
}

/**
 * Construye el paquete estándar de canción para SarangaBaranga sin letras a partir de metadatos de YouTube.
 *
 * @param {object} meta
 * @returns {object}
 */
export function buildSongPackageFromYouTubeMeta(meta) {
  const videoId = meta.videoId || ''
  const videoUrl = meta.videoUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : '')

  return {
    version: '1.1.0',
    metadata: {
      title: meta.title || 'Sin Título',
      artist: meta.artist || 'Artista Desconocido',
      genres: [],
      tags: [],
      audioPath: '',
      artwork: meta.thumbnail || '',
      source: 'youtube',
      videos: videoUrl ? [
        {
          id: `vid-${Date.now()}-0`,
          name: 'Video Oficial',
          url: videoUrl,
          offset: 0
        }
      ] : []
    },
    basic: {
      languages: [
        {
          code: 'es',
          name: 'Original',
          isMain: true,
          phrases: []
        }
      ]
    },
    advanced: {
      enabled: false,
      effects: []
    }
  }
}

/**
 * Guarda una o múltiples canciones en IndexedDB sin letras, opcionalmente asignándolas a una biblioteca.
 *
 * @param {Array<object>} videoMetas
 * @param {object} [options]
 * @param {string} [options.libraryName='']
 * @returns {Promise<Array<{ songId: number, title: string, artist: string }>>}
 */
export async function importYouTubeSongs(videoMetas, { libraryName = '' } = {}) {
  if (!Array.isArray(videoMetas) || videoMetas.length === 0) {
    return []
  }

  let targetLibraryId = null
  const cleanLibName = (libraryName || '').trim()

  if (cleanLibName) {
    const existingLibs = await listLibraries()
    const match = existingLibs.find(l => l.name.toLowerCase() === cleanLibName.toLowerCase())
    if (match) {
      targetLibraryId = match.id
    } else {
      const createdLib = await createLibrary(cleanLibName)
      targetLibraryId = createdLib.id
    }
  }

  const savedSongs = []

  for (const meta of videoMetas) {
    const songData = {
      title: meta.title || 'Sin Título',
      artist: meta.artist || 'Artista Desconocido',
      audio_path: '',
      videos: [
        {
          id: `vid-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: 'Video Oficial',
          url: meta.videoUrl || `https://www.youtube.com/watch?v=${meta.videoId}`,
          offset: 0
        }
      ],
      lyrics_data: {
        languages: [
          {
            code: 'es',
            name: 'Original',
            isMain: true,
            phrases: []
          }
        ]
      },
      visuals_data: {
        enabled: false,
        effects: []
      }
    }

    const songId = await saveSong(songData)

    if (targetLibraryId) {
      await addSongToLibrary(songId, targetLibraryId)
    }

    savedSongs.push({
      songId,
      title: songData.title,
      artist: songData.artist
    })
  }

  return savedSongs
}
