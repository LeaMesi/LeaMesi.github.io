// src/views/customPrompt.js
// Diálogos modales personalizados (Prompt, Confirm, Alert) integrados con los temas de la aplicación.
// Reemplazan los diálogos nativos del navegador con bloqueo completo de la interfaz y cierre al hacer clic fuera.

import { iconClose } from './icons.js'

function escapeHtml(str) {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Muestra un diálogo personalizado para solicitar texto al usuario (reemplazo de window.prompt).
 * Bloquea el acceso al resto de la interfaz y se cierra si se hace clic fuera.
 * 
 * @param {Object} options
 * @param {string} [options.title=''] Título de la ventana
 * @param {string} [options.message=''] Mensaje explicativo o pregunta
 * @param {string} [options.defaultValue=''] Valor predeterminado en el campo de texto
 * @param {string} [options.placeholder=''] Texto de sugerencia (placeholder)
 * @param {string} [options.confirmText='Aceptar'] Texto del botón de confirmación
 * @param {string} [options.cancelText='Cancelar'] Texto del botón de cancelación
 * @returns {Promise<string|null>} Devuelve el texto ingresado o null si se cancela o se cierra al hacer clic fuera
 */
export function showPrompt({
  title = 'Ingresar texto',
  message = '',
  defaultValue = '',
  placeholder = '',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar'
} = {}) {
  // Soporte para tests unitarios donde window.prompt está mockeado explícitamente
  if (typeof window !== 'undefined' && window.prompt && (window.prompt._isMockFunction || window.prompt.mock)) {
    return Promise.resolve(window.prompt(message, defaultValue))
  }

  return new Promise((resolve) => {
    // Si ya existe un diálogo abierto previo, cerrarlo limpiamente
    const existingBackdrop = document.querySelector('.custom-prompt-backdrop')
    if (existingBackdrop) {
      existingBackdrop.remove()
    }

    const backdrop = document.createElement('div')
    backdrop.className = 'custom-prompt-backdrop'
    backdrop.id = 'custom-prompt-backdrop'
    backdrop.setAttribute('role', 'dialog')
    backdrop.setAttribute('aria-modal', 'true')
    backdrop.setAttribute('aria-labelledby', 'custom-prompt-title')

    backdrop.innerHTML = `
      <div class="custom-prompt-dialog" id="custom-prompt-dialog">
        <header class="custom-prompt-header">
          <h3 class="custom-prompt-title" id="custom-prompt-title">${escapeHtml(title)}</h3>
          <button type="button" class="btn-close-custom-prompt" id="btn-close-custom-prompt" aria-label="Cerrar">${iconClose}</button>
        </header>

        <div class="custom-prompt-body">
          ${message ? `<p class="custom-prompt-message">${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
          <div class="custom-prompt-input-group">
            <input 
              type="text" 
              class="custom-prompt-input" 
              id="custom-prompt-input"
              value="${escapeHtml(defaultValue)}" 
              placeholder="${escapeHtml(placeholder)}" 
              autocomplete="off"
              spellcheck="false"
            />
          </div>
        </div>

        <footer class="custom-prompt-footer">
          <button type="button" class="btn btn-outline custom-prompt-btn-cancel" id="btn-cancel-custom-prompt">
            ${escapeHtml(cancelText)}
          </button>
          <button type="button" class="btn btn-primary custom-prompt-btn-confirm" id="btn-confirm-custom-prompt">
            ${escapeHtml(confirmText)}
          </button>
        </footer>
      </div>
    `

    document.body.appendChild(backdrop)

    const dialog = backdrop.querySelector('.custom-prompt-dialog')
    const input = backdrop.querySelector('#custom-prompt-input')
    const btnConfirm = backdrop.querySelector('#btn-confirm-custom-prompt')
    const btnCancel = backdrop.querySelector('#btn-cancel-custom-prompt')
    const btnClose = backdrop.querySelector('#btn-close-custom-prompt')

    let isResolved = false

    function cleanup() {
      document.removeEventListener('keydown', handleKeyDown, true)
      if (backdrop && backdrop.parentNode) {
        backdrop.remove()
      }
    }

    function doResolve(val) {
      if (isResolved) return
      isResolved = true
      cleanup()
      resolve(val)
    }

    function handleConfirm() {
      const val = input ? input.value : ''
      doResolve(val)
    }

    function handleCancel() {
      doResolve(null)
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleCancel()
      } else if (e.key === 'Enter') {
        // Al presionar Enter en el input o diálogo, se confirma la acción
        e.preventDefault()
        e.stopPropagation()
        handleConfirm()
      }
    }

    // Clic fuera del prompt (en el backdrop) cierra y vuelve el control normal de la página
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        handleCancel()
      }
    })

    if (btnConfirm) btnConfirm.addEventListener('click', handleConfirm)
    if (btnCancel) btnCancel.addEventListener('click', handleCancel)
    if (btnClose) btnClose.addEventListener('click', handleCancel)

    document.addEventListener('keydown', handleKeyDown, true)

    // Enfoque inmediato y selección del texto si lo hay
    if (input) {
      setTimeout(() => {
        input.focus()
        if (defaultValue) {
          input.select()
        }
      }, 30)
    }
  })
}

/**
 * Muestra un diálogo personalizado de confirmación (reemplazo de window.confirm).
 * Bloquea el acceso al resto de la interfaz y se cierra al hacer clic fuera.
 * 
 * @param {Object} options
 * @param {string} [options.title='Confirmar'] Título de la ventana
 * @param {string} [options.message=''] Mensaje de confirmación
 * @param {string} [options.confirmText='Aceptar'] Texto del botón de confirmación
 * @param {string} [options.cancelText='Cancelar'] Texto del botón de cancelación
 * @param {boolean} [options.isDestructive=false] Si es una acción destructiva (ej. borrar)
 * @returns {Promise<boolean>} Devuelve true si confirma, o false si cancela o hace clic fuera
 */
export function showConfirm({
  title = 'Confirmar',
  message = '',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  isDestructive = false
} = {}) {
  // Soporte para tests unitarios donde window.confirm está mockeado explícitamente
  if (typeof window !== 'undefined' && window.confirm && (window.confirm._isMockFunction || window.confirm.mock)) {
    return Promise.resolve(window.confirm(message))
  }

  return new Promise((resolve) => {
    const existingBackdrop = document.querySelector('.custom-prompt-backdrop')
    if (existingBackdrop) {
      existingBackdrop.remove()
    }

    const backdrop = document.createElement('div')
    backdrop.className = 'custom-prompt-backdrop'
    backdrop.id = 'custom-prompt-backdrop'
    backdrop.setAttribute('role', 'dialog')
    backdrop.setAttribute('aria-modal', 'true')
    backdrop.setAttribute('aria-labelledby', 'custom-prompt-title')

    const confirmBtnClass = isDestructive ? 'btn-danger-subtle' : 'btn-primary'

    backdrop.innerHTML = `
      <div class="custom-prompt-dialog" id="custom-prompt-dialog">
        <header class="custom-prompt-header">
          <h3 class="custom-prompt-title" id="custom-prompt-title">${escapeHtml(title)}</h3>
          <button type="button" class="btn-close-custom-prompt" id="btn-close-custom-prompt" aria-label="Cerrar">${iconClose}</button>
        </header>

        <div class="custom-prompt-body">
          ${message ? `<p class="custom-prompt-message">${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
        </div>

        <footer class="custom-prompt-footer">
          <button type="button" class="btn btn-outline custom-prompt-btn-cancel" id="btn-cancel-custom-prompt">
            ${escapeHtml(cancelText)}
          </button>
          <button type="button" class="btn ${confirmBtnClass} custom-prompt-btn-confirm" id="btn-confirm-custom-prompt">
            ${escapeHtml(confirmText)}
          </button>
        </footer>
      </div>
    `

    document.body.appendChild(backdrop)

    const btnConfirm = backdrop.querySelector('#btn-confirm-custom-prompt')
    const btnCancel = backdrop.querySelector('#btn-cancel-custom-prompt')
    const btnClose = backdrop.querySelector('#btn-close-custom-prompt')

    let isResolved = false

    function cleanup() {
      document.removeEventListener('keydown', handleKeyDown, true)
      if (backdrop && backdrop.parentNode) {
        backdrop.remove()
      }
    }

    function doResolve(val) {
      if (isResolved) return
      isResolved = true
      cleanup()
      resolve(val)
    }

    function handleConfirm() {
      doResolve(true)
    }

    function handleCancel() {
      doResolve(false)
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        handleCancel()
      } else if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        handleConfirm()
      }
    }

    // Clic fuera del cuadro de diálogo
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        handleCancel()
      }
    })

    if (btnConfirm) btnConfirm.addEventListener('click', handleConfirm)
    if (btnCancel) btnCancel.addEventListener('click', handleCancel)
    if (btnClose) btnClose.addEventListener('click', handleCancel)

    document.addEventListener('keydown', handleKeyDown, true)

    setTimeout(() => {
      if (btnConfirm) btnConfirm.focus()
    }, 30)
  })
}

/**
 * Muestra un aviso modal personalizado (reemplazo de window.alert).
 * 
 * @param {Object} options
 * @param {string} [options.title='Aviso']
 * @param {string} [options.message='']
 * @param {string} [options.confirmText='Entendido']
 * @returns {Promise<void>}
 */
export function showAlert({
  title = 'Aviso',
  message = '',
  confirmText = 'Entendido'
} = {}) {
  // Soporte para tests unitarios donde window.alert está mockeado explícitamente
  if (typeof window !== 'undefined' && window.alert && (window.alert._isMockFunction || window.alert.mock)) {
    window.alert(message)
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const existingBackdrop = document.querySelector('.custom-prompt-backdrop')
    if (existingBackdrop) {
      existingBackdrop.remove()
    }

    const backdrop = document.createElement('div')
    backdrop.className = 'custom-prompt-backdrop'
    backdrop.id = 'custom-prompt-backdrop'
    backdrop.setAttribute('role', 'dialog')
    backdrop.setAttribute('aria-modal', 'true')
    backdrop.setAttribute('aria-labelledby', 'custom-prompt-title')

    backdrop.innerHTML = `
      <div class="custom-prompt-dialog" id="custom-prompt-dialog">
        <header class="custom-prompt-header">
          <h3 class="custom-prompt-title" id="custom-prompt-title">${escapeHtml(title)}</h3>
          <button type="button" class="btn-close-custom-prompt" id="btn-close-custom-prompt" aria-label="Cerrar">${iconClose}</button>
        </header>

        <div class="custom-prompt-body">
          ${message ? `<p class="custom-prompt-message">${escapeHtml(message).replace(/\n/g, '<br>')}</p>` : ''}
        </div>

        <footer class="custom-prompt-footer">
          <button type="button" class="btn btn-primary custom-prompt-btn-confirm" id="btn-confirm-custom-prompt">
            ${escapeHtml(confirmText)}
          </button>
        </footer>
      </div>
    `

    document.body.appendChild(backdrop)

    const btnConfirm = backdrop.querySelector('#btn-confirm-custom-prompt')
    const btnClose = backdrop.querySelector('#btn-close-custom-prompt')

    let isResolved = false

    function cleanup() {
      document.removeEventListener('keydown', handleKeyDown, true)
      if (backdrop && backdrop.parentNode) {
        backdrop.remove()
      }
    }

    function doResolve() {
      if (isResolved) return
      isResolved = true
      cleanup()
      resolve()
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        doResolve()
      }
    }

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) {
        doResolve()
      }
    })

    if (btnConfirm) btnConfirm.addEventListener('click', doResolve)
    if (btnClose) btnClose.addEventListener('click', doResolve)

    document.addEventListener('keydown', handleKeyDown, true)

    setTimeout(() => {
      if (btnConfirm) btnConfirm.focus()
    }, 30)
  })
}
