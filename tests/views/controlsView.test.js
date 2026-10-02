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
})
