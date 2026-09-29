import { updateSongVideos } from '../services/songService.js'
import { normalizeVideos } from '../services/schemaValidator.js'
import {
  iconSave,
  iconTrash,
  iconPlus,
  iconClose
} from './icons.js'

export function createVideoManagerModal({ containerElement, onVideosUpdated }) {
  let currentSong = null
  let currentVideos = []
  let statusMessage = ''
  let statusType = 'info' // 'info' | 'success' | 'error'

  function open(song) {
    if (!song) return
    currentSong = song
    currentVideos = JSON.parse(JSON.stringify(song.videos || normalizeVideos(song, song.lyrics_data)))
    statusMessage = ''
    if (containerElement) {
      containerElement.classList.add('is-open')
    }
    render()
  }

  function close() {
    if (containerElement) {
      containerElement.classList.remove('is-open')
      containerElement.innerHTML = ''
    }
    currentSong = null
    currentVideos = []
  }

  function showStatus(msg, type = 'info') {
    statusMessage = msg
    statusType = type
    render()
  }

  function render() {
    if (!containerElement || !currentSong) return

    const videosListHtml = currentVideos.length === 0
      ? '<div class="empty-list">No hay videos asociados a esta canción. ¡Agrega uno abajo!</div>'
      : currentVideos.map((video, index) => {
        const offsetVal = Number(video.offset) || 0
        const offsetSign = offsetVal > 0 ? `+${offsetVal}` : `${offsetVal}`

        return `
          <div class="video-item-card" data-index="${index}">
            <div class="video-item-header">
              <span class="video-index-badge">#${index + 1}</span>
              <input type="text" class="input-video-name" value="${escapeHtml(video.name)}" placeholder="Nombre del video (ej. Oficial, Karaoke)" data-index="${index}" />
              <button class="btn btn-xs btn-delete-video" data-index="${index}" title="Quitar video">${iconTrash}</button>
            </div>

            <div class="video-item-fields">
              <div class="form-group">
                <label>URL de YouTube / ID:</label>
                <input type="text" class="input-video-url" value="${escapeHtml(video.url)}" placeholder="https://www.youtube.com/watch?v=..." data-index="${index}" />
              </div>

              <div class="form-group form-group-offset">
                <label>Offset de inicio de letra (segundos):</label>
                <div class="offset-input-wrapper">
                  <input type="number" step="0.1" class="input-video-offset" value="${offsetVal}" data-index="${index}" />
                  <span class="offset-badge" title="La letra comenzará a sincronizar a partir de este segundo del video">${offsetSign}s</span>
                </div>
              </div>
            </div>
          </div>
        `
      }).join('')

    containerElement.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-dialog modal-dialog-lg">
        <header class="modal-header">
          <div class="header-titles">
            <h2>Gestionar Videos y Offsets</h2>
            <p class="subtitle">Canción: <strong>${escapeHtml(currentSong.title)}</strong> (${escapeHtml(currentSong.artist || 'Desconocido')})</p>
          </div>
          <button class="btn-close-modal" aria-label="Cerrar">${iconClose}</button>
        </header>

        ${statusMessage ? `
          <div class="status-alert status-${statusType}">
            ${escapeHtml(statusMessage)}
          </div>
        ` : ''}

        <div class="modal-body">
          <div class="offset-explanation-banner">
            <p><strong>¿Qué es el Offset?</strong> Es el segundo del video en el cual comienza a cantarse la letra. Si el video tiene una introducción de 15 segundos antes de que empiece la canción, colocá <code>15.0</code>. Si la letra ya está sincronizada desde el segundo 0, dejalo en <code>0</code>.</p>
          </div>

          <section class="videos-list-section">
            <h3>Videos Asociados (${currentVideos.length})</h3>
            <div class="videos-list">
              ${videosListHtml}
            </div>
          </section>

          <section class="add-video-section">
            <h3>Asociar Nuevo Video</h3>
            <form id="form-add-video" class="form-add-video">
              <div class="form-row">
                <div class="form-group flex-1">
                  <label for="new-video-name">Nombre / Versión:</label>
                  <input type="text" id="new-video-name" class="input-text" placeholder="Ej. Video Oficial, Karaoke, En Vivo" required />
                </div>
                <div class="form-group flex-2">
                  <label for="new-video-url">URL de YouTube o ID:</label>
                  <input type="text" id="new-video-url" class="input-text" placeholder="https://www.youtube.com/watch?v=..." required />
                </div>
                <div class="form-group flex-1">
                  <label for="new-video-offset">Offset (segundos):</label>
                  <input type="number" step="0.1" id="new-video-offset" class="input-text" value="0" />
                </div>
              </div>
              <button type="submit" class="btn btn-outline btn-add-video">
                ${iconPlus} Añadir a la Lista
              </button>
            </form>
          </section>
        </div>

        <footer class="modal-footer">
          <button class="btn btn-outline btn-cancel-modal">Cancelar</button>
          <button class="btn btn-primary btn-save-videos">${iconSave} Guardar Cambios</button>
        </footer>
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    const backdrop = containerElement.querySelector('.modal-backdrop')
    if (backdrop) backdrop.addEventListener('click', close)

    const closeBtn = containerElement.querySelector('.btn-close-modal')
    if (closeBtn) closeBtn.addEventListener('click', close)

    const cancelBtn = containerElement.querySelector('.btn-cancel-modal')
    if (cancelBtn) cancelBtn.addEventListener('click', close)

    // Escuchar inputs de nombre
    const nameInputs = containerElement.querySelectorAll('.input-video-name')
    nameInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.index)
        if (currentVideos[idx]) {
          currentVideos[idx].name = e.target.value
        }
      })
    })

    // Escuchar inputs de URL
    const urlInputs = containerElement.querySelectorAll('.input-video-url')
    urlInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.index)
        if (currentVideos[idx]) {
          currentVideos[idx].url = e.target.value
        }
      })
    })

    // Escuchar inputs de Offset
    const offsetInputs = containerElement.querySelectorAll('.input-video-offset')
    offsetInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.index)
        if (currentVideos[idx]) {
          currentVideos[idx].offset = Number(e.target.value) || 0
          const badge = input.closest('.video-item-fields')?.querySelector('.offset-badge')
          if (badge) {
            const v = currentVideos[idx].offset
            badge.textContent = `${v > 0 ? '+' : ''}${v}s`
          }
        }
      })
    })

    // Eliminar video
    const deleteButtons = containerElement.querySelectorAll('.btn-delete-video')
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(btn.dataset.index)
        currentVideos.splice(idx, 1)
        render()
      })
    })

    // Formulario agregar video
    const addForm = containerElement.querySelector('#form-add-video')
    if (addForm) {
      addForm.addEventListener('submit', (e) => {
        e.preventDefault()
        const nameInput = addForm.querySelector('#new-video-name')
        const urlInput = addForm.querySelector('#new-video-url')
        const offsetInput = addForm.querySelector('#new-video-offset')

        const name = (nameInput?.value || '').trim()
        const url = (urlInput?.value || '').trim()
        const offset = Number(offsetInput?.value) || 0

        if (!name || !url) {
          showStatus('Por favor ingresa un nombre y una URL válida.', 'error')
          return
        }

        currentVideos.push({
          id: `vid-${Date.now()}-${currentVideos.length}`,
          name,
          url,
          offset
        })

        showStatus(`Video "${name}" añadido a la lista. Recuerda hacer clic en "Guardar Cambios".`, 'info')
        render()
      })
    }

    // Botón Guardar Cambios
    const saveBtn = containerElement.querySelector('.btn-save-videos')
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        try {
          saveBtn.disabled = true
          saveBtn.textContent = 'Guardando...'

          const updatedVideos = await updateSongVideos(currentSong.id, currentVideos)
          currentSong.videos = updatedVideos

          if (onVideosUpdated) {
            onVideosUpdated(currentSong.id, updatedVideos)
          }

          showStatus('Videos guardados exitosamente.', 'success')
          setTimeout(() => {
            close()
          }, 600)
        } catch (err) {
          console.error('Error al guardar videos:', err)
          showStatus('Error al guardar: ' + err.message, 'error')
          saveBtn.disabled = false
          saveBtn.innerHTML = `${iconSave} Guardar Cambios`
        }
      })
    }
  }

  function escapeHtml(str) {
    if (!str) return ''
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  return {
    open,
    close
  }
}
