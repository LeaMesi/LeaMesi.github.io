// src/services/lrclibService.js
// Servicio de integración con la API de LRCLIB (https://lrclib.net)
// Provee búsqueda y obtención de letras sincronizadas (.lrc) y texto plano
// con soporte nativo de CORS y libre de tokens.

import { splitPhraseIntoSyllables, autoDistributeSyllables } from '../lyrics/syllablesHelper.js'
import { parseLrc, translateLyricsLines, getLanguageName } from './betterLyricsService.js'

const LRCLIB_BASE_URL = 'https://lrclib.net/api'

/**
 * Busca letras en LRCLIB por texto general o por combinación de artista y canción.
 */
export async function searchLrclib({ query = '', artist = '', track = '', song = '', syncType = 'all', limit = 30 } = {}) {
  const cleanTrack = (track || song || '').trim()
  const cleanArtist = artist.trim()
  const cleanQuery = query.trim()

  let url = ''
  if (cleanTrack && cleanArtist) {
    url = `${LRCLIB_BASE_URL}/search?track_name=${encodeURIComponent(cleanTrack)}&artist_name=${encodeURIComponent(cleanArtist)}`
  } else if (cleanTrack) {
    url = `${LRCLIB_BASE_URL}/search?track_name=${encodeURIComponent(cleanTrack)}`
  } else if (cleanQuery) {
    url = `${LRCLIB_BASE_URL}/search?q=${encodeURIComponent(cleanQuery)}`
  } else {
    return []
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!res.ok) {
      throw new Error(`LRCLIB error HTTP ${res.status}`)
    }

    const data = await res.json()
    if (!Array.isArray(data)) return []

    let items = data.map(item => ({
      id: `lrclib-${item.id}`,
      rawId: item.id,
      source: 'lrclib',
      sourceName: 'LRCLIB',
      song: item.trackName || item.name || 'Sin Título',
      artist: item.artistName || 'Artista Desconocido',
      album: item.albumName || '',
      duration: Number(item.duration) || 0,
      format: item.syncedLyrics ? 'lrc' : 'plain',
      syncType: item.syncedLyrics ? 'linesync' : 'plain',
      hasSynced: Boolean(item.syncedLyrics),
      hasPlain: Boolean(item.plainLyrics),
      syncedLyrics: item.syncedLyrics || null,
      plainLyrics: item.plainLyrics || null,
      language: 'und'
    }))

    if (syncType === 'linesync') {
      items = items.filter(item => item.hasSynced)
    }

    return items.slice(0, limit)
  } catch (err) {
    console.warn('Error al buscar en LRCLIB:', err)
    return []
  }
}

/**
 * Obtiene los detalles de una canción por su ID de LRCLIB
 */
export async function fetchLrclibDetails(idOrRawId) {
  const rawId = String(idOrRawId).replace(/^lrclib-/, '')
  const url = `${LRCLIB_BASE_URL}/get/${rawId}`

  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' }
  })

  if (!res.ok) {
    throw new Error(`Error al obtener detalles de LRCLIB (${res.status})`)
  }

  const item = await res.json()
  return {
    id: `lrclib-${item.id}`,
    rawId: item.id,
    source: 'lrclib',
    sourceName: 'LRCLIB',
    song: item.trackName || item.name || 'Sin Título',
    artist: item.artistName || 'Artista Desconocido',
    album: item.albumName || '',
    duration: Number(item.duration) || 0,
    syncedLyrics: item.syncedLyrics || null,
    plainLyrics: item.plainLyrics || null
  }
}

/**
 * Construye un paquete de canción listo para el editor de SarangaBaranga
 * a partir de un resultado o detalle de LRCLIB.
 */
export async function buildSongPackageFromLrclib(details, { translateTo = null } = {}) {
  let lines = []

  if (details.syncedLyrics) {
    lines = parseLrc(details.syncedLyrics)
  } else if (details.plainLyrics) {
    const rawLines = details.plainLyrics
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean)

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

  const mainLangCode = 'und'
  const mainLangName = 'Original'

  const languages = [
    {
      code: mainLangCode,
      name: mainLangName,
      isMain: true,
      plain: lines.map(l => l.text).join('\n'),
      lines
    }
  ]

  // Traducción opcional si se seleccionó
  if (translateTo && translateTo !== 'und') {
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
      console.warn('No se pudo generar traducción complementaria en LRCLIB:', err)
    }
  }

  return {
    id: null,
    title: details.song || 'Canción de LRCLIB',
    artist: details.artist || 'Artista Desconocido',
    genres: [],
    tags: ['lrclib', details.syncedLyrics ? 'sincronizada' : 'letra-plana'],
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
