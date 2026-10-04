import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  extractYouTubeVideoId,
  extractYouTubePlaylistId,
  extractVideoIdsFromText,
  parseYouTubeVideoMeta,
  fetchYouTubeVideoMeta,
  fetchMultipleYouTubeVideosMeta,
  buildSongPackageFromYouTubeMeta,
  importYouTubeSongs,
  fetchYouTubePlaylistVideoIds
} from '../../src/services/youtubeImportService.js'
import * as mediaPlayer from '../../src/player/mediaPlayer.js'
import { getDB } from '../../src/services/db.js'

describe('services/youtubeImportService.js', () => {
  describe('extractYouTubeVideoId', () => {
    it('reconoce IDs de 11 caracteres y URLs de YouTube, YouTube Music y Shorts', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(extractYouTubeVideoId('https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=abc')).toBe('dQw4w9WgXcQ')
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })
  })

  describe('extractYouTubePlaylistId', () => {
    it('extrae el ID de playlist de URLs de YouTube y YouTube Music', () => {
      expect(extractYouTubePlaylistId('https://www.youtube.com/playlist?list=PLrEnWoR732-BHrPp_QLgkMnol8tYeTt45')).toBe('PLrEnWoR732-BHrPp_QLgkMnol8tYeTt45')
      expect(extractYouTubePlaylistId('https://music.youtube.com/playlist?list=PLrEnWoR732-BHrPp_QLgkMnol8tYeTt45')).toBe('PLrEnWoR732-BHrPp_QLgkMnol8tYeTt45')
      expect(extractYouTubePlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrEnWoR732-BHrPp_QLgkMnol8tYeTt45')).toBe('PLrEnWoR732-BHrPp_QLgkMnol8tYeTt45')
      expect(extractYouTubePlaylistId('https://music.youtube.com/watch?v=dQw4w9WgXcQ&list=RDAMVMdQw4w9WgXcQ')).toBe('RDAMVMdQw4w9WgXcQ')
      expect(extractYouTubePlaylistId('PLrEnWoR732-BHrPp_QLgkMnol8tYeTt45')).toBe('PLrEnWoR732-BHrPp_QLgkMnol8tYeTt45')
    })

    it('retorna null para enlaces sin parámetro list ni formato de playlist', () => {
      expect(extractYouTubePlaylistId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBeNull()
      expect(extractYouTubePlaylistId('')).toBeNull()
      expect(extractYouTubePlaylistId(null)).toBeNull()
    })
  })

  describe('extractVideoIdsFromText', () => {
    it('extrae múltiples IDs de videos desde texto multilinea o separado por comas evitando duplicados', () => {
      const text = `
        https://www.youtube.com/watch?v=dQw4w9WgXcQ
        https://music.youtube.com/watch?v=9bZkp7q19f0, https://youtu.be/3JZ_D3ELwOQ
        https://www.youtube.com/watch?v=dQw4w9WgXcQ
      `
      const ids = extractVideoIdsFromText(text)
      expect(ids).toEqual(['dQw4w9WgXcQ', '9bZkp7q19f0', '3JZ_D3ELwOQ'])
    })
  })

  describe('parseYouTubeVideoMeta', () => {
    it('separa artista y título cuando existe separador y remueve etiquetas de video', () => {
      const parsed1 = parseYouTubeVideoMeta(
        'Rick Astley - Never Gonna Give You Up (Official Video) (4K Remaster)',
        'Rick Astley'
      )
      expect(parsed1.artist).toBe('Rick Astley')
      expect(parsed1.title).toBe('Never Gonna Give You Up')

      const parsed2 = parseYouTubeVideoMeta(
        'Radiohead - Creep [Official Audio]',
        'Radiohead - Topic'
      )
      expect(parsed2.artist).toBe('Radiohead')
      expect(parsed2.title).toBe('Creep')
    })

    it('utiliza author_name limpio como artista si el título no contiene separador', () => {
      const parsed = parseYouTubeVideoMeta('Bohemian Rhapsody', 'Queen VEVO')
      expect(parsed.artist).toBe('Queen')
      expect(parsed.title).toBe('Bohemian Rhapsody')
    })
  })

  describe('fetchYouTubeVideoMeta', () => {
    it('obtiene y parsea metadatos desde el servicio oEmbed oficial sin API Key', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          title: 'Queen - Bohemian Rhapsody (Official Music Video)',
          author_name: 'Queen',
          thumbnail_url: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg'
        })
      })

      const meta = await fetchYouTubeVideoMeta('fJ9rUzIMcZQ')
      expect(meta.videoId).toBe('fJ9rUzIMcZQ')
      expect(meta.artist).toBe('Queen')
      expect(meta.title).toBe('Bohemian Rhapsody')
      expect(meta.thumbnail).toBe('https://i.ytimg.com/vi/fJ9rUzIMcZQ/hqdefault.jpg')
      expect(meta.videoUrl).toBe('https://www.youtube.com/watch?v=fJ9rUzIMcZQ')
    })

    it('lanza error si el servicio oEmbed responde con status no exitoso', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404
      })

      await expect(fetchYouTubeVideoMeta('noExisteId')).rejects.toThrow('No se pudo obtener información')
    })
  })

  describe('fetchMultipleYouTubeVideosMeta', () => {
    it('consulta múltiples videos en lote e informa el progreso', async () => {
      vi.spyOn(globalThis, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ title: 'Artist 1 - Song 1', author_name: 'Artist 1', thumbnail_url: 't1' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ title: 'Artist 2 - Song 2', author_name: 'Artist 2', thumbnail_url: 't2' })
        })

      const progressSpy = vi.fn()
      const results = await fetchMultipleYouTubeVideosMeta(['vid1', 'vid2'], {
        onProgress: progressSpy,
        batchSize: 2
      })

      expect(results.length).toBe(2)
      expect(results[0].title).toBe('Song 1')
      expect(results[1].title).toBe('Song 2')
      expect(progressSpy).toHaveBeenCalledWith(2, 2)
    })
  })

  describe('buildSongPackageFromYouTubeMeta', () => {
    it('construye paquete estándar de canción sin letras con el video oficial asociado', () => {
      const pkg = buildSongPackageFromYouTubeMeta({
        videoId: 'abc12345678',
        title: 'Mi Canción',
        artist: 'Mi Artista',
        thumbnail: 'https://example.com/thumb.jpg',
        videoUrl: 'https://www.youtube.com/watch?v=abc12345678'
      })

      expect(pkg.metadata.title).toBe('Mi Canción')
      expect(pkg.metadata.artist).toBe('Mi Artista')
      expect(pkg.metadata.source).toBe('youtube')
      expect(pkg.metadata.videos.length).toBe(1)
      expect(pkg.metadata.videos[0].url).toBe('https://www.youtube.com/watch?v=abc12345678')
      expect(pkg.basic.languages[0].isMain).toBe(true)
      expect(pkg.basic.languages[0].phrases).toEqual([])
    })
  })

  describe('fetchYouTubePlaylistVideoIds', () => {
    it('obtiene los IDs de una lista usando la API de YouTube', async () => {
      vi.spyOn(mediaPlayer, 'loadYouTubeApi').mockResolvedValueOnce({
        Player: class MockPlayer {
          constructor(id, options) {
            this.options = options
            setTimeout(() => {
              if (options.events?.onReady) {
                options.events.onReady({ target: this })
              }
            }, 10)
          }
          cuePlaylist() {}
          getPlaylist() {
            return ['vidA', 'vidB', 'vidC']
          }
          destroy() {}
        }
      })

      const ids = await fetchYouTubePlaylistVideoIds('PLrEnWoR732-BHrPp_QLgkMnol8tYeTt45')
      expect(ids).toEqual(['vidA', 'vidB', 'vidC'])
    })

    it('maneja el error 150/101 e incluye el mensaje orientador de restricción', async () => {
      vi.spyOn(mediaPlayer, 'loadYouTubeApi').mockResolvedValueOnce({
        Player: class MockPlayerError {
          constructor(id, options) {
            this.options = options
            setTimeout(() => {
              if (options.events?.onError) {
                options.events.onError({ data: 150 })
              }
            }, 10)
          }
          cuePlaylist() {}
          getPlaylist() {
            return null
          }
          nextVideo() {}
          destroy() {}
        }
      })

      await expect(
        fetchYouTubePlaylistVideoIds('PLxHldZ2be2PiKGlzsoTA_EcbV_M9aMvXR', { timeoutMs: 3000 })
      ).rejects.toThrow(/código 150.*restringen la inserción/)
    })
  })

  describe('importYouTubeSongs', () => {
    it('guarda canciones en IndexedDB sin letras y opcionalmente las asigna a una biblioteca', async () => {
      const metas = [
        {
          videoId: 'yt-song-1',
          title: 'Tema Uno',
          artist: 'Banda Uno',
          videoUrl: 'https://www.youtube.com/watch?v=yt-song-1'
        },
        {
          videoId: 'yt-song-2',
          title: 'Tema Dos',
          artist: 'Banda Dos',
          videoUrl: 'https://www.youtube.com/watch?v=yt-song-2'
        }
      ]

      const saved = await importYouTubeSongs(metas, { libraryName: 'Rock Clásico' })
      expect(saved.length).toBe(2)
      expect(saved[0].title).toBe('Tema Uno')
      expect(saved[1].title).toBe('Tema Dos')

      const db = await getDB()
      const allSongs = await db.getAll('songs')
      const s1 = allSongs.find(s => s.title === 'Tema Uno')
      const s2 = allSongs.find(s => s.title === 'Tema Dos')
      expect(s1).toBeDefined()
      expect(s2).toBeDefined()
      expect(s1.lyrics_data.languages[0].phrases).toEqual([])

      // Verificar que se haya creado la biblioteca y asignado
      const allLibs = await db.getAll('libraries')
      const lib = allLibs.find(l => l.name === 'Rock Clásico')
      expect(lib).toBeDefined()

      const rels = await db.getAllFromIndex('song_libraries', 'library_id', lib.id)
      expect(rels.length).toBe(2)
    })
  })
})
