import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { showPrompt, showConfirm, showAlert } from '../../src/views/customPrompt.js'

describe('views/customPrompt.js', () => {
  beforeEach(() => {
    // Asegurar que window.prompt/confirm no sean mocks en estas pruebas directas
    delete window.prompt
    delete window.confirm
    delete window.alert
    document.body.innerHTML = ''
  })

  afterEach(() => {
    const existing = document.querySelector('.custom-prompt-backdrop')
    if (existing) existing.remove()
  })

  describe('showPrompt', () => {
    it('renderiza el modal en el DOM con título, mensaje, defaultValue y placeholder', () => {
      showPrompt({
        title: 'Nueva Biblioteca',
        message: 'Introduce el nombre de la biblioteca:',
        defaultValue: 'Rock',
        placeholder: 'Ej. Favoritos'
      })

      const backdrop = document.querySelector('.custom-prompt-backdrop')
      expect(backdrop).not.toBeNull()
      expect(backdrop.getAttribute('role')).toBe('dialog')
      expect(backdrop.getAttribute('aria-modal')).toBe('true')

      const titleEl = backdrop.querySelector('.custom-prompt-title')
      expect(titleEl.textContent).toBe('Nueva Biblioteca')

      const msgEl = backdrop.querySelector('.custom-prompt-message')
      expect(msgEl.textContent).toBe('Introduce el nombre de la biblioteca:')

      const input = backdrop.querySelector('#custom-prompt-input')
      expect(input.value).toBe('Rock')
      expect(input.placeholder).toBe('Ej. Favoritos')
    })

    it('resuelve con el texto ingresado cuando el usuario hace clic en Confirmar', async () => {
      const promptPromise = showPrompt({
        title: 'Crear',
        defaultValue: 'Anime'
      })

      const input = document.querySelector('#custom-prompt-input')
      input.value = 'Anime 2026'

      const btnConfirm = document.querySelector('#btn-confirm-custom-prompt')
      btnConfirm.click()

      const result = await promptPromise
      expect(result).toBe('Anime 2026')
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })

    it('resuelve con null cuando el usuario hace clic en Cancelar', async () => {
      const promptPromise = showPrompt({ title: 'Crear' })

      const btnCancel = document.querySelector('#btn-cancel-custom-prompt')
      btnCancel.click()

      const result = await promptPromise
      expect(result).toBeNull()
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })

    it('se cierra y resuelve con null cuando se hace clic fuera del prompt (en el backdrop)', async () => {
      const promptPromise = showPrompt({ title: 'Crear' })

      const backdrop = document.querySelector('.custom-prompt-backdrop')
      expect(backdrop).not.toBeNull()

      // Simular clic directo en el backdrop (área exterior al diálogo)
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      const result = await promptPromise
      expect(result).toBeNull()
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })

    it('no se cierra si se hace clic dentro del cuadro del diálogo', async () => {
      let resolved = false
      const promptPromise = showPrompt({ title: 'Crear' }).then(res => {
        resolved = true
        return res
      })

      const dialog = document.querySelector('#custom-prompt-dialog')
      dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      await new Promise(r => setTimeout(r, 40))
      expect(resolved).toBe(false)
      expect(document.querySelector('.custom-prompt-backdrop')).not.toBeNull()

      // Cancelar para limpiar
      document.querySelector('#btn-cancel-custom-prompt').click()
      await promptPromise
    })

    it('se cierra y resuelve con null al pulsar la tecla Escape', async () => {
      const promptPromise = showPrompt({ title: 'Crear' })

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

      const result = await promptPromise
      expect(result).toBeNull()
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })

    it('confirma y resuelve con el valor al presionar Enter', async () => {
      const promptPromise = showPrompt({
        title: 'Crear',
        defaultValue: 'Pop Latino'
      })

      const input = document.querySelector('#custom-prompt-input')
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))

      const result = await promptPromise
      expect(result).toBe('Pop Latino')
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })

    it('se cierra y resuelve con null al hacer clic en el botón X de cierre', async () => {
      const promptPromise = showPrompt({ title: 'Crear' })

      const btnClose = document.querySelector('#btn-close-custom-prompt')
      btnClose.click()

      const result = await promptPromise
      expect(result).toBeNull()
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })
  })

  describe('showConfirm', () => {
    it('muestra el diálogo de confirmación y resuelve true al confirmar', async () => {
      const confirmPromise = showConfirm({
        title: 'Eliminar',
        message: '¿Estás seguro?',
        confirmText: 'Sí, borrar',
        isDestructive: true
      })

      const backdrop = document.querySelector('.custom-prompt-backdrop')
      expect(backdrop).not.toBeNull()
      expect(backdrop.querySelector('#custom-prompt-input')).toBeNull()

      const btnConfirm = document.querySelector('#btn-confirm-custom-prompt')
      expect(btnConfirm.textContent).toContain('Sí, borrar')
      expect(btnConfirm.classList.contains('btn-danger-subtle')).toBe(true)

      btnConfirm.click()
      const result = await confirmPromise
      expect(result).toBe(true)
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })

    it('resuelve false al cancelar', async () => {
      const confirmPromise = showConfirm({
        title: 'Vaciar',
        message: '¿Vaciar todo?'
      })

      const btnCancel = document.querySelector('#btn-cancel-custom-prompt')
      btnCancel.click()

      const result = await confirmPromise
      expect(result).toBe(false)
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })

    it('se cierra y resuelve false al hacer clic fuera en el backdrop', async () => {
      const confirmPromise = showConfirm({
        title: 'Vaciar'
      })

      const backdrop = document.querySelector('.custom-prompt-backdrop')
      backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true }))

      const result = await confirmPromise
      expect(result).toBe(false)
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })
  })

  describe('showAlert', () => {
    it('muestra un aviso modal y se resuelve al hacer clic en Entendido o fuera', async () => {
      const alertPromise = showAlert({
        title: 'Aviso Importante',
        message: 'Operación completada con éxito.'
      })

      const backdrop = document.querySelector('.custom-prompt-backdrop')
      expect(backdrop).not.toBeNull()
      expect(backdrop.querySelector('#btn-cancel-custom-prompt')).toBeNull()

      const btnConfirm = backdrop.querySelector('#btn-confirm-custom-prompt')
      expect(btnConfirm.textContent).toContain('Entendido')

      btnConfirm.click()
      await alertPromise
      expect(document.querySelector('.custom-prompt-backdrop')).toBeNull()
    })
  })
})
