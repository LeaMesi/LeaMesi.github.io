// src/services/geniusService.js
// Servicio de integración con Genius.com
// Provee búsqueda de canciones, metadatos, carátulas y recuperación de letras.

import { splitPhraseIntoSyllables, autoDistributeSyllables } from '../lyrics/syllablesHelper.js'
import { parseLrc, translateLyricsLines, getLanguageName } from './betterLyricsService.js'

const GENIUS_API_BASE_URL = 'https://api.genius.com'
const TOKEN_STORAGE_KEY = 'saranga_genius_token'

/**
 * Obtiene el token de acceso de Genius configurado
 */
export function getGeniusToken() {
  if (typeof localStorage !== 'undefined') {
    const saved = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (saved && saved.trim()) return saved.trim()
  }
  return (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GENIUS_ACCESS_TOKEN) || ''
}

/**
 * Guarda el token de acceso de Genius en el navegador
 */
export function setGeniusToken(token) {
  if (typeof localStorage !== 'undefined') {
    if (!token || !token.trim()) {
      localStorage.removeItem(TOKEN_STORAGE_KEY)
    } else {
      localStorage.setItem(TOKEN_STORAGE_KEY, token.trim())
    }
  }
}

/**
 * Verifica si hay un token de Genius configurado
 */
export function hasGeniusToken() {
  return Boolean(getGeniusToken())
}

/**
 * Busca canciones en Genius.com
 */
export async function searchGenius({ query = '', artist = '', song = '', limit = 25 } = {}) {
  const token = getGeniusToken()
  const searchQuery = (artist && song)
    ? `${artist} ${song}`.trim()
    : (song || artist || query).trim()

  if (!searchQuery) return []

  // Si tenemos token de acceso, consultamos la API oficial de Genius (con soporte CORS nativo)
  if (token) {
    try {
      const url = `${GENIUS_API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}`
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })

      if (res.ok) {
        const data = await res.json()
        const hits = data?.response?.hits || []

        return hits
          .filter(h => h.type === 'song' && h.result)
          .slice(0, limit)
          .map(h => {
            const r = h.result
            return {
              id: `genius-${r.id}`,
              rawId: r.id,
              source: 'genius',
              sourceName: 'Genius',
              song: r.title || 'Sin Título',
              artist: r.primary_artist?.name || 'Artista Desconocido',
              album: '',
              artwork: r.song_art_image_thumbnail_url || r.header_image_thumbnail_url || '',
              duration: 0,
              format: 'plain',
              syncType: 'plain',
              url: r.url || `https://genius.com/songs/${r.id}`,
              language: 'en'
            }
          })
      }
    } catch (err) {
      console.warn('Error al consultar API de Genius con token:', err)
    }
  }

  // Fallback: Si no hay token de Genius configurado, intentamos buscar el título
  // en LRCLIB para proveer coincidencias con badge de Genius/LRCLIB sin bloquear al usuario
  try {
    const fbUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery)}`
    const fbRes = await fetch(fbUrl)
    if (fbRes.ok) {
      const fbData = await fbRes.json()
      if (Array.isArray(fbData)) {
        return fbData.slice(0, limit).map(item => ({
          id: `genius-fb-${item.id}`,
          rawId: item.id,
          source: 'genius',
          sourceName: 'Genius',
          song: item.trackName || item.name || 'Sin Título',
          artist: item.artistName || 'Artista Desconocido',
          album: item.albumName || '',
          artwork: '',
          duration: Number(item.duration) || 0,
          format: item.syncedLyrics ? 'lrc' : 'plain',
          syncType: item.syncedLyrics ? 'linesync' : 'plain',
          syncedLyrics: item.syncedLyrics || null,
          plainLyrics: item.plainLyrics || null,
          language: 'und'
        }))
      }
    }
  } catch (e) {
    // Silently continue
  }

  return []
}

/**
 * Obtiene la letra y los detalles de una canción de Genius utilizando recuperación multietapa
 */
export async function fetchGeniusDetails(item) {
  const songName = item.song || ''
  const artistName = item.artist || ''

  // 1. Si el item ya traía la letra precargada desde el fallback
  if (item.syncedLyrics || item.plainLyrics) {
    return {
      ...item,
      lyrics: item.syncedLyrics || item.plainLyrics,
      isSynced: Boolean(item.syncedLyrics)
    }
  }

  // 2. Intentar buscar en LRCLIB por artista y canción para obtener letra (sincronizada o plana)
  try {
    const lrcUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(songName)}&artist_name=${encodeURIComponent(artistName)}`
    const lrcRes = await fetch(lrcUrl)
    if (lrcRes.ok) {
      const lrcData = await lrcRes.json()
      if (lrcData.syncedLyrics || lrcData.plainLyrics) {
        return {
          ...item,
          lyrics: lrcData.syncedLyrics || lrcData.plainLyrics,
          isSynced: Boolean(lrcData.syncedLyrics),
          syncedLyrics: lrcData.syncedLyrics,
          plainLyrics: lrcData.plainLyrics
        }
      }
    }
  } catch (err) {
    console.warn('Fallback LRCLIB no disponible para Genius:', err)
  }

  // 3. Intentar buscar en Lyrics.ovh como segundo fallback con CORS
  try {
    const ovhUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artistName)}/${encodeURIComponent(songName)}`
    const ovhRes = await fetch(ovhUrl)
    if (ovhRes.ok) {
      const ovhData = await ovhRes.json()
      if (ovhData.lyrics) {
        return {
          ...item,
          lyrics: ovhData.lyrics,
          isSynced: false
        }
      }
    }
  } catch (err) {
    console.warn('Fallback Lyrics.ovh no disponible para Genius:', err)
  }

  throw new Error(`No se pudo obtener la letra para "${songName}" de ${artistName}.`)
}

/**
 * Construye un paquete de canción listo para el editor de SarangaBaranga
 * a partir de un resultado de Genius.
 */
export async function buildSongPackageFromGenius(details, { translateTo = null } = {}) {
  let lines = []

  const rawLyrics = details.lyrics || details.plainLyrics || ''

  if (details.syncedLyrics || rawLyrics.includes('[')) {
    lines = parseLrc(details.syncedLyrics || rawLyrics)
  } else {
    // Limpieza de marcadores de estructura como [Verse 1], [Chorus], etc.
    const rawLines = rawLyrics
      .split('\n')
      .map(l => l.trim())
      .filter(l => Boolean(l) && !l.startsWith('[') && !l.endsWith(']'))

    let curTime = 2.0
    lines = rawLines.map((text, idx) => {
      const startTime = curTime
      const endTime = curTime + 3.0
      curTime += 3.5
      const rawSyls = splitPhraseIntoSyllables(text)
      const syllables = autoDistributeSyllables(rawSyls, startTime, endTime)
      return {
        id: `line-${idx + 1}`,
        startTime: Math.round(startTime * 1000) / 1000,
        endTime: Math.round(endTime * 1000) / 1000,
        text,
        syllables
      }
    })
  }

  const mainLangCode = details.language || 'en'
  const mainLangName = `${getLanguageName(mainLangCode)} (Original)`

  const languages = [
    {
      code: mainLangCode,
      name: mainLangName,
      isMain: true,
      plain: lines.map(l => l.text).join('\n'),
      lines
    }
  ]

  // Traducción opcional si se solicitó
  if (translateTo && translateTo !== mainLangCode) {
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
      console.warn('No se pudo generar traducción complementaria en Genius:', err)
    }
  }

  return {
    id: null,
    title: details.song || 'Canción de Genius',
    artist: details.artist || 'Artista Desconocido',
    genres: [],
    tags: ['genius'],
    audio_path: '',
    videos: [],
    lyrics_data: {
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
  }
}
