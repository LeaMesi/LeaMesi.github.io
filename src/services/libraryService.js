import { getDB } from './db.js'
import { fetchSongById } from './songService.js'

/**
 * Calcula el siguiente nombre único para una biblioteca cuando ya existe una con el mismo nombre.
 * Ej: 'Favoritos' -> 'Favoritos (2)' -> 'Favoritos (3)'...
 *
 * @param {string} baseName
 * @param {string[]} existingNames
 * @returns {string}
 */
export function getNextUniqueLibraryName(baseName, existingNames = []) {
  const trimmed = (baseName || '').trim() || 'Biblioteca'
  const cleanBase = trimmed.replace(/\s*\(\d+\)$/, '').trim() || trimmed
  const existingSet = new Set(existingNames.map(n => (n || '').trim().toLowerCase()))

  if (!existingSet.has(trimmed.toLowerCase())) {
    return trimmed
  }

  let counter = 2
  while (existingSet.has(`${cleanBase} (${counter})`.toLowerCase())) {
    counter++
  }
  return `${cleanBase} (${counter})`
}

/**
 * Crea una nueva biblioteca en la base de datos local.
 *
 * @param {string} name
 * @param {string} [description='']
 * @returns {Promise<{ id: number, name: string, description: string, created_at: string, songCount: number }>}
 */
export async function createLibrary(name, description = '') {
  const trimmedName = (name || '').trim()
  if (!trimmedName) {
    throw new Error('El nombre de la biblioteca no puede estar vacío.')
  }

  const db = await getDB()
  const libData = {
    name: trimmedName,
    description: (description || '').trim(),
    created_at: new Date().toISOString()
  }

  const id = await db.add('libraries', libData)
  return {
    id,
    ...libData,
    songCount: 0
  }
}

/**
 * Obtiene todas las bibliotecas con el conteo de canciones que pertenecen a cada una.
 *
 * @returns {Promise<Array<{ id: number, name: string, description: string, created_at: string, songCount: number }>>}
 */
export async function listLibraries() {
  const db = await getDB()
  if (!db.objectStoreNames.contains('libraries')) return []

  const rawLibraries = await db.getAll('libraries')
  const librariesWithCount = await Promise.all(
    rawLibraries.map(async lib => {
      let songCount = 0
      if (db.objectStoreNames.contains('song_libraries')) {
        const songRels = await db.getAllFromIndex('song_libraries', 'library_id', lib.id)
        songCount = songRels.length
      }
      return {
        ...lib,
        songCount
      }
    })
  )

  return librariesWithCount.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }))
}

/**
 * Obtiene una biblioteca por su ID.
 *
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
export async function getLibraryById(id) {
  const db = await getDB()
  if (!db.objectStoreNames.contains('libraries')) return null
  const lib = await db.get('libraries', Number(id))
  if (!lib) return null

  let songCount = 0
  if (db.objectStoreNames.contains('song_libraries')) {
    const songRels = await db.getAllFromIndex('song_libraries', 'library_id', lib.id)
    songCount = songRels.length
  }

  return {
    ...lib,
    songCount
  }
}

/**
 * Busca una biblioteca por nombre (coincidencia exacta insensible a mayúsculas/minúsculas).
 *
 * @param {string} name
 * @returns {Promise<object|null>}
 */
export async function getLibraryByName(name) {
  const trimmed = (name || '').trim().toLowerCase()
  if (!trimmed) return null

  const libraries = await listLibraries()
  return libraries.find(l => (l.name || '').trim().toLowerCase() === trimmed) || null
}

/**
 * Modifica el nombre o descripción de una biblioteca.
 *
 * @param {number|string} id
 * @param {string} newName
 * @param {string} [newDescription]
 * @returns {Promise<object>}
 */
export async function renameLibrary(id, newName, newDescription) {
  const trimmedName = (newName || '').trim()
  if (!trimmedName) {
    throw new Error('El nuevo nombre de la biblioteca no puede estar vacío.')
  }

  const db = await getDB()
  const libId = Number(id)
  const existing = await db.get('libraries', libId)
  if (!existing) {
    throw new Error(`Biblioteca con ID ${id} no encontrada.`)
  }

  const updated = {
    ...existing,
    name: trimmedName,
    description: newDescription !== undefined ? (newDescription || '').trim() : (existing.description || '')
  }

  await db.put('libraries', updated)
  return updated
}

/**
 * Elimina una biblioteca y todas sus relaciones en song_libraries.
 * Las canciones NO son eliminadas del catálogo general.
 *
 * @param {number|string} id
 * @returns {Promise<boolean>}
 */
export async function deleteLibrary(id) {
  const db = await getDB()
  const libId = Number(id)
  const tx = db.transaction(['libraries', 'song_libraries'], 'readwrite')

  try {
    await tx.objectStore('libraries').delete(libId)

    const relKeys = await tx.objectStore('song_libraries').index('library_id').getAllKeys(libId)
    for (const key of relKeys) {
      await tx.objectStore('song_libraries').delete(key)
    }

    await tx.done
    return true
  } catch (err) {
    console.error(`Error al eliminar biblioteca ${libId}:`, err)
    throw err
  }
}

/**
 * Obtiene las bibliotecas a las que pertenece una canción.
 *
 * @param {number|string} songId
 * @returns {Promise<Array<{ id: number, name: string }>>}
 */
export async function getSongLibraries(songId) {
  const db = await getDB()
  if (!db.objectStoreNames.contains('song_libraries') || !db.objectStoreNames.contains('libraries')) {
    return []
  }

  const id = Number(songId)
  const rels = await db.getAllFromIndex('song_libraries', 'song_id', id)
  const libPromises = rels.map(r => db.get('libraries', r.library_id))
  const libs = (await Promise.all(libPromises)).filter(Boolean)

  return libs.map(l => ({ id: l.id, name: l.name }))
}

/**
 * Obtiene todas las canciones pertenecientes a una biblioteca específica.
 *
 * @param {number|string} libraryId
 * @returns {Promise<Array<object>>}
 */
export async function getLibrarySongs(libraryId) {
  const db = await getDB()
  if (!db.objectStoreNames.contains('song_libraries')) return []

  const libId = Number(libraryId)
  const rels = await db.getAllFromIndex('song_libraries', 'library_id', libId)
  const songPromises = rels.map(r => fetchSongById(r.song_id))
  const songs = (await Promise.all(songPromises)).filter(Boolean)

  return songs.sort((a, b) => (b.id || 0) - (a.id || 0))
}

/**
 * Agrega una canción a una biblioteca si no está ya asociada.
 *
 * @param {number|string} songId
 * @param {number|string} libraryId
 * @returns {Promise<boolean>}
 */
export async function addSongToLibrary(songId, libraryId) {
  const db = await getDB()
  const sId = Number(songId)
  const lId = Number(libraryId)

  const existingRel = await db.getFromIndex('song_libraries', 'song_library', [sId, lId])
  if (existingRel) return false

  await db.add('song_libraries', {
    song_id: sId,
    library_id: lId,
    added_at: new Date().toISOString()
  })
  return true
}

/**
 * Remueve una canción de una biblioteca específica.
 *
 * @param {number|string} songId
 * @param {number|string} libraryId
 * @returns {Promise<boolean>}
 */
export async function removeSongFromLibrary(songId, libraryId) {
  const db = await getDB()
  const sId = Number(songId)
  const lId = Number(libraryId)

  const tx = db.transaction('song_libraries', 'readwrite')
  const key = await tx.objectStore('song_libraries').index('song_library').getKey([sId, lId])
  if (key !== undefined) {
    await tx.objectStore('song_libraries').delete(key)
  }
  await tx.done
  return true
}

/**
 * Configura el conjunto exacto de bibliotecas a las que pertenece una canción.
 *
 * @param {number|string} songId
 * @param {Array<number|string>} libraryIds
 * @returns {Promise<boolean>}
 */
export async function setSongLibraries(songId, libraryIds = []) {
  const db = await getDB()
  const sId = Number(songId)
  const targetLibIds = [...new Set(libraryIds.map(Number))].filter(Boolean)

  const tx = db.transaction('song_libraries', 'readwrite')
  const store = tx.objectStore('song_libraries')

  // Eliminar relaciones existentes
  const oldKeys = await store.index('song_id').getAllKeys(sId)
  for (const k of oldKeys) {
    await store.delete(k)
  }

  // Insertar nuevas relaciones
  for (const lId of targetLibIds) {
    await store.add({
      song_id: sId,
      library_id: lId,
      added_at: new Date().toISOString()
    })
  }

  await tx.done
  return true
}
