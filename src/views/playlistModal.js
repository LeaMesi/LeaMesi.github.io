import { listSongs } from '../services/songService.js'
import { listLibraries, getLibrarySongs } from '../services/libraryService.js'
import { savePlaylistAsLibrary, loadLibraryIntoPlaylist } from '../services/playlistService.js'
import { showConfirm } from './customPrompt.js'
import {
  iconListMusic,
  iconClose,
  iconPlay,
  iconShuffle,
  iconPlus,
  iconSave,
  iconFolder,
  iconTrash,
  iconChevronUp,
  iconChevronDown,
  iconSearch,
  iconCheck
} from './icons.js'

function escapeHtml(str) {
  if (typeof str !== 'string') return ''
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Crea el componente interactivo modal para gestión de la lista de reproducción (Playlist).
 * Permite añadir, quitar, reordenar canciones, shuffle, guardar como biblioteca y cargar bibliotecas
 * sin pausar ni interrumpir la música que suena de fondo.
 *
 * @param {object} options
 * @param {HTMLElement} options.containerElement
 * @param {object} options.playlistService
 * @param {Function} [options.onPlaySong]
 * @param {Function} [options.onLibraryCreated]
 * @returns {object}
 */
export function createPlaylistModal({
  containerElement,
  playlistService,
  onPlaySong,
  onRemoveSong,
  onLibraryCreated
}) {
  let isOpen = false
  let isSavingAsLib = false
  let isLoadingLib = false
  let isAddingSong = false
  let libraryNameInput = ''
  let selectedLibId = ''
  let searchSongQuery = ''
  let allCatalogSongs = []
  let allLibraries = []
  let statusMessage = ''
  let statusType = 'info' // 'info' | 'success' | 'error'
  let unsubscribePlaylist = null

  async function open() {
    isOpen = true
    isSavingAsLib = false
    isLoadingLib = false
    isAddingSong = false
    statusMessage = ''

    // Cargar datos del catálogo y bibliotecas para los selectores
    try {
      const [songs, libs] = await Promise.all([
        listSongs(),
        listLibraries()
      ])
      allCatalogSongs = songs || []
      allLibraries = libs || []
      if (allLibraries.length > 0) {
        selectedLibId = allLibraries[0].id
      }
    } catch (err) {
      console.error('Error al precargar datos para playlist modal:', err)
    }

    if (containerElement) {
      containerElement.classList.add('is-open')
    }

    // Suscribir a cambios en la playlist para actualizar la UI reactivamente
    if (playlistService && typeof playlistService.subscribe === 'function') {
      if (unsubscribePlaylist) unsubscribePlaylist()
      unsubscribePlaylist = playlistService.subscribe(() => {
        if (isOpen) render()
      })
    }

    render()
  }

  function close() {
    isOpen = false
    if (unsubscribePlaylist) {
      unsubscribePlaylist()
      unsubscribePlaylist = null
    }
    if (containerElement) {
      containerElement.classList.remove('is-open')
      containerElement.innerHTML = ''
    }
  }

  function showStatus(msg, type = 'info') {
    statusMessage = msg
    statusType = type
    render()
  }

  function render() {
    if (!containerElement || !isOpen) return

    const state = playlistService ? playlistService.getState() : { songs: [], currentIndex: -1, count: 0 }
    const songs = state.songs || []
    const currentIndex = state.currentIndex
    const count = songs.length

    // Canciones del catálogo disponibles para añadir (que no están ya en la playlist)
    const availableToAdd = allCatalogSongs.filter(catSong => {
      const alreadyIn = songs.some(plSong => Number(plSong.id) === Number(catSong.id))
      if (alreadyIn) return false
      if (!searchSongQuery) return true
      const q = searchSongQuery.toLowerCase()
      const titleMatch = (catSong.title || '').toLowerCase().includes(q)
      const artistMatch = (catSong.artist || '').toLowerCase().includes(q)
      return titleMatch || artistMatch
    })

    containerElement.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-dialog playlist-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="playlist-dialog-title">
        <header class="modal-header">
          <div>
            <h2 id="playlist-dialog-title" class="playlist-modal-title">
              ${iconListMusic} Lista de Reproducción
              <span class="playlist-count-pill">${count} ${count === 1 ? 'canción' : 'canciones'}</span>
            </h2>
            <p class="subtitle">Gestiona la cola de reproducción sin interrumpir la música actual.</p>
          </div>
          <button class="btn-close-modal" id="btn-close-playlist-modal" title="Cerrar lista de reproducción">${iconClose}</button>
        </header>

        <div class="modal-body playlist-modal-body">
          ${statusMessage ? `
            <div class="status-banner status-${statusType}">
              <span>${escapeHtml(statusMessage)}</span>
              <button class="btn-close-status" id="btn-close-status">${iconClose}</button>
            </div>
          ` : ''}

          <!-- Barra de Acciones de la Playlist -->
          <div class="playlist-toolbar">
            <div class="playlist-toolbar-left">
              <button class="btn btn-xs btn-outline" id="btn-pl-toggle-add" title="Añadir canciones del catálogo">
                ${iconPlus}
              </button>
              <button class="btn btn-xs btn-outline" id="btn-pl-shuffle" title="Barajar canciones en orden aleatorio" ${count <= 1 ? 'disabled' : ''}>
                ${iconShuffle}
              </button>
              <button class="btn btn-xs btn-outline" id="btn-pl-toggle-load-lib" title="Cargar canciones desde una biblioteca">
                ${iconFolder}
              </button>
              <button class="btn btn-xs btn-primary-outline" id="btn-pl-toggle-save-lib" title="Guardar la playlist actual como una nueva biblioteca" ${count === 0 ? 'disabled' : ''}>
                ${iconSave}
              </button>
            </div>
            <div class="playlist-toolbar-right">
              ${count > 0 ? `
                <button class="btn btn-xs btn-outline btn-danger-subtle" id="btn-pl-clear" title="Vaciar la lista de reproducción">
                  ${iconTrash} Vaciar
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Panel Inline: Guardar como Biblioteca -->
          ${isSavingAsLib ? `
            <div class="playlist-inline-panel" id="panel-save-library">
              <div class="inline-panel-header">
                <strong>${iconSave} Guardar Playlist como Nueva Biblioteca</strong>
                <p class="inline-panel-hint">Se creará una nueva biblioteca con las ${count} canciones de la lista actual.</p>
              </div>
              <div class="inline-form-row">
                <input
                  type="text"
                  id="input-save-lib-name"
                  class="search-input"
                  placeholder="Nombre de la biblioteca (ej. Mis Favoritas, Fiesta)..."
                  value="${escapeHtml(libraryNameInput)}"
                />
                <button class="btn btn-sm btn-primary" id="btn-confirm-save-lib">${iconCheck} Guardar</button>
                <button class="btn btn-sm btn-outline" id="btn-cancel-save-lib">Cancelar</button>
              </div>
            </div>
          ` : ''}

          <!-- Panel Inline: Cargar desde Biblioteca -->
          ${isLoadingLib ? `
            <div class="playlist-inline-panel" id="panel-load-library">
              <div class="inline-panel-header">
                <strong>${iconFolder} Cargar Biblioteca en la Playlist</strong>
                <p class="inline-panel-hint">Selecciona una biblioteca para cargar sus canciones en la lista de reproducción.</p>
              </div>
              ${allLibraries.length === 0 ? `
                <p class="text-muted">Aún no tienes bibliotecas creadas. Puedes crear una desde el Menú de Canciones o guardando esta playlist.</p>
              ` : `
                <div class="inline-form-row">
                  <select id="select-lib-to-load" class="select-input select-small" style="flex: 1;">
                    ${allLibraries.map(lib => `
                      <option value="${lib.id}" ${String(selectedLibId) === String(lib.id) ? 'selected' : ''}>
                        ${escapeHtml(lib.name)} (${lib.songCount} canciones)
                      </option>
                    `).join('')}
                  </select>
                  <button class="btn btn-sm btn-primary" id="btn-confirm-load-lib-order" title="Cargar conservando el orden de la biblioteca">
                    ${iconPlay} En orden
                  </button>
                  <button class="btn btn-sm btn-secondary" id="btn-confirm-load-lib-shuffle" title="Cargar y barajar en orden aleatorio">
                    ${iconShuffle} Aleatorio
                  </button>
                  <button class="btn btn-sm btn-outline" id="btn-cancel-load-lib">Cancelar</button>
                </div>
              `}
            </div>
          ` : ''}

          <!-- Panel Inline: Añadir Canción del Catálogo -->
          ${isAddingSong ? `
            <div class="playlist-inline-panel" id="panel-add-song">
              <div class="inline-panel-header">
                <strong>${iconPlus} Añadir Canción a la Lista</strong>
                <p class="inline-panel-hint">Busca y añade canciones de tu catálogo sin interrumpir la reproducción actual.</p>
              </div>
              <div class="search-input-wrapper" style="margin-bottom: 10px;">
                <span class="search-icon">${iconSearch}</span>
                <input
                  type="text"
                  id="input-search-add-song"
                  class="search-input"
                  placeholder="Buscar canción por título o artista..."
                  value="${escapeHtml(searchSongQuery)}"
                />
                ${searchSongQuery ? `<button class="btn-clear-search" id="btn-clear-add-search">${iconClose}</button>` : ''}
              </div>
              <div class="catalog-add-list">
                ${availableToAdd.length === 0 ? `
                  <div class="empty-list-small">No hay más canciones para añadir o no coinciden con la búsqueda.</div>
                ` : availableToAdd.slice(0, 8).map(song => `
                  <div class="catalog-add-item">
                    <div class="catalog-add-info">
                      <span class="catalog-add-title">${escapeHtml(song.title)}</span>
                      <span class="catalog-add-artist">${escapeHtml(song.artist || 'Artista Desconocido')}</span>
                    </div>
                    <button class="btn btn-xs btn-primary btn-do-add-song" data-song-id="${song.id}">
                      ${iconPlus} Añadir
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Lista de Canciones en la Playlist -->
          <div class="playlist-items-container">
            ${count === 0 ? `
              <div class="playlist-empty-state">
                <div class="empty-icon">${iconListMusic}</div>
                <h3>La lista de reproducción está vacía</h3>
                <p>Añade canciones desde tu catálogo o carga una biblioteca completa para comenzar a cantar.</p>
                <div class="empty-btn-group">
                  <button class="btn btn-primary btn-sm" id="btn-empty-add-song">${iconPlus} Añadir Canciones</button>
                  ${allLibraries.length > 0 ? `
                    <button class="btn btn-secondary btn-sm" id="btn-empty-load-lib">${iconFolder} Cargar Biblioteca</button>
                  ` : ''}
                </div>
              </div>
            ` : `
              <div class="playlist-items-list" role="list">
                ${songs.map((song, index) => {
                  const isCurrent = (index === currentIndex)
                  const isFirst = (index === 0)
                  const isLast = (index === count - 1)

                  return `
                    <div class="playlist-item-card ${isCurrent ? 'is-active-item' : ''}" data-index="${index}" data-song-id="${song.id}" role="listitem">
                      <!-- Columna de Estado / Reproducción -->
                      <div class="playlist-col-play">
                        ${isCurrent ? `
                          <span class="badge-now-playing" title="Reproduciéndose en este momento">
                            ${iconPlay} Sonando
                          </span>
                        ` : `
                          <button class="btn-play-item" data-index="${index}" title="Cantar esta canción ahora">
                            ${iconPlay}
                          </button>
                          <span class="item-order-number">#${index + 1}</span>
                        `}
                      </div>

                      <!-- Columna de Información -->
                      <div class="playlist-col-info">
                        <h4 class="playlist-song-title">${escapeHtml(song.title)}</h4>
                        <span class="playlist-song-artist">${escapeHtml(song.artist || 'Artista Desconocido')}</span>
                      </div>

                      <!-- Columna de Posición (Reordenar) -->
                      <div class="playlist-col-reorder" role="group" aria-label="Cambiar posición">
                        <button
                          class="btn btn-xs btn-icon-only btn-move-up"
                          data-index="${index}"
                          title="Subir de posición"
                          ${isFirst ? 'disabled' : ''}
                          aria-label="Subir"
                        >
                          ${iconChevronUp}
                        </button>
                        <button
                          class="btn btn-xs btn-icon-only btn-move-down"
                          data-index="${index}"
                          title="Bajar de posición"
                          ${isLast ? 'disabled' : ''}
                          aria-label="Bajar"
                        >
                          ${iconChevronDown}
                        </button>
                      </div>

                      <!-- Columna de Quitar -->
                      <div class="playlist-col-delete">
                        <button
                          class="btn btn-xs btn-icon-only btn-delete-item"
                          data-index="${index}"
                          title="Quitar de la lista de reproducción"
                          aria-label="Quitar de la playlist"
                        >
                          ${iconTrash}
                        </button>
                      </div>
                    </div>
                  `
                }).join('')}
              </div>
            `}
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    // Cerrar modal
    const closeBtn = containerElement.querySelector('#btn-close-playlist-modal')
    if (closeBtn) closeBtn.addEventListener('click', close)

    const backdrop = containerElement.querySelector('.modal-backdrop')
    if (backdrop) backdrop.addEventListener('click', close)

    // Cerrar status
    const closeStatus = containerElement.querySelector('#btn-close-status')
    if (closeStatus) closeStatus.addEventListener('click', () => {
      statusMessage = ''
      render()
    })

    // Toggle añadir canción
    const toggleAddBtn = containerElement.querySelector('#btn-pl-toggle-add')
    const emptyAddBtn = containerElement.querySelector('#btn-empty-add-song')
    const handleToggleAdd = () => {
      isAddingSong = !isAddingSong
      isSavingAsLib = false
      isLoadingLib = false
      render()
    }
    if (toggleAddBtn) toggleAddBtn.addEventListener('click', handleToggleAdd)
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', handleToggleAdd)

    // Toggle guardar biblioteca
    const toggleSaveBtn = containerElement.querySelector('#btn-pl-toggle-save-lib')
    if (toggleSaveBtn) {
      toggleSaveBtn.addEventListener('click', () => {
        isSavingAsLib = !isSavingAsLib
        isLoadingLib = false
        isAddingSong = false
        if (isSavingAsLib && !libraryNameInput) {
          libraryNameInput = 'Mi Playlist ' + new Date().toLocaleDateString()
        }
        render()
      })
    }

    // Confirmar guardar biblioteca
    const confirmSaveBtn = containerElement.querySelector('#btn-confirm-save-lib')
    const inputSaveLib = containerElement.querySelector('#input-save-lib-name')
    if (inputSaveLib) {
      inputSaveLib.addEventListener('input', (e) => {
        libraryNameInput = e.target.value
      })
      inputSaveLib.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          if (confirmSaveBtn) confirmSaveBtn.click()
        }
      })
    }
    if (confirmSaveBtn) {
      confirmSaveBtn.addEventListener('click', async () => {
        const name = (libraryNameInput || '').trim()
        if (!name) {
          showStatus('Por favor ingresa un nombre para la nueva biblioteca.', 'error')
          return
        }

        try {
          const playlistSongs = playlistService.getSongs()
          const createdLib = await savePlaylistAsLibrary(name, playlistSongs)
          isSavingAsLib = false
          libraryNameInput = ''
          showStatus(`¡Biblioteca "${createdLib.name}" creada con éxito con ${createdLib.songCount} canciones!`, 'success')

          // Refrescar bibliotecas para el dropdown
          allLibraries = await listLibraries()
          if (onLibraryCreated) onLibraryCreated(createdLib)
        } catch (err) {
          showStatus(err.message, 'error')
        }
      })
    }

    const cancelSaveBtn = containerElement.querySelector('#btn-cancel-save-lib')
    if (cancelSaveBtn) {
      cancelSaveBtn.addEventListener('click', () => {
        isSavingAsLib = false
        render()
      })
    }

    // Toggle cargar biblioteca
    const toggleLoadBtn = containerElement.querySelector('#btn-pl-toggle-load-lib')
    const emptyLoadBtn = containerElement.querySelector('#btn-empty-load-lib')
    const handleToggleLoad = () => {
      isLoadingLib = !isLoadingLib
      isSavingAsLib = false
      isAddingSong = false
      render()
    }
    if (toggleLoadBtn) toggleLoadBtn.addEventListener('click', handleToggleLoad)
    if (emptyLoadBtn) emptyLoadBtn.addEventListener('click', handleToggleLoad)

    // Select biblioteca a cargar
    const selectLibToLoad = containerElement.querySelector('#select-lib-to-load')
    if (selectLibToLoad) {
      selectLibToLoad.addEventListener('change', (e) => {
        selectedLibId = e.target.value
      })
    }

    // Confirmar cargar en orden
    const btnLoadOrder = containerElement.querySelector('#btn-confirm-load-lib-order')
    if (btnLoadOrder) {
      btnLoadOrder.addEventListener('click', async () => {
        if (!selectedLibId) return
        try {
          const loaded = await loadLibraryIntoPlaylist(selectedLibId, {
            shuffle: false,
            playlistService
          })
          isLoadingLib = false
          showStatus(`¡Se cargaron ${loaded} canciones en la lista de reproducción!`, 'success')
        } catch (err) {
          showStatus(err.message, 'error')
        }
      })
    }

    // Confirmar cargar aleatorio
    const btnLoadShuffle = containerElement.querySelector('#btn-confirm-load-lib-shuffle')
    if (btnLoadShuffle) {
      btnLoadShuffle.addEventListener('click', async () => {
        if (!selectedLibId) return
        try {
          const loaded = await loadLibraryIntoPlaylist(selectedLibId, {
            shuffle: true,
            playlistService
          })
          isLoadingLib = false
          showStatus(`¡Se cargaron ${loaded} canciones en orden aleatorio (shuffle)!`, 'success')
        } catch (err) {
          showStatus(err.message, 'error')
        }
      })
    }

    const cancelLoadBtn = containerElement.querySelector('#btn-cancel-load-lib')
    if (cancelLoadBtn) {
      cancelLoadBtn.addEventListener('click', () => {
        isLoadingLib = false
        render()
      })
    }

    // Buscador en añadir canción
    const searchAddInput = containerElement.querySelector('#input-search-add-song')
    if (searchAddInput) {
      searchAddInput.addEventListener('input', (e) => {
        searchSongQuery = e.target.value
        render()
        const renewedInput = containerElement.querySelector('#input-search-add-song')
        if (renewedInput) {
          renewedInput.focus()
          renewedInput.selectionStart = renewedInput.selectionEnd = renewedInput.value.length
        }
      })
    }

    const clearSearchBtn = containerElement.querySelector('#btn-clear-add-search')
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchSongQuery = ''
        render()
      })
    }

    // Botones añadir canción puntual
    containerElement.querySelectorAll('.btn-do-add-song').forEach(btn => {
      btn.addEventListener('click', () => {
        const sId = btn.dataset.songId
        const songToAdd = allCatalogSongs.find(s => Number(s.id) === Number(sId))
        if (songToAdd) {
          playlistService.addSong(songToAdd)
          showStatus(`"${songToAdd.title}" añadida a la lista de reproducción.`, 'success')
        }
      })
    })

    // Shuffle botón principal
    const btnShuffle = containerElement.querySelector('#btn-pl-shuffle')
    if (btnShuffle) {
      btnShuffle.addEventListener('click', () => {
        playlistService.shuffle()
        showStatus('Lista barajada en orden aleatorio.', 'info')
      })
    }

    // Vaciar playlist
    const btnClear = containerElement.querySelector('#btn-pl-clear')
    if (btnClear) {
      btnClear.addEventListener('click', async () => {
        const confirmed = await showConfirm({
          title: 'Vaciar Lista de Reproducción',
          message: '¿Seguro que deseas vaciar la lista de reproducción?',
          confirmText: 'Vaciar',
          isDestructive: true
        })
        if (confirmed) {
          playlistService.clear()
          showStatus('Lista de reproducción vaciada.', 'info')
        }
      })
    }

    // Reproducir canción puntual desde la lista
    containerElement.querySelectorAll('.btn-play-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index)
        const targetSong = playlistService.setCurrentIndex(idx)
        if (targetSong && onPlaySong) {
          onPlaySong(targetSong)
        }
      })
    })

    // Subir posición
    containerElement.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index)
        playlistService.moveUp(idx)
      })
    })

    // Bajar posición
    containerElement.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index)
        playlistService.moveDown(idx)
      })
    })

    // Quitar de la lista
    containerElement.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index)
        const songsList = playlistService.getSongs()
        const targetSong = songsList[idx]
        playlistService.removeSongByIndex(idx)
        if (onRemoveSong && targetSong) {
          onRemoveSong(targetSong)
        }
      })
    })
  }

  return {
    open,
    close,
    render,
    isOpen: () => isOpen
  }
}
