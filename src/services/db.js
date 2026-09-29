import { openDB } from 'idb'
import { mockSong } from '../data/mockSong.js'
import { validateSongPackage } from './schemaValidator.js'

const DB_NAME = 'SarangaDB'
const DB_VERSION = 1

let dbPromise = null

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (!db.objectStoreNames.contains('artists')) {
          const artistStore = db.createObjectStore('artists', { keyPath: 'id', autoIncrement: true })
          artistStore.createIndex('name', 'name', { unique: false })
        }

        if (!db.objectStoreNames.contains('songs')) {
          const songStore = db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true })
          songStore.createIndex('title', 'title', { unique: false })
          songStore.createIndex('artist_id', 'artist_id', { unique: false })
        }

        if (!db.objectStoreNames.contains('tags')) {
          const tagStore = db.createObjectStore('tags', { keyPath: 'id', autoIncrement: true })
          tagStore.createIndex('name', 'name', { unique: true })
        }

        if (!db.objectStoreNames.contains('genres')) {
          const genreStore = db.createObjectStore('genres', { keyPath: 'id', autoIncrement: true })
          genreStore.createIndex('name', 'name', { unique: true })
        }

        if (!db.objectStoreNames.contains('song_tags')) {
          const songTagStore = db.createObjectStore('song_tags', { keyPath: 'id', autoIncrement: true })
          songTagStore.createIndex('song_id', 'song_id', { unique: false })
          songTagStore.createIndex('tag_id', 'tag_id', { unique: false })
          songTagStore.createIndex('song_tag', ['song_id', 'tag_id'], { unique: true })
        }

        if (!db.objectStoreNames.contains('song_genres')) {
          const songGenreStore = db.createObjectStore('song_genres', { keyPath: 'id', autoIncrement: true })
          songGenreStore.createIndex('song_id', 'song_id', { unique: false })
          songGenreStore.createIndex('genre_id', 'genre_id', { unique: false })
          songGenreStore.createIndex('song_genre', ['song_id', 'genre_id'], { unique: true })
        }
      }
    }).then(async db => {
      await seedDatabaseIfEmpty(db)
      return db
    })
  }
  return dbPromise
}

async function seedDatabaseIfEmpty(db) {
  const songCount = await db.count('songs')
  if (songCount > 0) return

  // Importar la canción demo inicial
  const normalized = validateSongPackage(mockSong)
  const tx = db.transaction(['artists', 'songs', 'tags', 'genres', 'song_tags', 'song_genres'], 'readwrite')

  try {
    // 1. Artista
    let artistId = null
    const artistIndex = tx.objectStore('artists').index('name')
    const existingArtist = await artistIndex.get(normalized.metadata.artist)
    if (existingArtist) {
      artistId = existingArtist.id
    } else {
      artistId = await tx.objectStore('artists').add({ name: normalized.metadata.artist })
    }

    // 2. Canción
    const songId = await tx.objectStore('songs').add({
      title: normalized.metadata.title,
      artist_id: artistId,
      audio_path: normalized.metadata.audioPath || '',
      lyrics_data: normalized.basic,
      visuals_data: normalized.advanced,
      created_at: new Date().toISOString()
    })

    // 3. Géneros
    for (const genreName of normalized.metadata.genres) {
      if (!genreName) continue
      const genreStore = tx.objectStore('genres')
      let genre = await genreStore.index('name').get(genreName)
      let genreId = genre ? genre.id : await genreStore.add({ name: genreName })
      await tx.objectStore('song_genres').add({ song_id: songId, genre_id: genreId })
    }

    // 4. Tags
    for (const tagName of normalized.metadata.tags) {
      if (!tagName) continue
      const tagStore = tx.objectStore('tags')
      let tag = await tagStore.index('name').get(tagName)
      let tagId = tag ? tag.id : await tagStore.add({ name: tagName })
      await tx.objectStore('song_tags').add({ song_id: songId, tag_id: tagId })
    }

    await tx.done
  } catch (err) {
    console.error('Error al inicializar la base de datos con mockSong:', err)
  }
}
