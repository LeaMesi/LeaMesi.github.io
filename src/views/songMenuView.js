import { listSongs, deleteSong } from '../services/songService.js'
import {
  importSongPackage,
  exportLibraryBackup,
  importLibraryBackup,
  exportLibraryPackage,
  importLibraryPackage
} from '../services/shareService.js'
import {
  listLibraries,
  createLibrary,
  renameLibrary,
  deleteLibrary,
  setSongLibraries,
  removeSongFromLibrary
} from '../services/libraryService.js'
import { importLyricsfileAsNewSong } from '../services/lyricsfileService.js'
import {
  iconPlus,
  iconEdit,
  iconTrash,
  iconMic,
  iconUpload,
  iconDownload,
  iconSettings,
  iconSearch,
  iconClose,
  iconMusic,
  iconGlobe,
  iconGrid,
  iconList,
  iconFolder,
  iconFolderPlus,
  iconListMusic,
  iconListPlus,
  iconShuffle,
  iconCheck,
  iconPlay
} from './icons.js'

export function createSongMenuView({
  containerElement,
  onEnterLyricsMode,
  onManageVideos,
  onCreateNewSong,
  onSearchBetterLyrics,
  onSearchOnlineLyrics,
  onEditSong,
  onAddToPlaylist,
  onOpenPlaylist,
  onLoadLibraryAsPlaylist
}) {
  let songs = []
  let libraries = []
  let activeLibraryId = 'all' // 'all' | number/string
  let playlistCount = 0
  let filterQuery = ''
  let statusMessage = ''
  let statusType = 'info' // 'info' | 'success' | 'error'
  let isImportOpen = false
  let conflictModalData = null // { existingName, proposedNewName, resolve }
  let editingSongLibraries = null // { song, selectedIds: Set<number>, newLibInput: string }

  const savedViewMode = typeof localStorage !== 'undefined' ? localStorage.getItem('saranga_menu_view_mode') : null
  let viewMode = (savedViewMode === 'list' || savedViewMode === 'grid') ? savedViewMode : 'grid'

  function setViewMode(mode) {
    if (mode !== 'grid' && mode !== 'list') return
    if (viewMode === mode) return
    viewMode = mode
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('saranga_menu_view_mode', mode)
    }
    render()
  }

  async function loadData() {
    try {
      const [loadedSongs, loadedLibraries] = await Promise.all([
        listSongs(),
        listLibraries()
      ])
      songs = loadedSongs
      libraries = loadedLibraries

      if (activeLibraryId !== 'all') {
        const exists = libraries.some(l => Number(l.id) === Number(activeLibraryId))
        if (!exists) activeLibraryId = 'all'
      }

      render()
    } catch (err) {
      console.error('Error al cargar canciones y bibliotecas:', err)
      showStatus('Error al cargar datos: ' + err.message, 'error')
    }
  }

  function showStatus(msg, type = 'info') {
    statusMessage = msg
    statusType = type
    render()
  }

  function promptConflictChoice({ existingName, proposedNewName }) {
    return new Promise((resolve) => {
      conflictModalData = {
        existingName,
        proposedNewName,
        resolve
      }
      render()
    })
  }

  function render() {
    if (!containerElement) return

    // 1. Filtrar canciones por biblioteca activa
    let candidateSongs = songs
    let activeLibrary = null

    if (activeLibraryId !== 'all') {
      activeLibrary = libraries.find(l => Number(l.id) === Number(activeLibraryId)) || null
      if (activeLibrary) {
        candidateSongs = songs.filter(s =>
          Array.isArray(s.libraries) && s.libraries.some(l => Number(l.id) === Number(activeLibrary.id))
        )
      }
    }

    // 2. Filtrar por término de búsqueda
    const filtered = candidateSongs.filter(song => {
      if (!filterQuery) return true
      const q = filterQuery.toLowerCase()
      const titleMatch = (song.title || '').toLowerCase().includes(q)
      const artistMatch = (song.artist || '').toLowerCase().includes(q)
      const genreMatch = (song.genres || []).some(g => g.toLowerCase().includes(q))
      const tagMatch = (song.tags || []).some(t => t.toLowerCase().includes(q))
      const libMatch = (song.libraries || []).some(l => (l.name || '').toLowerCase().includes(q))
      return titleMatch || artistMatch || genreMatch || tagMatch || libMatch
    })

    // 3. Renderizar listado o estado vacío
    let songsCardsHtml = ''
    if (filtered.length === 0) {
      if (activeLibraryId !== 'all' && candidateSongs.length === 0 && activeLibrary) {
        songsCardsHtml = `
          <div class="empty-songs-state">
            <div class="empty-icon">${iconFolder}</div>
            <h3>Esta biblioteca aún no tiene canciones</h3>
            <p>Puedes añadir canciones a "<strong>${escapeHtml(activeLibrary.name)}</strong>" navegando a la opción <strong>Todas</strong> y pulsando en <strong>${iconFolder} Bibliotecas</strong> en cualquier canción.</p>
            <div class="empty-btn-group">
              <button class="btn btn-primary btn-view-all-songs">${iconMusic} Ver Todas las Canciones</button>
            </div>
          </div>
        `
      } else if (songs.length === 0) {
        songsCardsHtml = `
          <div class="empty-songs-state">
            <div class="empty-icon">${iconMusic}</div>
            <h3>Aún no hay canciones en tu biblioteca</h3>
            <p>Crea una canción o importa tu primer paquete JSON o archivo .lyricsfile.yaml para comenzar a cantar.</p>
            <div class="empty-btn-group">
              <button class="btn btn-primary btn-create-empty-song">${iconPlus} Crear Primera Canción</button>
              <button class="btn btn-secondary btn-search-bl-empty" title="Buscar canciones en BetterLyrics, Genius y LRCLIB">${iconGlobe} Buscar Canción Online</button>
              <button class="btn btn-outline btn-open-import">${iconUpload} Importar Canción</button>
            </div>
          </div>
        `
      } else {
        songsCardsHtml = `
          <div class="empty-songs-state">
            <div class="empty-icon">${iconSearch}</div>
            <h3>No se encontraron canciones</h3>
            <p>Prueba buscando con otros términos o limpia el filtro de búsqueda.</p>
          </div>
        `
      }
    } else {
      songsCardsHtml = filtered.map(song => {
        const videos = song.videos || []
        const langCount = song.lyrics_data?.languages?.length || 1
        const mainLang = song.lyrics_data?.languages?.find(l => l.isMain)?.name || 'Original'

        const videosSummary = videos.length === 0
          ? '<span class="video-pill-empty">Sin videos asociados</span>'
          : videos.map(v => {
            const off = Number(v.offset) || 0
            const offStr = off !== 0 ? ` (${off > 0 ? '+' : ''}${off}s)` : ''
            return `<span class="video-pill" title="Offset: ${off}s">${escapeHtml(v.name)}${offStr}</span>`
          }).join('')

        const libraryBadges = (song.libraries || []).map(l =>
          `<span class="badge badge-library" title="En biblioteca: ${escapeHtml(l.name)}">${iconFolder} ${escapeHtml(l.name)}</span>`
        ).join('')

        if (viewMode === 'list') {
          return `
            <article class="song-menu-card song-menu-list-row" data-song-id="${song.id}">
              <div class="list-col-main">
                <div class="list-song-icon-wrap" title="Canción">
                  ${iconMusic}
                </div>
                <div class="list-title-group">
                  <h3 class="card-title list-card-title">${escapeHtml(song.title)}</h3>
                  <p class="card-artist list-card-artist">${escapeHtml(song.artist || 'Artista Desconocido')}</p>
                </div>
              </div>

              <div class="list-col-meta">
                <span class="badge badge-lang" title="Idiomas disponibles">${langCount} [${escapeHtml(mainLang)}]</span>
                ${libraryBadges}
                ${(song.genres || []).slice(0, 2).map(g => `<span class="badge badge-genre">${escapeHtml(g)}</span>`).join('')}
                ${(song.tags || []).slice(0, 2).map(t => `<span class="badge badge-tag">#${escapeHtml(t)}</span>`).join('')}
              </div>

              <div class="list-col-videos">
                <div class="videos-pill-list">
                  ${videosSummary}
                </div>
              </div>

              <div class="list-col-actions">
                <button class="btn btn-xs btn-outline btn-song-libraries" data-song-id="${song.id}" title="Organizar en bibliotecas">
                  ${iconFolder} Bibliotecas
                </button>
                ${activeLibrary ? `
                  <button class="btn btn-xs btn-outline btn-remove-from-active-lib" data-song-id="${song.id}" title="Quitar de esta biblioteca">
                    ${iconClose} Quitar
                  </button>
                ` : ''}
                <button class="btn btn-xs btn-outline btn-add-playlist" data-song-id="${song.id}" title="Añadir a la lista de reproducción">
                  ${iconListPlus} + Playlist
                </button>
                <button class="btn btn-xs btn-primary-outline btn-edit-song" data-song-id="${song.id}" title="Crear o editar letras, frases, sílabas e idiomas">
                  ${iconEdit} Editar
                </button>
                <button class="btn btn-xs btn-outline btn-delete-song" data-song-id="${song.id}" title="Eliminar canción de la base de datos local">
                  ${iconTrash}
                </button>
                <button class="btn btn-primary btn-sm btn-enter-lyrics" data-song-id="${song.id}" title="Entrar al modo letra y cantar">
                  ${iconMic} Entrar
                </button>
              </div>
            </article>
          `
        }

        return `
          <article class="song-menu-card" data-song-id="${song.id}">
            <div class="card-header">
              <div class="card-title-group">
                <h3 class="card-title">${escapeHtml(song.title)}</h3>
                <p class="card-artist">${escapeHtml(song.artist || 'Artista Desconocido')}</p>
              </div>
              <button class="btn btn-primary btn-enter-lyrics" data-song-id="${song.id}" title="Entrar al modo letra y cantar">
                ${iconMic} Entrar a Modo Letra
              </button>
            </div>

            <div class="card-meta">
              <div class="meta-row">
                <span class="badge badge-lang" title="Idiomas disponibles">${langCount} idioma(s) [${escapeHtml(mainLang)}]</span>
                ${libraryBadges}
                ${(song.genres || []).slice(0, 2).map(g => `<span class="badge badge-genre">${escapeHtml(g)}</span>`).join('')}
                ${(song.tags || []).slice(0, 2).map(t => `<span class="badge badge-tag">#${escapeHtml(t)}</span>`).join('')}
              </div>

              <div class="card-videos-row">
                <div class="videos-pill-list">
                  ${videosSummary}
                </div>
                <button class="btn btn-outline btn-xs btn-manage-videos" data-song-id="${song.id}" title="Gestionar videos y configurar offsets">
                  ${iconSettings} Videos (${videos.length})
                </button>
              </div>
            </div>

            <div class="card-footer-actions">
              <button class="btn btn-xs btn-outline btn-song-libraries" data-song-id="${song.id}" title="Organizar en bibliotecas">
                ${iconFolder} Bibliotecas
              </button>
              ${activeLibrary ? `
                <button class="btn btn-xs btn-outline btn-remove-from-active-lib" data-song-id="${song.id}" title="Quitar de esta biblioteca">
                  ${iconClose} Quitar
                </button>
              ` : ''}
              <button class="btn btn-xs btn-outline btn-add-playlist" data-song-id="${song.id}" title="Añadir a la lista de reproducción">
                ${iconListPlus} + Playlist
              </button>
              <button class="btn btn-xs btn-primary-outline btn-edit-song" data-song-id="${song.id}" title="Crear o editar letras, frases, sílabas e idiomas">
                ${iconEdit} Editar
              </button>
              <button class="btn btn-xs btn-outline btn-delete-song" data-song-id="${song.id}" title="Eliminar canción de la base de datos local">
                ${iconTrash} Eliminar
              </button>
            </div>
          </article>
        `
      }).join('')
    }

    containerElement.innerHTML = `
      <div class="song-menu-view-container">
        <!-- Barra de Título y Operaciones Principales -->
        <div class="menu-top-bar">
          <div class="menu-titles">
            <h2 class="menu-heading">Menú de Selección de Canciones</h2>
            <p class="menu-subheading">Organiza tus canciones en bibliotecas, expórtalas en grupo y canta con letra sincronizada.</p>
          </div>

          <div class="menu-actions">
            <button class="btn btn-primary" id="btn-create-song" title="Crear una nueva canción desde cero">
              ${iconPlus} Crear Canción
            </button>
            <button class="btn btn-secondary" id="btn-search-betterlyrics" title="Buscar canciones online en BetterLyrics, Genius y LRCLIB">
              ${iconGlobe} Buscar Canción Online
            </button>
            <button class="btn btn-outline btn-toggle-import">
              ${isImportOpen ? `${iconClose} Ocultar` : `${iconUpload} Importar`}
            </button>
            <button class="btn btn-outline" id="btn-top-playlist" title="Ver lista de reproducción activa">
              ${iconListMusic} Playlist (${playlistCount})
            </button>
            <button class="btn btn-outline" id="btn-menu-backup" title="Exportar respaldo de todas las canciones">
              ${iconDownload} Respaldo Completo
            </button>
          </div>
        </div>

        ${statusMessage ? `
          <div class="status-alert status-${statusType}">
            ${escapeHtml(statusMessage)}
          </div>
        ` : ''}

        <!-- Dropzone / Panel de Importación Plegable -->
        ${isImportOpen ? `
          <div class="menu-import-panel">
            <div class="dropzone" id="menu-file-dropzone">
              <p class="dropzone-text">
                Arrastra aquí tu paquete de canción <strong>JSON</strong>, paquete de <strong>Biblioteca</strong> o archivo <strong>.lyricsfile.yaml</strong>
              </p>
              <label class="btn btn-primary file-input-label">
                ${iconUpload} Seleccionar Archivo
                <input type="file" id="menu-file-input" accept=".json,.yaml,.yml" class="hidden-input" />
              </label>
            </div>
          </div>
        ` : ''}

        <!-- Barra de Navegación por Bibliotecas -->
        <nav class="libraries-nav-bar" aria-label="Selector de bibliotecas">
          <div class="libraries-nav-header">
            <span class="libraries-nav-title">${iconFolder} Bibliotecas:</span>
          </div>
          <div class="libraries-tabs-list" role="tablist">
            <button
              type="button"
              class="lib-tab-pill ${activeLibraryId === 'all' ? 'is-active' : ''}"
              data-library-id="all"
              id="lib-tab-all"
              role="tab"
              aria-selected="${activeLibraryId === 'all'}"
            >
              Todas <span class="lib-tab-count">${songs.length}</span>
            </button>
            ${libraries.map(lib => `
              <button
                type="button"
                class="lib-tab-pill ${Number(activeLibraryId) === Number(lib.id) ? 'is-active' : ''}"
                data-library-id="${lib.id}"
                role="tab"
                aria-selected="${Number(activeLibraryId) === Number(lib.id)}"
                title="Biblioteca: ${escapeHtml(lib.name)}"
              >
                ${iconFolder} ${escapeHtml(lib.name)} <span class="lib-tab-count">${lib.songCount}</span>
              </button>
            `).join('')}
            <button
              type="button"
              class="lib-tab-pill btn-new-library"
              id="btn-create-library"
              title="Crear una nueva biblioteca de canciones"
            >
              ${iconFolderPlus} + Nueva Biblioteca
            </button>
          </div>
        </nav>

        <!-- Barra de Herramientas de la Biblioteca Activa -->
        ${activeLibrary ? `
          <div class="active-library-toolbar">
            <div class="active-lib-info">
              <span class="active-lib-badge">${iconFolder} Biblioteca</span>
              <h3 class="active-lib-title">${escapeHtml(activeLibrary.name)}</h3>
              <span class="active-lib-count">${candidateSongs.length} canción(es)</span>
            </div>
            <div class="active-lib-actions">
              <button class="btn btn-xs btn-primary-outline" id="btn-load-library-playlist" title="Cargar canciones en la lista de reproducción (en orden actual)" ${candidateSongs.length === 0 ? 'disabled' : ''}>
                ${iconPlay} Cargar Playlist
              </button>
              <button class="btn btn-xs btn-outline" id="btn-load-library-shuffle" title="Cargar canciones en la lista de reproducción en orden aleatorio (shuffle)" ${candidateSongs.length === 0 ? 'disabled' : ''}>
                ${iconShuffle} Cargar Aleatoria
              </button>
              <button class="btn btn-xs btn-outline" id="btn-rename-active-library" title="Modificar el nombre de esta biblioteca">
                ${iconEdit} Renombrar
              </button>
              <button class="btn btn-xs btn-outline" id="btn-export-active-library" title="Exportar esta biblioteca para compartir con otros usuarios">
                ${iconDownload} Exportar Biblioteca
              </button>
              <button class="btn btn-xs btn-outline btn-danger-subtle" id="btn-delete-active-library" title="Eliminar esta biblioteca">
                ${iconTrash} Eliminar
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Barra de Búsqueda y Filtro -->
        <div class="menu-filter-bar">
          <div class="search-input-wrapper">
            <span class="search-icon">${iconSearch}</span>
            <input
              type="text"
              id="song-search-input"
              class="search-input"
              placeholder="${activeLibrary ? `Buscar en ${activeLibrary.name}...` : 'Buscar por título, artista, género o etiqueta...'}"
              value="${escapeHtml(filterQuery)}"
            />
            ${filterQuery ? `<button class="btn-clear-search" id="btn-clear-search">${iconClose}</button>` : ''}
          </div>
          <div class="menu-filter-right-controls">
            <button class="btn btn-xs btn-outline btn-menu-open-playlist" id="btn-menu-open-playlist" title="Abrir lista de reproducción activa (${playlistCount} canciones)">
              ${iconListMusic} Playlist <span class="playlist-badge-pill ${playlistCount > 0 ? 'has-items' : ''}">${playlistCount}</span>
            </button>
            <div class="song-count-badge">
              ${filtered.length} de ${candidateSongs.length} canción(es)
            </div>
            <div class="view-mode-toggle-group" role="group" aria-label="Cambiar modo de vista">
              <button
                type="button"
                class="btn-view-mode-toggle ${viewMode === 'grid' ? 'is-active' : ''}"
                id="btn-view-grid"
                title="Vista en cuadrícula"
                aria-pressed="${viewMode === 'grid'}"
              >
                ${iconGrid}
              </button>
              <button
                type="button"
                class="btn-view-mode-toggle ${viewMode === 'list' ? 'is-active' : ''}"
                id="btn-view-list"
                title="Vista en lista"
                aria-pressed="${viewMode === 'list'}"
              >
                ${iconList}
              </button>
            </div>
          </div>
        </div>

        <!-- Cuadrícula / Listado de Canciones -->
        <div class="song-cards-grid view-${viewMode}">
          ${songsCardsHtml}
        </div>

        <!-- Modal de Resolución de Conflicto de Biblioteca -->
        ${conflictModalData ? `
          <div class="modal-backdrop is-active"></div>
          <div class="modal-dialog library-conflict-dialog" role="dialog" aria-modal="true" aria-labelledby="conflict-dialog-title">
            <header class="modal-header">
              <h3 id="conflict-dialog-title">${iconFolder} Biblioteca ya existente</h3>
            </header>
            <div class="modal-body">
              <p>Ya existe una biblioteca llamada <strong>"${escapeHtml(conflictModalData.existingName)}"</strong> en tu colección.</p>
              <p>¿Deseas combinar las canciones importadas con la biblioteca existente o crear una nueva biblioteca separada?</p>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" id="btn-conflict-cancel">
                ${iconClose} Cancelar
              </button>
              <button class="btn btn-secondary" id="btn-conflict-create-new">
                ${iconFolderPlus} Crear "${escapeHtml(conflictModalData.proposedNewName)}"
              </button>
              <button class="btn btn-primary" id="btn-conflict-combine">
                ${iconFolder} Combinar con "${escapeHtml(conflictModalData.existingName)}"
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Modal para Organizar Canción en Bibliotecas -->
        ${editingSongLibraries ? `
          <div class="modal-backdrop is-active"></div>
          <div class="modal-dialog song-libraries-modal" role="dialog" aria-modal="true" aria-labelledby="song-lib-dialog-title">
            <header class="modal-header">
              <div class="header-titles">
                <h3 id="song-lib-dialog-title">${iconFolder} Organizar en Bibliotecas</h3>
                <p class="subtitle">Canción: <strong>${escapeHtml(editingSongLibraries.song.title)}</strong></p>
              </div>
              <button class="btn-close-modal" id="btn-close-song-libs" aria-label="Cerrar">${iconClose}</button>
            </header>
            <div class="modal-body">
              <p class="modal-instruction">Selecciona las bibliotecas a las que debe pertenecer esta canción (puede pertenecer a varias):</p>
              
              <div class="libraries-checkbox-list">
                ${libraries.length === 0 ? `
                  <p class="empty-libs-msg">Aún no has creado ninguna biblioteca. ¡Crea una a continuación!</p>
                ` : libraries.map(lib => `
                  <label class="lib-checkbox-item">
                    <input
                      type="checkbox"
                      class="lib-checkbox-input"
                      data-library-id="${lib.id}"
                      ${editingSongLibraries.selectedIds.has(Number(lib.id)) ? 'checked' : ''}
                    />
                    <span class="lib-checkbox-label">
                      ${iconFolder} <strong>${escapeHtml(lib.name)}</strong>
                      <span class="lib-checkbox-count">(${lib.songCount} canciones)</span>
                    </span>
                  </label>
                `).join('')}
              </div>

              <!-- Crear nueva biblioteca al vuelo -->
              <div class="modal-inline-create-lib">
                <input
                  type="text"
                  id="input-inline-lib-name"
                  class="search-input"
                  placeholder="Nombre de nueva biblioteca..."
                />
                <button type="button" class="btn btn-secondary btn-sm" id="btn-inline-create-lib">
                  ${iconPlus} Crear y Añadir
                </button>
              </div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-outline" id="btn-cancel-song-libs">${iconClose} Cancelar</button>
              <button class="btn btn-primary" id="btn-save-song-libs">${iconFolder} Guardar Bibliotecas</button>
            </div>
          </div>
        ` : ''}
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    // Alternar panel de importación
    const toggleImportBtn = containerElement.querySelector('.btn-toggle-import')
    if (toggleImportBtn) {
      toggleImportBtn.addEventListener('click', () => {
        isImportOpen = !isImportOpen
        render()
      })
    }

    const openImportBtn = containerElement.querySelector('.btn-open-import')
    if (openImportBtn) {
      openImportBtn.addEventListener('click', () => {
        isImportOpen = true
        render()
      })
    }

    // Botón "Ver Todas las Canciones" desde estado vacío de biblioteca
    const viewAllSongsBtn = containerElement.querySelector('.btn-view-all-songs')
    if (viewAllSongsBtn) {
      viewAllSongsBtn.addEventListener('click', () => {
        activeLibraryId = 'all'
        render()
      })
    }

    // Pestañas de Bibliotecas
    const libTabButtons = containerElement.querySelectorAll('.lib-tab-pill[data-library-id]')
    libTabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const libId = btn.dataset.libraryId
        activeLibraryId = libId === 'all' ? 'all' : Number(libId)
        render()
      })
    })

    // Crear Nueva Biblioteca
    const createLibBtn = containerElement.querySelector('#btn-create-library')
    if (createLibBtn) {
      createLibBtn.addEventListener('click', async () => {
        const name = window.prompt('Introduce el nombre de la nueva biblioteca:')
        if (name && name.trim()) {
          try {
            const newLib = await createLibrary(name.trim())
            activeLibraryId = newLib.id
            showStatus(`Biblioteca "${newLib.name}" creada con éxito.`, 'success')
            await loadData()
          } catch (err) {
            showStatus('Error al crear biblioteca: ' + err.message, 'error')
          }
        }
      })
    }

    // Cargar Biblioteca Activa como Playlist (en orden)
    const loadLibPlaylistBtn = containerElement.querySelector('#btn-load-library-playlist')
    if (loadLibPlaylistBtn && activeLibraryId !== 'all') {
      loadLibPlaylistBtn.addEventListener('click', async () => {
        if (onLoadLibraryAsPlaylist) {
          const loaded = await onLoadLibraryAsPlaylist(activeLibraryId, { shuffle: false })
          showStatus(`¡Se cargaron ${loaded} canciones de la biblioteca en la playlist!`, 'success')
        }
      })
    }

    // Cargar Biblioteca Activa como Playlist (en orden aleatorio / shuffle)
    const loadLibShuffleBtn = containerElement.querySelector('#btn-load-library-shuffle')
    if (loadLibShuffleBtn && activeLibraryId !== 'all') {
      loadLibShuffleBtn.addEventListener('click', async () => {
        if (onLoadLibraryAsPlaylist) {
          const loaded = await onLoadLibraryAsPlaylist(activeLibraryId, { shuffle: true })
          showStatus(`¡Se cargaron ${loaded} canciones de la biblioteca en orden aleatorio (shuffle)!`, 'success')
        }
      })
    }

    // Abrir Playlist Modal desde el menú
    const openPlBtns = containerElement.querySelectorAll('#btn-menu-open-playlist, #btn-top-playlist')
    openPlBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (onOpenPlaylist) onOpenPlaylist()
      })
    })

    // Botones + Playlist en cada tarjeta / fila de canción
    const addPlBtns = containerElement.querySelectorAll('.btn-add-playlist')
    addPlBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const songId = Number(btn.dataset.songId)
        const targetSong = songs.find(s => Number(s.id) === songId)
        if (targetSong && onAddToPlaylist) {
          const added = onAddToPlaylist(targetSong)
          if (added !== false) {
            btn.innerHTML = `${iconCheck} Añadida`
            btn.classList.add('is-added')
            setTimeout(() => {
              btn.innerHTML = `${iconListPlus} + Playlist`
              btn.classList.remove('is-added')
            }, 1400)
            showStatus(`"${targetSong.title}" añadida a la lista de reproducción.`, 'success')
          } else {
            showStatus(`"${targetSong.title}" ya está en la lista de reproducción.`, 'info')
          }
        }
      })
    })

    // Renombrar Biblioteca Activa
    const renameLibBtn = containerElement.querySelector('#btn-rename-active-library')
    if (renameLibBtn && activeLibraryId !== 'all') {
      renameLibBtn.addEventListener('click', async () => {
        const targetLib = libraries.find(l => Number(l.id) === Number(activeLibraryId))
        if (!targetLib) return
        const newName = window.prompt('Nuevo nombre para la biblioteca:', targetLib.name)
        if (newName && newName.trim() && newName.trim() !== targetLib.name) {
          try {
            await renameLibrary(targetLib.id, newName.trim())
            showStatus(`Biblioteca renombrada a "${newName.trim()}".`, 'success')
            await loadData()
          } catch (err) {
            showStatus('Error al renombrar biblioteca: ' + err.message, 'error')
          }
        }
      })
    }

    // Exportar Biblioteca Activa
    const exportLibBtn = containerElement.querySelector('#btn-export-active-library')
    if (exportLibBtn && activeLibraryId !== 'all') {
      exportLibBtn.addEventListener('click', async () => {
        try {
          const targetLib = libraries.find(l => Number(l.id) === Number(activeLibraryId))
          if (!targetLib) return
          await exportLibraryPackage(targetLib.id)
          showStatus(`Biblioteca "${targetLib.name}" exportada con éxito.`, 'success')
        } catch (err) {
          showStatus('Error al exportar biblioteca: ' + err.message, 'error')
        }
      })
    }

    // Eliminar Biblioteca Activa
    const deleteLibBtn = containerElement.querySelector('#btn-delete-active-library')
    if (deleteLibBtn && activeLibraryId !== 'all') {
      deleteLibBtn.addEventListener('click', async () => {
        const targetLib = libraries.find(l => Number(l.id) === Number(activeLibraryId))
        if (!targetLib) return
        const confirmed = window.confirm(
          `¿Seguro que deseas eliminar la biblioteca "${targetLib.name}"?\n\n` +
          `Nota: Las canciones NO se eliminarán del catálogo general, sólo la biblioteca.`
        )
        if (confirmed) {
          try {
            await deleteLibrary(targetLib.id)
            activeLibraryId = 'all'
            showStatus('Biblioteca eliminada correctamente.', 'info')
            await loadData()
          } catch (err) {
            showStatus('Error al eliminar biblioteca: ' + err.message, 'error')
          }
        }
      })
    }

    // Quitar de biblioteca activa directamente desde la tarjeta
    const removeFromLibButtons = containerElement.querySelectorAll('.btn-remove-from-active-lib')
    removeFromLibButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const songId = Number(btn.dataset.songId)
        const targetSong = songs.find(s => Number(s.id) === songId)
        const targetLib = libraries.find(l => Number(l.id) === Number(activeLibraryId))
        if (!targetSong || !targetLib) return

        const confirmed = window.confirm(`¿Quitar "${targetSong.title}" de la biblioteca "${targetLib.name}"?`)
        if (confirmed) {
          try {
            await removeSongFromLibrary(songId, targetLib.id)
            showStatus(`Canción quitada de "${targetLib.name}".`, 'info')
            await loadData()
          } catch (err) {
            showStatus('Error al quitar de biblioteca: ' + err.message, 'error')
          }
        }
      })
    })

    // Abrir Modal de Organizar en Bibliotecas
    const songLibsButtons = containerElement.querySelectorAll('.btn-song-libraries')
    songLibsButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const songId = Number(btn.dataset.songId)
        const targetSong = songs.find(s => Number(s.id) === songId)
        if (targetSong) {
          const currentIds = (targetSong.libraries || []).map(l => Number(l.id))
          editingSongLibraries = {
            song: targetSong,
            selectedIds: new Set(currentIds)
          }
          render()
        }
      })
    })

    // Eventos dentro del Modal de Organizar en Bibliotecas
    if (editingSongLibraries) {
      const closeSongLibsBtn = containerElement.querySelector('#btn-close-song-libs')
      const cancelSongLibsBtn = containerElement.querySelector('#btn-cancel-song-libs')
      const closeHandler = () => {
        editingSongLibraries = null
        render()
      }
      if (closeSongLibsBtn) closeSongLibsBtn.addEventListener('click', closeHandler)
      if (cancelSongLibsBtn) cancelSongLibsBtn.addEventListener('click', closeHandler)

      // Checkboxes de biblioteca
      const libCheckboxes = containerElement.querySelectorAll('.lib-checkbox-input')
      libCheckboxes.forEach(cb => {
        cb.addEventListener('change', () => {
          const lId = Number(cb.dataset.libraryId)
          if (cb.checked) {
            editingSongLibraries.selectedIds.add(lId)
          } else {
            editingSongLibraries.selectedIds.delete(lId)
          }
        })
      })

      // Crear biblioteca al vuelo dentro del modal
      const inlineCreateBtn = containerElement.querySelector('#btn-inline-create-lib')
      const inlineInput = containerElement.querySelector('#input-inline-lib-name')
      if (inlineCreateBtn && inlineInput) {
        inlineCreateBtn.addEventListener('click', async () => {
          const val = inlineInput.value.trim()
          if (!val) return
          try {
            const created = await createLibrary(val)
            libraries = await listLibraries()
            editingSongLibraries.selectedIds.add(created.id)
            render()
          } catch (err) {
            showStatus('Error al crear biblioteca: ' + err.message, 'error')
          }
        })
      }

      // Guardar cambios de bibliotecas de la canción
      const saveSongLibsBtn = containerElement.querySelector('#btn-save-song-libs')
      if (saveSongLibsBtn) {
        saveSongLibsBtn.addEventListener('click', async () => {
          try {
            const arrIds = Array.from(editingSongLibraries.selectedIds)
            await setSongLibraries(editingSongLibraries.song.id, arrIds)
            showStatus(`Bibliotecas actualizadas para "${editingSongLibraries.song.title}".`, 'success')
            editingSongLibraries = null
            await loadData()
          } catch (err) {
            showStatus('Error al guardar bibliotecas: ' + err.message, 'error')
          }
        })
      }
    }

    // Eventos dentro del Modal de Conflicto al Importar
    if (conflictModalData) {
      const btnCancel = containerElement.querySelector('#btn-conflict-cancel')
      const btnCreateNew = containerElement.querySelector('#btn-conflict-create-new')
      const btnCombine = containerElement.querySelector('#btn-conflict-combine')

      if (btnCancel) {
        btnCancel.addEventListener('click', () => {
          const resolve = conflictModalData.resolve
          conflictModalData = null
          resolve('cancel')
        })
      }
      if (btnCreateNew) {
        btnCreateNew.addEventListener('click', () => {
          const resolve = conflictModalData.resolve
          conflictModalData = null
          resolve('create_new')
        })
      }
      if (btnCombine) {
        btnCombine.addEventListener('click', () => {
          const resolve = conflictModalData.resolve
          conflictModalData = null
          resolve('combine')
        })
      }
    }

    // Crear Canción
    const createSongBtn = containerElement.querySelector('#btn-create-song')
    if (createSongBtn) {
      createSongBtn.addEventListener('click', () => {
        if (onCreateNewSong) onCreateNewSong()
      })
    }

    const createEmptySongBtn = containerElement.querySelector('.btn-create-empty-song')
    if (createEmptySongBtn) {
      createEmptySongBtn.addEventListener('click', () => {
        if (onCreateNewSong) onCreateNewSong()
      })
    }

    // Buscar Canción Online (BetterLyrics / Genius / LRCLIB)
    const onOnlineSearch = onSearchOnlineLyrics || onSearchBetterLyrics
    const searchBetterLyricsBtn = containerElement.querySelector('#btn-search-betterlyrics')
    if (searchBetterLyricsBtn) {
      searchBetterLyricsBtn.addEventListener('click', () => {
        if (onOnlineSearch) onOnlineSearch()
      })
    }

    const searchBlEmptyBtn = containerElement.querySelector('.btn-search-bl-empty')
    if (searchBlEmptyBtn) {
      searchBlEmptyBtn.addEventListener('click', () => {
        if (onOnlineSearch) onOnlineSearch()
      })
    }

    // Buscador
    const searchInput = containerElement.querySelector('#song-search-input')
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        filterQuery = e.target.value
        render()
        const newSearch = containerElement.querySelector('#song-search-input')
        if (newSearch) {
          newSearch.focus()
          newSearch.selectionStart = newSearch.selectionEnd = newSearch.value.length
        }
      })
    }

    const clearSearchBtn = containerElement.querySelector('#btn-clear-search')
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        filterQuery = ''
        render()
      })
    }

    // Conmutadores de Modo de Vista (Cuadrícula / Lista)
    const btnGrid = containerElement.querySelector('#btn-view-grid')
    if (btnGrid) {
      btnGrid.addEventListener('click', () => setViewMode('grid'))
    }

    const btnList = containerElement.querySelector('#btn-view-list')
    if (btnList) {
      btnList.addEventListener('click', () => setViewMode('list'))
    }

    // Entrar a Modo Letra
    const enterButtons = containerElement.querySelectorAll('.btn-enter-lyrics')
    enterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const songId = Number(btn.dataset.songId)
        if (onEnterLyricsMode) onEnterLyricsMode(songId)
      })
    })

    // Click en la tarjeta para entrar a Modo Letra
    const cards = containerElement.querySelectorAll('.song-menu-card')
    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('input')) return
        const songId = Number(card.dataset.songId)
        if (onEnterLyricsMode) onEnterLyricsMode(songId)
      })
    })

    // Editar letra y canción
    const editButtons = containerElement.querySelectorAll('.btn-edit-song')
    editButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const songId = Number(btn.dataset.songId)
        const target = songs.find(s => Number(s.id) === songId)
        if (target && onEditSong) {
          onEditSong(target)
        }
      })
    })

    // Gestionar videos
    const manageButtons = containerElement.querySelectorAll('.btn-manage-videos')
    manageButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const songId = Number(btn.dataset.songId)
        const target = songs.find(s => Number(s.id) === songId)
        if (target && onManageVideos) {
          onManageVideos(target)
        }
      })
    })

    // Eliminar canción
    const deleteButtons = containerElement.querySelectorAll('.btn-delete-song')
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const songId = Number(btn.dataset.songId)
        const target = songs.find(s => Number(s.id) === songId)
        const confirmed = window.confirm(`¿Seguro que deseas eliminar "${target ? target.title : 'esta canción'}" de tu base de datos local?`)
        if (confirmed) {
          try {
            await deleteSong(songId)
            showStatus('Canción eliminada correctamente.', 'info')
            await loadData()
          } catch (err) {
            showStatus('Error al eliminar canción: ' + err.message, 'error')
          }
        }
      })
    })

    // Respaldo completo
    const backupBtn = containerElement.querySelector('#btn-menu-backup')
    if (backupBtn) {
      backupBtn.addEventListener('click', async () => {
        try {
          await exportLibraryBackup()
          showStatus('Respaldo completo exportado con éxito.', 'success')
        } catch (err) {
          showStatus('Error al exportar respaldo: ' + err.message, 'error')
        }
      })
    }

    // Input de archivo para importar
    const fileInput = containerElement.querySelector('#menu-file-input')
    if (fileInput) {
      fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0]
        if (file) await handleImportFile(file)
      })
    }

    // Drag and Drop en importación
    const dropzone = containerElement.querySelector('#menu-file-dropzone')
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault()
        dropzone.classList.add('drag-over')
      })
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over')
      })
      dropzone.addEventListener('drop', async (e) => {
        e.preventDefault()
        dropzone.classList.remove('drag-over')
        const file = e.dataTransfer.files[0]
        if (file) await handleImportFile(file)
      })
    }
  }

  async function handleImportFile(file) {
    const fileName = file.name.toLowerCase()
    try {
      if (fileName.endsWith('.json')) {
        const text = await file.text()
        const parsed = JSON.parse(text)
        if (parsed.type === 'saranga-library-backup') {
          await importLibraryBackup(parsed)
          showStatus('Respaldo de biblioteca restaurado correctamente.', 'success')
          await loadData()
        } else if (parsed.type === 'saranga-library-package' || (parsed.library && Array.isArray(parsed.songs))) {
          const result = await importLibraryPackage(parsed, {
            onConflictChoice: promptConflictChoice
          })
          if (result) {
            showStatus(`Biblioteca "${result.libraryName}" importada con éxito (${result.songCount} canción/es).`, 'success')
            activeLibraryId = result.libraryId
            await loadData()
          } else {
            showStatus('Importación de biblioteca cancelada.', 'info')
            render()
          }
        } else {
          const newId = await importSongPackage(parsed)
          showStatus(`Canción "${parsed.metadata?.title || 'Importada'}" agregada con éxito.`, 'success')
          await loadData()
        }
      } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
        await importLyricsfileAsNewSong(file)
        showStatus(`Canción importada exitosamente desde archivo Lyricsfile "${file.name}".`, 'success')
        await loadData()
      } else {
        throw new Error('Formato no soportado. Debe ser .json o .yaml/.yml')
      }

      isImportOpen = false
    } catch (err) {
      console.error('Error al importar:', err)
      showStatus('Error al importar archivo: ' + err.message, 'error')
    }
  }

  function escapeHtml(str) {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  return {
    render,
    refresh: loadData,
    getSongs: () => songs,
    getLibraries: () => libraries,
    getActiveLibraryId: () => activeLibraryId,
    setActiveLibraryId: (id) => { activeLibraryId = id; render() },
    setPlaylistCount: (count) => {
      playlistCount = Number(count) || 0
      const badge = containerElement?.querySelector('.playlist-badge-pill')
      if (badge) {
        badge.textContent = playlistCount
        if (playlistCount > 0) badge.classList.add('has-items')
        else badge.classList.remove('has-items')
      }
      const topBtn = containerElement?.querySelector('#btn-top-playlist')
      if (topBtn) {
        topBtn.innerHTML = `${iconListMusic} Playlist (${playlistCount})`
      }
    }
  }
}
