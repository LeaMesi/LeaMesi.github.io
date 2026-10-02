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
  searchLrcRed,
  fetchLrcRedDetails,
  buildSongPackageFromLrcRed
} from '../../src/services/lrcRedService.js'
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

  describe('lrcRedService - búsqueda y ensamblado', () => {
    it('searchLrcRed mapea correctamente los campos de respuesta de lrc.red', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          hits: [
            {
              isrc: 'GBUM71029604',
              title: 'Bohemian Rhapsody',
              artist: 'Queen',
              album: 'A Night at the Opera',
              year: 1975,
              duration: 356.52,
              cover: 'https://lrc.red/s/GBUM71029604.webp'
            }
          ]
        })
      })

      const items = await searchLrcRed({ query: 'bohemian rhapsody' })
      expect(items.length).toBe(1)
      expect(items[0].id).toBe('lrcred-GBUM71029604')
      expect(items[0].source).toBe('lrcred')
      expect(items[0].sourceName).toBe('LRC.red')
      expect(items[0].song).toBe('Bohemian Rhapsody')
      expect(items[0].artist).toBe('Queen')
      expect(items[0].duration).toBe(356.52)
      expect(items[0].artwork).toBe('https://lrc.red/s/GBUM71029604.webp')
      expect(items[0].hasSynced).toBe(true)
    })

    it('buildSongPackageFromLrcRed construye un paquete compatible con el esquema de SarangaBaranga', async () => {
      const details = {
        id: 'lrcred-TESTISRC',
        song: 'Canción Test',
        artist: 'Artista Test',
        duration: 120,
        language: 'es',
        lines: [
          {
            id: 'line-1',
            startTime: 10,
            endTime: 14,
            text: 'Primera línea',
            syllables: [
              { id: 'syl-1', text: 'Pri', startTime: 10, duration: 2 },
              { id: 'syl-2', text: 'mera línea', startTime: 12, duration: 2 }
            ]
          }
        ]
      }

      const pkg = await buildSongPackageFromLrcRed(details)
      expect(pkg.title).toBe('Canción Test')
      expect(pkg.artist).toBe('Artista Test')
      expect(pkg.lyrics_data.languages[0].lines.length).toBe(1)
      expect(pkg.tags).toContain('lrcred')
    })
  })

  describe('onlineLyricsService - orquestador', () => {
    it('expone los proveedores configurados incluyendo LRC.red', () => {
      expect(ONLINE_PROVIDERS.length).toBe(5)
      expect(ONLINE_PROVIDERS.map(p => p.id)).toEqual(['all', 'betterlyrics', 'lrcred', 'genius', 'lrclib'])
    })

    it('limita a un máximo de 6 resultados por fuente en la búsqueda general (modo all)', async () => {
      // Mock global fetch simulando 10 resultados para cada fuente
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url)
        if (urlStr.includes('unison.boidu.dev/lyrics/search')) {
          const tenItems = Array.from({ length: 10 }, (_, i) => ({
            id: `bl-${i}`,
            song: `BL Song ${i}`,
            artist: 'BL Artist',
            syncType: 'richsync',
            format: 'ttml'
          }))
          return { ok: true, json: async () => ({ success: true, data: tenItems }) }
        }
        if (urlStr.includes('lrc.red/search.json')) {
          const tenHits = Array.from({ length: 10 }, (_, i) => ({
            isrc: `RED${i}`,
            title: `Red Song ${i}`,
            artist: 'Red Artist',
            duration: 180
          }))
          return { ok: true, json: async () => ({ hits: tenHits }) }
        }
        if (urlStr.includes('lrclib.net/api/search')) {
          const tenLrc = Array.from({ length: 10 }, (_, i) => ({
            id: `lrc-${i}`,
            trackName: `Lrclib Song ${i}`,
            artistName: 'Lrclib Artist',
            syncedLyrics: '[00:01.00]Test'
          }))
          return { ok: true, json: async () => tenLrc }
        }
        if (urlStr.includes('genius.com') || urlStr.includes('api.genius.com')) {
          const tenGenius = Array.from({ length: 10 }, (_, i) => ({
            id: `gen-${i}`,
            title: `Genius Song ${i}`,
            primary_artist: { name: 'Genius Artist' }
          }))
          return { ok: true, json: async () => ({ response: { hits: tenGenius.map(g => ({ result: g })) } }) }
        }
        return { ok: true, json: async () => [] }
      })

      const allResults = await searchOnlineLyrics({ query: 'rock', provider: 'all' })
      const blCount = allResults.filter(r => r.source === 'betterlyrics').length
      const redCount = allResults.filter(r => r.source === 'lrcred').length
      const lrclibCount = allResults.filter(r => r.source === 'lrclib').length

      // Ninguna fuente puede tener más de 6 resultados en búsqueda general
      expect(blCount).toBeLessThanOrEqual(6)
      expect(redCount).toBeLessThanOrEqual(6)
      expect(lrclibCount).toBeLessThanOrEqual(6)
      expect(blCount).toBe(6)
      expect(redCount).toBe(6)
      expect(lrclibCount).toBe(6)
    })

    it('no limita a 6 cuando se busca por proveedor individual (se mantiene el límite normal)', async () => {
      vi.spyOn(globalThis, 'fetch').mockImplementation(async (url) => {
        const urlStr = String(url)
        if (urlStr.includes('lrc.red/search.json')) {
          const tenHits = Array.from({ length: 10 }, (_, i) => ({
            isrc: `RED${i}`,
            title: `Red Song ${i}`,
            artist: 'Red Artist'
          }))
          return { ok: true, json: async () => ({ hits: tenHits }) }
        }
        return { ok: true, json: async () => [] }
      })

      const indResults = await searchOnlineLyrics({ query: 'rock', provider: 'lrcred', limit: 10 })
      expect(indResults.length).toBe(10)
    })

    it('ordena resultados unificados priorizando richsync sobre linesync y plain', async () => {
      // Mock global fetch para simular respuestas de proveedores
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

    it('auto-genera texto alternativo Romaji cuando la canción importada contiene caracteres japoneses', async () => {
      const details = {
        id: 222,
        song: 'アイドル',
        artist: 'YOASOBI',
        language: 'en', // La API a menudo reporta 'en' erróneamente para canciones japonesas
        format: 'ttml',
        lyrics: `
          <tt>
            <body>
              <div>
                <p begin="0:00.589" end="0:03.197">
                  <span begin="0:00.589" end="0:01.395">無敵の</span>
                  <span begin="0:01.395" end="0:01.866">笑顔</span>
                  <span begin="0:01.866" end="0:02.044">で</span>
                  <span begin="0:02.044" end="0:02.346">荒らす</span>
                  <span begin="0:02.346" end="0:02.798">メディ</span>
                  <span begin="0:02.798" end="0:03.197">ア</span>
                </p>
              </div>
            </body>
          </tt>
        `
      }

      const pkg = await buildSongPackageFromBetterLyrics(details)
      expect(pkg.lyrics_data.languages[0].code).toBe('ja')
      expect(pkg.lyrics_data.languages[0].lines[0].altText).toBe('muteki no egao de arasu media')
      expect(pkg.lyrics_data.languages[0].lines[0].syllables[0].altText.trim()).toBe('muteki no')
      expect(pkg.lyrics_data.languages[0].lines[0].syllables[1].altText.trim()).toBe('egao')
      expect(pkg.lyrics_data.languages[0].lines[0].syllables[5].altText.trim()).toBe('a')
    })
  })
})
