// src/views/onlineLyricsModal.js
// Modal interactivo unificado para buscar canciones en línea en múltiples motores:
// - Búsqueda global en "Todas las Fuentes" (BetterLyrics, Genius, LRCLIB)
// - Búsqueda dedicada en BetterLyrics (con sus 4 modos avanzados y filtros de sincronización)
// - Búsqueda dedicada en Genius.com (con metadatos, carátulas y token de acceso opcional)
// - Búsqueda dedicada en LRCLIB (letras sincronizadas LRC y texto plano)
// Con traducción automática e importación directa al editor de SarangaBaranga.

import {
  ONLINE_PROVIDERS,
  searchOnlineLyrics,
  buildSongPackageFromOnlineResult,
  getGeniusToken,
  setGeniusToken,
  hasGeniusToken
} from '../services/onlineLyricsService.js'
import { formatTime } from '../lyrics/timing.js'
import {
  iconSearch,
  iconClose,
  iconGlobe,
  iconLink,
  iconMusicNote,
  iconSparkles,
  iconFileText,
  iconPlus,
  iconCheck
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

export function createOnlineLyricsModal({ containerElement, onSongReady }) {
  let isOpen = false

  // Estado de navegación
  let activeProvider = 'all' // 'all' | 'betterlyrics' | 'genius' | 'lrclib'
  let blActiveMode = 'general' // 'general' | 'artist' | 'artist_song' | 'video'
  let subMode = 'general' // 'general' | 'artist_song' (para genius y lrclib)

  // Términos de búsqueda
  let unifiedQuery = ''
  let blGeneralQuery = ''
  let artistQuery = ''
  let songQuery = ''
  let videoQuery = ''
  let blStrictArtist = true
  let syncFilter = 'all' // 'all' | 'richsync' | 'linesync'
  let selectedTranslateLang = 'es'

  // Token de Genius
  let showGeniusTokenConfig = false
  let geniusTokenInputVal = getGeniusToken()

  // Estados de carga y resultados
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
    geniusTokenInputVal = getGeniusToken()
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
      if (activeProvider === 'all') targetInput = containerElement.querySelector('#online-input-all')
      else if (activeProvider === 'betterlyrics') {
        if (blActiveMode === 'general') targetInput = containerElement.querySelector('#bl-input-general')
        else if (blActiveMode === 'artist') targetInput = containerElement.querySelector('#bl-input-artist')
        else if (blActiveMode === 'artist_song') targetInput = containerElement.querySelector('#bl-input-as-artist')
        else if (blActiveMode === 'video') targetInput = containerElement.querySelector('#bl-input-video')
      } else {
        if (subMode === 'general') targetInput = containerElement.querySelector('#provider-input-general')
        else targetInput = containerElement.querySelector('#provider-input-artist')
      }

      if (targetInput) targetInput.focus()
    }, 80)
  }

  function readFormInputs() {
    if (!containerElement) return

    // 1. Todas las fuentes
    const allEl = containerElement.querySelector('#online-input-all')
    if (allEl) unifiedQuery = allEl.value.trim()

    // 2. BetterLyrics
    const blGenEl = containerElement.querySelector('#bl-input-general')
    if (blGenEl) blGeneralQuery = blGenEl.value.trim()

    const blArtEl = containerElement.querySelector('#bl-input-artist')
    if (blArtEl) artistQuery = blArtEl.value.trim()

    const blAsArtEl = containerElement.querySelector('#bl-input-as-artist')
    if (blAsArtEl) artistQuery = blAsArtEl.value.trim()

    const blAsSongEl = containerElement.querySelector('#bl-input-as-song')
    if (blAsSongEl) songQuery = blAsSongEl.value.trim()

    const blVidEl = containerElement.querySelector('#bl-input-video')
    if (blVidEl) videoQuery = blVidEl.value.trim()

    const strictEl = containerElement.querySelector('#bl-check-strict')
    if (strictEl) blStrictArtist = strictEl.checked

    // 3. Genius / LRCLIB
    const provGenEl = containerElement.querySelector('#provider-input-general')
    if (provGenEl) unifiedQuery = provGenEl.value.trim()

    const provArtEl = containerElement.querySelector('#provider-input-artist')
    if (provArtEl) artistQuery = provArtEl.value.trim()

    const provSongEl = containerElement.querySelector('#provider-input-song')
    if (provSongEl) songQuery = provSongEl.value.trim()

    // 4. Traducción
    const transEl = containerElement.querySelector('#online-select-translate')
    if (transEl) selectedTranslateLang = transEl.value
  }

  async function handleSearch() {
    readFormInputs()

    let validationMsg = ''
    if (activeProvider === 'all') {
      if (!unifiedQuery) validationMsg = 'Ingresá un término para buscar en todas las fuentes.'
    } else if (activeProvider === 'betterlyrics') {
      if (blActiveMode === 'general' && !blGeneralQuery) validationMsg = 'Ingresá un término para buscar en BetterLyrics.'
      else if (blActiveMode === 'artist' && !artistQuery) validationMsg = 'Ingresá el nombre del artista o banda.'
      else if (blActiveMode === 'artist_song' && !artistQuery && !songQuery) validationMsg = 'Ingresá al menos el artista o la canción.'
      else if (blActiveMode === 'video' && !videoQuery) validationMsg = 'Pegá el enlace de YouTube o el Video ID.'
    } else {
      if (subMode === 'general' && !unifiedQuery) validationMsg = 'Ingresá un término para buscar.'
      else if (subMode === 'artist_song' && !artistQuery && !songQuery) validationMsg = 'Ingresá al menos el artista o la canción.'
    }

    if (validationMsg) {
      statusMessage = validationMsg
      statusType = 'error'
      render()
      return
    }

    isSearching = true
    statusMessage = ''
    render()

    try {
      let results = []
      const syncType = syncFilter

      if (activeProvider === 'all') {
        results = await searchOnlineLyrics({
          provider: 'all',
          query: unifiedQuery,
          syncType
        })
        lastSearchSummary = `Búsqueda unificada en todas las fuentes: "${unifiedQuery}"`
      } else if (activeProvider === 'betterlyrics') {
        results = await searchOnlineLyrics({
          provider: 'betterlyrics',
          mode: blActiveMode,
          query: blGeneralQuery,
          artist: artistQuery,
          song: songQuery,
          videoId: videoQuery,
          strictArtist: blStrictArtist,
          syncType
        })
        lastSearchSummary = `Búsqueda en BetterLyrics (${blActiveMode}): "${blGeneralQuery || artistQuery || videoQuery}"`
      } else if (activeProvider === 'genius') {
        results = await searchOnlineLyrics({
          provider: 'genius',
          query: subMode === 'general' ? unifiedQuery : '',
          artist: subMode === 'artist_song' ? artistQuery : '',
          song: subMode === 'artist_song' ? songQuery : ''
        })
        lastSearchSummary = `Búsqueda en Genius: "${subMode === 'general' ? unifiedQuery : `${artistQuery} - ${songQuery}`}"`
      } else if (activeProvider === 'lrclib') {
        results = await searchOnlineLyrics({
          provider: 'lrclib',
          query: subMode === 'general' ? unifiedQuery : '',
          artist: subMode === 'artist_song' ? artistQuery : '',
          song: subMode === 'artist_song' ? songQuery : '',
          syncType
        })
        lastSearchSummary = `Búsqueda en LRCLIB: "${subMode === 'general' ? unifiedQuery : `${artistQuery} - ${songQuery}`}"`
      }

      searchResults = results

      if (results.length === 0) {
        statusMessage = 'No se encontraron resultados para la búsqueda ingresada.'
        statusType = 'info'
      } else {
        statusMessage = `Se encontraron ${results.length} resultado(s).`
        statusType = 'success'
      }
    } catch (err) {
      console.error('Error al buscar canciones online:', err)
      statusMessage = 'Ocurrió un error al consultar los motores de búsqueda: ' + (err.message || err)
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
    statusMessage = `Obteniendo letra desde ${item.sourceName || 'el proveedor'}...`
    statusType = 'info'
    render()

    try {
      const translateTo = selectedTranslateLang !== 'none' ? selectedTranslateLang : null
      const songPackage = await buildSongPackageFromOnlineResult(item, { translateTo })

      close()

      if (onSongReady) {
        onSongReady(songPackage)
      }
    } catch (err) {
      console.error('Error al procesar letra seleccionada:', err)
      statusMessage = 'No se pudo cargar la letra: ' + (err.message || err)
      statusType = 'error'
      isImporting = false
      activeLoadingItemId = null
      render()
    }
  }

  function handleSaveGeniusToken(tokenVal) {
    setGeniusToken(tokenVal)
    geniusTokenInputVal = getGeniusToken()
    statusMessage = hasGeniusToken()
      ? '¡Token de Genius guardado exitosamente!'
      : 'Token de Genius removido.'
    statusType = 'success'
    render()
  }

  function render() {
    if (!containerElement) return

    if (!isOpen) {
      containerElement.innerHTML = ''
      containerElement.classList.remove('is-open')
      return
    }

    containerElement.classList.add('is-open')

    // 1. Pestañas de Proveedor Principal
    const providersTabsHtml = ONLINE_PROVIDERS.map(p => {
      const isSelected = activeProvider === p.id
      let icon = iconGlobe
      if (p.id === 'betterlyrics') icon = iconSparkles
      else if (p.id === 'genius') icon = iconMusicNote
      else if (p.id === 'lrclib') icon = iconFileText

      return `
        <button
          type="button"
          class="online-provider-tab ${isSelected ? 'is-active' : ''} tab-prov-${p.id}"
          data-provider="${p.id}"
        >
          ${icon} <span>${p.name}</span>
        </button>
      `
    }).join('')

    // 2. Formularios de Búsqueda específicos según el Proveedor activo
    let searchFormHtml = ''

    if (activeProvider === 'all') {
      searchFormHtml = `
        <div class="online-inputs-container">
          <div class="search-input-group">
            <span class="search-input-icon">${iconSearch}</span>
            <input
              type="text"
              id="online-input-all"
              class="form-input search-main-input"
              placeholder="Buscar título, artista o enlace (BetterLyrics + Genius + LRCLIB)..."
              value="${escapeHtml(unifiedQuery)}"
            />
            <button type="button" class="btn btn-primary" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
              ${isSearching ? 'Buscando...' : `${iconSearch} Buscar en Todo`}
            </button>
          </div>
          <p class="search-hint-text">
            Consulta en paralelo todos los motores y unifica los resultados con su etiqueta de procedencia.
          </p>
        </div>
      `
    } else if (activeProvider === 'betterlyrics') {
      // Modos de BetterLyrics
      const blModes = [
        { id: 'general', label: 'General / Video' },
        { id: 'artist', label: 'Solo por Artista' },
        { id: 'artist_song', label: 'Artista y Título' },
        { id: 'video', label: 'Enlace / Video YouTube' }
      ]

      const blModeTabsHtml = blModes.map(m => `
        <button
          type="button"
          class="bl-mode-tab ${blActiveMode === m.id ? 'is-active' : ''}"
          data-bl-mode="${m.id}"
        >
          ${m.label}
        </button>
      `).join('')

      let blInputContent = ''
      if (blActiveMode === 'general') {
        blInputContent = `
          <div class="search-input-group">
            <span class="search-input-icon">${iconSearch}</span>
            <input
              type="text"
              id="bl-input-general"
              class="form-input search-main-input"
              placeholder="Buscar canción, artista o pegar enlace de YouTube..."
              value="${escapeHtml(blGeneralQuery)}"
            />
            <button type="button" class="btn btn-primary" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
              ${isSearching ? 'Buscando...' : `${iconSearch} Buscar`}
            </button>
          </div>
        `
      } else if (blActiveMode === 'artist') {
        blInputContent = `
          <div class="bl-artist-mode-container">
            <div class="search-input-group">
              <span class="search-input-icon">${iconSearch}</span>
              <input
                type="text"
                id="bl-input-artist"
                class="form-input search-main-input"
                placeholder="Nombre exacto del artista (ej. Queen, Soda Stereo, Coldplay)..."
                value="${escapeHtml(artistQuery)}"
              />
              <button type="button" class="btn btn-primary" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
                ${isSearching ? 'Buscando...' : `${iconSearch} Buscar Artista`}
              </button>
            </div>
            <label class="bl-strict-checkbox-label" title="Descarta canciones de otros artistas que incluyan la palabra en el título">
              <input type="checkbox" id="bl-check-strict" ${blStrictArtist ? 'checked' : ''} />
              <span>Filtro estricto: mostrar <strong>exclusivamente</strong> canciones interpretadas por este artista</span>
            </label>
          </div>
        `
      } else if (blActiveMode === 'artist_song') {
        blInputContent = `
          <div class="bl-dual-inputs-grid">
            <div class="input-with-label">
              <label for="bl-input-as-artist" class="field-sublabel">Artista / Banda:</label>
              <input
                type="text"
                id="bl-input-as-artist"
                class="form-input"
                placeholder="ej. Queen"
                value="${escapeHtml(artistQuery)}"
              />
            </div>
            <div class="input-with-label">
              <label for="bl-input-as-song" class="field-sublabel">Título de la Canción:</label>
              <input
                type="text"
                id="bl-input-as-song"
                class="form-input"
                placeholder="ej. Bohemian Rhapsody"
                value="${escapeHtml(songQuery)}"
              />
            </div>
            <div class="dual-search-btn-col">
              <label class="field-sublabel">&nbsp;</label>
              <button type="button" class="btn btn-primary btn-block" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
                ${isSearching ? 'Buscando...' : `${iconSearch} Buscar`}
              </button>
            </div>
          </div>
        `
      } else if (blActiveMode === 'video') {
        blInputContent = `
          <div class="search-input-group">
            <span class="search-input-icon">${iconLink}</span>
            <input
              type="text"
              id="bl-input-video"
              class="form-input search-main-input"
              placeholder="Pegá el enlace de YouTube o YouTube Music (o el ID de 11 caracteres)..."
              value="${escapeHtml(videoQuery)}"
            />
            <button type="button" class="btn btn-primary" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
              ${isSearching ? 'Buscando...' : `${iconSearch} Sincronizar`}
            </button>
          </div>
        `
      }

      searchFormHtml = `
        <div class="online-inputs-container">
          <div class="bl-modes-bar">${blModeTabsHtml}</div>
          ${blInputContent}
          <!-- Filtros de sincronización -->
          <div class="bl-filters-bar">
            <span class="filter-label">Tipo de sincronización:</span>
            <div class="bl-filter-pills">
              <button type="button" class="bl-filter-pill ${syncFilter === 'all' ? 'is-active' : ''}" data-sync="all">Todas</button>
              <button type="button" class="bl-filter-pill ${syncFilter === 'richsync' ? 'is-active' : ''}" data-sync="richsync">${iconSparkles} Sílabas (TTML)</button>
              <button type="button" class="bl-filter-pill ${syncFilter === 'linesync' ? 'is-active' : ''}" data-sync="linesync">${iconMusicNote} Por Versos (LRC)</button>
            </div>
          </div>
        </div>
      `
    } else if (activeProvider === 'genius') {
      const isConfigured = hasGeniusToken()
      searchFormHtml = `
        <div class="online-inputs-container">
          <!-- Token banner -->
          <div class="genius-token-bar">
            <div class="token-status-left">
              <span class="token-badge ${isConfigured ? 'badge-token-active' : 'badge-token-optional'}">
                ${isConfigured ? 'Token de Genius Activo ✓' : 'Genius API (Token opcional)'}
              </span>
              <span class="token-help">
                <a href="https://genius.com/api-clients" target="_blank" rel="noopener noreferrer" class="token-external-link">
                  Obtener token gratuito en Genius.com
                </a>
              </span>
            </div>
            <button type="button" class="btn btn-outline btn-xs" id="btn-toggle-genius-token">
              ${showGeniusTokenConfig ? 'Ocultar' : 'Configurar Token'}
            </button>
          </div>

          ${showGeniusTokenConfig ? `
            <div class="genius-token-form">
              <input
                type="text"
                id="input-genius-token"
                class="form-input token-input"
                placeholder="Pega aquí tu Client Access Token de Genius..."
                value="${escapeHtml(geniusTokenInputVal)}"
              />
              <button type="button" class="btn btn-outline btn-sm" id="btn-save-genius-token">
                Guardar Token
              </button>
            </div>
          ` : ''}

          <!-- Selector de Modo Genius -->
          <div class="bl-modes-bar">
            <button type="button" class="bl-mode-tab ${subMode === 'general' ? 'is-active' : ''}" data-submode="general">Búsqueda General</button>
            <button type="button" class="bl-mode-tab ${subMode === 'artist_song' ? 'is-active' : ''}" data-submode="artist_song">Artista y Título</button>
          </div>

          ${subMode === 'general' ? `
            <div class="search-input-group">
              <span class="search-input-icon">${iconSearch}</span>
              <input
                type="text"
                id="provider-input-general"
                class="form-input search-main-input"
                placeholder="Buscar canción o artista en Genius.com..."
                value="${escapeHtml(unifiedQuery)}"
              />
              <button type="button" class="btn btn-primary" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
                ${isSearching ? 'Buscando...' : `${iconSearch} Buscar en Genius`}
              </button>
            </div>
          ` : `
            <div class="bl-dual-inputs-grid">
              <div class="input-with-label">
                <label for="provider-input-artist" class="field-sublabel">Artista / Banda:</label>
                <input
                  type="text"
                  id="provider-input-artist"
                  class="form-input"
                  placeholder="ej. Queen"
                  value="${escapeHtml(artistQuery)}"
                />
              </div>
              <div class="input-with-label">
                <label for="provider-input-song" class="field-sublabel">Canción:</label>
                <input
                  type="text"
                  id="provider-input-song"
                  class="form-input"
                  placeholder="ej. Bohemian Rhapsody"
                  value="${escapeHtml(songQuery)}"
                />
              </div>
              <div class="dual-search-btn-col">
                <label class="field-sublabel">&nbsp;</label>
                <button type="button" class="btn btn-primary btn-block" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
                  ${isSearching ? 'Buscando...' : `${iconSearch} Buscar`}
                </button>
              </div>
            </div>
          `}
        </div>
      `
    } else if (activeProvider === 'lrclib') {
      searchFormHtml = `
        <div class="online-inputs-container">
          <div class="bl-modes-bar">
            <button type="button" class="bl-mode-tab ${subMode === 'general' ? 'is-active' : ''}" data-submode="general">Búsqueda General</button>
            <button type="button" class="bl-mode-tab ${subMode === 'artist_song' ? 'is-active' : ''}" data-submode="artist_song">Artista y Canción</button>
          </div>

          ${subMode === 'general' ? `
            <div class="search-input-group">
              <span class="search-input-icon">${iconSearch}</span>
              <input
                type="text"
                id="provider-input-general"
                class="form-input search-main-input"
                placeholder="Buscar canción o artista en LRCLIB..."
                value="${escapeHtml(unifiedQuery)}"
              />
              <button type="button" class="btn btn-primary" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
                ${isSearching ? 'Buscando...' : `${iconSearch} Buscar en LRCLIB`}
              </button>
            </div>
          ` : `
            <div class="bl-dual-inputs-grid">
              <div class="input-with-label">
                <label for="provider-input-artist" class="field-sublabel">Artista / Banda:</label>
                <input
                  type="text"
                  id="provider-input-artist"
                  class="form-input"
                  placeholder="ej. Queen"
                  value="${escapeHtml(artistQuery)}"
                />
              </div>
              <div class="input-with-label">
                <label for="provider-input-song" class="field-sublabel">Canción:</label>
                <input
                  type="text"
                  id="provider-input-song"
                  class="form-input"
                  placeholder="ej. Bohemian Rhapsody"
                  value="${escapeHtml(songQuery)}"
                />
              </div>
              <div class="dual-search-btn-col">
                <label class="field-sublabel">&nbsp;</label>
                <button type="button" class="btn btn-primary btn-block" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
                  ${isSearching ? 'Buscando...' : `${iconSearch} Buscar`}
                </button>
              </div>
            </div>
          `}

          <div class="bl-filters-bar">
            <span class="filter-label">Filtro de formato:</span>
            <div class="bl-filter-pills">
              <button type="button" class="bl-filter-pill ${syncFilter === 'all' ? 'is-active' : ''}" data-sync="all">Todas</button>
              <button type="button" class="bl-filter-pill ${syncFilter === 'linesync' ? 'is-active' : ''}" data-sync="linesync">${iconMusicNote} Sincronizadas (LRC)</button>
            </div>
          </div>
        </div>
      `
    }

    // 3. Resultados de Búsqueda
    let resultsListHtml = ''
    if (searchResults.length > 0) {
      resultsListHtml = searchResults.map(item => {
        const isThisLoading = isImporting && activeLoadingItemId === item.id
        const durationText = item.duration > 0 ? formatTime(item.duration) : ''

        // Badges según proveedor
        let sourceBadgeClass = 'badge-source-betterlyrics'
        let sourceBadgeName = 'BetterLyrics'
        if (item.source === 'genius') {
          sourceBadgeClass = 'badge-source-genius'
          sourceBadgeName = 'Genius'
        } else if (item.source === 'lrclib') {
          sourceBadgeClass = 'badge-source-lrclib'
          sourceBadgeName = 'LRCLIB'
        }

        // Badge de formato / sincronización
        let formatBadgeHtml = ''
        if (item.syncType === 'richsync') {
          formatBadgeHtml = `<span class="badge-format format-richsync">${iconSparkles} Sílabas (TTML)</span>`
        } else if (item.syncType === 'linesync') {
          formatBadgeHtml = `<span class="badge-format format-linesync">${iconMusicNote} Versos (LRC)</span>`
        } else {
          formatBadgeHtml = `<span class="badge-format format-plain">${iconFileText} Letra Plana</span>`
        }

        // Miniatura
        const artworkHtml = item.artwork
          ? `<img src="${escapeHtml(item.artwork)}" class="result-card-artwork" alt="Artwork" loading="lazy" />`
          : ''

        return `
          <div class="bl-result-card ${isThisLoading ? 'is-loading-card' : ''}" data-item-id="${item.id}">
            <div class="bl-card-left">
              ${artworkHtml}
              <div class="bl-card-info">
                <div class="bl-card-title-row">
                  <h4 class="bl-song-title">${escapeHtml(item.song)}</h4>
                  <span class="source-badge ${sourceBadgeClass}">${escapeHtml(sourceBadgeName)}</span>
                  ${formatBadgeHtml}
                </div>
                <div class="bl-card-artist-row">
                  <span class="bl-artist-name">${escapeHtml(item.artist)}</span>
                  ${item.album ? `<span class="bl-album-name">• ${escapeHtml(item.album)}</span>` : ''}
                  ${durationText ? `<span class="bl-duration">• ${durationText}</span>` : ''}
                </div>
              </div>
            </div>

            <div class="bl-card-right">
              <button
                type="button"
                class="btn btn-primary btn-sm btn-select-bl-song"
                data-item-id="${item.id}"
                ${isImporting ? 'disabled' : ''}
              >
                ${isThisLoading ? 'Cargando...' : `${iconPlus} Cargar en Editor`}
              </button>
            </div>
          </div>
        `
      }).join('')
    } else if (!isSearching && lastSearchSummary) {
      resultsListHtml = `
        <div class="bl-empty-results">
          <p>No se encontraron resultados para la búsqueda.</p>
        </div>
      `
    }

    containerElement.innerHTML = `
      <div class="modal-backdrop" id="online-modal-backdrop"></div>
      <div class="modal-dialog online-lyrics-modal-dialog">
        <div class="modal-header">
          <div>
            <h2 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
              ${iconGlobe} Buscar Canción Online
            </h2>
            <p class="subtitle">Buscador multilínea con BetterLyrics, Genius y LRCLIB para importar canciones sincronizadas al editor.</p>
          </div>
          <button class="btn-close-modal" id="btn-close-online-modal" title="Cerrar modal">${iconClose}</button>
        </div>

        <div class="modal-body online-modal-body">
          <!-- Barra de Proveedores -->
          <div class="online-providers-bar">
            ${providersTabsHtml}
          </div>

          <!-- Formulario según Proveedor -->
          ${searchFormHtml}

          <!-- Barra de Opciones de Traducción -->
          <div class="online-options-bar">
            <div class="option-field">
              <label for="online-select-translate" class="field-sublabel">Traducir automáticamente a:</label>
              <select id="online-select-translate" class="form-select select-sm">
                <option value="es" ${selectedTranslateLang === 'es' ? 'selected' : ''}>Español (es)</option>
                <option value="en" ${selectedTranslateLang === 'en' ? 'selected' : ''}>English (en)</option>
                <option value="ja" ${selectedTranslateLang === 'ja' ? 'selected' : ''}>日本語 (ja)</option>
                <option value="pt" ${selectedTranslateLang === 'pt' ? 'selected' : ''}>Português (pt)</option>
                <option value="fr" ${selectedTranslateLang === 'fr' ? 'selected' : ''}>Français (fr)</option>
                <option value="none" ${selectedTranslateLang === 'none' ? 'selected' : ''}>(Sin traducción)</option>
              </select>
            </div>
            ${lastSearchSummary ? `
              <span class="online-search-summary-tag">${escapeHtml(lastSearchSummary)}</span>
            ` : ''}
          </div>

          <!-- Alerta de Estado -->
          ${statusMessage ? `
            <div class="status-alert status-${statusType}" style="margin: 10px 0;">
              ${escapeHtml(statusMessage)}
            </div>
          ` : ''}

          <!-- Contenedor de Resultados -->
          <div class="online-results-container">
            ${isSearching ? `
              <div class="bl-loading-state">
                <span class="bl-spinner"></span>
                <p>Consultando motores de búsqueda en línea...</p>
              </div>
            ` : resultsListHtml}
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btn-cancel-online-modal">Cerrar</button>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    if (!containerElement) return

    // Cerrar modal
    const closeBtn = containerElement.querySelector('#btn-close-online-modal')
    if (closeBtn) closeBtn.addEventListener('click', close)

    const cancelBtn = containerElement.querySelector('#btn-cancel-online-modal')
    if (cancelBtn) cancelBtn.addEventListener('click', close)

    const backdrop = containerElement.querySelector('#online-modal-backdrop')
    if (backdrop) backdrop.addEventListener('click', close)

    // Conmutar proveedor activo
    const provTabs = containerElement.querySelectorAll('.online-provider-tab')
    provTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        readFormInputs()
        const targetProv = btn.dataset.provider
        if (targetProv && targetProv !== activeProvider) {
          activeProvider = targetProv
          render()
          focusActiveInput()
        }
      })
    })

    // Conmutar modos de BetterLyrics
    const blTabs = containerElement.querySelectorAll('.bl-mode-tab[data-bl-mode]')
    blTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        readFormInputs()
        const targetMode = btn.dataset.blMode
        if (targetMode && targetMode !== blActiveMode) {
          blActiveMode = targetMode
          render()
          focusActiveInput()
        }
      })
    })

    // Conmutar submodos de Genius / LRCLIB
    const subTabs = containerElement.querySelectorAll('.bl-mode-tab[data-submode]')
    subTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        readFormInputs()
        const targetSub = btn.dataset.submode
        if (targetSub && targetSub !== subMode) {
          subMode = targetSub
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
          handleSearch()
        }
      })
    })

    // Toggle configurar Genius Token
    const toggleGeniusTokenBtn = containerElement.querySelector('#btn-toggle-genius-token')
    if (toggleGeniusTokenBtn) {
      toggleGeniusTokenBtn.addEventListener('click', () => {
        showGeniusTokenConfig = !showGeniusTokenConfig
        render()
      })
    }

    // Guardar Genius Token
    const saveGeniusTokenBtn = containerElement.querySelector('#btn-save-genius-token')
    if (saveGeniusTokenBtn) {
      saveGeniusTokenBtn.addEventListener('click', () => {
        const inp = containerElement.querySelector('#input-genius-token')
        handleSaveGeniusToken(inp ? inp.value : '')
      })
    }

    // Botón de búsqueda
    const searchBtn = containerElement.querySelector('#btn-do-online-search')
    if (searchBtn) searchBtn.addEventListener('click', handleSearch)

    // Tecla Enter en inputs
    const inputs = containerElement.querySelectorAll('.search-main-input, .bl-dual-inputs-grid input')
    inputs.forEach(input => {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          handleSearch()
        }
      })
    })

    // Selector de idioma de traducción
    const transSelect = containerElement.querySelector('#online-select-translate')
    if (transSelect) {
      transSelect.addEventListener('change', (e) => {
        selectedTranslateLang = e.target.value
      })
    }

    // Seleccionar canción para cargar en el editor
    const selectBtns = containerElement.querySelectorAll('.btn-select-bl-song')
    selectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const itemId = btn.dataset.itemId
        const found = searchResults.find(r => String(r.id) === String(itemId))
        if (found) {
          handleSelectSong(found)
        }
      })
    })
  }

  return {
    open,
    close
  }
}

// Exportación como alias para compatibilidad retroactiva
export { createOnlineLyricsModal as createBetterLyricsModal }
