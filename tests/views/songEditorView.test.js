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

      // Abrir modal de configuración del idioma activo (principal: Japonés)
      const editBtn = container.querySelector('#btn-edit-active-lang')
      editBtn.click()

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

      // Abrir modal de configuración
      const editBtn = container.querySelector('#btn-edit-active-lang')
      editBtn.click()

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

      // Abrir modal de configuración
      const editBtn = container.querySelector('#btn-edit-active-lang')
      editBtn.click()

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
  })
})
