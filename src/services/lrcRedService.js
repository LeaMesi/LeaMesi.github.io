// src/services/lrcRedService.js
// Servicio de integración con https://lrc.red/
// Provee búsqueda y obtención de letras sincronizadas (TTML silábico, LRC y lyricsfile)
// con soporte nativo de CORS y libre de autenticación.

import { splitPhraseIntoSyllables, autoDistributeSyllables } from '../lyrics/syllablesHelper.js'
import { parseTtml, parseLrc, translateLyricsLines, getLanguageName } from './betterLyricsService.js'
import { parseLyricsfile } from './lyricsfileService.js'

const LRC_RED_BASE_URL = 'https://lrc.red'

/**
 * Busca canciones en LRC.red por texto general o por combinación de artista y canción.
 */
export async function searchLrcRed({ query = '', artist = '', track = '', song = '', syncType = 'all', limit = 30 } = {}) {
  const cleanTrack = (track || song || '').trim()
  const cleanArtist = artist.trim()
  const cleanQuery = query.trim()

  let searchQuery = ''
  if (cleanTrack && cleanArtist) {
    searchQuery = `${cleanArtist} ${cleanTrack}`
  } else if (cleanTrack) {
    searchQuery = cleanTrack
  } else if (cleanQuery) {
    searchQuery = cleanQuery
  } else if (cleanArtist) {
    searchQuery = cleanArtist
  } else {
    return []
  }

  try {
    const url = `${LRC_RED_BASE_URL}/search.json?q=${encodeURIComponent(searchQuery)}`
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!res.ok) {
      throw new Error(`LRC.red error HTTP ${res.status}`)
    }

    const data = await res.json()
    const hits = Array.isArray(data?.hits) ? data.hits : []

    let items = hits.map(hit => ({
      id: `lrcred-${hit.isrc}`,
      rawId: hit.isrc,
      isrc: hit.isrc,
      source: 'lrcred',
      sourceName: 'LRC.red',
      song: hit.title || 'Sin Título',
      artist: hit.artist || 'Artista Desconocido',
      album: hit.album || '',
      year: hit.year || null,
      duration: Number(hit.duration) || 0,
      artwork: hit.cover || null,
      color: hit.color || null,
      format: 'ttml',
      syncType: 'richsync',
      hasSynced: true,
      hasRichSync: true,
      hasPlain: false,
      language: 'und'
    }))

    if (syncType === 'linesync') {
      // Si el usuario filtra específicamente por líneas, mantenemos compatibilidad
      items = items.filter(item => item.hasSynced)
    }

    return items.slice(0, limit)
  } catch (err) {
    console.warn('Error al buscar en LRC.red:', err)
    return []
  }
}

/**
 * Obtiene los detalles de una canción por su ISRC de LRC.red
 */
export async function fetchLrcRedDetails(idOrRawId, fallbackItem = null) {
  const isrc = String(idOrRawId).replace(/^lrcred-/, '')

  try {
    const metaUrl = `${LRC_RED_BASE_URL}/s/${isrc}.json`
    const metaRes = await fetch(metaUrl, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })

    if (metaRes.ok) {
      const trackData = await metaRes.json()
      const ttmlUrl = trackData.files?.ttml || `${LRC_RED_BASE_URL}/s/${isrc}.ttml`
      const lrcUrl = trackData.files?.lrc || `${LRC_RED_BASE_URL}/s/${isrc}.lrc`
      const lyricsfileUrl = trackData.files?.lyricsfile || `${LRC_RED_BASE_URL}/s/${isrc}.lyricsfile.yaml`

      let lines = []

      // 1. Intentar primero con TTML (conserva marcas de tiempo de sílabas y versos)
      try {
        const ttmlRes = await fetch(ttmlUrl)
        if (ttmlRes.ok) {
          const ttmlText = await ttmlRes.text()
          lines = parseTtml(ttmlText)
        }
      } catch (err) {
        console.warn('Error obteniendo TTML de LRC.red:', err)
      }

      // 2. Si TTML falló o no produjo líneas, intentar con Lyricsfile (YAML 1.0)
      if (!lines || lines.length === 0) {
        try {
          const lfRes = await fetch(lyricsfileUrl)
          if (lfRes.ok) {
            const lfText = await lfRes.text()
            const parsedLf = parseLyricsfile(lfText)
            lines = parsedLf.lines || []
          }
        } catch (err) {
          console.warn('Error obteniendo lyricsfile de LRC.red:', err)
        }
      }

      // 3. Fallback a formato LRC
      if (!lines || lines.length === 0) {
        try {
          const lrcRes = await fetch(lrcUrl)
          if (lrcRes.ok) {
            const lrcText = await lrcRes.text()
            lines = parseLrc(lrcText)
          }
        } catch (err) {
          console.warn('Error obteniendo LRC de LRC.red:', err)
        }
      }

      if (lines && lines.length > 0) {
        const isLineSync = trackData.sync === 'line'
        return {
          id: `lrcred-${isrc}`,
          rawId: isrc,
          isrc,
          source: 'lrcred',
          sourceName: 'LRC.red',
          song: trackData.title || fallbackItem?.song || 'Sin Título',
          artist: trackData.artist || fallbackItem?.artist || 'Artista Desconocido',
          album: trackData.album || fallbackItem?.album || '',
          duration: Number(trackData.duration) || fallbackItem?.duration || 0,
          sync: trackData.sync || (isLineSync ? 'line' : 'word'),
          syncType: isLineSync ? 'linesync' : 'richsync',
          language: trackData.language || 'und',
          genres: trackData.genres || [],
          songwriters: trackData.songwriters || [],
          artwork: trackData.cover || fallbackItem?.artwork || null,
          lines
        }
      }
    }
  } catch (err) {
    console.warn('Fallo al consultar endpoint JSON de LRC.red:', err)
  }

  // Fallback directo a TTML si el endpoint JSON falló
  try {
    const directTtmlRes = await fetch(`${LRC_RED_BASE_URL}/s/${isrc}.ttml`)
    if (directTtmlRes.ok) {
      const ttmlText = await directTtmlRes.text()
      const lines = parseTtml(ttmlText)
      if (lines && lines.length > 0) {
        return {
          id: fallbackItem?.id || `lrcred-${isrc}`,
          rawId: isrc,
          isrc,
          source: 'lrcred',
          sourceName: 'LRC.red',
          song: fallbackItem?.song || 'Sin Título',
          artist: fallbackItem?.artist || 'Artista Desconocido',
          album: fallbackItem?.album || '',
          duration: Number(fallbackItem?.duration) || 0,
          sync: 'word',
          syncType: 'richsync',
          language: fallbackItem?.language || 'und',
          genres: [],
          songwriters: [],
          artwork: fallbackItem?.artwork || null,
          lines
        }
      }
    }
  } catch (err) {
    console.warn('Fallback directo a TTML en LRC.red falló:', err)
  }

  throw new Error('No se pudo obtener la letra desde LRC.red.')
}

/**
 * Construye un paquete de canción listo para el editor de SarangaBaranga
 * a partir de un resultado o detalle de LRC.red.
 */
export async function buildSongPackageFromLrcRed(details, { translateTo = null } = {}) {
  const lines = details.lines || []
  const mainLangCode = details.language && details.language !== 'und' ? details.language : 'und'
  const mainLangName = getLanguageName(mainLangCode)

  const languages = [
    {
      code: mainLangCode,
      name: mainLangName,
      isMain: true,
      plain: lines.map(l => l.text).join('\n'),
      lines
    }
  ]

  // Traducción complementaria opcional
  if (translateTo && translateTo !== 'none' && translateTo !== mainLangCode) {
    try {
      const textsToTranslate = lines.map(l => l.text)
      const translationResult = await translateLyricsLines(textsToTranslate, translateTo)

      if (translationResult.lines && translationResult.lines.length === lines.length) {
        const transLines = lines.map((originalLine, idx) => {
          const transItem = translationResult.lines[idx]
          const translatedText = transItem?.translation || originalLine.text

          const rawSyls = splitPhraseIntoSyllables(translatedText)
          const syllables = autoDistributeSyllables(rawSyls, originalLine.startTime, originalLine.endTime)

          return {
            id: `line-trans-${idx + 1}`,
            startTime: originalLine.startTime,
            endTime: originalLine.endTime,
            text: translatedText,
            syllables
          }
        })

        languages.push({
          code: translateTo,
          name: `${getLanguageName(translateTo)} (Traducción)`,
          isMain: false,
          plain: transLines.map(l => l.text).join('\n'),
          lines: transLines
        })
      }
    } catch (err) {
      console.warn('No se pudo generar traducción complementaria en LRC.red:', err)
    }
  }

  const basic = {
    timing: {
      bpm: 120,
      timeSignature: [4, 4],
      syncMode: 'timestamp',
      globalOffset: 0
    },
    styles: {
      textColor: '#94a3b8',
      activeColor: '#fbbf24',
      completedColor: '#f59e0b',
      translationColor: '#38bdf8',
      backgroundColor: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '2.1rem'
    },
    languages
  }

  const metadata = {
    title: details.song || 'Canción de LRC.red',
    artist: details.artist || 'Artista Desconocido',
    genres: details.genres || [],
    tags: ['lrcred', details.sync === 'line' ? 'sincronizada' : 'silabas'],
    audioPath: '',
    videos: []
  }

  return {
    id: null,
    title: metadata.title,
    artist: metadata.artist,
    genres: metadata.genres,
    tags: metadata.tags,
    audio_path: '',
    videos: [],
    lyrics_data: basic,
    metadata,
    basic
  }
}
