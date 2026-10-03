import './style.css'
import { getDB } from './services/db.js'
import { listSongs, fetchSongById } from './services/songService.js'
import { applyTheme } from './services/themeService.js'
import { createMediaPlayer, PLAYER_STATE } from './player/mediaPlayer.js'
import { createLanguageManager } from './lyrics/languageManager.js'
import { createBasicViewer } from './views/basicViewer.js'
import { createAdvancedViewer } from './views/advancedViewer.js'
import { createControlsView } from './views/controlsView.js'
import { createSongMenuView } from './views/songMenuView.js'
import { createVideoManagerModal } from './views/videoManagerModal.js'
import { createOnlineLyricsModal } from './views/onlineLyricsModal.js'
import { createThemeSettingsModal } from './views/themeSettingsModal.js'
import { createSongEditorView } from './views/songEditorView.js'
import { createPlaylistService, loadLibraryIntoPlaylist } from './services/playlistService.js'
import { createPlaylistModal } from './views/playlistModal.js'
import { createFloatingPlayerView } from './views/floatingPlayerView.js'
import { iconArrowLeft, iconPalette, iconListMusic, iconMic } from './views/icons.js'

async function initApp() {
  // Aplicar tema guardado inmediatamente
  applyTheme()

  const appContainer = document.querySelector('#app')
  if (!appContainer) return

  if (appContainer) appContainer.dataset.screen = 'menu'

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
        <button class="btn btn-outline btn-sm" id="btn-header-playlist" title="Ver lista de reproducción activa">
          ${iconListMusic} <span class="nav-text-full">Playlist</span> <span class="badge-playlist-count" id="header-playlist-count">0</span>
        </button>
        <button class="btn btn-primary btn-sm btn-header-now-playing" id="btn-header-now-playing" style="display: none;" title="Volver a la canción que está sonando">
          ${iconMic} <span class="nav-text-full">Modo Letra</span><span class="nav-text-short">Letra</span>
        </button>
        <button class="btn btn-outline btn-sm" id="btn-header-theme" title="Personalizar temas, tamaños de letra y colores">
          ${iconPalette} Temas
        </button>
        <button class="btn btn-outline btn-sm btn-header-nav" id="btn-header-back-menu" style="display: none;">
          ${iconArrowLeft} <span class="nav-text-full">Menú de Canciones</span><span class="nav-text-short">Menú</span>
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

    <!-- Modal de Lista de Reproducción (Playlist) -->
    <div class="modal-container" id="playlist-modal"></div>

    <!-- Reproductor Flotante Mini (Solo en Menú de Canciones si hay canción cargada) -->
    <div id="floating-player-container" class="floating-player-container" style="display: none;"></div>
  `

  // 2. Elementos del DOM
  const headerTitleEl = document.querySelector('#header-song-title')
  const headerArtistEl = document.querySelector('#header-song-artist')
  const modeBadgeEl = document.querySelector('#app-mode-badge')
  const btnHeaderPlaylist = document.querySelector('#btn-header-playlist')
  const btnHeaderNowPlaying = document.querySelector('#btn-header-now-playing')
  const headerPlaylistCountEl = document.querySelector('#header-playlist-count')
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
  const playlistModalEl = document.querySelector('#playlist-modal')
  const floatingPlayerContainerEl = document.querySelector('#floating-player-container')
  const advancedStageEl = document.querySelector('#advanced-stage-container')

  // 3. Estado de la aplicación
  let currentSong = null
  let currentMode = 'basic'
  let currentScreen = 'menu' // 'menu' | 'lyrics' | 'editor'

  const savedPreviewLines = localStorage.getItem('saranga_preview_lines')
  const initialPreviewLines = (savedPreviewLines !== null && !isNaN(Number(savedPreviewLines)))
    ? Math.max(0, Math.min(3, Number(savedPreviewLines)))
    : 2

  const savedScriptMode = localStorage.getItem('saranga_script_display')
  const initialScriptMode = (savedScriptMode === 'original' || savedScriptMode === 'alt') ? savedScriptMode : 'both'

  const languageManager = createLanguageManager([])
  const basicViewer = createBasicViewer(lyricsViewportEl, {
    initialPreviewCount: initialPreviewLines,
    initialScriptDisplayMode: initialScriptMode,
    onSeekLine: (seconds) => mediaPlayer.seekLyricsTime(seconds)
  })
  const advancedViewer = createAdvancedViewer(advancedStageEl)

  // 3b. Inicializar Servicio de Lista de Reproducción (Playlist)
  const playlistService = createPlaylistService()

  // 4. Inicializar Reproductor Multimedia (Master Clock)
  const mediaPlayer = createMediaPlayer({
    containerId: 'youtube-player-container',
    onTimeUpdate: (currentTime, lyricsTime) => {
      controlsView?.setTime(currentTime)
      floatingPlayerView?.setTime(currentTime)
      basicViewer.updateTime(lyricsTime !== undefined ? lyricsTime : mediaPlayer.getLyricsTime())
      songEditorView.updateClock(currentTime)
    },
    onStateChange: async (state) => {
      const isPlaying = mediaPlayer.getIsPlaying()
      controlsView?.setPlayingState(isPlaying)
      floatingPlayerView?.setPlayingState(isPlaying)
      songEditorView.setPlayingState(isPlaying)

      // Auto-avance de canción en la playlist al terminar
      if (state === PLAYER_STATE.ENDED) {
        if (playlistService.hasNext()) {
          const nextSong = playlistService.next()
          if (nextSong) {
            await loadSongIntoApp(nextSong.id, { autoplay: true })
            if (currentScreen === 'lyrics') {
              showLyricsScreen()
            }
          }
        }
      }

      updateHeaderPlaybackState()
    },
    onDurationChange: (duration) => {
      controlsView?.setDuration(duration)
      floatingPlayerView?.setDuration(duration)
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

  // 5d. Inicializar Modal de Lista de Reproducción (Playlist)
  const playlistModal = createPlaylistModal({
    containerElement: playlistModalEl,
    playlistService,
    onPlaySong: async (song) => {
      await loadSongIntoApp(song.id, { autoplay: true })
      showLyricsScreen()
    },
    onLibraryCreated: () => {
      songMenuView.refresh()
    }
  })

  if (btnHeaderPlaylist) {
    btnHeaderPlaylist.addEventListener('click', () => {
      playlistModal.open()
    })
  }

  if (btnHeaderNowPlaying) {
    btnHeaderNowPlaying.addEventListener('click', () => {
      showLyricsScreen()
    })
  }

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
      await loadSongIntoApp(savedId, { autoplay: true })
      showLyricsScreen()
    }
  })

  // 7. Inicializar Barra de Controles (Modo Letra)
  const controlsView = createControlsView({
    containerElement: controlsDockEl,
    initialPreviewLines,
    initialVolume: mediaPlayer.getVolume(),
    initialScriptDisplayMode: initialScriptMode,
    onPlayToggle: () => mediaPlayer.togglePlay(),
    onSeek: (seconds) => mediaPlayer.seek(seconds),
    onVolumeChange: (vol) => {
      mediaPlayer.setVolume(vol)
      floatingPlayerView?.setVolume(vol)
    },
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
    onScriptDisplayModeChange: (mode) => {
      localStorage.setItem('saranga_script_display', mode)
      basicViewer.setScriptDisplayMode(mode)
    },
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
    },
    onPrevSong: async () => {
      if (mediaPlayer.getCurrentTime() > 3) {
        mediaPlayer.seek(0)
        mediaPlayer.play()
      } else if (playlistService.hasPrev()) {
        const prev = playlistService.prev()
        if (prev) {
          await loadSongIntoApp(prev.id, { autoplay: true })
          showLyricsScreen()
        }
      } else {
        mediaPlayer.seek(0)
        mediaPlayer.play()
      }
    },
    onNextSong: async () => {
      const next = playlistService.next()
      if (next) {
        await loadSongIntoApp(next.id, { autoplay: true })
        showLyricsScreen()
      }
    },
    onOpenPlaylist: () => {
      playlistModal.open()
    }
  })

  // 7b. Inicializar Reproductor Flotante Mini (Solo para Menú de Canciones)
  const floatingPlayerView = createFloatingPlayerView({
    containerElement: floatingPlayerContainerEl,
    initialVolume: mediaPlayer.getVolume(),
    onPlayToggle: () => mediaPlayer.togglePlay(),
    onSeek: (seconds) => mediaPlayer.seek(seconds),
    onVolumeChange: (vol) => {
      mediaPlayer.setVolume(vol)
      controlsView.setVolume(vol)
    },
    onRestartSong: () => {
      mediaPlayer.seek(0)
      mediaPlayer.play()
    },
    onPrevSong: async () => {
      if (mediaPlayer.getCurrentTime() > 3) {
        mediaPlayer.seek(0)
        mediaPlayer.play()
      } else if (playlistService.hasPrev()) {
        const prev = playlistService.prev()
        if (prev) {
          await loadSongIntoApp(prev.id, { autoplay: true })
        }
      } else {
        mediaPlayer.seek(0)
        mediaPlayer.play()
      }
    },
    onNextSong: async () => {
      const next = playlistService.next()
      if (next) {
        await loadSongIntoApp(next.id, { autoplay: true })
      }
    },
    onOpenLyrics: () => {
      showLyricsScreen()
    }
  })

  // 8. Inicializar Menú de Selección de Canciones
  const songMenuView = createSongMenuView({
    containerElement: menuScreenEl,
    onEnterLyricsMode: async (songId) => {
      await loadSongIntoApp(songId, { autoplay: true })
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
    },
    onAddToPlaylist: (song) => {
      return playlistService.addSong(song)
    },
    onOpenPlaylist: () => {
      playlistModal.open()
    },
    onLoadLibraryAsPlaylist: async (libraryId, { shuffle = false }) => {
      const count = await loadLibraryIntoPlaylist(libraryId, { shuffle, playlistService })
      return count
    }
  })

  // 8b. Suscribir a cambios en la playlist para sincronizar controles y menú
  playlistService.subscribe((plState) => {
    controlsView.setPlaylistState({
      count: plState.count,
      hasNext: plState.hasNext,
      hasPrev: plState.hasPrev
    })
    floatingPlayerView.setPlaylistState({
      hasNext: plState.hasNext,
      hasPrev: plState.hasPrev
    })
    songMenuView.setPlaylistCount(plState.count)

    if (headerPlaylistCountEl) {
      headerPlaylistCountEl.textContent = plState.count
      if (plState.count > 0) headerPlaylistCountEl.classList.add('has-items')
      else headerPlaylistCountEl.classList.remove('has-items')
    }
  })

  function checkHasAltText(language) {
    if (!language || !Array.isArray(language.lines)) return false
    return language.lines.some(l => {
      if (typeof l.altText === 'string' && l.altText.trim()) return true
      if (typeof l.romaji === 'string' && l.romaji.trim()) return true
      if (Array.isArray(l.syllables) && l.syllables.some(s => (s.altText && s.altText.trim()) || (s.romaji && s.romaji.trim()))) return true
      return false
    })
  }

  // 9. Reaccionar a cambios en idiomas
  languageManager.subscribe(({ activeLanguage, translationLanguage, isBilingual, availableLanguages }) => {
    const hasAlt = checkHasAltText(activeLanguage)
    controlsView.setLanguagesState({
      languages: availableLanguages,
      active: activeLanguage,
      translation: translationLanguage,
      bilingual: isBilingual
    })
    controlsView.setScriptState({
      hasAltText: hasAlt,
      mode: basicViewer.getScriptDisplayMode()
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

  function updateHeaderPlaybackState() {
    if (currentScreen === 'menu') {
      if (currentSong && mediaPlayer.getIsPlaying()) {
        if (headerTitleEl) headerTitleEl.textContent = `▶ ${currentSong.title}`
        if (headerArtistEl) headerArtistEl.textContent = currentSong.artist ? `por ${currentSong.artist}` : ''
        if (btnHeaderNowPlaying) {
          btnHeaderNowPlaying.style.display = 'inline-flex'
        }
      } else {
        if (headerTitleEl) headerTitleEl.textContent = 'Menú de Selección de Canciones'
        if (headerArtistEl) headerArtistEl.textContent = ''
        if (btnHeaderNowPlaying) {
          btnHeaderNowPlaying.style.display = 'none'
        }
      }
    } else if (currentScreen === 'lyrics') {
      if (btnHeaderNowPlaying) {
        btnHeaderNowPlaying.style.display = 'none'
      }
      if (currentSong) {
        if (headerTitleEl) headerTitleEl.textContent = currentSong.title
        if (headerArtistEl) headerArtistEl.textContent = currentSong.artist ? `por ${currentSong.artist}` : ''
      }
    } else {
      if (btnHeaderNowPlaying) {
        btnHeaderNowPlaying.style.display = 'none'
      }
    }
  }

  // 10. Alternar Pantallas (Menú vs Letra vs Editor)
  function showMenuScreen() {
    currentScreen = 'menu'
    if (appContainer) appContainer.dataset.screen = 'menu'
    // No pausamos mediaPlayer para que la música siga sonando de fondo mientras se edita la playlist o el menú

    if (menuScreenEl) menuScreenEl.style.display = 'block'
    if (lyricsScreenEl) lyricsScreenEl.style.display = 'none'
    if (editorScreenEl) editorScreenEl.style.display = 'none'
    if (btnHeaderBackMenu) {
      btnHeaderBackMenu.style.display = 'none'
      btnHeaderBackMenu.innerHTML = `${iconArrowLeft} <span class="nav-text-full">Menú de Canciones</span><span class="nav-text-short">Menú</span>`
    }

    updateHeaderPlaybackState()

    if (currentSong) {
      floatingPlayerView.setSong(currentSong)
      floatingPlayerView.setPlayingState(mediaPlayer.getIsPlaying())
      floatingPlayerView.setDuration(mediaPlayer.getDuration())
      floatingPlayerView.setTime(mediaPlayer.getCurrentTime())
      floatingPlayerView.setVisible(true)
    } else {
      floatingPlayerView.setVisible(false)
    }

    songMenuView.refresh()
  }

  function showLyricsScreen() {
    currentScreen = 'lyrics'
    if (appContainer) appContainer.dataset.screen = 'lyrics'
    floatingPlayerView.setVisible(false)

    if (menuScreenEl) menuScreenEl.style.display = 'none'
    if (lyricsScreenEl) lyricsScreenEl.style.display = 'flex'
    if (editorScreenEl) editorScreenEl.style.display = 'none'
    if (btnHeaderBackMenu) {
      btnHeaderBackMenu.style.display = 'inline-flex'
      btnHeaderBackMenu.innerHTML = `${iconArrowLeft} <span class="nav-text-full">Menú de Canciones</span><span class="nav-text-short">Menú</span>`
    }

    updateHeaderPlaybackState()

    controlsView.render()
  }

  function showEditorScreen(songToEdit = null) {
    currentScreen = 'editor'
    if (appContainer) appContainer.dataset.screen = 'editor'
    floatingPlayerView.setVisible(false)
    mediaPlayer.pause()

    if (menuScreenEl) menuScreenEl.style.display = 'none'
    if (lyricsScreenEl) lyricsScreenEl.style.display = 'none'
    if (editorScreenEl) editorScreenEl.style.display = 'flex'
    if (btnHeaderBackMenu) {
      btnHeaderBackMenu.style.display = 'inline-flex'
      btnHeaderBackMenu.innerHTML = `${iconArrowLeft} <span class="nav-text-full">Volver al Menú</span><span class="nav-text-short">Menú</span>`
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
  async function loadSongIntoApp(songId, { autoplay = false } = {}) {
    const song = await fetchSongById(songId)
    if (!song) return

    currentSong = song
    playlistService.setCurrentSong(song)
    updateHeaderPlaybackState()

    const lyricsData = song.lyrics_data || {}
    const languages = Array.isArray(lyricsData.languages) ? lyricsData.languages : []
    languageManager.setLanguages(languages)

    await mediaPlayer.loadSong(song, null, { autoplay })
    controlsView.setVideosState({
      videos: mediaPlayer.getVideos(),
      activeId: mediaPlayer.getActiveVideoId()
    })
    controlsView.setTime(0)
    controlsView.setPlayingState(autoplay)
    controlsView.setDuration(mediaPlayer.getDuration())

    floatingPlayerView.setSong(currentSong)
    floatingPlayerView.setDuration(mediaPlayer.getDuration())
    floatingPlayerView.setTime(0)
    floatingPlayerView.setPlayingState(autoplay)
    if (currentScreen === 'menu') {
      floatingPlayerView.setVisible(true)
    }

    if (autoplay) {
      mediaPlayer.play()
    }
  }

  // 13. Inicializar Base de Datos y cargar menú inicial
  try {
    await getDB()
    await songMenuView.refresh()

    const initialSong = playlistService.getCurrentSong()
    if (initialSong) {
      await loadSongIntoApp(initialSong.id, { autoplay: false })
    }

    showMenuScreen()
  } catch (err) {
    console.error('Error durante la inicialización:', err)
    if (headerTitleEl) headerTitleEl.textContent = 'Error al cargar la base de datos'
  }
}

// Iniciar aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', initApp)
