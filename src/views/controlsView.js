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
  iconChevronDown,
  iconChevronUp
} from './icons.js'

export function createControlsView({
  containerElement,
  initialPreviewLines = 2,
  initialVolume = 80,
  onPlayToggle,
  onSeek,
  onVolumeChange,
  onVideoChange,
  onManageVideos,
  onTrackToggle,
  onLanguageChange,
  onTranslationChange,
  onBilingualToggle,
  onPreviewLinesChange,
  onOpenLibrary,
  onGoToMenu,
  onModeToggle,
  onEditSong,
  onOpenTheme
}) {
  let isPlaying = false
  let duration = 0
  let currentTime = 0
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
  let currentMode = 'basic' // 'basic' | 'advanced'
  let isDockCollapsed = false

  function render() {
    if (!containerElement) return

    if (isDockCollapsed) {
      containerElement.classList.add('is-collapsed')
      if (containerElement.parentElement) {
        containerElement.parentElement.classList.add('has-collapsed-dock')
      }
    } else {
      containerElement.classList.remove('is-collapsed')
      if (containerElement.parentElement) {
        containerElement.parentElement.classList.remove('has-collapsed-dock')
      }
    }

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
      ${isDockCollapsed ? `
        <button class="btn-dock-floating-expand" id="btn-dock-expand" title="Mostrar barra de controles">
          ${iconChevronUp} <span>Controles</span>
        </button>
      ` : ''}
      <div class="controls-wrapper ${isDockCollapsed ? 'is-hidden-dock' : ''}">
        <!-- Barra de progreso superior -->
        <div class="progress-bar-row">
          <span class="time-label current-time">${formatTime(Math.max(0, currentTime))}</span>
          <input type="range" class="seek-slider" min="0" max="${Math.max(1, duration)}" step="0.1" value="${Math.max(0, currentTime)}" />
          <span class="time-label duration-time">${formatTime(duration)}</span>
        </div>

        <!-- Fila de controles principales -->
        <div class="controls-main-row">
          <div class="left-controls">
            <button class="btn btn-primary btn-play-pause" title="${isPlaying ? 'Pausar' : 'Reproducir'}">
              <span class="icon">${isPlaying ? iconPause : iconPlay}</span>
              <span class="label">${isPlaying ? 'Pausa' : 'Cantar'}</span>
            </button>

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

            <!-- Selector dinámico de videos asociados con offset -->
            <div class="video-selector-group" title="Seleccionar pista o video asociado">
              <label for="video-select">Video:</label>
              <select id="video-select" class="select-input select-video">
                ${videosOptionsHtml}
              </select>
              <button class="btn btn-xs btn-outline btn-manage-song-videos" title="Gestionar videos y offsets de esta canción">
                ${iconSettings}
              </button>
            </div>
          </div>

          <div class="center-controls">
            <!-- Selector de Traducción -->
            <div class="selector-group translation-group" title="Seleccionar subtítulo de traducción en cursiva">
              <label for="trans-select">Traducción:</label>
              <select id="trans-select" class="select-input select-small" ${translations.length === 0 ? 'disabled' : ''}>
                ${translationsHtml}
              </select>
            </div>

            <!-- Selector de Frases Siguientes (0 a 3) -->
            <div class="selector-group preview-lines-group" title="Cantidad de frases siguientes visibles debajo de la actual">
              <label for="preview-lines-select">Siguientes:</label>
              <select id="preview-lines-select" class="select-input select-small">
                <option value="0" ${previewLinesCount === 0 ? 'selected' : ''}>Ninguna (solo actual)</option>
                <option value="1" ${previewLinesCount === 1 ? 'selected' : ''}>1 frase</option>
                <option value="2" ${previewLinesCount === 2 ? 'selected' : ''}>2 frases</option>
                <option value="3" ${previewLinesCount === 3 ? 'selected' : ''}>3 frases</option>
              </select>
            </div>
          </div>

          <div class="right-controls">

            <!-- Alternador de Modo: Sencillo vs Avanzado -->
            <button class="btn btn-mode-toggle" title="Cambiar modo de visualización">
              ${currentMode === 'basic' ? 'Modo Avanzado' : 'Modo Sencillo'}
            </button>

            <!-- Editar Letra de esta Canción -->
            <button class="btn btn-outline" id="btn-controls-edit" title="Editar letra, frases, sílabas e idiomas de esta canción">
              ${iconEdit} Editar
            </button>

            <!-- Botón Colapsar Barra de Controles (Modo Inmersivo) -->
            <button class="btn btn-outline btn-dock-collapse" id="btn-dock-collapse" title="Ocultar controles para pantalla completa de letras">
              ${iconChevronDown}
            </button>
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    const playBtn = containerElement.querySelector('.btn-play-pause')
    if (playBtn) playBtn.addEventListener('click', () => onPlayToggle && onPlayToggle())

    const seekSlider = containerElement.querySelector('.seek-slider')
    if (seekSlider) {
      seekSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value)
        currentTime = val
        const curEl = containerElement.querySelector('.current-time')
        if (curEl) curEl.textContent = formatTime(Math.max(0, val))
      })
      seekSlider.addEventListener('change', (e) => {
        const val = Number(e.target.value)
        if (onSeek) onSeek(val)
      })
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

    const transSelect = containerElement.querySelector('#trans-select')
    if (transSelect) {
      transSelect.addEventListener('change', (e) => {
        if (onTranslationChange) onTranslationChange(e.target.value)
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

    const collapseBtn = containerElement.querySelector('#btn-dock-collapse')
    if (collapseBtn) {
      collapseBtn.addEventListener('click', () => {
        isDockCollapsed = true
        render()
      })
    }

    const expandBtn = containerElement.querySelector('#btn-dock-expand')
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        isDockCollapsed = false
        render()
      })
    }
  }

  function setPlayingState(playing) {
    if (isPlaying !== playing) {
      isPlaying = playing
      const playBtn = containerElement.querySelector('.btn-play-pause')
      if (playBtn) {
        playBtn.title = isPlaying ? 'Pausar' : 'Reproducir'
        playBtn.querySelector('.icon').innerHTML = isPlaying ? iconPause : iconPlay
        playBtn.querySelector('.label').textContent = isPlaying ? 'Pausa' : 'Cantar'
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
    if (seekSlider && document.activeElement !== seekSlider) {
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

  return {
    render,
    setPlayingState,
    setDuration,
    setTime,
    setVideosState,
    setTrackType,
    setLanguagesState,
    setPreviewLinesCount,
    setMode,
    setVolume,
    getIsDockCollapsed: () => isDockCollapsed,
    setDockCollapsed: (val) => {
      isDockCollapsed = Boolean(val)
      render()
    }
  }
}
