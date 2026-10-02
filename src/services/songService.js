import { getDB } from './db.js'
import { normalizeVideos } from './schemaValidator.js'

export async function fetchSongById(songId) {
  const db = await getDB()
  const id = Number(songId)
  const song = await db.get('songs', id)
  if (!song) return null

  const artist = song.artist_id ? await db.get('artists', song.artist_id) : null

  // Obtener tags
  const tagRels = await db.getAllFromIndex('song_tags', 'song_id', id)
  const tagPromises = tagRels.map(rel => db.get('tags', rel.tag_id))
  const tags = (await Promise.all(tagPromises)).filter(Boolean)

  // Obtener géneros
  const genreRels = await db.getAllFromIndex('song_genres', 'song_id', id)
  const genrePromises = genreRels.map(rel => db.get('genres', rel.genre_id))
  const genres = (await Promise.all(genrePromises)).filter(Boolean)

  // Obtener bibliotecas
  let libraries = []
  if (db.objectStoreNames.contains('song_libraries') && db.objectStoreNames.contains('libraries')) {
    const libRels = await db.getAllFromIndex('song_libraries', 'song_id', id)
    const libPromises = libRels.map(rel => db.get('libraries', rel.library_id))
    const rawLibs = (await Promise.all(libPromises)).filter(Boolean)
    libraries = rawLibs.map(l => ({ id: l.id, name: l.name }))
  }

  const videos = normalizeVideos(song, song.lyrics_data)

  return {
    ...song,
    videos,
    artist: artist ? artist.name : '',
    artist_id: song.artist_id,
    tags: tags.map(t => t.name),
    genres: genres.map(g => g.name),
    libraries
  }
}

export async function listSongs() {
  const db = await getDB()
  const rawSongs = await db.getAll('songs')
  
  const songs = await Promise.all(
    rawSongs.map(async song => {
      const artist = song.artist_id ? await db.get('artists', song.artist_id) : null
      const tagRels = await db.getAllFromIndex('song_tags', 'song_id', song.id)
      const tags = (await Promise.all(tagRels.map(r => db.get('tags', r.tag_id)))).filter(Boolean)
      const genreRels = await db.getAllFromIndex('song_genres', 'song_id', song.id)
      const genres = (await Promise.all(genreRels.map(r => db.get('genres', r.genre_id)))).filter(Boolean)

      let libraries = []
      if (db.objectStoreNames.contains('song_libraries') && db.objectStoreNames.contains('libraries')) {
        const libRels = await db.getAllFromIndex('song_libraries', 'song_id', song.id)
        const libPromises = libRels.map(r => db.get('libraries', r.library_id))
        const rawLibs = (await Promise.all(libPromises)).filter(Boolean)
        libraries = rawLibs.map(l => ({ id: l.id, name: l.name }))
      }

      const videos = normalizeVideos(song, song.lyrics_data)

      return {
        ...song,
        videos,
        artist: artist ? artist.name : 'Desconocido',
        tags: tags.map(t => t.name),
        genres: genres.map(g => g.name),
        libraries
      }
    })
  )

  return songs.sort((a, b) => (b.id || 0) - (a.id || 0))
}

export async function saveSong(songData) {
  const db = await getDB()
  const tx = db.transaction(['artists', 'songs', 'tags', 'genres', 'song_tags', 'song_genres'], 'readwrite')

  try {
    const artistName = (songData.artist || songData.metadata?.artist || 'Artista Desconocido').trim()
    let artistId = null

    // Buscar o crear artista basado en el nombre actual
    if (artistName) {
      const existingArtist = await tx.objectStore('artists').index('name').get(artistName)
      if (existingArtist) {
        artistId = existingArtist.id
      } else {
        artistId = await tx.objectStore('artists').add({ name: artistName })
      }
    }

    const title = (songData.title || songData.metadata?.title || 'Sin Título').trim()
    const audioPath = songData.audio_path || songData.metadata?.audioPath || ''
    const lyricsData = songData.lyrics_data || songData.basic || {}
    const visualsData = songData.visuals_data || songData.advanced || { enabled: false, effects: [] }
    const videos = normalizeVideos(songData, lyricsData)
    lyricsData.videos = videos

    let songId = songData.id ? Number(songData.id) : null

    if (songId) {
      await tx.objectStore('songs').put({
        id: songId,
        title,
        artist_id: artistId,
        audio_path: audioPath,
        videos,
        lyrics_data: lyricsData,
        visuals_data: visualsData,
        created_at: songData.created_at || new Date().toISOString()
      })

      // Limpiar relaciones antiguas para reinsertar
      const oldTagRels = await tx.objectStore('song_tags').index('song_id').getAllKeys(songId)
      for (const key of oldTagRels) {
        await tx.objectStore('song_tags').delete(key)
      }
      const oldGenreRels = await tx.objectStore('song_genres').index('song_id').getAllKeys(songId)
      for (const key of oldGenreRels) {
        await tx.objectStore('song_genres').delete(key)
      }
    } else {
      songId = await tx.objectStore('songs').add({
        title,
        artist_id: artistId,
        audio_path: audioPath,
        videos,
        lyrics_data: lyricsData,
        visuals_data: visualsData,
        created_at: new Date().toISOString()
      })
    }

    // Guardar géneros
    const genresList = songData.genres || songData.metadata?.genres || []
    for (const gName of genresList) {
      if (!gName) continue
      const genreStore = tx.objectStore('genres')
      let genre = await genreStore.index('name').get(gName)
      let genreId = genre ? genre.id : await genreStore.add({ name: gName })
      await tx.objectStore('song_genres').add({ song_id: songId, genre_id: genreId })
    }

    // Guardar tags
    const tagsList = songData.tags || songData.metadata?.tags || []
    for (const tName of tagsList) {
      if (!tName) continue
      const tagStore = tx.objectStore('tags')
      let tag = await tagStore.index('name').get(tName)
      let tagId = tag ? tag.id : await tagStore.add({ name: tName })
      await tx.objectStore('song_tags').add({ song_id: songId, tag_id: tagId })
    }

    await tx.done
    return songId
  } catch (err) {
    console.error('Error al guardar la canción:', err)
    throw err
  }
}

export async function deleteSong(songId) {
  const db = await getDB()
  const id = Number(songId)
  const storeNames = ['songs', 'song_tags', 'song_genres']
  if (db.objectStoreNames.contains('song_libraries')) {
    storeNames.push('song_libraries')
  }
  const tx = db.transaction(storeNames, 'readwrite')

  try {
    await tx.objectStore('songs').delete(id)

    const tagRels = await tx.objectStore('song_tags').index('song_id').getAllKeys(id)
    for (const key of tagRels) {
      await tx.objectStore('song_tags').delete(key)
    }

    const genreRels = await tx.objectStore('song_genres').index('song_id').getAllKeys(id)
    for (const key of genreRels) {
      await tx.objectStore('song_genres').delete(key)
    }

    if (db.objectStoreNames.contains('song_libraries')) {
      const libRels = await tx.objectStore('song_libraries').index('song_id').getAllKeys(id)
      for (const key of libRels) {
        await tx.objectStore('song_libraries').delete(key)
      }
    }

    await tx.done
    return true
  } catch (err) {
    console.error(`Error al eliminar la canción ${id}:`, err)
    throw err
  }
}

export async function addTranslationToSong(songId, newTranslation) {
  const song = await fetchSongById(songId)
  if (!song) throw new Error('Canción no encontrada.')

  const lyricsData = song.lyrics_data || {}
  const languages = Array.isArray(lyricsData.languages) ? [...lyricsData.languages] : []

  // Asegurar que isMain sea false para traducciones agregadas
  const translationToAdd = {
    ...newTranslation,
    isMain: false
  }

  // Si ya existía este código de idioma, se reemplaza; si no, se agrega
  const existingIdx = languages.findIndex(l => l.code === translationToAdd.code)
  if (existingIdx >= 0) {
    languages[existingIdx] = translationToAdd
  } else {
    languages.push(translationToAdd)
  }

  lyricsData.languages = languages
  return saveSong({
    ...song,
    lyrics_data: lyricsData
  })
}

export async function updateSongVideos(songId, videos) {
  const song = await fetchSongById(songId)
  if (!song) throw new Error('Canción no encontrada.')

  const normalized = normalizeVideos({ videos }, {})
  const lyricsData = song.lyrics_data || {}
  lyricsData.videos = normalized

  await saveSong({
    ...song,
    videos: normalized,
    lyrics_data: lyricsData
  })

  return normalized
}

