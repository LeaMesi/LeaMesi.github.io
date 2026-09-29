import { fetchSongById, saveSong, listSongs } from './songService.js'
import { validateSongPackage } from './schemaValidator.js'

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

export async function importSongPackage(fileOrString) {
  let jsonString = ''
  if (typeof fileOrString === 'string') {
    jsonString = fileOrString
  } else if (fileOrString instanceof Blob || fileOrString instanceof File) {
    jsonString = await fileOrString.text()
  } else if (typeof fileOrString === 'object') {
    jsonString = JSON.stringify(fileOrString)
  }

  const rawData = JSON.parse(jsonString)
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
  const backup = {
    version: '1.1.0',
    type: 'saranga-library-backup',
    exportedAt: new Date().toISOString(),
    songs: songs.map(song => ({
      title: song.title,
      artist: song.artist,
      genres: song.genres,
      tags: song.tags,
      audio_path: song.audio_path,
      videos: song.videos || song.lyrics_data?.videos || [],
      lyrics_data: song.lyrics_data,
      visuals_data: song.visuals_data
    }))
  }

  const jsonStr = JSON.stringify(backup, null, 2)
  triggerDownload(jsonStr, `saranga-backup-${new Date().toISOString().slice(0, 10)}.json`)
}

export async function importLibraryBackup(fileOrString) {
  let jsonString = ''
  if (typeof fileOrString === 'string') {
    jsonString = fileOrString
  } else if (fileOrString instanceof Blob || fileOrString instanceof File) {
    jsonString = await fileOrString.text()
  }

  const rawData = JSON.parse(jsonString)
  if (!Array.isArray(rawData.songs)) {
    throw new Error('El archivo no contiene un respaldo de biblioteca válido (falta lista de songs).')
  }

  const importedIds = []
  for (const songItem of rawData.songs) {
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
    const id = await saveSong({
      title: validated.metadata.title,
      artist: validated.metadata.artist,
      genres: validated.metadata.genres,
      tags: validated.metadata.tags,
      audio_path: validated.metadata.audioPath,
      videos: validated.metadata.videos,
      lyrics_data: validated.basic,
      visuals_data: validated.advanced
    })
    importedIds.push(id)
  }

  return importedIds
}

