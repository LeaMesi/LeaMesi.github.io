import { describe, it, expect } from 'vitest'
import { validateSongPackage, normalizeVideos, normalizeSongPackage } from '../../src/services/schemaValidator.js'

describe('services/schemaValidator.js', () => {
  describe('validateSongPackage', () => {
    it('lanza error si el argumento no es un objeto válido', () => {
      expect(() => validateSongPackage(null)).toThrow('El archivo proporcionado no es un objeto JSON válido.')
      expect(() => validateSongPackage('string')).toThrow('El archivo proporcionado no es un objeto JSON válido.')
    })

    it('lanza error si falta el título', () => {
      expect(() => validateSongPackage({})).toThrow('El paquete debe contener un título válido en metadata.title.')
      expect(() => validateSongPackage({ metadata: { title: '  ' } })).toThrow('El paquete debe contener un título válido en metadata.title.')
    })

    it('valida y normaliza un paquete en formato song-package.json', () => {
      const pkg = {
        version: '1.1.0',
        metadata: {
          title: 'Canción de Prueba',
          artist: 'Artista Test',
          genres: ['Rock'],
          tags: ['karaoke']
        },
        basic: {
          languages: [
            {
              code: 'es',
              name: 'Español',
              isMain: true,
              lines: [
                {
                  startTime: 1,
                  endTime: 4,
                  text: 'Hola mundo',
                  altText: 'Hora mundo',
                  syllables: [
                    { text: 'Ho', altText: 'Ho', startTime: 1, duration: 0.5 },
                    { text: 'la ', altText: 'ra ', startTime: 1.5, duration: 0.5 }
                  ]
                }
              ]
            }
          ]
        },
        advanced: { enabled: false, effects: [] }
      }

      const result = validateSongPackage(pkg)

      // Verifica propiedades de paquete
      expect(result.metadata.title).toBe('Canción de Prueba')
      expect(result.metadata.artist).toBe('Artista Test')
      expect(result.metadata.genres).toEqual(['Rock'])
      expect(result.metadata.tags).toEqual(['karaoke'])
      expect(result.basic.languages.length).toBe(1)
      expect(result.basic.languages[0].lines[0].altText).toBe('Hora mundo')
      expect(result.basic.languages[0].lines[0].syllables[0].altText).toBe('Ho')

      // Verifica propiedades de entidad directa
      expect(result.title).toBe('Canción de Prueba')
      expect(result.artist).toBe('Artista Test')
      expect(result.lyrics_data).toBe(result.basic)
      expect(result.visuals_data).toBe(result.advanced)
    })

    it('acepta y normaliza una entidad directa de canción (plana)', () => {
      const flatSong = {
        id: 123,
        title: 'Entidad Directa',
        artist: 'Artista Flat',
        genres: ['Pop'],
        tags: ['demo'],
        audio_path: 'local.mp3',
        videos: [{ id: 'v1', name: 'Oficial', url: 'https://youtu.be/12345678901', offset: 1.2 }],
        lyrics_data: {
          languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
        }
      }

      const result = validateSongPackage(flatSong)

      expect(result.id).toBe(123)
      expect(result.title).toBe('Entidad Directa')
      expect(result.artist).toBe('Artista Flat')
      expect(result.metadata.title).toBe('Entidad Directa')
      expect(result.metadata.audioPath).toBe('local.mp3')
      expect(result.videos.length).toBe(1)
      expect(result.videos[0].offset).toBe(1.2)
    })

    it('migra retroactivamente paquetes antiguos mono-idioma con lines en basic', () => {
      const oldPkg = {
        title: 'Canción Antigua',
        basic: {
          lines: [
            { text: 'Verso antiguo', startTime: 0, endTime: 3 }
          ]
        }
      }

      const result = validateSongPackage(oldPkg)

      expect(result.basic.languages.length).toBe(1)
      expect(result.basic.languages[0].isMain).toBe(true)
      expect(result.basic.languages[0].code).toBe('und')
      expect(result.basic.languages[0].lines[0].text).toBe('Verso antiguo')
    })
  })

  describe('normalizeVideos', () => {
    it('preserva array de videos si ya está presente', () => {
      const v = [{ id: 'v1', name: 'Video 1', url: 'https://youtube.com/watch?v=11111111111', offset: 0 }]
      const normalized = normalizeVideos({ videos: v })
      expect(normalized.length).toBe(1)
      expect(normalized[0].name).toBe('Video 1')
    })

    it('construye array de videos a partir de youtubeUrlFull e instrumental', () => {
      const metadata = {
        youtubeUrlFull: 'https://youtube.com/watch?v=11111111111',
        youtubeUrlInstrumental: 'https://youtube.com/watch?v=22222222222'
      }
      const normalized = normalizeVideos(metadata)
      expect(normalized.length).toBe(2)
      expect(normalized[0].name).toBe('Video Oficial')
      expect(normalized[1].name).toBe('Versión Karaoke / Instrumental')
    })
  })
})
