import { formatTime } from '../lyrics/timing.js'
import {
  iconPlay,
  iconPause,
  iconSkipBack,
  iconSkipForward,
  iconRotateCcw,
  iconVolume,
  iconVolumeMute,
  iconMic
} from './icons.js'

export function createFloatingPlayerView({
  containerElement,
  initialVolume = 80,
  onPlayToggle,
  onSeek,
  onVolumeChange,
  onPrevSong,
  onNextSong,
  onRestartSong,
  onOpenLyrics
}) {
  let isPlaying = false
  let duration = 0
  let currentTime = 0
  let isUserSeeking = false
  let currentVolume = Math.max(0, Math.min(100, Number(initialVolume) || 80))
  let previousVolume = currentVolume > 0 ? currentVolume : 80
  let currentSong = null
  let hasNextSong = false
  let hasPrevSong = false
  let isVisible = false

  function render() {
    if (!containerElement) return

    if (!isVisible || !currentSong) {
      containerElement.style.display = 'none'
      containerElement.innerHTML = ''
      return
    }

    containerElement.style.display = 'block'
    const title = currentSong?.title || 'Sin título'
    const artist = currentSong?.artist ? `por ${currentSong.artist}` : ''

    containerElement.innerHTML = `
      <div class="floating-player-widget" id="floating-player-widget" role="region" aria-label="Reproductor flotante">
        <!-- Fila 1: Información de pista y botón modo letra -->
        <div class="floating-header-row">
          <div class="floating-track-info" id="floating-track-info" title="Haz clic para ver la letra completa">
            <span class="floating-song-title">${title}</span>
            ${artist ? `<span class="floating-song-artist">${artist}</span>` : ''}
          </div>
          <button class="btn-floating-action btn-floating-lyrics" id="btn-floating-lyrics" title="Entrar a Modo Letra">
            ${iconMic} <span class="floating-lyrics-text">Letra</span>
          </button>
        </div>

        <!-- Fila 2: Barra de tiempo y control de progreso -->
        <div class="floating-progress-row">
          <span class="floating-time floating-time-current" id="floating-time-current">${formatTime(currentTime)}</span>
          <input
            type="range"
            class="floating-seek-slider"
            id="floating-seek-slider"
            min="0"
            max="${Math.max(1, duration)}"
            value="${currentTime}"
            step="0.1"
            aria-label="Posición de la canción"
          />
          <span class="floating-time floating-time-duration" id="floating-time-duration">${formatTime(duration)}</span>
        </div>

        <!-- Fila 3: Controles de transporte y volumen -->
        <div class="floating-controls-row">
          <!-- Control de volumen -->
          <div class="floating-volume-group">
            <button class="btn-floating-icon btn-floating-mute" id="btn-floating-mute" title="${currentVolume === 0 ? 'Activar sonido' : 'Silenciar'}">
              ${currentVolume === 0 ? iconVolumeMute : iconVolume}
            </button>
            <input
              type="range"
              class="floating-volume-slider"
              id="floating-volume-slider"
              min="0"
              max="100"
              value="${currentVolume}"
              aria-label="Control de volumen"
            />
          </div>

          <!-- Botones de reproducción -->
          <div class="floating-transport-group">
            <button
              class="btn-floating-icon btn-floating-restart"
              id="btn-floating-restart"
              title="Volver a empezar (0:00)"
              aria-label="Volver a empezar"
            >
              ${iconRotateCcw}
            </button>

            <button
              class="btn-floating-icon btn-floating-prev"
              id="btn-floating-prev"
              title="Canción anterior"
              aria-label="Canción anterior"
              ${!hasPrevSong ? 'disabled' : ''}
            >
              ${iconSkipBack}
            </button>

            <button
              class="btn-floating-icon btn-floating-play"
              id="btn-floating-play"
              title="${isPlaying ? 'Pausar' : 'Reproducir'}"
              aria-label="${isPlaying ? 'Pausar' : 'Reproducir'}"
            >
              ${isPlaying ? iconPause : iconPlay}
            </button>

            <button
              class="btn-floating-icon btn-floating-next"
              id="btn-floating-next"
              title="Siguiente canción"
              aria-label="Siguiente canción"
              ${!hasNextSong ? 'disabled' : ''}
            >
              ${iconSkipForward}
            </button>
          </div>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    if (!containerElement) return

    // Clic en la info de la canción o botón de letra
    const trackInfoEl = containerElement.querySelector('#floating-track-info')
    if (trackInfoEl) {
      trackInfoEl.addEventListener('click', () => {
        if (onOpenLyrics) onOpenLyrics()
      })
    }

    const btnLyrics = containerElement.querySelector('#btn-floating-lyrics')
    if (btnLyrics) {
      btnLyrics.addEventListener('click', () => {
        if (onOpenLyrics) onOpenLyrics()
      })
    }

    // Play / Pause
    const btnPlay = containerElement.querySelector('#btn-floating-play')
    if (btnPlay) {
      btnPlay.addEventListener('click', () => {
        if (onPlayToggle) onPlayToggle()
      })
    }

    // Volver a empezar (Seek 0)
    const btnRestart = containerElement.querySelector('#btn-floating-restart')
    if (btnRestart) {
      btnRestart.addEventListener('click', () => {
        if (onRestartSong) onRestartSong()
      })
    }

    // Canción anterior
    const btnPrev = containerElement.querySelector('#btn-floating-prev')
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (onPrevSong) onPrevSong()
      })
    }

    // Canción siguiente
    const btnNext = containerElement.querySelector('#btn-floating-next')
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (onNextSong) onNextSong()
      })
    }

    // Barra de tiempo / Seek
    const seekSlider = containerElement.querySelector('#floating-seek-slider')
    const curTimeEl = containerElement.querySelector('#floating-time-current')
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
        if (curTimeEl) curTimeEl.textContent = formatTime(Math.max(0, val))
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

    // Control de volumen
    const volumeSlider = containerElement.querySelector('#floating-volume-slider')
    const btnMute = containerElement.querySelector('#btn-floating-mute')

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value)
        currentVolume = val
        if (val > 0) previousVolume = val
        if (btnMute) {
          btnMute.innerHTML = val === 0 ? iconVolumeMute : iconVolume
          btnMute.title = val === 0 ? 'Activar sonido' : 'Silenciar'
        }
        if (onVolumeChange) onVolumeChange(val)
      })
    }

    if (btnMute) {
      btnMute.addEventListener('click', () => {
        if (currentVolume > 0) {
          previousVolume = currentVolume
          currentVolume = 0
        } else {
          currentVolume = previousVolume > 0 ? previousVolume : 80
        }
        if (volumeSlider) volumeSlider.value = currentVolume
        btnMute.innerHTML = currentVolume === 0 ? iconVolumeMute : iconVolume
        btnMute.title = currentVolume === 0 ? 'Activar sonido' : 'Silenciar'
        if (onVolumeChange) onVolumeChange(currentVolume)
      })
    }
  }

  function setSong(song) {
    currentSong = song
    if (isVisible) {
      render()
    }
  }

  function setPlayingState(playing) {
    isPlaying = Boolean(playing)
    const btnPlay = containerElement?.querySelector('#btn-floating-play')
    if (btnPlay) {
      btnPlay.innerHTML = isPlaying ? iconPause : iconPlay
      btnPlay.title = isPlaying ? 'Pausar' : 'Reproducir'
      btnPlay.setAttribute('aria-label', isPlaying ? 'Pausar' : 'Reproducir')
    }
  }

  function setTime(timeInSeconds) {
    currentTime = Number(timeInSeconds) || 0
    if (!isUserSeeking && containerElement) {
      const seekSlider = containerElement.querySelector('#floating-seek-slider')
      const curTimeEl = containerElement.querySelector('#floating-time-current')
      if (seekSlider) seekSlider.value = currentTime
      if (curTimeEl) curTimeEl.textContent = formatTime(Math.max(0, currentTime))
    }
  }

  function setDuration(durInSeconds) {
    duration = Number(durInSeconds) || 0
    if (containerElement) {
      const seekSlider = containerElement.querySelector('#floating-seek-slider')
      const durTimeEl = containerElement.querySelector('#floating-time-duration')
      if (seekSlider) seekSlider.max = Math.max(1, duration)
      if (durTimeEl) durTimeEl.textContent = formatTime(duration)
    }
  }

  function setVolume(vol) {
    currentVolume = Math.max(0, Math.min(100, Number(vol) || 0))
    if (currentVolume > 0) previousVolume = currentVolume
    if (containerElement) {
      const volumeSlider = containerElement.querySelector('#floating-volume-slider')
      const btnMute = containerElement.querySelector('#btn-floating-mute')
      if (volumeSlider) volumeSlider.value = currentVolume
      if (btnMute) {
        btnMute.innerHTML = currentVolume === 0 ? iconVolumeMute : iconVolume
        btnMute.title = currentVolume === 0 ? 'Activar sonido' : 'Silenciar'
      }
    }
  }

  function setPlaylistState({ hasNext, hasPrev }) {
    hasNextSong = Boolean(hasNext)
    hasPrevSong = Boolean(hasPrev)
    if (containerElement) {
      const btnPrev = containerElement.querySelector('#btn-floating-prev')
      const btnNext = containerElement.querySelector('#btn-floating-next')
      if (btnPrev) btnPrev.disabled = !hasPrevSong
      if (btnNext) btnNext.disabled = !hasNextSong
    }
  }

  function setVisible(visible) {
    isVisible = Boolean(visible)
    render()
  }

  function getIsVisible() {
    return isVisible && currentSong !== null
  }

  return {
    render,
    setSong,
    setPlayingState,
    setTime,
    setDuration,
    setVolume,
    setPlaylistState,
    setVisible,
    getIsVisible
  }
}
