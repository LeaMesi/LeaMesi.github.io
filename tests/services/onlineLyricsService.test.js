import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  normalizeText,
  isArtistMatch,
  parseTime,
  parseTtml,
  parseLrc,
  buildSongPackageFromBetterLyrics
} from '../../src/services/betterLyricsService.js'
import {
  buildSongPackageFromLrclib
} from '../../src/services/lrclibService.js'
import {
  getGeniusToken,
  setGeniusToken,
  hasGeniusToken,
  buildSongPackageFromGenius
} from '../../src/services/geniusService.js'
import {
  ONLINE_PROVIDERS,
  searchOnlineLyrics,
  buildSongPackageFromOnlineResult
} from '../../src/services/onlineLyricsService.js'

describe('services/onlineLyricsService.js y proveedores', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  describe('betterLyricsService - funciones auxiliares', () => {
    it('normalizeText remueve acentos y pasa a minúsculas', () => {
      expect(normalizeText('Canción del Corazón')).toBe('cancion del corazon')
      expect(normalizeText('  Queen  ')).toBe('queen')
    })

    it('isArtistMatch maneja colaboraciones estándar y prefijos The', () => {
      expect(isArtistMatch('The Beatles', 'Beatles')).toBe(true)
      expect(isArtistMatch('Beatles', 'The Beatles')).toBe(true)

      // Colaboraciones directas
      expect(isArtistMatch('Queen feat. David Bowie', 'Queen')).toBe(true)
      expect(isArtistMatch('Queen feat. David Bowie', 'David Bowie')).toBe(true)
      expect(isArtistMatch('Coldplay & BTS', 'Coldplay')).toBe(true)
      expect(isArtistMatch('Coldplay & BTS', 'BTS')).toBe(true)
      expect(isArtistMatch('Marshmello x Khalid', 'Khalid')).toBe(true)
      expect(isArtistMatch('Eminem ft. Rihanna', 'Rihanna')).toBe(true)

      // No debe coincidir artistas totalmente distintos
      expect(isArtistMatch('Michael Jackson', 'Prince')).toBe(false)
    })

    it('parseTime convierte cadenas temporales a segundos decimales', () => {
      expect(parseTime('01:30.500')).toBe(90.5)
      expect(parseTime('00:45')).toBe(45)
      expect(parseTime('01:02:03')).toBe(3723)
      expect(parseTime('15.2s')).toBe(15.2)
    })

    it('parseTtml parsea XML TTML a versos y sílabas con tiempos', () => {
      const ttml = `
        <tt>
          <body>
            <div>
              <p begin="00:10.000" end="00:13.500">
                <span begin="00:10.000" end="00:11.200">Hola </span>
                <span begin="00:11.200" end="00:13.500">mundo</span>
              </p>
            </div>
          </body>
        </tt>
      `
      const lines = parseTtml(ttml)
      expect(lines.length).toBe(1)
      expect(lines[0].startTime).toBe(10)
      expect(lines[0].endTime).toBe(13.5)
      expect(lines[0].text).toBe('Hola mundo')
      expect(lines[0].syllables.length).toBe(2)
      expect(lines[0].syllables[0].text).toBe('Hola ')
      expect(lines[0].syllables[0].startTime).toBe(10)
      expect(lines[0].syllables[0].duration).toBe(1.2)
    })

    it('parseLrc parsea marcas de tiempo de formato LRC', () => {
      const lrc = `
        [00:10.50]Primer verso sincronizado
        [00:15.00]Segundo verso sincronizado
      `
      const lines = parseLrc(lrc)
      expect(lines.length).toBe(2)
      expect(lines[0].startTime).toBe(10.5)
      expect(lines[0].text).toBe('Primer verso sincronizado')
      expect(lines[0].syllables.length).toBeGreaterThan(0)
      expect(lines[1].startTime).toBe(15.0)
    })

    it('buildSongPackageFromBetterLyrics construye un paquete normalizado', async () => {
      const details = {
        song: 'Demo Song',
        artist: 'Demo Artist',
        format: 'lrc',
        lyrics: '[00:05.00]Hola que tal',
        videoId: 'abc12345678'
      }

      const pkg = await buildSongPackageFromBetterLyrics(details)
      expect(pkg.title).toBe('Demo Song')
      expect(pkg.artist).toBe('Demo Artist')
      expect(pkg.lyrics_data.languages[0].lines.length).toBe(1)
      expect(pkg.videos.length).toBe(1)
      expect(pkg.videos[0].url).toContain('abc12345678')
    })
  })

  describe('geniusService - tokens y ensamblado', () => {
    it('gestiona el token de Genius en localStorage', () => {
      expect(hasGeniusToken()).toBe(false)
      setGeniusToken('test-token-123')
      expect(hasGeniusToken()).toBe(true)
      expect(getGeniusToken()).toBe('test-token-123')

      setGeniusToken('')
      expect(hasGeniusToken()).toBe(false)
    })

    it('buildSongPackageFromGenius construye un paquete desde letra plana', async () => {
      const details = {
        song: 'Genius Song',
        artist: 'Genius Artist',
        lyrics: 'Línea uno de la canción\nLínea dos de la canción'
      }

      const pkg = await buildSongPackageFromGenius(details)
      expect(pkg.title).toBe('Genius Song')
      expect(pkg.artist).toBe('Genius Artist')
      expect(pkg.lyrics_data.languages[0].lines.length).toBe(2)
    })
  })

  describe('lrclibService - ensamblado', () => {
    it('buildSongPackageFromLrclib construye un paquete desde syncedLyrics', async () => {
      const details = {
        song: 'Lrclib Track',
        artist: 'Lrclib Artist',
        syncedLyrics: '[00:02.00]Verso uno\n[00:06.00]Verso dos'
      }

      const pkg = await buildSongPackageFromLrclib(details)
      expect(pkg.title).toBe('Lrclib Track')
      expect(pkg.lyrics_data.languages[0].lines.length).toBe(2)
    })
  })

  describe('onlineLyricsService - orquestador', () => {
    it('expone los proveedores configurados', () => {
      expect(ONLINE_PROVIDERS.length).toBe(4)
      expect(ONLINE_PROVIDERS.map(p => p.id)).toEqual(['all', 'betterlyrics', 'genius', 'lrclib'])
    })

    it('ordena resultados unificados priorizando richsync sobre linesync y plain', async () => {
      // Mock global fetch para simular respuestas de los 3 proveedores
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url)
        if (urlStr.includes('unison.boidu.dev/lyrics/search')) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: [
                { id: 'u1', song: 'Canción Silábica', artist: 'Artista U', syncType: 'richsync', format: 'ttml' }
              ]
            })
          }
        }
        if (urlStr.includes('lrclib.net/api/search')) {
          return {
            ok: true,
            json: async () => [
              { id: 'l1', trackName: 'Canción Línea', artistName: 'Artista L', syncedLyrics: '[00:01.00]Línea' }
            ]
          }
        }
        return {
          ok: true,
          json: async () => []
        }
      })

      const results = await searchOnlineLyrics({ query: 'test', provider: 'all' })
      expect(results.length).toBeGreaterThanOrEqual(2)
      // Primer lugar debe ser el que tiene syncType 'richsync' (prioridad 100)
      expect(results[0].syncType).toBe('richsync')
      expect(results[0].song).toBe('Canción Silábica')
    })
  })
})
