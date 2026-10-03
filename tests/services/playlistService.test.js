import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createPlaylistService,
  normalizePlaylistSong,
  savePlaylistAsLibrary,
  loadLibraryIntoPlaylist
} from '../../src/services/playlistService.js'

describe('services/playlistService.js', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  it('normaliza adecuadamente una canción para la playlist', () => {
    const raw = {
      id: 10,
      title: 'Canción Demo',
      artist: 'Artista Genial',
      audio_path: 'demo.mp3',
      videos: [{ id: 'v1', name: 'Oficial' }]
    }
    const norm = normalizePlaylistSong(raw)
    expect(norm).toEqual({
      id: 10,
      title: 'Canción Demo',
      artist: 'Artista Genial',
      audio_path: 'demo.mp3',
      videos: [{ id: 'v1', name: 'Oficial' }]
    })

    expect(normalizePlaylistSong(null)).toBeNull()
    expect(normalizePlaylistSong({})).toBeNull()
  })

  it('gestiona adición de canciones y previene duplicados por ID', () => {
    const playlist = createPlaylistService({ storageKey: 'test_pl_1' })
    expect(playlist.getState().count).toBe(0)
    expect(playlist.getCurrentIndex()).toBe(-1)

    const song1 = { id: 1, title: 'Tema 1', artist: 'Artista 1' }
    const song2 = { id: 2, title: 'Tema 2', artist: 'Artista 2' }

    expect(playlist.addSong(song1)).toBe(true)
    expect(playlist.getState().count).toBe(1)
    expect(playlist.getCurrentIndex()).toBe(0)
    expect(playlist.getCurrentSong().id).toBe(1)

    // Prevenir duplicado
    expect(playlist.addSong(song1)).toBe(false)
    expect(playlist.getState().count).toBe(1)

    // Añadir segunda
    expect(playlist.addSong(song2)).toBe(true)
    expect(playlist.getState().count).toBe(2)
  })

  it('añade múltiples canciones con addSongs ignorando existentes', () => {
    const playlist = createPlaylistService({ storageKey: 'test_pl_2' })
    playlist.addSong({ id: 1, title: 'T1' })

    const batch = [
      { id: 1, title: 'T1 repetido' },
      { id: 2, title: 'T2' },
      { id: 3, title: 'T3' }
    ]

    const added = playlist.addSongs(batch)
    expect(added).toBe(2)
    expect(playlist.getState().count).toBe(3)
  })

  it('permite quitar canciones y recalcula currentIndex adecuadamente', () => {
    const playlist = createPlaylistService({ storageKey: 'test_pl_3' })
    playlist.addSongs([
      { id: 1, title: 'T1' },
      { id: 2, title: 'T2' },
      { id: 3, title: 'T3' }
    ])

    // Actualmente currentIndex es 0 (T1)
    playlist.setCurrentIndex(1) // T2
    expect(playlist.getCurrentSong().id).toBe(2)

    // Quitar la primera canción (índice 0, antes de la actual)
    playlist.removeSongByIndex(0)
    expect(playlist.getState().count).toBe(2)
    // T2 ahora está en el índice 0 y currentIndex se decrementó a 0
    expect(playlist.getCurrentIndex()).toBe(0)
    expect(playlist.getCurrentSong().id).toBe(2)

    // Quitar por ID
    playlist.removeSongById(3)
    expect(playlist.getState().count).toBe(1)
  })

  it('permite mover canciones preservando el puntero a la canción que suena', () => {
    const playlist = createPlaylistService({ storageKey: 'test_pl_4' })
    playlist.addSongs([
      { id: 10, title: 'A' },
      { id: 20, title: 'B' },
      { id: 30, title: 'C' }
    ])

    playlist.setCurrentIndex(1) // Canción 'B' (id 20) está sonando
    expect(playlist.getCurrentSong().id).toBe(20)

    // Mover 'B' de índice 1 a índice 0 (arriba)
    playlist.moveUp(1)
    const songs = playlist.getSongs()
    expect(songs[0].id).toBe(20)
    expect(songs[1].id).toBe(10)
    // currentIndex debe haberse actualizado a 0 para seguir apuntando a 'B'
    expect(playlist.getCurrentIndex()).toBe(0)
    expect(playlist.getCurrentSong().id).toBe(20)

    // Mover 'B' de índice 0 a índice 2 (bajar dos veces)
    playlist.moveSong(0, 2)
    expect(playlist.getSongs()[2].id).toBe(20)
    expect(playlist.getCurrentIndex()).toBe(2)
    expect(playlist.getCurrentSong().id).toBe(20)
  })

  it('baraja canciones con shuffle manteniendo la canción activa', () => {
    const playlist = createPlaylistService({ storageKey: 'test_pl_5' })
    playlist.addSongs([
      { id: 1, title: '1' },
      { id: 2, title: '2' },
      { id: 3, title: '3' },
      { id: 4, title: '4' },
      { id: 5, title: '5' }
    ])

    playlist.setCurrentIndex(2) // Canción con id 3
    expect(playlist.getCurrentSong().id).toBe(3)

    playlist.shuffle()
    expect(playlist.getState().count).toBe(5)
    // Tras shuffle, la canción actual sigue siendo la de id 3
    expect(playlist.getCurrentSong().id).toBe(3)
  })

  it('avanza y retrocede canciones con next y prev', () => {
    const playlist = createPlaylistService({ storageKey: 'test_pl_6' })
    playlist.addSongs([
      { id: 10, title: 'T10' },
      { id: 20, title: 'T20' }
    ])

    expect(playlist.hasPrev()).toBe(false)
    expect(playlist.hasNext()).toBe(true)

    const next = playlist.next()
    expect(next.id).toBe(20)
    expect(playlist.hasPrev()).toBe(true)
    expect(playlist.hasNext()).toBe(false)

    // Intentar pasar del final
    expect(playlist.next()).toBeNull()

    const prev = playlist.prev()
    expect(prev.id).toBe(10)
  })

  it('persiste y recupera datos en localStorage', () => {
    const storageKey = 'saranga_test_persisted'
    const pl1 = createPlaylistService({ storageKey })
    pl1.addSongs([
      { id: 100, title: 'Persistente 1' },
      { id: 200, title: 'Persistente 2' }
    ])
    pl1.setCurrentIndex(1)

    // Crear otra instancia con la misma storageKey
    const pl2 = createPlaylistService({ storageKey })
    expect(pl2.getState().count).toBe(2)
    expect(pl2.getCurrentIndex()).toBe(1)
    expect(pl2.getCurrentSong().id).toBe(200)
  })

  it('permite guardar la playlist como una nueva biblioteca', async () => {
    const mockCreatedLib = { id: 77, name: 'Mi Lista Favorita' }
    const mockLibService = {
      createLibrary: vi.fn(async (name) => ({ id: 77, name })),
      addSongToLibrary: vi.fn(async () => true)
    }

    const playlistSongs = [
      { id: 1, title: 'Canción 1' },
      { id: 2, title: 'Canción 2' }
    ]

    const result = await savePlaylistAsLibrary('Mi Lista Favorita', playlistSongs, {
      libraryService: mockLibService
    })

    expect(mockLibService.createLibrary).toHaveBeenCalledWith('Mi Lista Favorita')
    expect(mockLibService.addSongToLibrary).toHaveBeenCalledTimes(2)
    expect(mockLibService.addSongToLibrary).toHaveBeenCalledWith(1, 77)
    expect(mockLibService.addSongToLibrary).toHaveBeenCalledWith(2, 77)
    expect(result.songCount).toBe(2)
  })

  it('lanza error al intentar guardar biblioteca con nombre vacío o lista vacía', async () => {
    await expect(savePlaylistAsLibrary('', [{ id: 1 }])).rejects.toThrow('no puede estar vacío')
    await expect(savePlaylistAsLibrary('Mi Lista', [])).rejects.toThrow('está vacía')
  })

  it('permite cargar una biblioteca completa en la playlist', async () => {
    const mockSongs = [
      { id: 1, title: 'A' },
      { id: 2, title: 'B' },
      { id: 3, title: 'C' }
    ]

    const mockLibService = {
      getLibrarySongs: vi.fn(async () => mockSongs)
    }

    const playlist = createPlaylistService({ storageKey: 'test_load_lib' })
    const loadedCount = await loadLibraryIntoPlaylist(5, {
      shuffle: false,
      playlistService: playlist,
      libraryService: mockLibService
    })

    expect(loadedCount).toBe(3)
    expect(playlist.getState().count).toBe(3)
    expect(playlist.getSongs()[0].id).toBe(1)
  })

  it('añade automáticamente una canción que no está en la playlist al llamar a setCurrentSong', () => {
    const playlist = createPlaylistService({ storageKey: 'test_auto_add_1' })
    const listener = vi.fn()
    playlist.subscribe(listener)
    listener.mockClear()

    // 1. Playlist vacía: se añade la primera canción
    const song1 = { id: 101, title: 'Canción Inicial', artist: 'Artista 1' }
    const res1 = playlist.setCurrentSong(song1)

    expect(res1).not.toBeNull()
    expect(res1.id).toBe(101)
    expect(playlist.getState().count).toBe(1)
    expect(playlist.getCurrentIndex()).toBe(0)
    expect(playlist.getCurrentSong().id).toBe(101)
    expect(playlist.hasPrev()).toBe(false)
    expect(playlist.hasNext()).toBe(false)
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({
      count: 1,
      currentIndex: 0,
      hasPrev: false,
      hasNext: false
    }))

    // 2. Entrar en una segunda canción que no estaba en la playlist: se auto-añade al final y se activa
    listener.mockClear()
    const song2 = { id: 102, title: 'Segunda Canción', artist: 'Artista 2' }
    const res2 = playlist.setCurrentSong(song2)

    expect(res2.id).toBe(102)
    expect(playlist.getState().count).toBe(2)
    expect(playlist.getCurrentIndex()).toBe(1)
    expect(playlist.getCurrentSong().id).toBe(102)
    expect(playlist.hasPrev()).toBe(true) // La primera ahora es anterior
    expect(playlist.hasNext()).toBe(false)
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({
      count: 2,
      currentIndex: 1,
      hasPrev: true,
      hasNext: false
    }))

    // 3. Volver a entrar en la primera canción (ya existe en la lista): no se duplica, actualiza currentIndex
    listener.mockClear()
    const resAgain = playlist.setCurrentSong(song1)

    expect(resAgain.id).toBe(101)
    expect(playlist.getState().count).toBe(2) // No se duplica
    expect(playlist.getCurrentIndex()).toBe(0) // Apunta a su posición original
    expect(playlist.getCurrentSong().id).toBe(101)
    expect(playlist.hasPrev()).toBe(false)
    expect(playlist.hasNext()).toBe(true) // La segunda es siguiente
    expect(listener).toHaveBeenLastCalledWith(expect.objectContaining({
      count: 2,
      currentIndex: 0,
      hasPrev: false,
      hasNext: true
    }))
  })

  it('soporta setCurrentSongById añadiendo automáticamente la canción si no existe y se provee el objeto song', () => {
    const playlist = createPlaylistService({ storageKey: 'test_auto_add_by_id' })
    const song = { id: 50, title: 'Tema 50', artist: 'Artista 50' }

    // Sin objeto song, retorna false si no existe
    expect(playlist.setCurrentSongById(50)).toBe(false)
    expect(playlist.getState().count).toBe(0)

    // Con objeto song, auto-añade y activa
    expect(playlist.setCurrentSongById(50, song)).toBe(true)
    expect(playlist.getState().count).toBe(1)
    expect(playlist.getCurrentIndex()).toBe(0)
    expect(playlist.getCurrentSong().id).toBe(50)

    // Si ya existe, setCurrentSongById funciona sólo con el ID
    expect(playlist.setCurrentSongById(50)).toBe(true)
  })
})

