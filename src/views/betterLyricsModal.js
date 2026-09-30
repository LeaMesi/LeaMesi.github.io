// Modal interactivo para buscar canciones en BetterLyrics / Unison
// Permite búsqueda exhaustiva por:
// - Modo General (texto libre o detección de videoId)
// - Solo por Artista (filtro estricto garantizando que el 100% de los resultados pertenezcan al artista)
// - Artista y Título (coincidencia de alta precisión con fallback inteligente)
// - Video o Enlace de YouTube / YouTube Music (sincronizaciones oficiales y variantes)
// Con filtros de sincronización (todas, sílabas, versos) y traducción automática.

import {
  searchBetterLyrics,
  fetchBetterLyricsDetails,
  buildSongPackageFromBetterLyrics
} from '../services/betterLyricsService.js'
import { formatTime } from '../lyrics/timing.js'
import {
  iconSearch,
  iconClose,
  iconMic,
  iconGlobe,
  iconLink,
  iconMusicNote
} from './icons.js'

function escapeHtml(str) {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function createBetterLyricsModal({ containerElement, onSongReady }) {
  let isOpen = false
  let activeMode = 'general' // 'general' | 'artist' | 'artist_song' | 'video'
  let generalQuery = ''
  let artistQuery = ''
  let songQuery = ''
  let videoQuery = ''
  let strictArtist = true
  let syncFilter = 'all' // 'all' | 'richsync' | 'linesync'
  let selectedTranslateLang = 'es'
  let isSearching = false
  let isImporting = false
  let searchResults = []
  let statusMessage = ''
  let statusType = 'info' // 'info' | 'success' | 'error'
  let activeLoadingItemId = null
  let lastSearchSummary = ''

  function open() {
    isOpen = true
    statusMessage = ''
    render()
    focusActiveInput()
  }

  function close() {
    isOpen = false
    statusMessage = ''
    render()
  }

  function focusActiveInput() {
    setTimeout(() => {
      if (!containerElement) return
      let targetInput = null
      if (activeMode === 'general') targetInput = containerElement.querySelector('#bl-input-general')
      else if (activeMode === 'artist') targetInput = containerElement.querySelector('#bl-input-artist')
      else if (activeMode === 'artist_song') targetInput = containerElement.querySelector('#bl-input-as-artist')
      else if (activeMode === 'video') targetInput = containerElement.querySelector('#bl-input-video')

      if (targetInput) targetInput.focus()
    }, 80)
  }

  function readFormInputs() {
    if (!containerElement) return
    const genEl = containerElement.querySelector('#bl-input-general')
    if (genEl) generalQuery = genEl.value.trim()

    const artEl = containerElement.querySelector('#bl-input-artist')
    if (artEl) artistQuery = artEl.value.trim()

    const asArtEl = containerElement.querySelector('#bl-input-as-artist')
    if (asArtEl) artistQuery = asArtEl.value.trim()

    const asSongEl = containerElement.querySelector('#bl-input-as-song')
    if (asSongEl) songQuery = asSongEl.value.trim()

    const vidEl = containerElement.querySelector('#bl-input-video')
    if (vidEl) videoQuery = vidEl.value.trim()

    const strictEl = containerElement.querySelector('#bl-check-strict')
    if (strictEl) strictArtist = strictEl.checked
  }

  async function handleSearch() {
    readFormInputs()

    let validationMsg = ''
    if (activeMode === 'general' && !generalQuery) {
      validationMsg = 'Ingresá un término para buscar en BetterLyrics.'
    } else if (activeMode === 'artist' && !artistQuery) {
      validationMsg = 'Ingresá el nombre del artista o banda para buscar sus canciones.'
    } else if (activeMode === 'artist_song' && !artistQuery && !songQuery) {
      validationMsg = 'Ingresá al menos el artista o el título de la canción.'
    } else if (activeMode === 'video' && !videoQuery) {
      validationMsg = 'Pegá el enlace de YouTube o el Video ID.'
    }

    if (validationMsg) {
      statusMessage = validationMsg
      statusType = 'error'
      render()
      return
    }

    isSearching = true
    statusMessage = ''
    lastSearchSummary = ''
    render()

    try {
      searchResults = await searchBetterLyrics({
        mode: activeMode,
        query: generalQuery,
        artist: artistQuery,
        song: songQuery,
        videoId: videoQuery,
        strictArtist,
        syncFilter,
        limit: 50
      })

      if (searchResults.length === 0) {
        if (activeMode === 'artist') {
          statusMessage = `No se encontraron canciones para el artista "${artistQuery}". Si querés ver más opciones, probá destildar el filtro estricto o buscar en Modo General.`
        } else if (activeMode === 'artist_song') {
          statusMessage = `No se encontraron coincidencias para "${artistQuery} - ${songQuery}". Probá buscar solo por artista o por título en Modo General.`
        } else if (activeMode === 'video') {
          statusMessage = `No se encontraron letras comunitarias registradas para este video de YouTube. Probá buscar por nombre de artista o canción.`
        } else {
          statusMessage = `No se encontraron resultados para "${generalQuery}". Probá con otro artista o título.`
        }
        statusType = 'info'
      } else {
        if (activeMode === 'artist') {
          lastSearchSummary = `${searchResults.length} canción(es) ${strictArtist ? '100% de' : 'relacionadas a'} "${artistQuery}"`
        } else if (activeMode === 'artist_song') {
          lastSearchSummary = `${searchResults.length} resultado(s) para "${artistQuery || ''} ${songQuery ? `• ${songQuery}` : ''}"`
        } else if (activeMode === 'video') {
          lastSearchSummary = `${searchResults.length} versión(es) para el video de YouTube`
        } else {
          lastSearchSummary = `${searchResults.length} resultado(s) para "${generalQuery}"`
        }
      }
    } catch (err) {
      console.error('Error buscando en BetterLyrics:', err)
      statusMessage = 'Error al conectar con BetterLyrics / Unison: ' + err.message
      statusType = 'error'
    } finally {
      isSearching = false
      render()
    }
  }

  async function handleSelectSong(item) {
    if (isImporting) return
    isImporting = true
    activeLoadingItemId = item.id
    statusMessage = `Descargando letra y procesando "${item.song}"...`
    statusType = 'info'
    render()

    try {
      // 1. Obtener documento completo con timestamps
      const details = await fetchBetterLyricsDetails(item.id, item.videoId, item.song, item.artist)

      // 2. Si se solicitó traducción, traducir durante el armado del paquete
      const songPackage = await buildSongPackageFromBetterLyrics(details, {
        translateTo: selectedTranslateLang || null
      })

      // 3. Cerrar modal y notificar al orquestador principal
      close()
      if (onSongReady) {
        onSongReady(songPackage)
      }
    } catch (err) {
      console.error('Error al preparar la canción:', err)
      statusMessage = 'Error al procesar la letra: ' + err.message
      statusType = 'error'
      isImporting = false
      activeLoadingItemId = null
      render()
    }
  }

  function render() {
    if (!containerElement) return

    if (!isOpen) {
      containerElement.innerHTML = ''
      containerElement.classList.remove('is-open')
      return
    }

    containerElement.classList.add('is-open')

    const resultsListHtml = searchResults.length === 0 && !isSearching
      ? `
        <div class="bl-empty-state">
          <div class="bl-empty-icon">${iconGlobe}</div>
          <p class="bl-empty-title">Explorador de Letras Comunitarias</p>
          <p class="bl-empty-desc">
            Buscá letras sincronizadas palabra por palabra o sílaba a sílaba directamente desde el catálogo de BetterLyrics y Unison.
          </p>
          <div class="bl-suggestions-pills">
            <span class="bl-suggestion-tag" data-mode="artist" data-val="Queen">Queen</span>
            <span class="bl-suggestion-tag" data-mode="artist" data-val="Coldplay">Coldplay</span>
            <span class="bl-suggestion-tag" data-mode="artist" data-val="Soda Stereo">Soda Stereo</span>
            <span class="bl-suggestion-tag" data-mode="artist_song" data-artist="Queen" data-song="Bohemian Rhapsody">Bohemian Rhapsody</span>
            <span class="bl-suggestion-tag" data-mode="artist_song" data-artist="Coldplay" data-song="Clocks">Coldplay - Clocks</span>
            <span class="bl-suggestion-tag" data-mode="general" data-val="Radiohead Creep">Radiohead Creep</span>
          </div>
        </div>
      `
      : searchResults.map(item => {
        const isThisLoading = isImporting && activeLoadingItemId === item.id
        const isRich = item.syncType === 'richsync'
        const durStr = item.duration > 0 ? formatTime(item.duration) : '--:--'

        return `
          <div class="bl-result-card ${isThisLoading ? 'is-loading' : ''}">
            <div class="bl-card-main">
              <div class="bl-card-titles">
                <h4 class="bl-card-song">
                  ${escapeHtml(item.song)}
                  ${item.isExactArtist ? '<span class="badge badge-verified" title="Artista verificado y coincidente">Artista Verificado</span>' : ''}
                </h4>
                <p class="bl-card-artist">
                  ${escapeHtml(item.artist)}
                  ${item.album ? `• <span class="bl-album">${escapeHtml(item.album)}</span>` : ''}
                </p>
              </div>
              <div class="bl-card-badges">
                ${isRich ? '<span class="badge badge-richsync" title="Sincronización exacta por sílabas o palabras">Sílaba a Sílaba</span>' : '<span class="badge badge-linesync" title="Sincronización por versos completos">Por Versos</span>'}
                <span class="badge badge-format">${escapeHtml((item.format || 'ttml').toUpperCase())}</span>
                <span class="badge badge-duration">${durStr}</span>
                <span class="badge badge-lang-code">${escapeHtml((item.language || 'en').toUpperCase())}</span>
                ${item.confidence && item.confidence !== 'low' ? `<span class="badge badge-confidence">${escapeHtml(item.confidence)}</span>` : ''}
              </div>
            </div>

            <div class="bl-card-actions">
              <button
                class="btn btn-primary btn-load-bl-song"
                data-item-id="${item.id}"
                ${isImporting ? 'disabled' : ''}
              >
                ${isThisLoading ? '<span class="bl-mini-spinner"></span> Preparando...' : `${iconMic} Cargar en Editor`}
              </button>
            </div>
          </div>
        `
      }).join('')

    // Renderizado dinámico de campos de búsqueda según activeMode
    let inputControlsHtml = ''
    if (activeMode === 'general') {
      inputControlsHtml = `
        <div class="bl-search-input-wrap">
          <span class="bl-search-icon">${iconSearch}</span>
          <input
            type="text"
            id="bl-input-general"
            class="input-text bl-search-input"
            placeholder="Buscar por canción, artista o pegá un enlace de YouTube..."
            value="${escapeHtml(generalQuery)}"
            autocomplete="off"
          />
        </div>
      `
    } else if (activeMode === 'artist') {
      inputControlsHtml = `
        <div class="bl-artist-mode-wrap">
          <div class="bl-search-input-wrap">
            <span class="bl-search-icon">${iconMic}</span>
            <input
              type="text"
              id="bl-input-artist"
              class="input-text bl-search-input"
              placeholder="Nombre del artista o banda (ej. Queen, Soda Stereo, Coldplay)..."
              value="${escapeHtml(artistQuery)}"
              autocomplete="off"
            />
          </div>
          <label class="bl-checkbox-label" title="Si está activo, descarta temas de otros artistas que solo contengan este nombre en su título">
            <input type="checkbox" id="bl-check-strict" ${strictArtist ? 'checked' : ''} />
            <span>Filtro estricto: Solo canciones 100% de este artista o sus colaboraciones directas</span>
          </label>
        </div>
      `
    } else if (activeMode === 'artist_song') {
      inputControlsHtml = `
        <div class="bl-dual-inputs-grid">
          <div class="bl-search-input-wrap">
            <span class="bl-search-icon">${iconMic}</span>
            <input
              type="text"
              id="bl-input-as-artist"
              class="input-text bl-search-input"
              placeholder="Artista o banda (ej. Queen)"
              value="${escapeHtml(artistQuery)}"
              autocomplete="off"
            />
          </div>
          <div class="bl-search-input-wrap">
            <span class="bl-search-icon">${iconMusicNote}</span>
            <input
              type="text"
              id="bl-input-as-song"
              class="input-text bl-search-input"
              placeholder="Título de la canción (ej. Bohemian Rhapsody)"
              value="${escapeHtml(songQuery)}"
              autocomplete="off"
            />
          </div>
        </div>
      `
    } else if (activeMode === 'video') {
      inputControlsHtml = `
        <div class="bl-search-input-wrap">
          <span class="bl-search-icon">${iconLink}</span>
          <input
            type="text"
            id="bl-input-video"
            class="input-text bl-search-input"
            placeholder="Pegá URL de YouTube / YouTube Music o Video ID (ej. https://music.youtube.com/watch?v=... o 577Y50JkyVY)..."
            value="${escapeHtml(videoQuery)}"
            autocomplete="off"
          />
        </div>
      `
    }

    containerElement.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-dialog modal-dialog-lg bl-modal-dialog">
        <header class="modal-header">
          <div class="header-titles">
            <h2>${iconGlobe} Explorador de Letras en BetterLyrics</h2>
            <p class="subtitle">Búsqueda avanzada por artista, título o enlace de YouTube con descarga directa al editor.</p>
          </div>
          <button class="btn-close-modal" aria-label="Cerrar">${iconClose}</button>
        </header>

        ${statusMessage ? `
          <div class="status-alert status-${statusType}">
            ${escapeHtml(statusMessage)}
          </div>
        ` : ''}

        <div class="modal-body bl-modal-body">
          <!-- Barra de Búsqueda y Modos -->
          <div class="bl-search-toolbar">
            <!-- Pestañas de Modos de Búsqueda -->
            <div class="bl-mode-tabs-bar">
              <button
                type="button"
                class="bl-mode-tab ${activeMode === 'general' ? 'active' : ''}"
                data-mode="general"
                title="Búsqueda rápida libre por cualquier término o enlace"
              >
                ${iconSearch} Búsqueda Rápida
              </button>
              <button
                type="button"
                class="bl-mode-tab ${activeMode === 'artist' ? 'active' : ''}"
                data-mode="artist"
                title="Búsqueda estricta por artista: todos los resultados pertenecen a ese artista"
              >
                ${iconMic} Solo por Artista
              </button>
              <button
                type="button"
                class="bl-mode-tab ${activeMode === 'artist_song' ? 'active' : ''}"
                data-mode="artist_song"
                title="Búsqueda combinada exacta por Artista y Título de canción"
              >
                ${iconMusicNote} Artista y Título
              </button>
              <button
                type="button"
                class="bl-mode-tab ${activeMode === 'video' ? 'active' : ''}"
                data-mode="video"
                title="Búsqueda directa por enlace de YouTube o YouTube Music o ID"
              >
                ${iconLink} Enlace / Video ID
              </button>
            </div>

            <!-- Formulario dinámico de inputs -->
            <form id="form-bl-search" class="bl-search-form">
              <div class="bl-inputs-block">
                ${inputControlsHtml}
              </div>

              <!-- Filtros de Sincronización y Traducción -->
              <div class="bl-filter-options-bar">
                <div class="bl-sync-filter-pills">
                  <span class="bl-filter-label">Sincronización:</span>
                  <button type="button" class="bl-filter-pill ${syncFilter === 'all' ? 'active' : ''}" data-sync="all">Todas</button>
                  <button type="button" class="bl-filter-pill ${syncFilter === 'richsync' ? 'active' : ''}" data-sync="richsync" title="Solo canciones con marcas de tiempo sílaba por sílaba (TTML)">✨ Sílabas</button>
                  <button type="button" class="bl-filter-pill ${syncFilter === 'linesync' ? 'active' : ''}" data-sync="linesync" title="Canciones con marcas por líneas completas (LRC)">📝 Por Versos</button>
                </div>

                <div class="bl-translation-picker">
                  <label for="bl-trans-select">Traducción:</label>
                  <select id="bl-trans-select" class="select-input select-small">
                    <option value="es" ${selectedTranslateLang === 'es' ? 'selected' : ''}>Español (es)</option>
                    <option value="" ${!selectedTranslateLang ? 'selected' : ''}>(Sin traducción)</option>
                    <option value="en" ${selectedTranslateLang === 'en' ? 'selected' : ''}>Inglés (en)</option>
                    <option value="fr" ${selectedTranslateLang === 'fr' ? 'selected' : ''}>Francés (fr)</option>
                    <option value="pt" ${selectedTranslateLang === 'pt' ? 'selected' : ''}>Portugués (pt)</option>
                    <option value="it" ${selectedTranslateLang === 'it' ? 'selected' : ''}>Italiano (it)</option>
                    <option value="de" ${selectedTranslateLang === 'de' ? 'selected' : ''}>Alemán (de)</option>
                  </select>
                </div>

                <button type="submit" class="btn btn-primary bl-btn-search" ${isSearching ? 'disabled' : ''}>
                  ${isSearching ? '<span class="bl-mini-spinner"></span> Buscando...' : `${iconSearch} Buscar`}
                </button>
              </div>
            </form>
          </div>

          <!-- Header de resultados y resumen -->
          ${lastSearchSummary && !isSearching ? `
            <div class="bl-results-header">
              <span class="bl-results-count">${lastSearchSummary}</span>
              ${syncFilter !== 'all' ? `<span class="bl-results-filter-badge">Filtro: ${syncFilter === 'richsync' ? 'Solo Sílabas' : 'Solo Versos'}</span>` : ''}
            </div>
          ` : ''}

          <!-- Contenedor de Resultados -->
          <div class="bl-results-container">
            ${isSearching ? `
              <div class="bl-loading-state">
                <div class="bl-spinner"></div>
                <p>Consultando catálogo de BetterLyrics y Unison...</p>
              </div>
            ` : resultsListHtml}
          </div>
        </div>

        <footer class="modal-footer">
          <button class="btn btn-outline btn-cancel-modal">Cerrar</button>
        </footer>
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    const backdrop = containerElement.querySelector('.modal-backdrop')
    if (backdrop) backdrop.addEventListener('click', close)

    const closeBtn = containerElement.querySelector('.btn-close-modal')
    if (closeBtn) closeBtn.addEventListener('click', close)

    const cancelBtn = containerElement.querySelector('.btn-cancel-modal')
    if (cancelBtn) cancelBtn.addEventListener('click', close)

    // Cambio de modo de búsqueda
    const modeTabs = containerElement.querySelectorAll('.bl-mode-tab')
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        readFormInputs()
        const newMode = tab.dataset.mode
        if (newMode && newMode !== activeMode) {
          activeMode = newMode
          render()
          focusActiveInput()
        }
      })
    })

    // Filtros de sincronización
    const filterPills = containerElement.querySelectorAll('.bl-filter-pill')
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const sync = pill.dataset.sync
        if (sync && sync !== syncFilter) {
          syncFilter = sync
          // Si ya había resultados, re-ejecutar búsqueda para aplicar filtro inmediatamente
          if (searchResults.length > 0 || lastSearchSummary) {
            handleSearch()
          } else {
            render()
          }
        }
      })
    })

    // Checkbox filtro estricto
    const strictCheckbox = containerElement.querySelector('#bl-check-strict')
    if (strictCheckbox) {
      strictCheckbox.addEventListener('change', (e) => {
        strictArtist = e.target.checked
        if (searchResults.length > 0) {
          handleSearch()
        }
      })
    }

    // Submit del formulario
    const searchForm = containerElement.querySelector('#form-bl-search')
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault()
        handleSearch()
      })
    }

    // Selector de idioma
    const transSelect = containerElement.querySelector('#bl-trans-select')
    if (transSelect) {
      transSelect.addEventListener('change', (e) => {
        selectedTranslateLang = e.target.value
      })
    }

    // Clic en sugerencias iniciales
    const suggestionTags = containerElement.querySelectorAll('.bl-suggestion-tag')
    suggestionTags.forEach(tag => {
      tag.addEventListener('click', () => {
        const mode = tag.dataset.mode || 'general'
        activeMode = mode
        if (mode === 'artist') {
          artistQuery = tag.dataset.val || tag.textContent.trim()
          strictArtist = true
        } else if (mode === 'artist_song') {
          artistQuery = tag.dataset.artist || ''
          songQuery = tag.dataset.song || ''
        } else {
          generalQuery = tag.dataset.val || tag.textContent.trim()
        }
        handleSearch()
      })
    })

    // Botones de carga en editor
    const loadButtons = containerElement.querySelectorAll('.btn-load-bl-song')
    loadButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = Number(btn.dataset.itemId)
        const item = searchResults.find(r => r.id === itemId)
        if (item) {
          handleSelectSong(item)
        }
      })
    })
  }

  return {
    open,
    close,
    isOpen: () => isOpen
  }
}
