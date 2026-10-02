import { openDB } from 'idb'
import { defaultSongs } from '../data/defaultSongs.js'
import { validateSongPackage } from './schemaValidator.js'

const DB_NAME = 'SarangaDB'
const DB_VERSION = 3

const SEED_VERSION_KEY = 'saranga_seed_version'
const SEED_CURRENT_VERSION = '2'
const SEED_STATUS_KEY = 'saranga_default_songs_seeded'

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

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }

        if (!db.objectStoreNames.contains('libraries')) {
          const libStore = db.createObjectStore('libraries', { keyPath: 'id', autoIncrement: true })
          libStore.createIndex('name', 'name', { unique: false })
          libStore.createIndex('created_at', 'created_at', { unique: false })
        }

        if (!db.objectStoreNames.contains('song_libraries')) {
          const songLibStore = db.createObjectStore('song_libraries', { keyPath: 'id', autoIncrement: true })
          songLibStore.createIndex('song_id', 'song_id', { unique: false })
          songLibStore.createIndex('library_id', 'library_id', { unique: false })
          songLibStore.createIndex('song_library', ['song_id', 'library_id'], { unique: true })
        }
      }
    }).then(async db => {
      await seedDefaultSongs(db)
      return db
    })
  }
  return dbPromise
}

async function removeLegacyDefaultSongs(db) {
  try {
    const legacyTitles = [
      'caminando por la ciudad',
      '君が好きだと叫びたい'
    ]
    const allSongs = await db.getAll('songs')
    const songsToRemove = allSongs.filter(s => {
      const t = (s.title || '').trim().toLowerCase()
      return legacyTitles.some(legacy => t.includes(legacy.toLowerCase()) || legacy.toLowerCase().includes(t))
    })

    if (songsToRemove.length === 0) return

    const tx = db.transaction(['songs', 'song_tags', 'song_genres'], 'readwrite')
    for (const song of songsToRemove) {
      await tx.objectStore('songs').delete(song.id)
      const tagRels = await tx.objectStore('song_tags').index('song_id').getAllKeys(song.id)
      for (const k of tagRels) {
        await tx.objectStore('song_tags').delete(k)
      }
      const genreRels = await tx.objectStore('song_genres').index('song_id').getAllKeys(song.id)
      for (const k of genreRels) {
        await tx.objectStore('song_genres').delete(k)
      }
    }
    await tx.done
  } catch (err) {
    console.warn('Aviso al limpiar canciones heredadas:', err)
  }
}

async function insertSongPackage(db, songPackage) {
  try {
    const normalized = validateSongPackage(songPackage)
    const existingSong = await db.getFromIndex('songs', 'title', normalized.metadata.title)
    if (existingSong) return existingSong.id

    const tx = db.transaction(['artists', 'songs', 'tags', 'genres', 'song_tags', 'song_genres'], 'readwrite')

    // 1. Artista
    let artistId = null
    const artistIndex = tx.objectStore('artists').index('name')
    const existingArtist = await artistIndex.get(normalized.metadata.artist)
    if (existingArtist) {
      artistId = existingArtist.id
    } else {
      artistId = await tx.objectStore('artists').add({ name: normalized.metadata.artist })
    }

    // 2. Videos y Canción
    const videos = normalized.metadata.videos || []
    normalized.basic.videos = videos

    const songId = await tx.objectStore('songs').add({
      title: normalized.metadata.title,
      artist_id: artistId,
      audio_path: normalized.metadata.audioPath || '',
      videos,
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
    return songId
  } catch (err) {
    console.error(`Error al sembrar canción "${songPackage?.metadata?.title}":`, err)
  }
}

export async function seedDefaultSongs(dbInstance, { force = false } = {}) {
  const db = dbInstance || await getDB()

  if (!force) {
    const isLocalSeeded = typeof localStorage !== 'undefined' && localStorage.getItem(SEED_STATUS_KEY) === 'true'
    const localSeedVer = typeof localStorage !== 'undefined' ? localStorage.getItem(SEED_VERSION_KEY) : null

    let isDbSeeded = false
    let dbSeedVer = null
    try {
      if (db.objectStoreNames.contains('settings')) {
        const statusSetting = await db.get('settings', 'default_songs_seeded')
        isDbSeeded = Boolean(statusSetting?.value)
        const verSetting = await db.get('settings', 'seed_version')
        dbSeedVer = verSetting ? verSetting.value : null
      }
    } catch {
      // Ignorar fallo al consultar settings
    }

    if (localSeedVer === SEED_CURRENT_VERSION || dbSeedVer === SEED_CURRENT_VERSION || (isLocalSeeded && isDbSeeded)) {
      return
    }
  }

  // Eliminar canciones por defecto heredadas si estuvieran presentes
  await removeLegacyDefaultSongs(db)

  // Sembrar las nuevas canciones por defecto ("Still Alive" e "Idol")
  for (const songPkg of defaultSongs) {
    await insertSongPackage(db, songPkg)
  }

  // Marcar como sembrada tanto en localStorage como en IndexedDB
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(SEED_VERSION_KEY, SEED_CURRENT_VERSION)
    localStorage.setItem(SEED_STATUS_KEY, 'true')
  }

  try {
    if (db.objectStoreNames.contains('settings')) {
      const tx = db.transaction('settings', 'readwrite')
      await tx.objectStore('settings').put({ key: 'seed_version', value: SEED_CURRENT_VERSION })
      await tx.objectStore('settings').put({ key: 'default_songs_seeded', value: true, seededAt: new Date().toISOString() })
      await tx.done
    }
  } catch (err) {
    console.warn('No se pudo guardar la marca de sembrado en settings store:', err)
  }
}

export const seedDatabaseIfEmpty = seedDefaultSongs
