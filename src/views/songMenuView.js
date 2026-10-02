import { listSongs, deleteSong } from '../services/songService.js'
import { importSongPackage, exportLibraryBackup, importLibraryBackup } from '../services/shareService.js'
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
  iconList
} from './icons.js'

export function createSongMenuView({
  containerElement,
  onEnterLyricsMode,
  onManageVideos,
  onCreateNewSong,
  onSearchBetterLyrics,
  onSearchOnlineLyrics,
  onEditSong
}) {
  let songs = []
  let filterQuery = ''
  let statusMessage = ''
  let statusType = 'info' // 'info' | 'success' | 'error'
  let isImportOpen = false
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

  async function loadSongs() {
    try {
      songs = await listSongs()
      render()
    } catch (err) {
      console.error('Error al cargar canciones:', err)
      showStatus('Error al cargar la lista de canciones: ' + err.message, 'error')
    }
  }

  function showStatus(msg, type = 'info') {
    statusMessage = msg
    statusType = type
    render()
  }

  function render() {
    if (!containerElement) return

    const filtered = songs.filter(song => {
      if (!filterQuery) return true
      const q = filterQuery.toLowerCase()
      const titleMatch = (song.title || '').toLowerCase().includes(q)
      const artistMatch = (song.artist || '').toLowerCase().includes(q)
      const genreMatch = (song.genres || []).some(g => g.toLowerCase().includes(q))
      const tagMatch = (song.tags || []).some(t => t.toLowerCase().includes(q))
      return titleMatch || artistMatch || genreMatch || tagMatch
    })

    const songsCardsHtml = filtered.length === 0
      ? `
        <div class="empty-songs-state">
          <div class="empty-icon">${iconMusic}</div>
          <h3>${songs.length === 0 ? 'Aún no hay canciones en tu biblioteca' : 'No se encontraron canciones'}</h3>
          <p>${songs.length === 0 ? 'Crea una canción o importa tu primer paquete JSON o archivo .lyricsfile.yaml para comenzar a cantar.' : 'Prueba buscando con otros términos.'}</p>
          ${songs.length === 0 ? `
            <div class="empty-btn-group">
              <button class="btn btn-primary btn-create-empty-song">${iconPlus} Crear Primera Canción</button>
              <button class="btn btn-secondary btn-search-bl-empty" title="Buscar canciones en BetterLyrics, Genius y LRCLIB">${iconGlobe} Buscar Canción Online</button>
              <button class="btn btn-outline btn-open-import">${iconUpload} Importar Canción</button>
            </div>
          ` : ''}
        </div>
      `
      : filtered.map(song => {
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
                ${(song.genres || []).slice(0, 2).map(g => `<span class="badge badge-genre">${escapeHtml(g)}</span>`).join('')}
                ${(song.tags || []).slice(0, 2).map(t => `<span class="badge badge-tag">#${escapeHtml(t)}</span>`).join('')}
              </div>

              <div class="list-col-videos">
                <div class="videos-pill-list">
                  ${videosSummary}
                </div>
                <button class="btn btn-outline btn-xs btn-manage-videos" data-song-id="${song.id}" title="Gestionar videos y configurar offsets">
                  ${iconSettings} (${videos.length})
                </button>
              </div>

              <div class="list-col-actions">
                <button class="btn btn-xs btn-primary-outline btn-edit-song" data-song-id="${song.id}" title="Crear o editar letras, frases, sílabas e idiomas">
                  ${iconEdit} Editar
                </button>
                <button class="btn btn-xs btn-outline btn-delete-song" data-song-id="${song.id}" title="Eliminar canción de la biblioteca">
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
              <button class="btn btn-xs btn-primary-outline btn-edit-song" data-song-id="${song.id}" title="Crear o editar letras, frases, sílabas e idiomas">
                ${iconEdit} Editar
              </button>
              <button class="btn btn-xs btn-outline btn-delete-song" data-song-id="${song.id}" title="Eliminar canción de la biblioteca">
                ${iconTrash} Eliminar
              </button>
            </div>
          </article>
        `
      }).join('')

    containerElement.innerHTML = `
      <div class="song-menu-view-container">
        <!-- Barra de Título y Operaciones Principales -->
        <div class="menu-top-bar">
          <div class="menu-titles">
            <h2 class="menu-heading">Menú de Selección de Canciones</h2>
            <p class="menu-subheading">Elige una canción para entrar a la pantalla de letra y canto sincronizado.</p>
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
                Arrastra aquí tu paquete de canción <strong>JSON</strong> o archivo <strong>.lyricsfile.yaml</strong>
              </p>
              <label class="btn btn-primary file-input-label">
                ${iconUpload} Seleccionar Archivo
                <input type="file" id="menu-file-input" accept=".json,.yaml,.yml" class="hidden-input" />
              </label>
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
              placeholder="Buscar por título, artista, género o etiqueta..."
              value="${escapeHtml(filterQuery)}"
            />
            ${filterQuery ? `<button class="btn-clear-search" id="btn-clear-search">${iconClose}</button>` : ''}
          </div>
          <div class="menu-filter-right-controls">
            <div class="song-count-badge">
              ${filtered.length} de ${songs.length} canción(es)
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
        // Evitar activar si hizo click en botones o badges
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
        const confirmed = window.confirm(`¿Seguro que deseas eliminar "${target ? target.title : 'esta canción'}" de tu biblioteca local?`)
        if (confirmed) {
          try {
            await deleteSong(songId)
            showStatus('Canción eliminada correctamente.', 'info')
            await loadSongs()
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
        } else {
          const newId = await importSongPackage(parsed)
          showStatus(`Canción "${parsed.metadata?.title || 'Importada'}" agregada con éxito.`, 'success')
        }
      } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
        await importLyricsfileAsNewSong(file)
        showStatus(`Canción importada exitosamente desde archivo Lyricsfile "${file.name}".`, 'success')
      } else {
        throw new Error('Formato no soportado. Debe ser .json o .yaml/.yml')
      }

      isImportOpen = false
      await loadSongs()
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
    refresh: loadSongs,
    getSongs: () => songs
  }
}
