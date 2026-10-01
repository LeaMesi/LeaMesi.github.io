// src/views/themeSettingsModal.js
// Modal interactivo para la configuración completa de temas de interfaz (4 colores),
// tamaño de letra en modo canción (sliders 50%-200%) y estilos tipográficos y de color de letras.

import {
  getThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  applyTheme,
  exportThemePackage,
  importThemePackage,
  THEME_PRESETS,
  DEFAULT_THEME,
  hexToRgba
} from '../services/themeService.js'
import {
  iconPalette,
  iconClose,
  iconRotateCcw,
  iconCheck,
  iconDownload,
  iconUpload
} from './icons.js'

export function createThemeSettingsModal({ containerElement, onThemeChanged }) {
  let isOpen = false
  let currentSettings = getThemeSettings()
  let statusMessage = ''
  let statusType = 'info' // 'info' | 'success' | 'error'

  function open() {
    isOpen = true
    statusMessage = ''
    currentSettings = getThemeSettings()
    render()
    if (containerElement) {
      containerElement.classList.add('is-open')
    }
  }

  function close() {
    isOpen = false
    statusMessage = ''
    if (containerElement) {
      containerElement.classList.remove('is-open')
    }
  }

  function updateSetting(key, value) {
    currentSettings[key] = value
    saveThemeSettings(currentSettings)
    updatePreview()
    if (onThemeChanged) {
      onThemeChanged(currentSettings)
    }
  }

  function applyPreset(presetId) {
    const preset = THEME_PRESETS.find(p => p.id === presetId)
    if (!preset) return
    currentSettings = { ...DEFAULT_THEME, ...preset.settings }
    saveThemeSettings(currentSettings)
    render()
    if (onThemeChanged) {
      onThemeChanged(currentSettings)
    }
  }

  function handleReset() {
    if (window.confirm('¿Deseas restablecer todos los colores, tamaños y estilos a sus valores predeterminados?')) {
      currentSettings = resetThemeSettings()
      render()
      if (onThemeChanged) {
        onThemeChanged(currentSettings)
      }
    }
  }

  function getActivePresetId() {
    for (const preset of THEME_PRESETS) {
      const s = preset.settings
      const isMatch =
        s.bgColor.toLowerCase() === currentSettings.bgColor.toLowerCase() &&
        s.panelBg.toLowerCase() === currentSettings.panelBg.toLowerCase() &&
        s.primaryColor.toLowerCase() === currentSettings.primaryColor.toLowerCase() &&
        s.textMain.toLowerCase() === currentSettings.textMain.toLowerCase() &&
        s.originalColor.toLowerCase() === currentSettings.originalColor.toLowerCase() &&
        s.translationColor.toLowerCase() === currentSettings.translationColor.toLowerCase() &&
        s.activeColor.toLowerCase() === currentSettings.activeColor.toLowerCase() &&
        (!s.completedColor || !currentSettings.completedColor || s.completedColor.toLowerCase() === currentSettings.completedColor.toLowerCase())
      if (isMatch) return preset.id
    }
    return 'custom'
  }

  function updatePreview() {
    if (!containerElement) return
    const previewContainer = containerElement.querySelector('#theme-live-preview-box')
    if (!previewContainer) return

    const {
      lyricsScale,
      translationScale,
      originalColor,
      translationColor,
      activeColor,
      completedColor = '#f59e0b',
      originalBold,
      originalItalic,
      translationBold,
      translationItalic,
      activeBold,
      activeItalic,
      activeGlow,
      completedBold,
      completedItalic
    } = currentSettings

    const lScale = (Math.max(50, Math.min(200, Number(lyricsScale) || 100)) / 100)
    const tScale = (Math.max(50, Math.min(200, Number(translationScale) || 100)) / 100)

    const glowStyle = activeGlow
      ? `text-shadow: 0 0 16px ${hexToRgba(activeColor, 0.8)}, 0 0 32px ${hexToRgba(activeColor, 0.45)};`
      : 'text-shadow: none;'

    const mainActiveStyle = `
      font-size: calc(1.5rem * ${lScale});
      font-weight: ${originalBold ? '700' : '400'};
      font-style: ${originalItalic ? 'italic' : 'normal'};
      color: ${originalColor};
    `

    const sylCompletedStyle = `
      color: ${completedColor};
      font-weight: ${completedBold !== false ? '700' : '400'};
      font-style: ${completedItalic ? 'italic' : 'normal'};
    `

    const sylActiveStyle = `
      color: ${activeColor};
      font-weight: ${activeBold ? '700' : '400'};
      font-style: ${activeItalic ? 'italic' : 'normal'};
      ${glowStyle}
    `

    const transActiveStyle = `
      font-size: calc(0.9rem * ${tScale});
      font-weight: ${translationBold ? '700' : '400'};
      font-style: ${translationItalic ? 'italic' : 'normal'};
      color: ${translationColor};
    `

    const upcomingMainStyle = `
      font-size: calc(1.5rem * 0.70 * ${lScale});
      font-weight: ${originalBold ? '500' : '400'};
      font-style: ${originalItalic ? 'italic' : 'normal'};
      color: ${originalColor};
      opacity: 0.7;
    `

    const upcomingTransStyle = `
      font-size: calc(0.9rem * 0.76 * ${tScale});
      font-weight: ${translationBold ? '700' : '400'};
      font-style: ${translationItalic ? 'italic' : 'normal'};
      color: ${translationColor};
      opacity: 0.6;
    `

    previewContainer.innerHTML = `
      <div class="preview-phrase-active">
        <div class="preview-line-main" style="${mainActiveStyle}">
          <span class="preview-syl-completed" style="${sylCompletedStyle}">Cami</span><span class="preview-syl-highlight" style="${sylActiveStyle}">nan</span><span>do por la ciudad</span>
        </div>
        <div class="preview-line-trans" style="${transActiveStyle}">
          Walking through the city
        </div>
      </div>
      <div class="preview-phrase-upcoming">
        <div class="preview-line-main" style="${upcomingMainStyle}">
          Bajo la luz del sol
        </div>
        <div class="preview-line-trans" style="${upcomingTransStyle}">
          Under the sunlight
        </div>
      </div>
    `
  }

  function render() {
    if (!containerElement) return

    const activePreset = getActivePresetId()

    const presetsHtml = THEME_PRESETS.map(preset => {
      const isSelected = activePreset === preset.id
      return `
        <button
          type="button"
          class="btn-theme-preset ${isSelected ? 'is-selected' : ''}"
          data-preset-id="${preset.id}"
          title="Aplicar tema ${preset.name}"
        >
          <span class="preset-dot" style="background: ${preset.settings.primaryColor}"></span>
          <span class="preset-name">${preset.name}</span>
        </button>
      `
    }).join('')

    containerElement.innerHTML = `
      <div class="modal-backdrop" id="theme-modal-backdrop"></div>
      <div class="modal-dialog theme-settings-modal-dialog">
        <div class="modal-header">
          <div>
            <h2 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
              ${iconPalette} Configuración de Temas y Visualización
            </h2>
            <p class="subtitle">Personaliza los colores de la interfaz, el tamaño de las letras y los efectos de canto.</p>
          </div>
          <button class="btn-close-modal" id="btn-close-theme-modal" title="Cerrar configuración">${iconClose}</button>
        </div>

        ${statusMessage ? `
          <div class="status-alert status-${statusType}" style="margin: 14px 22px 0;">
            ${escapeHtml(statusMessage)}
          </div>
        ` : ''}

        <div class="modal-body theme-modal-body">
          <!-- 0. Presets Rápidos y Compartir -->
          <div class="theme-section theme-presets-section">
            <div class="theme-presets-header">
              <label class="theme-section-title">Temas Predefinidos:</label>
              <div class="theme-share-actions">
                <button type="button" class="btn btn-outline btn-xs" id="btn-theme-export" title="Exportar configuración de tema a archivo JSON">
                  ${iconDownload} Exportar
                </button>
                <label class="btn btn-outline btn-xs file-input-label" title="Importar configuración de tema desde archivo JSON">
                  ${iconUpload} Importar
                  <input type="file" id="input-theme-file" class="hidden-input" accept=".json,application/json" />
                </label>
              </div>
            </div>
            <div class="theme-presets-bar">
              ${presetsHtml}
              ${activePreset === 'custom' ? `
                <span class="badge-custom-theme">Personalizado</span>
              ` : ''}
            </div>
          </div>

          <!-- 1. Vista Previa en Vivo -->
          <div class="theme-section theme-preview-section">
            <div class="preview-header">
              <span class="theme-section-title">Vista Previa de Letras en Vivo:</span>
              <span class="preview-hint">Se actualiza en tiempo real mientras configuras</span>
            </div>
            <div class="theme-live-preview-box" id="theme-live-preview-box"></div>
          </div>

          <!-- 2. Los 4 Colores de la Interfaz -->
          <div class="theme-section">
            <div class="theme-section-header">
              <h3 class="theme-section-title">1. Colores de la Interfaz (4 Colores Base)</h3>
              <p class="theme-section-desc">Estos 4 colores se aplican en toda la plataforma: fondo, barras, paneles, botones y textos.</p>
            </div>

            <div class="theme-colors-grid">
              <!-- Color 1: Fondo -->
              <div class="color-picker-card">
                <div class="color-card-info">
                  <span class="color-card-name">Color de Fondo</span>
                  <span class="color-card-hint">Fondo general y visor</span>
                </div>
                <div class="color-picker-input-group">
                  <input type="color" class="color-swatch-input" id="picker-bg-color" value="${currentSettings.bgColor}" />
                  <input type="text" class="color-hex-input" id="hex-bg-color" value="${currentSettings.bgColor}" maxlength="7" />
                </div>
              </div>

              <!-- Color 2: Paneles y Barras -->
              <div class="color-picker-card">
                <div class="color-card-info">
                  <span class="color-card-name">Barras y Paneles</span>
                  <span class="color-card-hint">Encabezado, dock y tarjetas</span>
                </div>
                <div class="color-picker-input-group">
                  <input type="color" class="color-swatch-input" id="picker-panel-bg" value="${currentSettings.panelBg}" />
                  <input type="text" class="color-hex-input" id="hex-panel-bg" value="${currentSettings.panelBg}" maxlength="7" />
                </div>
              </div>

              <!-- Color 3: Botones y Acentos -->
              <div class="color-picker-card">
                <div class="color-card-info">
                  <span class="color-card-name">Botones y Acentos</span>
                  <span class="color-card-hint">Botones principales y foco</span>
                </div>
                <div class="color-picker-input-group">
                  <input type="color" class="color-swatch-input" id="picker-primary-color" value="${currentSettings.primaryColor}" />
                  <input type="text" class="color-hex-input" id="hex-primary-color" value="${currentSettings.primaryColor}" maxlength="7" />
                </div>
              </div>

              <!-- Color 4: Texto de Interfaz -->
              <div class="color-picker-card">
                <div class="color-card-info">
                  <span class="color-card-name">Texto de Interfaz</span>
                  <span class="color-card-hint">Títulos, etiquetas y menús</span>
                </div>
                <div class="color-picker-input-group">
                  <input type="color" class="color-swatch-input" id="picker-text-main" value="${currentSettings.textMain}" />
                  <input type="text" class="color-hex-input" id="hex-text-main" value="${currentSettings.textMain}" maxlength="7" />
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Sliders de Tamaño de Letra (Modo Canción) -->
          <div class="theme-section">
            <div class="theme-section-header">
              <h3 class="theme-section-title">2. Tamaño de Letras en Modo Canción (50% a 200%)</h3>
              <p class="theme-section-desc">Ajusta independientemente el tamaño de la letra original y de las traducciones.</p>
            </div>

            <div class="sliders-grid">
              <!-- Slider Letra Original -->
              <div class="slider-control-card">
                <div class="slider-header-row">
                  <label for="slider-lyrics-scale" class="slider-label">Letra de la Canción (Original):</label>
                  <span class="slider-value-badge" id="badge-lyrics-scale">${currentSettings.lyricsScale}%</span>
                </div>
                <div class="slider-input-wrapper">
                  <span class="slider-bound-label">50%</span>
                  <input
                    type="range"
                    id="slider-lyrics-scale"
                    class="theme-range-slider"
                    min="50"
                    max="200"
                    step="5"
                    value="${currentSettings.lyricsScale}"
                  />
                  <span class="slider-bound-label">200%</span>
                </div>
              </div>

              <!-- Slider Traducciones -->
              <div class="slider-control-card">
                <div class="slider-header-row">
                  <label for="slider-translation-scale" class="slider-label">Letra de Traducciones:</label>
                  <span class="slider-value-badge" id="badge-translation-scale">${currentSettings.translationScale}%</span>
                </div>
                <div class="slider-input-wrapper">
                  <span class="slider-bound-label">50%</span>
                  <input
                    type="range"
                    id="slider-translation-scale"
                    class="theme-range-slider"
                    min="50"
                    max="200"
                    step="5"
                    value="${currentSettings.translationScale}"
                  />
                  <span class="slider-bound-label">200%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Colores y Estilos Tipográficos de Letras -->
          <div class="theme-section">
            <div class="theme-section-header">
              <h3 class="theme-section-title">3. Colores y Efectos de la Letra y Canto</h3>
              <p class="theme-section-desc">Personaliza colores de texto, resaltado de sílabas y atributos tipográficos (negrita, cursiva y brillo).</p>
            </div>

            <div class="lyrics-style-cards-grid">
              <!-- Fila 1: Letra Original -->
              <div class="lyric-style-card">
                <div class="lyric-style-title-col">
                  <strong>Letra Original</strong>
                  <span class="lyric-style-desc">Texto cantado en la frase</span>
                </div>
                <div class="lyric-style-color-col">
                  <input type="color" class="color-swatch-input" id="picker-orig-color" value="${currentSettings.originalColor}" />
                  <input type="text" class="color-hex-input" id="hex-orig-color" value="${currentSettings.originalColor}" maxlength="7" />
                </div>
                <div class="lyric-style-toggles-col">
                  <label class="theme-toggle-chip">
                    <input type="checkbox" id="check-orig-bold" ${currentSettings.originalBold ? 'checked' : ''} />
                    <span>Negrita</span>
                  </label>
                  <label class="theme-toggle-chip">
                    <input type="checkbox" id="check-orig-italic" ${currentSettings.originalItalic ? 'checked' : ''} />
                    <span>Cursiva</span>
                  </label>
                </div>
              </div>

              <!-- Fila 2: Letra de Traducción -->
              <div class="lyric-style-card">
                <div class="lyric-style-title-col">
                  <strong>Traducción</strong>
                  <span class="lyric-style-desc">Subtítulo secundario sincronizado</span>
                </div>
                <div class="lyric-style-color-col">
                  <input type="color" class="color-swatch-input" id="picker-trans-color" value="${currentSettings.translationColor}" />
                  <input type="text" class="color-hex-input" id="hex-trans-color" value="${currentSettings.translationColor}" maxlength="7" />
                </div>
                <div class="lyric-style-toggles-col">
                  <label class="theme-toggle-chip">
                    <input type="checkbox" id="check-trans-bold" ${currentSettings.translationBold ? 'checked' : ''} />
                    <span>Negrita</span>
                  </label>
                  <label class="theme-toggle-chip">
                    <input type="checkbox" id="check-trans-italic" ${currentSettings.translationItalic ? 'checked' : ''} />
                    <span>Cursiva</span>
                  </label>
                </div>
              </div>

              <!-- Fila 3: Sílaba Activa (Resaltada) -->
              <div class="lyric-style-card is-highlight-card">
                <div class="lyric-style-title-col">
                  <strong>Sílaba Activa (Resaltada)</strong>
                  <span class="lyric-style-desc">Color y resplandor al cantar</span>
                </div>
                <div class="lyric-style-color-col">
                  <input type="color" class="color-swatch-input" id="picker-active-color" value="${currentSettings.activeColor}" />
                  <input type="text" class="color-hex-input" id="hex-active-color" value="${currentSettings.activeColor}" maxlength="7" />
                </div>
                <div class="lyric-style-toggles-col">
                  <label class="theme-toggle-chip">
                    <input type="checkbox" id="check-active-bold" ${currentSettings.activeBold ? 'checked' : ''} />
                    <span>Negrita</span>
                  </label>
                  <label class="theme-toggle-chip">
                    <input type="checkbox" id="check-active-italic" ${currentSettings.activeItalic ? 'checked' : ''} />
                    <span>Cursiva</span>
                  </label>
                  <label class="theme-toggle-chip chip-glow">
                    <input type="checkbox" id="check-active-glow" ${currentSettings.activeGlow ? 'checked' : ''} />
                    <span>Efecto de Brillo</span>
                  </label>
                </div>
              </div>

              <!-- Fila 4: Sílabas Anteriores (Cantadas) -->
              <div class="lyric-style-card">
                <div class="lyric-style-title-col">
                  <strong>Sílabas Anteriores</strong>
                  <span class="lyric-style-desc">Color de las sílabas ya cantadas</span>
                </div>
                <div class="lyric-style-color-col">
                  <input type="color" class="color-swatch-input" id="picker-completed-color" value="${currentSettings.completedColor || '#f59e0b'}" />
                  <input type="text" class="color-hex-input" id="hex-completed-color" value="${currentSettings.completedColor || '#f59e0b'}" maxlength="7" />
                </div>
                <div class="lyric-style-toggles-col">
                  <label class="theme-toggle-chip">
                    <input type="checkbox" id="check-completed-bold" ${currentSettings.completedBold !== false ? 'checked' : ''} />
                    <span>Negrita</span>
                  </label>
                  <label class="theme-toggle-chip">
                    <input type="checkbox" id="check-completed-italic" ${currentSettings.completedItalic ? 'checked' : ''} />
                    <span>Cursiva</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer theme-modal-footer">
          <div class="theme-footer-left">
            <button type="button" class="btn btn-outline btn-sm" id="btn-theme-export-footer" title="Exportar configuración de tema a archivo JSON">
              ${iconDownload} Exportar Tema
            </button>
            <label class="btn btn-outline btn-sm file-input-label" title="Importar configuración de tema desde archivo JSON">
              ${iconUpload} Importar Tema
              <input type="file" id="input-theme-file-footer" class="hidden-input" accept=".json,application/json" />
            </label>
            <button type="button" class="btn btn-outline btn-sm" id="btn-theme-reset" title="Restablecer todos los valores por defecto">
              ${iconRotateCcw} Restablecer
            </button>
          </div>
          <button type="button" class="btn btn-primary" id="btn-theme-save-close">
            ${iconCheck} Listo
          </button>
        </div>
      </div>
    `

    bindEvents()
    updatePreview()
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

  function bindEvents() {
    if (!containerElement) return

    // Cerrar modal
    const closeBtn = containerElement.querySelector('#btn-close-theme-modal')
    if (closeBtn) closeBtn.addEventListener('click', close)

    const backdrop = containerElement.querySelector('#theme-modal-backdrop')
    if (backdrop) backdrop.addEventListener('click', close)

    const saveCloseBtn = containerElement.querySelector('#btn-theme-save-close')
    if (saveCloseBtn) saveCloseBtn.addEventListener('click', close)

    const resetBtn = containerElement.querySelector('#btn-theme-reset')
    if (resetBtn) resetBtn.addEventListener('click', handleReset)

    // Exportar configuración
    function handleExport() {
      try {
        exportThemePackage()
        statusMessage = 'Tema exportado exitosamente como saranga-theme-settings.json'
        statusType = 'success'
        render()
      } catch (err) {
        statusMessage = 'Error al exportar tema: ' + err.message
        statusType = 'error'
        render()
      }
    }

    const exportBtnTop = containerElement.querySelector('#btn-theme-export')
    if (exportBtnTop) exportBtnTop.addEventListener('click', handleExport)

    const exportBtnFooter = containerElement.querySelector('#btn-theme-export-footer')
    if (exportBtnFooter) exportBtnFooter.addEventListener('click', handleExport)

    // Importar configuración
    async function handleImport(file) {
      if (!file) return
      try {
        const imported = await importThemePackage(file)
        currentSettings = imported
        statusMessage = '¡Tema importado y aplicado correctamente!'
        statusType = 'success'
        render()
        if (onThemeChanged) {
          onThemeChanged(currentSettings)
        }
      } catch (err) {
        statusMessage = 'Error al importar tema: ' + err.message
        statusType = 'error'
        render()
      }
    }

    const fileInputTop = containerElement.querySelector('#input-theme-file')
    if (fileInputTop) {
      fileInputTop.addEventListener('change', (e) => {
        handleImport(e.target.files?.[0])
      })
    }

    const fileInputFooter = containerElement.querySelector('#input-theme-file-footer')
    if (fileInputFooter) {
      fileInputFooter.addEventListener('change', (e) => {
        handleImport(e.target.files?.[0])
      })
    }

    // Presets
    const presetBtns = containerElement.querySelectorAll('.btn-theme-preset')
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        applyPreset(btn.dataset.presetId)
      })
    })

    // Helper para vincular par (picker + hex text)
    function bindColorPair(pickerId, hexId, stateKey) {
      const pickerEl = containerElement.querySelector(pickerId)
      const hexEl = containerElement.querySelector(hexId)

      if (pickerEl && hexEl) {
        pickerEl.addEventListener('input', (e) => {
          const val = e.target.value
          hexEl.value = val
          updateSetting(stateKey, val)
        })

        hexEl.addEventListener('input', (e) => {
          let val = e.target.value.trim()
          if (!val.startsWith('#')) val = '#' + val
          if (/^#[0-9a-fA-F]{6}$/.test(val)) {
            pickerEl.value = val
            updateSetting(stateKey, val)
          }
        })
      }
    }

    // 4 Colores de Interfaz
    bindColorPair('#picker-bg-color', '#hex-bg-color', 'bgColor')
    bindColorPair('#picker-panel-bg', '#hex-panel-bg', 'panelBg')
    bindColorPair('#picker-primary-color', '#hex-primary-color', 'primaryColor')
    bindColorPair('#picker-text-main', '#hex-text-main', 'textMain')

    // Sliders de Tamaño
    const lyricsSlider = containerElement.querySelector('#slider-lyrics-scale')
    const lyricsBadge = containerElement.querySelector('#badge-lyrics-scale')
    if (lyricsSlider && lyricsBadge) {
      lyricsSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value)
        lyricsBadge.textContent = `${val}%`
        updateSetting('lyricsScale', val)
      })
    }

    const transSlider = containerElement.querySelector('#slider-translation-scale')
    const transBadge = containerElement.querySelector('#badge-translation-scale')
    if (transSlider && transBadge) {
      transSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value)
        transBadge.textContent = `${val}%`
        updateSetting('translationScale', val)
      })
    }

    // Colores de Letras
    bindColorPair('#picker-orig-color', '#hex-orig-color', 'originalColor')
    bindColorPair('#picker-trans-color', '#hex-trans-color', 'translationColor')
    bindColorPair('#picker-active-color', '#hex-active-color', 'activeColor')
    bindColorPair('#picker-completed-color', '#hex-completed-color', 'completedColor')

    // Toggles de Tipografía
    function bindCheckbox(id, stateKey) {
      const cb = containerElement.querySelector(id)
      if (cb) {
        cb.addEventListener('change', (e) => {
          updateSetting(stateKey, Boolean(e.target.checked))
        })
      }
    }

    bindCheckbox('#check-orig-bold', 'originalBold')
    bindCheckbox('#check-orig-italic', 'originalItalic')
    bindCheckbox('#check-trans-bold', 'translationBold')
    bindCheckbox('#check-trans-italic', 'translationItalic')
    bindCheckbox('#check-active-bold', 'activeBold')
    bindCheckbox('#check-active-italic', 'activeItalic')
    bindCheckbox('#check-active-glow', 'activeGlow')
    bindCheckbox('#check-completed-bold', 'completedBold')
    bindCheckbox('#check-completed-italic', 'completedItalic')
  }

  // Aplicar tema inicial inmediatamente
  applyTheme(currentSettings)

  return {
    open,
    close,
    getSettings: () => ({ ...currentSettings })
  }
}
