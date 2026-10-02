import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createThemeSettingsModal } from '../../src/views/themeSettingsModal.js'

describe('views/themeSettingsModal.js', () => {
  let container = null

  beforeEach(() => {
    localStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('abre el modal y renderiza controles de color, sliders y previsualización en vivo', () => {
    const modal = createThemeSettingsModal({ containerElement: container })
    modal.open()

    expect(container.classList.contains('is-open')).toBe(true)
    expect(container.querySelector('#theme-live-preview-box')).not.toBeNull()
    expect(container.querySelector('#slider-lyrics-scale')).not.toBeNull()
    expect(container.querySelector('#slider-translation-scale')).not.toBeNull()
    expect(container.querySelector('#picker-bg-color')).not.toBeNull()
  })

  it('aplica un preset cromático al hacer clic en su botón', () => {
    const onThemeChanged = vi.fn()
    const modal = createThemeSettingsModal({ containerElement: container, onThemeChanged })
    modal.open()

    const cyberpunkBtn = container.querySelector('[data-preset-id="cyberpunk"]')
    expect(cyberpunkBtn).not.toBeNull()
    cyberpunkBtn.click()

    expect(onThemeChanged).toHaveBeenCalled()
    const settings = onThemeChanged.mock.calls[0][0]
    expect(settings.primaryColor).toBe('#ec4899')
  })

  it('cierra el diálogo al pulsar el botón de cerrar', () => {
    const modal = createThemeSettingsModal({ containerElement: container })
    modal.open()

    const closeBtn = container.querySelector('.btn-close-modal')
    closeBtn.click()

    expect(container.classList.contains('is-open')).toBe(false)
  })
})
