import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createSongEditorView } from '../../src/views/songEditorView.js'

describe('views/songEditorView.js', () => {
  let container = null

  const sampleSong = {
    id: 5,
    title: 'Edición de Prueba',
    artist: 'Artista Editor',
    genres: ['Rock'],
    tags: ['prueba'],
    videos: [
      { id: 'v1', name: 'Oficial', url: 'https://youtube.com/watch?v=11111111111', offset: 0 }
    ],
    lyrics_data: {
      languages: [
        {
          code: 'es',
          name: 'Español (Original)',
          isMain: true,
          lines: [
            {
              id: 'l1',
              startTime: 2.0,
              endTime: 5.0,
              text: 'Frase inicial',
              syllables: [
                { text: 'Fra', startTime: 2.0, duration: 1.5 },
                { text: 'se', startTime: 3.5, duration: 1.5 }
              ]
            }
          ]
        }
      ]
    }
  }

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('abre el editor con una plantilla en blanco para nueva canción', () => {
    const editor = createSongEditorView({ containerElement: container })
    editor.open(null)

    const titleInput = container.querySelector('#input-song-title')
    expect(titleInput).not.toBeNull()
    expect(titleInput.value).toBe('')

    const saveAndSingBtn = container.querySelector('#btn-save-and-sing')
    expect(saveAndSingBtn).not.toBeNull()
  })

  it('abre el editor precargando una canción existente con sus metadatos y frases', () => {
    const editor = createSongEditorView({ containerElement: container })
    editor.open(sampleSong)

    const titleInput = container.querySelector('#input-song-title')
    expect(titleInput.value).toBe('Edición de Prueba')

    const artistInput = container.querySelector('#input-song-artist')
    expect(artistInput.value).toBe('Artista Editor')

    const phraseCards = container.querySelectorAll('.phrase-editor-card')
    expect(phraseCards.length).toBe(1)
    const phraseInput = container.querySelector('.input-phrase-text')
    expect(phraseInput.value).toBe('Frase inicial')
  })

  it('permite añadir una nueva frase a la canción', () => {
    const editor = createSongEditorView({ containerElement: container })
    editor.open(sampleSong)

    const addPhraseBtn = container.querySelector('#btn-add-phrase-top')
    expect(addPhraseBtn).not.toBeNull()
    addPhraseBtn.click()

    const phraseCards = container.querySelectorAll('.phrase-editor-card')
    expect(phraseCards.length).toBe(2)
  })

  it('dispara onGoToMenu al hacer clic en el botón de retroceso si está presente', () => {
    const onGoToMenu = vi.fn()
    const editor = createSongEditorView({ containerElement: container, onGoToMenu })
    editor.open(sampleSong)

    const backBtn = container.querySelector('#btn-editor-back')
    if (backBtn) {
      backBtn.click()
      expect(onGoToMenu).toHaveBeenCalled()
    }
  })

  it('ubica el botón de probar en modo letra como solo icono en el controlador de tiempo y los de backup al final de metadatos', () => {
    const editor = createSongEditorView({ containerElement: container })
    editor.open(sampleSong)

    // Botón de probar en modo letra en el controlador de tiempo (a la derecha)
    const assistantControls = container.querySelector('.editor-audio-assistant .assistant-controls')
    expect(assistantControls).not.toBeNull()
    const saveAndSingBtn = assistantControls.querySelector('#btn-save-and-sing')
    expect(saveAndSingBtn).not.toBeNull()
    expect(saveAndSingBtn.textContent.trim()).toBe('') // Solo icono, sin texto
    expect(saveAndSingBtn.querySelector('svg')).not.toBeNull()

    // Botones de backup dentro del acordeón de metadatos, después de los videos
    const metadataSection = container.querySelector('#editor-metadata-details')
    expect(metadataSection).not.toBeNull()
    const backupBlock = metadataSection.querySelector('.editor-backup-block')
    expect(backupBlock).not.toBeNull()

    const exportJsonBtn = backupBlock.querySelector('#btn-editor-export-json')
    const exportYamlBtn = backupBlock.querySelector('#btn-editor-export-yaml')
    expect(exportJsonBtn).not.toBeNull()
    expect(exportYamlBtn).not.toBeNull()
    expect(exportJsonBtn.textContent).toContain('JSON')
    expect(exportYamlBtn.textContent).toContain('Lyricsfile')

    // El primer header con botones (backup, probar, guardar) ya no existe
    expect(container.querySelector('.editor-header-bar')).toBeNull()
    expect(container.querySelector('#btn-save-song')).toBeNull()
  })

  it('renderiza la barra de progreso, el parlante a la izquierda de los botones y el estado de guardado a la derecha', () => {
    const mockMediaPlayer = {
      getCurrentTime: () => 10,
      getDuration: () => 180,
      getVolume: () => 80,
      getIsPlaying: () => false,
      setVolume: vi.fn(),
      seek: vi.fn()
    }
    const editor = createSongEditorView({ containerElement: container, mediaPlayer: mockMediaPlayer })
    editor.open(sampleSong)

    const leftGroup = container.querySelector('.assistant-left-group')
    expect(leftGroup).not.toBeNull()
    expect(leftGroup.querySelector('#btn-editor-volume')).not.toBeNull()
    expect(leftGroup.querySelector('#editor-volume-popover')).not.toBeNull()
    expect(leftGroup.querySelector('#editor-progress-slider')).not.toBeNull()
    expect(leftGroup.querySelector('#editor-progress-current')).not.toBeNull()
    expect(leftGroup.querySelector('#editor-progress-duration')).not.toBeNull()

    const rightGroup = container.querySelector('.assistant-right-group')
    expect(rightGroup).not.toBeNull()
    const badge = rightGroup.querySelector('#editor-autosave-badge')
    expect(badge).not.toBeNull()
    expect(badge.textContent).toContain('Guardado')
  })

  it('despliega el menú vertical de volumen al hacer clic en el parlante y lo cierra al hacer clic afuera', () => {
    const mockMediaPlayer = {
      getCurrentTime: () => 0,
      getDuration: () => 100,
      getVolume: () => 75,
      getIsPlaying: () => false,
      setVolume: vi.fn(),
      seek: vi.fn()
    }
    const editor = createSongEditorView({ containerElement: container, mediaPlayer: mockMediaPlayer })
    editor.open(sampleSong)

    const volumeBtn = container.querySelector('#btn-editor-volume')
    const popover = container.querySelector('#editor-volume-popover')
    expect(popover.classList.contains('is-open')).toBe(false)

    // Clic en el parlante abre el menú vertical
    volumeBtn.click()
    expect(popover.classList.contains('is-open')).toBe(true)

    // Clic afuera del contenedor cierra el menú
    document.body.click()
    expect(popover.classList.contains('is-open')).toBe(false)
  })

  it('permite cambiar el volumen con el slider vertical y buscar posición en la barra de progreso', () => {
    const setVolumeSpy = vi.fn()
    const seekSpy = vi.fn()
    const mockMediaPlayer = {
      getCurrentTime: () => 5,
      getDuration: () => 120,
      getVolume: () => 50,
      getIsPlaying: () => false,
      setVolume: setVolumeSpy,
      seek: seekSpy
    }
    const editor = createSongEditorView({ containerElement: container, mediaPlayer: mockMediaPlayer })
    editor.open(sampleSong)

    // Ajustar volumen
    const volumeSlider = container.querySelector('#editor-volume-slider')
    volumeSlider.value = '90'
    volumeSlider.dispatchEvent(new Event('input'))
    expect(setVolumeSpy).toHaveBeenCalledWith(90)
    expect(container.querySelector('#editor-volume-percent').textContent).toBe('90%')

    // Buscar en la barra de progreso
    const progressSlider = container.querySelector('#editor-progress-slider')
    progressSlider.value = '45'
    progressSlider.dispatchEvent(new Event('change'))
    expect(seekSpy).toHaveBeenCalledWith(45)

    // updateClock sincroniza el tiempo y el slider si el usuario no está arrastrando
    editor.updateClock(60)
    expect(container.querySelector('#editor-progress-current').textContent).toBe('01:00')
    expect(progressSlider.value).toBe('60')
  })

  it('permite abrir y cerrar el menú vertical de volumen en el editor y ajustar volumen desde el track', () => {
    const setVolumeSpy = vi.fn()
    const mockMediaPlayer = {
      getCurrentTime: () => 0,
      getDuration: () => 100,
      getVolume: () => 70,
      getIsPlaying: () => false,
      setVolume: setVolumeSpy
    }
    const editor = createSongEditorView({ containerElement: container, mediaPlayer: mockMediaPlayer })
    editor.open(sampleSong)

    const volumeBtn = container.querySelector('#btn-editor-volume')
    const volumePopover = container.querySelector('#editor-volume-popover')
    const sliderTrack = container.querySelector('.editor-volume-slider-track')
    const volumeSlider = container.querySelector('#editor-volume-slider')
    const volumePercent = container.querySelector('#editor-volume-percent')

    expect(volumeBtn).not.toBeNull()
    expect(volumePopover).not.toBeNull()
    expect(volumePopover.classList.contains('is-open')).toBe(false)

    // Abrir popover
    volumeBtn.click()
    expect(volumePopover.classList.contains('is-open')).toBe(true)
    expect(volumeBtn.classList.contains('is-active')).toBe(true)

    // Simular arrastre en el track
    sliderTrack.getBoundingClientRect = () => ({
      top: 100,
      bottom: 200,
      left: 50,
      right: 78,
      width: 28,
      height: 100
    })

    const pointerEvent = new Event('pointerdown')
    pointerEvent.clientY = 120 // 200 - 120 = 80 -> 80%
    sliderTrack.dispatchEvent(pointerEvent)

    expect(setVolumeSpy).toHaveBeenCalledWith(80)
    expect(volumeSlider.value).toBe('80')
    expect(volumePercent.textContent).toBe('80%')

    // Cerrar al hacer clic afuera
    document.dispatchEvent(new MouseEvent('click'))
    expect(volumePopover.classList.contains('is-open')).toBe(false)
    expect(volumeBtn.classList.contains('is-active')).toBe(false)
  })

  describe('Guía de referencia de frase original al traducir', () => {
    const bilingualSong = {
      id: 10,
      title: 'Canción Bilingüe',
      artist: 'Artista Bilingüe',
      lyrics_data: {
        languages: [
          {
            code: 'ja',
            name: 'Japonés (Original)',
            isMain: true,
            lines: [
              {
                id: 'l1',
                startTime: 1.0,
                endTime: 4.0,
                text: '夜に駆ける',
                altText: 'Yoru ni kakeru'
              },
              {
                id: 'l2',
                startTime: 5.0,
                endTime: 7.0,
                text: '', // Pausa instrumental
                altText: ''
              }
            ]
          },
          {
            code: 'es',
            name: 'Español (Traducción)',
            isMain: false,
            lines: [
              {
                id: 'l-es-1',
                startTime: 1.0,
                endTime: 4.0,
                text: 'Correr en la noche'
              },
              {
                id: 'l-es-2',
                startTime: 5.0,
                endTime: 7.0,
                text: ''
              }
            ]
          }
        ]
      }
    }

    it('no muestra guía de referencia cuando se está en el idioma principal', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(bilingualSong)

      // Por defecto pestaña 0 (Japonés, isMain: true)
      const refGuides = container.querySelectorAll('.phrase-ref-guide')
      expect(refGuides.length).toBe(0)

      const refSelector = container.querySelector('#select-translation-ref-mode')
      expect(refSelector).toBeNull()
    })

    it('muestra la guía con texto original y alternativo en pestaña de traducción', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(bilingualSong)

      // Cambiar a pestaña 1 (Español, traducción)
      const tabs = container.querySelectorAll('.editor-lang-tab')
      expect(tabs.length).toBe(2)
      tabs[1].click()

      // Selector de modo de referencia debe estar presente
      const refSelector = container.querySelector('#select-translation-ref-mode')
      expect(refSelector).not.toBeNull()
      expect(refSelector.value).toBe('both')

      const refGuides = container.querySelectorAll('.phrase-ref-guide')
      expect(refGuides.length).toBe(2)

      // Verso 1: muestra texto original y romaji
      expect(refGuides[0].textContent).toContain('夜に駆ける')
      expect(refGuides[0].textContent).toContain('Yoru ni kakeru')

      // Verso 2: texto original en blanco se identifica explícitamente como pausa
      expect(refGuides[1].textContent).toContain('Pausa / Verso en blanco')
    })

    it('permite cambiar el modo a "text", "alt" o "none"', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(bilingualSong)

      const tabs = container.querySelectorAll('.editor-lang-tab')
      tabs[1].click()

      const refSelector = container.querySelector('#select-translation-ref-mode')

      // 1. Modo solo texto
      refSelector.value = 'text'
      refSelector.dispatchEvent(new Event('change'))

      let guide1 = container.querySelector('.phrase-ref-guide')
      expect(guide1.textContent).toContain('夜に駆ける')
      expect(guide1.textContent).not.toContain('Yoru ni kakeru')

      // 2. Modo solo alternativo
      refSelector.value = 'alt'
      refSelector.dispatchEvent(new Event('change'))

      guide1 = container.querySelector('.phrase-ref-guide')
      expect(guide1.textContent).not.toContain('夜に駆ける')
      expect(guide1.textContent).toContain('Yoru ni kakeru')

      // 3. Modo desactivado (none)
      refSelector.value = 'none'
      refSelector.dispatchEvent(new Event('change'))

      expect(container.querySelectorAll('.phrase-ref-guide').length).toBe(0)
    })

    it('permite copiar el texto original del verso a la traducción con el botón Copiar', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(bilingualSong)

      const tabs = container.querySelectorAll('.editor-lang-tab')
      tabs[1].click()

      const copyBtn = container.querySelector('.btn-copy-ref-line')
      expect(copyBtn).not.toBeNull()
      copyBtn.click()

      const phraseInput = container.querySelector('.input-phrase-text')
      expect(phraseInput.value).toBe('夜に駆ける')
    })

    it('permite traducir automáticamente un verso individual con el botón Traducir sin dividir en sílabas', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lines: [{ translation: 'Traducción única' }],
          detectedLang: 'ja'
        })
      })

      const editor = createSongEditorView({ containerElement: container })
      editor.open(bilingualSong)

      const tabs = container.querySelectorAll('.editor-lang-tab')
      tabs[1].click()

      // Expandir la primera frase
      const expandBtn = container.querySelector('.btn-toggle-syllables')
      if (expandBtn && !container.querySelector('.phrase-syllables-panel')) {
        expandBtn.click()
      }

      const translateBtn = container.querySelector('.btn-translate-ref-line')
      expect(translateBtn).not.toBeNull()
      translateBtn.click()
      await new Promise(r => setTimeout(r, 20))

      const phraseInput = container.querySelector('.input-phrase-text')
      expect(phraseInput.value).toBe('Traducción única')

      // NO debe generar sílabas automáticamente
      const sylChips = container.querySelectorAll('.syllable-edit-chip')
      expect(sylChips.length).toBe(0)
    })

    it('muestra overlay bloqueante durante la traducción completa y no genera sílabas automáticas', async () => {
      let resolveFetch
      const fetchPromise = new Promise(resolve => {
        resolveFetch = resolve
      })

      global.fetch = vi.fn().mockImplementation(() => fetchPromise)
      window.confirm = () => true

      const editor = createSongEditorView({ containerElement: container })
      editor.open(bilingualSong)

      const tabs = container.querySelectorAll('.editor-lang-tab')
      tabs[1].click()

      const autoTranslateAllBtn = container.querySelector('#btn-auto-translate-all')
      expect(autoTranslateAllBtn).not.toBeNull()
      autoTranslateAllBtn.click()

      // Verificar que el overlay bloqueante está activo en pantalla
      const loadingDialog = container.querySelector('.translation-loading-dialog')
      expect(loadingDialog).not.toBeNull()
      expect(loadingDialog.textContent).toContain('Traduciendo Canción')

      const backdrop = container.querySelector('.translation-loading-backdrop')
      expect(backdrop).not.toBeNull()

      // Resolver la traducción
      resolveFetch({
        ok: true,
        json: async () => ({
          lines: [
            { translation: 'Correr en la noche' }
          ],
          detectedLang: 'ja'
        })
      })
      await new Promise(r => setTimeout(r, 20))

      // Verificar que el overlay se eliminó tras finalizar
      expect(container.querySelector('.translation-loading-dialog')).toBeNull()

      const phraseInputs = container.querySelectorAll('.input-phrase-text')
      // Verso 1 traducido
      expect(phraseInputs[0].value).toBe('Correr en la noche')
      // Verso 2 (pausa original en blanco) debe permanecer vacío
      expect(phraseInputs[1].value).toBe('')

      const statusAlert = container.querySelector('.status-alert')
      expect(statusAlert.textContent).toContain('Canción traducida con éxito')

      // No debe generar sílabas automáticamente
      const sylChips = container.querySelectorAll('.syllable-edit-chip')
      expect(sylChips.length).toBe(0)
    })

    it('permite añadir un nuevo idioma con traducción automática desde el modal sin generar sílabas automáticas', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lines: [
            { translation: 'Racing into the night' }
          ],
          detectedLang: 'ja'
        })
      })

      const editor = createSongEditorView({ containerElement: container })
      editor.open(bilingualSong)

      // Abrir modal de añadir idioma
      const addLangBtn = container.querySelector('#btn-add-language')
      addLangBtn.click()

      const nameInput = container.querySelector('#input-new-lang-name')
      const codeInput = container.querySelector('#input-new-lang-code')
      const autoTranslateCheck = container.querySelector('#check-auto-translate')
      const confirmBtn = container.querySelector('#btn-confirm-add-lang')

      nameInput.value = 'English'
      codeInput.value = 'en'
      autoTranslateCheck.checked = true
      autoTranslateCheck.dispatchEvent(new Event('change'))

      confirmBtn.click()
      await new Promise(r => setTimeout(r, 20))

      const tabs = container.querySelectorAll('.editor-lang-tab')
      expect(tabs.length).toBe(3)
      expect(tabs[2].textContent).toContain('English')

      const phraseInputs = container.querySelectorAll('.input-phrase-text')
      expect(phraseInputs[0].value).toBe('Racing into the night')
      expect(phraseInputs[1].value).toBe('')

      // El nuevo idioma debe tener sílabas vacías (sin división automática)
      const sylChips = container.querySelectorAll('.syllable-edit-chip')
      expect(sylChips.length).toBe(0)
    })
  })

  describe('Guardado automático en tiempo real', () => {
    it('muestra el badge de guardado automático en la barra de control', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(sampleSong)

      const badge = container.querySelector('#editor-autosave-badge')
      expect(badge).not.toBeNull()
      expect(badge.textContent).toContain('Guardado')
    })

    it('guarda automáticamente al añadir una frase y llama onSongSaved', async () => {
      const onSongSaved = vi.fn()
      const editor = createSongEditorView({ containerElement: container, onSongSaved })
      editor.open(sampleSong)

      const addBtn = container.querySelector('#btn-add-phrase-top')
      addBtn.click()

      // Esperar microtareas de saveSong
      await new Promise(r => setTimeout(r, 150))
      expect(onSongSaved).toHaveBeenCalled()
    })

    it('guarda automáticamente al modificar el texto de un verso tras el debounce o evento change', async () => {
      const onSongSaved = vi.fn()
      const editor = createSongEditorView({ containerElement: container, onSongSaved })
      editor.open(sampleSong)

      const phraseInput = container.querySelector('.input-phrase-text')
      expect(phraseInput).not.toBeNull()

      phraseInput.value = 'Texto nuevo editado'
      phraseInput.dispatchEvent(new Event('input'))

      // Antes del debounce no debe haberse llamado aún
      expect(onSongSaved).not.toHaveBeenCalled()

      // Al disparar 'change', guarda inmediatamente
      phraseInput.dispatchEvent(new Event('change'))
      await new Promise(r => setTimeout(r, 150))

      expect(onSongSaved).toHaveBeenCalled()
    })

    it('guarda automáticamente al modificar el título o artista de la canción', async () => {
      const onSongSaved = vi.fn()
      const editor = createSongEditorView({ containerElement: container, onSongSaved })
      editor.open(sampleSong)

      const titleInput = container.querySelector('#input-song-title')
      titleInput.value = 'Título Actualizado Automático'
      titleInput.dispatchEvent(new Event('input'))
      titleInput.dispatchEvent(new Event('change'))

      await new Promise(r => setTimeout(r, 150))
      expect(onSongSaved).toHaveBeenCalled()
    })

    it('guarda automáticamente al silabear y al borrar sílabas de un verso', async () => {
      const onSongSaved = vi.fn()
      const editor = createSongEditorView({ containerElement: container, onSongSaved })
      editor.open(sampleSong)

      // Abrir panel de sílabas
      const expandBtn = container.querySelector('.btn-toggle-syllables')
      if (expandBtn && !container.querySelector('.phrase-syllables-panel')) {
        expandBtn.click()
      }

      // Añadir sílaba
      const addSylBtn = container.querySelector('.btn-add-syllable')
      expect(addSylBtn).not.toBeNull()
      addSylBtn.click()

      await new Promise(r => setTimeout(r, 150))
      expect(onSongSaved).toHaveBeenCalled()

      // Borrar sílabas
      onSongSaved.mockClear()
      const clearSylBtn = container.querySelector('.btn-clear-line-syllables')
      expect(clearSylBtn).not.toBeNull()
      clearSylBtn.click()

      await new Promise(r => setTimeout(r, 150))
      expect(onSongSaved).toHaveBeenCalled()
    })

    it('flushea y guarda cambios pendientes con flushAutoSave', async () => {
      const onSongSaved = vi.fn()
      const editor = createSongEditorView({ containerElement: container, onSongSaved })
      editor.open(sampleSong)

      const phraseInput = container.querySelector('.input-phrase-text')
      phraseInput.value = 'Texto pendiente de guardado'
      phraseInput.dispatchEvent(new Event('input')) // programa autoSaveTimer

      expect(onSongSaved).not.toHaveBeenCalled()

      await editor.flushAutoSave()
      expect(onSongSaved).toHaveBeenCalled()
    })
  })

  describe('Gestión de idiomas en pestañas y modal de configuración', () => {
    const multiLangSong = {
      id: 'song-lang-test',
      title: 'Canción Multilingüe',
      artist: 'Artista Test',
      lyrics_data: {
        languages: [
          {
            name: 'Japonés',
            code: 'ja',
            isMain: true,
            lines: [{ text: '夜に駆ける', startTime: 0, endTime: 3, syllables: [] }]
          },
          {
            name: 'Español',
            code: 'es',
            isMain: false,
            lines: [{ text: 'Corriendo en la noche', startTime: 0, endTime: 3, syllables: [] }]
          }
        ]
      },
      videos: [{ id: 'vid-1', name: 'Original', url: 'https://youtube.com/watch?v=123', offset: 0 }]
    }

    it('ubica el botón de añadir idioma dentro de la barra de pestañas como un botón +', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(multiLangSong)

      const tabsBar = container.querySelector('.editor-lang-tabs-bar')
      expect(tabsBar).not.toBeNull()

      const addBtnInTabs = tabsBar.querySelector('#btn-add-language.btn-add-lang-tab')
      expect(addBtnInTabs).not.toBeNull()

      // En el header general ya no debe estar el botón antiguo
      const headerOldBtn = container.querySelector('.editor-lyrics-header #btn-add-language')
      expect(headerOldBtn).toBeNull()
    })

    it('en el idioma principal, "Hacer Principal" no aparece y "Eliminar Idioma" está bloqueado', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(multiLangSong)

      // Abrir modal de configuración del idioma activo (principal: Japonés) haciendo clic en la pestaña activa
      const activeTab = container.querySelector('.editor-lang-tab.active')
      expect(activeTab).not.toBeNull()
      activeTab.click()

      expect(container.querySelector('.modal-dialog')).not.toBeNull()
      const setMainBtn = container.querySelector('#btn-modal-set-lang-main')
      expect(setMainBtn).toBeNull()

      const deleteBtn = container.querySelector('#btn-modal-delete-lang')
      expect(deleteBtn).not.toBeNull()
      expect(deleteBtn.disabled).toBe(true)
      expect(container.querySelector('.main-lang-indicator-badge')).not.toBeNull()
    })

    it('en un idioma secundario, "Hacer Principal" aparece y "Eliminar Idioma" está habilitado', async () => {
      const onSongSaved = vi.fn()
      const editor = createSongEditorView({ containerElement: container, onSongSaved })
      editor.open(multiLangSong)

      // Cambiar a la pestaña de Español (secundario)
      const tabs = container.querySelectorAll('.editor-lang-tab')
      tabs[1].click()

      // Abrir modal de configuración haciendo clic nuevamente en la pestaña activa
      const activeTab = container.querySelector('.editor-lang-tab.active')
      expect(activeTab).not.toBeNull()
      activeTab.click()

      const setMainBtn = container.querySelector('#btn-modal-set-lang-main')
      expect(setMainBtn).not.toBeNull()

      const deleteBtn = container.querySelector('#btn-modal-delete-lang')
      expect(deleteBtn).not.toBeNull()
      expect(deleteBtn.disabled).toBe(false)

      // Hacer principal
      setMainBtn.click()
      await new Promise(r => setTimeout(r, 50))

      // Ahora Español es principal: el botón "Hacer Principal" desapareció y "Eliminar" se bloqueó
      expect(container.querySelector('#btn-modal-set-lang-main')).toBeNull()
      const updatedDeleteBtn = container.querySelector('#btn-modal-delete-lang')
      expect(updatedDeleteBtn.disabled).toBe(true)
      expect(onSongSaved).toHaveBeenCalled()
    })

    it('permite eliminar un idioma secundario desde el modal cerrando el diálogo', async () => {
      const onSongSaved = vi.fn()
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
      const editor = createSongEditorView({ containerElement: container, onSongSaved })
      editor.open(multiLangSong)

      // Cambiar a la pestaña de Español (secundario)
      const tabs = container.querySelectorAll('.editor-lang-tab')
      tabs[1].click()

      // Abrir modal de configuración haciendo clic nuevamente en la pestaña activa
      const activeTab = container.querySelector('.editor-lang-tab.active')
      expect(activeTab).not.toBeNull()
      activeTab.click()

      const deleteBtn = container.querySelector('#btn-modal-delete-lang')
      deleteBtn.click()
      await new Promise(r => setTimeout(r, 50))

      // El modal debe haberse cerrado y debe quedar 1 solo idioma
      expect(container.querySelector('.modal-dialog')).toBeNull()
      const remainingTabs = container.querySelectorAll('.editor-lang-tab')
      expect(remainingTabs.length).toBe(1)
      expect(onSongSaved).toHaveBeenCalled()

      confirmSpy.mockRestore()
    })

    it('desactiva y oculta la edición de sílabas en traducciones y solo la permite en el idioma principal', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(multiLangSong)

      // 1. En el idioma principal (Japonés, isMain: true)
      // Debe existir el botón de sílabas en los versos
      const mainSylButtons = container.querySelectorAll('.btn-toggle-syllables')
      expect(mainSylButtons.length).toBeGreaterThan(0)

      // 2. Cambiar a la traducción (Español, isMain: false)
      const tabs = container.querySelectorAll('.editor-lang-tab')
      tabs[1].click()

      // En la traducción NO debe existir botón para editar o desplegar sílabas
      const transSylButtons = container.querySelectorAll('.btn-toggle-syllables')
      expect(transSylButtons.length).toBe(0)

      // Tampoco debe renderizarse ningún panel de sílabas
      const sylPanels = container.querySelectorAll('.phrase-syllables-panel')
      expect(sylPanels.length).toBe(0)

      // Tampoco debe aparecer el botón de borrar todas las sílabas
      expect(container.querySelector('#btn-clear-all-syllables')).toBeNull()

      // Y en el modal de pegar letra completa, no debe mostrar opción de silabear
      const quickImportBtn = container.querySelector('.btn-open-quick-import')
      quickImportBtn.click()
      expect(container.querySelector('#check-auto-syllabify')).toBeNull()
    })

    it('mantiene la posición de scroll al mostrar o esconder el menú de sílabas', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(sampleSong)

      const scrollContainer = container.querySelector('.editor-content-scroll')
      expect(scrollContainer).not.toBeNull()

      // Simular que el usuario ha scrolleado hacia abajo
      scrollContainer.scrollTop = 450
      expect(scrollContainer.scrollTop).toBe(450)

      // Clic para colapsar o expandir sílabas
      const toggleSylBtn = container.querySelector('.btn-toggle-syllables')
      expect(toggleSylBtn).not.toBeNull()
      toggleSylBtn.click()

      // El contenedor de scroll debe haber preservado su posición exacta
      const updatedScrollContainer = container.querySelector('.editor-content-scroll')
      expect(updatedScrollContainer.scrollTop).toBe(450)

      // Clic nuevamente para alternar estado
      const toggleSylBtnAfter = container.querySelector('.btn-toggle-syllables')
      toggleSylBtnAfter.click()
      const finalScrollContainer = container.querySelector('.editor-content-scroll')
      expect(finalScrollContainer.scrollTop).toBe(450)
    })

    it('permite cerrar la alerta de estado con el botón X y con el método clearStatus', async () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(sampleSong)

      // Simular alerta de estado en el editor exportando la canción
      const exportBtn = container.querySelector('#btn-editor-export-json')
      expect(exportBtn).not.toBeNull()
      exportBtn.click()

      let alertEl = null
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 25))
        alertEl = container.querySelector('.status-alert')
        if (alertEl && alertEl.textContent.includes('descargado con éxito')) break
      }

      expect(alertEl).not.toBeNull()
      expect(alertEl.textContent).toContain('descargado con éxito')

      const closeBtn = container.querySelector('#btn-close-editor-alert')
      expect(closeBtn).not.toBeNull()
      closeBtn.click()

      expect(container.querySelector('.status-alert')).toBeNull()

      // Probar clearStatus()
      exportBtn.click()
      for (let i = 0; i < 20; i++) {
        await new Promise(r => setTimeout(r, 25))
        if (container.querySelector('.status-alert')) break
      }
      expect(container.querySelector('.status-alert')).not.toBeNull()
      editor.clearStatus()
      expect(container.querySelector('.status-alert')).toBeNull()
    })

    it('ubica el cuadro de alerta de estado debajo del controlador de tiempo y antes del contenido con scroll en el header', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(sampleSong, {
        initialStatus: { message: 'Mensaje de prueba en cabecera', type: 'info' }
      })

      const alertEl = container.querySelector('.status-alert')
      const timeControllerEl = container.querySelector('.editor-audio-assistant')
      const scrollEl = container.querySelector('.editor-content-scroll')

      expect(alertEl).not.toBeNull()
      expect(timeControllerEl).not.toBeNull()
      expect(scrollEl).not.toBeNull()

      // alertEl debe estar posicionado después de timeControllerEl
      expect(timeControllerEl.compareDocumentPosition(alertEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      // alertEl debe estar posicionado antes de scrollEl (fuera del scroll, en el header fijo)
      expect(alertEl.compareDocumentPosition(scrollEl) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })
  })

  describe('Resaltado reactivo de verso y sílaba activa en el editor', () => {
    it('al entrar al editor, las frases tienen la edición de sílabas cerrada por defecto para evitar ruido en pantalla', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(sampleSong)

      expect(container.querySelector('.phrase-syllables-panel')).toBeNull()
      expect(container.querySelectorAll('.syllable-edit-chip').length).toBe(0)

      const toggleBtn = container.querySelector('.btn-toggle-syllables[data-line-idx="0"]')
      expect(toggleBtn).not.toBeNull()
      toggleBtn.click()

      expect(container.querySelector('.phrase-syllables-panel')).not.toBeNull()
      expect(container.querySelectorAll('.syllable-edit-chip').length).toBeGreaterThan(0)
    })

    it('resalta el contenedor del verso y la sílaba actual según el tiempo del asistente', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(sampleSong)

      // Expandir panel de sílabas de la frase 0 para inspeccionar chips
      const toggleSylBtn = container.querySelector('.btn-toggle-syllables[data-line-idx="0"]')
      if (toggleSylBtn) toggleSylBtn.click()

      const line0 = container.querySelector('.phrase-editor-card[data-line-idx="0"]')
      expect(line0).not.toBeNull()
      expect(line0.classList.contains('is-active-phrase')).toBe(false)

      // A 2.5s: cae dentro del verso 0 (2.0s - 5.0s) y en la sílaba 0 "Fra" (2.0s - 3.5s)
      editor.updateClock(2.5)

      expect(line0.classList.contains('is-active-phrase')).toBe(true)
      const syl0 = container.querySelector('.syllable-edit-chip[data-line-idx="0"][data-syl-idx="0"]')
      const syl1 = container.querySelector('.syllable-edit-chip[data-line-idx="0"][data-syl-idx="1"]')
      expect(syl0).not.toBeNull()
      expect(syl1).not.toBeNull()
      expect(syl0.classList.contains('is-active-syllable')).toBe(true)
      expect(syl1.classList.contains('is-active-syllable')).toBe(false)

      // A 3.8s: cambia a la sílaba 1 "se" (3.5s - 5.0s) manteniendo el verso 0 activo
      editor.updateClock(3.8)
      expect(line0.classList.contains('is-active-phrase')).toBe(true)
      expect(syl0.classList.contains('is-active-syllable')).toBe(false)
      expect(syl1.classList.contains('is-active-syllable')).toBe(true)

      // A 6.0s: fuera del verso 0 (termina a 5.0s)
      editor.updateClock(6.0)
      expect(line0.classList.contains('is-active-phrase')).toBe(false)
      expect(syl0.classList.contains('is-active-syllable')).toBe(false)
      expect(syl1.classList.contains('is-active-syllable')).toBe(false)
    })

    it('actualiza el verso y sílaba activa al deslizar la barra de progreso del asistente', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(sampleSong)

      // Expandir panel de sílabas de la frase 0 para inspeccionar chips
      const toggleSylBtn = container.querySelector('.btn-toggle-syllables[data-line-idx="0"]')
      if (toggleSylBtn) toggleSylBtn.click()

      const progressSlider = container.querySelector('#editor-progress-slider')
      expect(progressSlider).not.toBeNull()

      const line0 = container.querySelector('.phrase-editor-card[data-line-idx="0"]')
      const syl0 = container.querySelector('.syllable-edit-chip[data-line-idx="0"][data-syl-idx="0"]')

      // Deslizar al segundo 2.2 con rango configurado
      progressSlider.max = '10'
      progressSlider.value = '2.2'
      progressSlider.dispatchEvent(new Event('input'))

      expect(line0.classList.contains('is-active-phrase')).toBe(true)
      expect(syl0.classList.contains('is-active-syllable')).toBe(true)

      // Deslizar a silencio / antes del inicio (0.5s)
      progressSlider.value = '0.5'
      progressSlider.dispatchEvent(new Event('input'))

      expect(line0.classList.contains('is-active-phrase')).toBe(false)
      expect(syl0.classList.contains('is-active-syllable')).toBe(false)
    })

    it('no reinicia el reproductor ni detiene la reproducción si la canción ya está cargada en mediaPlayer y adapta el estado', () => {
      const mockMediaPlayer = {
        getCurrentSong: vi.fn(() => sampleSong),
        getIsPlaying: vi.fn(() => true),
        getCurrentTime: vi.fn(() => 2.5),
        getDuration: vi.fn(() => 100),
        getVolume: vi.fn(() => 80),
        loadSong: vi.fn()
      }

      const editor = createSongEditorView({
        containerElement: container,
        mediaPlayer: mockMediaPlayer
      })

      editor.open(sampleSong)

      // 1. loadSong no debe ser llamado porque ya está cargada
      expect(mockMediaPlayer.loadSong).not.toHaveBeenCalled()

      // 2. El botón de reproducción debe reflejar el estado actual (reproduciendo -> Pausar)
      const playBtn = container.querySelector('#btn-assistant-play')
      expect(playBtn).not.toBeNull()
      expect(playBtn.title).toBe('Pausar')

      // 3. El reloj debe reflejar el tiempo actual (2.5s)
      const clockEl = container.querySelector('#assistant-clock-time')
      expect(clockEl).not.toBeNull()
      expect(clockEl.textContent).toBe('00:02.500')

      // 4. El slider de progreso debe reflejar el tiempo actual
      const slider = container.querySelector('#editor-progress-slider')
      expect(slider).not.toBeNull()
      expect(slider.value).toBe('2.5')

      // 5. La frase que cae en 2.5s debe estar activa
      const line0 = container.querySelector('.phrase-editor-card[data-line-idx="0"]')
      expect(line0.classList.contains('is-active-phrase')).toBe(true)
    })

    it('llama a loadSong en mediaPlayer si la canción a editar es diferente a la cargada actualmente', () => {
      const otherSong = { id: 999, title: 'Otra', artist: 'Otro' }
      const mockMediaPlayer = {
        getCurrentSong: vi.fn(() => otherSong),
        getIsPlaying: vi.fn(() => false),
        getCurrentTime: vi.fn(() => 0),
        getDuration: vi.fn(() => 0),
        getVolume: vi.fn(() => 80),
        loadSong: vi.fn(() => Promise.resolve())
      }

      const editor = createSongEditorView({
        containerElement: container,
        mediaPlayer: mockMediaPlayer
      })

      editor.open(sampleSong)

      // Debe llamar a loadSong para cargar la nueva canción
      expect(mockMediaPlayer.loadSong).toHaveBeenCalled()
    })
  })

  describe('Gestión de Offset de Videos y Sincronización en Tiempo Real', () => {
    it('renderiza botones -0.1 y +0.1 a los lados del input de offset para cada video', () => {
      const editor = createSongEditorView({ containerElement: container })
      editor.open(sampleSong)

      const decBtn = container.querySelector('.btn-vid-offset-dec[data-video-idx="0"]')
      const offsetInput = container.querySelector('.input-vid-offset[data-video-idx="0"]')
      const incBtn = container.querySelector('.btn-vid-offset-inc[data-video-idx="0"]')

      expect(decBtn).not.toBeNull()
      expect(decBtn.textContent.trim()).toBe('-0.1')
      expect(offsetInput).not.toBeNull()
      expect(incBtn).not.toBeNull()
      expect(incBtn.textContent.trim()).toBe('+0.1')

      // Verificar orden en el DOM: decBtn -> offsetInput -> incBtn
      expect(decBtn.compareDocumentPosition(offsetInput) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
      expect(offsetInput.compareDocumentPosition(incBtn) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('actualiza el offset en mediaPlayer y el verso/sílaba activa en tiempo real al usar los botones de paso', () => {
      let currentOffset = 0
      const setActiveOffsetSpy = vi.fn((newOff) => {
        currentOffset = newOff
      })

      const mockMediaPlayer = {
        getCurrentSong: () => sampleSong,
        getIsPlaying: () => false,
        getCurrentTime: () => 2.5, // Video time en 2.5s
        getLyricsTime: () => 2.5 - currentOffset,
        getActiveVideoId: () => 'v1',
        setActiveOffset: setActiveOffsetSpy,
        getDuration: () => 100,
        getVolume: () => 80
      }

      const editor = createSongEditorView({
        containerElement: container,
        mediaPlayer: mockMediaPlayer
      })
      editor.open(sampleSong)

      // Expandir panel de sílabas de la frase 0 para inspeccionar chips
      const toggleSylBtn = container.querySelector('.btn-toggle-syllables[data-line-idx="0"]')
      if (toggleSylBtn) toggleSylBtn.click()

      // Con offset 0, lyricsTime = 2.5s (dentro de verso 0: 2.0s-5.0s, sílaba 0 "Fra": 2.0s-3.5s)
      const line0 = container.querySelector('.phrase-editor-card[data-line-idx="0"]')
      const syl0 = container.querySelector('.syllable-edit-chip[data-line-idx="0"][data-syl-idx="0"]')
      expect(line0.classList.contains('is-active-phrase')).toBe(true)
      expect(syl0.classList.contains('is-active-syllable')).toBe(true)

      // Clic en +0.1 repetido varias veces hasta offset = 1.0s (lyricsTime = 2.5 - 1.0 = 1.5s, antes de 2.0s)
      const incBtn = container.querySelector('.btn-vid-offset-inc[data-video-idx="0"]')
      for (let i = 0; i < 10; i++) {
        incBtn.click()
      }

      expect(setActiveOffsetSpy).toHaveBeenCalled()
      const offsetInput = container.querySelector('.input-vid-offset[data-video-idx="0"]')
      expect(Number(offsetInput.value)).toBe(1.0)
      expect(editor.getCurrentSong().videos[0].offset).toBe(1.0)

      // Al ser lyricsTime = 1.5s, está antes del verso 0 (inicia a 2.0s), debe desactivarse
      expect(line0.classList.contains('is-active-phrase')).toBe(false)
      expect(syl0.classList.contains('is-active-syllable')).toBe(false)

      // Ahora retroceder con -0.1 diez veces para volver a offset = 0.0s
      const decBtn = container.querySelector('.btn-vid-offset-dec[data-video-idx="0"]')
      for (let i = 0; i < 10; i++) {
        decBtn.click()
      }

      expect(Number(offsetInput.value)).toBe(0)
      // Debe reactivarse el verso 0 y la sílaba 0
      expect(line0.classList.contains('is-active-phrase')).toBe(true)
      expect(syl0.classList.contains('is-active-syllable')).toBe(true)
    })

    it('actualiza el offset y el marcado activo al modificar manualmente el input de offset', () => {
      let currentOffset = 0
      const setActiveOffsetSpy = vi.fn((newOff) => {
        currentOffset = newOff
      })

      const mockMediaPlayer = {
        getCurrentSong: () => sampleSong,
        getIsPlaying: () => false,
        getCurrentTime: () => 2.5,
        getLyricsTime: () => 2.5 - currentOffset,
        getActiveVideoId: () => 'v1',
        setActiveOffset: setActiveOffsetSpy,
        getDuration: () => 100,
        getVolume: () => 80
      }

      const editor = createSongEditorView({
        containerElement: container,
        mediaPlayer: mockMediaPlayer
      })
      editor.open(sampleSong)

      const line0 = container.querySelector('.phrase-editor-card[data-line-idx="0"]')
      expect(line0.classList.contains('is-active-phrase')).toBe(true)

      const offsetInput = container.querySelector('.input-vid-offset[data-video-idx="0"]')
      offsetInput.value = '2.0'
      offsetInput.dispatchEvent(new Event('input'))

      expect(setActiveOffsetSpy).toHaveBeenCalledWith(2.0)
      // Con offset 2.0, lyricsTime = 2.5 - 2.0 = 0.5s (antes del verso 0), no debe estar activo
      expect(line0.classList.contains('is-active-phrase')).toBe(false)
    })
  })
})
