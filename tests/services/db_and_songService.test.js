import { describe, it, expect, beforeEach } from 'vitest'
import { getDB, seedDefaultSongs } from '../../src/services/db.js'
import {
  saveSong,
  fetchSongById,
  listSongs,
  deleteSong,
  addTranslationToSong,
  updateSongVideos
} from '../../src/services/songService.js'

describe('services/db.js & songService.js', () => {
  beforeEach(async () => {
    // getDB() inicializa SarangaDB en memoria mediante fake-indexeddb
    await getDB()
  })

  it('inicializa la base de datos y siembra las canciones de demostración (Still Alive e Idol)', async () => {
    const songs = await listSongs()
    expect(songs.length).toBeGreaterThanOrEqual(2)

    const titles = songs.map(s => s.title)
    expect(titles).toContain('Still Alive')
    expect(titles.some(t => t.includes('Idol'))).toBe(true)
  })

  it('no vuelve a sembrar canciones eliminadas si el usuario las borra', async () => {
    const songsBefore = await listSongs()
    const stillAlive = songsBefore.find(s => s.title === 'Still Alive')
    expect(stillAlive).toBeDefined()

    await deleteSong(stillAlive.id)
    const songsAfter = await listSongs()
    expect(songsAfter.some(s => s.title === 'Still Alive')).toBe(false)

    // Simular que el usuario recarga la app y se vuelve a evaluar el sembrado
    await seedDefaultSongs()
    const songsAfterReload = await listSongs()
    expect(songsAfterReload.some(s => s.title === 'Still Alive')).toBe(false)
  })

  it('guarda una canción nueva con artista, tags y géneros', async () => {
    const newSongData = {
      title: 'Canción Nueva Test',
      artist: 'Artista Test DB',
      genres: ['Rock', 'Indie'],
      tags: ['favorito', '2026'],
      audio_path: '',
      videos: [{ id: 'v-test', name: 'Oficial', url: 'https://youtu.be/12345678901', offset: 0 }],
      lyrics_data: {
        timing: { bpm: 120 },
        languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
      },
      visuals_data: { enabled: false, effects: [] }
    }

    const songId = await saveSong(newSongData)
    expect(songId).toBeDefined()

    const fetched = await fetchSongById(songId)
    expect(fetched).not.toBeNull()
    expect(fetched.title).toBe('Canción Nueva Test')
    expect(fetched.artist).toBe('Artista Test DB')
    expect(fetched.genres).toEqual(expect.arrayContaining(['Rock', 'Indie']))
    expect(fetched.tags).toEqual(expect.arrayContaining(['favorito', '2026']))
    expect(fetched.videos.length).toBe(1)
  })

  it('actualiza una canción existente modificando artista y géneros', async () => {
    const songId = await saveSong({
      title: 'Canción a Modificar',
      artist: 'Artista Original',
      genres: ['Pop'],
      tags: ['tag1']
    })

    await saveSong({
      id: songId,
      title: 'Canción Modificada',
      artist: 'Artista Modificado',
      genres: ['Electrónica', 'Dance'],
      tags: ['tag2']
    })

    const updated = await fetchSongById(songId)
    expect(updated.title).toBe('Canción Modificada')
    expect(updated.artist).toBe('Artista Modificado')
    expect(updated.genres).toEqual(expect.arrayContaining(['Electrónica', 'Dance']))
    expect(updated.genres).not.toContain('Pop')
    expect(updated.tags).toEqual(['tag2'])
  })

  it('agrega una pista de traducción secundaria a una canción existente', async () => {
    const songId = await saveSong({
      title: 'Canción con Traducción',
      artist: 'Artista Políglota',
      lyrics_data: {
        languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
      }
    })

    await addTranslationToSong(songId, {
      code: 'en',
      name: 'English',
      plain: 'Hello world',
      lines: [{ startTime: 0, endTime: 3, text: 'Hello world', syllables: [] }]
    })

    const updated = await fetchSongById(songId)
    const languages = updated.lyrics_data.languages

    expect(languages.length).toBe(2)
    const translation = languages.find(l => l.code === 'en')
    expect(translation).toBeDefined()
    expect(translation.isMain).toBe(false)
    expect(translation.plain).toBe('Hello world')
  })

  it('actualiza la lista de videos de una canción con offsets', async () => {
    const songId = await saveSong({
      title: 'Canción con Videos',
      artist: 'Artista Video'
    })

    const newVideos = [
      { id: 'v1', name: 'Video 1', url: 'https://youtu.be/11111111111', offset: 1.5 },
      { id: 'v2', name: 'Video 2', url: 'https://youtu.be/22222222222', offset: -0.5 }
    ]

    await updateSongVideos(songId, newVideos)

    const updated = await fetchSongById(songId)
    expect(updated.videos.length).toBe(2)
    expect(updated.videos[0].offset).toBe(1.5)
    expect(updated.videos[1].offset).toBe(-0.5)
  })

  it('elimina una canción y sus relaciones en song_tags y song_genres', async () => {
    const songId = await saveSong({
      title: 'Canción a Eliminar',
      artist: 'Artista Fugaz',
      genres: ['Jazz'],
      tags: ['eliminar']
    })

    expect(await fetchSongById(songId)).not.toBeNull()

    const deleted = await deleteSong(songId)
    expect(deleted).toBe(true)

    expect(await fetchSongById(songId)).toBeNull()
  })
})
