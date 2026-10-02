import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getDB } from '../../src/services/db.js'
import { saveSong, fetchSongById } from '../../src/services/songService.js'
import {
  exportSongPackage,
  importSongPackage,
  exportLibraryBackup,
  importLibraryBackup
} from '../../src/services/shareService.js'

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
})
