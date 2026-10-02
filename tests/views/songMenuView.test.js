import { describe, it, expect, beforeEach, vi } from 'vitest'
import { getDB } from '../../src/services/db.js'
import { saveSong } from '../../src/services/songService.js'
import { createSongMenuView } from '../../src/views/songMenuView.js'

describe('views/songMenuView.js', () => {
  let container = null

  beforeEach(async () => {
    localStorage.clear()
    await getDB()
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('carga canciones desde la base de datos y renderiza en modo cuadrícula', async () => {
    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    const cards = container.querySelectorAll('.song-menu-card')
    expect(cards.length).toBeGreaterThanOrEqual(2)
    expect(container.textContent).toContain('Caminando por la Ciudad')
  })

  it('permite alternar entre modo cuadrícula y modo lista persistiendo en localStorage', async () => {
    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    const listBtn = container.querySelector('#btn-view-list')
    expect(listBtn).not.toBeNull()
    listBtn.click()

    expect(localStorage.getItem('saranga_menu_view_mode')).toBe('list')
    const listRows = container.querySelectorAll('.song-menu-list-row')
    expect(listRows.length).toBeGreaterThanOrEqual(2)
  })

  it('filtra canciones en tiempo real mediante la barra de búsqueda', async () => {
    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    const searchInput = container.querySelector('#song-search-input')
    searchInput.value = 'Caminando'
    searchInput.dispatchEvent(new Event('input'))

    const visibleCards = container.querySelectorAll('.song-menu-card')
    expect(visibleCards.length).toBe(1)
    expect(container.textContent).toContain('Caminando por la Ciudad')
  })

  it('dispara onEnterLyricsMode al pulsar en Entrar a Modo Letra', async () => {
    const onEnterLyricsMode = vi.fn()
    const menu = createSongMenuView({ containerElement: container, onEnterLyricsMode })
    await menu.refresh()

    const enterBtn = container.querySelector('.btn-enter-lyrics')
    expect(enterBtn).not.toBeNull()
    enterBtn.click()

    expect(onEnterLyricsMode).toHaveBeenCalled()
  })

  it('dispara onCreateNewSong y onSearchOnlineLyrics desde sus respectivos botones', async () => {
    const onCreateNewSong = vi.fn()
    const onSearchOnlineLyrics = vi.fn()
    const menu = createSongMenuView({ containerElement: container, onCreateNewSong, onSearchOnlineLyrics })
    await menu.refresh()

    const createBtn = container.querySelector('#btn-create-song')
    createBtn.click()
    expect(onCreateNewSong).toHaveBeenCalled()

    const searchOnlineBtn = container.querySelector('#btn-search-betterlyrics')
    searchOnlineBtn.click()
    expect(onSearchOnlineLyrics).toHaveBeenCalled()
  })

  it('no muestra los botones de exportación individual (JSON/Lyricsfile) en las tarjetas de la lista ni de la grilla', async () => {
    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    // Modo cuadrícula
    expect(container.querySelectorAll('.btn-export-json').length).toBe(0)
    expect(container.querySelectorAll('.btn-export-yaml').length).toBe(0)

    // Modo lista
    const listBtn = container.querySelector('#btn-view-list')
    listBtn.click()
    expect(container.querySelectorAll('.btn-export-json').length).toBe(0)
    expect(container.querySelectorAll('.btn-export-yaml').length).toBe(0)
  })
})
