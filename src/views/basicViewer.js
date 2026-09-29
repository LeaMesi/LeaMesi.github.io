import { findActiveLineIndex, evaluateSyllablesState, findMatchingTranslationLine } from '../lyrics/sync.js'

export function createBasicViewer(containerElement) {
  let currentLines = []
  let translationLines = []
  let isBilingual = true
  let activeLineIndex = -1
  let renderedLineIndex = -999

  function applyStyles(styles = {}) {
    if (!containerElement) return
    const root = document.documentElement
    if (styles.textColor) root.style.setProperty('--text-inactive', styles.textColor)
    if (styles.activeColor) root.style.setProperty('--text-active', styles.activeColor)
    if (styles.translationColor) root.style.setProperty('--translation-color', styles.translationColor)
    if (styles.backgroundColor) root.style.setProperty('--bg-color', styles.backgroundColor)
    if (styles.fontFamily) root.style.setProperty('--lyrics-font-family', styles.fontFamily)
    if (styles.fontSize) root.style.setProperty('--lyrics-font-size', styles.fontSize)
  }

  function setLyrics({ lines = [], translations = [], bilingual = true, styles = {} }) {
    currentLines = Array.isArray(lines) ? lines : []
    translationLines = Array.isArray(translations) ? translations : []
    isBilingual = bilingual
    applyStyles(styles)
    activeLineIndex = -1
    renderedLineIndex = -999
    renderFullList()
  }

  function renderFullList() {
    if (!containerElement) return

    if (currentLines.length === 0) {
      containerElement.innerHTML = `
        <div class="empty-lyrics-notice">
          <p>No hay letras cargadas para esta pista.</p>
        </div>
      `
      return
    }

    const html = `
      <div class="lyrics-scroll-container">
        ${currentLines.map((line, idx) => {
          const transLine = isBilingual ? findMatchingTranslationLine(translationLines, line) : null
          const hasSyllables = Array.isArray(line.syllables) && line.syllables.length > 0

          const lineContentHtml = hasSyllables
            ? line.syllables.map((syl, sIdx) => `
                <span class="syllable" data-line="${idx}" data-syl="${sIdx}">${escapeHtml(syl.text)}</span>
              `).join('')
            : escapeHtml(line.text)

          const translationHtml = transLine
            ? `<div class="translation-line">${escapeHtml(transLine.text)}</div>`
            : ''

          return `
            <div class="lyric-line-wrapper" id="lyric-line-${idx}" data-index="${idx}">
              <div class="lyric-line-main">${lineContentHtml}</div>
              ${translationHtml}
            </div>
          `
        }).join('')}
      </div>
    `

    containerElement.innerHTML = html
  }

  function updateTime(currentTime) {
    if (currentLines.length === 0 || !containerElement) return

    const newIndex = findActiveLineIndex(currentLines, currentTime)

    // Si cambió la línea activa, actualizamos clases y scroll suave
    if (newIndex !== renderedLineIndex) {
      if (renderedLineIndex >= 0) {
        const prevEl = containerElement.querySelector(`#lyric-line-${renderedLineIndex}`)
        if (prevEl) {
          prevEl.classList.remove('is-active', 'is-upcoming')
          prevEl.classList.add('is-past')
        }
      }

      const activeEl = containerElement.querySelector(`#lyric-line-${newIndex}`)
      if (activeEl) {
        // Limpiar clases
        const allWrappers = containerElement.querySelectorAll('.lyric-line-wrapper')
        allWrappers.forEach((el, idx) => {
          el.classList.toggle('is-past', idx < newIndex)
          el.classList.toggle('is-active', idx === newIndex)
          el.classList.toggle('is-upcoming', idx > newIndex)
        })

        // Auto-scroll centrado suave
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      renderedLineIndex = newIndex
    }

    // Actualizar estados de sílabas en la línea activa
    if (renderedLineIndex >= 0 && currentLines[renderedLineIndex]) {
      const activeLine = currentLines[renderedLineIndex]
      if (Array.isArray(activeLine.syllables) && activeLine.syllables.length > 0) {
        const states = evaluateSyllablesState(activeLine.syllables, currentTime)
        const sylSpans = containerElement.querySelectorAll(`#lyric-line-${renderedLineIndex} .syllable`)

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
    applyStyles
  }
}
