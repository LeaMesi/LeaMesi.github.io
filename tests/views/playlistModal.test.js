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

  it('permite quitar una canción con el botón eliminar y muestra aviso', async () => {
    playlist.addSongs([
      { id: 1, title: 'Canción A' },
      { id: 2, title: 'Canción B' }
    ])

    const onRemoveSong = vi.fn()
    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist,
      onRemoveSong
    })

    await modal.open()
    const deleteBtn = container.querySelector('.btn-delete-item[data-index="0"]')
    expect(deleteBtn).not.toBeNull()
    deleteBtn.click()

    expect(playlist.getState().count).toBe(1)
    expect(playlist.getSongs()[0].id).toBe(2)
    expect(onRemoveSong).toHaveBeenCalledWith(expect.objectContaining({ id: 1, title: 'Canción A' }))

    // No se muestra aviso intrusivo al eliminar una canción
    expect(container.querySelector('.status-alert')).toBeNull()
  })

  it('al tocar Vaciar con una canción en reproducción, conserva la canción actual', async () => {
    playlist.addSongs([
      { id: 10, title: 'Canción Uno' },
      { id: 20, title: 'Canción Dos' },
      { id: 30, title: 'Canción Tres' }
    ])
    playlist.setCurrentIndex(1) // Canción Dos está en reproducción

    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist
    })

    await modal.open()
    const clearBtn = container.querySelector('#btn-pl-clear')
    expect(clearBtn).not.toBeNull()

    // El diálogo personalizado de confirmación showConfirm crea un backdrop en document.body
    clearBtn.click()

    // Simular confirmación en customPrompt
    const confirmBtn = document.body.querySelector('#btn-confirm-custom-prompt')
    expect(confirmBtn).not.toBeNull()
    confirmBtn.click()

    // Esperar microtareas para que resuelva la promesa
    await new Promise(r => setTimeout(r, 10))

    // La playlist ahora contiene únicamente la canción que estaba sonando (Canción Dos) en el índice 0
    expect(playlist.getState().count).toBe(1)
    expect(playlist.getCurrentIndex()).toBe(0)
    expect(playlist.getCurrentSong().id).toBe(20)
    expect(playlist.getCurrentSong().title).toBe('Canción Dos')

    // No se muestra aviso intrusivo al vaciar
    expect(container.querySelector('.status-alert')).toBeNull()
  })

  it('al tocar Vaciar cuando solo queda la canción actual, no hace nada destructivo ni muestra aviso', async () => {
    playlist.addSongs([
      { id: 20, title: 'Canción Dos' }
    ])
    playlist.setCurrentIndex(0)

    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist
    })

    await modal.open()
    const clearBtn = container.querySelector('#btn-pl-clear')
    expect(clearBtn).not.toBeNull()
    clearBtn.click()

    // No debe abrir diálogo destructivo ni mostrar aviso intrusivo
    expect(document.body.querySelector('#custom-dialog-confirm')).toBeNull()
    expect(container.querySelector('.status-alert')).toBeNull()
    expect(playlist.getState().count).toBe(1)
  })

  it('muestra solo alertas de error y permite cerrarlas', async () => {
    const modal = createPlaylistModal({
      containerElement: container,
      playlistService: playlist
    })
    await modal.open()

    modal.showStatus('Operación exitosa', 'success')
    expect(container.querySelector('.status-alert')).toBeNull()

    modal.showStatus('Aviso informativo', 'info')
    expect(container.querySelector('.status-alert')).toBeNull()

    modal.showStatus('Error crítico en la playlist', 'error')
    const alertEl = container.querySelector('.status-alert')
    expect(alertEl).not.toBeNull()
    expect(alertEl.textContent).toContain('Error crítico en la playlist')

    const closeBtn = container.querySelector('#btn-close-playlist-alert')
    expect(closeBtn).not.toBeNull()
    closeBtn.click()
    expect(container.querySelector('.status-alert')).toBeNull()
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
