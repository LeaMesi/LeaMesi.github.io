import { listSongs, deleteSong } from '../services/songService.js'
import { exportSongPackage, importSongPackage, exportLibraryBackup, importLibraryBackup } from '../services/shareService.js'
import { exportLanguageToLyricsfile, importLyricsfileAsNewSong, importLyricsfileAsTranslation } from '../services/lyricsfileService.js'
import {
  iconPlay,
  iconTrash,
  iconClose,
  iconDownload,
  iconUpload,
  iconPlus
} from './icons.js'

export function createLibraryView({
  modalElement,
  onSelectSong,
  getCurrentSongId
}) {
  let songs = []
  let isOpen = false
  let statusMessage = ''
  let statusType = 'info' // 'info' | 'success' | 'error'

  async function open() {
    isOpen = true
    modalElement.classList.add('is-open')
    statusMessage = ''
    await loadSongList()
  }

  function close() {
    isOpen = false
    modalElement.classList.remove('is-open')
  }

  async function loadSongList() {
    try {
      songs = await listSongs()
      render()
    } catch (err) {
      console.error('Error al listar canciones:', err)
      showStatus('Error al cargar la lista de canciones: ' + err.message, 'error')
    }
  }

  function showStatus(msg, type = 'info') {
    statusMessage = msg
    statusType = type
    render()
  }

  function render() {
    if (!modalElement) return

    const currentSongId = getCurrentSongId ? getCurrentSongId() : null

    const songsHtml = songs.length === 0
      ? '<div class="empty-list">No hay canciones guardadas en el navegador. ¡Importa una!</div>'
      : songs.map(song => {
        const isCurrent = Number(currentSongId) === Number(song.id)
        const langCount = song.lyrics_data?.languages?.length || 1
        const mainLang = song.lyrics_data?.languages?.find(l => l.isMain)?.name || 'Original'

        return `
          <div class="song-card ${isCurrent ? 'is-current' : ''}" data-song-id="${song.id}">
            <div class="song-card-info">
              <h3 class="song-title">
                ${escapeHtml(song.title)}
                ${isCurrent ? '<span class="badge-current">En Reproducción</span>' : ''}
              </h3>
              <p class="song-artist">${escapeHtml(song.artist || 'Desconocido')}</p>
              <div class="song-badges">
                <span class="badge badge-lang">${langCount} idioma(s) [${escapeHtml(mainLang)}]</span>
                ${(song.genres || []).slice(0, 2).map(g => `<span class="badge badge-genre">${escapeHtml(g)}</span>`).join('')}
              </div>
            </div>

            <div class="song-card-actions">
              <button class="btn btn-sm btn-play-song" data-song-id="${song.id}">
                ${isCurrent ? 'En Reproducción' : `${iconPlay} Cargar`}
              </button>
              <button class="btn btn-sm btn-export-json" data-song-id="${song.id}" title="Exportar paquete de canción JSON">
                ${iconDownload} JSON
              </button>
              <button class="btn btn-sm btn-export-yaml" data-song-id="${song.id}" title="Exportar al estándar Lyricsfile (.yaml)">
                ${iconDownload} Lyricsfile
              </button>
              <button class="btn btn-sm btn-delete-song" data-song-id="${song.id}" title="Eliminar de la biblioteca local">
                ${iconTrash}
              </button>
            </div>
          </div>
        `
      }).join('')

    modalElement.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-dialog">
        <header class="modal-header">
          <div class="header-titles">
            <h2>Biblioteca Local (IndexedDB)</h2>
            <p class="subtitle">Tus canciones sincronizadas, exportación comunitaria y soporte Lyricsfile</p>
          </div>
          <button class="btn-close-modal" aria-label="Cerrar">${iconClose}</button>
        </header>

        ${statusMessage ? `
          <div class="status-alert status-${statusType}">
            ${escapeHtml(statusMessage)}
          </div>
        ` : ''}

        <div class="modal-body">
          <!-- Sección de Importación / Dropzone -->
          <section class="import-section">
            <h3>Importar Canción o Traducción</h3>
            <div class="dropzone" id="file-dropzone">
              <p class="dropzone-text">
                Arrastra o selecciona un archivo <strong>JSON</strong> (paquete Saranga) o <strong>.lyricsfile.yaml</strong>
              </p>
              <div class="dropzone-buttons">
                <label class="btn btn-outline file-input-label">
                  ${iconUpload} Seleccionar Archivo
                  <input type="file" id="file-input-general" accept=".json,.yaml,.yml" class="hidden-input" />
                </label>
                ${currentSongId ? `
                  <label class="btn btn-outline file-input-label btn-translation-input" title="Añadir el archivo como nueva traducción a la canción activa">
                    ${iconPlus} Añadir como Traducción
                    <input type="file" id="file-input-translation" accept=".yaml,.yml" class="hidden-input" />
                  </label>
                ` : ''}
              </div>
            </div>
          </section>

          <!-- Listado de Canciones -->
          <section class="songs-section">
            <div class="section-header">
              <h3>Canciones en este Dispositivo (${songs.length})</h3>
              <div class="backup-actions">
                <button class="btn btn-xs btn-outline" id="btn-export-backup" title="Exportar respaldo de todas las canciones">
                  ${iconDownload} Respaldo Completo
                </button>
              </div>
            </div>
            <div class="songs-list">
              ${songsHtml}
            </div>
          </section>
        </div>
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    const backdrop = modalElement.querySelector('.modal-backdrop')
    if (backdrop) backdrop.addEventListener('click', close)

    const closeBtn = modalElement.querySelector('.btn-close-modal')
    if (closeBtn) closeBtn.addEventListener('click', close)

    // Cargar canción
    const playButtons = modalElement.querySelectorAll('.btn-play-song')
    playButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.songId)
        if (onSelectSong) onSelectSong(id)
        close()
      })
    })

    // Exportar JSON
    const exportJsonButtons = modalElement.querySelectorAll('.btn-export-json')
    exportJsonButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = Number(btn.dataset.songId)
        try {
          await exportSongPackage(id)
          showStatus('Paquete JSON exportado correctamente.', 'success')
        } catch (err) {
          showStatus('Error al exportar JSON: ' + err.message, 'error')
        }
      })
    })

    // Exportar Lyricsfile YAML
    const exportYamlButtons = modalElement.querySelectorAll('.btn-export-yaml')
    exportYamlButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = Number(btn.dataset.songId)
        try {
          await exportLanguageToLyricsfile(id)
          showStatus('Archivo .lyricsfile.yaml exportado correctamente.', 'success')
        } catch (err) {
          showStatus('Error al exportar YAML: ' + err.message, 'error')
        }
      })
    })

    // Eliminar canción
    const deleteButtons = modalElement.querySelectorAll('.btn-delete-song')
    deleteButtons.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation()
        const id = Number(btn.dataset.songId)
        const target = songs.find(s => Number(s.id) === id)
        const confirmDelete = window.confirm(`¿Seguro que deseas eliminar "${target ? target.title : 'esta canción'}" de tu biblioteca local?`)
        if (confirmDelete) {
          try {
            await deleteSong(id)
            showStatus('Canción eliminada de la biblioteca local.', 'info')
            await loadSongList()
          } catch (err) {
            showStatus('Error al eliminar canción: ' + err.message, 'error')
          }
        }
      })
    })

    // Respaldo completo
    const backupBtn = modalElement.querySelector('#btn-export-backup')
    if (backupBtn) {
      backupBtn.addEventListener('click', async () => {
        try {
          await exportLibraryBackup()
          showStatus('Respaldo de biblioteca exportado con éxito.', 'success')
        } catch (err) {
          showStatus('Error al exportar respaldo: ' + err.message, 'error')
        }
      })
    }

    // Input file general (canción nueva)
    const fileInputGeneral = modalElement.querySelector('#file-input-general')
    if (fileInputGeneral) {
      fileInputGeneral.addEventListener('change', async (e) => {
        const file = e.target.files[0]
        if (file) {
          await handleIncomingFile(file, false)
        }
      })
    }

    // Input file para traducción
    const fileInputTranslation = modalElement.querySelector('#file-input-translation')
    if (fileInputTranslation) {
      fileInputTranslation.addEventListener('change', async (e) => {
        const file = e.target.files[0]
        if (file) {
          await handleIncomingFile(file, true)
        }
      })
    }

    // Drag and drop en dropzone
    const dropzone = modalElement.querySelector('#file-dropzone')
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault()
        dropzone.classList.add('drag-over')
      })
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('drag-over')
      })
      dropzone.addEventListener('drop', async (e) => {
        e.preventDefault()
        dropzone.classList.remove('drag-over')
        const file = e.dataTransfer.files[0]
        if (file) {
          await handleIncomingFile(file, false)
        }
      })
    }
  }

  async function handleIncomingFile(file, isTranslationOnly = false) {
    const fileName = file.name.toLowerCase()
    try {
      if (isTranslationOnly) {
        const currentSongId = getCurrentSongId()
        if (!currentSongId) throw new Error('No hay una canción seleccionada para añadir la traducción.')
        await importLyricsfileAsTranslation(currentSongId, file)
        showStatus(`Traducción agregada exitosamente desde "${file.name}".`, 'success')
        if (onSelectSong) onSelectSong(currentSongId)
      } else if (fileName.endsWith('.json')) {
        const text = await file.text()
        const parsed = JSON.parse(text)
        if (parsed.type === 'saranga-library-backup') {
          await importLibraryBackup(parsed)
          showStatus(`Respaldo de biblioteca restaurado exitosamente.`, 'success')
        } else {
          const newId = await importSongPackage(parsed)
          showStatus(`Canción "${parsed.metadata?.title || 'Importada'}" agregada con éxito.`, 'success')
          if (onSelectSong) onSelectSong(newId)
        }
      } else if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) {
        const newId = await importLyricsfileAsNewSong(file)
        showStatus(`Canción importada exitosamente desde archivo Lyricsfile "${file.name}".`, 'success')
        if (onSelectSong) onSelectSong(newId)
      } else {
        throw new Error('Formato no soportado. Debe ser un archivo .json o .yaml/.yml.')
      }

      await loadSongList()
    } catch (err) {
      console.error('Error al importar archivo:', err)
      showStatus('Error al importar: ' + err.message, 'error')
    }
  }

  function escapeHtml(str) {
    if (!str) return ''
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }

  return {
    open,
    close,
    refresh: loadSongList
  }
}
