// src/services/onlineLyricsService.js
// Orquestador maestro para la búsqueda en múltiples motores de letras online
// (BetterLyrics / Unison, Genius.com y LRCLIB) con búsqueda unificada o por proveedor.

import {
  searchBetterLyrics,
  fetchBetterLyricsDetails,
  buildSongPackageFromBetterLyrics
} from './betterLyricsService.js'
import {
  searchLrcRed,
  fetchLrcRedDetails,
  buildSongPackageFromLrcRed
} from './lrcRedService.js'
import {
  searchLrclib,
  fetchLrclibDetails,
  buildSongPackageFromLrclib
} from './lrclibService.js'
import {
  searchGenius,
  fetchGeniusDetails,
  buildSongPackageFromGenius,
  getGeniusToken,
  setGeniusToken,
  hasGeniusToken
} from './geniusService.js'
import { normalizeSongPackage } from './schemaValidator.js'
import { autoEnrichSongWithRomaji } from '../lyrics/transliterationHelper.js'

export {
  getGeniusToken,
  setGeniusToken,
  hasGeniusToken
}

export const ONLINE_PROVIDERS = [
  { id: 'all', name: 'Todas las Fuentes', badge: 'Todas' },
  { id: 'betterlyrics', name: 'BetterLyrics', badge: 'BetterLyrics' },
  { id: 'lrcred', name: 'LRC.red', badge: 'LRC.red' },
  { id: 'genius', name: 'Genius', badge: 'Genius' },
  { id: 'lrclib', name: 'LRCLIB', badge: 'LRCLIB' },
  { id: 'youtube', name: 'YouTube', badge: 'YouTube' }
]

/**
 * Realiza una búsqueda unificada o filtrada por proveedor en línea.
 */
export async function searchOnlineLyrics(options = {}) {
  const {
    provider = 'all', // 'all' | 'betterlyrics' | 'lrcred' | 'genius' | 'lrclib'
    query = '',
    artist = '',
    song = '',
    videoId = '',
    mode = 'general', // Para BetterLyrics: 'general' | 'artist' | 'artist_song' | 'video'
    strictArtist = false,
    syncType = 'all',
    limit = 40
  } = options

  // 1. Proveedor: BetterLyrics exclusivo
  if (provider === 'betterlyrics') {
    const results = await searchBetterLyrics(options)
    return results.map(r => ({ ...r, source: 'betterlyrics', sourceName: 'BetterLyrics' }))
  }

  // 2. Proveedor: LRC.red exclusivo
  if (provider === 'lrcred') {
    const results = await searchLrcRed({ query, artist, track: song, song, syncType, limit })
    return results.map(r => ({ ...r, source: 'lrcred', sourceName: 'LRC.red' }))
  }

  // 3. Proveedor: Genius exclusivo
  if (provider === 'genius') {
    const results = await searchGenius({ query, artist, song, limit })
    return results.map(r => ({ ...r, source: 'genius', sourceName: 'Genius' }))
  }

  // 4. Proveedor: LRCLIB exclusivo
  if (provider === 'lrclib') {
    const results = await searchLrclib({ query, artist, track: song, syncType, limit })
    return results.map(r => ({ ...r, source: 'lrclib', sourceName: 'LRCLIB' }))
  }

  // 5. Modo "all" (Todas las Fuentes) - Búsqueda simultánea en paralelo con máximo 6 resultados por fuente
  const MAX_PER_SOURCE = 6
  const cleanGeneralQuery = (query || `${artist} ${song}`).trim()

  const promises = [
    // BetterLyrics (máximo 6 resultados en búsqueda general)
    searchBetterLyrics({
      mode: 'general',
      query: cleanGeneralQuery,
      syncType,
      limit: 15
    }).then(items => items.slice(0, MAX_PER_SOURCE).map(i => ({ ...i, source: 'betterlyrics', sourceName: 'BetterLyrics' }))),

    // LRC.red (máximo 6 resultados en búsqueda general)
    searchLrcRed({
      query: cleanGeneralQuery,
      artist: artist.trim(),
      song: song.trim(),
      syncType,
      limit: 15
    }).then(items => items.slice(0, MAX_PER_SOURCE).map(i => ({ ...i, source: 'lrcred', sourceName: 'LRC.red' }))),

    // LRCLIB (máximo 6 resultados en búsqueda general)
    searchLrclib({
      query: cleanGeneralQuery,
      artist: artist.trim(),
      track: song.trim(),
      syncType,
      limit: 15
    }).then(items => items.slice(0, MAX_PER_SOURCE).map(i => ({ ...i, source: 'lrclib', sourceName: 'LRCLIB' }))),

    // Genius (máximo 6 resultados en búsqueda general)
    searchGenius({
      query: cleanGeneralQuery,
      artist: artist.trim(),
      song: song.trim(),
      limit: 15
    }).then(items => items.slice(0, MAX_PER_SOURCE).map(i => ({ ...i, source: 'genius', sourceName: 'Genius' })))
  ]

  const settled = await Promise.allSettled(promises)
  const combined = []

  settled.forEach(res => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      combined.push(...res.value.slice(0, MAX_PER_SOURCE))
    }
  })

  // Ordenar inteligentemente los resultados unificados:
  // 1. Sílabas / TTML (BetterLyrics / LRC.red richsync) primero
  // 2. Versos / LRC (BetterLyrics / LRC.red / LRCLIB linesync) segundo
  // 3. Letras planas (Genius / LRCLIB plain)
  return combined.sort((a, b) => {
    const score = item => {
      let s = 0
      if (item.syncType === 'richsync') s += 100
      else if (item.syncType === 'linesync') s += 50
      if (item.videoId) s += 25
      if (item.artwork) s += 10
      return s
    }
    return score(b) - score(a)
  }).slice(0, limit)
}

async function fetchDetailsBySource(source, item) {
  if (source === 'betterlyrics') {
    return await fetchBetterLyricsDetails(item.id, item.videoId, item.song, item.artist)
  } else if (source === 'lrcred') {
    return await fetchLrcRedDetails(item.rawId || item.isrc || item.id, item)
  } else if (source === 'lrclib') {
    return await fetchLrclibDetails(item.rawId || item.id, item)
  } else if (source === 'genius') {
    return await fetchGeniusDetails(item)
  } else if (source === 'youtube') {
    return {
      title: item.song || item.title || 'Canción de YouTube',
      artist: item.artist || 'Artista Desconocido',
      videoId: item.videoId || '',
      videoUrl: item.videoUrl || (item.videoId ? `https://www.youtube.com/watch?v=${item.videoId}` : ''),
      artwork: item.artwork || ''
    }
  }
  throw new Error(`Proveedor de letras desconocido: "${source}".`)
}

async function buildPackageBySource(source, details, opts) {
  if (source === 'betterlyrics') {
    return await buildSongPackageFromBetterLyrics(details, opts)
  } else if (source === 'lrcred') {
    return await buildSongPackageFromLrcRed(details, opts)
  } else if (source === 'lrclib') {
    return await buildSongPackageFromLrclib(details, opts)
  } else if (source === 'genius') {
    return await buildSongPackageFromGenius(details, opts)
  } else if (source === 'youtube') {
    return {
      version: '1.1.0',
      metadata: {
        title: details.title,
        artist: details.artist,
        genres: [],
        tags: [],
        audioPath: '',
        artwork: details.artwork || '',
        source: 'youtube',
        videos: details.videoUrl ? [
          {
            id: `vid-${Date.now()}-0`,
            name: 'Video Oficial',
            url: details.videoUrl,
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
  throw new Error(`Proveedor de letras desconocido: "${source}".`)
}

/**
 * Obtiene los detalles de la canción y construye el paquete de SarangaBaranga
 * a partir de un resultado de cualquier proveedor con soporte progresivo.
 */
export async function buildSongPackageFromOnlineResult(item, options = {}) {
  const { onLyricsReady, onProgress, translateTo = null } = options
  const source = item.source || 'betterlyrics'

  if (onProgress) onProgress(`Descargando letra desde ${item.sourceName || source}...`)

  const details = await fetchDetailsBySource(source, item)

  // Si se solicita actualización progresiva con traducción:
  if (onLyricsReady && translateTo && translateTo !== 'none') {
    if (onProgress) onProgress('Letra obtenida. Procesando versos y sincronización...')
    // 1. Construir paquete base original sin esperar a la traducción
    const baseRaw = await buildPackageBySource(source, details, { ...options, translateTo: null })
    const baseNormalized = normalizeSongPackage(baseRaw)
    const baseEnriched = autoEnrichSongWithRomaji(baseNormalized)

    // Emitir inmediatamente al editor para que muestre los versos y sílabas
    onLyricsReady(baseEnriched)

    // 2. Si el idioma principal ya es el de destino, no hace falta traducir
    const mainLang = baseEnriched.lyrics_data?.languages?.find(l => l.isMain) || baseEnriched.lyrics_data?.languages?.[0]
    if (mainLang && mainLang.code === translateTo) {
      return baseEnriched
    }

    if (onProgress) onProgress(`Traduciendo frases a ${translateTo}...`)

    // 3. Generar la traducción complementaria
    try {
      const fullRaw = await buildPackageBySource(source, details, options)
      const fullNormalized = normalizeSongPackage(fullRaw)
      return autoEnrichSongWithRomaji(fullNormalized)
    } catch (transErr) {
      console.warn('Error al traducir progresivamente:', transErr)
      return baseEnriched
    }
  }

  // Flujo normal directo
  const rawPackage = await buildPackageBySource(source, details, options)
  const normalized = normalizeSongPackage(rawPackage)
  const enriched = autoEnrichSongWithRomaji(normalized)
  if (onLyricsReady) {
    onLyricsReady(enriched)
  }
  return enriched
}
