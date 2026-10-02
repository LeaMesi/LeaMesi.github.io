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
  { id: 'lrclib', name: 'LRCLIB', badge: 'LRCLIB' }
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

/**
 * Obtiene los detalles de la canción y construye el paquete de SarangaBaranga
 * a partir de un resultado de cualquier proveedor.
 */
export async function buildSongPackageFromOnlineResult(item, options = {}) {
  const source = item.source || 'betterlyrics'
  let rawPackage = null

  if (source === 'betterlyrics') {
    const details = await fetchBetterLyricsDetails(item.id, item.videoId, item.song, item.artist)
    rawPackage = await buildSongPackageFromBetterLyrics(details, options)
  } else if (source === 'lrcred') {
    const details = await fetchLrcRedDetails(item.rawId || item.isrc || item.id, item)
    rawPackage = await buildSongPackageFromLrcRed(details, options)
  } else if (source === 'lrclib') {
    const details = await fetchLrclibDetails(item.rawId || item.id, item)
    rawPackage = await buildSongPackageFromLrclib(details, options)
  } else if (source === 'genius') {
    const details = await fetchGeniusDetails(item)
    rawPackage = await buildSongPackageFromGenius(details, options)
  } else {
    throw new Error(`Proveedor de letras desconocido: "${source}".`)
  }

  // Normalizar y sanear el paquete garantizando compatibilidad con el esquema
  const normalized = normalizeSongPackage(rawPackage)
  // Enriquecer automáticamente con Romaji si se detecta texto en japonés
  return autoEnrichSongWithRomaji(normalized)
}
