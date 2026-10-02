import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPlaylistModal } from '../../src/views/playlistModal.js'
import { createPlaylistService } from '../../src/services/playlistService.js'

describe('views/playlistModal.js', () => {
  let container = null
  let playlist = null

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    playlist = createPlaylistService({ storageKey: 'test_modal_pl' })
  })

  it('abre el modal y renderiza el estado vacío si la playlist no tiene canciones', async () => {
    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist
    })

    await modal.open()
    expect(modal.isOpen()).toBe(true)
    expect(container.classList.contains('is-open')).toBe(true)
    expect(container.querySelector('#playlist-dialog-title')).not.toBeNull()
    expect(container.querySelector('.playlist-empty-state')).not.toBeNull()
  })

  it('renderiza la lista de canciones y muestra la que está sonando', async () => {
    playlist.addSongs([
      { id: 1, title: 'Canción Uno', artist: 'Artista 1' },
      { id: 2, title: 'Canción Dos', artist: 'Artista 2' }
    ])
    playlist.setCurrentIndex(0)

    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist
    })

    await modal.open()
    const items = container.querySelectorAll('.playlist-item-card')
    expect(items.length).toBe(2)

    // La primera tiene el badge de sonando
    expect(items[0].classList.contains('is-active-item')).toBe(true)
    expect(items[0].querySelector('.badge-now-playing')).not.toBeNull()

    // La segunda tiene el botón para reproducir
    expect(items[1].querySelector('.btn-play-item')).not.toBeNull()
  })

  it('dispara onPlaySong al hacer clic en reproducir una canción de la lista', async () => {
    const onPlaySong = vi.fn()
    playlist.addSongs([
      { id: 1, title: 'Canción Uno' },
      { id: 2, title: 'Canción Dos' }
    ])
    playlist.setCurrentIndex(0)

    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist,
      onPlaySong
    })

    await modal.open()
    const playBtn = container.querySelector('.btn-play-item[data-index="1"]')
    expect(playBtn).not.toBeNull()
    playBtn.click()

    expect(onPlaySong).toHaveBeenCalled()
    expect(playlist.getCurrentIndex()).toBe(1)
    expect(playlist.getCurrentSong().id).toBe(2)
  })

  it('permite reordenar canciones con los botones subir y bajar', async () => {
    playlist.addSongs([
      { id: 10, title: 'Primero' },
      { id: 20, title: 'Segundo' },
      { id: 30, title: 'Tercero' }
    ])

    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist
    })

    await modal.open()

    // Bajar la primera canción (índice 0)
    const moveDownBtn = container.querySelector('.btn-move-down[data-index="0"]')
    expect(moveDownBtn).not.toBeNull()
    moveDownBtn.click()

    expect(playlist.getSongs()[0].id).toBe(20)
    expect(playlist.getSongs()[1].id).toBe(10)
  })

  it('permite quitar una canción con el botón eliminar', async () => {
    playlist.addSongs([
      { id: 1, title: 'Canción A' },
      { id: 2, title: 'Canción B' }
    ])

    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist
    })

    await modal.open()
    const deleteBtn = container.querySelector('.btn-delete-item[data-index="0"]')
    expect(deleteBtn).not.toBeNull()
    deleteBtn.click()

    expect(playlist.getState().count).toBe(1)
    expect(playlist.getSongs()[0].id).toBe(2)
  })

  it('cierra el modal limpiando el contenedor', async () => {
    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist
    })

    await modal.open()
    expect(modal.isOpen()).toBe(true)

    modal.close()
    expect(modal.isOpen()).toBe(false)
    expect(container.classList.contains('is-open')).toBe(false)
    expect(container.innerHTML).toBe('')
  })
})
