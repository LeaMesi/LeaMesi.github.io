import { fetchSongById, saveSong, listSongs } from './songService.js'
import { validateSongPackage } from './schemaValidator.js'
import { getDB } from './db.js'
import {
  getLibraryById,
  getLibraryByName,
  listLibraries,
  createLibrary,
  getLibrarySongs,
  addSongToLibrary,
  getNextUniqueLibraryName
} from './libraryService.js'
import { importLyricsfileAsNewSong } from './lyricsfileService.js'
import { showConfirm } from '../views/customPrompt.js'

function triggerDownload(content, filename, contentType = 'application/json') {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function sanitizeFilename(name) {
  return (name || 'cancion')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
}

export async function exportSongPackage(songId) {
  const song = await fetchSongById(songId)
  if (!song) throw new Error('Canción no encontrada para exportar.')

  const videos = song.videos || song.lyrics_data?.videos || []
  const pkg = {
    version: '1.1.0',
    metadata: {
      title: song.title,
      artist: song.artist || '',
      genres: song.genres || [],
      tags: song.tags || [],
      audioPath: song.audio_path || '',
      videos,
      youtubeUrlFull: videos[0]?.url || song.lyrics_data?.youtube?.full || '',
      youtubeUrlInstrumental: videos[1]?.url || song.lyrics_data?.youtube?.instrumental || ''
    },
    basic: {
      ...(song.lyrics_data || {}),
      videos
    },
    advanced: song.visuals_data || { enabled: false, effects: [] }
  }

  const jsonStr = JSON.stringify(pkg, null, 2)
  const filename = `${sanitizeFilename(song.title)}-package.json`
  triggerDownload(jsonStr, filename)
  return pkg
}

export async function importSongPackage(fileOrData) {
  let rawData = null
  if (typeof fileOrData === 'string') {
    rawData = JSON.parse(fileOrData)
  } else if (fileOrData instanceof Blob || (typeof File !== 'undefined' && fileOrData instanceof File)) {
    const text = await fileOrData.text()
    rawData = JSON.parse(text)
  } else if (fileOrData && typeof fileOrData === 'object') {
    rawData = fileOrData
  } else {
    throw new Error('Formato de datos no válido para importar canción.')
  }

  const validated = validateSongPackage(rawData)

  const songId = await saveSong({
    title: validated.metadata.title,
    artist: validated.metadata.artist,
    genres: validated.metadata.genres,
    tags: validated.metadata.tags,
    audio_path: validated.metadata.audioPath,
    videos: validated.metadata.videos,
    lyrics_data: validated.basic,
    visuals_data: validated.advanced
  })

  return songId
}

export async function exportLibraryBackup() {
  const songs = await listSongs()
  const libraries = await listLibraries()
  const backup = {
    version: '1.2.0',
    type: 'saranga-library-backup',
    exportedAt: new Date().toISOString(),
    libraries: libraries.map(l => ({
      name: l.name,
      description: l.description || ''
    })),
    songs: songs.map(song => ({
      title: song.title,
      artist: song.artist,
      genres: song.genres || [],
      tags: song.tags || [],
      libraries: (song.libraries || []).map(l => l.name),
      audio_path: song.audio_path || '',
      videos: song.videos || song.lyrics_data?.videos || [],
      lyrics_data: song.lyrics_data,
      visuals_data: song.visuals_data
    }))
  }

  const jsonStr = JSON.stringify(backup, null, 2)
  triggerDownload(jsonStr, `saranga-backup-${new Date().toISOString().slice(0, 10)}.json`)
}

export async function importLibraryBackup(fileOrData) {
  let rawData = null
  if (typeof fileOrData === 'string') {
    rawData = JSON.parse(fileOrData)
  } else if (fileOrData instanceof Blob || (typeof File !== 'undefined' && fileOrData instanceof File)) {
    const text = await fileOrData.text()
    rawData = JSON.parse(text)
  } else if (fileOrData && typeof fileOrData === 'object') {
    rawData = fileOrData
  } else {
    throw new Error('Formato de datos no válido para importar respaldo.')
  }

  const songList = Array.isArray(rawData) ? rawData : (Array.isArray(rawData.songs) ? rawData.songs : null)
  if (!songList) {
    throw new Error('El archivo no contiene un respaldo de biblioteca válido (falta lista de canciones).')
  }
  if (songList.length === 0) {
    return []
  }

  // Si el respaldo contiene bibliotecas, las creamos o aseguramos
  const libMap = new Map()
  if (Array.isArray(rawData.libraries)) {
    for (const libInfo of rawData.libraries) {
      if (libInfo && libInfo.name) {
        const existing = await getLibraryByName(libInfo.name)
        if (existing) {
          libMap.set(libInfo.name, existing.id)
        } else {
          const created = await createLibrary(libInfo.name, libInfo.description || '')
          libMap.set(libInfo.name, created.id)
        }
      }
    }
  }

  const db = await getDB()
  const importedIds = []

  for (const songItem of songList) {
    if (!songItem || typeof songItem !== 'object') continue

    try {
      const rawTitle = songItem.title || songItem.metadata?.title || songItem.song || songItem.trackName || ''
      if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
        continue
      }
      const rawArtist = songItem.artist || songItem.metadata?.artist || songItem.artistName || 'Artista Desconocido'

      const pkg = {
        version: songItem.version || rawData.version || '1.1.0',
        metadata: {
          title: rawTitle.trim(),
          artist: (typeof rawArtist === 'string' && rawArtist.trim()) ? rawArtist.trim() : 'Artista Desconocido',
          genres: Array.isArray(songItem.genres) ? songItem.genres : (Array.isArray(songItem.metadata?.genres) ? songItem.metadata.genres : []),
          tags: Array.isArray(songItem.tags) ? songItem.tags : (Array.isArray(songItem.metadata?.tags) ? songItem.metadata.tags : []),
          audioPath: songItem.audio_path || songItem.audioPath || songItem.metadata?.audioPath || '',
          videos: songItem.videos || songItem.metadata?.videos || songItem.lyrics_data?.videos || songItem.basic?.videos || []
        },
        basic: songItem.lyrics_data || songItem.basic || {},
        advanced: songItem.visuals_data || songItem.advanced || { enabled: false, effects: [] }
      }

      const validated = validateSongPackage(pkg)

      // Verificar si ya existe una canción con el mismo título y artista para actualizarla
      let existingSongId = null
      if (validated.metadata.title) {
        const potentialMatches = await db.getAllFromIndex('songs', 'title', validated.metadata.title)
        for (const candidate of potentialMatches) {
          const candArtist = candidate.artist_id ? await db.get('artists', candidate.artist_id) : null
          if (!candArtist || candArtist.name.toLowerCase() === validated.metadata.artist.toLowerCase()) {
            existingSongId = candidate.id
            break
          }
        }
      }

      const id = await saveSong({
        id: existingSongId || undefined,
        title: validated.metadata.title,
        artist: validated.metadata.artist,
        genres: validated.metadata.genres,
        tags: validated.metadata.tags,
        audio_path: validated.metadata.audioPath,
        videos: validated.metadata.videos,
        lyrics_data: validated.basic,
        visuals_data: validated.advanced
      })

      // Asociar a bibliotecas si venían especificadas
      const songLibs = songItem.libraries || songItem.metadata?.libraries || []
      if (Array.isArray(songLibs) && songLibs.length > 0) {
        for (const libName of songLibs) {
          const cleanName = (typeof libName === 'string' ? libName : libName?.name || '').trim()
          if (!cleanName) continue
          let targetLibId = libMap.get(cleanName)
          if (!targetLibId) {
            const existing = await getLibraryByName(cleanName)
            if (existing) {
              targetLibId = existing.id
            } else {
              const created = await createLibrary(cleanName)
              targetLibId = created.id
            }
            libMap.set(cleanName, targetLibId)
          }
          if (targetLibId) {
            await addSongToLibrary(id, targetLibId)
          }
        }
      }

      importedIds.push(id)
    } catch (err) {
      console.warn('Error al restaurar canción de respaldo:', songItem, err)
    }
  }

  if (importedIds.length === 0 && songList.length > 0) {
    throw new Error('No se pudo restaurar ninguna canción del respaldo. Verifique que el archivo contenga canciones válidas.')
  }

  return importedIds
}

export async function exportLibraryPackage(libraryId) {
  const library = await getLibraryById(libraryId)
  if (!library) throw new Error('Biblioteca no encontrada para exportar.')

  const songs = await getLibrarySongs(libraryId)
  const pkg = {
    version: '1.1.0',
    type: 'saranga-library-package',
    exportedAt: new Date().toISOString(),
    library: {
      name: library.name,
      description: library.description || ''
    },
    songs: songs.map(song => ({
      title: song.title,
      artist: song.artist,
      genres: song.genres || [],
      tags: song.tags || [],
      audio_path: song.audio_path || '',
      videos: song.videos || song.lyrics_data?.videos || [],
      lyrics_data: song.lyrics_data,
      visuals_data: song.visuals_data
    }))
  }

  const jsonStr = JSON.stringify(pkg, null, 2)
  const filename = `biblioteca-${sanitizeFilename(library.name)}.json`
  triggerDownload(jsonStr, filename)
  return pkg
}

export async function importLibraryPackage(fileOrData, { onConflictChoice } = {}) {
  let rawData = null
  if (typeof fileOrData === 'string') {
    rawData = JSON.parse(fileOrData)
  } else if (fileOrData instanceof Blob || (typeof File !== 'undefined' && fileOrData instanceof File)) {
    const text = await fileOrData.text()
    rawData = JSON.parse(text)
  } else if (fileOrData && typeof fileOrData === 'object') {
    rawData = fileOrData
  } else {
    throw new Error('Formato de datos no válido para importar biblioteca.')
  }

  if (!Array.isArray(rawData.songs)) {
    throw new Error('El archivo no contiene una biblioteca válida (falta la lista de canciones).')
  }

  const baseLibraryName = (rawData.library?.name || 'Biblioteca Importada').trim() || 'Biblioteca Importada'
  const existingLibrary = await getLibraryByName(baseLibraryName)

  let targetLibraryId = null
  let targetLibraryName = baseLibraryName

  if (existingLibrary) {
    const allLibraries = await listLibraries()
    const proposedNewName = getNextUniqueLibraryName(baseLibraryName, allLibraries.map(l => l.name))

    let choice = 'combine'
    if (typeof onConflictChoice === 'function') {
      choice = await onConflictChoice({
        existingName: existingLibrary.name,
        proposedNewName
      })
    } else if (typeof window !== 'undefined') {
      const shouldCombine = await showConfirm({
        title: 'Biblioteca Existente',
        message: `Ya existe una biblioteca llamada "${existingLibrary.name}".\n\n¿Deseas combinar las canciones con la biblioteca existente?\n• Aceptar: Combinar en "${existingLibrary.name}".\n• Cancelar: Crear una nueva biblioteca "${proposedNewName}".`,
        confirmText: 'Combinar',
        cancelText: 'Crear nueva'
      })
      choice = shouldCombine ? 'combine' : 'create_new'
    }

    if (choice === 'cancel') {
      return null
    }

    if (choice === 'combine') {
      targetLibraryId = existingLibrary.id
      targetLibraryName = existingLibrary.name
    } else {
      const newLib = await createLibrary(proposedNewName, rawData.library?.description || '')
      targetLibraryId = newLib.id
      targetLibraryName = newLib.name
    }
  } else {
    // Si no existe, se crea automáticamente
    const newLib = await createLibrary(baseLibraryName, rawData.library?.description || '')
    targetLibraryId = newLib.id
    targetLibraryName = newLib.name
  }

  // Importar o asociar canciones
  const db = await getDB()
  const importedSongIds = []

  for (const songItem of rawData.songs) {
    let songId = null
    const songTitle = (songItem.title || '').trim()

    let existingSong = null
    if (songTitle) {
      existingSong = await db.getFromIndex('songs', 'title', songTitle)
    }

    if (existingSong) {
      songId = existingSong.id
    } else {
      const pkg = {
        metadata: {
          title: songItem.title,
          artist: songItem.artist,
          genres: songItem.genres,
          tags: songItem.tags,
          audioPath: songItem.audio_path,
          videos: songItem.videos || songItem.lyrics_data?.videos || []
        },
        basic: songItem.lyrics_data,
        advanced: songItem.visuals_data
      }
      const validated = validateSongPackage(pkg)
      songId = await saveSong({
        title: validated.metadata.title,
        artist: validated.metadata.artist,
        genres: validated.metadata.genres,
        tags: validated.metadata.tags,
        audio_path: validated.metadata.audioPath,
        videos: validated.metadata.videos,
        lyrics_data: validated.basic,
        visuals_data: validated.advanced
      })
    }

    if (songId) {
      await addSongToLibrary(songId, targetLibraryId)
      importedSongIds.push(songId)
    }
  }

  return {
    libraryId: targetLibraryId,
    libraryName: targetLibraryName,
    songCount: importedSongIds.length,
    songIds: importedSongIds
  }
}

export async function importUniversalFile(fileOrData, { onConflictChoice } = {}) {
  let fileName = ''
  let parsed = null

  if (fileOrData instanceof Blob || (typeof File !== 'undefined' && fileOrData instanceof File)) {
    fileName = (fileOrData.name || '').toLowerCase()
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
      const newId = await importLyricsfileAsNewSong(fileOrData)
      return {
        type: 'song',
        songId: newId,
        message: `Canción importada exitosamente desde archivo Lyricsfile "${fileOrData.name}".`
      }
    }
    const text = await fileOrData.text()
    parsed = JSON.parse(text)
  } else if (typeof fileOrData === 'string') {
    const trimmed = fileOrData.trim()
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      parsed = JSON.parse(trimmed)
    } else {
      const newId = await importLyricsfileAsNewSong(fileOrData)
      return {
        type: 'song',
        songId: newId,
        message: 'Canción importada exitosamente desde archivo Lyricsfile.'
      }
    }
  } else if (fileOrData && typeof fileOrData === 'object') {
    parsed = fileOrData
  } else {
    throw new Error('Formato no soportado. Debe ser un archivo .json o .yaml/.yml.')
  }

  // Detectar tipo de contenido JSON
  if (parsed.type === 'saranga-library-backup' || (Array.isArray(parsed.songs) && !parsed.library) || Array.isArray(parsed)) {
    const importedIds = await importLibraryBackup(parsed)
    return {
      type: 'backup',
      count: importedIds.length,
      songIds: importedIds,
      message: `Respaldo restaurado correctamente (${importedIds.length} canción/es).`
    }
  } else if (parsed.type === 'saranga-library-package' || (parsed.library && Array.isArray(parsed.songs))) {
    const result = await importLibraryPackage(parsed, { onConflictChoice })
    if (result) {
      return {
        type: 'library',
        libraryId: result.libraryId,
        libraryName: result.libraryName,
        count: result.songCount,
        songIds: result.songIds,
        message: `Biblioteca "${result.libraryName}" importada con éxito (${result.songCount} canción/es).`
      }
    } else {
      return {
        type: 'cancelled',
        message: 'Importación de biblioteca cancelada.'
      }
    }
  } else {
    const newId = await importSongPackage(parsed)
    const title = parsed.metadata?.title || parsed.title || 'Importada'
    return {
      type: 'song',
      songId: newId,
      title,
      message: `Canción "${title}" agregada con éxito.`
    }
  }
}

