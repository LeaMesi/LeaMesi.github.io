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
})
