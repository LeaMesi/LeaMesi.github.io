import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createOnlineLyricsModal } from '../../src/views/onlineLyricsModal.js'

describe('views/onlineLyricsModal.js', () => {
  let container = null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('abre el modal y renderiza pestañas de proveedores y barra de búsqueda', () => {
    const modal = createOnlineLyricsModal({ containerElement: container })
    modal.open()

    expect(container.classList.contains('is-open')).toBe(true)
    expect(container.querySelector('#online-input-all')).not.toBeNull()
    expect(container.querySelector('#btn-do-online-search')).not.toBeNull()

    const providerTabs = container.querySelectorAll('.online-provider-tab')
    expect(providerTabs.length).toBe(4)
  })

  it('permite alternar entre pestañas de proveedores (BetterLyrics, Genius, LRCLIB)', () => {
    const modal = createOnlineLyricsModal({ containerElement: container })
    modal.open()

    const blTab = container.querySelector('[data-provider="betterlyrics"]')
    expect(blTab).not.toBeNull()
    blTab.click()

    expect(container.querySelector('.bl-mode-tab')).not.toBeNull()
  })

  it('cierra el diálogo al pulsar el botón de cerrar', () => {
    const modal = createOnlineLyricsModal({ containerElement: container })
    modal.open()

    const closeBtn = container.querySelector('.btn-close-modal')
    closeBtn.click()

    expect(container.classList.contains('is-open')).toBe(false)
  })
})
