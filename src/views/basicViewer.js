import { findActiveLineIndex, evaluateSyllablesState, findMatchingTranslationLine } from '../lyrics/sync.js'
import { applyTheme } from '../services/themeService.js'

export function createBasicViewer(containerElement, options = {}) {
  const {
    onSeekLine,
    initialPreviewCount = 2,
    initialPastCount = (options.initialPreviousCount !== undefined ? options.initialPreviousCount : 0),
    initialScriptDisplayMode = 'both'
  } = options

  let currentLines = []
  let translationLines = []
  let isTranslationActive = false
  let previewCount = (initialPreviewCount !== undefined && initialPreviewCount !== null && !isNaN(Number(initialPreviewCount)))
    ? Math.max(0, Math.min(3, Number(initialPreviewCount)))
    : 2
  let pastCount = (initialPastCount !== undefined && initialPastCount !== null && !isNaN(Number(initialPastCount)))
    ? Math.max(0, Math.min(3, Number(initialPastCount)))
    : 0
  let scriptDisplayMode = (initialScriptDisplayMode === 'original' || initialScriptDisplayMode === 'alt')
    ? initialScriptDisplayMode
    : 'both'
  let activeLineIndex = -1
  let renderedActiveIndex = -999

  function applyStyles(styles = {}) {
    if (!containerElement) return
    applyTheme()
    const root = document.documentElement
    if (styles.fontFamily) root.style.setProperty('--lyrics-font-family', styles.fontFamily)
  }

  function setPreviewCount(count) {
    const val = Number(count)
    const num = isNaN(val) ? 2 : Math.max(0, Math.min(3, val))
    if (previewCount !== num) {
      previewCount = num
      renderedActiveIndex = -999
      if (currentLines.length > 0) {
        renderStage(activeLineIndex >= 0 ? activeLineIndex : 0)
      }
    }
  }

  function setPastCount(count) {
    const val = Number(count)
    const num = isNaN(val) ? 0 : Math.max(0, Math.min(3, val))
    if (pastCount !== num) {
      pastCount = num
      renderedActiveIndex = -999
      if (currentLines.length > 0) {
        renderStage(activeLineIndex >= 0 ? activeLineIndex : 0)
      }
    }
  }

  function setScriptDisplayMode(mode) {
    if (mode !== 'both' && mode !== 'original' && mode !== 'alt') return
    if (scriptDisplayMode !== mode) {
      scriptDisplayMode = mode
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

  function getSyllableAltTextsWithSpacing(line) {
    if (!line || !Array.isArray(line.syllables) || line.syllables.length === 0) return []
    const syls = line.syllables
    const lineAlt = (typeof line.altText === 'string' && line.altText.trim())
      ? line.altText.trim()
      : ((typeof line.romaji === 'string' && line.romaji.trim()) ? line.romaji.trim() : '')

    if (lineAlt) {
      let altIndex = 0
      const result = []

      for (let i = 0; i < syls.length; i++) {
        const s = syls[i]
        const rawAlt = s.altText || s.romaji || s.text || ''
        const sRaw = rawAlt.trim()

        if (!sRaw) {
          result.push(rawAlt)
          continue
        }

        // Si la sílaba ya incluye explícitamente espacio al final, respetarlo
        if (rawAlt.endsWith(' ')) {
          result.push(rawAlt)
          const found = lineAlt.toLowerCase().indexOf(sRaw.toLowerCase(), altIndex)
          if (found !== -1) {
            altIndex = found + sRaw.length
            while (altIndex < lineAlt.length && lineAlt[altIndex] === ' ') altIndex++
          }
          continue
        }

        const foundPos = lineAlt.toLowerCase().indexOf(sRaw.toLowerCase(), altIndex)
        if (foundPos === -1) {
          const nextSyl = syls[i + 1]
          const needsSpace = i < syls.length - 1 && (!nextSyl || !(nextSyl.altText || nextSyl.romaji || '').startsWith(' '))
          result.push(sRaw + (needsSpace ? ' ' : ''))
          continue
        }

        const prefix = lineAlt.slice(altIndex, foundPos)
        const matchedText = lineAlt.slice(foundPos, foundPos + sRaw.length)
        const endPos = foundPos + sRaw.length
        altIndex = endPos

        let trailingSpace = ''
        if (i < syls.length - 1) {
          while (altIndex < lineAlt.length && lineAlt[altIndex] === ' ') {
            trailingSpace += ' '
            altIndex++
          }
        } else {
          if (altIndex < lineAlt.length) {
            trailingSpace = lineAlt.slice(altIndex)
            altIndex = lineAlt.length
          }
        }

        result.push(prefix + matchedText + trailingSpace)
      }

      return result
    }

    return syls.map((s, idx) => {
      const rawAlt = s.altText || s.romaji || s.text || ''
      if (rawAlt.endsWith(' ')) return rawAlt
      const nextSyl = syls[idx + 1]
      if (nextSyl && !(nextSyl.altText || nextSyl.romaji || '').startsWith(' ')) {
        return rawAlt + ' '
      }
      return rawAlt
    })
  }

  function getLineAltText(line) {
    if (!line) return ''
    if (typeof line.altText === 'string' && line.altText.trim()) return line.altText
    if (typeof line.romaji === 'string' && line.romaji.trim()) return line.romaji
    if (Array.isArray(line.syllables) && line.syllables.length > 0) {
      const hasAnySylAlt = line.syllables.some(s => (s.altText && s.altText.trim()) || (s.romaji && s.romaji.trim()))
      if (hasAnySylAlt) {
        return getSyllableAltTextsWithSpacing(line).join('')
      }
    }
    return ''
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

  function renderLineAltContent(line, isCurrent) {
    if (!line) return ''
    const altText = getLineAltText(line)
    if (!altText) return ''

    if (isCurrent) {
      if (Array.isArray(line.syllables) && line.syllables.length > 0 && line.syllables.some(s => s.altText || s.romaji)) {
        const spacedAltTexts = getSyllableAltTextsWithSpacing(line)
        return line.syllables
          .map((syl, sIdx) => {
            const sylText = spacedAltTexts[sIdx] ?? (syl.altText || syl.romaji || syl.text || '')
            return `<span class="syllable" data-syl="${sIdx}">${escapeHtml(sylText)}</span>`
          })
          .join('')
      }
      return `<span class="plain-active-line">${escapeHtml(altText)}</span>`
    }
    return escapeHtml(altText)
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
    const pastStart = Math.max(0, safeIdx - pastCount)
    const pastLines = pastCount > 0 ? currentLines.slice(pastStart, safeIdx) : []
    const upcomingLines = previewCount > 0 ? currentLines.slice(safeIdx + 1, safeIdx + 1 + previewCount) : []

    const activeMainHtml = renderLineMainContent(activeLine, true)
    const activeAltHtml = renderLineAltContent(activeLine, true)
    const activeTransHtml = renderTranslationLine(activeLine, safeIdx, true)

    let activeLinesHtml = ''
    if (scriptDisplayMode === 'both') {
      activeLinesHtml = `
        <div class="lyric-line-main" id="active-line-main">${activeMainHtml}</div>
        ${activeAltHtml ? `<div class="lyric-line-alt" id="active-line-alt">${activeAltHtml}</div>` : ''}
      `
    } else if (scriptDisplayMode === 'original') {
      activeLinesHtml = `
        <div class="lyric-line-main" id="active-line-main">${activeMainHtml}</div>
      `
    } else if (scriptDisplayMode === 'alt') {
      activeLinesHtml = `
        <div class="lyric-line-main is-primary-alt" id="active-line-main">${activeAltHtml || activeMainHtml}</div>
      `
    }

    const pastItemsHtml = pastLines.map((pLine, offset) => {
      const pIdx = pastStart + offset
      const dist = safeIdx - pIdx
      const pMainHtml = renderLineMainContent(pLine, false)
      const pAltHtml = renderLineAltContent(pLine, false)
      const pTransHtml = renderTranslationLine(pLine, pIdx, false)

      let pLinesHtml = ''
      if (scriptDisplayMode === 'both') {
        pLinesHtml = `
          <div class="lyric-line-main">${pMainHtml}</div>
          ${pAltHtml ? `<div class="lyric-line-alt">${pAltHtml}</div>` : ''}
        `
      } else if (scriptDisplayMode === 'original') {
        pLinesHtml = `
          <div class="lyric-line-main">${pMainHtml}</div>
        `
      } else if (scriptDisplayMode === 'alt') {
        pLinesHtml = `
          <div class="lyric-line-main is-primary-alt">${pAltHtml || pMainHtml}</div>
        `
      }

      return `
        <div class="past-phrase-item past-rank-${dist}" data-index="${pIdx}" title="Retroceder a esta frase (${pLine.startTime}s)">
          ${pLinesHtml}
          ${pTransHtml}
        </div>
      `
    }).join('')

    const pastBoxHtml = (pastCount > 0 && pastItemsHtml)
      ? `
        <!-- Frases Anteriores (Arriba) -->
        <div class="past-phrases-container" id="past-phrases-box">
          ${pastItemsHtml}
        </div>
      `
      : ''

    const upcomingItemsHtml = upcomingLines.map((uLine, offset) => {
      const uIdx = safeIdx + 1 + offset
      const uMainHtml = renderLineMainContent(uLine, false)
      const uAltHtml = renderLineAltContent(uLine, false)
      const uTransHtml = renderTranslationLine(uLine, uIdx, false)

      let uLinesHtml = ''
      if (scriptDisplayMode === 'both') {
        uLinesHtml = `
          <div class="lyric-line-main">${uMainHtml}</div>
          ${uAltHtml ? `<div class="lyric-line-alt">${uAltHtml}</div>` : ''}
        `
      } else if (scriptDisplayMode === 'original') {
        uLinesHtml = `
          <div class="lyric-line-main">${uMainHtml}</div>
        `
      } else if (scriptDisplayMode === 'alt') {
        uLinesHtml = `
          <div class="lyric-line-main is-primary-alt">${uAltHtml || uMainHtml}</div>
        `
      }

      return `
        <div class="upcoming-phrase-item upcoming-rank-${offset + 1}" data-index="${uIdx}" title="Saltar a esta frase (${uLine.startTime}s)">
          ${uLinesHtml}
          ${uTransHtml}
        </div>
      `
    }).join('')

    const upcomingBoxHtml = (previewCount > 0 && upcomingItemsHtml)
      ? `
        <!-- Frases Siguientes (Debajo) -->
        <div class="upcoming-phrases-container" id="upcoming-phrases-box">
          ${upcomingItemsHtml}
        </div>
      `
      : ''

    containerElement.innerHTML = `
      <div class="lyrics-stage-display">
        ${pastBoxHtml}

        <!-- Frase Actual en el centro -->
        <div class="active-phrase-container animate-phrase-change" id="active-phrase-box" data-index="${safeIdx}">
          <div class="lyric-line-wrapper is-active">
            ${activeLinesHtml}
            ${activeTransHtml}
          </div>
        </div>

        ${upcomingBoxHtml}
      </div>
    `

    renderedActiveIndex = safeIdx

    // Permitir clic en frases para saltar/retroceder directamente en la reproducción
    if (onSeekLine) {
      const pastEls = containerElement.querySelectorAll('.past-phrase-item')
      pastEls.forEach(el => {
        el.addEventListener('click', () => {
          const idx = Number(el.dataset.index)
          if (!isNaN(idx) && currentLines[idx]) {
            onSeekLine(currentLines[idx].startTime)
          }
        })
      })

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

    // Actualizar resaltado de sílabas en tiempo real en todos los elementos del verso activo
    const activeLine = currentLines[renderedActiveIndex]
    if (activeLine && Array.isArray(activeLine.syllables) && activeLine.syllables.length > 0) {
      const states = evaluateSyllablesState(activeLine.syllables, currentTime)
      const activeBox = containerElement.querySelector('#active-phrase-box')
      if (activeBox) {
        states.forEach((sState, sIdx) => {
          const spans = activeBox.querySelectorAll(`[data-syl="${sIdx}"]`)
          spans.forEach(span => {
            span.classList.toggle('is-active-syl', sState.state === 'active')
            span.classList.toggle('is-completed-syl', sState.state === 'completed')
            span.classList.toggle('is-upcoming-syl', sState.state === 'upcoming')
          })
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
    setPreviewCount,
    getPreviewCount: () => previewCount,
    setPastCount,
    getPastCount: () => pastCount,
    setPreviousCount: setPastCount,
    getPreviousCount: () => pastCount,
    setScriptDisplayMode,
    getScriptDisplayMode: () => scriptDisplayMode,
    applyStyles
  }
}
