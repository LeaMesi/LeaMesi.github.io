import { describe, it, expect, beforeEach } from 'vitest'
import { getDB } from '../../src/services/db.js'
import { saveSong, fetchSongById, deleteSong } from '../../src/services/songService.js'
import {
  getNextUniqueLibraryName,
  createLibrary,
  listLibraries,
  getLibraryById,
  getLibraryByName,
  renameLibrary,
  deleteLibrary,
  getSongLibraries,
  getLibrarySongs,
  addSongToLibrary,
  removeSongFromLibrary,
  setSongLibraries
} from '../../src/services/libraryService.js'

describe('services/libraryService.js', () => {
  beforeEach(async () => {
    localStorage.clear()
    await getDB()
  })

  describe('getNextUniqueLibraryName', () => {
    it('devuelve el nombre base si no existe en la lista', () => {
      const name = getNextUniqueLibraryName('Rock', ['Pop', 'Jazz'])
      expect(name).toBe('Rock')
    })

    it('devuelve "Nombre (2)" si ya existe una con ese nombre', () => {
      const name = getNextUniqueLibraryName('Rock', ['Rock', 'Pop'])
      expect(name).toBe('Rock (2)')
    })

    it('devuelve "Nombre (3)" si ya existen "Nombre" y "Nombre (2)"', () => {
      const name = getNextUniqueLibraryName('Rock', ['Rock', 'Rock (2)', 'Pop'])
      expect(name).toBe('Rock (3)')
    })

    it('es insensible a mayúsculas y espacios en la búsqueda', () => {
      const name = getNextUniqueLibraryName('rock', ['  Rock  '])
      expect(name).toBe('rock (2)')
    })

    it('limpia sufijos existentes antes de recalcular', () => {
      const name = getNextUniqueLibraryName('Rock (2)', ['Rock', 'Rock (2)'])
      expect(name).toBe('Rock (3)')
    })
  })

  describe('CRUD de bibliotecas', () => {
    it('crea una biblioteca válida y la lista con songCount en 0', async () => {
      const lib = await createLibrary('Favoritos 2026', 'Mis canciones preferidas')
      expect(lib.id).toBeDefined()
      expect(lib.name).toBe('Favoritos 2026')
      expect(lib.description).toBe('Mis canciones preferidas')
      expect(lib.songCount).toBe(0)

      const list = await listLibraries()
      const found = list.find(l => l.id === lib.id)
      expect(found).toBeDefined()
      expect(found.name).toBe('Favoritos 2026')
    })

    it('falla si el nombre está vacío o sólo contiene espacios', async () => {
      await expect(createLibrary('')).rejects.toThrow('no puede estar vacío')
      await expect(createLibrary('   ')).rejects.toThrow('no puede estar vacío')
    })

    it('busca una biblioteca por ID y por nombre insensible a mayúsculas', async () => {
      const created = await createLibrary('Anime Songs')
      const byId = await getLibraryById(created.id)
      expect(byId).not.toBeNull()
      expect(byId.name).toBe('Anime Songs')

      const byName = await getLibraryByName('anime songs')
      expect(byName).not.toBeNull()
      expect(byName.id).toBe(created.id)

      const notFound = await getLibraryByName('Inexistente')
      expect(notFound).toBeNull()
    })

    it('renombra una biblioteca existente', async () => {
      const created = await createLibrary('Nombre Viejo')
      const renamed = await renameLibrary(created.id, 'Nombre Nuevo', 'Nueva descripción')
      expect(renamed.name).toBe('Nombre Nuevo')
      expect(renamed.description).toBe('Nueva descripción')

      const fetched = await getLibraryById(created.id)
      expect(fetched.name).toBe('Nombre Nuevo')
    })

    it('elimina una biblioteca sin borrar las canciones asociadas', async () => {
      const songId = await saveSong({
        title: 'Canción en Biblioteca',
        artist: 'Artista Test'
      })
      const lib = await createLibrary('Biblioteca Temporal')
      await addSongToLibrary(songId, lib.id)

      const songsInLib = await getLibrarySongs(lib.id)
      expect(songsInLib.length).toBe(1)

      // Eliminar biblioteca
      const deleted = await deleteLibrary(lib.id)
      expect(deleted).toBe(true)
      expect(await getLibraryById(lib.id)).toBeNull()

      // La canción debe seguir existiendo intacta
      const songStillExists = await fetchSongById(songId)
      expect(songStillExists).not.toBeNull()
      expect(songStillExists.title).toBe('Canción en Biblioteca')
    })
  })

  describe('Relación Muchos a Muchos (Canciones y Bibliotecas)', () => {
    it('permite que una canción esté en más de una biblioteca', async () => {
      const songId = await saveSong({
        title: 'Bohemian Rhapsody',
        artist: 'Queen'
      })

      const libRock = await createLibrary('Rock')
      const libFavoritos = await createLibrary('Favoritos')
      const libEpicas = await createLibrary('Épicas')

      await addSongToLibrary(songId, libRock.id)
      await addSongToLibrary(songId, libFavoritos.id)
      await addSongToLibrary(songId, libEpicas.id)

      const songLibs = await getSongLibraries(songId)
      expect(songLibs.length).toBe(3)
      const libNames = songLibs.map(l => l.name)
      expect(libNames).toContain('Rock')
      expect(libNames).toContain('Favoritos')
      expect(libNames).toContain('Épicas')

      // Verificar que getLibrarySongs de cada una devuelva la canción
      const rockSongs = await getLibrarySongs(libRock.id)
      expect(rockSongs.some(s => s.id === songId)).toBe(true)

      const favSongs = await getLibrarySongs(libFavoritos.id)
      expect(favSongs.some(s => s.id === songId)).toBe(true)
    })

    it('evita relaciones duplicadas al añadir la misma canción a la misma biblioteca', async () => {
      const songId = await saveSong({ title: 'Song Repetida', artist: 'Artista' })
      const lib = await createLibrary('Biblioteca Unica')

      const addedFirst = await addSongToLibrary(songId, lib.id)
      expect(addedFirst).toBe(true)

      const addedSecond = await addSongToLibrary(songId, lib.id)
      expect(addedSecond).toBe(false)

      const songLibs = await getSongLibraries(songId)
      expect(songLibs.length).toBe(1)
    })

    it('remueve una canción de una biblioteca específica', async () => {
      const songId = await saveSong({ title: 'Remover Test', artist: 'Artista' })
      const lib1 = await createLibrary('Lib A')
      const lib2 = await createLibrary('Lib B')

      await addSongToLibrary(songId, lib1.id)
      await addSongToLibrary(songId, lib2.id)

      await removeSongFromLibrary(songId, lib1.id)

      const songLibs = await getSongLibraries(songId)
      expect(songLibs.length).toBe(1)
      expect(songLibs[0].name).toBe('Lib B')
    })

    it('setSongLibraries actualiza de forma atómica todas las bibliotecas de una canción', async () => {
      const songId = await saveSong({ title: 'Canción Multi Set', artist: 'Artista' })
      const lib1 = await createLibrary('Lib 1')
      const lib2 = await createLibrary('Lib 2')
      const lib3 = await createLibrary('Lib 3')

      await setSongLibraries(songId, [lib1.id, lib2.id])
      let songLibs = await getSongLibraries(songId)
      expect(songLibs.map(l => l.id)).toEqual(expect.arrayContaining([lib1.id, lib2.id]))
      expect(songLibs.map(l => l.id)).not.toContain(lib3.id)

      // Reemplazar con solo lib3
      await setSongLibraries(songId, [lib3.id])
      songLibs = await getSongLibraries(songId)
      expect(songLibs.length).toBe(1)
      expect(songLibs[0].id).toBe(lib3.id)
    })

    it('al eliminar una canción con deleteSong, limpia sus relaciones en song_libraries', async () => {
      const songId = await saveSong({ title: 'Canción a Borrar Definitiva', artist: 'Artista' })
      const lib = await createLibrary('Lib Cleanup Test')
      await addSongToLibrary(songId, lib.id)

      let libSongs = await getLibrarySongs(lib.id)
      expect(libSongs.length).toBe(1)

      await deleteSong(songId)

      libSongs = await getLibrarySongs(lib.id)
      expect(libSongs.length).toBe(0)
    })
  })
})
