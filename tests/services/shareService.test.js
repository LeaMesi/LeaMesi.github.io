import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getDB } from '../../src/services/db.js'
import { saveSong, fetchSongById } from '../../src/services/songService.js'
import {
  exportSongPackage,
  importSongPackage,
  exportLibraryBackup,
  importLibraryBackup,
  exportLibraryPackage,
  importLibraryPackage
} from '../../src/services/shareService.js'
import {
  createLibrary,
  getLibraryById,
  getLibraryByName,
  getLibrarySongs,
  addSongToLibrary
} from '../../src/services/libraryService.js'

describe('services/shareService.js', () => {
  beforeEach(async () => {
    await getDB()
  })

  it('exporta una canción como paquete song-package.json estructurado', async () => {
    const songId = await saveSong({
      title: 'Canción Exportable',
      artist: 'Artista Share',
      genres: ['Pop'],
      tags: ['export'],
      videos: [{ id: 'v1', name: 'Oficial', url: 'https://youtu.be/12345678901', offset: 0 }]
    })

    const pkg = await exportSongPackage(songId)

    expect(pkg.version).toBe('1.1.0')
    expect(pkg.metadata.title).toBe('Canción Exportable')
    expect(pkg.metadata.artist).toBe('Artista Share')
    expect(pkg.metadata.videos.length).toBe(1)
    expect(pkg.basic).toBeDefined()
    expect(pkg.advanced).toBeDefined()
  })

  it('importa un paquete de canción JSON y lo guarda en IndexedDB', async () => {
    const rawPackage = {
      version: '1.1.0',
      metadata: {
        title: 'Canción Importada JSON',
        artist: 'Artista Importado',
        genres: ['Rock'],
        tags: ['importado'],
        audioPath: '',
        videos: [{ id: 'v1', name: 'Oficial', url: 'https://youtu.be/abcdefghijk', offset: 0 }]
      },
      basic: {
        languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
      },
      advanced: { enabled: false, effects: [] }
    }

    const importedId = await importSongPackage(JSON.stringify(rawPackage))
    expect(importedId).toBeDefined()

    const song = await fetchSongById(importedId)
    expect(song.title).toBe('Canción Importada JSON')
    expect(song.artist).toBe('Artista Importado')
    expect(song.genres).toContain('Rock')
  })

  it('exporta e importa un respaldo completo de la biblioteca local', async () => {
    // Exportar
    await exportLibraryBackup()

    // Importar un archivo de respaldo con 2 canciones
    const backupData = {
      version: '1.1.0',
      type: 'saranga-library-backup',
      exportedAt: new Date().toISOString(),
      songs: [
        {
          title: 'Canción Respaldo 1',
          artist: 'Artista Backup',
          genres: ['Jazz'],
          tags: ['backup'],
          lyrics_data: { languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }] }
        },
        {
          title: 'Canción Respaldo 2',
          artist: 'Artista Backup 2',
          genres: ['Blues'],
          tags: ['backup'],
          lyrics_data: { languages: [{ code: 'en', name: 'English', isMain: true, lines: [] }] }
        }
      ]
    }

    const importedIds = await importLibraryBackup(JSON.stringify(backupData))
    expect(importedIds.length).toBe(2)

    const song1 = await fetchSongById(importedIds[0])
    expect(song1.title).toBe('Canción Respaldo 1')

    const song2 = await fetchSongById(importedIds[1])
    expect(song2.title).toBe('Canción Respaldo 2')
  })

  it('exporta una biblioteca con sus canciones en un paquete estructurado', async () => {
    const songId = await saveSong({
      title: 'Canción en Lib Export',
      artist: 'Artista Lib Export'
    })
    const lib = await createLibrary('Favoritos Export')
    await addSongToLibrary(songId, lib.id)

    const pkg = await exportLibraryPackage(lib.id)
    expect(pkg.version).toBe('1.1.0')
    expect(pkg.type).toBe('saranga-library-package')
    expect(pkg.library.name).toBe('Favoritos Export')
    expect(pkg.songs.length).toBe(1)
    expect(pkg.songs[0].title).toBe('Canción en Lib Export')
  })

  it('importa una biblioteca creando la biblioteca automáticamente si no existe', async () => {
    const pkg = {
      version: '1.1.0',
      type: 'saranga-library-package',
      library: { name: 'Biblioteca Inexistente Auto' },
      songs: [
        {
          title: 'Canción Auto 1',
          artist: 'Artista Auto',
          genres: ['Rock'],
          tags: [],
          lyrics_data: { languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }] }
        }
      ]
    }

    const res = await importLibraryPackage(JSON.stringify(pkg))
    expect(res).not.toBeNull()
    expect(res.libraryName).toBe('Biblioteca Inexistente Auto')
    expect(res.songCount).toBe(1)

    const createdLib = await getLibraryByName('Biblioteca Inexistente Auto')
    expect(createdLib).not.toBeNull()

    const songsInLib = await getLibrarySongs(createdLib.id)
    expect(songsInLib.length).toBe(1)
    expect(songsInLib[0].title).toBe('Canción Auto 1')
  })

  it('al importar una biblioteca con nombre existente, combina canciones si el usuario elige combinar', async () => {
    const lib = await createLibrary('Biblioteca Conflicto')
    const existingSongId = await saveSong({ title: 'Canción Previa', artist: 'Artista Previo' })
    await addSongToLibrary(existingSongId, lib.id)

    const pkg = {
      version: '1.1.0',
      type: 'saranga-library-package',
      library: { name: 'Biblioteca Conflicto' },
      songs: [
        {
          title: 'Canción Nueva Combinada',
          artist: 'Artista Combinado',
          genres: [],
          tags: [],
          lyrics_data: { languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }] }
        }
      ]
    }

    // Usuario elige combinar
    const onConflictChoice = vi.fn().mockResolvedValue('combine')
    const res = await importLibraryPackage(JSON.stringify(pkg), { onConflictChoice })

    expect(onConflictChoice).toHaveBeenCalledWith({
      existingName: 'Biblioteca Conflicto',
      proposedNewName: 'Biblioteca Conflicto (2)'
    })
    expect(res.libraryId).toBe(lib.id)
    expect(res.libraryName).toBe('Biblioteca Conflicto')

    const songsInLib = await getLibrarySongs(lib.id)
    expect(songsInLib.length).toBe(2)
    const titles = songsInLib.map(s => s.title)
    expect(titles).toContain('Canción Previa')
    expect(titles).toContain('Canción Nueva Combinada')
  })

  it('al importar una biblioteca con nombre existente, crea "Nombre (2)" si el usuario elige no combinar', async () => {
    const lib = await createLibrary('Rock Clásico')

    const pkg = {
      version: '1.1.0',
      type: 'saranga-library-package',
      library: { name: 'Rock Clásico' },
      songs: [
        {
          title: 'Canción Rock (2)',
          artist: 'Banda',
          genres: [],
          tags: [],
          lyrics_data: { languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }] }
        }
      ]
    }

    // Usuario elige crear nueva
    const onConflictChoice = vi.fn().mockResolvedValue('create_new')
    const res = await importLibraryPackage(JSON.stringify(pkg), { onConflictChoice })

    expect(onConflictChoice).toHaveBeenCalledWith({
      existingName: 'Rock Clásico',
      proposedNewName: 'Rock Clásico (2)'
    })
    expect(res.libraryName).toBe('Rock Clásico (2)')

    const newLib = await getLibraryByName('Rock Clásico (2)')
    expect(newLib).not.toBeNull()

    const songsInNewLib = await getLibrarySongs(newLib.id)
    expect(songsInNewLib.length).toBe(1)
    expect(songsInNewLib[0].title).toBe('Canción Rock (2)')
  })
})

