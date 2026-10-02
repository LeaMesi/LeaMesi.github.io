import { describe, it, expect, beforeEach } from 'vitest'
import { getDB } from '../../src/services/db.js'
import { saveSong, fetchSongById } from '../../src/services/songService.js'
import {
  parseLyricsfile,
  convertToLyricsfileYaml,
  exportLanguageToLyricsfile,
  importLyricsfileAsNewSong,
  importLyricsfileAsTranslation
} from '../../src/services/lyricsfileService.js'

describe('services/lyricsfileService.js', () => {
  beforeEach(async () => {
    await getDB()
  })

  const sampleYaml = `
version: '1.0'
metadata:
  title: 'Canción YAML Test'
  artist: 'Artista YAML'
  language: 'es'
  offset_ms: 500
lines:
  - text: 'Caminando por la ciudad'
    start_ms: 10000
    end_ms: 14000
    alt_text: 'Caminando por la ciudad'
    words:
      - text: 'Caminando '
        start_ms: 10000
        end_ms: 12000
        alt_text: 'Caminando '
      - text: 'por '
        start_ms: 12000
        end_ms: 12500
      - text: 'la '
        start_ms: 12500
        end_ms: 13000
      - text: 'ciudad'
        start_ms: 13000
        end_ms: 14000
plain: |
  Caminando por la ciudad
`.trim()

  describe('parseLyricsfile', () => {
    it('parsea correctamente un documento YAML 1.0 a segundos y sílabas', () => {
      const parsed = parseLyricsfile(sampleYaml)

      expect(parsed.version).toBe('1.0')
      expect(parsed.metadata.title).toBe('Canción YAML Test')
      expect(parsed.metadata.artist).toBe('Artista YAML')
      expect(parsed.metadata.language).toBe('es')
      expect(parsed.metadata.offset_ms).toBe(500)

      expect(parsed.lines.length).toBe(1)
      const line = parsed.lines[0]
      expect(line.startTime).toBe(10) // 10000 ms / 1000
      expect(line.endTime).toBe(14)
      expect(line.text).toBe('Caminando por la ciudad')
      expect(line.altText).toBe('Caminando por la ciudad')

      expect(line.syllables.length).toBe(4)
      expect(line.syllables[0].text).toBe('Caminando ')
      expect(line.syllables[0].startTime).toBe(10)
      expect(line.syllables[0].duration).toBe(2) // (12000 - 10000) / 1000
    })

    it('lanza error si el contenido no es un string o es YAML inválido', () => {
      expect(() => parseLyricsfile(null)).toThrow('El contenido a parsear debe ser una cadena YAML.')
      expect(() => parseLyricsfile(1234)).toThrow('El contenido a parsear debe ser una cadena YAML.')
    })
  })

  describe('convertToLyricsfileYaml', () => {
    it('serializa un objeto de canción al formato YAML 1.0 convirtiendo segundos a milisegundos', () => {
      const song = {
        title: 'Prueba Exportación YAML',
        artist: 'Banda Export',
        lyrics_data: {
          timing: { globalOffset: 0.25 },
          languages: [
            {
              code: 'es',
              name: 'Español',
              isMain: true,
              lines: [
                {
                  startTime: 5.5,
                  endTime: 9.0,
                  text: 'Hola mundo',
                  altText: 'Hora mundo',
                  syllables: [
                    { text: 'Hola ', startTime: 5.5, duration: 1.5, altText: 'Hora ' },
                    { text: 'mundo', startTime: 7.0, duration: 2.0, altText: 'mundo' }
                  ]
                }
              ]
            }
          ]
        }
      }

      const yamlStr = convertToLyricsfileYaml(song)
      expect(yamlStr).toContain("version: '1.0'")
      expect(yamlStr).toContain('title: Prueba Exportación YAML')
      expect(yamlStr).toContain('artist: Banda Export')
      expect(yamlStr).toContain('start_ms: 5500') // 5.5s * 1000
      expect(yamlStr).toContain('end_ms: 9000')
      expect(yamlStr).toContain('alt_text: Hora mundo')
    })
  })

  describe('importLyricsfileAsNewSong e importLyricsfileAsTranslation', () => {
    it('importa archivo YAML como nueva canción principal', async () => {
      const newSongId = await importLyricsfileAsNewSong(sampleYaml)
      expect(newSongId).toBeDefined()

      const song = await fetchSongById(newSongId)
      expect(song.title).toBe('Canción YAML Test')
      expect(song.artist).toBe('Artista YAML')
      expect(song.lyrics_data.languages[0].isMain).toBe(true)
      expect(song.lyrics_data.languages[0].code).toBe('es')
    })

    it('importa archivo YAML como traducción secundaria a una canción existente', async () => {
      const songId = await saveSong({
        title: 'Canción Existente',
        artist: 'Artista Existente',
        lyrics_data: {
          languages: [{ code: 'ja', name: '日本語', isMain: true, lines: [] }]
        }
      })

      const transYaml = `
version: '1.0'
metadata:
  language: 'es'
lines:
  - text: 'Verso traducido'
    start_ms: 1000
    end_ms: 4000
`.trim()

      const translation = await importLyricsfileAsTranslation(songId, transYaml)
      expect(translation.code).toBe('es')
      expect(translation.isMain).toBe(false)

      const updated = await fetchSongById(songId)
      expect(updated.lyrics_data.languages.length).toBe(2)
      expect(updated.lyrics_data.languages[1].code).toBe('es')
    })
  })
})
