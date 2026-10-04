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
import { importUniversalFile } from '../services/shareService.js'
import {
  extractYouTubeVideoId,
  extractYouTubePlaylistId,
  extractVideoIdsFromText,
  fetchYouTubeVideoMeta,
  fetchYouTubePlaylistVideoIds,
  fetchMultipleYouTubeVideosMeta,
  buildSongPackageFromYouTubeMeta,
  importYouTubeSongs
} from '../services/youtubeImportService.js'
import {
  iconSearch,
  iconClose,
  iconGlobe,
  iconLink,
  iconMusicNote,
  iconSparkles,
  iconFileText,
  iconPlus,
  iconCheck,
  iconMic,
  iconChevronUp,
  iconUpload,
  iconYoutube,
  iconSave,
  iconEdit
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

export function createOnlineLyricsModal({
  containerElement,
  onSongReady,
  onCreateEmptySong,
  onImportSuccess,
  onConflictChoice
}) {
  let isOpen = false

  // Estado de navegación
  let activeProvider = 'all' // 'all' | 'betterlyrics' | 'lrcred' | 'genius' | 'lrclib' | 'youtube'
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

  // Estado de YouTube / Playlist
  let ytInputUrl = ''
  let ytProgressText = ''
  let ytResults = []
  let ytLibraryName = 'Playlist de YouTube'

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
  let resizeObserver = null

  function handleWindowResize() {
    if (isOpen) {
      updateLayoutMode()
    }
  }

  function updateLayoutMode() {
    if (!containerElement || !isOpen) return
    const dialogEl = containerElement.querySelector('.online-lyrics-modal-dialog')
    const modalBody = containerElement.querySelector('.online-modal-body')
    if (!dialogEl || !modalBody) return

    const isMobile = window.innerWidth <= 768 || window.innerHeight <= 520

    // Medición de controles que anteceden a la lista de resultados
    const providersBar = containerElement.querySelector('.online-providers-bar')
    const inputsContainer = containerElement.querySelector('.online-inputs-container')
    const optionsBar = containerElement.querySelector('.online-options-bar')
    const statusAlert = containerElement.querySelector('.status-alert')

    const controlsHeight = (providersBar ? providersBar.offsetHeight : 0) +
      (inputsContainer ? inputsContainer.offsetHeight : 0) +
      (optionsBar ? optionsBar.offsetHeight : 0) +
      (statusAlert ? statusAlert.offsetHeight : 0) + 36

    const availableHeightForResults = modalBody.clientHeight - controlsHeight
    const isResultsWindowTooSmall = availableHeightForResults < 260

    if (isMobile || isResultsWindowTooSmall) {
      dialogEl.classList.add('layout-scroll-controls')
      dialogEl.classList.remove('layout-fixed-controls')
    } else {
      dialogEl.classList.add('layout-fixed-controls')
      dialogEl.classList.remove('layout-scroll-controls')
    }
  }

  function open() {
    isOpen = true
    isImporting = false
    activeLoadingItemId = null
    isSearching = false
    statusMessage = ''
    geniusTokenInputVal = getGeniusToken()
    window.addEventListener('resize', handleWindowResize)
    render()
    focusActiveInput()
  }

  function close() {
    isOpen = false
    isImporting = false
    activeLoadingItemId = null
    statusMessage = ''
    window.removeEventListener('resize', handleWindowResize)
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    render()
  }

  function focusActiveInput() {
    setTimeout(() => {
      if (!containerElement) return
      let targetInput = null
      if (activeProvider === 'all') targetInput = containerElement.querySelector('#online-input-all')
      else if (activeProvider === 'youtube') targetInput = containerElement.querySelector('#youtube-input-url')
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

    // 5. YouTube / Playlist
    const ytUrlEl = containerElement.querySelector('#youtube-input-url')
    if (ytUrlEl) ytInputUrl = ytUrlEl.value.trim()

    const ytLibEl = containerElement.querySelector('#yt-library-name-input')
    if (ytLibEl) ytLibraryName = ytLibEl.value.trim()

    const ytTitleEl = containerElement.querySelector('#yt-edit-title')
    if (ytTitleEl && ytResults.length === 1) ytResults[0].title = ytTitleEl.value.trim()

    const ytArtistEl = containerElement.querySelector('#yt-edit-artist')
    if (ytArtistEl && ytResults.length === 1) ytResults[0].artist = ytArtistEl.value.trim()
  }

  async function handleYouTubeExtract() {
    readFormInputs()
    if (!ytInputUrl) {
      statusMessage = 'Ingresá un enlace de video, de playlist o varios enlaces de YouTube.'
      statusType = 'error'
      render()
      return
    }

    isSearching = true
    statusMessage = ''
    ytProgressText = 'Analizando enlace...'
    render()

    try {
      const playlistId = extractYouTubePlaylistId(ytInputUrl)
      const isPurePlaylist = ytInputUrl.includes('playlist?list=') ||
        (/^(?:PL|UU|LL|FL|RD|OLAK5uy_)[a-zA-Z0-9_-]+$/.test(ytInputUrl.trim()) && !ytInputUrl.includes('watch?v='))

      if (playlistId && (isPurePlaylist || !extractYouTubeVideoId(ytInputUrl))) {
        ytProgressText = 'Consultando canciones de la lista de YouTube...'
        render()

        const videoIds = await fetchYouTubePlaylistVideoIds(playlistId)
        if (!videoIds || videoIds.length === 0) {
          throw new Error('No se encontraron videos en la lista o la lista es privada.')
        }

        ytProgressText = `Obteniendo información de ${videoIds.length} canciones...`
        render()

        const metas = await fetchMultipleYouTubeVideosMeta(videoIds, {
          onProgress: (done, total) => {
            ytProgressText = `Obteniendo datos de canciones (${done} de ${total})...`
            render()
          }
        })

        ytResults = metas.map(m => ({ ...m, isSelected: true }))
        statusMessage = `Se obtuvieron ${metas.length} canciones de la lista.`
        statusType = 'success'
      } else {
        const multiIds = extractVideoIdsFromText(ytInputUrl)
        if (multiIds.length > 1) {
          ytProgressText = `Obteniendo información de ${multiIds.length} videos...`
          render()

          const metas = await fetchMultipleYouTubeVideosMeta(multiIds, {
            onProgress: (done, total) => {
              ytProgressText = `Obteniendo datos (${done} de ${total})...`
              render()
            }
          })

          ytResults = metas.map(m => ({ ...m, isSelected: true }))
          statusMessage = `Se obtuvieron ${metas.length} canciones.`
          statusType = 'success'
        } else if (multiIds.length === 1) {
          const videoId = multiIds[0]
          ytProgressText = 'Obteniendo metadatos del video...'
          render()

          const meta = await fetchYouTubeVideoMeta(videoId)
          ytResults = [{ ...meta, isSelected: true }]
          statusMessage = 'Información del video obtenida con éxito.'
          statusType = 'success'
        } else if (playlistId) {
          ytProgressText = 'Consultando canciones de la lista de YouTube...'
          render()

          const videoIds = await fetchYouTubePlaylistVideoIds(playlistId)
          const metas = await fetchMultipleYouTubeVideosMeta(videoIds, {
            onProgress: (done, total) => {
              ytProgressText = `Obteniendo datos (${done} de ${total})...`
              render()
            }
          })

          ytResults = metas.map(m => ({ ...m, isSelected: true }))
          statusMessage = `Se obtuvieron ${metas.length} canciones de la lista.`
          statusType = 'success'
        } else {
          throw new Error('No se pudo reconocer un enlace válido de video o de playlist de YouTube / YouTube Music.')
        }
      }
    } catch (err) {
      console.error('Error al extraer de YouTube:', err)
      statusMessage = err.message || 'Error al procesar el enlace de YouTube.'
      statusType = 'error'
    } finally {
      isSearching = false
      ytProgressText = ''
      render()
    }
  }

  async function handleYouTubeSingleLoadEditor() {
    if (!ytResults || ytResults.length === 0) return
    readFormInputs()
    const item = ytResults[0]
    const pkg = buildSongPackageFromYouTubeMeta(item)

    close()
    if (onSongReady) {
      onSongReady(pkg, {
        initialStatus: {
          message: `Canción "${item.title}" cargada desde YouTube (sin letras). ¡Lista para reproducir o editar!`,
          type: 'success'
        },
        sourceName: 'YouTube'
      })
    }
  }

  async function handleYouTubeSingleSaveCatalog() {
    if (!ytResults || ytResults.length === 0) return
    readFormInputs()
    const item = ytResults[0]
    isImporting = true
    render()

    try {
      await importYouTubeSongs([item])
      close()
      if (onImportSuccess) {
        onImportSuccess(`Canción "${item.title}" guardada exitosamente en el catálogo.`)
      }
    } catch (err) {
      console.error('Error al guardar canción de YouTube en catálogo:', err)
      statusMessage = 'Error al guardar canción: ' + err.message
      statusType = 'error'
      isImporting = false
      render()
    }
  }

  async function handleYouTubeBatchImport() {
    readFormInputs()
    const selected = ytResults.filter(r => r.isSelected)
    if (selected.length === 0) {
      statusMessage = 'Seleccioná al menos una canción para importar.'
      statusType = 'error'
      render()
      return
    }

    isImporting = true
    statusMessage = ''
    render()

    try {
      const saved = await importYouTubeSongs(selected, { libraryName: ytLibraryName })
      close()
      if (onImportSuccess) {
        const libMsg = ytLibraryName ? ` en la biblioteca "${ytLibraryName}"` : ''
        onImportSuccess(`Se importaron ${saved.length} canciones desde YouTube${libMsg} sin letras.`)
      }
    } catch (err) {
      console.error('Error al importar canciones de YouTube:', err)
      statusMessage = 'Error al importar canciones: ' + err.message
      statusType = 'error'
      isImporting = false
      render()
    }
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
      } else if (activeProvider === 'lrcred') {
        results = await searchOnlineLyrics({
          provider: 'lrcred',
          query: subMode === 'general' ? unifiedQuery : '',
          artist: subMode === 'artist_song' ? artistQuery : '',
          song: subMode === 'artist_song' ? songQuery : '',
          syncType
        })
        lastSearchSummary = `Búsqueda en LRC.red: "${subMode === 'general' ? unifiedQuery : `${artistQuery} - ${songQuery}`}"`
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

    const translateTo = selectedTranslateLang !== 'none' ? selectedTranslateLang : null
    const sourceName = item.sourceName || 'el proveedor'

    const initialSong = {
      title: item.song || '',
      artist: item.artist || '',
      metadata: {
        title: item.song || '',
        artist: item.artist || '',
        album: item.album || '',
        duration: item.duration || 0,
        artwork: item.artwork || '',
        source: item.sourceName || item.source || ''
      },
      videos: item.videoId ? [
        {
          id: `vid-${Date.now()}-0`,
          name: 'Video Oficial',
          url: `https://www.youtube.com/watch?v=${item.videoId}`,
          offset: 0
        }
      ] : [],
      lyrics_data: {
        languages: [
          {
            code: 'es',
            name: 'Principal',
            isMain: true,
            plain: '',
            lines: []
          }
        ]
      }
    }

    // Cerrar el modal inmediatamente para llevar al usuario al editor sin esperas
    close()

    let progressCallbacks = null

    const loadPromise = buildSongPackageFromOnlineResult(item, {
      translateTo,
      onProgress: (msg) => {
        if (progressCallbacks?.onProgress) {
          progressCallbacks.onProgress(msg)
        }
      },
      onLyricsReady: (basePkg) => {
        if (progressCallbacks?.onLyricsReady) {
          progressCallbacks.onLyricsReady(basePkg)
        }
      }
    })

    if (onSongReady) {
      onSongReady(initialSong, {
        loadPromise,
        initialStatus: {
          message: `Obteniendo letra desde ${sourceName}...`,
          type: 'info'
        },
        sourceName,
        translateTo,
        registerProgressCallbacks: (cbs) => {
          progressCallbacks = cbs
        }
      })
    }

    try {
      await loadPromise
    } catch (err) {
      console.error('Error al procesar letra seleccionada:', err)
    } finally {
      isImporting = false
      activeLoadingItemId = null
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
      else if (p.id === 'lrcred') icon = iconMic
      else if (p.id === 'genius') icon = iconMusicNote
      else if (p.id === 'lrclib') icon = iconFileText
      else if (p.id === 'youtube') icon = iconYoutube

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
            <div class="input-wrapper">
                <span class="search-input-icon">${iconSearch}</span>
                <input
                  type="text"
                  id="online-input-all"
                  class="form-input search-main-input"
                  placeholder="Buscar título, artista o enlace (BetterLyrics + LRC.red + LRCLIB + Genius)..."
                  value="${escapeHtml(unifiedQuery)}"
                />
            </div>
            <button type="button" class="btn btn-primary" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
              ${isSearching ? 'Buscando...' : `${iconSearch} Buscar en Todo`}
            </button>
          </div>
          <p class="search-hint-text">
            Consulta en todas las fuentes a la vez (max 6 resultados).
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
            <div class="input-wrapper">
                <span class="search-input-icon">${iconSearch}</span>
                <input
                  type="text"
                  id="bl-input-general"
                  class="form-input search-main-input"
                  placeholder="Buscar canción, artista o pegar enlace de YouTube..."
                  value="${escapeHtml(blGeneralQuery)}"
                />
            </div>
            <button type="button" class="btn btn-primary" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
              ${isSearching ? 'Buscando...' : `${iconSearch} Buscar`}
            </button>
          </div>
        `
      } else if (blActiveMode === 'artist') {
        blInputContent = `
          <div class="bl-artist-mode-container">
            <div class="search-input-group">
                <div class="input-wrapper">
                  <span class="search-input-icon">${iconSearch}</span>
                  <input
                    type="text"
                    id="bl-input-artist"
                    class="form-input search-main-input"
                    placeholder="Nombre exacto del artista (ej. Queen, Soda Stereo, Coldplay)..."
                    value="${escapeHtml(artistQuery)}"
                  />
                </div>
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
            <div class="input-wrapper">
                <span class="search-input-icon">${iconLink}</span>
                <input
                  type="text"
                  id="bl-input-video"
                  class="form-input search-main-input"
                  placeholder="Pegá el enlace de YouTube o YouTube Music (o el ID de 11 caracteres)..."
                  value="${escapeHtml(videoQuery)}"
                />
            </div>
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
    } else if (activeProvider === 'lrcred') {
      searchFormHtml = `
        <div class="online-inputs-container">
          <div class="bl-modes-bar">
            <button type="button" class="bl-mode-tab ${subMode === 'general' ? 'is-active' : ''}" data-submode="general">Búsqueda General</button>
            <button type="button" class="bl-mode-tab ${subMode === 'artist_song' ? 'is-active' : ''}" data-submode="artist_song">Artista y Canción</button>
          </div>

          ${subMode === 'general' ? `
            <div class="search-input-group">
                <div class="input-wrapper">
                  <span class="search-input-icon">${iconSearch}</span>
                  <input
                    type="text"
                    id="provider-input-general"
                    class="form-input search-main-input"
                    placeholder="Buscar canción, artista o álbum en LRC.red..."
                    value="${escapeHtml(unifiedQuery)}"
                  />
                </div>
              <button type="button" class="btn btn-primary" id="btn-do-online-search" ${isSearching ? 'disabled' : ''}>
                ${isSearching ? 'Buscando...' : `${iconSearch} Buscar en LRC.red`}
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
              <button type="button" class="bl-filter-pill ${syncFilter === 'linesync' ? 'is-active' : ''}" data-sync="linesync">${iconMusicNote} Sincronizadas</button>
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
                <div class="input-wrapper">
                  <span class="search-input-icon">${iconSearch}</span>
                  <input
                    type="text"
                    id="provider-input-general"
                    class="form-input search-main-input"
                    placeholder="Buscar canción o artista en Genius.com..."
                    value="${escapeHtml(unifiedQuery)}"
                  />
                </div>
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
                <div class="input-wrapper">
                  <span class="search-input-icon">${iconSearch}</span>
                  <input
                    type="text"
                    id="provider-input-general"
                    class="form-input search-main-input"
                    placeholder="Buscar canción o artista en LRCLIB..."
                    value="${escapeHtml(unifiedQuery)}"
                  />
                </div>
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
    } else if (activeProvider === 'youtube') {
      searchFormHtml = `
        <div class="online-inputs-container youtube-inputs-container">
          <div class="input-with-label">
            <label for="youtube-input-url" class="field-sublabel">Enlace de Video o Lista de Reproducción de YouTube / YouTube Music:</label>
            <textarea
              id="youtube-input-url"
              class="form-input youtube-url-input"
              rows="2"
              placeholder="Pegá un enlace de video, shorts o playlist."
            >${escapeHtml(ytInputUrl)}</textarea>
          </div>
          <div class="youtube-controls-bar">
            <p class="search-hint-text">
              Soporta videos o playlists de YouTube y YouTube Music, o listas de URLs (una por línea).
            </p>
            <button type="button" class="btn btn-primary" id="btn-do-youtube-extract" ${isSearching ? 'disabled' : ''}>
              ${isSearching ? (ytProgressText || 'Extrayendo...') : `${iconYoutube} Extraer de YouTube`}
            </button>
          </div>
        </div>
      `
    }

    // 3. Resultados de Búsqueda
    let resultsListHtml = ''
    if (activeProvider === 'youtube') {
      if (ytResults.length === 1) {
        const item = ytResults[0]
        resultsListHtml = `
          <div class="youtube-single-preview">
            <div class="youtube-preview-card">
              <div class="youtube-card-media">
                <img src="${escapeHtml(item.thumbnail)}" class="youtube-preview-img" alt="Thumbnail" />
              </div>
              <div class="youtube-card-fields">
                <div class="input-with-label">
                  <label class="field-sublabel" for="yt-edit-title">Título de la Canción:</label>
                  <input type="text" id="yt-edit-title" class="form-input form-input-sm" value="${escapeHtml(item.title)}" />
                </div>
                <div class="input-with-label">
                  <label class="field-sublabel" for="yt-edit-artist">Artista o Banda:</label>
                  <input type="text" id="yt-edit-artist" class="form-input form-input-sm" value="${escapeHtml(item.artist)}" />
                </div>
                <div class="youtube-meta-url">
                  <span class="source-badge badge-source-youtube">${iconYoutube} YouTube</span>
                  <a href="${escapeHtml(item.videoUrl)}" target="_blank" rel="noopener noreferrer" class="youtube-url-link">${escapeHtml(item.videoUrl)}</a>
                </div>
              </div>
            </div>
            <div class="youtube-single-actions">
              <button type="button" class="btn btn-primary" id="btn-yt-load-editor" ${isImporting ? 'disabled' : ''}>
                ${iconEdit} Cargar en Editor
              </button>
              <button type="button" class="btn btn-outline" id="btn-yt-save-catalog" ${isImporting ? 'disabled' : ''}>
                ${iconSave} Guardar en Catálogo (sin letras)
              </button>
            </div>
          </div>
        `
      } else if (ytResults.length > 1) {
        const selectedCount = ytResults.filter(r => r.isSelected).length
        resultsListHtml = `
          <div class="youtube-batch-container">
            <div class="youtube-batch-header">
              <div class="youtube-batch-title-row">
                <h4 class="youtube-batch-count">
                  ${iconYoutube} Se encontraron ${ytResults.length} canciones
                </h4>
                <div class="youtube-batch-toggles">
                  <button type="button" class="btn btn-xs btn-outline" id="btn-yt-select-all">Seleccionar todas</button>
                  <button type="button" class="btn btn-xs btn-outline" id="btn-yt-deselect-all">Deseleccionar todas</button>
                </div>
              </div>
              <div class="youtube-library-input-row">
                <label for="yt-library-name-input" class="field-sublabel">Asignar a Biblioteca (opcional):</label>
                <input
                  type="text"
                  id="yt-library-name-input"
                  class="form-input form-input-sm"
                  placeholder="ej. Playlist de YouTube"
                  value="${escapeHtml(ytLibraryName)}"
                />
              </div>
            </div>

            <div class="youtube-batch-list">
              ${ytResults.map((item, idx) => `
                <div class="youtube-batch-item ${item.isSelected ? 'is-selected' : ''}" data-idx="${idx}">
                  <label class="youtube-item-checkbox-label">
                    <input type="checkbox" class="youtube-item-check" data-idx="${idx}" ${item.isSelected ? 'checked' : ''} />
                  </label>
                  <img src="${escapeHtml(item.thumbnail)}" class="youtube-item-thumb" alt="Thumb" loading="lazy" />
                  <div class="youtube-item-info">
                    <div class="youtube-item-title">${escapeHtml(item.title)}</div>
                    <div class="youtube-item-artist">${escapeHtml(item.artist)}</div>
                  </div>
                  <span class="youtube-item-index">#${idx + 1}</span>
                </div>
              `).join('')}
            </div>

            <div class="youtube-batch-footer">
              <button
                type="button"
                class="btn btn-primary btn-block btn-lg"
                id="btn-yt-import-batch"
                ${selectedCount === 0 || isImporting ? 'disabled' : ''}
              >
                ${isImporting ? 'Importando canciones...' : `${iconPlus} Importar ${selectedCount} canciones a SarangaBaranga`}
              </button>
            </div>
          </div>
        `
      } else if (!isSearching) {
        resultsListHtml = `
          <div class="bl-empty-results youtube-empty-state">
            <div class="empty-icon" style="font-size: 2rem; color: #ef4444; margin-bottom: 8px;">${iconYoutube}</div>
            <h4>Importá desde YouTube o YouTube Music</h4>
            <p>Pegá la dirección web de un video o de una playlist para crear las canciones sin letras al instante.</p>
          </div>
        `
      }
    } else if (searchResults.length > 0) {
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
        } else if (item.source === 'lrcred') {
          sourceBadgeClass = 'badge-source-lrcred'
          sourceBadgeName = 'LRC.red'
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
          </div>
          <div class="modal-header-actions">
            <button type="button" class="btn btn-outline btn-modal-import" id="btn-modal-import" title="Importar archivo (.json, .yaml, .yml)" aria-label="Importar archivo">${iconUpload}</button>
            <button type="button" class="btn btn-primary btn-modal-create-empty" id="btn-modal-create-empty" title="Crear canción vacía" aria-label="Crear canción vacía">${iconPlus}</button>
            <button class="btn-close-modal" id="btn-close-online-modal" title="Cerrar modal">${iconClose}</button>
            <input type="file" id="modal-import-file-input" accept=".json,.yaml,.yml" class="hidden-input" style="display: none;" />
          </div>
        </div>

        <div class="modal-body online-modal-body">
          <!-- Barra de Proveedores -->
          <div class="online-providers-bar">
            ${providersTabsHtml}
          </div>

          <!-- Formulario según Proveedor -->
          ${searchFormHtml}

          <!-- Barra de Opciones de Traducción -->
          ${activeProvider === 'youtube' ? `
            <div class="online-options-bar youtube-options-bar">
              <span class="youtube-options-tag">
                ${iconYoutube} Extracción de metadatos (sin letras) • Podés reproducir de inmediato o agregar letras más adelante
              </span>
            </div>
          ` : `
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
          `}

          <!-- Alerta de Estado -->
          ${statusMessage ? `
            <div class="status-alert status-${statusType}" style="margin: 10px 0;">
              <span class="status-alert-text">${escapeHtml(statusMessage)}</span>
              <button type="button" class="btn-close-alert" id="btn-close-online-alert" title="Cerrar aviso" aria-label="Cerrar aviso">${iconClose}</button>
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

        <!-- Botón flotante para volver arriba -->
        <button
          type="button"
          class="btn-online-scroll-top"
          id="btn-online-scroll-top"
          title="Volver arriba a la búsqueda"
          aria-label="Volver arriba a la búsqueda"
        >
          ${iconChevronUp} <span>Subir</span>
        </button>

        <div class="modal-footer">
          <button type="button" class="btn btn-outline" id="btn-cancel-online-modal">Cerrar</button>
        </div>
      </div>
    `

    bindEvents()
    updateLayoutMode()

    if (typeof ResizeObserver !== 'undefined') {
      if (resizeObserver) resizeObserver.disconnect()
      const dialogEl = containerElement.querySelector('.online-lyrics-modal-dialog')
      if (dialogEl) {
        resizeObserver = new ResizeObserver(() => {
          updateLayoutMode()
        })
        resizeObserver.observe(dialogEl)
      }
    }
  }

  async function handleModalImportFile(file) {
    isImporting = true
    statusMessage = 'Importando archivo...'
    statusType = 'info'
    render()

    try {
      const result = await importUniversalFile(file, {
        onConflictChoice
      })

      if (result.type === 'cancelled') {
        statusMessage = result.message
        statusType = 'info'
        isImporting = false
        render()
        return
      }

      close()
      if (onImportSuccess) {
        onImportSuccess(result.message)
      }
    } catch (err) {
      console.error('Error al importar archivo en modal:', err)
      isImporting = false
      statusMessage = 'Error al importar: ' + err.message
      statusType = 'error'
      render()
    }
  }

  function bindEvents() {
    if (!containerElement) return

    // Cerrar aviso de estado
    const alertCloseBtn = containerElement.querySelector('#btn-close-online-alert')
    if (alertCloseBtn) {
      alertCloseBtn.addEventListener('click', () => {
        statusMessage = ''
        render()
      })
    }

    // Cerrar modal
    const closeBtn = containerElement.querySelector('#btn-close-online-modal')
    if (closeBtn) closeBtn.addEventListener('click', close)

    // Importar archivo (.json / .yaml / .yml)
    const importBtn = containerElement.querySelector('#btn-modal-import')
    const importFileInput = containerElement.querySelector('#modal-import-file-input')
    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => {
        importFileInput.click()
      })
      importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0]
        if (file) {
          await handleModalImportFile(file)
          importFileInput.value = ''
        }
      })
    }

    // Crear canción vacía
    const createEmptyBtn = containerElement.querySelector('#btn-modal-create-empty')
    if (createEmptyBtn) {
      createEmptyBtn.addEventListener('click', () => {
        close()
        if (onCreateEmptySong) onCreateEmptySong()
      })
    }

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

    // Botón de búsqueda de letras
    const searchBtn = containerElement.querySelector('#btn-do-online-search')
    if (searchBtn) searchBtn.addEventListener('click', handleSearch)

    // Botón de extracción de YouTube
    const ytExtractBtn = containerElement.querySelector('#btn-do-youtube-extract')
    if (ytExtractBtn) ytExtractBtn.addEventListener('click', handleYouTubeExtract)

    // Atajo Ctrl+Enter / Cmd+Enter en el área de URL de YouTube
    const ytTextarea = containerElement.querySelector('#youtube-input-url')
    if (ytTextarea) {
      ytTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          handleYouTubeExtract()
        }
      })
    }

    // Acciones de video individual de YouTube
    const ytLoadEditorBtn = containerElement.querySelector('#btn-yt-load-editor')
    if (ytLoadEditorBtn) ytLoadEditorBtn.addEventListener('click', handleYouTubeSingleLoadEditor)

    const ytSaveCatalogBtn = containerElement.querySelector('#btn-yt-save-catalog')
    if (ytSaveCatalogBtn) ytSaveCatalogBtn.addEventListener('click', handleYouTubeSingleSaveCatalog)

    // Acciones de playlist / batch de YouTube
    const ytSelectAllBtn = containerElement.querySelector('#btn-yt-select-all')
    if (ytSelectAllBtn) {
      ytSelectAllBtn.addEventListener('click', () => {
        ytResults.forEach(r => { r.isSelected = true })
        render()
      })
    }

    const ytDeselectAllBtn = containerElement.querySelector('#btn-yt-deselect-all')
    if (ytDeselectAllBtn) {
      ytDeselectAllBtn.addEventListener('click', () => {
        ytResults.forEach(r => { r.isSelected = false })
        render()
      })
    }

    const ytChecks = containerElement.querySelectorAll('.youtube-item-check')
    ytChecks.forEach(chk => {
      chk.addEventListener('change', () => {
        const idx = Number(chk.dataset.idx)
        if (!isNaN(idx) && ytResults[idx]) {
          ytResults[idx].isSelected = chk.checked
          const itemEl = containerElement.querySelector(`.youtube-batch-item[data-idx="${idx}"]`)
          if (itemEl) {
            itemEl.classList.toggle('is-selected', chk.checked)
          }
          const batchBtn = containerElement.querySelector('#btn-yt-import-batch')
          const selCount = ytResults.filter(r => r.isSelected).length
          if (batchBtn) {
            batchBtn.disabled = selCount === 0 || isImporting
            batchBtn.innerHTML = isImporting ? 'Importando canciones...' : `${iconPlus} Importar ${selCount} canciones a SarangaBaranga`
          }
        }
      })
    })

    const ytImportBatchBtn = containerElement.querySelector('#btn-yt-import-batch')
    if (ytImportBatchBtn) ytImportBatchBtn.addEventListener('click', handleYouTubeBatchImport)

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

    // Control de desplazamiento y botón para volver arriba
    const scrollTopBtn = containerElement.querySelector('#btn-online-scroll-top')
    const modalBody = containerElement.querySelector('.online-modal-body')
    const resultsContainer = containerElement.querySelector('.online-results-container')
    const dialogEl = containerElement.querySelector('.online-lyrics-modal-dialog')

    function checkScrollTop() {
      if (!scrollTopBtn) return
      const isScrollLayout = dialogEl && dialogEl.classList.contains('layout-scroll-controls')
      const currentScroll = isScrollLayout ? (modalBody ? modalBody.scrollTop : 0) : (resultsContainer ? resultsContainer.scrollTop : 0)
      if (currentScroll > 70) {
        scrollTopBtn.classList.add('is-visible')
      } else {
        scrollTopBtn.classList.remove('is-visible')
      }
    }

    if (modalBody) {
      modalBody.addEventListener('scroll', checkScrollTop, { passive: true })
    }
    if (resultsContainer) {
      resultsContainer.addEventListener('scroll', checkScrollTop, { passive: true })
    }

    if (scrollTopBtn) {
      scrollTopBtn.addEventListener('click', () => {
        const isScrollLayout = dialogEl && dialogEl.classList.contains('layout-scroll-controls')
        const targetScrollEl = isScrollLayout ? modalBody : resultsContainer
        if (targetScrollEl) {
          if (typeof targetScrollEl.scrollTo === 'function') {
            targetScrollEl.scrollTo({ top: 0, behavior: 'smooth' })
          } else {
            targetScrollEl.scrollTop = 0
          }
        }
        focusActiveInput()
      })
    }
  }

  return {
    open,
    close
  }
}

// Exportación como alias para compatibilidad retroactiva
export { createOnlineLyricsModal as createBetterLyricsModal }
