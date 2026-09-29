import { formatTime } from '../lyrics/timing.js'
import { TRACK_TYPE } from '../player/mediaPlayer.js'
import {
  iconPlay,
  iconPause,
  iconSettings,
  iconEdit,
  iconArrowLeft
} from './icons.js'

export function createControlsView({
  containerElement,
  onPlayToggle,
  onSeek,
  onVideoChange,
  onManageVideos,
  onTrackToggle,
  onLanguageChange,
  onTranslationChange,
  onBilingualToggle,
  onOpenLibrary,
  onGoToMenu,
  onModeToggle,
  onEditSong
}) {
  let isPlaying = false
  let duration = 0
  let currentTime = 0
  let currentTrackType = TRACK_TYPE.OFFICIAL
  let availableVideos = []
  let activeVideoId = null
  let availableLanguages = []
  let activeLanguage = null
  let translationLanguage = null
  let isBilingual = true
  let currentMode = 'basic' // 'basic' | 'advanced'

  function render() {
    if (!containerElement) return

    const languagesHtml = availableLanguages.map(lang => `
      <option value="${lang.code}" ${activeLanguage && activeLanguage.code === lang.code ? 'selected' : ''}>
        ${lang.name} ${lang.isMain ? '(Principal)' : ''}
      </option>
    `).join('')

    const translations = availableLanguages.filter(l => !l.isMain)
    const translationsHtml = translations.map(lang => `
      <option value="${lang.code}" ${translationLanguage && translationLanguage.code === lang.code ? 'selected' : ''}>
        ${lang.name}
      </option>
    `).join('')

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
            <button class="btn btn-primary btn-play-pause" title="${isPlaying ? 'Pausar' : 'Reproducir'}">
              <span class="icon">${isPlaying ? iconPause : iconPlay}</span>
              <span class="label">${isPlaying ? 'Pausa' : 'Cantar'}</span>
            </button>

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
            <!-- Selector de idioma activo -->
            <div class="selector-group">
              <label for="lang-select">Idioma:</label>
              <select id="lang-select" class="select-input">
                ${languagesHtml}
              </select>
            </div>

            <!-- Subtítulo bilingüe -->
            ${translations.length > 0 ? `
              <div class="bilingual-group">
                <label class="checkbox-label" title="Mostrar traducción simultánea bajo la letra original">
                  <input type="checkbox" id="bilingual-toggle" ${isBilingual ? 'checked' : ''} />
                  <span>Subtítulo</span>
                </label>
                ${isBilingual && translations.length > 1 ? `
                  <select id="trans-lang-select" class="select-input select-small">
                    ${translationsHtml}
                  </select>
                ` : ''}
              </div>
            ` : ''}
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

            <!-- Volver al Menú de Selección de Canciones -->
            <button class="btn btn-menu-return" id="btn-controls-menu" title="Volver al menú de selección de canciones">
              ${iconArrowLeft} Menú Canciones
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

    const langSelect = containerElement.querySelector('#lang-select')
    if (langSelect) {
      langSelect.addEventListener('change', (e) => {
        if (onLanguageChange) onLanguageChange(e.target.value)
      })
    }

    const bilingualToggle = containerElement.querySelector('#bilingual-toggle')
    if (bilingualToggle) {
      bilingualToggle.addEventListener('change', (e) => {
        if (onBilingualToggle) onBilingualToggle(e.target.checked)
      })
    }

    const transLangSelect = containerElement.querySelector('#trans-lang-select')
    if (transLangSelect) {
      transLangSelect.addEventListener('change', (e) => {
        if (onTranslationChange) onTranslationChange(e.target.value)
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

    const menuBtn = containerElement.querySelector('#btn-controls-menu')
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        if (onGoToMenu) onGoToMenu()
        else if (onOpenLibrary) onOpenLibrary()
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

  function setMode(mode) {
    currentMode = mode
    render()
  }

  return {
    render,
    setPlayingState,
    setDuration,
    setTime,
    setVideosState,
    setTrackType,
    setLanguagesState,
    setMode
  }
}
