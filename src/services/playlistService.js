// Servicio desacoplado para gestión de la Lista de Reproducción (Playlist / Cola)
// Permite añadir, quitar, reordenar canciones, shuffle y sincronización con bibliotecas

import * as defaultLibService from './libraryService.js'

/**
 * Normaliza una canción para el almacén de la playlist
 *
 * @param {object} song
 * @returns {object}
 */
export function normalizePlaylistSong(song) {
  if (!song || song.id === undefined) return null
  return {
    id: song.id,
    title: song.title || 'Sin título',
    artist: song.artist || 'Artista Desconocido',
    audio_path: song.audio_path || song.audioPath || '',
    videos: Array.isArray(song.videos) ? song.videos : []
  }
}

/**
 * Crea una nueva instancia del servicio de Playlist.
 *
 * @param {object} [options]
 * @param {Array<object>} [options.initialSongs=[]]
 * @param {string} [options.storageKey='saranga_playlist']
 * @returns {object}
 */
export function createPlaylistService({ initialSongs = [], storageKey = 'saranga_playlist' } = {}) {
  let songs = []
  let currentIndex = -1
  let listeners = []

  // Cargar estado inicial desde localStorage
  if (typeof localStorage !== 'undefined' && storageKey) {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed.songs)) {
          songs = parsed.songs.map(normalizePlaylistSong).filter(Boolean)
          currentIndex = typeof parsed.currentIndex === 'number' ? parsed.currentIndex : -1
          if (currentIndex >= songs.length) {
            currentIndex = songs.length > 0 ? songs.length - 1 : -1
          }
        }
      }
    } catch (err) {
      console.warn('No se pudo restaurar playlist desde localStorage:', err)
    }
  }

  // Si no había guardada pero se proporcionaron initialSongs
  if (songs.length === 0 && Array.isArray(initialSongs) && initialSongs.length > 0) {
    songs = initialSongs.map(normalizePlaylistSong).filter(Boolean)
    currentIndex = songs.length > 0 ? 0 : -1
  }

  function persist() {
    if (typeof localStorage !== 'undefined' && storageKey) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          songs,
          currentIndex
        }))
      } catch (_) {}
    }
  }

  function getState() {
    const count = songs.length
    const currentSong = (currentIndex >= 0 && currentIndex < count) ? songs[currentIndex] : null
    return {
      songs: [...songs],
      currentIndex,
      currentSong,
      count,
      hasNext: currentIndex >= 0 && currentIndex < count - 1,
      hasPrev: currentIndex > 0
    }
  }

  function notify() {
    persist()
    const state = getState()
    listeners.forEach(fn => {
      try {
        fn(state)
      } catch (err) {
        console.error('Error en listener de PlaylistService:', err)
      }
    })
  }

  return {
    getState,
    getSongs: () => [...songs],
    getCurrentIndex: () => currentIndex,
    getCurrentSong: () => (currentIndex >= 0 && currentIndex < songs.length) ? songs[currentIndex] : null,

    /**
     * Añade una canción al final de la playlist.
     * Previene duplicados por ID.
     *
     * @param {object} song
     * @param {object} [opts]
     * @param {boolean} [opts.playIfEmpty=false]
     * @returns {boolean} true si se añadió, false si ya existía o es inválida
     */
    addSong(song, { playIfEmpty = false } = {}) {
      const normalized = normalizePlaylistSong(song)
      if (!normalized) return false

      const alreadyExists = songs.some(s => Number(s.id) === Number(normalized.id))
      if (alreadyExists) return false

      songs.push(normalized)
      if (songs.length === 1 && (playIfEmpty || currentIndex === -1)) {
        currentIndex = 0
      }

      notify()
      return true
    },

    /**
     * Añade un conjunto de canciones a la playlist ignorando las que ya existen.
     *
     * @param {Array<object>} newSongs
     * @param {object} [opts]
     * @param {boolean} [opts.playIfEmpty=false]
     * @returns {number} Cantidad de canciones efectivamente añadidas
     */
    addSongs(newSongs, { playIfEmpty = false } = {}) {
      if (!Array.isArray(newSongs)) return 0
      let addedCount = 0

      newSongs.forEach(s => {
        const normalized = normalizePlaylistSong(s)
        if (!normalized) return
        const alreadyExists = songs.some(existing => Number(existing.id) === Number(normalized.id))
        if (!alreadyExists) {
          songs.push(normalized)
          addedCount++
        }
      })

      if (addedCount > 0) {
        if (currentIndex === -1 && songs.length > 0) {
          currentIndex = 0
        }
        notify()
      }

      return addedCount
    },

    /**
     * Reemplaza por completo el contenido de la playlist.
     *
     * @param {Array<object>} songList
     * @param {object} [options]
     * @param {boolean} [options.shuffle=false]
     * @param {number} [options.startIndex=0]
     */
    setSongs(songList, { shuffle = false, startIndex = 0 } = {}) {
      if (!Array.isArray(songList)) return
      let list = songList.map(normalizePlaylistSong).filter(Boolean)

      if (shuffle && list.length > 1) {
        // Algoritmo Fisher-Yates
        for (let i = list.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [list[i], list[j]] = [list[j], list[i]]
        }
      }

      songs = list
      currentIndex = songs.length > 0 ? Math.max(0, Math.min(startIndex, songs.length - 1)) : -1
      notify()
    },

    /**
     * Quita una canción por su posición en la lista.
     * Ajusta el índice actual sin alterar la reproducción si no era la que sonaba.
     *
     * @param {number} index
     * @returns {boolean}
     */
    removeSongByIndex(index) {
      if (index < 0 || index >= songs.length) return false

      const wasCurrent = index === currentIndex
      songs.splice(index, 1)

      if (songs.length === 0) {
        currentIndex = -1
      } else if (index < currentIndex) {
        currentIndex--
      } else if (wasCurrent) {
        if (currentIndex >= songs.length) {
          currentIndex = songs.length - 1
        }
      }

      notify()
      return true
    },

    /**
     * Quita una canción por su ID.
     *
     * @param {number|string} songId
     * @returns {boolean}
     */
    removeSongById(songId) {
      const idx = songs.findIndex(s => Number(s.id) === Number(songId))
      if (idx !== -1) {
        return this.removeSongByIndex(idx)
      }
      return false
    },

    /**
     * Mueve una canción de una posición a otra.
     * Preserva la canción actual reproduciéndose sin importar a dónde se mueva.
     *
     * @param {number} fromIndex
     * @param {number} toIndex
     * @returns {boolean}
     */
    moveSong(fromIndex, toIndex) {
      if (fromIndex < 0 || fromIndex >= songs.length) return false
      if (toIndex < 0 || toIndex >= songs.length) return false
      if (fromIndex === toIndex) return false

      const currentPlayingId = (currentIndex >= 0 && currentIndex < songs.length)
        ? songs[currentIndex].id
        : null

      const [movedSong] = songs.splice(fromIndex, 1)
      songs.splice(toIndex, 0, movedSong)

      // Reubicar currentIndex para que apunte fielmente a la misma canción que estaba sonando
      if (currentPlayingId !== null) {
        const newIndex = songs.findIndex(s => Number(s.id) === Number(currentPlayingId))
        if (newIndex !== -1) {
          currentIndex = newIndex
        }
      }

      notify()
      return true
    },

    /**
     * Sube una posición la canción indicada.
     *
     * @param {number} index
     * @returns {boolean}
     */
    moveUp(index) {
      if (index <= 0) return false
      return this.moveSong(index, index - 1)
    },

    /**
     * Baja una posición la canción indicada.
     *
     * @param {number} index
     * @returns {boolean}
     */
    moveDown(index) {
      if (index < 0 || index >= songs.length - 1) return false
      return this.moveSong(index, index + 1)
    },

    /**
     * Baraja la playlist completa en orden aleatorio manteniendo la canción actual.
     */
    shuffle() {
      if (songs.length <= 1) return
      const currentPlayingId = (currentIndex >= 0 && currentIndex < songs.length)
        ? songs[currentIndex].id
        : null

      // Barajar con Fisher-Yates
      for (let i = songs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [songs[i], songs[j]] = [songs[j], songs[i]]
      }

      if (currentPlayingId !== null) {
        const newIndex = songs.findIndex(s => Number(s.id) === Number(currentPlayingId))
        if (newIndex !== -1) {
          currentIndex = newIndex
        }
      }

      notify()
    },

    /**
     * Establece manualmente la canción activa por su índice.
     *
     * @param {number} index
     * @returns {object|null}
     */
    setCurrentIndex(index) {
      if (index >= 0 && index < songs.length) {
        currentIndex = index
        notify()
        return songs[currentIndex]
      }
      return null
    },

    /**
     * Sincroniza o activa una canción en la playlist.
     * Si ya existe en la lista, actualiza sus metadatos y su posición activa como actual.
     * Si no existe en la lista, se añade automáticamente al final y se selecciona como actual.
     *
     * @param {object} song
     * @returns {object|null} La canción normalizada activa
     */
    setCurrentSong(song) {
      const normalized = normalizePlaylistSong(song)
      if (!normalized) return null

      const idx = songs.findIndex(s => Number(s.id) === Number(normalized.id))
      if (idx !== -1) {
        songs[idx] = normalized
        currentIndex = idx
        notify()
        return songs[currentIndex]
      }

      // No está en la playlist: añadir automáticamente al final y activar como actual
      songs.push(normalized)
      currentIndex = songs.length - 1
      notify()
      return normalized
    },

    /**
     * Sincroniza la posición activa si una canción comenzó a sonar desde fuera.
     * Si no se encuentra y se proporciona el objeto `song`, se añade automáticamente.
     *
     * @param {number|string} songId
     * @param {object} [song]
     * @returns {boolean}
     */
    setCurrentSongById(songId, song = null) {
      const idx = songs.findIndex(s => Number(s.id) === Number(songId))
      if (idx !== -1) {
        if (currentIndex !== idx) {
          currentIndex = idx
          notify()
        }
        return true
      }
      if (song) {
        const res = this.setCurrentSong(song)
        return Boolean(res)
      }
      return false
    },

    /**
     * Avanza a la siguiente canción en la lista.
     *
     * @returns {object|null}
     */
    next() {
      if (this.hasNext()) {
        currentIndex++
        notify()
        return songs[currentIndex]
      }
      return null
    },

    /**
     * Retrocede a la canción anterior en la lista.
     *
     * @returns {object|null}
     */
    prev() {
      if (this.hasPrev()) {
        currentIndex--
        notify()
        return songs[currentIndex]
      }
      return null
    },

    hasNext() {
      return currentIndex >= 0 && currentIndex < songs.length - 1
    },

    hasPrev() {
      return currentIndex > 0
    },

    clear() {
      songs = []
      currentIndex = -1
      notify()
    },

    /**
     * Suscribe un listener a cambios en la playlist.
     *
     * @param {Function} fn
     * @returns {Function} Función para desuscribir
     */
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {}
      listeners.push(fn)
      try {
        fn(getState())
      } catch (_) {}
      return () => {
        listeners = listeners.filter(l => l !== fn)
      }
    }
  }
}

/**
 * Guarda las canciones de la playlist actual como una nueva biblioteca en IndexedDB.
 *
 * @param {string} libraryName
 * @param {Array<object>} playlistSongs
 * @param {object} [deps]
 * @param {object} [deps.libraryService]
 * @returns {Promise<object>} Biblioteca creada
 */
export async function savePlaylistAsLibrary(libraryName, playlistSongs, { libraryService = defaultLibService } = {}) {
  const trimmedName = (libraryName || '').trim()
  if (!trimmedName) {
    throw new Error('El nombre de la biblioteca no puede estar vacío.')
  }

  if (!Array.isArray(playlistSongs) || playlistSongs.length === 0) {
    throw new Error('La lista de reproducción está vacía.')
  }

  // 1. Crear la biblioteca
  const createdLibrary = await libraryService.createLibrary(trimmedName)

  // 2. Asociar cada canción de la playlist a la nueva biblioteca
  for (const song of playlistSongs) {
    if (song && song.id !== undefined) {
      await libraryService.addSongToLibrary(song.id, createdLibrary.id)
    }
  }

  return {
    ...createdLibrary,
    songCount: playlistSongs.length
  }
}

/**
 * Carga todas las canciones de una biblioteca en la playlist en orden actual o aleatorio.
 *
 * @param {number|string} libraryId
 * @param {object} options
 * @param {boolean} [options.shuffle=false]
 * @param {object} options.playlistService
 * @param {object} [options.libraryService]
 * @returns {Promise<number>} Cantidad de canciones cargadas
 */
export async function loadLibraryIntoPlaylist(libraryId, {
  shuffle = false,
  playlistService,
  libraryService = defaultLibService
} = {}) {
  if (!playlistService || typeof playlistService.setSongs !== 'function') {
    throw new Error('playlistService requerido.')
  }

  const songs = await libraryService.getLibrarySongs(libraryId)
  if (!Array.isArray(songs) || songs.length === 0) {
    return 0
  }

  playlistService.setSongs(songs, { shuffle, startIndex: 0 })
  return songs.length
}
