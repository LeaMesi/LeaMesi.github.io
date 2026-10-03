import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createFloatingPlayerView } from '../../src/views/floatingPlayerView.js'

describe('views/floatingPlayerView.js', () => {
  let container = null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('no muestra el reproductor si no está visible o no hay canción', () => {
    const floatingPlayer = createFloatingPlayerView({ containerElement: container })
    floatingPlayer.render()

    expect(container.style.display).toBe('none')
    expect(floatingPlayer.getIsVisible()).toBe(false)
  })

  it('se muestra cuando está visible y tiene una canción activa', () => {
    const floatingPlayer = createFloatingPlayerView({ containerElement: container })
    floatingPlayer.setSong({ id: 1, title: 'Still Alive', artist: 'GLaDOS' })
    floatingPlayer.setVisible(true)

    expect(container.style.display).toBe('block')
    expect(floatingPlayer.getIsVisible()).toBe(true)

    const titleEl = container.querySelector('.floating-song-title')
    const artistEl = container.querySelector('.floating-song-artist')
    expect(titleEl?.textContent).toBe('Still Alive')
    expect(artistEl?.textContent).toContain('GLaDOS')
  })

  it('dispara onOpenLyrics al pulsar en la info de la canción o en el botón de letra', () => {
    const onOpenLyrics = vi.fn()
    const floatingPlayer = createFloatingPlayerView({
      containerElement: container,
      onOpenLyrics
    })
    floatingPlayer.setSong({ id: 1, title: 'Still Alive' })
    floatingPlayer.setVisible(true)

    const infoEl = container.querySelector('#floating-track-info')
    const btnLyrics = container.querySelector('#btn-floating-lyrics')

    infoEl?.click()
    expect(onOpenLyrics).toHaveBeenCalledTimes(1)

    btnLyrics?.click()
    expect(onOpenLyrics).toHaveBeenCalledTimes(2)
  })

  it('dispara onPlayToggle y alterna estado de reproducción', () => {
    const onPlayToggle = vi.fn()
    const floatingPlayer = createFloatingPlayerView({
      containerElement: container,
      onPlayToggle
    })
    floatingPlayer.setSong({ id: 1, title: 'Still Alive' })
    floatingPlayer.setVisible(true)

    const btnPlay = container.querySelector('#btn-floating-play')
    expect(btnPlay?.title).toBe('Reproducir')

    btnPlay?.click()
    expect(onPlayToggle).toHaveBeenCalled()

    floatingPlayer.setPlayingState(true)
    expect(btnPlay?.title).toBe('Pausar')

    floatingPlayer.setPlayingState(false)
    expect(btnPlay?.title).toBe('Reproducir')
  })

  it('dispara onRestartSong al pulsar el botón de volver a empezar', () => {
    const onRestartSong = vi.fn()
    const floatingPlayer = createFloatingPlayerView({
      containerElement: container,
      onRestartSong
    })
    floatingPlayer.setSong({ id: 1, title: 'Still Alive' })
    floatingPlayer.setVisible(true)

    const btnRestart = container.querySelector('#btn-floating-restart')
    btnRestart?.click()

    expect(onRestartSong).toHaveBeenCalled()
  })

  it('gestiona botones de anterior y siguiente según estado de la playlist', () => {
    const onPrevSong = vi.fn()
    const onNextSong = vi.fn()
    const floatingPlayer = createFloatingPlayerView({
      containerElement: container,
      onPrevSong,
      onNextSong
    })
    floatingPlayer.setSong({ id: 1, title: 'Still Alive' })
    floatingPlayer.setVisible(true)

    const btnPrev = container.querySelector('#btn-floating-prev')
    const btnNext = container.querySelector('#btn-floating-next')

    // Inicialmente deshabilitados
    expect(btnPrev?.disabled).toBe(true)
    expect(btnNext?.disabled).toBe(true)

    // Habilitar siguiente
    floatingPlayer.setPlaylistState({ hasNext: true, hasPrev: false })
    expect(btnPrev?.disabled).toBe(true)
    expect(btnNext?.disabled).toBe(false)

    btnNext?.click()
    expect(onNextSong).toHaveBeenCalled()

    // Habilitar anterior
    floatingPlayer.setPlaylistState({ hasNext: false, hasPrev: true })
    expect(btnPrev?.disabled).toBe(false)
    expect(btnNext?.disabled).toBe(true)

    btnPrev?.click()
    expect(onPrevSong).toHaveBeenCalled()
  })

  it('controla el volumen y botón de silenciado (mute)', () => {
    const onVolumeChange = vi.fn()
    const floatingPlayer = createFloatingPlayerView({
      containerElement: container,
      initialVolume: 60,
      onVolumeChange
    })
    floatingPlayer.setSong({ id: 1, title: 'Still Alive' })
    floatingPlayer.setVisible(true)

    const btnMute = container.querySelector('#btn-floating-mute')
    const slider = container.querySelector('#floating-volume-slider')

    expect(slider?.value).toBe('60')

    // Clic en mute silencia a 0
    btnMute?.click()
    expect(onVolumeChange).toHaveBeenCalledWith(0)
    expect(slider?.value).toBe('0')

    // Clic en mute restaura volumen previo
    btnMute?.click()
    expect(onVolumeChange).toHaveBeenCalledWith(60)
    expect(slider?.value).toBe('60')

    // Cambio con slider
    slider.value = '40'
    slider.dispatchEvent(new Event('input'))
    expect(onVolumeChange).toHaveBeenCalledWith(40)
  })

  it('actualiza el tiempo y maneja el control deslizante de posición (seek)', () => {
    const onSeek = vi.fn()
    const floatingPlayer = createFloatingPlayerView({
      containerElement: container,
      onSeek
    })
    floatingPlayer.setSong({ id: 1, title: 'Still Alive' })
    floatingPlayer.setVisible(true)

    floatingPlayer.setDuration(200)
    floatingPlayer.setTime(50)

    const curTimeEl = container.querySelector('#floating-time-current')
    const durTimeEl = container.querySelector('#floating-time-duration')
    const seekSlider = container.querySelector('#floating-seek-slider')

    expect(curTimeEl?.textContent).toBe('00:50')
    expect(durTimeEl?.textContent).toBe('03:20')
    expect(seekSlider?.value).toBe('50')

    // Simular búsqueda del usuario
    seekSlider.value = '120'
    seekSlider.dispatchEvent(new Event('change'))

    expect(onSeek).toHaveBeenCalledWith(120)
  })

  it('inicializa con estado en pausa y tiempo en 0 al pre-cargarse', () => {
    const floatingPlayer = createFloatingPlayerView({ containerElement: container })
    floatingPlayer.setSong({ id: 1, title: 'Still Alive', artist: 'GLaDOS' })
    floatingPlayer.setDuration(180)
    floatingPlayer.setTime(0)
    floatingPlayer.setPlayingState(false)
    floatingPlayer.setVisible(true)

    const btnPlay = container.querySelector('#btn-floating-play')
    const curTimeEl = container.querySelector('#floating-time-current')
    const durTimeEl = container.querySelector('#floating-time-duration')

    expect(btnPlay?.title).toBe('Reproducir')
    expect(curTimeEl?.textContent).toBe('00:00')
    expect(durTimeEl?.textContent).toBe('03:00')
    expect(floatingPlayer.getIsVisible()).toBe(true)
  })
})
