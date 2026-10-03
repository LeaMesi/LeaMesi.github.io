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
    expect(container.querySelector('#preview-lines-select')).not.toBeNull()
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

  it('permite colapsar y expandir el dock de controles (modo inmersivo)', () => {
    const controls = createControlsView({ containerElement: container })
    controls.render()

    const collapseBtn = container.querySelector('#btn-dock-collapse')
    collapseBtn.click()

    expect(controls.getIsDockCollapsed()).toBe(true)
    expect(container.classList.contains('is-collapsed')).toBe(true)

    // Botón flotante de expansión aparece
    const expandBtn = container.querySelector('#btn-dock-expand')
    expect(expandBtn).not.toBeNull()
    expandBtn.click()

    expect(controls.getIsDockCollapsed()).toBe(false)
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

  it('posiciona el selector de frases siguientes en primer lugar y oculta texto/traducción cuando no aplican', () => {
    const controls = createControlsView({ containerElement: container })
    controls.render()

    const centerControls = container.querySelector('.center-controls')
    const children = Array.from(centerControls.children)

    // 1. Selector 'siguientes' debe ser el primer hijo
    const previewGroup = container.querySelector('.preview-lines-group')
    expect(children[0]).toBe(previewGroup)

    // 2. Sin altText ni traducciones por defecto, texto y traducción deben estar ocultos (display: none)
    const scriptGroup = container.querySelector('.script-selector-group')
    const transGroup = container.querySelector('.translation-group')

    expect(scriptGroup.style.display).toBe('none')
    expect(transGroup.style.display).toBe('none')

    // 3. Al activar hasAltText, el selector de texto debe hacerse visible
    controls.setScriptState({ hasAltText: true, mode: 'both' })
    const updatedScriptGroup = container.querySelector('.script-selector-group')
    expect(updatedScriptGroup.style.display).not.toBe('none')

    // 4. Al proveer traducciones disponibles, el selector de traducción debe hacerse visible
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
})

