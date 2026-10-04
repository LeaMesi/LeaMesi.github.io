import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createOnlineLyricsModal } from '../../src/views/onlineLyricsModal.js'
import * as onlineLyricsService from '../../src/services/onlineLyricsService.js'

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
    expect(providerTabs.length).toBe(5)
  })

  it('permite alternar entre pestañas de proveedores (BetterLyrics, LRC.red, Genius, LRCLIB)', () => {
    const modal = createOnlineLyricsModal({ containerElement: container })
    modal.open()

    const blTab = container.querySelector('[data-provider="betterlyrics"]')
    expect(blTab).not.toBeNull()
    blTab.click()
    expect(container.querySelector('.bl-mode-tab')).not.toBeNull()

    const redTab = container.querySelector('[data-provider="lrcred"]')
    expect(redTab).not.toBeNull()
    redTab.click()
    expect(container.querySelector('#provider-input-general')).not.toBeNull()
  })

  it('cierra el diálogo al pulsar el botón de cerrar', () => {
    const modal = createOnlineLyricsModal({ containerElement: container })
    modal.open()

    const closeBtn = container.querySelector('.btn-close-modal')
    closeBtn.click()

    expect(container.classList.contains('is-open')).toBe(false)
  })

  it('incluye un botón "+" primario sin texto a la izquierda del botón de cerrar que invoca onCreateEmptySong y cierra el modal', () => {
    const onCreateEmptySong = vi.fn()
    const modal = createOnlineLyricsModal({ containerElement: container, onCreateEmptySong })
    modal.open()

    const createBtn = container.querySelector('#btn-modal-create-empty')
    const closeBtn = container.querySelector('#btn-close-online-modal')

    expect(createBtn).not.toBeNull()
    expect(closeBtn).not.toBeNull()
    expect(createBtn.classList.contains('btn-primary')).toBe(true)
    expect(createBtn.textContent.trim()).toBe('')
    expect(createBtn.querySelector('svg')).not.toBeNull()
    expect(createBtn.nextElementSibling).toBe(closeBtn)

    createBtn.click()
    expect(onCreateEmptySong).toHaveBeenCalledTimes(1)
    expect(container.classList.contains('is-open')).toBe(false)
  })

  it('restablece el estado de importación y permite cargar canciones consecutivas sin dejar botones deshabilitados', async () => {
    const mockResults = [
      { id: 'song-1', song: 'Canción 1', artist: 'Artista 1', source: 'betterlyrics', syncType: 'richsync' },
      { id: 'song-2', song: 'Canción 2', artist: 'Artista 2', source: 'lrcred', syncType: 'richsync' }
    ]

    vi.spyOn(onlineLyricsService, 'searchOnlineLyrics').mockResolvedValue(mockResults)
    vi.spyOn(onlineLyricsService, 'buildSongPackageFromOnlineResult').mockResolvedValue({
      title: 'Canción 1',
      artist: 'Artista 1'
    })

    const onSongReady = vi.fn()
    const modal = createOnlineLyricsModal({ containerElement: container, onSongReady })
    modal.open()

    // 1. Ejecutar búsqueda
    const input = container.querySelector('#online-input-all')
    input.value = 'test'
    const searchBtn = container.querySelector('#btn-do-online-search')
    searchBtn.click()

    await vi.waitFor(() => {
      expect(container.querySelectorAll('.btn-select-bl-song').length).toBe(2)
    })

    // 2. Cargar la primera canción
    const selectBtn1 = container.querySelector('.btn-select-bl-song[data-item-id="song-1"]')
    expect(selectBtn1).not.toBeNull()
    expect(Boolean(selectBtn1.disabled)).toBe(false)
    selectBtn1.click()

    await vi.waitFor(() => {
      expect(onSongReady).toHaveBeenCalledTimes(1)
    })

    // El modal se cierra tras la importación
    expect(container.classList.contains('is-open')).toBe(false)

    // 3. Volver a abrir el modal y buscar de nuevo
    modal.open()
    expect(container.classList.contains('is-open')).toBe(true)

    const searchBtn2 = container.querySelector('#btn-do-online-search')
    searchBtn2.click()

    await vi.waitFor(() => {
      expect(container.querySelectorAll('.btn-select-bl-song').length).toBe(2)
    })

    // Verificar que los botones NO quedaron deshabilitados de la carga anterior
    const buttons = container.querySelectorAll('.btn-select-bl-song')
    buttons.forEach(btn => {
      expect(btn.disabled).toBe(false)
      expect(btn.textContent).toContain('Cargar en Editor')
    })
  })

  it('renderiza el botón flotante para volver arriba y reacciona al scroll y click', () => {
    const modal = createOnlineLyricsModal({ containerElement: container })
    modal.open()

    const scrollTopBtn = container.querySelector('#btn-online-scroll-top')
    expect(scrollTopBtn).not.toBeNull()
    expect(scrollTopBtn.textContent).toContain('Subir')
    expect(scrollTopBtn.classList.contains('is-visible')).toBe(false)

    const modalBody = container.querySelector('.online-modal-body')
    expect(modalBody).not.toBeNull()

    // Simular scroll hacia abajo
    modalBody.scrollTop = 120
    modalBody.dispatchEvent(new Event('scroll'))

    expect(scrollTopBtn.classList.contains('is-visible')).toBe(true)

    // Simular click en el botón de subir
    let scrolledTop = false
    modalBody.scrollTo = vi.fn((opts) => {
      if (opts?.top === 0) scrolledTop = true
    })
    scrollTopBtn.click()

    expect(scrolledTop).toBe(true)
  })

  it('aplica el modo layout-scroll-controls en pantalla móvil o cuando el espacio de resultados es reducido', () => {
    // Simular viewport móvil
    window.innerWidth = 390
    window.innerHeight = 800

    const modal = createOnlineLyricsModal({ containerElement: container })
    modal.open()

    const dialog = container.querySelector('.online-lyrics-modal-dialog')
    expect(dialog).not.toBeNull()
    expect(dialog.classList.contains('layout-scroll-controls')).toBe(true)
    expect(dialog.classList.contains('layout-fixed-controls')).toBe(false)
  })

  it('aplica el modo layout-fixed-controls en pantalla de escritorio con espacio amplio para resultados', () => {
    // Simular viewport escritorio amplio
    window.innerWidth = 1280
    window.innerHeight = 900

    const modal = createOnlineLyricsModal({ containerElement: container })
    modal.open()

    const dialog = container.querySelector('.online-lyrics-modal-dialog')
    const modalBody = container.querySelector('.online-modal-body')
    expect(dialog).not.toBeNull()
    expect(modalBody).not.toBeNull()

    // Mock clientHeight para simular escritorio amplio (modalBody 650px, controles 200px -> disponible 450px >= 260px)
    Object.defineProperty(modalBody, 'clientHeight', { value: 650, configurable: true })
    const inputsContainer = container.querySelector('.online-inputs-container')
    if (inputsContainer) {
      Object.defineProperty(inputsContainer, 'offsetHeight', { value: 120, configurable: true })
    }

    // Disparar resize
    window.dispatchEvent(new Event('resize'))

    expect(dialog.classList.contains('layout-fixed-controls')).toBe(true)
    expect(dialog.classList.contains('layout-scroll-controls')).toBe(false)
  })

  it('mantiene la integridad de la barra de proveedores y de búsqueda al desplegar resultados en móvil', async () => {
    window.innerWidth = 390
    window.innerHeight = 844

    const mockResults = [
      { id: 'res-1', song: 'Bohemian Rhapsody', artist: 'Queen', source: 'betterlyrics', syncType: 'richsync' },
      { id: 'res-2', song: 'Don\'t Stop Me Now', artist: 'Queen', source: 'lrcred', syncType: 'linesync' },
      { id: 'res-3', song: 'Radio Ga Ga', artist: 'Queen', source: 'genius', syncType: 'plain' }
    ]
    vi.spyOn(onlineLyricsService, 'searchOnlineLyrics').mockResolvedValue(mockResults)

    const modal = createOnlineLyricsModal({ containerElement: container })
    modal.open()

    const input = container.querySelector('#online-input-all')
    input.value = 'Queen'
    const searchBtn = container.querySelector('#btn-do-online-search')
    searchBtn.click()

    await vi.waitFor(() => {
      expect(container.querySelectorAll('.btn-select-bl-song').length).toBe(3)
    })

    const providersBar = container.querySelector('.online-providers-bar')
    const inputsContainer = container.querySelector('.online-inputs-container')
    const resultsContainer = container.querySelector('.online-results-container')

    expect(providersBar).not.toBeNull()
    expect(inputsContainer).not.toBeNull()
    expect(resultsContainer).not.toBeNull()

    // Comprobar que todos los botones de cada fuente están presentes
    const providerTabs = providersBar.querySelectorAll('.online-provider-tab')
    expect(providerTabs.length).toBe(5)

    // Verificar orden contiguo en el DOM para evitar solapamientos
    expect(providersBar.nextElementSibling).toBe(inputsContainer)
  })
})
