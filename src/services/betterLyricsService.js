// Servicio de integración con la API comunitaria de BetterLyrics & Unison
// Permite buscar letras sincronizadas, obtener documentos TTML/LRC,
// traducirlos en tiempo real y transformarlos a la estructura de SarangaBaranga.

import { splitPhraseIntoSyllables, autoDistributeSyllables } from '../lyrics/syllablesHelper.js'
import { extractYouTubeVideoId } from '../player/mediaPlayer.js'

const UNISON_BASE_URL = 'https://unison.boidu.dev'
const BETTER_LYRICS_BASE_URL = 'https://api.betterlyrics.org'

// Nombres legibles para códigos ISO de idiomas comunes
const LANGUAGE_NAMES = {
  es: 'Español',
  en: 'English',
  ja: '日本語 (Japonés)',
  ko: '한국어 (Coreano)',
  zh: '中文 (Chino)',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ru: 'Русский',
  und: 'Original'
}

export function getLanguageName(code) {
  if (!code) return 'Original'
  const clean = code.toLowerCase().trim()
  return LANGUAGE_NAMES[clean] || code.toUpperCase()
}

/**
 * Normaliza una cadena de texto (sin acentos, minúsculas, espacios recortados)
 */
export function normalizeText(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function cleanThe(str) {
  return str.replace(/^the\s+/i, '').trim()
}

/**
 * Comprueba con alta fidelidad si un artista coincide con el objetivo,
 * considerando colaboraciones (feat, ft., &, with, x, vs., etc.) y artículos.
 */
export function isArtistMatch(artistStr, targetArtist) {
  const normArtist = normalizeText(artistStr)
  const normTarget = normalizeText(targetArtist)
  if (!normArtist || !normTarget) return false

  const targetWithoutThe = cleanThe(normTarget)

  // Coincidencia directa
  if (normArtist === normTarget) return true
  if (cleanThe(normArtist) === targetWithoutThe) return true

  // Separar colaboraciones estándar en la industria musical
  const collaborators = normArtist
    .split(/\s*(?:feat\.?|ft\.?|featuring|&|\/|\+|x|,|with|vs\.?)\s*/i)
    .map(s => s.trim())
    .filter(Boolean)

  if (collaborators.some(c => c === normTarget || cleanThe(c) === targetWithoutThe)) {
    return true
  }

  return false
}

/**
 * Convierte strings de tiempo en formato "M:SS.mmm", "H:MM:SS.mmm", "SS.mmm" a segundos decimales
 */
export function parseTime(timeStr) {
  if (!timeStr) return 0
  const clean = String(timeStr).trim().replace('s', '')
  const parts = clean.split(':').map(Number)
  if (parts.length === 3) {
    return (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0)
  } else if (parts.length === 2) {
    return (parts[0] * 60) + (parts[1] || 0)
  } else if (parts.length === 1) {
    return Number(parts[0]) || 0
  }
  return 0
}

/**
 * Mapea un elemento retornado por Unison al formato estándar de SarangaBaranga
 */
function mapUnisonItem(item, targetArtist = '') {
  const isExactArtist = targetArtist ? isArtistMatch(item.artist, targetArtist) : false
  return {
    id: item.id,
    song: item.song || 'Sin Título',
    artist: item.artist || 'Artista Desconocido',
    album: item.album || '',
    videoId: item.videoId || '',
    duration: Number(item.duration) || 0,
    format: item.format || 'ttml',
    syncType: item.syncType || 'richsync',
    confidence: item.confidence || 'low',
    matchScore: item.matchScore || 0,
    language: item.language || 'en',
    isExactArtist
  }
}

/**
 * Busca canciones en BetterLyrics / Unison de forma exhaustiva y versátil:
 * - Modo general: búsqueda libre por texto o detección automática de YouTube URL/videoId
 * - Modo artista: búsqueda con filtro estricto por artista (100% canciones del artista)
 * - Modo artista + título: búsqueda combinada de alta precisión
 * - Modo video: búsqueda directa por URL o ID de YouTube
 * - Filtro opcional por tipo de sincronización (todas, richsync, linesync)
 */
export async function searchBetterLyrics(queryOrOptions, legacyOptions = {}) {
  // Manejo polimórfico de argumentos para compatibilidad con código existente
  let options = {}
  if (typeof queryOrOptions === 'string') {
    options = { query: queryOrOptions, ...legacyOptions }
  } else if (queryOrOptions && typeof queryOrOptions === 'object') {
    options = { ...queryOrOptions, ...legacyOptions }
  }

  const {
    mode = 'general', // 'general' | 'artist' | 'artist_song' | 'video'
    query = '',
    artist = '',
    song = '',
    videoId = '',
    strictArtist = false,
    syncType = 'all', // 'all' | 'richsync' | 'linesync'
    limit = 50
  } = options

  let rawResults = []

  // 1. Modo Video o detección automática de enlace / ID de YouTube en el query
  const extractedId = extractYouTubeVideoId(videoId || query) || (
    /^[a-zA-Z0-9_-]{11}$/.test((videoId || query).trim()) ? (videoId || query).trim() : null
  )

  if (mode === 'video' || (mode === 'general' && extractedId)) {
    const vId = extractedId || videoId.trim()
    if (vId) {
      try {
        // Consultar versión principal registrada para este video
        const resMain = await fetch(`${UNISON_BASE_URL}/lyrics?v=${encodeURIComponent(vId)}`)
        if (resMain.ok) {
          const jsonMain = await resMain.json()
          if (jsonMain.success && jsonMain.data) {
            rawResults.push(jsonMain.data)
          }
        }
        // Consultar variantes alternativas si existen
        const resVariants = await fetch(`${UNISON_BASE_URL}/lyrics/variants/${encodeURIComponent(vId)}?limit=20`)
        if (resVariants.ok) {
          const jsonVariants = await resVariants.json()
          if (jsonVariants.success && Array.isArray(jsonVariants.data)) {
            jsonVariants.data.forEach(v => {
              if (!rawResults.some(r => r.id === v.id)) {
                rawResults.push(v)
              }
            })
          }
        }
      } catch (err) {
        console.warn('Error buscando video en Unison:', err)
      }
    }
  } else if (mode === 'artist_song') {
    // 2. Modo Artista + Título
    const cleanArtist = (artist || '').trim()
    const cleanSong = (song || '').trim()

    if (!cleanArtist && !cleanSong) return []

    if (cleanArtist && cleanSong) {
      // Intento 1: Búsqueda exacta en Unison
      try {
        const exactUrl = `${UNISON_BASE_URL}/lyrics/search?song=${encodeURIComponent(cleanSong)}&artist=${encodeURIComponent(cleanArtist)}&limit=${limit}`
        const resExact = await fetch(exactUrl)
        if (resExact.ok) {
          const jsonExact = await resExact.json()
          if (jsonExact.success && Array.isArray(jsonExact.data) && jsonExact.data.length > 0) {
            rawResults.push(...jsonExact.data)
          }
        }
      } catch (_) {}

      // Intento 2: Búsqueda complementaria amplia con q = artist + song
      try {
        const broadUrl = `${UNISON_BASE_URL}/lyrics/search?q=${encodeURIComponent(cleanArtist + ' ' + cleanSong)}&limit=${limit}`
        const resBroad = await fetch(broadUrl)
        if (resBroad.ok) {
          const jsonBroad = await resBroad.json()
          if (jsonBroad.success && Array.isArray(jsonBroad.data)) {
            jsonBroad.data.forEach(item => {
              if (!rawResults.some(r => r.id === item.id)) {
                rawResults.push(item)
              }
            })
          }
        }
      } catch (_) {}
    } else {
      const singleQ = cleanArtist || cleanSong
      const res = await fetch(`${UNISON_BASE_URL}/lyrics/search?q=${encodeURIComponent(singleQ)}&limit=${limit}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) rawResults = json.data
      }
    }
  } else if (mode === 'artist') {
    // 3. Modo Solo por Artista
    const targetArtist = (artist || query || '').trim()
    if (!targetArtist) return []

    const url = `${UNISON_BASE_URL}/lyrics/search?q=${encodeURIComponent(targetArtist)}&limit=${limit}`
    const res = await fetch(url)
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        rawResults = json.data
      }
    }
  } else {
    // 4. Modo General
    const cleanQuery = (query || '').trim()
    if (!cleanQuery) return []

    const url = `${UNISON_BASE_URL}/lyrics/search?q=${encodeURIComponent(cleanQuery)}&limit=${limit}`
    const res = await fetch(url)
    if (res.ok) {
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        rawResults = json.data
      }
    }
  }

  // Filtrado y mapeo
  const targetArtist = (artist || (mode === 'artist' ? query : '')).trim()
  const targetSong = (song || (mode === 'general' ? '' : '')).trim()
  const normTargetSong = normalizeText(targetSong)

  let mapped = rawResults.map(item => mapUnisonItem(item, targetArtist))

  // Filtro estricto de artista (si está activo el modo artist o strictArtist=true)
  if (targetArtist && (strictArtist || mode === 'artist')) {
    mapped = mapped.filter(item => isArtistMatch(item.artist, targetArtist))
  }

  // Filtro por tipo de sincronización
  if (syncType === 'richsync') {
    mapped = mapped.filter(item => item.syncType === 'richsync' || item.format === 'ttml')
  } else if (syncType === 'linesync') {
    mapped = mapped.filter(item => item.syncType === 'linesync' || item.format === 'lrc')
  }

  // Ordenamiento inteligente:
  // 1. Coincidencia completa (artista Y canción)
  // 2. Coincidencia de título si se buscó canción
  // 3. Coincidencia de artista si se buscó artista
  // 4. Formato richsync / TTML prioritario
  // 5. matchScore descendente
  mapped.sort((a, b) => {
    if (normTargetSong) {
      const aFullMatch = a.isExactArtist && normalizeText(a.song).includes(normTargetSong)
      const bFullMatch = b.isExactArtist && normalizeText(b.song).includes(normTargetSong)
      if (aFullMatch !== bFullMatch) return bFullMatch ? 1 : -1

      const aSongMatch = normalizeText(a.song).includes(normTargetSong)
      const bSongMatch = normalizeText(b.song).includes(normTargetSong)
      if (aSongMatch !== bSongMatch) return bSongMatch ? 1 : -1
    }

    if (a.isExactArtist !== b.isExactArtist) return b.isExactArtist ? 1 : -1

    const aRich = a.syncType === 'richsync' ? 1 : 0
    const bRich = b.syncType === 'richsync' ? 1 : 0
    if (aRich !== bRich) return bRich - aRich

    return (b.matchScore || 0) - (a.matchScore || 0)
  })

  return mapped
}

/**
 * Obtiene el cuerpo y metadatos de la letra por ID numérico o videoId
 */
export async function fetchBetterLyricsDetails(id, videoId = null, song = null, artist = null) {
  let data = null

  // 1. Intentar por ID en Unison
  if (id) {
    try {
      const res = await fetch(`${UNISON_BASE_URL}/lyrics/${id}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          data = json.data
        }
      }
    } catch (_) {}
  }

  // 2. Intentar por VideoId en Unison si falló
  if (!data && videoId) {
    try {
      const res = await fetch(`${UNISON_BASE_URL}/lyrics?v=${encodeURIComponent(videoId)}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && json.data) {
          data = json.data
        }
      }
    } catch (_) {}
  }

  // 3. Fallback a BetterLyrics API principal si se tienen título y artista
  if (!data && song && artist) {
    try {
      const res = await fetch(`${BETTER_LYRICS_BASE_URL}/getLyrics?s=${encodeURIComponent(song)}&a=${encodeURIComponent(artist)}`)
      if (res.ok) {
        const json = await res.json()
        if (json.ttml) {
          data = {
            song,
            artist,
            format: 'ttml',
            syncType: 'richsync',
            lyrics: json.ttml,
            videoId: videoId || ''
          }
        }
      }
    } catch (_) {}
  }

  if (!data || !data.lyrics) {
    throw new Error('No se pudo descargar la letra sincronizada desde BetterLyrics.')
  }

  return {
    id: data.id || id,
    song: data.song || song || 'Canción',
    artist: data.artist || artist || '',
    album: data.album || '',
    duration: Number(data.duration) || 0,
    format: data.format || 'ttml',
    syncType: data.syncType || 'richsync',
    language: data.language || 'en',
    lyrics: data.lyrics,
    videoId: data.videoId || videoId || ''
  }
}

/**
 * Traduce un conjunto de líneas de texto usando el endpoint de Unison
 */
export async function translateLyricsLines(linesArray, targetLang = 'es') {
  if (!linesArray || linesArray.length === 0) return { lines: [], detectedLang: '' }

  try {
    const response = await fetch(`${UNISON_BASE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: linesArray,
        to: targetLang
      })
    })

    if (!response.ok) {
      console.warn('Error en traducción de Unison:', response.status)
      return { lines: [], detectedLang: '' }
    }

    const data = await response.json()
    return {
      lines: data.lines || [],
      detectedLang: data.detectedLang || ''
    }
  } catch (err) {
    console.warn('Fallo de red al traducir con Unison:', err)
    return { lines: [], detectedLang: '' }
  }
}

/**
 * Parser de TTML (XML) a líneas y sílabas de SarangaBaranga
 */
export function parseTtml(ttmlContent) {
  if (!ttmlContent) return []

  const lines = []

  // Intento con DOMParser del navegador
  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(ttmlContent, 'text/xml')
      const pElements = Array.from(doc.getElementsByTagName('p'))

      if (pElements.length > 0) {
        pElements.forEach((p, idx) => {
          const begin = parseTime(p.getAttribute('begin'))
          let end = parseTime(p.getAttribute('end'))
          const spans = Array.from(p.getElementsByTagName('span'))

          const syllables = []
          if (spans.length > 0) {
            spans.forEach((span, sIdx) => {
              const sBegin = parseTime(span.getAttribute('begin')) || begin
              let sEnd = parseTime(span.getAttribute('end')) || end
              if (sEnd <= sBegin) sEnd = sBegin + 0.35

              let text = span.textContent || ''
              // Si el nodo siguiente en el DOM es texto con espacios, preservarlo
              if (span.nextSibling && span.nextSibling.nodeType === 3) {
                const ws = span.nextSibling.nodeValue || ''
                if (/\s/.test(ws) && !text.endsWith(' ')) {
                  text += ' '
                }
              }

              syllables.push({
                text,
                startTime: Math.round(sBegin * 1000) / 1000,
                duration: Math.max(0.05, Math.round((sEnd - sBegin) * 1000) / 1000)
              })
            })
          }

          let lineText = syllables.map(s => s.text).join('').trim()
          if (!lineText) {
            lineText = p.textContent.trim()
          }

          // Si no había end o era menor a begin, usar el final de la última sílaba
          if (end <= begin && syllables.length > 0) {
            const last = syllables[syllables.length - 1]
            end = last.startTime + last.duration
          } else if (end <= begin) {
            end = begin + 3.0
          }

          // Si no había spans pero sí texto, generar sílabas fonéticas automáticamente
          let finalSyllables = syllables
          if (finalSyllables.length === 0 && lineText) {
            const rawSyls = splitPhraseIntoSyllables(lineText)
            finalSyllables = autoDistributeSyllables(rawSyls, begin, end)
          }

          lines.push({
            id: `line-${idx + 1}`,
            startTime: Math.round(begin * 1000) / 1000,
            endTime: Math.round(end * 1000) / 1000,
            text: lineText,
            syllables: finalSyllables
          })
        })

        if (lines.length > 0) return lines
      }
    } catch (e) {
      console.warn('DOMParser falló con TTML, usando parser regex:', e)
    }
  }

  // Fallback con Regex
  const pRegex = /<p[^>]*begin="([^"]+)"[^>]*end="([^"]+)"[^>]*>([\s\S]*?)<\/p>/gi
  const spanRegex = /<span[^>]*begin="([^"]+)"[^>]*end="([^"]+)"[^>]*>([^<]*)<\/span>(\s*)/gi

  let pMatch
  let lineIdx = 0
  while ((pMatch = pRegex.exec(ttmlContent)) !== null) {
    lineIdx++
    const begin = parseTime(pMatch[1])
    let end = parseTime(pMatch[2])
    const innerHtml = pMatch[3]

    const syllables = []
    let sMatch
    while ((sMatch = spanRegex.exec(innerHtml)) !== null) {
      const sBegin = parseTime(sMatch[1]) || begin
      let sEnd = parseTime(sMatch[2]) || end
      if (sEnd <= sBegin) sEnd = sBegin + 0.35
      const text = sMatch[3] + (sMatch[4] || '')

      syllables.push({
        text,
        startTime: Math.round(sBegin * 1000) / 1000,
        duration: Math.max(0.05, Math.round((sEnd - sBegin) * 1000) / 1000)
      })
    }

    let lineText = syllables.map(s => s.text).join('').trim()
    if (!lineText) {
      lineText = innerHtml.replace(/<[^>]+>/g, '').trim()
    }

    if (end <= begin && syllables.length > 0) {
      const last = syllables[syllables.length - 1]
      end = last.startTime + last.duration
    } else if (end <= begin) {
      end = begin + 3.0
    }

    let finalSyllables = syllables
    if (finalSyllables.length === 0 && lineText) {
      const rawSyls = splitPhraseIntoSyllables(lineText)
      finalSyllables = autoDistributeSyllables(rawSyls, begin, end)
    }

    lines.push({
      id: `line-${lineIdx}`,
      startTime: Math.round(begin * 1000) / 1000,
      endTime: Math.round(end * 1000) / 1000,
      text: lineText,
      syllables: finalSyllables
    })
  }

  return lines
}

/**
 * Parser de formato LRC clásico a versos y sílabas
 */
export function parseLrc(lrcContent) {
  if (!lrcContent) return []

  const rawLines = lrcContent.split('\n')
  const tagRegex = /^\[(\d{1,2}):(\d{1,2}(?:\.\d{1,3})?)\](.*)$/
  const parsed = []

  for (const raw of rawLines) {
    const trimmed = raw.trim()
    const match = trimmed.match(tagRegex)
    if (match) {
      const min = Number(match[1]) || 0
      const sec = Number(match[2]) || 0
      const text = match[3].trim()
      const time = (min * 60) + sec
      if (text) {
        parsed.push({ time, text })
      }
    }
  }

  parsed.sort((a, b) => a.time - b.time)

  const lines = []
  for (let i = 0; i < parsed.length; i++) {
    const item = parsed[i]
    const startTime = Math.round(item.time * 1000) / 1000
    const nextTime = parsed[i + 1] ? parsed[i + 1].time : (startTime + 3.5)
    const endTime = Math.max(startTime + 0.5, Math.round(nextTime * 1000) / 1000)

    const rawSyls = splitPhraseIntoSyllables(item.text)
    const syllables = autoDistributeSyllables(rawSyls, startTime, endTime)

    lines.push({
      id: `line-${i + 1}`,
      startTime,
      endTime,
      text: item.text,
      syllables
    })
  }

  return lines
}

/**
 * Convierte cualquier respuesta de BetterLyrics/Unison a un objeto de canción
 * completo y preconfigurado para ser abierto en `songEditorView`.
 */
export async function buildSongPackageFromBetterLyrics(details, { translateTo = null } = {}) {
  let lines = []

  const fmt = (details.format || '').toLowerCase()
  if (fmt === 'ttml' || details.lyrics.trim().startsWith('<tt')) {
    lines = parseTtml(details.lyrics)
  } else if (fmt === 'lrc' || details.lyrics.includes('[')) {
    lines = parseLrc(details.lyrics)
  } else {
    // Texto plano
    const rawLines = details.lyrics.split('\n').map(l => l.trim()).filter(Boolean)
    let curTime = 2.0
    lines = rawLines.map((text, idx) => {
      const startTime = curTime
      const endTime = curTime + 3.5
      curTime += 4.0
      const rawSyls = splitPhraseIntoSyllables(text)
      return {
        id: `line-${idx + 1}`,
        startTime,
        endTime,
        text,
        syllables: autoDistributeSyllables(rawSyls, startTime, endTime)
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
      lines: lines
    }
  ]

  // Si se solicitó traducción automática
  if (translateTo && translateTo !== mainLangCode) {
    try {
      const textsToTranslate = lines.map(l => l.text)
      const translationResult = await translateLyricsLines(textsToTranslate, translateTo)

      if (translationResult.lines && translationResult.lines.length === lines.length) {
        const transLines = lines.map((originalLine, idx) => {
          const transItem = translationResult.lines[idx]
          const translatedText = transItem?.translation || originalLine.text

          // Distribuir sílabas en español o idioma destino con los mismos tiempos del verso
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
      console.warn('No se pudo generar la traducción complementaria:', err)
    }
  }

  const videoUrl = details.videoId
    ? `https://music.youtube.com/watch?v=${details.videoId}`
    : ''

  return {
    id: null, // Canción nueva sin guardar aún en IndexedDB
    title: details.song || 'Canción Importada',
    artist: details.artist || '',
    genres: ['Pop'],
    tags: ['betterlyrics', details.syncType || 'sincronizada'],
    videos: [
      {
        id: `vid-${Date.now()}-0`,
        name: 'Video Oficial (YouTube / YT Music)',
        url: videoUrl,
        offset: 0
      }
    ],
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
