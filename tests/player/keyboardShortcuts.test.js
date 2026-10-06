import { describe, it, expect, vi, beforeEach } from 'vitest'
import { isTypingContext } from '../../src/main.js'

describe('Atajos de teclado globales y detección de contexto de tipeo', () => {
  describe('isTypingContext', () => {
    it('detecta correctamente campos de texto que requieren entrada de caracteres', () => {
      const textInput = document.createElement('input')
      textInput.type = 'text'
      expect(isTypingContext(textInput)).toBe(true)

      const searchInput = document.createElement('input')
      searchInput.type = 'search'
      expect(isTypingContext(searchInput)).toBe(true)

      const defaultInput = document.createElement('input')
      expect(isTypingContext(defaultInput)).toBe(true)

      const textarea = document.createElement('textarea')
      expect(isTypingContext(textarea)).toBe(true)

      const numberInput = document.createElement('input')
      numberInput.type = 'number'
      expect(isTypingContext(numberInput)).toBe(true)

      const urlInput = document.createElement('input')
      urlInput.type = 'url'
      expect(isTypingContext(urlInput)).toBe(true)
    })

    it('detecta elementos con contenteditable', () => {
      const editableDiv = document.createElement('div')
      editableDiv.setAttribute('contenteditable', 'true')
      editableDiv.contentEditable = 'true'
      const childSpan = document.createElement('span')
      editableDiv.appendChild(childSpan)
      document.body.appendChild(editableDiv)

      expect(isTypingContext(editableDiv)).toBe(true)
      expect(isTypingContext(childSpan)).toBe(true)

      editableDiv.remove()
    })

    it('no considera botones, selects, checkboxes, rangos ni divs normales como contextos de tipeo', () => {
      const rangeInput = document.createElement('input')
      rangeInput.type = 'range'
      expect(isTypingContext(rangeInput)).toBe(false)

      const buttonInput = document.createElement('input')
      buttonInput.type = 'button'
      expect(isTypingContext(buttonInput)).toBe(false)

      const checkboxInput = document.createElement('input')
      checkboxInput.type = 'checkbox'
      expect(isTypingContext(checkboxInput)).toBe(false)

      const btn = document.createElement('button')
      expect(isTypingContext(btn)).toBe(false)

      const select = document.createElement('select')
      expect(isTypingContext(select)).toBe(false)

      const div = document.createElement('div')
      expect(isTypingContext(div)).toBe(false)

      expect(isTypingContext(null)).toBe(false)
      expect(isTypingContext(undefined)).toBe(false)
    })
  })

  describe('Atajo de teclado Espacio y control de reproducción', () => {
    it('ignora el atajo si el usuario está escribiendo en un input de texto', () => {
      const input = document.createElement('input')
      input.type = 'text'
      document.body.appendChild(input)
      input.focus()

      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      const preventSpy = vi.spyOn(event, 'preventDefault')
      input.dispatchEvent(event)

      // No debe prevenir el comportamiento por defecto para permitir escribir el espacio
      expect(preventSpy).not.toHaveBeenCalled()
      input.remove()
    })

    it('intercepta la tecla Espacio con preventDefault cuando no es un campo de tipeo, incluso si hay un modal abierto', async () => {
      // Mock de elemento app
      document.body.innerHTML = '<div id="app"></div>'
      const { initApp } = await import('../../src/main.js')
      await initApp()

      // Crear un modal abierto
      const modal = document.createElement('div')
      modal.className = 'modal-container is-open'
      const modalButton = document.createElement('button')
      modalButton.textContent = 'Cerrar'
      modal.appendChild(modalButton)
      document.body.appendChild(modal)
      modalButton.focus()

      const spaceEvent = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true })
      const preventSpy = vi.spyOn(spaceEvent, 'preventDefault')
      modalButton.dispatchEvent(spaceEvent)

      expect(preventSpy).toHaveBeenCalled()
      modal.remove()
    })
    it('ignora la pulsación de Espacio si se usan teclas modificadoras como ctrlKey, altKey o metaKey', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      const ctrlEvent = new KeyboardEvent('keydown', { key: ' ', ctrlKey: true, bubbles: true, cancelable: true })
      const preventSpy = vi.spyOn(ctrlEvent, 'preventDefault')
      button.dispatchEvent(ctrlEvent)

      expect(preventSpy).not.toHaveBeenCalled()
      button.remove()
    })

    it('previene comportamiento en repetición de Espacio pero no dispara acciones duplicadas si e.repeat es true', () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()

      const repeatEvent = new KeyboardEvent('keydown', { key: ' ', repeat: true, bubbles: true, cancelable: true })
      const preventSpy = vi.spyOn(repeatEvent, 'preventDefault')
      button.dispatchEvent(repeatEvent)

      expect(preventSpy).toHaveBeenCalled()
      button.remove()
    })
  })
})
