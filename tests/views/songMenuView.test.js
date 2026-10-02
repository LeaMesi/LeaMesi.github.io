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
    expect(container.textContent).toContain('Still Alive')
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
    searchInput.value = 'Still Alive'
    searchInput.dispatchEvent(new Event('input'))

    const visibleCards = container.querySelectorAll('.song-menu-card')
    expect(visibleCards.length).toBe(1)
    expect(container.textContent).toContain('Still Alive')
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

  it('muestra la barra de bibliotecas con la pestaña "Todas" activa por defecto', async () => {
    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    const allTab = container.querySelector('#lib-tab-all')
    expect(allTab).not.toBeNull()
    expect(allTab.classList.contains('is-active')).toBe(true)
    expect(container.querySelector('#btn-create-library')).not.toBeNull()
  })

  it('permite crear una biblioteca nueva y seleccionarla automáticamente', async () => {
    window.prompt = vi.fn().mockReturnValue('Rock Clásico')

    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    const createLibBtn = container.querySelector('#btn-create-library')
    createLibBtn.click()

    await new Promise(r => setTimeout(r, 100))

    const activeToolbar = container.querySelector('.active-library-toolbar')
    expect(activeToolbar).not.toBeNull()
    expect(activeToolbar.textContent).toContain('Rock Clásico')
  })

  it('filtra las canciones al hacer clic en una pestaña de biblioteca', async () => {
    const songId = await saveSong({ title: 'Song Exclusiva', artist: 'Artista' })
    const { createLibrary, addSongToLibrary } = await import('../../src/services/libraryService.js')
    const lib = await createLibrary('Exclusivas')
    await addSongToLibrary(songId, lib.id)

    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    // En "Todas", se ven las canciones del sistema y la nueva
    expect(container.textContent).toContain('Song Exclusiva')
    expect(container.textContent).toContain('Still Alive')

    // Clic en la pestaña de la biblioteca "Exclusivas"
    const libTab = container.querySelector(`.lib-tab-pill[data-library-id="${lib.id}"]`)
    expect(libTab).not.toBeNull()
    libTab.click()

    // Solo se debe ver la canción exclusiva
    expect(container.textContent).toContain('Song Exclusiva')
    expect(container.textContent).not.toContain('Still Alive')
  })

  it('permite renombrar la biblioteca activa', async () => {
    const { createLibrary } = await import('../../src/services/libraryService.js')
    const lib = await createLibrary('Nombre Inicial')

    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    // Seleccionar biblioteca
    const libTab = container.querySelector(`.lib-tab-pill[data-library-id="${lib.id}"]`)
    libTab.click()

    // Renombrar
    window.prompt = vi.fn().mockReturnValue('Nombre Cambiado')
    const renameBtn = container.querySelector('#btn-rename-active-library')
    expect(renameBtn).not.toBeNull()
    renameBtn.click()

    await new Promise(r => setTimeout(r, 100))

    expect(container.querySelector('.active-lib-title').textContent).toBe('Nombre Cambiado')
  })

  it('abre el modal para organizar canciones en bibliotecas y guarda los cambios', async () => {
    const { createLibrary, getSongLibraries } = await import('../../src/services/libraryService.js')
    const lib = await createLibrary('Favoritos Modal')

    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    // Clic en "Bibliotecas" de la primera canción
    const btnLibs = container.querySelector('.btn-song-libraries')
    expect(btnLibs).not.toBeNull()
    const targetSongId = Number(btnLibs.dataset.songId)
    btnLibs.click()

    // El modal de bibliotecas debe estar abierto
    const modal = container.querySelector('.song-libraries-modal')
    expect(modal).not.toBeNull()

    // Marcar la biblioteca "Favoritos Modal"
    const checkbox = modal.querySelector(`.lib-checkbox-input[data-library-id="${lib.id}"]`)
    expect(checkbox).not.toBeNull()
    checkbox.checked = true
    checkbox.dispatchEvent(new Event('change'))

    // Guardar
    const saveBtn = modal.querySelector('#btn-save-song-libs')
    saveBtn.click()

    await new Promise(r => setTimeout(r, 100))

    const songLibs = await getSongLibraries(targetSongId)
    expect(songLibs.some(l => l.id === lib.id)).toBe(true)
  })

  it('permite exportar la biblioteca activa mediante el botón de la barra', async () => {
    const { createLibrary } = await import('../../src/services/libraryService.js')
    const lib = await createLibrary('Lib Para Exportar')

    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    // Seleccionar biblioteca
    const libTab = container.querySelector(`.lib-tab-pill[data-library-id="${lib.id}"]`)
    libTab.click()

    const exportBtn = container.querySelector('#btn-export-active-library')
    expect(exportBtn).not.toBeNull()
    exportBtn.click()

    await new Promise(r => setTimeout(r, 100))
    expect(container.textContent).toContain('exportada con éxito')
  })

  it('permite eliminar la biblioteca activa regresando a la vista "Todas"', async () => {
    const { createLibrary, getLibraryById } = await import('../../src/services/libraryService.js')
    const lib = await createLibrary('Lib Para Borrar')

    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    // Seleccionar biblioteca
    const libTab = container.querySelector(`.lib-tab-pill[data-library-id="${lib.id}"]`)
    libTab.click()

    window.confirm = vi.fn().mockReturnValue(true)
    const deleteBtn = container.querySelector('#btn-delete-active-library')
    expect(deleteBtn).not.toBeNull()
    deleteBtn.click()

    await new Promise(r => setTimeout(r, 100))

    expect(await getLibraryById(lib.id)).toBeNull()
    const allTab = container.querySelector('#lib-tab-all')
    expect(allTab.classList.contains('is-active')).toBe(true)
  })

  it('muestra el modal interactivo de conflicto al importar una biblioteca con nombre repetido y permite combinar', async () => {
    const { createLibrary, getLibrarySongs } = await import('../../src/services/libraryService.js')
    const lib = await createLibrary('Biblioteca Duplicada')

    const menu = createSongMenuView({ containerElement: container })
    await menu.refresh()

    // Simular archivo JSON de biblioteca repetida en el dropzone
    const pkg = {
      version: '1.1.0',
      type: 'saranga-library-package',
      library: { name: 'Biblioteca Duplicada' },
      songs: [
        {
          title: 'Canción Desde Dropzone',
          artist: 'Artista Drop',
          genres: [],
          tags: [],
          lyrics_data: { languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }] }
        }
      ]
    }

    const file = new File([JSON.stringify(pkg)], 'biblioteca-duplicada.json', { type: 'application/json' })

    const dropzone = container.querySelector('#menu-file-dropzone') || container.querySelector('.btn-toggle-import')
    // Abrir importador
    const toggleImportBtn = container.querySelector('.btn-toggle-import')
    toggleImportBtn.click()

    const fileInput = container.querySelector('#menu-file-input')
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: true
    })
    fileInput.dispatchEvent(new Event('change'))

    await new Promise(r => setTimeout(r, 100))

    // El diálogo de conflicto debe estar visible en pantalla
    const conflictDialog = container.querySelector('.library-conflict-dialog')
    expect(conflictDialog).not.toBeNull()
    expect(conflictDialog.textContent).toContain('Biblioteca ya existente')
    expect(conflictDialog.textContent).toContain('Biblioteca Duplicada')

    // Pulsar botón "Combinar"
    const btnCombine = container.querySelector('#btn-conflict-combine')
    expect(btnCombine).not.toBeNull()
    btnCombine.click()

    await new Promise(r => setTimeout(r, 100))

    // Debe haberse cerrado el diálogo y añadido la canción
    expect(container.querySelector('.library-conflict-dialog')).toBeNull()
    const libSongs = await getLibrarySongs(lib.id)
    expect(libSongs.some(s => s.title === 'Canción Desde Dropzone')).toBe(true)
  })

  it('permite añadir canciones a la playlist y cargar bibliotecas como playlist', async () => {
    const onAddToPlaylist = vi.fn().mockReturnValue(true)
    const onOpenPlaylist = vi.fn()
    const onLoadLibraryAsPlaylist = vi.fn().mockResolvedValue(2)

    const { createLibrary, addSongToLibrary } = await import('../../src/services/libraryService.js')
    const { listSongs } = await import('../../src/services/songService.js')
    const allSongs = await listSongs()
    const lib = await createLibrary('Lib Para Playlist')
    if (allSongs[0]) await addSongToLibrary(allSongs[0].id, lib.id)

    const menu = createSongMenuView({
      containerElement: container,
      onAddToPlaylist,
      onOpenPlaylist,
      onLoadLibraryAsPlaylist
    })
    await menu.refresh()

    // 1. Clic en botón + Playlist de una canción
    const addBtn = container.querySelector('.btn-add-playlist')
    expect(addBtn).not.toBeNull()
    addBtn.click()
    expect(onAddToPlaylist).toHaveBeenCalled()

    // 2. Clic en botón Playlist de cabecera
    const topPlBtn = container.querySelector('#btn-top-playlist')
    expect(topPlBtn).not.toBeNull()
    topPlBtn.click()
    expect(onOpenPlaylist).toHaveBeenCalled()

    // 3. Seleccionar biblioteca y pulsar "Cargar Playlist"
    const libTab = container.querySelector(`.lib-tab-pill[data-library-id="${lib.id}"]`)
    expect(libTab).not.toBeNull()
    libTab.click()

    const loadPlBtn = container.querySelector('#btn-load-library-playlist')
    expect(loadPlBtn).not.toBeNull()
    loadPlBtn.click()
    expect(onLoadLibraryAsPlaylist).toHaveBeenCalledWith(lib.id, { shuffle: false })

    // 4. Pulsar "Cargar Aleatoria"
    const loadShuffleBtn = container.querySelector('#btn-load-library-shuffle')
    expect(loadShuffleBtn).not.toBeNull()
    loadShuffleBtn.click()
    expect(onLoadLibraryAsPlaylist).toHaveBeenCalledWith(lib.id, { shuffle: true })
  })
})



