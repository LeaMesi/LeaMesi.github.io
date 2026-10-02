import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createVideoManagerModal } from '../../src/views/videoManagerModal.js'

describe('views/videoManagerModal.js', () => {
  let container = null

  const sampleSong = {
    id: 10,
    title: 'Tema con Múltiples Videos',
    artist: 'Banda Offset',
    videos: [
      { id: 'v1', name: 'Oficial', url: 'https://youtube.com/watch?v=11111111111', offset: 0 },
      { id: 'v2', name: 'Intro Larga', url: 'https://youtube.com/watch?v=22222222222', offset: 12.5 }
    ]
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('abre el modal y renderiza los videos asociados con sus offsets', () => {
    const modal = createVideoManagerModal({ containerElement: container })
    modal.open(sampleSong)

    expect(container.classList.contains('is-open')).toBe(true)
    const cards = container.querySelectorAll('.video-item-card')
    const nameInputs = container.querySelectorAll('.input-video-name')
    expect(nameInputs[0].value).toBe('Oficial')
    expect(nameInputs[1].value).toBe('Intro Larga')
  })

  it('permite añadir un nuevo video a la lista', () => {
    const modal = createVideoManagerModal({ containerElement: container })
    modal.open(sampleSong)

    const nameInput = container.querySelector('#new-video-name')
    const urlInput = container.querySelector('#new-video-url')
    const form = container.querySelector('#form-add-video')

    expect(form).not.toBeNull()
    nameInput.value = 'En Vivo'
    urlInput.value = 'https://youtu.be/33333333333'
    form.dispatchEvent(new Event('submit'))

    const cards = container.querySelectorAll('.video-item-card')
    expect(cards.length).toBe(3)
  })

  it('permite eliminar un video de la lista', () => {
    const modal = createVideoManagerModal({ containerElement: container })
    modal.open(sampleSong)

    const deleteBtn = container.querySelector('.btn-delete-video')
    deleteBtn.click()

    const cards = container.querySelectorAll('.video-item-card')
    expect(cards.length).toBe(1)
  })

  it('cierra el modal al pulsar el botón de cerrar', () => {
    const modal = createVideoManagerModal({ containerElement: container })
    modal.open(sampleSong)

    const closeBtn = container.querySelector('.btn-close-modal')
    closeBtn.click()

    expect(container.classList.contains('is-open')).toBe(false)
    expect(container.innerHTML).toBe('')
  })
})
