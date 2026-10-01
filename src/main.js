import './style.css'
import { getDB } from './services/db.js'
import { listSongs, fetchSongById } from './services/songService.js'
import { applyTheme } from './services/themeService.js'
import { createMediaPlayer } from './player/mediaPlayer.js'
import { createLanguageManager } from './lyrics/languageManager.js'
import { createBasicViewer } from './views/basicViewer.js'
import { createAdvancedViewer } from './views/advancedViewer.js'
import { createControlsView } from './views/controlsView.js'
import { createSongMenuView } from './views/songMenuView.js'
import { createVideoManagerModal } from './views/videoManagerModal.js'
import { createOnlineLyricsModal } from './views/onlineLyricsModal.js'
import { createThemeSettingsModal } from './views/themeSettingsModal.js'
import { createSongEditorView } from './views/songEditorView.js'
import { iconArrowLeft, iconPalette } from './views/icons.js'

async function initApp() {
  // Aplicar tema guardado inmediatamente
  applyTheme()

  const appContainer = document.querySelector('#app')
  if (!appContainer) return

  // 1. Estructura HTML base de la aplicación
  appContainer.innerHTML = `
    <!-- Encabezado Global -->
    <header class="app-header">
      <div class="brand-section">
        <h1 class="brand-title">SarangaBaranga</h1>
        <span class="badge-mode" id="app-mode-badge">Modo Sencillo</span>
      </div>

      <div class="song-header-info" id="song-header-info">
        <h2 class="current-song-title" id="header-song-title">Menú de Selección de Canciones</h2>
        <span class="current-song-artist" id="header-song-artist"></span>
      </div>

      <div class="header-actions">
        <button class="btn btn-outline btn-sm" id="btn-header-theme" title="Personalizar temas, tamaños de letra y colores">
          ${iconPalette} Temas
        </button>
        <button class="btn btn-outline btn-sm btn-header-nav" id="btn-header-back-menu" style="display: none;">
          ${iconArrowLeft} Menú de Canciones
        </button>
      </div>
    </header>

    <!-- Lienzo de Efectos de Modo Avanzado -->
    <div id="advanced-stage-container"></div>

    <!-- Host de Audio de YouTube (100% invisible en pantalla, solo audio) -->
    <div id="youtube-player-container" class="youtube-audio-host"></div>

    <!-- Pantalla 1: Menú de Selección de Canciones -->
    <section class="screen-view screen-menu" id="menu-screen"></section>

    <!-- Pantalla 2: Modo Letra (Visualización y Controles) -->
    <section class="screen-view screen-lyrics" id="lyrics-screen" style="display: none;">
      <main class="main-stage-container">
        <!-- Visor de Letras Sincronizadas -->
        <section class="lyrics-stage-viewport" id="lyrics-viewport"></section>
      </main>

      <!-- Barra Inferior de Controles -->
      <footer class="controls-dock" id="controls-dock"></footer>
    </section>

    <!-- Pantalla 3: Menú de Creación y Edición de Letras -->
    <section class="screen-view screen-editor" id="editor-screen" style="display: none;"></section>

    <!-- Modal de Gestión de Videos y Offsets -->
    <div class="modal-container" id="video-modal"></div>

    <!-- Modal de Búsqueda de BetterLyrics -->
    <div class="modal-container" id="betterlyrics-modal"></div>

    <!-- Modal de Configuración de Temas y Visualización -->
    <div class="modal-container" id="theme-modal"></div>
  `

  // 2. Elementos del DOM
  const headerTitleEl = document.querySelector('#header-song-title')
  const headerArtistEl = document.querySelector('#header-song-artist')
  const modeBadgeEl = document.querySelector('#app-mode-badge')
  const btnHeaderTheme = document.querySelector('#btn-header-theme')
  const btnHeaderBackMenu = document.querySelector('#btn-header-back-menu')
  const menuScreenEl = document.querySelector('#menu-screen')
  const lyricsScreenEl = document.querySelector('#lyrics-screen')
  const editorScreenEl = document.querySelector('#editor-screen')
  const lyricsViewportEl = document.querySelector('#lyrics-viewport')
  const controlsDockEl = document.querySelector('#controls-dock')
  const videoModalEl = document.querySelector('#video-modal')
  const betterlyricsModalEl = document.querySelector('#betterlyrics-modal')
  const themeModalEl = document.querySelector('#theme-modal')
  const advancedStageEl = document.querySelector('#advanced-stage-container')

  // 3. Estado de la aplicación
  let currentSong = null
  let currentMode = 'basic'
  let currentScreen = 'menu' // 'menu' | 'lyrics' | 'editor'

  const savedPreviewLines = localStorage.getItem('saranga_preview_lines')
  const initialPreviewLines = (savedPreviewLines !== null && !isNaN(Number(savedPreviewLines)))
    ? Math.max(0, Math.min(3, Number(savedPreviewLines)))
    : 2

  const languageManager = createLanguageManager([])
  const basicViewer = createBasicViewer(lyricsViewportEl, {
    initialPreviewCount: initialPreviewLines,
    onSeekLine: (seconds) => mediaPlayer.seek(seconds)
  })
  const advancedViewer = createAdvancedViewer(advancedStageEl)

  // 4. Inicializar Reproductor Multimedia (Master Clock)
  const mediaPlayer = createMediaPlayer({
    containerId: 'youtube-player-container',
    onTimeUpdate: (currentTime) => {
      controlsView.setTime(currentTime)
      basicViewer.updateTime(currentTime)
      songEditorView.updateClock(currentTime)
    },
    onStateChange: () => {
      controlsView.setPlayingState(mediaPlayer.getIsPlaying())
      songEditorView.setPlayingState(mediaPlayer.getIsPlaying())
    },
    onDurationChange: (duration) => {
      controlsView.setDuration(duration)
    }
  })

  // 5. Inicializar Modal de Gestión de Videos y Offsets
  const videoManagerModal = createVideoManagerModal({
    containerElement: videoModalEl,
    onVideosUpdated: async (songId, updatedVideos) => {
      songMenuView.refresh()
      if (currentSong && Number(currentSong.id) === Number(songId)) {
        currentSong.videos = updatedVideos
        await mediaPlayer.loadSong(currentSong, mediaPlayer.getActiveVideoId())
        controlsView.setVideosState({
          videos: updatedVideos,
          activeId: mediaPlayer.getActiveVideoId()
        })
      }
    }
  })

  // 5b. Inicializar Modal de Búsqueda Online (BetterLyrics / Genius / LRCLIB)
  const onlineLyricsModal = createOnlineLyricsModal({
    containerElement: betterlyricsModalEl,
    onSongReady: (songPackage) => {
      showEditorScreen(songPackage)
    }
  })

  // 5c. Inicializar Modal de Configuración de Temas y Visualización
  const themeSettingsModal = createThemeSettingsModal({
    containerElement: themeModalEl,
    onThemeChanged: () => {
      // Las variables CSS se actualizan reactivamente en :root
    }
  })

  if (btnHeaderTheme) {
    btnHeaderTheme.addEventListener('click', () => {
      themeSettingsModal.open()
    })
  }

  // 6. Inicializar Editor de Letras y Creaciones
  const songEditorView = createSongEditorView({
    containerElement: editorScreenEl,
    mediaPlayer,
    onSongSaved: async (savedId) => {
      await songMenuView.refresh()
      const updated = await fetchSongById(savedId)
      if (updated && currentSong && Number(currentSong.id) === Number(savedId)) {
        currentSong = updated
      }
    },
    onGoToMenu: () => showMenuScreen(),
    onEnterLyricsMode: async (savedId) => {
      await loadSongIntoApp(savedId)
      showLyricsScreen()
    }
  })

  // 7. Inicializar Barra de Controles (Modo Letra)
  const controlsView = createControlsView({
    containerElement: controlsDockEl,
    initialPreviewLines,
    initialVolume: mediaPlayer.getVolume(),
    onPlayToggle: () => mediaPlayer.togglePlay(),
    onSeek: (seconds) => mediaPlayer.seek(seconds),
    onVolumeChange: (vol) => mediaPlayer.setVolume(vol),
    onVideoChange: (videoId) => {
      mediaPlayer.setVideo(videoId)
      controlsView.setVideosState({
        videos: mediaPlayer.getVideos(),
        activeId: videoId
      })
      controlsView.setDuration(mediaPlayer.getDuration())
    },
    onManageVideos: () => {
      if (currentSong) {
        videoManagerModal.open(currentSong)
      }
    },
    onTranslationChange: (langCode) => languageManager.setTranslationLanguage(langCode),
    onPreviewLinesChange: (count) => {
      basicViewer.setPreviewCount(count)
    },
    onModeToggle: (newMode) => switchMode(newMode),
    onGoToMenu: () => showMenuScreen(),
    onEditSong: () => {
      if (currentSong) {
        showEditorScreen(currentSong)
      }
    },
    onOpenTheme: () => {
      themeSettingsModal.open()
    }
  })

  // 8. Inicializar Menú de Selección de Canciones
  const songMenuView = createSongMenuView({
    containerElement: menuScreenEl,
    onEnterLyricsMode: async (songId) => {
      await loadSongIntoApp(songId)
      showLyricsScreen()
    },
    onManageVideos: (song) => {
      videoManagerModal.open(song)
    },
    onCreateNewSong: () => {
      showEditorScreen(null)
    },
    onSearchOnlineLyrics: () => {
      onlineLyricsModal.open()
    },
    onSearchBetterLyrics: () => {
      onlineLyricsModal.open()
    },
    onEditSong: (song) => {
      showEditorScreen(song)
    }
  })

  // 9. Reaccionar a cambios en idiomas
  languageManager.subscribe(({ activeLanguage, translationLanguage, isBilingual, availableLanguages }) => {
    controlsView.setLanguagesState({
      languages: availableLanguages,
      active: activeLanguage,
      translation: translationLanguage,
      bilingual: isBilingual
    })

    if (currentSong && activeLanguage) {
      const transLines = isBilingual && translationLanguage ? translationLanguage.lines : []
      basicViewer.setLyrics({
        lines: activeLanguage.lines,
        translations: transLines,
        isTranslationActive: isBilingual,
        styles: currentSong.lyrics_data?.styles || {}
      })
    }
  })

  // 10. Alternar Pantallas (Menú vs Letra vs Editor)
  function showMenuScreen() {
    currentScreen = 'menu'
    mediaPlayer.pause()

    if (menuScreenEl) menuScreenEl.style.display = 'block'
    if (lyricsScreenEl) lyricsScreenEl.style.display = 'none'
    if (editorScreenEl) editorScreenEl.style.display = 'none'
    if (btnHeaderBackMenu) {
      btnHeaderBackMenu.style.display = 'none'
      btnHeaderBackMenu.innerHTML = `${iconArrowLeft} Menú de Canciones`
    }

    if (headerTitleEl) headerTitleEl.textContent = 'Menú de Selección de Canciones'
    if (headerArtistEl) headerArtistEl.textContent = ''

    songMenuView.refresh()
  }

  function showLyricsScreen() {
    currentScreen = 'lyrics'

    if (menuScreenEl) menuScreenEl.style.display = 'none'
    if (lyricsScreenEl) lyricsScreenEl.style.display = 'flex'
    if (editorScreenEl) editorScreenEl.style.display = 'none'
    if (btnHeaderBackMenu) {
      btnHeaderBackMenu.style.display = 'inline-flex'
      btnHeaderBackMenu.innerHTML = `${iconArrowLeft} Menú de Canciones`
    }

    if (currentSong) {
      if (headerTitleEl) headerTitleEl.textContent = currentSong.title
      if (headerArtistEl) headerArtistEl.textContent = currentSong.artist ? `por ${currentSong.artist}` : ''
    }

    controlsView.render()
  }

  function showEditorScreen(songToEdit = null) {
    currentScreen = 'editor'
    mediaPlayer.pause()

    if (menuScreenEl) menuScreenEl.style.display = 'none'
    if (lyricsScreenEl) lyricsScreenEl.style.display = 'none'
    if (editorScreenEl) editorScreenEl.style.display = 'flex'
    if (btnHeaderBackMenu) {
      btnHeaderBackMenu.style.display = 'inline-flex'
      btnHeaderBackMenu.innerHTML = `${iconArrowLeft} Volver al Menú`
    }

    if (headerTitleEl) {
      headerTitleEl.textContent = songToEdit ? `Editor: ${songToEdit.title}` : 'Crear Nueva Canción'
    }
    if (headerArtistEl) {
      headerArtistEl.textContent = songToEdit && songToEdit.artist ? `por ${songToEdit.artist}` : 'Herramienta de Creación'
    }

    songEditorView.open(songToEdit)
  }

  // 11. Botón de volver al menú desde el header
  if (btnHeaderBackMenu) {
    btnHeaderBackMenu.addEventListener('click', () => {
      showMenuScreen()
    })
  }

  // 11. Cambio de Modo (Sencillo vs Avanzado)
  function switchMode(newMode) {
    currentMode = newMode
    controlsView.setMode(newMode)

    if (modeBadgeEl) {
      modeBadgeEl.textContent = newMode === 'basic' ? 'Modo Sencillo' : 'Modo Avanzado'
      modeBadgeEl.style.borderColor = newMode === 'basic' ? 'rgba(99, 102, 241, 0.4)' : 'rgba(251, 191, 36, 0.5)'
      modeBadgeEl.style.color = newMode === 'basic' ? '#a5b4fc' : '#fde68a'
    }

    if (newMode === 'advanced') {
      advancedViewer.mount()
    } else {
      advancedViewer.unmount()
    }
  }

  // 12. Cargar canción activa en el reproductor y visor
  async function loadSongIntoApp(songId) {
    const song = await fetchSongById(songId)
    if (!song) return

    currentSong = song

    const lyricsData = song.lyrics_data || {}
    const languages = Array.isArray(lyricsData.languages) ? lyricsData.languages : []
    languageManager.setLanguages(languages)

    await mediaPlayer.loadSong(song)
    controlsView.setVideosState({
      videos: mediaPlayer.getVideos(),
      activeId: mediaPlayer.getActiveVideoId()
    })
    controlsView.setTime(0)
    controlsView.setPlayingState(false)
    controlsView.setDuration(mediaPlayer.getDuration())
  }

  // 13. Inicializar Base de Datos y cargar menú inicial
  try {
    await getDB()
    await songMenuView.refresh()
    showMenuScreen()
  } catch (err) {
    console.error('Error durante la inicialización:', err)
    if (headerTitleEl) headerTitleEl.textContent = 'Error al cargar la base de datos'
  }
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', initApp)
