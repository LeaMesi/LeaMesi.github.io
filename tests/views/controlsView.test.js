import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createControlsView } from '../../src/views/controlsView.js'

describe('views/controlsView.js', () => {
  let container = null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('renderiza la barra de controles con sus elementos interactivos', () => {
    const controls = createControlsView({ containerElement: container })
    controls.render()

    expect(container.querySelector('.btn-play-pause')).not.toBeNull()
    expect(container.querySelector('.volume-slider')).not.toBeNull()
    expect(container.querySelector('#video-select')).not.toBeNull()
    expect(container.querySelector('#script-select')).not.toBeNull()
    expect(container.querySelector('#trans-select')).not.toBeNull()
    expect(container.querySelector('#past-lines-select')).not.toBeNull()
    expect(container.querySelector('#preview-lines-select')).not.toBeNull()
    expect(container.querySelector('.settings-popover-content hr')).not.toBeNull()
  })

  it('dispara onPlayToggle al hacer clic en el botón de reproducción/pausa', () => {
    const onPlayToggle = vi.fn()
    const controls = createControlsView({ containerElement: container, onPlayToggle })
    controls.render()

    const playBtn = container.querySelector('.btn-play-pause')
    playBtn.click()
    expect(onPlayToggle).toHaveBeenCalled()

    controls.setPlayingState(true)
    expect(playBtn.title).toBe('Pausar')
  })

  it('gestiona el control de volumen y el botón de silenciado (mute)', () => {
    const onVolumeChange = vi.fn()
    const controls = createControlsView({
      containerElement: container,
      initialVolume: 70,
      onVolumeChange
    })
    controls.render()

    const muteBtn = container.querySelector('.btn-mute-toggle')
    expect(muteBtn).not.toBeNull()

    // Clic en mute silencia a 0
    muteBtn.click()
    expect(onVolumeChange).toHaveBeenCalledWith(0)

    // Clic en mute nuevamente restaura el volumen anterior
    muteBtn.click()
    expect(onVolumeChange).toHaveBeenCalledWith(70)
  })

  it('permite cambiar la cantidad de líneas siguientes y persiste en localStorage', () => {
    const onPreviewLinesChange = vi.fn()
    const controls = createControlsView({
      containerElement: container,
      initialPreviewLines: 2,
      onPreviewLinesChange
    })
    controls.render()

    const previewSelect = container.querySelector('#preview-lines-select')
    previewSelect.value = '0'
    previewSelect.dispatchEvent(new Event('change'))

    expect(onPreviewLinesChange).toHaveBeenCalledWith(0)
    expect(localStorage.getItem('saranga_preview_lines')).toBe('0')
  })

  it('permite cambiar la cantidad de líneas anteriores (0 a 3) y persiste en localStorage', () => {
    const onPastLinesChange = vi.fn()
    const controls = createControlsView({
      containerElement: container,
      initialPastLines: 0,
      onPastLinesChange
    })
    controls.render()

    const pastSelect = container.querySelector('#past-lines-select')
    expect(pastSelect.value).toBe('0')

    pastSelect.value = '2'
    pastSelect.dispatchEvent(new Event('change'))

    expect(onPastLinesChange).toHaveBeenCalledWith(2)
    expect(localStorage.getItem('saranga_past_lines')).toBe('2')
    expect(controls.getPastLinesCount()).toBe(2)

    // Modificar vía método público setPastLinesCount
    controls.setPastLinesCount(3)
    expect(pastSelect.value).toBe('3')
    expect(controls.getPastLinesCount()).toBe(3)
  })

  it('no incluye botones de esconder o expandir el dock y provee botón de pantalla completa', () => {
    const onToggleFullscreen = vi.fn()
    const controls = createControlsView({ containerElement: container, onToggleFullscreen })
    controls.render()

    expect(container.querySelector('#btn-dock-collapse')).toBeNull()
    expect(container.querySelector('#btn-dock-expand')).toBeNull()

    const fsBtn = container.querySelector('#btn-controls-fullscreen')
    expect(fsBtn).not.toBeNull()
    fsBtn.click()
    expect(onToggleFullscreen).toHaveBeenCalled()
  })

  it('dispara onScriptDisplayModeChange al alternar el modo de texto', () => {
    const onScriptDisplayModeChange = vi.fn()
    const controls = createControlsView({
      containerElement: container,
      onScriptDisplayModeChange
    })
    controls.render()
    controls.setScriptState({ hasAltText: true, mode: 'both' })

    const scriptSelect = container.querySelector('#script-select')
    scriptSelect.value = 'alt'
    scriptSelect.dispatchEvent(new Event('change'))

    expect(onScriptDisplayModeChange).toHaveBeenCalledWith('alt')
  })

  it('ubica el botón de pantalla completa en el centro y organiza video, siguientes y traducción en el menú de configuración', () => {
    const controls = createControlsView({ containerElement: container })
    controls.render()

    // 1. El botón de pantalla completa debe estar centrado en .center-controls
    const centerControls = container.querySelector('.center-controls')
    expect(centerControls).not.toBeNull()
    const fsBtn = centerControls.querySelector('#btn-controls-fullscreen')
    expect(fsBtn).not.toBeNull()
    expect(Array.from(centerControls.children)[0]).toBe(fsBtn)

    // 2. Ruedita de configuración y popover deben existir en los controles
    const settingsToggleBtn = container.querySelector('#btn-controls-settings-toggle')
    const popover = container.querySelector('#controls-settings-popover')
    expect(settingsToggleBtn).not.toBeNull()
    expect(popover).not.toBeNull()
    expect(popover.classList.contains('is-open')).toBe(false)

    // Al hacer clic en la ruedita, el popover se abre
    settingsToggleBtn.click()
    expect(popover.classList.contains('is-open')).toBe(true)

    // 3. Los selectores de video, anteriores, siguientes y traducción residen dentro del popover
    const popoverContent = popover.querySelector('.settings-popover-content')
    const pastGroup = popoverContent.querySelector('.past-lines-group')
    const previewGroup = popoverContent.querySelector('.preview-lines-group')
    const videoGroup = popoverContent.querySelector('.video-selector-group')
    const scriptGroup = popoverContent.querySelector('.script-selector-group')
    const transGroup = popoverContent.querySelector('.translation-group')

    expect(pastGroup).not.toBeNull()
    expect(previewGroup).not.toBeNull()
    expect(videoGroup).not.toBeNull()
    expect(scriptGroup).not.toBeNull()
    expect(transGroup).not.toBeNull()

    // 4. Sin altText ni traducciones por defecto, texto y traducción deben estar ocultos (display: none)
    expect(scriptGroup.style.display).toBe('none')
    expect(transGroup.style.display).toBe('none')

    // 5. Al activar hasAltText, el selector de texto debe hacerse visible
    controls.setScriptState({ hasAltText: true, mode: 'both' })
    const updatedScriptGroup = container.querySelector('.script-selector-group')
    expect(updatedScriptGroup.style.display).not.toBe('none')

    // 6. Al proveer traducciones disponibles, el selector de traducción debe hacerse visible
    controls.setLanguagesState({
      languages: [
        { code: 'es', name: 'Español', isMain: true },
        { code: 'en', name: 'English', isMain: false }
      ],
      active: { code: 'es' },
      translation: null,
      bilingual: false
    })
    const updatedTransGroup = container.querySelector('.translation-group')
    expect(updatedTransGroup.style.display).not.toBe('none')
  })

  it('actualiza el valor de seek-slider con setTime tras hacer clic o buscar en la barra de progreso sin quedarse quieto', () => {
    const onSeek = vi.fn()
    const controls = createControlsView({ containerElement: container, onSeek })
    controls.render()
    controls.setDuration(200)

    const seekSlider = container.querySelector('.seek-slider')
    expect(seekSlider).not.toBeNull()

    // 1. Simular clic/arrastre de búsqueda
    seekSlider.focus()
    seekSlider.value = '50'
    seekSlider.dispatchEvent(new Event('input'))
    seekSlider.dispatchEvent(new Event('change'))

    expect(onSeek).toHaveBeenCalledWith(50)

    // 2. setTime debe actualizar seekSlider a 55 aunque haya tenido foco
    controls.setTime(55)
    expect(seekSlider.value).toBe('55')

    // 3. Continuar avanzando a 60
    controls.setTime(60)
    expect(seekSlider.value).toBe('60')
  })

  it('soporta controles de playlist (anterior, siguiente, apertura y estado reactivo)', () => {
    const onPrevSong = vi.fn()
    const onNextSong = vi.fn()
    const onOpenPlaylist = vi.fn()

    const controls = createControlsView({
      containerElement: container,
      onPrevSong,
      onNextSong,
      onOpenPlaylist
    })
    controls.render()

    const prevBtn = container.querySelector('#btn-prev-song')
    const nextBtn = container.querySelector('#btn-next-song')
    const plBtn = container.querySelector('#btn-controls-playlist')
    const countBadge = container.querySelector('.playlist-badge-count')

    expect(prevBtn).not.toBeNull()
    expect(nextBtn).not.toBeNull()
    expect(plBtn).not.toBeNull()

    // Inicialmente deshabilitados si no hay canciones
    expect(prevBtn.disabled).toBe(true)
    expect(nextBtn.disabled).toBe(true)

    // Actualizar estado de playlist
    controls.setPlaylistState({ count: 5, hasNext: true, hasPrev: true })
    expect(prevBtn.disabled).toBe(false)
    expect(nextBtn.disabled).toBe(false)
    expect(countBadge.textContent).toBe('5')
    expect(countBadge.classList.contains('has-items')).toBe(true)

    // Clics
    prevBtn.click()
    expect(onPrevSong).toHaveBeenCalled()

    nextBtn.click()
    expect(onNextSong).toHaveBeenCalled()

    plBtn.click()
    expect(onOpenPlaylist).toHaveBeenCalled()
  })

  it('actualiza correctamente los botones de controlsView cuando una canción se añade automáticamente mediante playlistService', () => {
    const controls = createControlsView({ containerElement: container })
    controls.render()

    const prevBtn = container.querySelector('#btn-prev-song')
    const nextBtn = container.querySelector('#btn-next-song')
    const countBadge = container.querySelector('.playlist-badge-count')

    // 1. Simular primera canción añadida a playlist
    controls.setPlaylistState({ count: 1, hasNext: false, hasPrev: false })
    expect(prevBtn.disabled).toBe(true)
    expect(nextBtn.disabled).toBe(true)
    expect(countBadge.textContent).toBe('1')

    // 2. Simular segunda canción que no estaba y se añade automáticamente al final
    controls.setPlaylistState({ count: 2, hasNext: false, hasPrev: true })
    expect(prevBtn.disabled).toBe(false) // La primera es anterior
    expect(nextBtn.disabled).toBe(true)
    expect(countBadge.textContent).toBe('2')

    // 3. Volver a la primera canción: la segunda pasa a ser siguiente
    controls.setPlaylistState({ count: 2, hasNext: true, hasPrev: false })
    expect(prevBtn.disabled).toBe(true)
    expect(nextBtn.disabled).toBe(false)
    expect(countBadge.textContent).toBe('2')
  })

  it('lleva a la lista de canciones al hacer clic en el fondo de los controles pero no al hacer clic en botones o sliders', () => {
    const onGoToMenu = vi.fn()
    const controls = createControlsView({
      containerElement: container,
      onGoToMenu
    })
    controls.render()

    // 1. Clic en botón de reproducción no debe llamar onGoToMenu
    const playBtn = container.querySelector('.btn-play-pause')
    playBtn.click()
    expect(onGoToMenu).not.toHaveBeenCalled()

    // 2. Clic en el slider de búsqueda no debe llamar onGoToMenu
    const seekSlider = container.querySelector('.seek-slider')
    seekSlider.click()
    expect(onGoToMenu).not.toHaveBeenCalled()

    // 3. Clic en el slider de volumen no debe llamar onGoToMenu
    const volumeSlider = container.querySelector('.volume-slider')
    volumeSlider.click()
    expect(onGoToMenu).not.toHaveBeenCalled()

    // 4. Clic en el fondo del contenedor de controles sí debe llamar onGoToMenu
    container.click()
    expect(onGoToMenu).toHaveBeenCalledTimes(1)
  })

  describe('Ajuste rápido de offset (-0.1s y +0.1s)', () => {
    it('muestra el valor del offset formateado en el badge central', () => {
      const controls = createControlsView({ containerElement: container })
      controls.setVideosState({
        videos: [
          { id: 'v1', name: 'Original', offset: 0.5 }
        ],
        activeId: 'v1'
      })

      const badge = container.querySelector('#controls-offset-value')
      expect(badge).not.toBeNull()
      expect(badge.textContent).toBe('+0.5s')
      expect(controls.getOffset()).toBe(0.5)
    })

    it('ajusta el offset con -0.1s y +0.1s, dispara onOffsetChange y actualiza la UI', () => {
      const onOffsetChange = vi.fn()
      const controls = createControlsView({
        containerElement: container,
        onOffsetChange
      })
      controls.setVideosState({
        videos: [
          { id: 'v1', name: 'Video 1', offset: 0.0 },
          { id: 'v2', name: 'Video 2', offset: 1.2 }
        ],
        activeId: 'v1'
      })

      const badge = container.querySelector('#controls-offset-value')
      const btnDec = container.querySelector('#btn-offset-dec')
      const btnInc = container.querySelector('#btn-offset-inc')

      expect(badge.textContent).toBe('0.0s')

      // Clic en +0.1s
      btnInc.click()
      expect(onOffsetChange).toHaveBeenCalledWith(0.1, 'v1')
      expect(badge.textContent).toBe('+0.1s')
      expect(controls.getOffset()).toBe(0.1)

      const videoSelect = container.querySelector('#video-select')
      const optV1 = videoSelect.querySelector('option[value="v1"]')
      expect(optV1.textContent).toBe('Video 1 [0.1s]')

      // Clic en -0.1s dos veces
      btnDec.click()
      expect(onOffsetChange).toHaveBeenCalledWith(0.0, 'v1')
      expect(badge.textContent).toBe('0.0s')
      expect(optV1.textContent).toBe('Video 1 [0s]')

      btnDec.click()
      expect(onOffsetChange).toHaveBeenCalledWith(-0.1, 'v1')
      expect(badge.textContent).toBe('-0.1s')
      expect(controls.getOffset()).toBe(-0.1)
      expect(optV1.textContent).toBe('Video 1 [-0.1s]')
    })

    it('actualiza el badge del offset al cambiar de video en el selector', () => {
      const controls = createControlsView({ containerElement: container })
      controls.setVideosState({
        videos: [
          { id: 'v1', name: 'Pista 1', offset: 0.0 },
          { id: 'v2', name: 'Pista 2', offset: -1.5 }
        ],
        activeId: 'v1'
      })

      const badge = container.querySelector('#controls-offset-value')
      const videoSelect = container.querySelector('#video-select')
      expect(badge.textContent).toBe('0.0s')

      // Cambiar al video 2
      videoSelect.value = 'v2'
      videoSelect.dispatchEvent(new Event('change'))

      expect(badge.textContent).toBe('-1.5s')
    })

    it('permite actualizar el offset externamente con setOffset', () => {
      const controls = createControlsView({ containerElement: container })
      controls.setVideosState({
        videos: [{ id: 'v1', name: 'Pista 1', offset: 0.0 }],
        activeId: 'v1'
      })

      controls.setOffset(2.4)
      const badge = container.querySelector('#controls-offset-value')
      expect(badge.textContent).toBe('+2.4s')
      expect(controls.getOffset()).toBe(2.4)
      expect(container.querySelector('#video-select option[value="v1"]').textContent).toBe('Pista 1 [2.4s]')
    })

    it('deshabilita los botones de offset si no hay videos disponibles', () => {
      const controls = createControlsView({ containerElement: container })
      controls.setVideosState({ videos: [], activeId: null })

      const btnDec = container.querySelector('#btn-offset-dec')
      const btnInc = container.querySelector('#btn-offset-inc')
      expect(btnDec.disabled).toBe(true)
      expect(btnInc.disabled).toBe(true)
    })
  })

  describe('Prevención de fuga de clics y gestión de popover de configuración', () => {
    it('no navega al menú al hacer clic en el botón de reproducción o en botones interactivos', () => {
      const onGoToMenu = vi.fn()
      const onPlayToggle = vi.fn()
      const controls = createControlsView({
        containerElement: container,
        onGoToMenu,
        onPlayToggle
      })
      controls.render()

      const playBtn = container.querySelector('.btn-play-pause')
      // Simular cambio de estado durante el clic
      playBtn.addEventListener('click', () => {
        controls.setPlayingState(true)
      })

      playBtn.click()
      expect(onPlayToggle).toHaveBeenCalled()
      expect(onGoToMenu).not.toHaveBeenCalled()
    })

    it('abre y cierra el menú de configuración al interactuar con el toggle y con el documento', () => {
      const controls = createControlsView({ containerElement: container })
      controls.render()

      const settingsToggle = container.querySelector('#btn-controls-settings-toggle')
      const popover = container.querySelector('#controls-settings-popover')

      expect(popover.classList.contains('is-open')).toBe(false)

      // Abrir popover
      settingsToggle.click()
      expect(popover.classList.contains('is-open')).toBe(true)
      expect(settingsToggle.classList.contains('is-active')).toBe(true)

      // Clic dentro del popover no debe cerrarlo
      popover.click()
      expect(popover.classList.contains('is-open')).toBe(true)

      // Clic fuera en el documento debe cerrarlo
      const outsideEl = document.createElement('div')
      document.body.appendChild(outsideEl)
      outsideEl.click()

      expect(popover.classList.contains('is-open')).toBe(false)
      expect(settingsToggle.classList.contains('is-active')).toBe(false)
      outsideEl.remove()
    })

    it('navega al menú solo cuando se hace clic en el área vacía del dock fuera del área segura', () => {
      const onGoToMenu = vi.fn()
      const controls = createControlsView({
        containerElement: container,
        onGoToMenu
      })
      controls.render()

      // Clic directo en el contenedor principal sin coordenadas (fallback feliz sin layout)
      container.dispatchEvent(new MouseEvent('click', { bubbles: true }))
      expect(onGoToMenu).toHaveBeenCalledTimes(1)
    })

    it('no navega al menú al hacer clic dentro de la barra de progreso o en su área segura', () => {
      const onGoToMenu = vi.fn()
      const onSeek = vi.fn()
      const controls = createControlsView({
        containerElement: container,
        onGoToMenu,
        onSeek
      })
      controls.render()
      controls.setDuration(100)

      const progressRow = container.querySelector('.progress-bar-row')
      const seekSlider = container.querySelector('.seek-slider')

      // Mock de rectángulos para simular dock, fila y slider
      container.getBoundingClientRect = () => ({
        top: 600,
        bottom: 700,
        left: 0,
        right: 400,
        width: 400,
        height: 100
      })
      progressRow.getBoundingClientRect = () => ({
        top: 612,
        bottom: 632,
        left: 20,
        right: 380,
        width: 360,
        height: 20
      })
      seekSlider.getBoundingClientRect = () => ({
        top: 618,
        bottom: 626,
        left: 60,
        right: 340,
        width: 280,
        height: 8
      })

      // 1. Clic dentro de progress-bar-row no navega al menú
      progressRow.dispatchEvent(new MouseEvent('click', {
        clientX: 200, // En el medio del slider -> 50%
        clientY: 622,
        bubbles: true
      }))
      expect(onGoToMenu).not.toHaveBeenCalled()
      expect(onSeek).toHaveBeenCalledWith(50)

      // 2. Clic en el área segura arriba del slider (en el padding superior del dock: clientY = 605)
      container.dispatchEvent(new MouseEvent('click', {
        clientX: 200,
        clientY: 605,
        bubbles: true
      }))
      expect(onGoToMenu).not.toHaveBeenCalled()
      expect(onSeek).toHaveBeenCalledWith(50)

      // 3. Clic fuera del área segura (en la zona de controles principales: clientY = 670)
      container.dispatchEvent(new MouseEvent('click', {
        clientX: 200,
        clientY: 670,
        bubbles: true
      }))
      expect(onGoToMenu).toHaveBeenCalledTimes(1)
    })

    it('abre y cierra el menú de volumen al pulsar el botón y permite deslizar la pista con eventos de puntero/táctiles', () => {
      const onVolumeChange = vi.fn()
      const controls = createControlsView({
        containerElement: container,
        initialVolume: 60,
        onVolumeChange
      })
      controls.render()

      const volumeBtn = container.querySelector('#btn-controls-volume')
      const volumePopover = container.querySelector('#controls-volume-popover')
      const sliderTrack = container.querySelector('.controls-volume-slider-track')
      const volumePercent = container.querySelector('.volume-percent-label')

      expect(volumeBtn).not.toBeNull()
      expect(volumePopover).not.toBeNull()
      expect(volumePopover.classList.contains('is-open')).toBe(false)

      // Simular getBoundingClientRect para emular entorno móvil
      window.innerWidth = 375
      window.innerHeight = 667
      volumeBtn.getBoundingClientRect = () => ({
        top: 600,
        bottom: 638,
        left: 120,
        right: 158,
        width: 38,
        height: 38
      })
      sliderTrack.getBoundingClientRect = () => ({
        top: 480,
        bottom: 580,
        left: 120,
        right: 154,
        width: 34,
        height: 100
      })

      // Abrir popover de volumen
      volumeBtn.click()
      expect(volumePopover.classList.contains('is-open')).toBe(true)
      expect(volumeBtn.classList.contains('is-active')).toBe(true)
      expect(volumePopover.style.position).toBe('fixed')

      // Interacción en la pista vertical (pointerdown en la mitad superior: clientY = 530 -> (580 - 530) / 100 = 50%)
      sliderTrack.dispatchEvent(new MouseEvent('pointerdown', {
        clientY: 530,
        bubbles: true,
        cancelable: true
      }))
      expect(onVolumeChange).toHaveBeenCalledWith(50)
      expect(volumePercent.textContent).toBe('50%')

      // Clic fuera para cerrar
      const outsideEl = document.createElement('div')
      document.body.appendChild(outsideEl)
      outsideEl.click()

      expect(volumePopover.classList.contains('is-open')).toBe(false)
      expect(volumeBtn.classList.contains('is-active')).toBe(false)
      expect(volumePopover.style.position).toBe('')
      outsideEl.remove()
    })
  })
})


