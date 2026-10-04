import { formatTime } from '../lyrics/timing.js'
import { TRACK_TYPE } from '../player/mediaPlayer.js'
import {
  iconPlay,
  iconPause,
  iconSettings,
  iconEdit,
  iconArrowLeft,
  iconVolume,
  iconVolumeMute,
  iconPalette,
  iconMaximize,
  iconSkipBack,
  iconSkipForward,
  iconListMusic
} from './icons.js'

export function createControlsView({
  containerElement,
  initialPreviewLines = 2,
  initialPastLines = 0,
  initialPreviousLines = undefined,
  initialVolume = 80,
  initialScriptDisplayMode = 'both',
  onPlayToggle,
  onSeek,
  onVolumeChange,
  onVideoChange,
  onManageVideos,
  onTrackToggle,
  onLanguageChange,
  onTranslationChange,
  onScriptDisplayModeChange,
  onBilingualToggle,
  onPreviewLinesChange,
  onPastLinesChange,
  onPreviousLinesChange,
  onOpenLibrary,
  onGoToMenu,
  onModeToggle,
  onEditSong,
  onOpenTheme,
  onPrevSong,
  onNextSong,
  onOpenPlaylist,
  onToggleFullscreen
}) {
  let isPlaying = false
  let duration = 0
  let currentTime = 0
  let isUserSeeking = false
  let playlistCount = 0
  let hasNextSong = false
  let hasPrevSong = false
  let currentVolume = Math.max(0, Math.min(100, Number(initialVolume) || 80))
  let previousVolume = currentVolume > 0 ? currentVolume : 80
  let currentTrackType = TRACK_TYPE.OFFICIAL
  let availableVideos = []
  let activeVideoId = null
  let availableLanguages = []
  let activeLanguage = null
  let translationLanguage = null
  let isBilingual = true
  let previewLinesCount = (initialPreviewLines !== undefined && initialPreviewLines !== null && !isNaN(Number(initialPreviewLines)))
    ? Math.max(0, Math.min(3, Number(initialPreviewLines)))
    : 2
  const effectiveInitialPast = initialPreviousLines !== undefined ? initialPreviousLines : initialPastLines
  let pastLinesCount = (effectiveInitialPast !== undefined && effectiveInitialPast !== null && !isNaN(Number(effectiveInitialPast)))
    ? Math.max(0, Math.min(3, Number(effectiveInitialPast)))
    : 0
  let scriptDisplayMode = (initialScriptDisplayMode === 'original' || initialScriptDisplayMode === 'alt')
    ? initialScriptDisplayMode
    : 'both'
  let hasAltText = false
  let currentMode = 'basic' // 'basic' | 'advanced'
  let isSettingsOpen = false

  function render() {
    if (!containerElement) return

    const translations = availableLanguages.filter(l => !l.isMain)
    const translationsHtml = `
      <option value="">(Sin traducción)</option>
      ${translations.map(lang => `
        <option value="${lang.code}" ${translationLanguage && translationLanguage.code === lang.code ? 'selected' : ''}>
          ${lang.name}
        </option>
      `).join('')}
    `

    const videosOptionsHtml = (availableVideos.length === 0)
      ? '<option value="">(Sin videos asociados)</option>'
      : availableVideos.map(v => {
        const off = Number(v.offset) || 0
        const offText = off !== 0 ? ` [Offset: ${off > 0 ? '+' : ''}${off}s]` : ' [0s]'
        const isSelected = String(activeVideoId) === String(v.id)
        return `<option value="${v.id}" ${isSelected ? 'selected' : ''}>${v.name}${offText}</option>`
      }).join('')

    containerElement.innerHTML = `
      <div class="controls-wrapper">
        <!-- Barra de progreso superior -->
        <div class="progress-bar-row">
          <span class="time-label current-time">${formatTime(Math.max(0, currentTime))}</span>
          <input type="range" class="seek-slider" min="0" max="${Math.max(1, duration)}" step="0.1" value="${Math.max(0, currentTime)}" />
          <span class="time-label duration-time">${formatTime(duration)}</span>
        </div>

        <!-- Fila de controles principales -->
        <div class="controls-main-row">
          <div class="left-controls">
            <div class="playback-btn-group">
              <button class="btn btn-xs btn-outline btn-prev-song" id="btn-prev-song" title="Canción anterior de la playlist" ${!hasPrevSong ? 'disabled' : ''}>
                ${iconSkipBack}
              </button>
              <button class="btn btn-primary btn-play-pause" title="${isPlaying ? 'Pausar' : 'Reproducir'}">
                <span class="icon">${isPlaying ? iconPause : iconPlay}</span>
              </button>
              <button class="btn btn-xs btn-outline btn-next-song" id="btn-next-song" title="Siguiente canción de la playlist" ${!hasNextSong ? 'disabled' : ''}>
                ${iconSkipForward}
              </button>
            </div>

            <!-- Control de Volumen -->
            <div class="volume-control-group" title="Volumen: ${currentVolume}%">
              <button class="btn btn-xs btn-outline btn-mute-toggle" title="${currentVolume === 0 ? 'Activar sonido' : 'Silenciar'}">
                ${currentVolume === 0 ? iconVolumeMute : iconVolume}
              </button>
              <input
                type="range"
                class="volume-slider"
                min="0"
                max="100"
                step="1"
                value="${currentVolume}"
                title="Volumen: ${currentVolume}%"
                aria-label="Volumen"
              />
              <span class="volume-percent-label">${currentVolume}%</span>
            </div>
          </div>

          <div class="center-controls">
            <!-- Botón Pantalla Completa en el centro -->
            <button class="btn btn-outline btn-controls-fullscreen" id="btn-controls-fullscreen" title="Pantalla completa">
              ${iconMaximize} <span class="nav-text-full">Pantalla completa</span>
            </button>
          </div>

          <div class="right-controls">
            <!-- Botón de Lista de Reproducción -->
            <button class="btn btn-xs btn-outline btn-open-playlist" id="btn-controls-playlist" title="Abrir lista de reproducción (${playlistCount} canciones)">
              ${iconListMusic} <span class="playlist-badge-count ${playlistCount > 0 ? 'has-items' : ''}">${playlistCount}</span>
            </button>
            <!-- Alternador de Modo: Sencillo vs Avanzado -->
            <button class="btn btn-mode-toggle" title="Cambiar modo de visualización">
              ${currentMode === 'basic' ? 'Modo Avanzado' : 'Modo Sencillo'}
            </button>

            <!-- Editar Letra de esta Canción -->
            <button class="btn btn-outline" id="btn-controls-edit" title="Editar letra, frases, sílabas e idiomas de esta canción">
              ${iconEdit} Editar
            </button>

            <!-- Menú de Configuración de Modo Letra (Ruedita) -->
            <div class="controls-settings-wrapper">
              <button class="btn btn-outline btn-controls-settings-toggle ${isSettingsOpen ? 'is-active' : ''}" id="btn-controls-settings-toggle" title="Configuración de pista, visualización y traducción" aria-expanded="${isSettingsOpen}">
                ${iconSettings}
              </button>

              <div class="controls-settings-popover ${isSettingsOpen ? 'is-open' : ''}" id="controls-settings-popover">
                <div class="settings-popover-header">
                  <span class="settings-popover-title">Configuración</span>
                  <button class="btn-close-popover" id="btn-close-popover" title="Cerrar menú">✕</button>
                </div>

                <div class="settings-popover-content">
                  <!-- Selector dinámico de videos asociados con offset -->
                  <div class="popover-item video-selector-group" title="Seleccionar pista o video asociado">
                    <label for="video-select">Video:</label>
                    <div class="video-select-actions">
                      <select id="video-select" class="select-input select-video">
                        ${videosOptionsHtml}
                      </select>
                      <button class="btn btn-xs btn-outline btn-manage-song-videos" title="Gestionar videos y offsets de esta canción">
                        ${iconSettings}
                      </button>
                    </div>
                  </div>

                  <!-- Selector de Frases Anteriores (0 a 3) -->
                  <div class="popover-item selector-group past-lines-group" title="Cantidad de frases anteriores visibles arriba de la actual">
                    <label for="past-lines-select">Anteriores:</label>
                    <select id="past-lines-select" class="select-input select-small">
                      <option value="0" ${pastLinesCount === 0 ? 'selected' : ''}>Ninguna</option>
                      <option value="1" ${pastLinesCount === 1 ? 'selected' : ''}>1 frase</option>
                      <option value="2" ${pastLinesCount === 2 ? 'selected' : ''}>2 frases</option>
                      <option value="3" ${pastLinesCount === 3 ? 'selected' : ''}>3 frases</option>
                    </select>
                  </div>

                  <!-- Selector de Frases Siguientes (0 a 3) -->
                  <div class="popover-item selector-group preview-lines-group" title="Cantidad de frases siguientes visibles debajo de la actual">
                    <label for="preview-lines-select">Siguientes:</label>
                    <select id="preview-lines-select" class="select-input select-small">
                      <option value="0" ${previewLinesCount === 0 ? 'selected' : ''}>Ninguna (solo actual)</option>
                      <option value="1" ${previewLinesCount === 1 ? 'selected' : ''}>1 frase</option>
                      <option value="2" ${previewLinesCount === 2 ? 'selected' : ''}>2 frases</option>
                      <option value="3" ${previewLinesCount === 3 ? 'selected' : ''}>3 frases</option>
                    </select>
                  </div>

                  <!-- Selector de Escritura / Alternativo (Caracteres vs Romaji) -->
                  <div class="popover-item selector-group script-selector-group" title="Modo de visualización de texto original y alternativo (Romaji)" ${!hasAltText ? 'style="display: none;"' : ''}>
                    <label for="script-select">Texto:</label>
                    <select id="script-select" class="select-input select-small" ${!hasAltText ? 'disabled' : ''}>
                      <option value="both" ${scriptDisplayMode === 'both' ? 'selected' : ''}>Caracteres + Alternativo</option>
                      <option value="original" ${scriptDisplayMode === 'original' ? 'selected' : ''}>Solo Caracteres</option>
                      <option value="alt" ${scriptDisplayMode === 'alt' ? 'selected' : ''}>Solo Alternativo (Romaji)</option>
                    </select>
                  </div>

                  <!-- Selector de Traducción -->
                  <div class="popover-item selector-group translation-group" title="Seleccionar subtítulo de traducción en cursiva" ${translations.length === 0 ? 'style="display: none;"' : ''}>
                    <label for="trans-select">Traducción:</label>
                    <select id="trans-select" class="select-input select-small" ${translations.length === 0 ? 'disabled' : ''}>
                      ${translationsHtml}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    const playBtn = containerElement.querySelector('.btn-play-pause')
    if (playBtn) playBtn.addEventListener('click', () => onPlayToggle && onPlayToggle())

    const prevBtn = containerElement.querySelector('#btn-prev-song')
    if (prevBtn) prevBtn.addEventListener('click', () => onPrevSong && onPrevSong())

    const nextBtn = containerElement.querySelector('#btn-next-song')
    if (nextBtn) nextBtn.addEventListener('click', () => onNextSong && onNextSong())

    const plBtn = containerElement.querySelector('#btn-controls-playlist')
    if (plBtn) plBtn.addEventListener('click', () => onOpenPlaylist && onOpenPlaylist())

    const seekSlider = containerElement.querySelector('.seek-slider')
    if (seekSlider) {
      const startSeek = () => {
        isUserSeeking = true
      }
      const endSeek = () => {
        if (isUserSeeking) {
          isUserSeeking = false
          const val = Number(seekSlider.value)
          if (onSeek) onSeek(val)
          seekSlider.blur()
        }
      }

      seekSlider.addEventListener('pointerdown', startSeek)
      seekSlider.addEventListener('mousedown', startSeek)
      seekSlider.addEventListener('touchstart', startSeek, { passive: true })

      seekSlider.addEventListener('input', (e) => {
        isUserSeeking = true
        const val = Number(e.target.value)
        currentTime = val
        const curEl = containerElement.querySelector('.current-time')
        if (curEl) curEl.textContent = formatTime(Math.max(0, val))
      })
      seekSlider.addEventListener('change', (e) => {
        isUserSeeking = false
        const val = Number(e.target.value)
        if (onSeek) onSeek(val)
        seekSlider.blur()
      })
      seekSlider.addEventListener('pointerup', endSeek)
      seekSlider.addEventListener('mouseup', endSeek)
      seekSlider.addEventListener('touchend', endSeek)
    }

    const volumeSlider = containerElement.querySelector('.volume-slider')
    const volumeLabel = containerElement.querySelector('.volume-percent-label')
    const muteBtn = containerElement.querySelector('.btn-mute-toggle')

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value)
        currentVolume = val
        if (val > 0) previousVolume = val
        if (volumeLabel) volumeLabel.textContent = `${val}%`
        if (muteBtn) {
          muteBtn.innerHTML = val === 0 ? iconVolumeMute : iconVolume
          muteBtn.title = val === 0 ? 'Activar sonido' : 'Silenciar'
        }
        if (onVolumeChange) onVolumeChange(val)
      })
    }

    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        if (currentVolume > 0) {
          previousVolume = currentVolume
          currentVolume = 0
        } else {
          currentVolume = previousVolume > 0 ? previousVolume : 80
        }
        if (volumeSlider) volumeSlider.value = currentVolume
        if (volumeLabel) volumeLabel.textContent = `${currentVolume}%`
        muteBtn.innerHTML = currentVolume === 0 ? iconVolumeMute : iconVolume
        muteBtn.title = currentVolume === 0 ? 'Activar sonido' : 'Silenciar'
        if (onVolumeChange) onVolumeChange(currentVolume)
      })
    }

    const videoSelect = containerElement.querySelector('#video-select')
    if (videoSelect) {
      videoSelect.addEventListener('change', (e) => {
        const vidId = e.target.value
        activeVideoId = vidId
        if (onVideoChange) onVideoChange(vidId)
      })
    }

    const manageVideosBtn = containerElement.querySelector('.btn-manage-song-videos')
    if (manageVideosBtn) {
      manageVideosBtn.addEventListener('click', () => {
        if (onManageVideos) onManageVideos()
      })
    }

    const scriptSelect = containerElement.querySelector('#script-select')
    if (scriptSelect) {
      scriptSelect.addEventListener('change', (e) => {
        const val = e.target.value
        if (val === 'both' || val === 'original' || val === 'alt') {
          scriptDisplayMode = val
          if (onScriptDisplayModeChange) onScriptDisplayModeChange(val)
        }
      })
    }

    const transSelect = containerElement.querySelector('#trans-select')
    if (transSelect) {
      transSelect.addEventListener('change', (e) => {
        if (onTranslationChange) onTranslationChange(e.target.value)
      })
    }

    const pastLinesSelect = containerElement.querySelector('#past-lines-select')
    if (pastLinesSelect) {
      pastLinesSelect.addEventListener('change', (e) => {
        const val = Number(e.target.value)
        const count = isNaN(val) ? 0 : Math.max(0, Math.min(3, val))
        pastLinesCount = count
        localStorage.setItem('saranga_past_lines', count)
        if (onPastLinesChange) onPastLinesChange(count)
        else if (onPreviousLinesChange) onPreviousLinesChange(count)
      })
    }

    const previewLinesSelect = containerElement.querySelector('#preview-lines-select')
    if (previewLinesSelect) {
      previewLinesSelect.addEventListener('change', (e) => {
        const val = Number(e.target.value)
        const count = isNaN(val) ? 2 : Math.max(0, Math.min(3, val))
        previewLinesCount = count
        localStorage.setItem('saranga_preview_lines', count)
        if (onPreviewLinesChange) onPreviewLinesChange(count)
      })
    }

    const modeBtn = containerElement.querySelector('.btn-mode-toggle')
    if (modeBtn) {
      modeBtn.addEventListener('click', () => {
        const nextMode = currentMode === 'basic' ? 'advanced' : 'basic'
        if (onModeToggle) onModeToggle(nextMode)
      })
    }

    const editBtn = containerElement.querySelector('#btn-controls-edit')
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (onEditSong) onEditSong()
      })
    }

    const themeBtn = containerElement.querySelector('#btn-controls-theme')
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        if (onOpenTheme) onOpenTheme()
      })
    }

    const menuBtn = containerElement.querySelector('#btn-controls-menu')
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        if (onGoToMenu) onGoToMenu()
        else if (onOpenLibrary) onOpenLibrary()
      })
    }

    // Pantalla completa
    const fullscreenBtn = containerElement.querySelector('#btn-controls-fullscreen')
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        isSettingsOpen = false
        if (onToggleFullscreen) onToggleFullscreen()
      })
    }

    const settingsToggleBtn = containerElement.querySelector('#btn-controls-settings-toggle')
    const settingsPopover = containerElement.querySelector('#controls-settings-popover')
    const closePopoverBtn = containerElement.querySelector('#btn-close-popover')

    if (settingsToggleBtn) {
      settingsToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        isSettingsOpen = !isSettingsOpen
        if (settingsPopover) {
          settingsPopover.classList.toggle('is-open', isSettingsOpen)
        }
        settingsToggleBtn.classList.toggle('is-active', isSettingsOpen)
        settingsToggleBtn.setAttribute('aria-expanded', String(isSettingsOpen))
      })
    }

    if (closePopoverBtn) {
      closePopoverBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        isSettingsOpen = false
        if (settingsPopover) {
          settingsPopover.classList.remove('is-open')
        }
        if (settingsToggleBtn) {
          settingsToggleBtn.classList.remove('is-active')
          settingsToggleBtn.setAttribute('aria-expanded', 'false')
        }
      })
    }

    if (settingsPopover) {
      settingsPopover.addEventListener('click', (e) => {
        e.stopPropagation()
      })
    }

    const onDocumentClick = (e) => {
      if (!isSettingsOpen) return
      const wrapper = containerElement.querySelector('.controls-settings-wrapper')
      if (wrapper && !wrapper.contains(e.target)) {
        isSettingsOpen = false
        if (settingsPopover) {
          settingsPopover.classList.remove('is-open')
        }
        if (settingsToggleBtn) {
          settingsToggleBtn.classList.remove('is-active')
          settingsToggleBtn.setAttribute('aria-expanded', 'false')
        }
      }
    }

    document.addEventListener('click', onDocumentClick)
  }

  function setPlayingState(playing) {
    if (isPlaying !== playing) {
      isPlaying = playing
      const playBtn = containerElement.querySelector('.btn-play-pause')
      if (playBtn) {
        playBtn.title = isPlaying ? 'Pausar' : 'Reproducir'
        const iconEl = playBtn.querySelector('.icon')
        if (iconEl) iconEl.innerHTML = isPlaying ? iconPause : iconPlay
        const labelEl = playBtn.querySelector('.label')
        if (labelEl) labelEl.textContent = isPlaying ? 'Pausa' : 'Cantar'
      }
    }
  }

  function setDuration(dur) {
    if (duration !== dur) {
      duration = dur
      const durEl = containerElement.querySelector('.duration-time')
      if (durEl) durEl.textContent = formatTime(dur)
      const seekSlider = containerElement.querySelector('.seek-slider')
      if (seekSlider) seekSlider.max = Math.max(1, dur)
    }
  }

  function setTime(time) {
    currentTime = time
    const curEl = containerElement.querySelector('.current-time')
    if (curEl) curEl.textContent = formatTime(Math.max(0, time))
    const seekSlider = containerElement.querySelector('.seek-slider')
    if (seekSlider && !isUserSeeking) {
      seekSlider.value = Math.max(0, time)
    }
  }

  function setVideosState({ videos, activeId }) {
    availableVideos = videos || []
    activeVideoId = activeId || (availableVideos[0]?.id || null)
    render()
  }

  function setTrackType(trackType) {
    currentTrackType = trackType
    if (availableVideos.length > 1) {
      activeVideoId = trackType === TRACK_TYPE.INSTRUMENTAL ? availableVideos[1].id : availableVideos[0].id
    }
    render()
  }

  function setLanguagesState({ languages, active, translation, bilingual }) {
    availableLanguages = languages || []
    activeLanguage = active
    translationLanguage = translation
    isBilingual = bilingual
    render()
  }

  function setPreviewLinesCount(count) {
    const val = Number(count)
    previewLinesCount = isNaN(val) ? 2 : Math.max(0, Math.min(3, val))
    const sel = containerElement?.querySelector('#preview-lines-select')
    if (sel) sel.value = String(previewLinesCount)
  }

  function setPastLinesCount(count) {
    const val = Number(count)
    pastLinesCount = isNaN(val) ? 0 : Math.max(0, Math.min(3, val))
    const sel = containerElement?.querySelector('#past-lines-select')
    if (sel) sel.value = String(pastLinesCount)
  }

  function setScriptState({ hasAltText: hasAlt, mode }) {
    if (hasAlt !== undefined) hasAltText = Boolean(hasAlt)
    if (mode === 'both' || mode === 'original' || mode === 'alt') {
      scriptDisplayMode = mode
    }
    render()
  }

  function setScriptDisplayMode(mode) {
    if (mode === 'both' || mode === 'original' || mode === 'alt') {
      scriptDisplayMode = mode
      const sel = containerElement?.querySelector('#script-select')
      if (sel) sel.value = mode
    }
  }

  function setMode(mode) {
    currentMode = mode
    render()
  }

  function setVolume(val) {
    const v = Math.max(0, Math.min(100, Number(val) || 0))
    currentVolume = v
    if (v > 0) previousVolume = v
    const volumeSlider = containerElement?.querySelector('.volume-slider')
    const volumeLabel = containerElement?.querySelector('.volume-percent-label')
    const muteBtn = containerElement?.querySelector('.btn-mute-toggle')
    if (volumeSlider) volumeSlider.value = String(v)
    if (volumeLabel) volumeLabel.textContent = `${v}%`
    if (muteBtn) {
      muteBtn.innerHTML = v === 0 ? iconVolumeMute : iconVolume
      muteBtn.title = v === 0 ? 'Activar sonido' : 'Silenciar'
    }
  }

  function setPlaylistState({ count = 0, hasNext = false, hasPrev = false } = {}) {
    playlistCount = Number(count) || 0
    hasNextSong = Boolean(hasNext)
    hasPrevSong = Boolean(hasPrev)

    const prevBtn = containerElement?.querySelector('#btn-prev-song')
    if (prevBtn) prevBtn.disabled = !hasPrevSong

    const nextBtn = containerElement?.querySelector('#btn-next-song')
    if (nextBtn) nextBtn.disabled = !hasNextSong

    const badgeEl = containerElement?.querySelector('.playlist-badge-count')
    if (badgeEl) {
      badgeEl.textContent = playlistCount
      if (playlistCount > 0) {
        badgeEl.classList.add('has-items')
      } else {
        badgeEl.classList.remove('has-items')
      }
    }

    const plBtn = containerElement?.querySelector('#btn-controls-playlist')
    if (plBtn) {
      plBtn.title = `Abrir lista de reproducción (${playlistCount} canciones)`
    }
  }

  return {
    render,
    setPlayingState,
    setDuration,
    setTime,
    setVideosState,
    setTrackType,
    setLanguagesState,
    setPreviewLinesCount,
    getPreviewLinesCount: () => previewLinesCount,
    setPastLinesCount,
    getPastLinesCount: () => pastLinesCount,
    setPreviousLinesCount: setPastLinesCount,
    getPreviousLinesCount: () => pastLinesCount,
    setScriptState,
    setScriptDisplayMode,
    getScriptDisplayMode: () => scriptDisplayMode,
    setMode,
    setVolume,
    setPlaylistState,
    getIsDockCollapsed: () => false,
    setDockCollapsed: () => {}
  }
}
