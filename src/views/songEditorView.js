import { saveSong } from '../services/songService.js'
import { exportSongPackage } from '../services/shareService.js'
import { exportLanguageToLyricsfile } from '../services/lyricsfileService.js'
import { formatTime } from '../lyrics/timing.js'
import { splitPhraseIntoSyllables, splitPhraseIntoWords, autoDistributeSyllables } from '../lyrics/syllablesHelper.js'
import {
  iconArrowLeft,
  iconSave,
  iconTrash,
  iconPlus,
  iconClose,
  iconPlay,
  iconPause,
  iconClock,
  iconEdit,
  iconFileText,
  iconChevronUp,
  iconChevronDown,
  iconMic,
  iconDownload,
  iconSparkles,
  iconGlobe,
  iconEye
} from './icons.js'
import { hasJapanese, autoGenerateRomajiForLines } from '../lyrics/transliterationHelper.js'

export function createSongEditorView({
  containerElement,
  mediaPlayer,
  onSongSaved,
  onGoToMenu,
  onEnterLyricsMode
}) {
  const STORAGE_KEY_REF_MODE = 'saranga_editor_translation_ref_mode'
  let currentSong = null
  let activeLangIndex = 0
  let expandedLineIndices = new Set()
  let statusMessage = ''
  let statusType = 'info' // 'info' | 'success' | 'error'
  let isMetadataOpen = true
  let isQuickImportModalOpen = false
  let isAddLanguageModalOpen = false
  let isEditLanguageModalOpen = false
  let previewTimer = null
  let translationRefMode = 'both' // 'both' | 'text' | 'alt' | 'none'

  try {
    const savedRefMode = localStorage.getItem(STORAGE_KEY_REF_MODE)
    if (['both', 'text', 'alt', 'none'].includes(savedRefMode)) {
      translationRefMode = savedRefMode
    }
  } catch (_) {}

  function getBlankSongTemplate() {
    return {
      id: null,
      title: '',
      artist: '',
      genres: ['Pop'],
      tags: ['mi-creación'],
      videos: [
        {
          id: `vid-${Date.now()}-0`,
          name: 'Video Oficial (YouTube / YT Music)',
          url: '',
          offset: 0
        }
      ],
      lyrics_data: {
        timing: {
          bpm: 120,
          timeSignature: [4, 4],
          syncMode: 'timestamp',
          globalOffset: 0
        },
        styles: {
          textColor: '#94a3b8',
          activeColor: '#fbbf24',
          completedColor: '#f59e0b',
          translationColor: '#38bdf8',
          backgroundColor: '#0f172a'
        },
        languages: [
          {
            code: 'es',
            name: 'Español (Original)',
            isMain: true,
            plain: '',
            lines: []
          }
        ]
      }
    }
  }

  function open(songToEdit = null) {
    if (songToEdit) {
      // Clonar profundamente para no alterar el objeto original hasta guardar
      currentSong = JSON.parse(JSON.stringify(songToEdit))

      // Desempaquetar si viene en formato package { metadata, basic, advanced }
      if (currentSong.metadata) {
        if (!currentSong.title && currentSong.metadata.title) currentSong.title = currentSong.metadata.title
        if (!currentSong.artist && currentSong.metadata.artist) currentSong.artist = currentSong.metadata.artist
        if ((!currentSong.videos || currentSong.videos.length === 0) && currentSong.metadata.videos) {
          currentSong.videos = currentSong.metadata.videos
        }
        if ((!currentSong.genres || currentSong.genres.length === 0) && currentSong.metadata.genres) {
          currentSong.genres = currentSong.metadata.genres
        }
        if ((!currentSong.tags || currentSong.tags.length === 0) && currentSong.metadata.tags) {
          currentSong.tags = currentSong.metadata.tags
        }
        if (!currentSong.audio_path && currentSong.metadata.audioPath) {
          currentSong.audio_path = currentSong.metadata.audioPath
        }
      }

      if (!currentSong.lyrics_data) {
        currentSong.lyrics_data = currentSong.basic || {}
      }

      // Normalizar estructura
      if (!Array.isArray(currentSong.lyrics_data.languages) || currentSong.lyrics_data.languages.length === 0) {
        if (currentSong.basic && Array.isArray(currentSong.basic.languages) && currentSong.basic.languages.length > 0) {
          currentSong.lyrics_data.languages = currentSong.basic.languages
        } else {
          currentSong.lyrics_data.languages = [
            {
              code: 'es',
              name: 'Español (Original)',
              isMain: true,
              plain: currentSong.lyrics_data.plain || '',
              lines: currentSong.lyrics_data.lines || []
            }
          ]
        }
      }
      if (!Array.isArray(currentSong.videos) || currentSong.videos.length === 0) {
        currentSong.videos = [
          {
            id: `vid-${Date.now()}-0`,
            name: 'Video Oficial',
            url: currentSong.metadata?.youtubeUrlFull || currentSong.lyrics_data.youtube?.full || '',
            offset: 0
          }
        ]
      }
    } else {
      currentSong = getBlankSongTemplate()
    }

    activeLangIndex = 0
    expandedLineIndices = new Set([0]) // Expandir la primera frase por defecto
    statusMessage = ''
    statusType = 'info'
    isMetadataOpen = !currentSong.title // Abrir metadatos si es una canción nueva
    isQuickImportModalOpen = false
    isAddLanguageModalOpen = false
    isEditLanguageModalOpen = false

    // Si tiene video con URL, opcionalmente cargarlo en el reproductor multimedia
    const firstVideo = currentSong.videos?.find(v => v.url)
    if (firstVideo && mediaPlayer) {
      mediaPlayer.loadSong(currentSong, firstVideo.id).catch(() => {})
    }

    render()
  }

  function showStatus(msg, type = 'info') {
    statusMessage = msg
    statusType = type
    render()
  }

  function getActiveLanguage() {
    if (!currentSong?.lyrics_data?.languages) return null
    return currentSong.lyrics_data.languages[activeLangIndex] || currentSong.lyrics_data.languages[0]
  }

  function render() {
    if (!containerElement || !currentSong) return

    const activeLang = getActiveLanguage()
    const languages = currentSong.lyrics_data.languages || []
    const mainLang = languages.find(l => l.isMain) || languages[0]
    const isTranslation = Boolean(activeLang && mainLang && activeLang !== mainLang)
    const lines = activeLang?.lines || []
    const videos = currentSong.videos || []
    const isNew = !currentSong.id
    const totalSylCount = lines.reduce((acc, l) => acc + (l.syllables?.length || 0), 0)
    const hasJpInActiveLang = (lines || []).some(l => hasJapanese(l.text)) || (activeLang && hasJapanese(activeLang.plain || ''))

    // Pestañas de idiomas
    const langTabsHtml = languages.map((lang, idx) => {
      const isActive = idx === activeLangIndex
      return `
        <button
          class="editor-lang-tab ${isActive ? 'active' : ''}"
          data-lang-idx="${idx}"
          title="${isActive ? 'Hacé clic para cambiar nombre o código ISO de este idioma' : `Cambiar al idioma ${escapeHtml(lang.name)}`}"
        >
          ${lang.isMain ? '(Principal) ' : ''}${escapeHtml(lang.name)}
          <span class="lang-code-pill">[${escapeHtml(lang.code)}]</span>
          ${isActive ? `<span class="tab-edit-icon" title="Editar nombre y código ISO">${iconEdit}</span>` : ''}
        </button>
      `
    }).join('')

    // Lista de frases del idioma activo
    const linesListHtml = lines.length === 0
      ? `
        <div class="empty-lines-state">
          <p class="empty-title">Este idioma aún no tiene frases añadidas.</p>
          <p class="empty-desc">Podés añadir frases una a una o pegar la letra completa con tiempos y sílabas automáticas.</p>
          <div class="empty-actions">
            <button class="btn btn-primary btn-add-first-line">${iconPlus} Añadir Primera Frase</button>
            <button class="btn btn-outline btn-open-quick-import">${iconFileText} Pegar Letra Completa</button>
          </div>
        </div>
      `
      : lines.map((line, lineIdx) => {
        const isExpanded = expandedLineIndices.has(lineIdx)
        const sylCount = line.syllables?.length || 0
        const duration = Math.max(0, (line.endTime || 0) - (line.startTime || 0))

        // Generar guía de referencia de la frase original si se está traduciendo
        let refGuideHtml = ''
        if (isTranslation && translationRefMode !== 'none') {
          const refLine = mainLang?.lines?.[lineIdx]
          if (refLine) {
            const refText = (refLine.text || '').trim()
            const refAltText = (refLine.altText || refLine.romaji || '').trim()
            const showText = translationRefMode === 'text' || translationRefMode === 'both'
            const showAlt = translationRefMode === 'alt' || translationRefMode === 'both'

            refGuideHtml = `
              <div class="phrase-ref-guide" data-line-idx="${lineIdx}" title="Referencia del idioma original (${escapeHtml(mainLang.name || 'Original')}) para el verso #${lineIdx + 1}">
                <span class="phrase-ref-label">
                  ${iconGlobe} ${escapeHtml(mainLang.name || 'Original')} #${lineIdx + 1}:
                </span>

                ${showText ? `
                  <span class="phrase-ref-text ${!refText ? 'is-blank-pause' : ''}" title="${!refText ? 'En el original este verso está en blanco (pausa instrumental)' : 'Texto original'}">
                    ${refText ? escapeHtml(refText) : '⏸ [Pausa / Verso en blanco]'}
                  </span>
                ` : ''}

                ${showText && showAlt && refAltText && refText ? `
                  <span class="phrase-ref-sep">•</span>
                ` : ''}

                ${showAlt ? `
                  ${refAltText ? `
                    <span class="phrase-ref-alt" title="Texto alternativo fonético">${escapeHtml(refAltText)}</span>
                  ` : (translationRefMode === 'alt' ? `
                    <span class="phrase-ref-alt is-blank-alt" title="Sin texto alternativo">(Sin texto alternativo)</span>
                  ` : '')}
                ` : ''}

                <button type="button" class="btn-copy-ref-line" data-line-idx="${lineIdx}" title="Copiar texto del verso original a este campo">
                  Copiar
                </button>
              </div>
            `
          } else {
            refGuideHtml = `
              <div class="phrase-ref-guide is-missing" data-line-idx="${lineIdx}" title="No hay un verso correspondiente en ${escapeHtml(mainLang?.name || 'Original')}">
                <span class="phrase-ref-label">
                  ${iconGlobe} ${escapeHtml(mainLang?.name || 'Original')} #${lineIdx + 1}:
                </span>
                <span class="phrase-ref-text is-missing">(Sin verso correspondiente en original)</span>
              </div>
            `
          }
        }

        const syllablesListHtml = (line.syllables || []).map((syl, sylIdx) => {
          return `
            <div class="syllable-edit-chip" data-line-idx="${lineIdx}" data-syl-idx="${sylIdx}">
              <div class="chip-top">
                <span class="syl-idx">#${sylIdx + 1}</span>
                <input
                  type="text"
                  class="input-syl-text"
                  value="${escapeHtml(syl.text)}"
                  placeholder="Texto"
                  title="Texto de la sílaba o palabra (incluye espacio final si termina palabra)"
                  data-line-idx="${lineIdx}"
                  data-syl-idx="${sylIdx}"
                />
                <input
                  type="text"
                  class="input-syl-alt"
                  value="${escapeHtml(syl.altText || syl.romaji || '')}"
                  placeholder="Romaji"
                  title="Texto alternativo fonético (Romaji / Pinyin) para esta sílaba"
                  data-line-idx="${lineIdx}"
                  data-syl-idx="${sylIdx}"
                />
                <button class="btn-remove-syl" data-line-idx="${lineIdx}" data-syl-idx="${sylIdx}" title="Quitar sílaba">${iconClose}</button>
              </div>
              <div class="chip-bottom">
                <div class="syl-timing-item">
                  <label>Inicio (s):</label>
                  <div class="input-with-capture">
                    <input
                      type="number"
                      step="0.05"
                      class="input-syl-start"
                      value="${syl.startTime ?? line.startTime ?? 0}"
                      data-line-idx="${lineIdx}"
                      data-syl-idx="${sylIdx}"
                    />
                    <button class="btn-capture-syl-time" data-line-idx="${lineIdx}" data-syl-idx="${sylIdx}" title="Capturar tiempo actual del reproductor">${iconClock}</button>
                  </div>
                </div>
                <div class="syl-timing-item">
                  <label>Duración (s):</label>
                  <input
                    type="number"
                    step="0.05"
                    class="input-syl-dur"
                    value="${syl.duration ?? 0.3}"
                    data-line-idx="${lineIdx}"
                    data-syl-idx="${sylIdx}"
                  />
                </div>
              </div>
            </div>
          `
        }).join('')

        return `
          <article class="phrase-editor-card ${isExpanded ? 'is-expanded' : ''}" data-line-idx="${lineIdx}">
            <div class="phrase-card-header">
              <div class="phrase-index-badge">#${lineIdx + 1}</div>
              
              <div class="phrase-main-input-group">
                ${refGuideHtml}
                <input
                  type="text"
                  class="input-phrase-text"
                  placeholder="${isTranslation ? `Traducción del verso #${lineIdx + 1}...` : 'Verso / caracteres originales...'}"
                  value="${escapeHtml(line.text)}"
                  data-line-idx="${lineIdx}"
                />
                <input
                  type="text"
                  class="input-phrase-alt"
                  placeholder="${isTranslation ? 'Texto alternativo / notas (opcional)...' : 'Texto alternativo (Romaji / Fonética)...'}"
                  value="${escapeHtml(line.altText || line.romaji || '')}"
                  title="Texto alternativo en alfabeto latino (ej. Romaji para japonés o transliteración)"
                  data-line-idx="${lineIdx}"
                />
              </div>

              <div class="phrase-timing-bar">
                <div class="time-field" title="Tiempo de inicio de la frase en segundos">
                  <label>Inicio:</label>
                  <div class="input-with-capture">
                    <input
                      type="number"
                      step="0.1"
                      class="input-phrase-start"
                      value="${line.startTime ?? 0}"
                      data-line-idx="${lineIdx}"
                    />
                    <button class="btn btn-xs btn-capture-line-start" data-line-idx="${lineIdx}" title="Capturar segundo actual del reproductor">${iconClock}</button>
                  </div>
                </div>

                <div class="time-field" title="Tiempo de fin de la frase en segundos">
                  <label>Fin:</label>
                  <div class="input-with-capture">
                    <input
                      type="number"
                      step="0.1"
                      class="input-phrase-end"
                      value="${line.endTime ?? (Number(line.startTime || 0) + 3)}"
                      data-line-idx="${lineIdx}"
                    />
                    <button class="btn btn-xs btn-capture-line-end" data-line-idx="${lineIdx}" title="Capturar segundo actual del reproductor">${iconClock}</button>
                  </div>
                </div>

                <button class="btn btn-xs btn-outline btn-listen-phrase" data-line-idx="${lineIdx}" title="Escuchar este verso en el audio">
                  ${iconPlay} Probar
                </button>
              </div>

              <div class="phrase-actions">
                <button class="btn btn-xs btn-outline btn-toggle-syllables" data-line-idx="${lineIdx}" title="${isExpanded ? 'Contraer sílabas' : 'Editar sílabas y tiempos'}">
                  Sílabas (${sylCount}) ${isExpanded ? iconChevronUp : iconChevronDown}
                </button>
                ${sylCount > 0 ? `
                  <button class="btn btn-xs btn-outline btn-danger-outline btn-clear-line-syllables" data-line-idx="${lineIdx}" title="Borrar todas las sílabas de este verso">
                    ${iconTrash} Sílabas
                  </button>
                ` : ''}
                <button class="btn btn-xs btn-outline btn-move-line-up" data-line-idx="${lineIdx}" title="Mover arriba" ${lineIdx === 0 ? 'disabled' : ''}>${iconChevronUp}</button>
                <button class="btn btn-xs btn-outline btn-move-line-down" data-line-idx="${lineIdx}" title="Mover abajo" ${lineIdx === lines.length - 1 ? 'disabled' : ''}>${iconChevronDown}</button>
                <button class="btn btn-xs btn-outline btn-delete-line" data-line-idx="${lineIdx}" title="Eliminar este verso">${iconTrash}</button>
              </div>
            </div>

            <!-- Panel de Sílabas y Tiempos de Canto -->
            ${isExpanded ? `
              <div class="phrase-syllables-panel">
                <div class="syllables-toolbar">
                  <div class="syllables-summary">
                    <span><strong>${sylCount}</strong> sílaba(s)</span>
                    <span class="dur-badge">Duración total: <strong>${duration.toFixed(2)}s</strong></span>
                  </div>

                  <div class="syllables-quick-actions">
                    <button class="btn btn-xs btn-outline btn-auto-syllables" data-line-idx="${lineIdx}" title="Dividir frase automáticamente en sílabas con ponderación fonética inteligente">
                      Silabear Automático
                    </button>
                    <button class="btn btn-xs btn-outline btn-auto-words" data-line-idx="${lineIdx}" title="Dividir frase por palabras">
                      Dividir en Palabras
                    </button>
                    <button class="btn btn-xs btn-outline btn-distribute-times" data-line-idx="${lineIdx}" title="Distribuir tiempos entre las sílabas con ponderación fonética inteligente">
                      ${iconClock} Distribuir Tiempos
                    </button>
                    <button class="btn btn-xs btn-primary btn-add-syllable" data-line-idx="${lineIdx}">
                      ${iconPlus} Añadir Sílaba
                    </button>
                    <button class="btn btn-xs btn-outline btn-danger-outline btn-clear-line-syllables" data-line-idx="${lineIdx}" title="Borrar todas las sílabas de este verso" ${sylCount === 0 ? 'disabled' : ''}>
                      ${iconTrash} Borrar Sílabas
                    </button>
                  </div>
                </div>

                <!-- Cuadrícula de edición de sílabas -->
                <div class="syllables-grid">
                  ${syllablesListHtml || '<div class="no-syl-message">Pulsa "Dividir en Sílabas Automático" o "Añadir Sílaba" para configurar los tiempos de canto.</div>'}
                </div>

                <!-- Previsualización reconstruida -->
                <div class="syllables-preview">
                  <span class="preview-label">Reconstrucción visual:</span>
                  <span class="preview-text">
                    ${(line.syllables || []).map(s => `<span class="syl-preview-span" title="Inicio: ${s.startTime}s, Duración: ${s.duration}s">${escapeHtml(s.text)}</span>`).join('') || '(vacío)'}
                  </span>
                </div>
              </div>
            ` : ''}
          </article>
        `
      }).join('')

    // Videos list HTML
    const videosListHtml = videos.map((vid, vIdx) => `
      <div class="video-config-row" data-video-idx="${vIdx}">
        <input
          type="text"
          class="input-vid-name"
          placeholder="Nombre del video (ej. Oficial, Acústico)"
          value="${escapeHtml(vid.name)}"
          data-video-idx="${vIdx}"
        />
        <input
          type="text"
          class="input-vid-url"
          placeholder="URL de YouTube / YouTube Music (ej. https://music.youtube.com/watch?v=...)"
          value="${escapeHtml(vid.url)}"
          data-video-idx="${vIdx}"
        />
        <div class="video-offset-wrapper">
          <label>Offset (s):</label>
          <input
            type="number"
            step="0.1"
            class="input-vid-offset"
            value="${vid.offset || 0}"
            data-video-idx="${vIdx}"
          />
        </div>
        <button class="btn btn-xs btn-outline btn-test-video-audio" data-video-idx="${vIdx}" title="Probar audio de este video">${iconPlay} Cargar</button>
        ${videos.length > 1 ? `
          <button class="btn btn-xs btn-outline btn-remove-video" data-video-idx="${vIdx}" title="Quitar video">${iconTrash}</button>
        ` : ''}
      </div>
    `).join('')

    containerElement.innerHTML = `
      <div class="song-editor-view-container">
        <!-- Barra de Encabezado Superior -->
        <header class="editor-header-bar">
          <div class="editor-brand">
            <button class="btn btn-outline btn-sm" id="btn-editor-back">
              ${iconArrowLeft} Menú
            </button>
            <div class="editor-title-block">
              <h2 class="editor-heading">${isNew ? 'Crear Nueva Canción' : `Edición`}</h2>
              <span class="editor-subheading">${isNew ? 'Añade metadatos, videos de YouTube / YouTube Music y letras multilingües con sílabas' : `${escapeHtml(currentSong.title || 'Sin Título')} - ${escapeHtml(currentSong.artist || 'Desconocido')}`}</span>
            </div>
          </div>

          <div class="editor-header-actions">
            <button class="btn btn-outline btn-sm btn-open-quick-import" title="Importar o pegar letra completa de un tirón">
              ${iconFileText} Pegar Letra Completa
            </button>
            <button class="btn btn-outline btn-sm" id="btn-editor-export-json" title="Exportar paquete de canción JSON (copia de seguridad)">
              ${iconDownload} JSON
            </button>
            <button class="btn btn-outline btn-sm" id="btn-editor-export-yaml" title="Exportar al estándar Lyricsfile (.yaml)">
              ${iconDownload} Lyricsfile
            </button>
            <button class="btn btn-primary btn-sm" id="btn-save-song" title="Guardar cambios en tu biblioteca local (IndexedDB)">
              ${iconSave} Guardar Canción
            </button>
            <button class="btn btn-success btn-sm" id="btn-save-and-sing" title="Guardar e ingresar directamente al visor de letras sincronizadas">
              ${iconMic} Probar en Modo Letra
            </button>
          </div>
        </header>

        ${statusMessage ? `
          <div class="status-alert status-${statusType}">
            ${escapeHtml(statusMessage)}
          </div>
        ` : ''}

        <!-- Asistente de Audio para Sincronización en Vivo -->
        <div class="editor-audio-assistant">
          <div class="assistant-info">
            <div class="assistant-text">
              <strong>Asistente de Audio en Vivo:</strong>
              <span>Reproducí o pausá el audio mientras editás para capturar los tiempos exactos con el botón de captura de tiempo en cada frase o sílaba.</span>
            </div>
          </div>

          <div class="assistant-controls">
            <button class="btn btn-primary btn-sm btn-assistant-play" id="btn-assistant-play">
              ${mediaPlayer?.getIsPlaying() ? `${iconPause} Pausa` : `${iconPlay} Reproducir`}
            </button>
            <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="-5" title="Retroceder 5 segundos">-5s</button>
            <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="-1" title="Retroceder 1 segundo">-1s</button>
            
            <div class="assistant-clock">
              <span class="clock-label">Tiempo Actual (τ):</span>
              <span class="clock-time" id="assistant-clock-time">${formatTime(Math.max(0, mediaPlayer?.getCurrentTime() || 0), true)}</span>
            </div>

            <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="1" title="Adelantar 1 segundo">+1s</button>
            <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="5" title="Adelantar 5 segundos">+5s</button>
          </div>
        </div>

        <div class="editor-content-scroll">
          <!-- Acordeón de Metadatos y Videos de la Canción -->
          <details class="editor-section-card" ${isMetadataOpen ? 'open' : ''} id="editor-metadata-details">
            <summary class="editor-section-summary">
              <span class="summary-title">1. Metadatos Generales y Videos Asociados</span>
              <span class="summary-badge">${escapeHtml(currentSong.title || 'Completar datos')} (${videos.length} video(s))</span>
            </summary>

            <div class="editor-section-body">
              <div class="form-row-grid">
                <div class="form-group">
                  <label for="input-song-title">Título de la Canción *:</label>
                  <input
                    type="text"
                    id="input-song-title"
                    class="form-input"
                    placeholder="Ej. Caminando por la Ciudad"
                    value="${escapeHtml(currentSong.title)}"
                  />
                </div>

                <div class="form-group">
                  <label for="input-song-artist">Artista o Banda:</label>
                  <input
                    type="text"
                    id="input-song-artist"
                    class="form-input"
                    placeholder="Ej. Soda Stereo, Queen, etc."
                    value="${escapeHtml(currentSong.artist)}"
                  />
                </div>
              </div>

              <div class="form-row-grid">
                <div class="form-group">
                  <label for="input-song-genres">Géneros (separados por coma):</label>
                  <input
                    type="text"
                    id="input-song-genres"
                    class="form-input"
                    placeholder="Ej. Rock, Pop, Balada"
                    value="${escapeHtml((currentSong.genres || []).join(', '))}"
                  />
                </div>

                <div class="form-group">
                  <label for="input-song-tags">Etiquetas (separadas por coma):</label>
                  <input
                    type="text"
                    id="input-song-tags"
                    class="form-input"
                    placeholder="Ej. karaoke, acústico, enérgico"
                    value="${escapeHtml((currentSong.tags || []).join(', '))}"
                  />
                </div>
              </div>

              <!-- Lista de videos asociados -->
              <div class="videos-management-block">
                <div class="block-header">
                  <h4>Videos de YouTube / YouTube Music y Offsets</h4>
                  <button class="btn btn-xs btn-outline" id="btn-add-new-video">${iconPlus} Asociar Otro Video</button>
                </div>
                <div class="videos-list-container">
                  ${videosListHtml}
                </div>
              </div>
            </div>
          </details>

          <!-- Sección de Idiomas y Frases -->
          <section class="editor-section-card editor-lyrics-section">
            <div class="editor-lyrics-header">
              <div class="lyrics-section-titles">
                <h3>2. Idiomas y Letras de la Canción</h3>
                <p>Gestioná la versión original cantada y añade todas las traducciones que desees.</p>
              </div>

              <div class="lang-actions-group">
                <button class="btn btn-sm btn-outline" id="btn-add-language">
                  ${iconPlus} Añadir Idioma / Traducción
                </button>
              </div>
            </div>

            <!-- Fila de Pestañas de Idiomas -->
            <div class="editor-lang-tabs-bar">
              ${langTabsHtml}
            </div>

            <!-- Barra de estado y configuración del idioma activo -->
            ${activeLang ? `
              <div class="active-lang-settings-bar">
                <div class="lang-info-group">
                  <span class="lang-title-badge btn-trigger-edit-lang" title="Hacé clic para cambiar el nombre o código ISO de este idioma">
                    ${activeLang.isMain ? 'Idioma Principal (Voz del Artista)' : 'Traducción Sincronizada'}: <strong>${escapeHtml(activeLang.name)}</strong> <span class="lang-code-tag">[${escapeHtml(activeLang.code)}]</span> ${iconEdit}
                  </span>
                  <span class="lang-counter">Frases: <strong>${lines.length}</strong></span>
                </div>

                <div class="lang-controls-group">
                  <button class="btn btn-xs btn-outline" id="btn-edit-active-lang" title="Cambiar nombre y código ISO de este idioma">
                    ${iconEdit} Editar Idioma
                  </button>

                  ${!activeLang.isMain ? `
                    <button class="btn btn-xs btn-outline" id="btn-set-lang-main" title="Establecer este idioma como el cantado originalmente">
                      Hacer Principal
                    </button>
                  ` : ''}

                  ${languages.length > 1 ? `
                    <button class="btn btn-xs btn-outline btn-danger-outline" id="btn-delete-active-lang" title="Eliminar esta pista de idioma">
                      ${iconTrash} Eliminar Idioma
                    </button>
                  ` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Barra de Herramientas de Frases -->
            <div class="phrases-toolbar">
              <div class="phrases-count">
                <span>Versos en <strong>${escapeHtml(activeLang?.name || 'Idioma')}</strong> (${lines.length})</span>
                ${totalSylCount > 0 ? `<span class="phrases-syl-count">• <strong>${totalSylCount}</strong> sílaba(s)</span>` : ''}
                ${isTranslation ? `
                  <div class="ref-mode-selector-wrapper" title="Configurar visualización de la frase original de referencia">
                    <label for="select-translation-ref-mode" class="ref-mode-label">
                      ${iconEye} Guía original:
                    </label>
                    <select id="select-translation-ref-mode" class="ref-mode-select" title="Seleccionar qué mostrar como referencia mientras traduces">
                      <option value="both" ${translationRefMode === 'both' ? 'selected' : ''}>Ambos (Original + Alternativo)</option>
                      <option value="text" ${translationRefMode === 'text' ? 'selected' : ''}>Solo texto original</option>
                      <option value="alt" ${translationRefMode === 'alt' ? 'selected' : ''}>Solo texto alternativo</option>
                      <option value="none" ${translationRefMode === 'none' ? 'selected' : ''}>Desactivado</option>
                    </select>
                  </div>
                ` : ''}
              </div>

              <div class="phrases-tools">
                <button class="btn btn-sm btn-outline btn-open-quick-import" title="Pegar texto completo y dividir en versos">
                  ${iconFileText} Pegar Letra Completa
                </button>
                ${hasJpInActiveLang ? `
                  <button class="btn btn-sm btn-outline btn-auto-romaji" id="btn-auto-generate-romaji" title="Generar automáticamente texto alternativo y fonemas en Romaji para todas las frases y sílabas de este idioma">
                    ${iconSparkles} Romaji Automático
                  </button>
                ` : ''}
                <button
                  class="btn btn-sm btn-outline btn-danger-outline"
                  id="btn-clear-all-syllables"
                  title="${totalSylCount > 0 ? 'Borrar todas las sílabas de las frases de este idioma' : 'No hay sílabas configuradas en ninguna frase'}"
                  ${totalSylCount === 0 ? 'disabled' : ''}
                >
                  ${iconTrash} Borrar Todas las Sílabas
                </button>
                <button class="btn btn-sm btn-primary" id="btn-add-phrase-top">
                  ${iconPlus} Añadir Frase
                </button>
              </div>
            </div>

            <!-- Listado de Frases / Líneas -->
            <div class="phrases-list-container">
              ${linesListHtml}
            </div>

            ${lines.length > 0 ? `
              <div class="phrases-footer-actions">
                <button class="btn btn-outline" id="btn-add-phrase-bottom">
                  ${iconPlus} Añadir Frase al Final
                </button>
                ${totalSylCount > 0 ? `
                  <button class="btn btn-outline btn-danger-outline btn-clear-all-syllables-trigger" title="Borrar todas las sílabas de las frases de este idioma">
                    ${iconTrash} Borrar Todas las Sílabas
                  </button>
                ` : ''}
              </div>
            ` : ''}
          </section>
        </div>

        <!-- Modal de Importación Rápida de Letra Plana -->
        ${isQuickImportModalOpen ? `
          <div class="modal-backdrop"></div>
          <div class="modal-dialog modal-dialog-lg">
            <header class="modal-header">
              <div class="header-titles">
                <h2>Pegar Letra Completa</h2>
                <p class="subtitle">Pega el texto de la canción para generar versos y sílabas automáticamente.</p>
              </div>
              <button class="btn-close-modal btn-close-quick-import">${iconClose}</button>
            </header>

            <div class="modal-body">
              <div class="form-group">
                <label for="textarea-quick-lyrics">Texto de la letra (un verso por línea):</label>
                <textarea
                  id="textarea-quick-lyrics"
                  class="quick-lyrics-textarea"
                  rows="10"
                  placeholder="This was a triumph&#10;I'm making a note here, huge success&#10;It's hard to overstate my satisfaction..."
                ></textarea>
              </div>

              <div class="quick-import-options-grid">
                <div class="form-group">
                  <label for="input-import-start-time">Segundo de inicio del primer verso:</label>
                  <input
                    type="number"
                    step="0.5"
                    id="input-import-start-time"
                    class="form-input"
                    value="${Math.max(0, mediaPlayer?.getCurrentTime() ? +(mediaPlayer.getCurrentTime()).toFixed(1) : 2.0)}"
                  />
                </div>

                <div class="form-group">
                  <label for="input-import-duration">Duración promedio por verso (segundos):</label>
                  <input
                    type="number"
                    step="0.5"
                    id="input-import-duration"
                    class="form-input"
                    value="3.5"
                  />
                </div>

                <div class="form-group">
                  <label for="input-import-gap">Pausa entre versos (segundos):</label>
                  <input
                    type="number"
                    step="0.1"
                    id="input-import-gap"
                    class="form-input"
                    value="0.5"
                  />
                </div>
              </div>

              <div class="quick-import-checkbox-row">
                <label class="checkbox-label">
                  <input type="checkbox" id="check-auto-syllabify" checked />
                  <span>Dividir cada verso en sílabas automáticamente con tiempos proporcionales</span>
                </label>
              </div>

              <div class="modal-footer-buttons">
                <button class="btn btn-outline btn-close-quick-import">Cancelar</button>
                <button class="btn btn-primary" id="btn-process-quick-import">
                  Generar Versos y Tiempos
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Modal para Añadir Idioma -->
        ${isAddLanguageModalOpen ? `
          <div class="modal-backdrop"></div>
          <div class="modal-dialog">
            <header class="modal-header">
              <div class="header-titles">
                <h2>Añadir Nuevo Idioma o Traducción</h2>
                <p class="subtitle">Configurá una nueva pista de idioma para esta canción</p>
              </div>
              <button class="btn-close-modal btn-close-add-lang">${iconClose}</button>
            </header>

            <div class="modal-body">
              <div class="form-group">
                <label for="input-new-lang-name">Nombre del Idioma (ej. Inglés, Português, Japonés):</label>
                <input type="text" id="input-new-lang-name" class="form-input" placeholder="English (Traducción)" />
              </div>

              <div class="form-group">
                <label for="input-new-lang-code">Código ISO (ej. en, pt, ja, it, fr):</label>
                <input type="text" id="input-new-lang-code" class="form-input" placeholder="en" />
              </div>

              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="check-copy-timings" checked />
                  <span>Copiar las marcas de tiempo del idioma principal (ideal para subtítulos traducidos)</span>
                </label>
              </div>

              <div class="modal-footer-buttons">
                <button class="btn btn-outline btn-close-add-lang">Cancelar</button>
                <button class="btn btn-primary" id="btn-confirm-add-lang">
                  ${iconPlus} Añadir Idioma
                </button>
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Modal para Editar Nombre y Código de Idioma -->
        ${isEditLanguageModalOpen && activeLang ? `
          <div class="modal-backdrop"></div>
          <div class="modal-dialog">
            <header class="modal-header">
              <div class="header-titles">
                <h2>Editar Nombre y Código de Idioma</h2>
                <p class="subtitle">Modificá el nombre visible y el código ISO para la pista activa</p>
              </div>
              <button class="btn-close-modal btn-close-edit-lang">${iconClose}</button>
            </header>

            <div class="modal-body">
              <div class="form-group">
                <label for="input-edit-lang-name">Nombre del Idioma (ej. Español (Original), English, 日本語):</label>
                <input
                  type="text"
                  id="input-edit-lang-name"
                  class="form-input"
                  value="${escapeHtml(activeLang.name)}"
                  placeholder="Nombre del idioma"
                />
              </div>

              <div class="form-group">
                <label for="input-edit-lang-code">Código ISO (ej. es, en, ja, fr, de, pt):</label>
                <input
                  type="text"
                  id="input-edit-lang-code"
                  class="form-input"
                  value="${escapeHtml(activeLang.code)}"
                  placeholder="Código ISO (ej. es, en)"
                />
              </div>

              <div class="modal-footer-buttons">
                <button class="btn btn-outline btn-close-edit-lang">Cancelar</button>
                <button class="btn btn-primary" id="btn-confirm-edit-lang">
                  ${iconSave} Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `

    bindEvents()
  }

  function bindEvents() {
    // 1. Botón Volver
    const backBtn = containerElement.querySelector('#btn-editor-back')
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (onGoToMenu) onGoToMenu()
      })
    }

    // 2. Metadatos generales
    const titleInput = containerElement.querySelector('#input-song-title')
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        currentSong.title = e.target.value
      })
    }

    const artistInput = containerElement.querySelector('#input-song-artist')
    if (artistInput) {
      artistInput.addEventListener('input', (e) => {
        currentSong.artist = e.target.value
      })
    }

    const genresInput = containerElement.querySelector('#input-song-genres')
    if (genresInput) {
      genresInput.addEventListener('change', (e) => {
        currentSong.genres = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
      })
    }

    const tagsInput = containerElement.querySelector('#input-song-tags')
    if (tagsInput) {
      tagsInput.addEventListener('change', (e) => {
        currentSong.tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
      })
    }

    // 3. Videos
    const videoRows = containerElement.querySelectorAll('.video-config-row')
    videoRows.forEach(row => {
      const vIdx = Number(row.dataset.videoIdx)
      const nameInput = row.querySelector('.input-vid-name')
      const urlInput = row.querySelector('.input-vid-url')
      const offsetInput = row.querySelector('.input-vid-offset')
      const testBtn = row.querySelector('.btn-test-video-audio')
      const removeBtn = row.querySelector('.btn-remove-video')

      if (nameInput) {
        nameInput.addEventListener('input', (e) => {
          if (currentSong.videos[vIdx]) currentSong.videos[vIdx].name = e.target.value
        })
      }
      if (urlInput) {
        urlInput.addEventListener('input', (e) => {
          if (currentSong.videos[vIdx]) currentSong.videos[vIdx].url = e.target.value
        })
      }
      if (offsetInput) {
        offsetInput.addEventListener('input', (e) => {
          if (currentSong.videos[vIdx]) currentSong.videos[vIdx].offset = Number(e.target.value) || 0
        })
      }
      if (testBtn) {
        testBtn.addEventListener('click', async () => {
          const vid = currentSong.videos[vIdx]
          if (vid && vid.url && mediaPlayer) {
            try {
              await mediaPlayer.loadSong(currentSong, vid.id)
              showStatus(`Audio cargado para probar: "${vid.name}"`, 'success')
            } catch (err) {
              showStatus('Error al cargar video: ' + err.message, 'error')
            }
          } else {
            showStatus('Ingresá una URL de YouTube o YouTube Music válida primero.', 'error')
          }
        })
      }
      if (removeBtn) {
        removeBtn.addEventListener('click', () => {
          currentSong.videos.splice(vIdx, 1)
          render()
        })
      }
    })

    const addVideoBtn = containerElement.querySelector('#btn-add-new-video')
    if (addVideoBtn) {
      addVideoBtn.addEventListener('click', () => {
        const nextIdx = (currentSong.videos || []).length + 1
        currentSong.videos.push({
          id: `vid-${Date.now()}-${nextIdx}`,
          name: `Pista / Video ${nextIdx}`,
          url: '',
          offset: 0
        })
        render()
      })
    }

    // 4. Asistente de audio
    const assistantPlayBtn = containerElement.querySelector('#btn-assistant-play')
    if (assistantPlayBtn && mediaPlayer) {
      assistantPlayBtn.addEventListener('click', async () => {
        await mediaPlayer.togglePlay()
        assistantPlayBtn.innerHTML = mediaPlayer.getIsPlaying() ? `${iconPause} Pausa` : `${iconPlay} Reproducir`
      })
    }

    const seekRelButtons = containerElement.querySelectorAll('.btn-seek-rel')
    seekRelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.seek)
        if (mediaPlayer) {
          const cur = mediaPlayer.getCurrentTime()
          mediaPlayer.seek(Math.max(0, cur + delta))
        }
      })
    })

    // 5. Tabs de Idiomas
    const langTabs = containerElement.querySelectorAll('.editor-lang-tab')
    langTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const clickedIdx = Number(tab.dataset.langIdx)
        if (clickedIdx === activeLangIndex) {
          // Si hace clic sobre el idioma actual, abrir modal de edición de nombre y código
          isEditLanguageModalOpen = true
          render()
        } else {
          // Cambiar al idioma seleccionado
          activeLangIndex = clickedIdx
          render()
        }
      })
    })

    const editLangBtn = containerElement.querySelector('#btn-edit-active-lang')
    if (editLangBtn) {
      editLangBtn.addEventListener('click', () => {
        isEditLanguageModalOpen = true
        render()
      })
    }

    const triggerEditLangBadge = containerElement.querySelector('.btn-trigger-edit-lang')
    if (triggerEditLangBadge) {
      triggerEditLangBadge.addEventListener('click', () => {
        isEditLanguageModalOpen = true
        render()
      })
    }

    const addLangBtn = containerElement.querySelector('#btn-add-language')
    if (addLangBtn) {
      addLangBtn.addEventListener('click', () => {
        isAddLanguageModalOpen = true
        render()
      })
    }

    const setLangMainBtn = containerElement.querySelector('#btn-set-lang-main')
    if (setLangMainBtn) {
      setLangMainBtn.addEventListener('click', () => {
        const langs = currentSong.lyrics_data.languages
        langs.forEach((l, idx) => {
          l.isMain = idx === activeLangIndex
        })
        showStatus(`"${langs[activeLangIndex].name}" establecido como Idioma Principal.`, 'success')
      })
    }

    const deleteActiveLangBtn = containerElement.querySelector('#btn-delete-active-lang')
    if (deleteActiveLangBtn) {
      deleteActiveLangBtn.addEventListener('click', () => {
        const activeLang = getActiveLanguage()
        if (window.confirm(`¿Seguro que deseas eliminar el idioma "${activeLang?.name}"?`)) {
          currentSong.lyrics_data.languages.splice(activeLangIndex, 1)
          activeLangIndex = 0
          showStatus('Idioma eliminado.', 'info')
        }
      })
    }

    // 6. Frases / Versos
    const activeLang = getActiveLanguage()
    const languages = currentSong.lyrics_data.languages || []
    const mainLang = languages.find(l => l.isMain) || languages[0]
    const lines = activeLang?.lines || []

    const addPhraseTopBtn = containerElement.querySelector('#btn-add-phrase-top')
    const addPhraseBottomBtn = containerElement.querySelector('#btn-add-phrase-bottom')
    const addFirstLineBtn = containerElement.querySelector('.btn-add-first-line')

    const addLineHandler = () => {
      const lastLine = lines[lines.length - 1]
      const nextStart = lastLine ? +(Number(lastLine.endTime || 0) + 0.5).toFixed(1) : 2.0
      const nextEnd = +(nextStart + 3.5).toFixed(1)

      const newLine = {
        id: `line-${activeLang.code}-${Date.now()}`,
        text: '',
        startTime: nextStart,
        endTime: nextEnd,
        syllables: []
      }
      lines.push(newLine)
      expandedLineIndices.add(lines.length - 1)
      render()
    }

    if (addPhraseTopBtn) addPhraseTopBtn.addEventListener('click', addLineHandler)
    if (addPhraseBottomBtn) addPhraseBottomBtn.addEventListener('click', addLineHandler)
    if (addFirstLineBtn) addFirstLineBtn.addEventListener('click', addLineHandler)

    // Selector de modo de referencia de traducción
    const refModeSelect = containerElement.querySelector('#select-translation-ref-mode')
    if (refModeSelect) {
      refModeSelect.addEventListener('change', (e) => {
        translationRefMode = e.target.value
        try {
          localStorage.setItem(STORAGE_KEY_REF_MODE, translationRefMode)
        } catch (_) {}
        render()
      })
    }

    const phraseCards = containerElement.querySelectorAll('.phrase-editor-card')
    phraseCards.forEach(card => {
      const lIdx = Number(card.dataset.lineIdx)
      const line = lines[lIdx]
      if (!line) return

      const textInput = card.querySelector('.input-phrase-text')
      const altInput = card.querySelector('.input-phrase-alt')
      const startInput = card.querySelector('.input-phrase-start')
      const endInput = card.querySelector('.input-phrase-end')
      const captureStartBtn = card.querySelector('.btn-capture-line-start')
      const captureEndBtn = card.querySelector('.btn-capture-line-end')
      const listenBtn = card.querySelector('.btn-listen-phrase')
      const toggleSyllablesBtn = card.querySelector('.btn-toggle-syllables')
      const moveUpBtn = card.querySelector('.btn-move-line-up')
      const moveDownBtn = card.querySelector('.btn-move-line-down')
      const deleteLineBtn = card.querySelector('.btn-delete-line')
      const copyRefBtn = card.querySelector('.btn-copy-ref-line')

      if (copyRefBtn) {
        copyRefBtn.addEventListener('click', () => {
          const refLine = mainLang?.lines?.[lIdx]
          if (refLine) {
            line.text = refLine.text || ''
            if (refLine.altText) {
              line.altText = refLine.altText
            }
            render()
            showStatus(`Texto original copiado al verso #${lIdx + 1}.`, 'info')
          }
        })
      }

      // Auto-división y distribución
      const autoSyllablesBtn = card.querySelector('.btn-auto-syllables')
      const autoWordsBtn = card.querySelector('.btn-auto-words')
      const distributeTimesBtn = card.querySelector('.btn-distribute-times')
      const addSyllableBtn = card.querySelector('.btn-add-syllable')

      if (textInput) {
        textInput.addEventListener('input', (e) => {
          line.text = e.target.value
        })
      }

      if (altInput) {
        altInput.addEventListener('input', (e) => {
          line.altText = e.target.value
        })
      }

      if (startInput) {
        startInput.addEventListener('input', (e) => {
          line.startTime = Number(e.target.value) || 0
        })
      }

      if (endInput) {
        endInput.addEventListener('input', (e) => {
          line.endTime = Number(e.target.value) || 0
        })
      }

      if (captureStartBtn) {
        captureStartBtn.addEventListener('click', () => {
          if (mediaPlayer) {
            const cur = Math.max(0, mediaPlayer.getCurrentTime())
            line.startTime = +cur.toFixed(2)
            if (line.endTime <= line.startTime) {
              line.endTime = +(line.startTime + 3.0).toFixed(2)
            }
            render()
          }
        })
      }

      if (captureEndBtn) {
        captureEndBtn.addEventListener('click', () => {
          if (mediaPlayer) {
            const cur = Math.max(0, mediaPlayer.getCurrentTime())
            line.endTime = +cur.toFixed(2)
            render()
          }
        })
      }

      if (listenBtn) {
        listenBtn.addEventListener('click', async () => {
          if (mediaPlayer) {
            mediaPlayer.seek(line.startTime)
            await mediaPlayer.play()
            if (previewTimer) clearTimeout(previewTimer)
            const durationMs = Math.max(500, (line.endTime - line.startTime) * 1000)
            previewTimer = setTimeout(() => {
              mediaPlayer.pause()
            }, durationMs)
          }
        })
      }

      if (toggleSyllablesBtn) {
        toggleSyllablesBtn.addEventListener('click', () => {
          if (expandedLineIndices.has(lIdx)) {
            expandedLineIndices.delete(lIdx)
          } else {
            expandedLineIndices.add(lIdx)
          }
          render()
        })
      }

      if (moveUpBtn && lIdx > 0) {
        moveUpBtn.addEventListener('click', () => {
          const temp = lines[lIdx]
          lines[lIdx] = lines[lIdx - 1]
          lines[lIdx - 1] = temp
          render()
        })
      }

      if (moveDownBtn && lIdx < lines.length - 1) {
        moveDownBtn.addEventListener('click', () => {
          const temp = lines[lIdx]
          lines[lIdx] = lines[lIdx + 1]
          lines[lIdx + 1] = temp
          render()
        })
      }

      if (deleteLineBtn) {
        deleteLineBtn.addEventListener('click', () => {
          lines.splice(lIdx, 1)
          expandedLineIndices.delete(lIdx)
          render()
        })
      }

      // Sílabas
      if (autoSyllablesBtn) {
        autoSyllablesBtn.addEventListener('click', () => {
          if (!line.text.trim()) {
            showStatus('Escribí el texto de la frase antes de dividir en sílabas.', 'error')
            return
          }
          const rawSyllables = splitPhraseIntoSyllables(line.text)
          line.syllables = autoDistributeSyllables(rawSyllables, line.startTime, line.endTime)
          showStatus(`Frase #${lIdx + 1} dividida en ${line.syllables.length} sílaba(s) con ponderación fonética.`, 'success')
        })
      }

      if (autoWordsBtn) {
        autoWordsBtn.addEventListener('click', () => {
          if (!line.text.trim()) {
            showStatus('Escribí el texto de la frase antes de dividir en palabras.', 'error')
            return
          }
          const rawWords = splitPhraseIntoWords(line.text)
          line.syllables = autoDistributeSyllables(rawWords, line.startTime, line.endTime)
          showStatus(`Frase #${lIdx + 1} dividida en ${line.syllables.length} palabra(s) con ponderación fonética.`, 'success')
        })
      }

      if (distributeTimesBtn) {
        distributeTimesBtn.addEventListener('click', () => {
          if (!line.syllables || line.syllables.length === 0) {
            showStatus('Añade o genera sílabas antes de distribuir tiempos.', 'error')
            return
          }
          line.syllables = autoDistributeSyllables(line.syllables, line.startTime, line.endTime)
          showStatus(`Tiempos calculados con ponderación fonética para el verso #${lIdx + 1}.`, 'success')
        })
      }

      if (addSyllableBtn) {
        addSyllableBtn.addEventListener('click', () => {
          if (!line.syllables) line.syllables = []
          const lastSyl = line.syllables[line.syllables.length - 1]
          const sylStart = lastSyl ? +(lastSyl.startTime + lastSyl.duration).toFixed(2) : line.startTime
          line.syllables.push({
            id: `syl-${Date.now()}-${line.syllables.length}`,
            text: '',
            startTime: sylStart,
            duration: 0.35
          })
          render()
        })
      }

      // Borrar todas las sílabas de este verso específico
      const clearSylBtns = card.querySelectorAll('.btn-clear-line-syllables')
      clearSylBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation()
          if (!line.syllables || line.syllables.length === 0) return
          line.syllables = []
          render()
          showStatus(`Sílabas borradas del verso #${lIdx + 1}.`, 'info')
        })
      })

      // Edición individual de sílabas
      const sylChips = card.querySelectorAll('.syllable-edit-chip')
      sylChips.forEach(chip => {
        const sIdx = Number(chip.dataset.sylIdx)
        const syl = line.syllables[sIdx]
        if (!syl) return

        const sTextInput = chip.querySelector('.input-syl-text')
        const sAltInput = chip.querySelector('.input-syl-alt')
        const sStartInput = chip.querySelector('.input-syl-start')
        const sDurInput = chip.querySelector('.input-syl-dur')
        const sCaptureBtn = chip.querySelector('.btn-capture-syl-time')
        const sRemoveBtn = chip.querySelector('.btn-remove-syl')

        if (sTextInput) {
          sTextInput.addEventListener('input', (e) => {
            syl.text = e.target.value
          })
        }
        if (sAltInput) {
          sAltInput.addEventListener('input', (e) => {
            syl.altText = e.target.value
          })
        }
        if (sStartInput) {
          sStartInput.addEventListener('input', (e) => {
            syl.startTime = Number(e.target.value) || 0
          })
        }
        if (sDurInput) {
          sDurInput.addEventListener('input', (e) => {
            syl.duration = Number(e.target.value) || 0.1
          })
        }
        if (sCaptureBtn) {
          sCaptureBtn.addEventListener('click', () => {
            if (mediaPlayer) {
              const cur = Math.max(0, mediaPlayer.getCurrentTime())
              syl.startTime = +cur.toFixed(2)
              render()
            }
          })
        }
        if (sRemoveBtn) {
          sRemoveBtn.addEventListener('click', () => {
            line.syllables.splice(sIdx, 1)
            render()
          })
        }
      })
    })

    // Borrar sílabas de todas las frases del idioma activo con confirmación previa
    const handleClearAllSyllables = () => {
      const currentTotal = lines.reduce((acc, l) => acc + (l.syllables?.length || 0), 0)
      if (currentTotal === 0) {
        showStatus('No hay sílabas configuradas en ninguna frase de este idioma.', 'info')
        return
      }

      const langName = activeLang?.name || 'este idioma'
      const confirmMsg = `¿Estás seguro de que deseas borrar todas las sílabas (${currentTotal} sílaba${currentTotal !== 1 ? 's' : ''} en ${lines.length} verso${lines.length !== 1 ? 's' : ''}) del idioma "${langName}"?\n\nEsta acción eliminará los tiempos silábicos de canto de todas las frases.`

      if (window.confirm(confirmMsg)) {
        lines.forEach(line => {
          line.syllables = []
        })
        render()
        showStatus(`Se han borrado todas las sílabas de los ${lines.length} versos en "${langName}".`, 'success')
      }
    }

    const clearAllTopBtn = containerElement.querySelector('#btn-clear-all-syllables')
    if (clearAllTopBtn) clearAllTopBtn.addEventListener('click', handleClearAllSyllables)

    const clearAllBottomBtn = containerElement.querySelector('.btn-clear-all-syllables-trigger')
    if (clearAllBottomBtn) clearAllBottomBtn.addEventListener('click', handleClearAllSyllables)

    // Auto-generar Romaji para todas las frases y sílabas del idioma activo
    const autoRomajiBtn = containerElement.querySelector('#btn-auto-generate-romaji')
    if (autoRomajiBtn) {
      autoRomajiBtn.addEventListener('click', () => {
        if (!lines || lines.length === 0) {
          showStatus('No hay frases para transliterar en este idioma.', 'info')
          return
        }

        const updatedLines = autoGenerateRomajiForLines(lines)
        if (activeLang) {
          activeLang.lines = updatedLines
          if (activeLang.code === 'und' || activeLang.code === 'en') {
            activeLang.code = 'ja'
            if (activeLang.isMain) activeLang.name = 'Japonés (Original)'
          }
        }
        render()
        showStatus('Texto alternativo y fonemas en Romaji generados con éxito para todas las frases y sílabas.', 'success')
      })
    }

    // 7. Modales
    // Modal importación rápida
    const openQuickImportBtns = containerElement.querySelectorAll('.btn-open-quick-import')
    openQuickImportBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        isQuickImportModalOpen = true
        render()
      })
    })

    const closeQuickImportBtns = containerElement.querySelectorAll('.btn-close-quick-import')
    closeQuickImportBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        isQuickImportModalOpen = false
        render()
      })
    })

    const processQuickImportBtn = containerElement.querySelector('#btn-process-quick-import')
    if (processQuickImportBtn) {
      processQuickImportBtn.addEventListener('click', () => {
        const textarea = containerElement.querySelector('#textarea-quick-lyrics')
        const startTimeInput = containerElement.querySelector('#input-import-start-time')
        const durInput = containerElement.querySelector('#input-import-duration')
        const gapInput = containerElement.querySelector('#input-import-gap')
        const checkAutoSyl = containerElement.querySelector('#check-auto-syllabify')

        const text = textarea?.value || ''
        const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean)

        if (rawLines.length === 0) {
          alert('Por favor pega el texto de la letra antes de procesar.')
          return
        }

        let curTime = Number(startTimeInput?.value) || 2.0
        const lineDuration = Number(durInput?.value) || 3.5
        const gap = Number(gapInput?.value) || 0.5
        const doAutoSyl = checkAutoSyl?.checked ?? true

        const generatedLines = rawLines.map((lineText, idx) => {
          const lStart = +curTime.toFixed(2)
          const lEnd = +(lStart + lineDuration).toFixed(2)
          curTime = lEnd + gap

          let syllables = []
          if (doAutoSyl) {
            const rawS = splitPhraseIntoSyllables(lineText)
            syllables = autoDistributeSyllables(rawS, lStart, lEnd)
          }

          return {
            id: `line-${activeLang.code}-${Date.now()}-${idx}`,
            text: lineText,
            startTime: lStart,
            endTime: lEnd,
            syllables
          }
        })

        activeLang.lines = generatedLines
        activeLang.plain = text
        expandedLineIndices = new Set([0])
        isQuickImportModalOpen = false
        showStatus(`¡Se generaron ${generatedLines.length} versos exitosamente para "${activeLang.name}"!`, 'success')
      })
    }

    // Modal nuevo idioma
    const closeAddLangBtns = containerElement.querySelectorAll('.btn-close-add-lang')
    closeAddLangBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        isAddLanguageModalOpen = false
        render()
      })
    })

    const confirmAddLangBtn = containerElement.querySelector('#btn-confirm-add-lang')
    if (confirmAddLangBtn) {
      confirmAddLangBtn.addEventListener('click', () => {
        const nameInput = containerElement.querySelector('#input-new-lang-name')
        const codeInput = containerElement.querySelector('#input-new-lang-code')
        const copyCheck = containerElement.querySelector('#check-copy-timings')

        const name = (nameInput?.value || '').trim()
        const code = (codeInput?.value || '').trim().toLowerCase()
        const shouldCopy = copyCheck?.checked ?? true

        if (!name || !code) {
          alert('Ingresa el nombre y el código del nuevo idioma.')
          return
        }

        // Verificar si ya existe el código
        const exists = currentSong.lyrics_data.languages.some(l => l.code === code)
        if (exists) {
          alert(`Ya existe un idioma con el código "${code}". Utilizá otro.`)
          return
        }

        let newLines = []
        if (shouldCopy) {
          const mainLang = currentSong.lyrics_data.languages.find(l => l.isMain) || currentSong.lyrics_data.languages[0]
          if (mainLang && Array.isArray(mainLang.lines)) {
            newLines = mainLang.lines.map((l, i) => ({
              id: `line-${code}-${Date.now()}-${i}`,
              text: '', // Letra a traducir
              startTime: l.startTime,
              endTime: l.endTime,
              syllables: []
            }))
          }
        }

        const newLang = {
          code,
          name,
          isMain: false,
          plain: '',
          lines: newLines
        }

        currentSong.lyrics_data.languages.push(newLang)
        activeLangIndex = currentSong.lyrics_data.languages.length - 1
        isAddLanguageModalOpen = false
        showStatus(`Nuevo idioma "${name}" [${code}] añadido con éxito.`, 'success')
      })
    }

    // Modal editar idioma
    const closeEditLangBtns = containerElement.querySelectorAll('.btn-close-edit-lang')
    closeEditLangBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        isEditLanguageModalOpen = false
        render()
      })
    })

    const confirmEditLangBtn = containerElement.querySelector('#btn-confirm-edit-lang')
    if (confirmEditLangBtn) {
      confirmEditLangBtn.addEventListener('click', () => {
        const nameInput = containerElement.querySelector('#input-edit-lang-name')
        const codeInput = containerElement.querySelector('#input-edit-lang-code')

        const newName = (nameInput?.value || '').trim()
        const newCode = (codeInput?.value || '').trim().toLowerCase()

        if (!newName || !newCode) {
          alert('Por favor ingresa un nombre y un código ISO válidos.')
          return
        }

        // Verificar que el código no lo tenga otro idioma existente en la canción
        const conflict = currentSong.lyrics_data.languages.some((l, idx) => idx !== activeLangIndex && l.code === newCode)
        if (conflict) {
          alert(`Ya existe otro idioma con el código "${newCode}". Elegí un código diferente.`)
          return
        }

        const activeLang = getActiveLanguage()
        if (activeLang) {
          activeLang.name = newName
          activeLang.code = newCode
          isEditLanguageModalOpen = false
          showStatus(`Idioma actualizado correctamente: "${newName}" [${newCode}].`, 'success')
        }
      })
    }

    // Exportar JSON desde el editor
    const editorExportJsonBtn = containerElement.querySelector('#btn-editor-export-json')
    if (editorExportJsonBtn) {
      editorExportJsonBtn.addEventListener('click', async () => {
        try {
          const songId = await handleSaveSong(false)
          if (!songId) return
          await exportSongPackage(songId)
          showStatus('Paquete de canción JSON descargado con éxito.', 'success')
        } catch (err) {
          showStatus('Error al exportar JSON: ' + err.message, 'error')
        }
      })
    }

    // Exportar YAML desde el editor
    const editorExportYamlBtn = containerElement.querySelector('#btn-editor-export-yaml')
    if (editorExportYamlBtn) {
      editorExportYamlBtn.addEventListener('click', async () => {
        try {
          const songId = await handleSaveSong(false)
          if (!songId) return
          const activeLang = getActiveLanguage()
          await exportLanguageToLyricsfile(songId, activeLang?.code || null)
          showStatus('Archivo .lyricsfile.yaml descargado con éxito.', 'success')
        } catch (err) {
          showStatus('Error al exportar YAML: ' + err.message, 'error')
        }
      })
    }

    // 8. Guardar Canción
    const saveSongBtn = containerElement.querySelector('#btn-save-song')
    if (saveSongBtn) {
      saveSongBtn.addEventListener('click', async () => {
        await handleSaveSong(false)
      })
    }

    const saveAndSingBtn = containerElement.querySelector('#btn-save-and-sing')
    if (saveAndSingBtn) {
      saveAndSingBtn.addEventListener('click', async () => {
        await handleSaveSong(true)
      })
    }
  }

  async function handleSaveSong(enterLyricsAfter = false) {
    const titleDom = containerElement.querySelector('#input-song-title')?.value
    const artistDom = containerElement.querySelector('#input-song-artist')?.value
    if (titleDom !== undefined) currentSong.title = titleDom
    if (artistDom !== undefined) currentSong.artist = artistDom

    if (!currentSong.title || !currentSong.title.trim()) {
      showStatus('La canción debe tener un título obligatorio.', 'error')
      const details = containerElement.querySelector('#editor-metadata-details')
      if (details) details.open = true
      const titleInput = containerElement.querySelector('#input-song-title')
      if (titleInput) titleInput.focus()
      return null
    }

    try {
      // Normalizar datos antes de guardar
      const songDataToSave = {
        ...currentSong,
        title: currentSong.title.trim(),
        artist: (currentSong.artist || 'Artista Desconocido').trim(),
        genres: Array.isArray(currentSong.genres) ? currentSong.genres : [],
        tags: Array.isArray(currentSong.tags) ? currentSong.tags : [],
        videos: (currentSong.videos || []).map((v, i) => ({
          id: v.id || `vid-${Date.now()}-${i}`,
          name: (v.name || `Video ${i + 1}`).trim(),
          url: (v.url || '').trim(),
          offset: Number(v.offset) || 0
        })),
        lyrics_data: {
          ...currentSong.lyrics_data,
          videos: currentSong.videos,
          languages: currentSong.lyrics_data.languages.map(l => ({
            ...l,
            lines: (l.lines || []).map((line, lIdx) => ({
              id: line.id || `line-${l.code}-${lIdx}`,
              text: line.text || '',
              altText: String(line.altText || line.romaji || '').trim(),
              startTime: Number(line.startTime) || 0,
              endTime: Number(line.endTime) || (Number(line.startTime || 0) + 3),
              syllables: (line.syllables || []).map((syl, sIdx) => ({
                id: syl.id || `syl-${lIdx}-${sIdx}`,
                text: syl.text || '',
                altText: String(syl.altText || syl.romaji || ''),
                startTime: Number(syl.startTime) || 0,
                duration: Number(syl.duration) || 0.3
              }))
            }))
          }))
        }
      }

      const savedId = await saveSong(songDataToSave)
      currentSong.id = savedId
      currentSong.artist = songDataToSave.artist

      const subheadingEl = containerElement.querySelector('.editor-subheading')
      if (subheadingEl) {
        subheadingEl.textContent = `Artista: ${escapeHtml(currentSong.artist)} | ID: ${currentSong.id}`
      }

      showStatus(`¡Canción "${currentSong.title}" guardada exitosamente!`, 'success')

      if (onSongSaved) {
        await onSongSaved(savedId)
      }

      if (enterLyricsAfter && onEnterLyricsMode) {
        onEnterLyricsMode(savedId)
      }

      return savedId
    } catch (err) {
      console.error('Error al guardar la canción:', err)
      showStatus('Error al guardar la canción: ' + err.message, 'error')
      return null
    }
  }

  // Actualización del reloj del asistente en tiempo real si el reproductor está activo
  function updateClock(time) {
    const clockEl = containerElement?.querySelector('#assistant-clock-time')
    if (clockEl) {
      clockEl.textContent = formatTime(Math.max(0, time), true)
    }
  }

  function setPlayingState(playing) {
    const assistantPlayBtn = containerElement?.querySelector('#btn-assistant-play')
    if (assistantPlayBtn) {
      assistantPlayBtn.innerHTML = playing ? `${iconPause} Pausa` : `${iconPlay} Reproducir`
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
    updateClock,
    setPlayingState
  }
}
