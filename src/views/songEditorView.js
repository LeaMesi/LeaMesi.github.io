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
  iconEye,
  iconVolume,
  iconVolumeMute,
  iconPalette,
  iconRotateCcw
} from './icons.js'
import { hasJapanese, autoGenerateRomajiForLines } from '../lyrics/transliterationHelper.js'
import { translatePhrase, translateLines } from '../services/translationService.js'
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  getThemeSettings,
  hexToRgba
} from '../services/themeService.js'

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
  let initialScrollLineIndex = -1
  let statusMessage = ''
  let statusType = 'info' // 'info' | 'success' | 'error'
  let isMetadataOpen = true
  let isThemeSectionOpen = false
  let isQuickImportModalOpen = false
  let isAddLanguageModalOpen = false
  let isEditLanguageModalOpen = false
  let isTranslatingSong = false
  let translatingStatusText = ''
  let previewTimer = null
  let translationRefMode = 'both' // 'both' | 'text' | 'alt' | 'none'
  let autoSaveTimer = null
  let isSaving = false
  let pendingSave = false
  let resetScrollOnNextRender = false
  let loadSessionCounter = 0
  let isSongLoadingOnline = false
  let onlineSourceName = ''
  let isUserSeeking = false
  let isVolumeMenuOpen = false
  let documentClickListener = null
  let currentActiveLineIndices = new Set()
  let currentActiveSylKeys = new Set()

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

  function unpackSong(songToEdit) {
    if (!songToEdit) return getBlankSongTemplate()
    const song = JSON.parse(JSON.stringify(songToEdit))

    // Desempaquetar si viene en formato package { metadata, basic, advanced }
    if (song.metadata) {
      if (!song.title && song.metadata.title) song.title = song.metadata.title
      if (!song.artist && song.metadata.artist) song.artist = song.metadata.artist
      if ((!song.videos || song.videos.length === 0) && song.metadata.videos) {
        song.videos = song.metadata.videos
      }
      if ((!song.genres || song.genres.length === 0) && song.metadata.genres) {
        song.genres = song.metadata.genres
      }
      if ((!song.tags || song.tags.length === 0) && song.metadata.tags) {
        song.tags = song.metadata.tags
      }
      if (!song.audio_path && song.metadata.audioPath) {
        song.audio_path = song.metadata.audioPath
      }
    }

    if (!song.lyrics_data) {
      song.lyrics_data = song.basic || {}
    }

    // Normalizar estructura
    if (!Array.isArray(song.lyrics_data.languages) || song.lyrics_data.languages.length === 0) {
      if (song.basic && Array.isArray(song.basic.languages) && song.basic.languages.length > 0) {
        song.lyrics_data.languages = song.basic.languages
      } else {
        song.lyrics_data.languages = [
          {
            code: 'es',
            name: 'Español (Original)',
            isMain: true,
            plain: song.lyrics_data.plain || '',
            lines: song.lyrics_data.lines || []
          }
        ]
      }
    }
    if (!Array.isArray(song.videos) || song.videos.length === 0) {
      song.videos = [
        {
          id: `vid-${Date.now()}-0`,
          name: 'Video Oficial',
          url: song.metadata?.youtubeUrlFull || song.lyrics_data.youtube?.full || '',
          offset: 0
        }
      ]
    }

    const customThemeCandidate = song.customTheme || song.lyrics_data?.customTheme || song.lyrics_data?.theme || song.basic?.customTheme || song.basic?.theme
    if (customThemeCandidate && typeof customThemeCandidate === 'object') {
      song.lyrics_data.customTheme = { ...customThemeCandidate }
    }

    return song
  }

  function applyLoadedData(newPackage, msg, type) {
    if (!newPackage || !currentSong) return

    const titleInput = containerElement?.querySelector('#editor-title-input')
    const artistInput = containerElement?.querySelector('#editor-artist-input')
    const userTitle = titleInput ? titleInput.value.trim() : null
    const userArtist = artistInput ? artistInput.value.trim() : null

    const unpacked = unpackSong(newPackage)

    if (userTitle && userTitle !== currentSong.title) {
      unpacked.title = userTitle
    }
    if (userArtist && userArtist !== currentSong.artist) {
      unpacked.artist = userArtist
    }

    currentSong = unpacked
    if (activeLangIndex >= currentSong.lyrics_data.languages.length) {
      activeLangIndex = 0
    }

    statusMessage = msg || ''
    statusType = type || 'info'
    isSongLoadingOnline = false

    const firstVideo = currentSong.videos?.find(v => v.url)
    if (firstVideo && mediaPlayer) {
      mediaPlayer.loadSong(currentSong, firstVideo.id).catch(() => {})
    }

    render()
    triggerImmediateAutoSave()
  }

  function setupBackgroundLoading(loadOptions, session) {
    const { loadPromise, sourceName, translateTo, registerProgressCallbacks } = loadOptions

    if (registerProgressCallbacks) {
      registerProgressCallbacks({
        onProgress: (msg) => {
          if (session !== loadSessionCounter) return
          statusMessage = msg
          statusType = 'info'
          render()
        },
        onLyricsReady: (basePkg) => {
          if (session !== loadSessionCounter) return
          isSongLoadingOnline = false
          const msg = translateTo && translateTo !== 'none'
            ? `Letra obtenida desde ${sourceName || 'el proveedor'}. Traduciendo frases a ${translateTo}...`
            : `¡Letra cargada con éxito desde ${sourceName || 'el proveedor'}!`
          applyLoadedData(basePkg, msg, 'info')
        }
      })
    }

    if (loadPromise) {
      loadPromise
        .then((fullPackage) => {
          if (session !== loadSessionCounter) return
          isSongLoadingOnline = false
          applyLoadedData(fullPackage, `¡Letra cargada y lista${sourceName ? ` desde ${sourceName}` : ''}!`, 'success')
        })
        .catch((err) => {
          if (session !== loadSessionCounter) return
          isSongLoadingOnline = false
          statusMessage = `No se pudo obtener la letra${sourceName ? ` desde ${sourceName}` : ''}: ` + (err.message || err)
          statusType = 'error'
          render()
        })
    }
  }

  function open(songToEdit = null, loadOptions = {}) {
    const currentSession = ++loadSessionCounter

    if (songToEdit) {
      currentSong = unpackSong(songToEdit)
    } else {
      currentSong = getBlankSongTemplate()
    }

    isSongLoadingOnline = Boolean(loadOptions.loadPromise)
    onlineSourceName = loadOptions.sourceName || ''

    activeLangIndex = 0
    let initialActiveLine = 0
    const curTime = (mediaPlayer && typeof mediaPlayer.getLyricsTime === 'function')
      ? mediaPlayer.getLyricsTime()
      : ((mediaPlayer && typeof mediaPlayer.getCurrentTime === 'function') ? Math.max(0, mediaPlayer.getCurrentTime() || 0) : 0)
    const activeLang = currentSong?.lyrics_data?.languages?.[0]
    const lines = activeLang?.lines || []

    if (curTime > 0 && lines.length > 0) {
      const activeIdx = lines.findIndex(l => {
        const { start, end } = getLineTimeRange(l)
        return curTime >= start && curTime <= end
      })
      if (activeIdx !== -1) {
        initialActiveLine = activeIdx
      } else {
        const nextIdx = lines.findIndex(l => {
          const { start } = getLineTimeRange(l)
          return start > curTime
        })
        if (nextIdx > 0) initialActiveLine = nextIdx - 1
        else if (nextIdx === -1) initialActiveLine = lines.length - 1
      }
    }
    initialScrollLineIndex = initialActiveLine
    expandedLineIndices = new Set()

    statusMessage = loadOptions.initialStatus?.message || ''
    statusType = loadOptions.initialStatus?.type || 'info'
    isMetadataOpen = !currentSong.title // Abrir metadatos si es una canción nueva
    isThemeSectionOpen = Boolean(currentSong.lyrics_data?.customTheme)
    isQuickImportModalOpen = false
    isAddLanguageModalOpen = false
    isEditLanguageModalOpen = false
    isTranslatingSong = false
    translatingStatusText = ''
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
    isSaving = false
    pendingSave = false

    // Si no está ya cargada en el reproductor y tiene video con URL, cargarla
    const loadedMediaSong = mediaPlayer?.getCurrentSong ? mediaPlayer.getCurrentSong() : null
    const isSameSongLoaded = loadedMediaSong && currentSong && (
      (currentSong.id !== undefined && currentSong.id !== null && loadedMediaSong.id !== undefined && loadedMediaSong.id !== null && String(currentSong.id) === String(loadedMediaSong.id)) ||
      (currentSong.title && loadedMediaSong.title && currentSong.title === loadedMediaSong.title && currentSong.artist === loadedMediaSong.artist)
    )

    const firstVideo = currentSong.videos?.find(v => v.url)
    if (!isSameSongLoaded && firstVideo && typeof mediaPlayer?.loadSong === 'function') {
      mediaPlayer.loadSong(currentSong, firstVideo.id).catch(() => {})
    } else if (isSameSongLoaded && mediaPlayer && typeof mediaPlayer.setActiveOffset === 'function') {
      const activeVidId = mediaPlayer.getActiveVideoId ? mediaPlayer.getActiveVideoId() : null
      const matchedVid = currentSong.videos?.find(v => String(v.id) === String(activeVidId)) || firstVideo
      if (matchedVid && matchedVid.offset !== undefined) {
        mediaPlayer.setActiveOffset(matchedVid.offset)
      }
    }

    clearActiveElements()
    resetScrollOnNextRender = true
    render()

    if (loadOptions.loadPromise) {
      setupBackgroundLoading(loadOptions, currentSession)
    }
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

  function getLineTimeRange(line) {
    const start = Number(line?.startTime) || 0
    let end = (Number(line?.endTime) > start) ? Number(line.endTime) : (start + 3.0)
    if (Array.isArray(line?.syllables) && line.syllables.length > 0) {
      for (let i = 0; i < line.syllables.length; i++) {
        const s = line.syllables[i]
        const sStart = Number(s?.startTime) || 0
        const sDur = Math.max(0.05, Number(s?.duration) || 0.3)
        const sEnd = sStart + sDur
        if (sEnd > end) {
          end = sEnd
        }
      }
    }
    return { start, end }
  }

  function clearActiveElements() {
    if (containerElement) {
      const activeCards = containerElement.querySelectorAll('.phrase-editor-card.is-active-phrase')
      activeCards.forEach(el => el.classList.remove('is-active-phrase'))
      const activeChips = containerElement.querySelectorAll('.syllable-edit-chip.is-active-syllable')
      activeChips.forEach(el => el.classList.remove('is-active-syllable'))
    }
    currentActiveLineIndices = new Set()
    currentActiveSylKeys = new Set()
  }

  function updateActiveElements(time) {
    if (!containerElement || !currentSong) return
    const activeLang = getActiveLanguage()
    const lines = activeLang?.lines || []
    if (lines.length === 0) {
      clearActiveElements()
      return
    }

    const nextActiveLineIndices = new Set()
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const { start, end } = getLineTimeRange(line)
      if (start > time + 5 && i > 0) {
        break
      }
      if (time >= start && time <= end) {
        nextActiveLineIndices.add(i)
      }
    }

    const nextActiveSylKeys = new Set()
    for (const lineIdx of nextActiveLineIndices) {
      const line = lines[lineIdx]
      if (Array.isArray(line?.syllables) && line.syllables.length > 0) {
        for (let s = 0; s < line.syllables.length; s++) {
          const syl = line.syllables[s]
          const sStart = Number(syl?.startTime) || 0
          const sDur = Math.max(0.05, Number(syl?.duration) || 0.3)
          const sEnd = sStart + sDur
          if (time >= sStart && time < sEnd) {
            nextActiveSylKeys.add(`${lineIdx}-${s}`)
          }
        }
      }
    }

    // Retirar clase is-active-phrase de versos que ya no están activos
    for (const oldIdx of currentActiveLineIndices) {
      if (!nextActiveLineIndices.has(oldIdx)) {
        const el = containerElement.querySelector(`.phrase-editor-card[data-line-idx="${oldIdx}"]`)
        if (el) el.classList.remove('is-active-phrase')
      }
    }

    // Añadir clase is-active-phrase a nuevos versos activos
    for (const newIdx of nextActiveLineIndices) {
      if (!currentActiveLineIndices.has(newIdx)) {
        const el = containerElement.querySelector(`.phrase-editor-card[data-line-idx="${newIdx}"]`)
        if (el) el.classList.add('is-active-phrase')
      }
    }
    currentActiveLineIndices = nextActiveLineIndices

    // Retirar clase is-active-syllable de sílabas que ya no están activas
    for (const oldKey of currentActiveSylKeys) {
      if (!nextActiveSylKeys.has(oldKey)) {
        const [lIdx, sIdx] = oldKey.split('-')
        const el = containerElement.querySelector(`.syllable-edit-chip[data-line-idx="${lIdx}"][data-syl-idx="${sIdx}"]`)
        if (el) el.classList.remove('is-active-syllable')
      }
    }

    // Añadir clase is-active-syllable a nuevas sílabas activas
    for (const newKey of nextActiveSylKeys) {
      if (!currentActiveSylKeys.has(newKey)) {
        const [lIdx, sIdx] = newKey.split('-')
        const el = containerElement.querySelector(`.syllable-edit-chip[data-line-idx="${lIdx}"][data-syl-idx="${sIdx}"]`)
        if (el) el.classList.add('is-active-syllable')
      }
    }
    currentActiveSylKeys = nextActiveSylKeys
  }

  function getActiveSongPresetId(theme) {
    if (!theme) return 'custom'
    for (const preset of THEME_PRESETS) {
      const s = preset.settings
      const isMatch =
        s.bgColor.toLowerCase() === (theme.bgColor || '').toLowerCase() &&
        s.panelBg.toLowerCase() === (theme.panelBg || '').toLowerCase() &&
        s.primaryColor.toLowerCase() === (theme.primaryColor || '').toLowerCase() &&
        s.textMain.toLowerCase() === (theme.textMain || '').toLowerCase() &&
        s.originalColor.toLowerCase() === (theme.originalColor || '').toLowerCase() &&
        s.translationColor.toLowerCase() === (theme.translationColor || '').toLowerCase() &&
        s.activeColor.toLowerCase() === (theme.activeColor || '').toLowerCase()
      if (isMatch) return preset.id
    }
    return 'custom'
  }

  function updateEditorThemePreview() {
    if (!containerElement || !currentSong?.lyrics_data?.customTheme) return
    const previewContainer = containerElement.querySelector('#editor-theme-live-preview-box')
    if (!previewContainer) return

    const theme = currentSong.lyrics_data.customTheme
    const {
      lyricsScale = 100,
      translationScale = 100,
      altScale = 100,
      originalColor = '#cbd5e1',
      altColor = '#a5f3fc',
      translationColor = '#38bdf8',
      activeColor = '#fbbf24',
      completedColor = '#f59e0b',
      originalBold = true,
      originalItalic = false,
      altBold = false,
      altItalic = false,
      translationBold = false,
      translationItalic = true,
      activeBold = true,
      activeItalic = false,
      activeGlow = true,
      completedBold = true,
      completedItalic = false
    } = theme

    const lScale = Math.max(50, Math.min(200, Number(lyricsScale) || 100)) / 100
    const tScale = Math.max(50, Math.min(200, Number(translationScale) || 100)) / 100
    const aScale = Math.max(50, Math.min(200, Number(altScale) || 100)) / 100

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
    const altActiveStyle = `
      font-size: calc(1.05rem * ${lScale} * ${aScale});
      font-weight: ${altBold ? '700' : '500'};
      font-style: ${altItalic ? 'italic' : 'normal'};
      color: ${altColor || '#a5f3fc'};
      margin-top: 3px;
    `
    const transActiveStyle = `
      font-size: calc(0.9rem * ${tScale});
      font-weight: ${translationBold ? '700' : '400'};
      font-style: ${translationItalic ? 'italic' : 'normal'};
      color: ${translationColor};
      margin-top: 2px;
    `

    previewContainer.innerHTML = `
      <div class="preview-phrase-active">
        <div class="preview-line-main" style="${mainActiveStyle}">
          <span class="preview-syl-completed" style="${sylCompletedStyle}">Caminando </span><span class="preview-syl-highlight" style="${sylActiveStyle}">por la </span><span>ciudad</span>
        </div>
        <div class="preview-line-alt" style="${altActiveStyle}">
          <span class="preview-syl-completed" style="${sylCompletedStyle}">Caminando </span><span class="preview-syl-highlight" style="${sylActiveStyle}">por la </span><span>ciudad</span>
        </div>
        <div class="preview-line-trans" style="${transActiveStyle}">
          Walking through the city
        </div>
      </div>
    `
  }

  function render() {
    if (!containerElement || !currentSong) return

    clearActiveElements()

    const previousScrollEl = containerElement.querySelector('.editor-content-scroll')
    const previousScrollTop = resetScrollOnNextRender ? 0 : (previousScrollEl ? previousScrollEl.scrollTop : 0)
    const previousTabsEl = containerElement.querySelector('.editor-lang-tabs-bar')
    const previousTabsScrollLeft = resetScrollOnNextRender ? 0 : (previousTabsEl ? previousTabsEl.scrollLeft : 0)
    const previousWindowScrollY = (typeof window !== 'undefined' && !resetScrollOnNextRender)
      ? (window.scrollY || document.documentElement?.scrollTop || 0)
      : 0
    resetScrollOnNextRender = false

    const activeLang = getActiveLanguage()
    const languages = currentSong.lyrics_data.languages || []
    const mainLang = languages.find(l => l.isMain) || languages[0]
    const isTranslation = Boolean(activeLang && !activeLang.isMain)
    const lines = activeLang?.lines || []
    const videos = currentSong.videos || []
    const isNew = !currentSong.id
    const totalSylCount = lines.reduce((acc, l) => acc + (l.syllables?.length || 0), 0)
    const hasJpInActiveLang = (lines || []).some(l => hasJapanese(l.text)) || (activeLang && hasJapanese(activeLang.plain || ''))

    const songTheme = currentSong.lyrics_data?.customTheme || null
    const hasCustomTheme = Boolean(songTheme)
    const effectiveSongTheme = songTheme || { ...DEFAULT_THEME, ...getThemeSettings() }
    const activeSongPreset = getActiveSongPresetId(effectiveSongTheme)
    const themePresetsHtml = THEME_PRESETS.map(preset => {
      const isSelected = activeSongPreset === preset.id
      return `
        <button
          type="button"
          class="btn-theme-preset btn-editor-theme-preset ${isSelected ? 'is-selected' : ''}"
          data-preset-id="${preset.id}"
          title="Aplicar tema ${preset.name} a esta canción"
        >
          <span class="preset-dot" style="background: ${preset.settings.primaryColor}"></span>
          <span class="preset-name">${preset.name}</span>
        </button>
      `
    }).join('')

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
      ? (isSongLoadingOnline
        ? `
          <div class="empty-lines-state">
            <div class="translation-loading-spinner" style="margin: 1.5rem auto;"></div>
            <p class="empty-title">Descargando letra y sincronización...</p>
            <p class="empty-desc">Conectando con ${escapeHtml(onlineSourceName || 'el proveedor')} para obtener los versos, tiempos y sílabas.</p>
          </div>
        `
        : `
          <div class="empty-lines-state">
            <p class="empty-title">Este idioma aún no tiene frases añadidas.</p>
            <p class="empty-desc">${isTranslation ? 'Podés traducir automáticamente toda la canción desde el original con tiempos sincronizados, o añadir frases una a una.' : 'Podés añadir frases una a una o pegar la letra completa con tiempos y sílabas automáticas.'}</p>
            <div class="empty-actions">
              ${isTranslation && (mainLang?.lines?.length || 0) > 0 ? `
                <button class="btn btn-primary btn-auto-translate-all">${iconSparkles} Traducir Toda la Canción</button>
              ` : ''}
              <button class="btn btn-primary btn-add-first-line">${iconPlus} Añadir Primera Frase</button>
              <button class="btn btn-outline btn-open-quick-import">${iconFileText} Pegar Letra Completa</button>
            </div>
          </div>
        `)
      : lines.map((line, lineIdx) => {
        const isExpanded = !isTranslation && expandedLineIndices.has(lineIdx)
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

                <div class="phrase-ref-actions">
                  <button type="button" class="btn-copy-ref-line" data-line-idx="${lineIdx}" title="Copiar texto del verso original a este campo">
                    Copiar
                  </button>
                  ${refText ? `
                    <button type="button" class="btn-translate-ref-line" data-line-idx="${lineIdx}" title="Traducir automáticamente este verso al idioma actual">
                      Traducir
                    </button>
                  ` : ''}
                </div>
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
                ${!isTranslation ? `
                  <button type="button" class="btn btn-xs btn-outline btn-toggle-syllables" data-line-idx="${lineIdx}" title="${isExpanded ? 'Contraer sílabas' : 'Editar sílabas y tiempos'}">
                    Sílabas (${sylCount}) ${isExpanded ? iconChevronUp : iconChevronDown}
                  </button>
                ` : ''}
                <button type="button" class="btn btn-xs btn-outline btn-move-line-up" data-line-idx="${lineIdx}" title="Mover arriba" ${lineIdx === 0 ? 'disabled' : ''}>${iconChevronUp}</button>
                <button type="button" class="btn btn-xs btn-outline btn-move-line-down" data-line-idx="${lineIdx}" title="Mover abajo" ${lineIdx === lines.length - 1 ? 'disabled' : ''}>${iconChevronDown}</button>
                <button type="button" class="btn btn-xs btn-outline btn-delete-line" data-line-idx="${lineIdx}" title="Eliminar este verso">${iconTrash}</button>
              </div>
            </div>

            <!-- Panel de Sílabas y Tiempos de Canto (solo en idioma principal) -->
            ${!isTranslation && isExpanded ? `
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
                      ${iconPlus}
                    </button>
                    <button class="btn btn-xs btn-outline btn-danger-outline btn-clear-line-syllables" data-line-idx="${lineIdx}" title="Borrar todas las sílabas de este verso" ${sylCount === 0 ? 'disabled' : ''}>
                      ${iconTrash}
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
          <div class="video-offset-controls">
            <button
              type="button"
              class="btn btn-xs btn-outline btn-vid-offset-step btn-vid-offset-dec"
              data-video-idx="${vIdx}"
              data-delta="-0.1"
              title="Restar 0.1s de offset (la letra empezará 0.1s más tarde)"
            >-0.1</button>
            <input
              type="number"
              step="0.1"
              class="input-vid-offset"
              value="${vid.offset || 0}"
              data-video-idx="${vIdx}"
            />
            <button
              type="button"
              class="btn btn-xs btn-outline btn-vid-offset-step btn-vid-offset-inc"
              data-video-idx="${vIdx}"
              data-delta="0.1"
              title="Sumar 0.1s de offset (la letra empezará 0.1s más temprano)"
            >+0.1</button>
          </div>
        </div>
        <button class="btn btn-xs btn-outline btn-test-video-audio" data-video-idx="${vIdx}" title="Probar audio de este video">${iconPlay} Cargar</button>
        ${videos.length > 1 ? `
          <button class="btn btn-xs btn-outline btn-remove-video" data-video-idx="${vIdx}" title="Quitar video">${iconTrash}</button>
        ` : ''}
      </div>
    `).join('')

    const currentTime = (mediaPlayer && typeof mediaPlayer.getLyricsTime === 'function')
      ? mediaPlayer.getLyricsTime()
      : ((mediaPlayer && typeof mediaPlayer.getCurrentTime === 'function') ? Math.max(0, mediaPlayer.getCurrentTime() || 0) : 0)
    const duration = mediaPlayer?.getDuration ? Math.max(0, mediaPlayer.getDuration() || 0) : 0
    const currentVolume = mediaPlayer?.getVolume ? Math.max(0, Math.min(100, Math.round(mediaPlayer.getVolume() ?? 100))) : 100

    containerElement.innerHTML = `
      <div class="song-editor-view-container">
        <!-- Asistente de Audio para Sincronización en Vivo -->
        <div class="editor-audio-assistant">
          <div class="assistant-controls">
            <!-- Izquierda: Parlante con menú vertical de volumen + Barra de progreso con tiempo -->
            <div class="assistant-left-group">
              <div class="editor-volume-wrapper" id="editor-volume-wrapper">
                <button
                  type="button"
                  class="btn btn-outline btn-xs btn-editor-volume ${isVolumeMenuOpen ? 'is-active' : ''}"
                  id="btn-editor-volume"
                  title="Volumen: ${currentVolume}%"
                  aria-label="Volumen"
                >
                  ${currentVolume === 0 ? iconVolumeMute : iconVolume}
                </button>
                <div class="editor-volume-popover ${isVolumeMenuOpen ? 'is-open' : ''}" id="editor-volume-popover">
                  <span class="editor-volume-percent" id="editor-volume-percent">${currentVolume}%</span>
                  <div class="editor-volume-slider-track">
                    <input
                      type="range"
                      class="editor-volume-slider"
                      id="editor-volume-slider"
                      min="0"
                      max="100"
                      value="${currentVolume}"
                      orient="vertical"
                      aria-label="Nivel de volumen"
                    />
                  </div>
                </div>
              </div>

              <div class="editor-progress-group">
                <span class="editor-time-label" id="editor-progress-current">${formatTime(Math.max(0, currentTime))}</span>
                <input
                  type="range"
                  class="editor-progress-slider"
                  id="editor-progress-slider"
                  min="0"
                  max="${Math.max(1, duration)}"
                  step="0.1"
                  value="${Math.max(0, currentTime)}"
                  title="Posición de la canción"
                  aria-label="Posición de la canción"
                />
                <span class="editor-time-label" id="editor-progress-duration">${formatTime(duration)}</span>
              </div>
            </div>

            <!-- Centro: Botones de transporte, saltos, reloj y Modo Letra -->
            <div class="assistant-center-group">
              <button class="btn btn-primary btn-sm btn-assistant-play" id="btn-assistant-play" title="${mediaPlayer?.getIsPlaying() ? 'Pausar' : 'Reproducir'}">
                ${mediaPlayer?.getIsPlaying() ? `${iconPause}` : `${iconPlay}`}
              </button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="-5" title="Retroceder 5 segundos">-5s</button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="-1" title="Retroceder 1 segundo">-1s</button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="-0.1" title="Retroceder 0.1 segundos">-0.1s</button>
              
              <div class="assistant-clock">
                <span class="clock-time" id="assistant-clock-time">${formatTime(Math.max(0, currentTime), true)}</span>
              </div>

              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="0.1" title="Adelantar 0.1 segundos">+0.1s</button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="1" title="Adelantar 1 segundo">+1s</button>
              <button class="btn btn-outline btn-xs btn-seek-rel" data-seek="5" title="Adelantar 5 segundos">+5s</button>

              <button class="btn btn-success btn-sm btn-assistant-sing" id="btn-save-and-sing" title="Guardar y probar en Modo Letra" aria-label="Probar en Modo Letra">
                ${iconMic}
              </button>
            </div>

            <!-- Derecha: Indicador de guardado pegado al extremo derecho -->
            <div class="assistant-right-group">
              <span class="editor-autosave-badge ${isSaving ? 'is-saving' : ''}" id="editor-autosave-badge" title="${isSaving ? 'Guardando...' : 'Guardado'}">
                <span class="autosave-dot"></span>
                <span class="autosave-text">${isSaving ? 'Guardando...' : 'Guardado'}</span>
              </span>
            </div>
          </div>
        </div>

        ${statusMessage ? `
          <div class="status-alert status-${statusType}">
            <span class="status-alert-text">${escapeHtml(statusMessage)}</span>
            <button type="button" class="btn-close-alert" id="btn-close-editor-alert" title="Cerrar aviso" aria-label="Cerrar aviso">${iconClose}</button>
          </div>
        ` : ''}

        <div class="editor-content-scroll">
          <!-- Acordeón de Metadatos y Videos de la Canción -->
          <details class="editor-section-card" ${isMetadataOpen ? 'open' : ''} id="editor-metadata-details">
            <summary class="editor-section-summary">
              <span class="summary-title">Metadatos Generales y Videos Asociados</span>
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
                  <button class="btn btn-xs btn-outline" id="btn-add-new-video">${iconPlus} Agregar fuente</button>
                </div>
                <div class="videos-list-container">
                  ${videosListHtml}
                </div>
              </div>

              <!-- Opciones de Respaldo y Copia de Seguridad -->
              <div class="editor-backup-block">
                <div class="block-header">
                  <h4>Copias de Seguridad y Respaldo</h4>
                </div>
                <div class="backup-actions-row">
                  <button type="button" class="btn btn-outline btn-sm" id="btn-editor-export-json" title="Exportar paquete de canción JSON (copia de seguridad)">
                    ${iconDownload} Exportar JSON
                  </button>
                  <button type="button" class="btn btn-outline btn-sm" id="btn-editor-export-yaml" title="Exportar al estándar Lyricsfile (.yaml)">
                    ${iconDownload} Exportar Lyricsfile
                  </button>
                </div>
              </div>
            </div>
          </details>

          <!-- Apartado de Tema Visual de la Canción (Abajo de Metadatos y Arriba de las Letras) -->
          <details class="editor-section-card editor-theme-card" ${isThemeSectionOpen ? 'open' : ''} id="editor-theme-details">
            <summary class="editor-section-summary">
              <span class="summary-title" style="display: flex; align-items: center; gap: 8px;">
                ${iconPalette} Tema Visual Personalizado de la Canción
              </span>
              <span class="summary-badge" id="editor-theme-summary-badge">
                ${hasCustomTheme ? 'Tema Personalizado' : 'Tema Global'}
              </span>
            </summary>

            <div class="editor-section-body">
              <div class="song-theme-header-row" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; padding-bottom: 14px; border-bottom: 1px solid var(--panel-border);">
                <div>
                  <label class="theme-toggle-chip" style="font-size: 0.95rem; font-weight: 600; cursor: pointer; padding: 8px 14px;">
                    <input type="checkbox" id="check-enable-song-custom-theme" ${hasCustomTheme ? 'checked' : ''} />
                    <span>Personalizar tema visual para esta canción</span>
                  </label>
                  <p class="theme-section-desc" style="margin-top: 6px; margin-bottom: 0;">
                    ${hasCustomTheme
                      ? 'Esta canción tiene configurado un tema visual propio. Se aplicará al reproducir en Modo Letra.'
                      : 'Esta canción utiliza el tema global de la aplicación. Activa esta opción si deseas cambiar fondo, paneles, botones, fuentes, colores y efectos de letras solo para esta canción.'}
                  </p>
                </div>
              </div>

              ${hasCustomTheme ? `
                <!-- 0. Presets Rápidos y Copiar -->
                <div class="theme-section theme-presets-section" style="margin-bottom: 18px;">
                  <div class="theme-presets-header" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; margin-bottom: 10px;">
                    <span class="theme-section-title" style="font-size: 0.85rem; font-weight: 600; color: var(--text-main);">Temas Predefinidos:</span>
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                      <button type="button" class="btn btn-outline btn-xs" id="btn-editor-copy-global-theme" title="Copiar los colores y estilos del tema global actual">
                        ${iconPalette} Copiar Tema Global
                      </button>
                      <button type="button" class="btn btn-outline btn-xs" id="btn-editor-reset-song-theme" title="Restablecer tema a valores por defecto">
                        ${iconRotateCcw} Restablecer
                      </button>
                    </div>
                  </div>
                  <div class="theme-presets-bar">
                    ${themePresetsHtml}
                    ${activeSongPreset === 'custom' ? `
                      <span class="badge-custom-theme">Personalizado</span>
                    ` : ''}
                  </div>
                </div>

                <!-- 1. Vista Previa en Vivo -->
                <div class="theme-section theme-preview-section" style="margin-bottom: 18px;">
                  <div class="preview-header" style="margin-bottom: 8px;">
                    <span class="theme-section-title" style="font-size: 0.85rem; font-weight: 600;">Vista Previa de Letras en Vivo:</span>
                  </div>
                  <div class="theme-live-preview-box" id="editor-theme-live-preview-box"></div>
                </div>

                <!-- 2. Colores de la Interfaz (4 Colores Base) -->
                <div class="theme-section" style="margin-bottom: 18px;">
                  <div class="theme-section-header" style="margin-bottom: 10px;">
                    <h4 class="theme-section-title" style="font-size: 0.9rem; font-weight: 600; margin: 0 0 4px;">Colores de la interfaz (4 Colores Base)</h4>
                  </div>
                  <div class="theme-colors-grid">
                    <div class="color-picker-card">
                      <div class="color-card-info">
                        <span class="color-card-name">Color de fondo</span>
                      </div>
                      <div class="color-picker-input-group">
                        <input type="color" class="color-swatch-input" id="picker-song-bg-color" value="${effectiveSongTheme.bgColor}" />
                        <input type="text" class="color-hex-input" id="hex-song-bg-color" value="${effectiveSongTheme.bgColor}" maxlength="7" />
                      </div>
                    </div>
                    <div class="color-picker-card">
                      <div class="color-card-info">
                        <span class="color-card-name">Barras y paneles</span>
                      </div>
                      <div class="color-picker-input-group">
                        <input type="color" class="color-swatch-input" id="picker-song-panel-bg" value="${effectiveSongTheme.panelBg}" />
                        <input type="text" class="color-hex-input" id="hex-song-panel-bg" value="${effectiveSongTheme.panelBg}" maxlength="7" />
                      </div>
                    </div>
                    <div class="color-picker-card">
                      <div class="color-card-info">
                        <span class="color-card-name">Botones y acentos</span>
                      </div>
                      <div class="color-picker-input-group">
                        <input type="color" class="color-swatch-input" id="picker-song-primary-color" value="${effectiveSongTheme.primaryColor}" />
                        <input type="text" class="color-hex-input" id="hex-song-primary-color" value="${effectiveSongTheme.primaryColor}" maxlength="7" />
                      </div>
                    </div>
                    <div class="color-picker-card">
                      <div class="color-card-info">
                        <span class="color-card-name">Texto de Interfaz</span>
                      </div>
                      <div class="color-picker-input-group">
                        <input type="color" class="color-swatch-input" id="picker-song-text-main" value="${effectiveSongTheme.textMain}" />
                        <input type="text" class="color-hex-input" id="hex-song-text-main" value="${effectiveSongTheme.textMain}" maxlength="7" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 3. Tamaño de Letras en Modo Canción -->
                <div class="theme-section" style="margin-bottom: 18px;">
                  <div class="theme-section-header" style="margin-bottom: 10px;">
                    <h4 class="theme-section-title" style="font-size: 0.9rem; font-weight: 600; margin: 0 0 4px;">Tamaño de letras en modo canción</h4>
                  </div>
                  <div class="sliders-grid">
                    <div class="slider-control-card">
                      <div class="slider-header-row">
                        <label for="slider-song-lyrics-scale" class="slider-label">Letra original:</label>
                        <span class="slider-value-badge" id="badge-song-lyrics-scale">${effectiveSongTheme.lyricsScale}%</span>
                      </div>
                      <div class="slider-input-wrapper">
                        <span class="slider-bound-label">50%</span>
                        <input type="range" id="slider-song-lyrics-scale" class="theme-range-slider" min="50" max="200" step="5" value="${effectiveSongTheme.lyricsScale}" />
                        <span class="slider-bound-label">200%</span>
                      </div>
                    </div>
                    <div class="slider-control-card">
                      <div class="slider-header-row">
                        <label for="slider-song-translation-scale" class="slider-label">Traducciones:</label>
                        <span class="slider-value-badge" id="badge-song-translation-scale">${effectiveSongTheme.translationScale}%</span>
                      </div>
                      <div class="slider-input-wrapper">
                        <span class="slider-bound-label">50%</span>
                        <input type="range" id="slider-song-translation-scale" class="theme-range-slider" min="50" max="200" step="5" value="${effectiveSongTheme.translationScale}" />
                        <span class="slider-bound-label">200%</span>
                      </div>
                    </div>
                    <div class="slider-control-card">
                      <div class="slider-header-row">
                        <label for="slider-song-alt-scale" class="slider-label">Texto alternativo (romaji):</label>
                        <span class="slider-value-badge" id="badge-song-alt-scale">${effectiveSongTheme.altScale || 100}%</span>
                      </div>
                      <div class="slider-input-wrapper">
                        <span class="slider-bound-label">50%</span>
                        <input type="range" id="slider-song-alt-scale" class="theme-range-slider" min="50" max="200" step="5" value="${effectiveSongTheme.altScale || 100}" />
                        <span class="slider-bound-label">200%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 4. Colores y Estilos Tipográficos de Letras -->
                <div class="theme-section" style="margin-bottom: 18px;">
                  <div class="theme-section-header" style="margin-bottom: 10px;">
                    <h4 class="theme-section-title" style="font-size: 0.9rem; font-weight: 600; margin: 0 0 4px;">Colores y efectos de la letra y canto</h4>
                  </div>
                  <div class="lyrics-style-cards-grid">
                    <div class="lyric-style-card">
                      <div class="lyric-style-title-col">
                        <strong>Letra Original</strong>
                      </div>
                      <div class="lyric-style-color-col">
                        <input type="color" class="color-swatch-input" id="picker-song-orig-color" value="${effectiveSongTheme.originalColor}" />
                        <input type="text" class="color-hex-input" id="hex-song-orig-color" value="${effectiveSongTheme.originalColor}" maxlength="7" />
                      </div>
                      <div class="lyric-style-toggles-col">
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-orig-bold" ${effectiveSongTheme.originalBold ? 'checked' : ''} />
                          <span>Negrita</span>
                        </label>
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-orig-italic" ${effectiveSongTheme.originalItalic ? 'checked' : ''} />
                          <span>Cursiva</span>
                        </label>
                      </div>
                    </div>

                    <div class="lyric-style-card">
                      <div class="lyric-style-title-col">
                        <strong>Texto alternativo (romaji)</strong>
                      </div>
                      <div class="lyric-style-color-col">
                        <input type="color" class="color-swatch-input" id="picker-song-alt-color" value="${effectiveSongTheme.altColor || '#a5f3fc'}" />
                        <input type="text" class="color-hex-input" id="hex-song-alt-color" value="${effectiveSongTheme.altColor || '#a5f3fc'}" maxlength="7" />
                      </div>
                      <div class="lyric-style-toggles-col">
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-alt-bold" ${effectiveSongTheme.altBold ? 'checked' : ''} />
                          <span>Negrita</span>
                        </label>
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-alt-italic" ${effectiveSongTheme.altItalic ? 'checked' : ''} />
                          <span>Cursiva</span>
                        </label>
                      </div>
                    </div>

                    <div class="lyric-style-card">
                      <div class="lyric-style-title-col">
                        <strong>Traducción</strong>
                      </div>
                      <div class="lyric-style-color-col">
                        <input type="color" class="color-swatch-input" id="picker-song-trans-color" value="${effectiveSongTheme.translationColor}" />
                        <input type="text" class="color-hex-input" id="hex-song-trans-color" value="${effectiveSongTheme.translationColor}" maxlength="7" />
                      </div>
                      <div class="lyric-style-toggles-col">
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-trans-bold" ${effectiveSongTheme.translationBold ? 'checked' : ''} />
                          <span>Negrita</span>
                        </label>
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-trans-italic" ${effectiveSongTheme.translationItalic ? 'checked' : ''} />
                          <span>Cursiva</span>
                        </label>
                      </div>
                    </div>

                    <div class="lyric-style-card is-highlight-card">
                      <div class="lyric-style-title-col">
                        <strong>Sílaba activa (resaltada)</strong>
                      </div>
                      <div class="lyric-style-color-col">
                        <input type="color" class="color-swatch-input" id="picker-song-active-color" value="${effectiveSongTheme.activeColor}" />
                        <input type="text" class="color-hex-input" id="hex-song-active-color" value="${effectiveSongTheme.activeColor}" maxlength="7" />
                      </div>
                      <div class="lyric-style-toggles-col">
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-active-bold" ${effectiveSongTheme.activeBold ? 'checked' : ''} />
                          <span>Negrita</span>
                        </label>
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-active-italic" ${effectiveSongTheme.activeItalic ? 'checked' : ''} />
                          <span>Cursiva</span>
                        </label>
                        <label class="theme-toggle-chip chip-glow">
                          <input type="checkbox" id="check-song-active-glow" ${effectiveSongTheme.activeGlow ? 'checked' : ''} />
                          <span>Efecto de Brillo</span>
                        </label>
                      </div>
                    </div>

                    <div class="lyric-style-card">
                      <div class="lyric-style-title-col">
                        <strong>Sílabas anteriores</strong>
                      </div>
                      <div class="lyric-style-color-col">
                        <input type="color" class="color-swatch-input" id="picker-song-completed-color" value="${effectiveSongTheme.completedColor || '#f59e0b'}" />
                        <input type="text" class="color-hex-input" id="hex-song-completed-color" value="${effectiveSongTheme.completedColor || '#f59e0b'}" maxlength="7" />
                      </div>
                      <div class="lyric-style-toggles-col">
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-completed-bold" ${effectiveSongTheme.completedBold !== false ? 'checked' : ''} />
                          <span>Negrita</span>
                        </label>
                        <label class="theme-toggle-chip">
                          <input type="checkbox" id="check-song-completed-italic" ${effectiveSongTheme.completedItalic ? 'checked' : ''} />
                          <span>Cursiva</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 5. Cuadros de Aviso y Notificaciones -->
                <div class="theme-section">
                  <div class="theme-section-header" style="margin-bottom: 10px;">
                    <h4 class="theme-section-title" style="font-size: 0.9rem; font-weight: 600; margin: 0 0 4px;">Cuadros de aviso y notificaciones</h4>
                  </div>
                  <div class="theme-colors-grid">
                    <div class="color-picker-card">
                      <div class="color-card-info">
                        <span class="color-card-name">Aviso de éxito</span>
                      </div>
                      <div class="color-picker-input-group">
                        <input type="color" class="color-swatch-input" id="picker-song-alert-success" value="${effectiveSongTheme.alertSuccessColor || '#22c55e'}" />
                        <input type="text" class="color-hex-input" id="hex-song-alert-success" value="${effectiveSongTheme.alertSuccessColor || '#22c55e'}" maxlength="7" />
                      </div>
                    </div>
                    <div class="color-picker-card">
                      <div class="color-card-info">
                        <span class="color-card-name">Aviso informativo</span>
                      </div>
                      <div class="color-picker-input-group">
                        <input type="color" class="color-swatch-input" id="picker-song-alert-info" value="${effectiveSongTheme.alertInfoColor || '#38bdf8'}" />
                        <input type="text" class="color-hex-input" id="hex-song-alert-info" value="${effectiveSongTheme.alertInfoColor || '#38bdf8'}" maxlength="7" />
                      </div>
                    </div>
                    <div class="color-picker-card">
                      <div class="color-card-info">
                        <span class="color-card-name">Alerta de error</span>
                      </div>
                      <div class="color-picker-input-group">
                        <input type="color" class="color-swatch-input" id="picker-song-alert-error" value="${effectiveSongTheme.alertErrorColor || '#ef4444'}" />
                        <input type="text" class="color-hex-input" id="hex-song-alert-error" value="${effectiveSongTheme.alertErrorColor || '#ef4444'}" maxlength="7" />
                      </div>
                    </div>
                  </div>
                </div>
              ` : ''}
            </div>
          </details>

          <!-- Sección de Idiomas y Frases -->
          <section class="editor-section-card editor-lyrics-section">
            <div class="editor-lyrics-header">
              <div class="lyrics-section-titles">
                <h3>Idiomas y Letras de la Canción</h3>
              </div>
            </div>

            <!-- Fila de Pestañas de Idiomas -->
            <div class="editor-lang-tabs-bar">
              ${langTabsHtml}
              <button
                type="button"
                class="btn-add-lang-tab"
                id="btn-add-language"
                title="Añadir nuevo idioma o traducción"
                aria-label="Añadir nuevo idioma o traducción"
              >
                ${iconPlus}
              </button>
            </div>

            <!-- Barra de Herramientas de Frases -->
            <div class="phrases-toolbar">
              <div class="phrases-count">
                <span>Versos en <strong>${escapeHtml(activeLang?.name || 'Idioma')}</strong> (${lines.length})</span>
                ${!isTranslation && totalSylCount > 0 ? `<span class="phrases-syl-count">• <strong>${totalSylCount}</strong> sílaba(s)</span>` : ''}
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
                ${!isTranslation && hasJpInActiveLang ? `
                  <button class="btn btn-sm btn-outline btn-auto-romaji" id="btn-auto-generate-romaji" title="Generar automáticamente texto alternativo y fonemas en Romaji para todas las frases y sílabas de este idioma">
                    ${iconSparkles} Romaji Automático
                  </button>
                ` : ''}
                ${isTranslation && (mainLang?.lines?.length || 0) > 0 ? `
                  <button class="btn btn-sm btn-outline btn-auto-translate-all" id="btn-auto-translate-all" title="Traducir automáticamente todas las frases desde el idioma original (${escapeHtml(mainLang?.name || 'Original')}) al idioma actual (${escapeHtml(activeLang?.name || '')}) de forma gratuita">
                    ${iconSparkles} Traducir Toda la Canción
                  </button>
                ` : ''}
                ${!isTranslation ? `
                  <button
                    class="btn btn-sm btn-outline btn-danger-outline"
                    id="btn-clear-all-syllables"
                    title="${totalSylCount > 0 ? 'Borrar todas las sílabas de las frases de este idioma' : 'No hay sílabas configuradas en ninguna frase'}"
                    ${totalSylCount === 0 ? 'disabled' : ''}
                  >
                    ${iconTrash} Borrar Todas las Sílabas
                  </button>
                ` : ''}
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

              ${!isTranslation ? `
                <div class="quick-import-checkbox-row">
                  <label class="checkbox-label">
                    <input type="checkbox" id="check-auto-syllabify" checked />
                    <span>Dividir cada verso en sílabas automáticamente con tiempos proporcionales</span>
                  </label>
                </div>
              ` : ''}

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
                <label class="checkbox-label" for="check-copy-timings">
                  <input type="checkbox" id="check-copy-timings" checked />
                  <span>Copiar las marcas de tiempo del idioma principal (ideal para subtítulos traducidos)</span>
                </label>
              </div>

              <div class="form-group">
                <label class="checkbox-label" for="check-auto-translate">
                  <input type="checkbox" id="check-auto-translate" />
                  <span>Traducir automáticamente todas las frases desde el original (gratis)</span>
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
                <h2>Configurar Idioma</h2>
                <p class="subtitle">Modificá el nombre visible, código ISO y opciones de la pista</p>
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

              <div class="modal-lang-actions-section">
                ${!activeLang.isMain ? `
                  <button type="button" class="btn btn-sm btn-outline" id="btn-modal-set-lang-main" title="Establecer este idioma como la pista principal original">
                    Hacer Principal
                  </button>
                ` : `
                  <span class="main-lang-indicator-badge" title="Este idioma está configurado como la pista original">
                    ★ Idioma Principal
                  </span>
                `}

                <button
                  type="button"
                  class="btn btn-sm btn-outline btn-danger-outline"
                  id="btn-modal-delete-lang"
                  ${activeLang.isMain ? 'disabled title="El idioma principal no se puede eliminar. Para eliminarlo, primero debes hacer principal a otro idioma."' : 'title="Eliminar esta pista de idioma y sus frases"'}
                >
                  ${iconTrash} Eliminar Idioma
                </button>
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
        <!-- Overlay bloqueante de traducción completa en curso -->
        ${isTranslatingSong ? `
          <div class="modal-backdrop translation-loading-backdrop"></div>
          <div class="translation-loading-dialog" role="dialog" aria-modal="true" aria-label="Traduciendo canción">
            <div class="translation-loading-spinner"></div>
            <div class="translation-loading-content">
              <h3 class="translation-loading-title">${iconSparkles} Traduciendo Canción</h3>
              <p class="translation-loading-desc">${escapeHtml(translatingStatusText || 'Traduciendo todas las frases... Por favor espera.')}</p>
            </div>
          </div>
        ` : ''}
      </div>
    `

    const newScrollEl = containerElement.querySelector('.editor-content-scroll')
    if (newScrollEl) {
      if (previousScrollTop > 0) {
        newScrollEl.scrollTop = previousScrollTop
      } else if (initialScrollLineIndex > 0) {
        const activeCard = newScrollEl.querySelector(`.phrase-editor-card[data-line-idx="${initialScrollLineIndex}"]`)
        if (activeCard && typeof activeCard.scrollIntoView === 'function') {
          activeCard.scrollIntoView({ block: 'center' })
        }
        initialScrollLineIndex = -1
      } else if (expandedLineIndices && expandedLineIndices.size === 1) {
        const activeIdx = Array.from(expandedLineIndices)[0]
        if (activeIdx > 0) {
          const activeCard = newScrollEl.querySelector(`.phrase-editor-card[data-line-idx="${activeIdx}"]`)
          if (activeCard && typeof activeCard.scrollIntoView === 'function') {
            activeCard.scrollIntoView({ block: 'center' })
          }
        }
      }
    }
    const newTabsEl = containerElement.querySelector('.editor-lang-tabs-bar')
    if (newTabsEl && previousTabsScrollLeft > 0) {
      newTabsEl.scrollLeft = previousTabsScrollLeft
    }
    if (typeof window !== 'undefined' && previousWindowScrollY > 0) {
      window.scrollTo(0, previousWindowScrollY)
    }

    bindEvents()
    updateEditorThemePreview()

    const curTime = (mediaPlayer && typeof mediaPlayer.getLyricsTime === 'function')
      ? mediaPlayer.getLyricsTime()
      : ((mediaPlayer && typeof mediaPlayer.getCurrentTime === 'function') ? Math.max(0, mediaPlayer.getCurrentTime()) : 0)
    updateActiveElements(curTime)
  }

  function bindEvents() {
    // Cerrar aviso de estado
    const alertCloseBtn = containerElement.querySelector('#btn-close-editor-alert')
    if (alertCloseBtn) {
      alertCloseBtn.addEventListener('click', () => {
        statusMessage = ''
        const alertEl = containerElement.querySelector('.status-alert')
        if (alertEl) alertEl.remove()
      })
    }

    // 1. Botón Volver
    const backBtn = containerElement.querySelector('#btn-editor-back')
    if (backBtn) {
      backBtn.addEventListener('click', async () => {
        if (autoSaveTimer) {
          clearTimeout(autoSaveTimer)
          autoSaveTimer = null
          await performSave()
        }
        if (documentClickListener) {
          document.removeEventListener('click', documentClickListener)
          documentClickListener = null
        }
        clearActiveElements()
        if (onGoToMenu) onGoToMenu()
      })
    }

    // 2. Metadatos generales
    const titleInput = containerElement.querySelector('#input-song-title')
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        currentSong.title = e.target.value
        const summaryBadge = containerElement.querySelector('.editor-section-summary .summary-badge')
        if (summaryBadge) {
          summaryBadge.textContent = `${e.target.value.trim() || 'Completar datos'} (${(currentSong.videos || []).length} video(s))`
        }
        scheduleAutoSave(400)
      })
      titleInput.addEventListener('change', () => {
        triggerImmediateAutoSave()
      })
    }

    const artistInput = containerElement.querySelector('#input-song-artist')
    if (artistInput) {
      artistInput.addEventListener('input', (e) => {
        currentSong.artist = e.target.value
        scheduleAutoSave(400)
      })
      artistInput.addEventListener('change', () => {
        triggerImmediateAutoSave()
      })
    }

    const genresInput = containerElement.querySelector('#input-song-genres')
    if (genresInput) {
      const handleGenres = (e) => {
        currentSong.genres = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
        scheduleAutoSave(400)
      }
      genresInput.addEventListener('input', handleGenres)
      genresInput.addEventListener('change', () => {
        handleGenres({ target: genresInput })
        triggerImmediateAutoSave()
      })
    }

    const tagsInput = containerElement.querySelector('#input-song-tags')
    if (tagsInput) {
      const handleTags = (e) => {
        currentSong.tags = e.target.value.split(',').map(s => s.trim()).filter(Boolean)
        scheduleAutoSave(400)
      }
      tagsInput.addEventListener('input', handleTags)
      tagsInput.addEventListener('change', () => {
        handleTags({ target: tagsInput })
        triggerImmediateAutoSave()
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
          scheduleAutoSave(400)
        })
        nameInput.addEventListener('change', () => {
          triggerImmediateAutoSave()
        })
      }
      if (urlInput) {
        urlInput.addEventListener('input', (e) => {
          if (currentSong.videos[vIdx]) currentSong.videos[vIdx].url = e.target.value
          scheduleAutoSave(400)
        })
        urlInput.addEventListener('change', () => {
          triggerImmediateAutoSave()
        })
      }
      const applyVideoOffset = (newOffsetVal) => {
        const off = Math.round((Number(newOffsetVal) || 0) * 10) / 10
        if (currentSong.videos[vIdx]) {
          currentSong.videos[vIdx].offset = off
        }
        if (offsetInput && Number(offsetInput.value) !== off) {
          offsetInput.value = String(off)
        }

        // Si este video es el que está activo en mediaPlayer (o no hay otro video activo explícito)
        const activeVidId = mediaPlayer?.getActiveVideoId ? mediaPlayer.getActiveVideoId() : null
        const thisVid = currentSong.videos[vIdx]
        const isThisVideoActive = !activeVidId ||
          (thisVid && String(thisVid.id) === String(activeVidId)) ||
          (!currentSong.videos.some(v => String(v.id) === String(activeVidId)) && vIdx === 0)

        if (isThisVideoActive && typeof mediaPlayer?.setActiveOffset === 'function') {
          mediaPlayer.setActiveOffset(off)
        }

        // Actualizar en tiempo real el reloj, la barra y el resaltado activo de verso y sílaba
        const videoRawTime = (typeof mediaPlayer?.getCurrentTime === 'function')
          ? mediaPlayer.getCurrentTime()
          : 0
        const curLyricsTime = isThisVideoActive
          ? (videoRawTime - off)
          : ((typeof mediaPlayer?.getLyricsTime === 'function') ? mediaPlayer.getLyricsTime() : (videoRawTime - off))

        updateClock(curLyricsTime)
      }

      if (offsetInput) {
        offsetInput.addEventListener('input', (e) => {
          applyVideoOffset(e.target.value)
          scheduleAutoSave(400)
        })
        offsetInput.addEventListener('change', (e) => {
          applyVideoOffset(e.target.value)
          triggerImmediateAutoSave()
        })
      }

      const offsetStepBtns = row.querySelectorAll('.btn-vid-offset-step')
      offsetStepBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault()
          const delta = Number(btn.dataset.delta) || 0
          const currentOff = Number(currentSong.videos[vIdx]?.offset) || 0
          const newOff = Math.round((currentOff + delta) * 10) / 10
          applyVideoOffset(newOff)
          triggerImmediateAutoSave()
        })
      })
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
          triggerImmediateAutoSave()
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
        triggerImmediateAutoSave()
      })
    }

    // 4. Asistente de audio
    const assistantPlayBtn = containerElement.querySelector('#btn-assistant-play')
    if (assistantPlayBtn && mediaPlayer) {
      assistantPlayBtn.addEventListener('click', async () => {
        await mediaPlayer.togglePlay()
        assistantPlayBtn.innerHTML = mediaPlayer.getIsPlaying() ? `${iconPause}` : `${iconPlay}`
      })
    }

    const seekRelButtons = containerElement.querySelectorAll('.btn-seek-rel')
    seekRelButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const delta = Number(btn.dataset.seek)
        if (mediaPlayer) {
          if (typeof mediaPlayer.seekLyricsTime === 'function' && typeof mediaPlayer.getLyricsTime === 'function') {
            const cur = mediaPlayer.getLyricsTime()
            mediaPlayer.seekLyricsTime(cur + delta)
          } else if (typeof mediaPlayer.getCurrentTime === 'function') {
            const cur = mediaPlayer.getCurrentTime()
            mediaPlayer.seek(Math.max(0, cur + delta))
          }
        }
      })
    })

    // Control de volumen y menú vertical
    const volumeBtn = containerElement.querySelector('#btn-editor-volume')
    const volumePopover = containerElement.querySelector('#editor-volume-popover')
    const volumeSlider = containerElement.querySelector('#editor-volume-slider')
    const volumePercent = containerElement.querySelector('#editor-volume-percent')

    if (volumeBtn && volumePopover) {
      volumeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        isVolumeMenuOpen = !isVolumeMenuOpen
        volumePopover.classList.toggle('is-open', isVolumeMenuOpen)
        volumeBtn.classList.toggle('is-active', isVolumeMenuOpen)
      })
    }

    if (volumePopover) {
      volumePopover.addEventListener('click', (e) => {
        e.stopPropagation()
      })
    }

    const sliderTrack = containerElement.querySelector('.editor-volume-slider-track')

    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => {
        const val = Number(e.target.value)
        if (mediaPlayer?.setVolume) {
          mediaPlayer.setVolume(val)
        }
        if (volumePercent) {
          volumePercent.textContent = `${val}%`
        }
        if (volumeBtn) {
          volumeBtn.innerHTML = val === 0 ? iconVolumeMute : iconVolume
          volumeBtn.title = `Volumen: ${val}%`
        }
      })
    }

    if (sliderTrack && volumeSlider) {
      let isDraggingTrack = false

      const updateEditorVolumeFromPointer = (e) => {
        const rect = sliderTrack.getBoundingClientRect()
        if (!rect || rect.height <= 0) return
        const clientY = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : 0)
        const relativeY = rect.bottom - clientY
        const percent = Math.max(0, Math.min(100, Math.round((relativeY / rect.height) * 100)))
        volumeSlider.value = String(percent)
        if (mediaPlayer?.setVolume) {
          mediaPlayer.setVolume(percent)
        }
        if (volumePercent) {
          volumePercent.textContent = `${percent}%`
        }
        if (volumeBtn) {
          volumeBtn.innerHTML = percent === 0 ? iconVolumeMute : iconVolume
          volumeBtn.title = `Volumen: ${percent}%`
        }
      }

      sliderTrack.addEventListener('pointerdown', (e) => {
        e.preventDefault()
        e.stopPropagation()
        isDraggingTrack = true
        try { sliderTrack.setPointerCapture(e.pointerId) } catch (_) {}
        updateEditorVolumeFromPointer(e)
      })

      sliderTrack.addEventListener('pointermove', (e) => {
        if (!isDraggingTrack) return
        e.preventDefault()
        e.stopPropagation()
        updateEditorVolumeFromPointer(e)
      })

      const stopDraggingTrack = (e) => {
        if (isDraggingTrack) {
          isDraggingTrack = false
          try { sliderTrack.releasePointerCapture(e.pointerId) } catch (_) {}
        }
      }

      sliderTrack.addEventListener('pointerup', stopDraggingTrack)
      sliderTrack.addEventListener('pointercancel', stopDraggingTrack)
    }

    // Cerrar menú vertical de volumen al hacer clic en otro lado
    if (documentClickListener) {
      document.removeEventListener('click', documentClickListener)
      documentClickListener = null
    }

    documentClickListener = (e) => {
      if (!isVolumeMenuOpen) return
      const wrapper = containerElement.querySelector('#editor-volume-wrapper')
      if (wrapper && !wrapper.contains(e.target)) {
        isVolumeMenuOpen = false
        const popover = containerElement.querySelector('#editor-volume-popover')
        if (popover) popover.classList.remove('is-open')
        const btn = containerElement.querySelector('#btn-editor-volume')
        if (btn) btn.classList.remove('is-active')
      }
    }
    document.addEventListener('click', documentClickListener)

    // Barra de progreso interactiva con tiempo
    const progressSlider = containerElement.querySelector('#editor-progress-slider')
    const progressCurrent = containerElement.querySelector('#editor-progress-current')

    if (progressSlider) {
      progressSlider.addEventListener('mousedown', () => {
        isUserSeeking = true
      })
      progressSlider.addEventListener('touchstart', () => {
        isUserSeeking = true
      }, { passive: true })

      progressSlider.addEventListener('input', (e) => {
        isUserSeeking = true
        const val = Number(e.target.value)
        if (progressCurrent) {
          progressCurrent.textContent = formatTime(val)
        }
        const clockEl = containerElement.querySelector('#assistant-clock-time')
        if (clockEl) {
          clockEl.textContent = formatTime(val, true)
        }
        updateActiveElements(val)
      })

      progressSlider.addEventListener('change', (e) => {
        const val = Number(e.target.value)
        if (typeof mediaPlayer?.seekLyricsTime === 'function') {
          mediaPlayer.seekLyricsTime(val)
        } else if (typeof mediaPlayer?.seek === 'function') {
          mediaPlayer.seek(val)
        }
        isUserSeeking = false
      })

      progressSlider.addEventListener('mouseup', () => {
        isUserSeeking = false
      })
      progressSlider.addEventListener('touchend', () => {
        isUserSeeking = false
      })
    }

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

    const setLangMainBtn = containerElement.querySelector('#btn-modal-set-lang-main') || containerElement.querySelector('#btn-set-lang-main')
    if (setLangMainBtn) {
      setLangMainBtn.addEventListener('click', () => {
        const nameInput = containerElement.querySelector('#input-edit-lang-name')
        const codeInput = containerElement.querySelector('#input-edit-lang-code')
        const activeLang = getActiveLanguage()
        if (nameInput && nameInput.value.trim() && activeLang) {
          activeLang.name = nameInput.value.trim()
        }
        if (codeInput && codeInput.value.trim() && activeLang) {
          activeLang.code = codeInput.value.trim().toLowerCase()
        }

        const langs = currentSong.lyrics_data.languages
        langs.forEach((l, idx) => {
          l.isMain = idx === activeLangIndex
        })
        showStatus(`"${langs[activeLangIndex].name}" establecido como Idioma Principal.`, 'success')
        triggerImmediateAutoSave()
      })
    }

    const deleteActiveLangBtn = containerElement.querySelector('#btn-modal-delete-lang') || containerElement.querySelector('#btn-delete-active-lang')
    if (deleteActiveLangBtn) {
      deleteActiveLangBtn.addEventListener('click', () => {
        const activeLang = getActiveLanguage()
        if (activeLang?.isMain) return
        if (window.confirm(`¿Seguro que deseas eliminar el idioma "${activeLang?.name}"?`)) {
          currentSong.lyrics_data.languages.splice(activeLangIndex, 1)
          activeLangIndex = 0
          isEditLanguageModalOpen = false
          showStatus('Idioma eliminado.', 'info')
          triggerImmediateAutoSave()
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
      triggerImmediateAutoSave()
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
            triggerImmediateAutoSave()
          }
        })
      }

      const translateRefBtn = card.querySelector('.btn-translate-ref-line')
      if (translateRefBtn) {
        translateRefBtn.addEventListener('click', async () => {
          const refLine = mainLang?.lines?.[lIdx]
          if (!refLine || !refLine.text || !refLine.text.trim()) {
            showStatus('El verso original está vacío o es una pausa instrumental.', 'info')
            return
          }

          translateRefBtn.disabled = true
          translateRefBtn.textContent = 'Traduciendo...'

          try {
            const targetLang = activeLang.code || 'es'
            const sourceLang = mainLang?.code || 'auto'
            const translatedText = await translatePhrase(refLine.text, targetLang, sourceLang)

            if (translatedText) {
              line.text = translatedText
              line.syllables = []
              render()
              showStatus(`Verso #${lIdx + 1} traducido automáticamente a "${activeLang.name}".`, 'success')
              triggerImmediateAutoSave()
            } else {
              showStatus(`No se pudo traducir el verso #${lIdx + 1}.`, 'error')
              translateRefBtn.disabled = false
              translateRefBtn.textContent = 'Traducir'
            }
          } catch (err) {
            console.error('Error al traducir verso:', err)
            showStatus('Error de red al intentar traducir el verso.', 'error')
            translateRefBtn.disabled = false
            translateRefBtn.textContent = 'Traducir'
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
          scheduleAutoSave(400)
        })
        textInput.addEventListener('change', () => {
          triggerImmediateAutoSave()
        })
      }

      if (altInput) {
        altInput.addEventListener('input', (e) => {
          line.altText = e.target.value
          scheduleAutoSave(400)
        })
        altInput.addEventListener('change', () => {
          triggerImmediateAutoSave()
        })
      }

      if (startInput) {
        startInput.addEventListener('input', (e) => {
          line.startTime = Number(e.target.value) || 0
          scheduleAutoSave(400)
        })
        startInput.addEventListener('change', () => {
          triggerImmediateAutoSave()
        })
      }

      if (endInput) {
        endInput.addEventListener('input', (e) => {
          line.endTime = Number(e.target.value) || 0
          scheduleAutoSave(400)
        })
        endInput.addEventListener('change', () => {
          triggerImmediateAutoSave()
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
            triggerImmediateAutoSave()
          }
        })
      }

      if (captureEndBtn) {
        captureEndBtn.addEventListener('click', () => {
          if (mediaPlayer) {
            const cur = Math.max(0, mediaPlayer.getCurrentTime())
            line.endTime = +cur.toFixed(2)
            render()
            triggerImmediateAutoSave()
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
        toggleSyllablesBtn.addEventListener('click', (e) => {
          e.preventDefault()
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
          triggerImmediateAutoSave()
        })
      }

      if (moveDownBtn && lIdx < lines.length - 1) {
        moveDownBtn.addEventListener('click', () => {
          const temp = lines[lIdx]
          lines[lIdx] = lines[lIdx + 1]
          lines[lIdx + 1] = temp
          render()
          triggerImmediateAutoSave()
        })
      }

      if (deleteLineBtn) {
        deleteLineBtn.addEventListener('click', () => {
          lines.splice(lIdx, 1)
          expandedLineIndices.delete(lIdx)
          render()
          triggerImmediateAutoSave()
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
          triggerImmediateAutoSave()
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
          triggerImmediateAutoSave()
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
          triggerImmediateAutoSave()
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
          triggerImmediateAutoSave()
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
          triggerImmediateAutoSave()
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
            scheduleAutoSave(400)
          })
          sTextInput.addEventListener('change', () => {
            triggerImmediateAutoSave()
          })
        }
        if (sAltInput) {
          sAltInput.addEventListener('input', (e) => {
            syl.altText = e.target.value
            scheduleAutoSave(400)
          })
          sAltInput.addEventListener('change', () => {
            triggerImmediateAutoSave()
          })
        }
        if (sStartInput) {
          sStartInput.addEventListener('input', (e) => {
            syl.startTime = Number(e.target.value) || 0
            scheduleAutoSave(400)
          })
          sStartInput.addEventListener('change', () => {
            triggerImmediateAutoSave()
          })
        }
        if (sDurInput) {
          sDurInput.addEventListener('input', (e) => {
            syl.duration = Number(e.target.value) || 0.1
            scheduleAutoSave(400)
          })
          sDurInput.addEventListener('change', () => {
            triggerImmediateAutoSave()
          })
        }
        if (sCaptureBtn) {
          sCaptureBtn.addEventListener('click', () => {
            if (mediaPlayer) {
              const cur = Math.max(0, mediaPlayer.getCurrentTime())
              syl.startTime = +cur.toFixed(2)
              render()
              triggerImmediateAutoSave()
            }
          })
        }
        if (sRemoveBtn) {
          sRemoveBtn.addEventListener('click', () => {
            line.syllables.splice(sIdx, 1)
            render()
            triggerImmediateAutoSave()
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
        triggerImmediateAutoSave()
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
        triggerImmediateAutoSave()
      })
    }

    // Auto-traducir toda la canción desde el idioma principal al idioma activo
    const handleAutoTranslateAll = async () => {
      if (!mainLang || !mainLang.lines || mainLang.lines.length === 0) {
        showStatus('No hay versos originales en el idioma principal para traducir.', 'info')
        return
      }

      const confirmMsg = `¿Deseas traducir automáticamente todas las frases de "${mainLang.name}" a "${activeLang.name}"?\n(Se conservarán los tiempos y pausas instrumentales)`
      if (typeof window !== 'undefined' && window.confirm && !window.confirm(confirmMsg)) {
        return
      }

      isTranslatingSong = true
      translatingStatusText = `Traduciendo toda la canción a "${activeLang.name}"... Por favor espera.`
      render()

      try {
        const originalTexts = mainLang.lines.map(l => l.text || '')
        const targetLang = activeLang.code || 'es'
        const sourceLang = mainLang?.code || 'auto'

        const { translatedLines } = await translateLines(originalTexts, targetLang, sourceLang)

        let translatedCount = 0
        activeLang.lines = mainLang.lines.map((origL, idx) => {
          const transText = translatedLines[idx] || ''
          if (transText.trim().length > 0) {
            translatedCount++
          }
          return {
            id: activeLang.lines?.[idx]?.id || `line-${activeLang.code}-${Date.now()}-${idx}`,
            startTime: origL.startTime,
            endTime: origL.endTime,
            text: transText,
            syllables: [] // Desactivado silabeo automático al traducir
          }
        })
        activeLang.plain = activeLang.lines.map(l => l.text).join('\n')

        showStatus(`¡Canción traducida con éxito! Se tradujeron ${translatedCount} frases a "${activeLang.name}".`, 'success')
      } catch (err) {
        console.error('Error al traducir canción completa:', err)
        showStatus('Error al traducir la canción. Comprueba tu conexión a internet.', 'error')
      } finally {
        isTranslatingSong = false
        translatingStatusText = ''
        render()
        triggerImmediateAutoSave()
      }
    }

    const autoTranslateAllBtns = containerElement.querySelectorAll('.btn-auto-translate-all')
    autoTranslateAllBtns.forEach(btn => {
      btn.addEventListener('click', handleAutoTranslateAll)
    })

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
        expandedLineIndices = new Set()
        isQuickImportModalOpen = false
        render()
        showStatus(`¡Se generaron ${generatedLines.length} versos exitosamente para "${activeLang.name}"!`, 'success')
        triggerImmediateAutoSave()
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

    const autoTranslateCheck = containerElement.querySelector('#check-auto-translate')
    const copyTimingsCheck = containerElement.querySelector('#check-copy-timings')
    if (autoTranslateCheck && copyTimingsCheck) {
      autoTranslateCheck.addEventListener('change', () => {
        if (autoTranslateCheck.checked) {
          copyTimingsCheck.checked = true
        }
      })
    }

    const confirmAddLangBtn = containerElement.querySelector('#btn-confirm-add-lang')
    if (confirmAddLangBtn) {
      confirmAddLangBtn.addEventListener('click', async () => {
        const nameInput = containerElement.querySelector('#input-new-lang-name')
        const codeInput = containerElement.querySelector('#input-new-lang-code')
        const copyCheck = containerElement.querySelector('#check-copy-timings')
        const autoCheck = containerElement.querySelector('#check-auto-translate')

        const name = (nameInput?.value || '').trim()
        const code = (codeInput?.value || '').trim().toLowerCase()
        const shouldCopy = copyCheck?.checked ?? true
        const shouldAutoTranslate = autoCheck?.checked ?? false

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

        const mainLang = currentSong.lyrics_data.languages.find(l => l.isMain) || currentSong.lyrics_data.languages[0]

        let newLines = []
        if (shouldAutoTranslate && mainLang && Array.isArray(mainLang.lines) && mainLang.lines.length > 0) {
          isAddLanguageModalOpen = false
          isTranslatingSong = true
          translatingStatusText = `Traduciendo canción a "${name}"... Por favor espera.`
          render()

          try {
            const originalTexts = mainLang.lines.map(l => l.text || '')
            const { translatedLines } = await translateLines(originalTexts, code, mainLang.code)
            let translatedCount = 0

            newLines = mainLang.lines.map((origL, i) => {
              const transText = translatedLines[i] || ''
              if (transText.trim().length > 0) {
                translatedCount++
              }
              return {
                id: `line-${code}-${Date.now()}-${i}`,
                text: transText,
                startTime: origL.startTime,
                endTime: origL.endTime,
                syllables: [] // Desactivado silabeo automático al traducir
              }
            })

            const newLang = {
              code,
              name,
              isMain: false,
              plain: newLines.map(l => l.text).join('\n'),
              lines: newLines
            }

            currentSong.lyrics_data.languages.push(newLang)
            activeLangIndex = currentSong.lyrics_data.languages.length - 1
            showStatus(`Nuevo idioma "${name}" [${code}] añadido y ${translatedCount} frases traducidas automáticamente.`, 'success')
            triggerImmediateAutoSave()
            return
          } catch (err) {
            console.error('Error al autotraducir al añadir idioma:', err)
            showStatus('Error al traducir automáticamente.', 'error')
          } finally {
            isTranslatingSong = false
            translatingStatusText = ''
            render()
          }
        }

        if (shouldCopy && mainLang && Array.isArray(mainLang.lines)) {
          newLines = mainLang.lines.map((l, i) => ({
            id: `line-${code}-${Date.now()}-${i}`,
            text: '', // Letra a traducir
            startTime: l.startTime,
            endTime: l.endTime,
            syllables: []
          }))
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
        render()
        showStatus(`Nuevo idioma "${name}" [${code}] añadido con éxito.`, 'success')
        triggerImmediateAutoSave()
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
          render()
          showStatus(`Idioma actualizado correctamente: "${newName}" [${newCode}].`, 'success')
          triggerImmediateAutoSave()
        }
      })
    }

    // Exportar JSON desde el editor
    const editorExportJsonBtn = containerElement.querySelector('#btn-editor-export-json')
    if (editorExportJsonBtn) {
      editorExportJsonBtn.addEventListener('click', async () => {
        try {
          const songId = await handleSaveSong(false, false)
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
          const songId = await handleSaveSong(false, false)
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

    // 9. Acordeones y Tema Visual Personalizado de la Canción
    const metaDetails = containerElement.querySelector('#editor-metadata-details')
    if (metaDetails) {
      metaDetails.addEventListener('toggle', () => {
        isMetadataOpen = metaDetails.open
      })
    }

    const themeDetails = containerElement.querySelector('#editor-theme-details')
    if (themeDetails) {
      themeDetails.addEventListener('toggle', () => {
        isThemeSectionOpen = themeDetails.open
      })
    }

    const toggleSongThemeCb = containerElement.querySelector('#check-enable-song-custom-theme')
    if (toggleSongThemeCb) {
      toggleSongThemeCb.addEventListener('change', (e) => {
        if (e.target.checked) {
          currentSong.lyrics_data = currentSong.lyrics_data || {}
          currentSong.lyrics_data.customTheme = { ...DEFAULT_THEME, ...getThemeSettings() }
          isThemeSectionOpen = true
        } else {
          if (currentSong.lyrics_data) {
            delete currentSong.lyrics_data.customTheme
          }
        }
        render()
        triggerImmediateAutoSave()
      })
    }

    // Presets de tema para la canción
    const presetBtns = containerElement.querySelectorAll('.btn-editor-theme-preset')
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetId = btn.dataset.presetId
        const preset = THEME_PRESETS.find(p => p.id === presetId)
        if (preset) {
          currentSong.lyrics_data = currentSong.lyrics_data || {}
          currentSong.lyrics_data.customTheme = { ...DEFAULT_THEME, ...preset.settings }
          render()
          triggerImmediateAutoSave()
        }
      })
    })

    // Copiar tema global
    const copyGlobalThemeBtn = containerElement.querySelector('#btn-editor-copy-global-theme')
    if (copyGlobalThemeBtn) {
      copyGlobalThemeBtn.addEventListener('click', () => {
        currentSong.lyrics_data = currentSong.lyrics_data || {}
        currentSong.lyrics_data.customTheme = { ...DEFAULT_THEME, ...getThemeSettings() }
        render()
        triggerImmediateAutoSave()
      })
    }

    // Restablecer tema de la canción
    const resetSongThemeBtn = containerElement.querySelector('#btn-editor-reset-song-theme')
    if (resetSongThemeBtn) {
      resetSongThemeBtn.addEventListener('click', () => {
        currentSong.lyrics_data = currentSong.lyrics_data || {}
        currentSong.lyrics_data.customTheme = { ...DEFAULT_THEME }
        render()
        triggerImmediateAutoSave()
      })
    }

    function updateSongThemeSetting(key, val) {
      if (!currentSong) return
      if (!currentSong.lyrics_data) currentSong.lyrics_data = {}
      if (!currentSong.lyrics_data.customTheme) {
        currentSong.lyrics_data.customTheme = { ...DEFAULT_THEME, ...getThemeSettings() }
      }
      currentSong.lyrics_data.customTheme[key] = val
      updateEditorThemePreview()
      scheduleAutoSave(400)
    }

    function bindSongThemeColor(pickerId, hexId, key) {
      const picker = containerElement.querySelector(pickerId)
      const hex = containerElement.querySelector(hexId)
      if (picker && hex) {
        picker.addEventListener('input', (e) => {
          hex.value = e.target.value
          updateSongThemeSetting(key, e.target.value)
        })
        hex.addEventListener('input', (e) => {
          let v = e.target.value.trim()
          if (!v.startsWith('#')) v = '#' + v
          if (/^#[0-9a-fA-F]{6}$/.test(v)) {
            picker.value = v
            updateSongThemeSetting(key, v)
          }
        })
      }
    }

    function bindSongThemeSlider(sliderId, badgeId, key) {
      const slider = containerElement.querySelector(sliderId)
      const badge = containerElement.querySelector(badgeId)
      if (slider && badge) {
        slider.addEventListener('input', (e) => {
          const val = Number(e.target.value)
          badge.textContent = `${val}%`
          updateSongThemeSetting(key, val)
        })
      }
    }

    function bindSongThemeCheckbox(checkId, key) {
      const cb = containerElement.querySelector(checkId)
      if (cb) {
        cb.addEventListener('change', (e) => {
          updateSongThemeSetting(key, Boolean(e.target.checked))
        })
      }
    }

    // 4 Colores de Interfaz
    bindSongThemeColor('#picker-song-bg-color', '#hex-song-bg-color', 'bgColor')
    bindSongThemeColor('#picker-song-panel-bg', '#hex-song-panel-bg', 'panelBg')
    bindSongThemeColor('#picker-song-primary-color', '#hex-song-primary-color', 'primaryColor')
    bindSongThemeColor('#picker-song-text-main', '#hex-song-text-main', 'textMain')

    // Sliders de tamaño
    bindSongThemeSlider('#slider-song-lyrics-scale', '#badge-song-lyrics-scale', 'lyricsScale')
    bindSongThemeSlider('#slider-song-translation-scale', '#badge-song-translation-scale', 'translationScale')
    bindSongThemeSlider('#slider-song-alt-scale', '#badge-song-alt-scale', 'altScale')

    // Colores y estilos de letra
    bindSongThemeColor('#picker-song-orig-color', '#hex-song-orig-color', 'originalColor')
    bindSongThemeColor('#picker-song-alt-color', '#hex-song-alt-color', 'altColor')
    bindSongThemeColor('#picker-song-trans-color', '#hex-song-trans-color', 'translationColor')
    bindSongThemeColor('#picker-song-active-color', '#hex-song-active-color', 'activeColor')
    bindSongThemeColor('#picker-song-completed-color', '#hex-song-completed-color', 'completedColor')

    bindSongThemeCheckbox('#check-song-orig-bold', 'originalBold')
    bindSongThemeCheckbox('#check-song-orig-italic', 'originalItalic')
    bindSongThemeCheckbox('#check-song-alt-bold', 'altBold')
    bindSongThemeCheckbox('#check-song-alt-italic', 'altItalic')
    bindSongThemeCheckbox('#check-song-trans-bold', 'translationBold')
    bindSongThemeCheckbox('#check-song-trans-italic', 'translationItalic')
    bindSongThemeCheckbox('#check-song-active-bold', 'activeBold')
    bindSongThemeCheckbox('#check-song-active-italic', 'activeItalic')
    bindSongThemeCheckbox('#check-song-active-glow', 'activeGlow')
    bindSongThemeCheckbox('#check-song-completed-bold', 'completedBold')
    bindSongThemeCheckbox('#check-song-completed-italic', 'completedItalic')

    // Alertas de estado
    bindSongThemeColor('#picker-song-alert-success', '#hex-song-alert-success', 'alertSuccessColor')
    bindSongThemeColor('#picker-song-alert-info', '#hex-song-alert-info', 'alertInfoColor')
    bindSongThemeColor('#picker-song-alert-error', '#hex-song-alert-error', 'alertErrorColor')
  }

  function updateAutoSaveIndicator(state) {
    const badge = containerElement?.querySelector('#editor-autosave-badge')
    if (!badge) return
    const textEl = badge.querySelector('.autosave-text')
    badge.classList.remove('is-saving', 'is-error')
    if (state === 'saving') {
      badge.classList.add('is-saving')
      badge.title = 'Guardando...'
      if (textEl) textEl.textContent = 'Guardando...'
    } else if (state === 'error') {
      badge.classList.add('is-error')
      badge.title = 'Error al guardar'
      if (textEl) textEl.textContent = 'Error al guardar'
    } else {
      badge.title = 'Guardado'
      if (textEl) textEl.textContent = 'Guardado'
    }
  }

  function getSongDataToSave() {
    if (!currentSong) return null
    const titleDom = containerElement?.querySelector('#input-song-title')?.value
    const artistDom = containerElement?.querySelector('#input-song-artist')?.value
    if (titleDom !== undefined) currentSong.title = titleDom
    if (artistDom !== undefined) currentSong.artist = artistDom

    const title = (currentSong.title && currentSong.title.trim()) || 'Sin Título'
    const artist = (currentSong.artist && currentSong.artist.trim()) || 'Artista Desconocido'

    return {
      ...currentSong,
      title,
      artist,
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
        languages: (currentSong.lyrics_data?.languages || []).map(l => ({
          ...l,
          plain: (l.lines || []).map(line => line.text || '').join('\n'),
          lines: (l.lines || []).map((line, lIdx) => ({
            id: line.id || `line-${l.code}-${lIdx}`,
            text: line.text || '',
            altText: String(line.altText || line.romaji || '').trim(),
            startTime: Number(line.startTime) || 0,
            endTime: Number(line.endTime) || (Number(line.startTime || 0) + 3),
            syllables: l.isMain
              ? (line.syllables || []).map((syl, sIdx) => ({
                  id: syl.id || `syl-${lIdx}-${sIdx}`,
                  text: syl.text || '',
                  altText: String(syl.altText || syl.romaji || ''),
                  startTime: Number(syl.startTime) || 0,
                  duration: Number(syl.duration) || 0.3
                }))
              : []
          }))
        }))
      }
    }
  }

  async function performSave() {
    if (!currentSong) return null
    const songData = getSongDataToSave()
    if (!songData) return null

    updateAutoSaveIndicator('saving')
    isSaving = true

    try {
      const savedId = await saveSong(songData)
      currentSong.id = savedId
      currentSong.artist = songData.artist
      if (!currentSong.title) {
        currentSong.title = songData.title
      }

      const subheadingEl = containerElement?.querySelector('.editor-subheading')
      if (subheadingEl) {
        subheadingEl.textContent = `Artista: ${escapeHtml(currentSong.artist)} | ID: ${currentSong.id}`
      }

      updateAutoSaveIndicator('saved')

      if (onSongSaved) {
        await onSongSaved(savedId)
      }
      return savedId
    } catch (err) {
      console.error('Error al guardar automáticamente:', err)
      updateAutoSaveIndicator('error')
      return null
    } finally {
      isSaving = false
      if (pendingSave) {
        pendingSave = false
        performSave()
      }
    }
  }

  function scheduleAutoSave(debounceMs = 400) {
    updateAutoSaveIndicator('saving')
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
    }
    autoSaveTimer = setTimeout(() => {
      autoSaveTimer = null
      if (isSaving) {
        pendingSave = true
      } else {
        performSave()
      }
    }, debounceMs)
  }

  async function triggerImmediateAutoSave() {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
    if (isSaving) {
      pendingSave = true
      return null
    }
    return await performSave()
  }

  async function handleSaveSong(enterLyricsAfter = false, showSuccessNotice = true) {
    if (autoSaveTimer) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }

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

    const savedId = await performSave()
    if (!savedId) return null

    if (showSuccessNotice) {
      showStatus(`¡Canción "${currentSong.title}" guardada exitosamente!`, 'success')
    }

    if (enterLyricsAfter && onEnterLyricsMode) {
      if (documentClickListener) {
        document.removeEventListener('click', documentClickListener)
        documentClickListener = null
      }
      clearActiveElements()
      onEnterLyricsMode(savedId)
    }

    return savedId
  }

  let cachedAssistantClock = null
  let cachedEditorSlider = null
  let cachedEditorCurrent = null
  let cachedEditorDuration = null
  let lastEditorSec = -1

  // Actualización del reloj del asistente en tiempo real si el reproductor está activo
  function updateClock(time) {
    if (!containerElement) return
    const safeTime = Math.max(0, time)

    if (!cachedAssistantClock || !containerElement.contains(cachedAssistantClock)) {
      cachedAssistantClock = containerElement.querySelector('#assistant-clock-time')
      cachedEditorSlider = containerElement.querySelector('#editor-progress-slider')
      cachedEditorCurrent = containerElement.querySelector('#editor-progress-current')
      cachedEditorDuration = containerElement.querySelector('#editor-progress-duration')
    }

    if (cachedAssistantClock) {
      cachedAssistantClock.textContent = formatTime(safeTime, true)
    }

    if (!isUserSeeking) {
      const dur = mediaPlayer?.getDuration ? mediaPlayer.getDuration() : 0
      if (cachedEditorSlider) {
        cachedEditorSlider.max = String(Math.max(1, dur))
        cachedEditorSlider.value = String(safeTime)
      }
      const floorSec = Math.floor(safeTime)
      if (floorSec !== lastEditorSec) {
        lastEditorSec = floorSec
        if (cachedEditorCurrent) {
          cachedEditorCurrent.textContent = formatTime(safeTime)
        }
        if (cachedEditorDuration) {
          cachedEditorDuration.textContent = formatTime(dur)
        }
      }
    }

    // Resaltado reactivo del verso y sílaba actual marcados por el asistente
    updateActiveElements(safeTime)
  }

  function setPlayingState(playing) {
    const assistantPlayBtn = containerElement?.querySelector('#btn-assistant-play')
    if (assistantPlayBtn) {
      assistantPlayBtn.innerHTML = playing ? `${iconPause}` : `${iconPlay}`
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
    setPlayingState,
    flushAutoSave: triggerImmediateAutoSave,
    getCurrentSong: () => currentSong,
    destroy: () => {
      if (documentClickListener) {
        document.removeEventListener('click', documentClickListener)
        documentClickListener = null
      }
      clearActiveElements()
    },
    clearStatus: () => {
      statusMessage = ''
      const alertEl = containerElement?.querySelector('.status-alert')
      if (alertEl) alertEl.remove()
    }
  }
}
