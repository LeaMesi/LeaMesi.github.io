// src/services/onlineLyricsService.js
// Orquestador maestro para la búsqueda en múltiples motores de letras online
// (BetterLyrics / Unison, Genius.com y LRCLIB) con búsqueda unificada o por proveedor.

import {
  searchBetterLyrics,
  fetchBetterLyricsDetails,
  buildSongPackageFromBetterLyrics
} from './betterLyricsService.js'
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

export {
  getGeniusToken,
  setGeniusToken,
  hasGeniusToken
}

export const ONLINE_PROVIDERS = [
  { id: 'all', name: 'Todas las Fuentes', badge: 'Todas' },
  { id: 'betterlyrics', name: 'BetterLyrics', badge: 'BetterLyrics' },
  { id: 'genius', name: 'Genius', badge: 'Genius' },
  { id: 'lrclib', name: 'LRCLIB', badge: 'LRCLIB' }
]

/**
 * Realiza una búsqueda unificada o filtrada por proveedor en línea.
 */
export async function searchOnlineLyrics(options = {}) {
  const {
    provider = 'all', // 'all' | 'betterlyrics' | 'genius' | 'lrclib'
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

  // 2. Proveedor: Genius exclusivo
  if (provider === 'genius') {
    const results = await searchGenius({ query, artist, song, limit })
    return results.map(r => ({ ...r, source: 'genius', sourceName: 'Genius' }))
  }

  // 3. Proveedor: LRCLIB exclusivo
  if (provider === 'lrclib') {
    const results = await searchLrclib({ query, artist, track: song, syncType, limit })
    return results.map(r => ({ ...r, source: 'lrclib', sourceName: 'LRCLIB' }))
  }

  // 4. Modo "all" (Todas las Fuentes) - Búsqueda simultánea en paralelo
  const promises = [
    // BetterLyrics
    searchBetterLyrics({
      mode: 'general',
      query: (query || `${artist} ${song}`).trim(),
      syncType,
      limit: 25
    }).then(items => items.map(i => ({ ...i, source: 'betterlyrics', sourceName: 'BetterLyrics' }))),

    // LRCLIB
    searchLrclib({
      query: (query || `${artist} ${song}`).trim(),
      artist: artist.trim(),
      track: song.trim(),
      syncType,
      limit: 25
    }).then(items => items.map(i => ({ ...i, source: 'lrclib', sourceName: 'LRCLIB' }))),

    // Genius (siempre busca, ya sea con token o fallback)
    searchGenius({
      query: (query || `${artist} ${song}`).trim(),
      artist: artist.trim(),
      song: song.trim(),
      limit: 20
    }).then(items => items.map(i => ({ ...i, source: 'genius', sourceName: 'Genius' })))
  ]

  const settled = await Promise.allSettled(promises)
  const combined = []

  settled.forEach(res => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      combined.push(...res.value)
    }
  })

  // Ordenar inteligentemente los resultados unificados:
  // 1. Sílabas / TTML (BetterLyrics richsync) primero
  // 2. Versos / LRC (BetterLyrics / LRCLIB linesync) segundo
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

/**
 * Obtiene los detalles de la canción y construye el paquete de SarangaBaranga
 * a partir de un resultado de cualquier proveedor.
 */
export async function buildSongPackageFromOnlineResult(item, options = {}) {
  const source = item.source || 'betterlyrics'
  let rawPackage = null

  if (source === 'betterlyrics') {
    const details = await fetchBetterLyricsDetails(item.id)
    rawPackage = await buildSongPackageFromBetterLyrics(details, options)
  } else if (source === 'lrclib') {
    const details = await fetchLrclibDetails(item.rawId || item.id)
    rawPackage = await buildSongPackageFromLrclib(details, options)
  } else if (source === 'genius') {
    const details = await fetchGeniusDetails(item)
    rawPackage = await buildSongPackageFromGenius(details, options)
  } else {
    throw new Error(`Proveedor de letras desconocido: "${source}".`)
  }

  // Normalizar y sanear el paquete garantizando compatibilidad con el esquema
  return normalizeSongPackage(rawPackage)
}
