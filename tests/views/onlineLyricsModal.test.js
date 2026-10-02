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
})
