import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createControlsView } from '../../src/views/controlsView.js'
import { createBasicViewer } from '../../src/views/basicViewer.js'

describe('lyricsModeFullscreen and background navigation', () => {
  let appContainer = null
  let lyricsScreen = null
  let header = null
  let controlsDock = null
  let lyricsViewport = null
  let btnExitFullscreen = null

  beforeEach(() => {
    document.body.innerHTML = ''
    appContainer = document.createElement('div')
    appContainer.id = 'app'

    header = document.createElement('header')
    header.className = 'app-header'
    appContainer.appendChild(header)

    lyricsScreen = document.createElement('section')
    lyricsScreen.className = 'screen-view screen-lyrics'
    lyricsScreen.id = 'lyrics-screen'

    btnExitFullscreen = document.createElement('button')
    btnExitFullscreen.id = 'btn-exit-fullscreen'
    btnExitFullscreen.className = 'btn btn-outline btn-exit-fullscreen'
    lyricsScreen.appendChild(btnExitFullscreen)

    const mainStage = document.createElement('main')
    mainStage.className = 'main-stage-container'
    lyricsViewport = document.createElement('section')
    lyricsViewport.id = 'lyrics-viewport'
    lyricsViewport.className = 'lyrics-stage-viewport'
    mainStage.appendChild(lyricsViewport)
    lyricsScreen.appendChild(mainStage)

    controlsDock = document.createElement('footer')
    controlsDock.id = 'controls-dock'
    controlsDock.className = 'controls-dock'
    lyricsScreen.appendChild(controlsDock)

    appContainer.appendChild(lyricsScreen)
    document.body.appendChild(appContainer)
  })

  it('activa modo pantalla completa desde controles, ocultando controles y header, y permite salir', () => {
    function enterFullscreenMode() {
      appContainer.classList.add('is-fullscreen-lyrics')
      document.body.classList.add('is-fullscreen-lyrics')
    }

    function exitFullscreenMode() {
      appContainer.classList.remove('is-fullscreen-lyrics')
      document.body.classList.remove('is-fullscreen-lyrics')
    }

    btnExitFullscreen.addEventListener('click', (e) => {
      e.stopPropagation()
      exitFullscreenMode()
    })

    const controls = createControlsView({
      containerElement: controlsDock,
      onToggleFullscreen: enterFullscreenMode
    })
    controls.render()

    const fsBtn = controlsDock.querySelector('#btn-controls-fullscreen')
    expect(fsBtn).not.toBeNull()

    // 1. Antes de activar pantalla completa
    expect(appContainer.classList.contains('is-fullscreen-lyrics')).toBe(false)

    // 2. Clic en pantalla completa
    fsBtn.click()
    expect(appContainer.classList.contains('is-fullscreen-lyrics')).toBe(true)

    // 3. Clic en salir de pantalla completa
    btnExitFullscreen.click()
    expect(appContainer.classList.contains('is-fullscreen-lyrics')).toBe(false)
  })

  it('lleva al usuario a la lista de canciones al hacer clic en el fondo del reproductor', () => {
    const onGoToMenu = vi.fn()

    lyricsScreen.addEventListener('click', (e) => {
      if (e.target.closest('#controls-dock, .modal-dialog, #btn-exit-fullscreen, button, input, select, textarea, a, .upcoming-phrase-item')) {
        return
      }
      onGoToMenu()
    })

    const viewer = createBasicViewer(lyricsViewport, {
      onSeekLine: vi.fn()
    })
    viewer.setLyrics({
      lines: [
        { id: '1', startTime: 0, endTime: 5, text: 'Línea uno', syllables: [] },
        { id: '2', startTime: 6, endTime: 10, text: 'Línea dos', syllables: [] }
      ]
    })

    // 1. Clic en el fondo del viewport
    lyricsViewport.click()
    expect(onGoToMenu).toHaveBeenCalledTimes(1)

    // 2. Clic en una frase siguiente (upcoming-phrase-item) no debe ir al menú
    const upcoming = lyricsViewport.querySelector('.upcoming-phrase-item')
    if (upcoming) {
      upcoming.click()
      expect(onGoToMenu).toHaveBeenCalledTimes(1)
    }

    // 3. Clic dentro del dock de controles no debe ir al menú
    controlsDock.click()
    expect(onGoToMenu).toHaveBeenCalledTimes(1)
  })
})
