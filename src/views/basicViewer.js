import { findActiveLineIndex, evaluateSyllablesState, findMatchingTranslationLine } from '../lyrics/sync.js'
import { applyTheme } from '../services/themeService.js'

export function createBasicViewer(containerElement, options = {}) {
  const { onSeekLine, initialPreviewCount = 2 } = options

  let currentLines = []
  let translationLines = []
  let isTranslationActive = false
  let previewCount = Math.max(1, Math.min(3, Number(initialPreviewCount) || 2))
  let activeLineIndex = -1
  let renderedActiveIndex = -999

  function applyStyles(styles = {}) {
    if (!containerElement) return
    applyTheme()
    const root = document.documentElement
    if (styles.fontFamily) root.style.setProperty('--lyrics-font-family', styles.fontFamily)
  }

  function setPreviewCount(count) {
    const num = Math.max(1, Math.min(3, Number(count) || 2))
    if (previewCount !== num) {
      previewCount = num
      renderedActiveIndex = -999
      if (currentLines.length > 0) {
        renderStage(activeLineIndex >= 0 ? activeLineIndex : 0)
      }
    }
  }

  function setLyrics({ lines = [], translations = [], isTranslationActive: activeTrans = false, styles = {} }) {
    currentLines = Array.isArray(lines) ? lines : []
    translationLines = Array.isArray(translations) ? translations : []
    isTranslationActive = Boolean(activeTrans) && translationLines.length > 0
    applyStyles(styles)
    activeLineIndex = -1
    renderedActiveIndex = -999

    if (currentLines.length > 0) {
      renderStage(0)
    } else {
      renderEmpty()
    }
  }

  function renderEmpty() {
    if (!containerElement) return
    containerElement.innerHTML = `
      <div class="empty-lyrics-notice">
        <p>No hay letras cargadas para esta pista.</p>
      </div>
    `
  }

  function renderLineMainContent(line, isCurrent) {
    if (!line) return ''
    if (isCurrent) {
      if (Array.isArray(line.syllables) && line.syllables.length > 0) {
        // Concatenación exacta sin saltos de línea ni espacios adicionales en el template literal
        return line.syllables
          .map((syl, sIdx) => `<span class="syllable" data-syl="${sIdx}">${escapeHtml(syl.text)}</span>`)
          .join('')
      }
      return `<span class="plain-active-line">${escapeHtml(line.text || '')}</span>`
    }
    return escapeHtml(line.text || (Array.isArray(line.syllables) ? line.syllables.map(s => s.text).join('') : ''))
  }

  function renderTranslationLine(mainLine, mainIndex, isCurrent) {
    if (!isTranslationActive || translationLines.length === 0) return ''
    const transLine = findMatchingTranslationLine(translationLines, mainLine, mainIndex)
    if (!transLine || !transLine.text) return ''
    const extraClass = isCurrent ? 'current-translation' : 'upcoming-translation'
    return `<div class="translation-line ${extraClass}">${escapeHtml(transLine.text)}</div>`
  }

  function renderStage(activeIdx) {
    if (!containerElement) return
    if (currentLines.length === 0) {
      renderEmpty()
      return
    }

    const safeIdx = Math.max(0, Math.min(currentLines.length - 1, activeIdx))
    const activeLine = currentLines[safeIdx]
    const upcomingLines = currentLines.slice(safeIdx + 1, safeIdx + 1 + previewCount)

    const activeMainHtml = renderLineMainContent(activeLine, true)
    const activeTransHtml = renderTranslationLine(activeLine, safeIdx, true)

    const upcomingItemsHtml = upcomingLines.map((uLine, offset) => {
      const uIdx = safeIdx + 1 + offset
      const uMainHtml = renderLineMainContent(uLine, false)
      const uTransHtml = renderTranslationLine(uLine, uIdx, false)
      return `
        <div class="upcoming-phrase-item upcoming-rank-${offset + 1}" data-index="${uIdx}" title="Saltar a esta frase (${uLine.startTime}s)">
          <div class="lyric-line-main">${uMainHtml}</div>
          ${uTransHtml}
        </div>
      `
    }).join('')

    containerElement.innerHTML = `
      <div class="lyrics-stage-display">
        <!-- Frase Actual en el centro -->
        <div class="active-phrase-container animate-phrase-change" id="active-phrase-box" data-index="${safeIdx}">
          <div class="lyric-line-wrapper is-active">
            <div class="lyric-line-main" id="active-line-main">${activeMainHtml}</div>
            ${activeTransHtml}
          </div>
        </div>

        <!-- Frases Siguientes (Debajo) -->
        <div class="upcoming-phrases-container" id="upcoming-phrases-box">
          ${upcomingItemsHtml}
        </div>
      </div>
    `

    renderedActiveIndex = safeIdx

    // Permitir clic en frases siguientes para saltar directamente en la reproducción
    if (onSeekLine) {
      const upcomingEls = containerElement.querySelectorAll('.upcoming-phrase-item')
      upcomingEls.forEach(el => {
        el.addEventListener('click', () => {
          const idx = Number(el.dataset.index)
          if (!isNaN(idx) && currentLines[idx]) {
            onSeekLine(currentLines[idx].startTime)
          }
        })
      })
    }
  }

  function updateTime(currentTime) {
    if (currentLines.length === 0 || !containerElement) return

    const newIndex = findActiveLineIndex(currentLines, currentTime)
    if (newIndex < 0) return

    activeLineIndex = newIndex

    // Si cambió la frase activa, re-renderizamos el escenario centrado
    if (newIndex !== renderedActiveIndex) {
      renderStage(newIndex)
    }

    // Actualizar resaltado de sílabas en tiempo real
    const activeLine = currentLines[renderedActiveIndex]
    if (activeLine && Array.isArray(activeLine.syllables) && activeLine.syllables.length > 0) {
      const states = evaluateSyllablesState(activeLine.syllables, currentTime)
      const sylSpans = containerElement.querySelectorAll('#active-line-main .syllable')

      states.forEach((sState, sIdx) => {
        const span = sylSpans[sIdx]
        if (span) {
          span.classList.toggle('is-active-syl', sState.state === 'active')
          span.classList.toggle('is-completed-syl', sState.state === 'completed')
          span.classList.toggle('is-upcoming-syl', sState.state === 'upcoming')
        }
      })
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
    setLyrics,
    updateTime,
    setPreviewCount,
    applyStyles
  }
}
