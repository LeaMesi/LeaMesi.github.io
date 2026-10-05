import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSongEditorView } from '../../src/views/songEditorView.js'
import { createThemeSettingsModal } from '../../src/views/themeSettingsModal.js'
import {
  getThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  applySongTheme,
  restoreGlobalTheme,
  THEME_PRESETS
} from '../../src/services/themeService.js'

describe('Customización de Tema por Canción en Editor y Modo Letra', () => {
  let container
  let mockMediaPlayer

  beforeEach(() => {
    localStorage.clear()
    resetThemeSettings()
    document.body.innerHTML = ''
    container = document.createElement('div')
    document.body.appendChild(container)

    mockMediaPlayer = {
      getCurrentTime: vi.fn(() => 0),
      getDuration: vi.fn(() => 180),
      getIsPlaying: vi.fn(() => false),
      loadSong: vi.fn().mockResolvedValue(true),
      getVideos: vi.fn(() => []),
      getActiveVideoId: vi.fn(() => 'vid-1'),
      setVolume: vi.fn(),
      getVolume: vi.fn(() => 100),
      play: vi.fn(),
      pause: vi.fn()
    }
  })

  describe('Apartado de Tema en songEditorView', () => {
    it('renderiza la sección de tema personalizada entre metadatos y letras', () => {
      const editor = createSongEditorView({
        containerElement: container,
        mediaPlayer: mockMediaPlayer
      })

      const dummySong = {
        id: 1,
        title: 'Tema Test',
        artist: 'Artista',
        genres: ['Rock'],
        tags: [],
        videos: [],
        lyrics_data: {
          languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
        }
      }

      editor.open(dummySong)

      const metadataDetails = container.querySelector('#editor-metadata-details')
      const themeDetails = container.querySelector('#editor-theme-details')
      const lyricsSection = container.querySelector('.editor-lyrics-section')

      expect(metadataDetails).not.toBeNull()
      expect(themeDetails).not.toBeNull()
      expect(lyricsSection).not.toBeNull()

      // Verificar orden en el DOM: metadataDetails antes que themeDetails, y themeDetails antes que lyricsSection
      const parent = metadataDetails.parentElement
      const children = Array.from(parent.children)
      const metaIndex = children.indexOf(metadataDetails)
      const themeIndex = children.indexOf(themeDetails)
      const lyricsIndex = children.indexOf(lyricsSection)

      expect(metaIndex).toBeLessThan(themeIndex)
      expect(themeIndex).toBeLessThan(lyricsIndex)

      // Por defecto sin tema custom muestra "Tema Global"
      const badge = themeDetails.querySelector('#editor-theme-summary-badge')
      expect(badge.textContent.trim()).toBe('Tema Global')

      const toggleCheckbox = themeDetails.querySelector('#check-enable-song-custom-theme')
      expect(toggleCheckbox.checked).toBe(false)
    })

    it('al marcar el checkbox activa el tema personalizado y renderiza todos los controles', () => {
      const editor = createSongEditorView({
        containerElement: container,
        mediaPlayer: mockMediaPlayer
      })

      const dummySong = {
        id: 1,
        title: 'Tema Test',
        artist: 'Artista',
        genres: ['Rock'],
        tags: [],
        videos: [],
        lyrics_data: {
          languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
        }
      }

      editor.open(dummySong)

      const toggleCheckbox = container.querySelector('#check-enable-song-custom-theme')
      toggleCheckbox.checked = true
      toggleCheckbox.dispatchEvent(new Event('change'))

      const currentSong = editor.getCurrentSong()
      // Ahora debe tener customTheme en lyrics_data
      expect(currentSong.lyrics_data.customTheme).toBeDefined()
      expect(currentSong.lyrics_data.customTheme.bgColor).toBeDefined()

      // El badge debe mostrar "Tema Personalizado"
      const badge = container.querySelector('#editor-theme-summary-badge')
      expect(badge.textContent.trim()).toBe('Tema Personalizado')

      // Deben existir los presets
      expect(container.querySelectorAll('.btn-editor-theme-preset').length).toBe(THEME_PRESETS.length)

      // Deben existir los 4 colores de interfaz
      expect(container.querySelector('#picker-song-bg-color')).not.toBeNull()
      expect(container.querySelector('#picker-song-panel-bg')).not.toBeNull()
      expect(container.querySelector('#picker-song-primary-color')).not.toBeNull()
      expect(container.querySelector('#picker-song-text-main')).not.toBeNull()

      // Deben existir los 3 sliders de tamaño
      expect(container.querySelector('#slider-song-lyrics-scale')).not.toBeNull()
      expect(container.querySelector('#slider-song-translation-scale')).not.toBeNull()
      expect(container.querySelector('#slider-song-alt-scale')).not.toBeNull()

      // Deben existir colores y estilos de letra
      expect(container.querySelector('#picker-song-orig-color')).not.toBeNull()
      expect(container.querySelector('#picker-song-active-color')).not.toBeNull()
      expect(container.querySelector('#check-song-active-glow')).not.toBeNull()

      // Deben existir los colores de aviso
      expect(container.querySelector('#picker-song-alert-success')).not.toBeNull()
    })

    it('permite aplicar un preset al tema de la canción', () => {
      const editor = createSongEditorView({
        containerElement: container,
        mediaPlayer: mockMediaPlayer
      })

      const dummySong = {
        id: 1,
        title: 'Tema Cyber',
        artist: 'Artista',
        lyrics_data: {
          customTheme: { bgColor: '#000000', primaryColor: '#ffffff' },
          languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
        }
      }

      editor.open(dummySong)

      const cyberpunkBtn = container.querySelector('.btn-editor-theme-preset[data-preset-id="cyberpunk"]')
      expect(cyberpunkBtn).not.toBeNull()
      cyberpunkBtn.click()

      const cyberpunkPreset = THEME_PRESETS.find(p => p.id === 'cyberpunk')
      const currentSong = editor.getCurrentSong()
      expect(currentSong.lyrics_data.customTheme.primaryColor).toBe(cyberpunkPreset.settings.primaryColor)
      expect(currentSong.lyrics_data.customTheme.bgColor).toBe(cyberpunkPreset.settings.bgColor)
    })

    it('modificar inputs actualiza el objeto customTheme de la canción', () => {
      const editor = createSongEditorView({
        containerElement: container,
        mediaPlayer: mockMediaPlayer
      })

      const dummySong = {
        id: 1,
        title: 'Tema Edición',
        artist: 'Artista',
        lyrics_data: {
          customTheme: { bgColor: '#111111', lyricsScale: 100, originalBold: true },
          languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
        }
      }

      editor.open(dummySong)

      const bgPicker = container.querySelector('#picker-song-bg-color')
      bgPicker.value = '#abcdef'
      bgPicker.dispatchEvent(new Event('input'))

      const currentSong = editor.getCurrentSong()
      expect(currentSong.lyrics_data.customTheme.bgColor).toBe('#abcdef')

      const slider = container.querySelector('#slider-song-lyrics-scale')
      slider.value = 175
      slider.dispatchEvent(new Event('input'))

      expect(currentSong.lyrics_data.customTheme.lyricsScale).toBe(175)

      const boldCb = container.querySelector('#check-song-orig-bold')
      boldCb.checked = false
      boldCb.dispatchEvent(new Event('change'))

      expect(currentSong.lyrics_data.customTheme.originalBold).toBe(false)
    })

    it('al desmarcar el checkbox desactiva el tema personalizado', () => {
      const editor = createSongEditorView({
        containerElement: container,
        mediaPlayer: mockMediaPlayer
      })

      const dummySong = {
        id: 1,
        title: 'Tema Borrar',
        artist: 'Artista',
        lyrics_data: {
          customTheme: { bgColor: '#111111' },
          languages: [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
        }
      }

      editor.open(dummySong)

      const toggleCheckbox = container.querySelector('#check-enable-song-custom-theme')
      expect(toggleCheckbox.checked).toBe(true)

      toggleCheckbox.checked = false
      toggleCheckbox.dispatchEvent(new Event('change'))

      const currentSong = editor.getCurrentSong()
      expect(currentSong.lyrics_data.customTheme).toBeUndefined()
      const badge = container.querySelector('#editor-theme-summary-badge')
      expect(badge.textContent.trim()).toBe('Tema Global')
    })
  })

  describe('Configuración global de activación de temas en themeSettingsModal', () => {
    it('muestra el control de activar temas de canciones y por defecto viene activado', () => {
      const modalContainer = document.createElement('div')
      document.body.appendChild(modalContainer)

      const themeModal = createThemeSettingsModal({
        containerElement: modalContainer
      })

      themeModal.open()

      const enableCheckbox = modalContainer.querySelector('#check-enable-song-themes')
      expect(enableCheckbox).not.toBeNull()
      expect(enableCheckbox.checked).toBe(true)

      // Desactivar el switch
      enableCheckbox.checked = false
      enableCheckbox.dispatchEvent(new Event('change'))

      expect(getThemeSettings().enableSongThemes).toBe(false)
    })
  })

  describe('Aplicación de temas en Modo Letra', () => {
    it('aplica el tema de la canción cuando está habilitado y lo restaura al salir', () => {
      saveThemeSettings({ bgColor: '#0b0f19', enableSongThemes: true })

      const songCustomTheme = {
        bgColor: '#440022',
        primaryColor: '#ff0077'
      }

      applySongTheme(songCustomTheme)
      expect(document.documentElement.style.getPropertyValue('--bg-color')).toBe('#440022')
      expect(document.documentElement.style.getPropertyValue('--primary-color')).toBe('#ff0077')

      // Restaurar tema global (como cuando se vuelve al menú)
      restoreGlobalTheme()
      expect(document.documentElement.style.getPropertyValue('--bg-color')).toBe('#0b0f19')
    })

    it('respeta la preferencia del usuario si desactiva los temas de canciones', () => {
      saveThemeSettings({ bgColor: '#0b0f19', enableSongThemes: false })

      const songCustomTheme = {
        bgColor: '#440022'
      }

      applySongTheme(songCustomTheme)
      // Debe conservar el fondo global porque enableSongThemes es false
      expect(document.documentElement.style.getPropertyValue('--bg-color')).toBe('#0b0f19')
    })
  })
})
