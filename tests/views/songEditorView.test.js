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

    const saveBtn = container.querySelector('#btn-save-song')
    expect(saveBtn).not.toBeNull()
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

  it('dispara onGoToMenu al hacer clic en el botón de retroceso', () => {
    const onGoToMenu = vi.fn()
    const editor = createSongEditorView({ containerElement: container, onGoToMenu })
    editor.open(sampleSong)

    const backBtn = container.querySelector('#btn-editor-back')
    expect(backBtn).not.toBeNull()
    backBtn.click()

    expect(onGoToMenu).toHaveBeenCalled()
  })

  it('renderiza los botones de exportación JSON y Lyricsfile en el encabezado del editor en la posición correcta', () => {
    const editor = createSongEditorView({ containerElement: container })
    editor.open(sampleSong)

    const exportJsonBtn = container.querySelector('#btn-editor-export-json')
    const exportYamlBtn = container.querySelector('#btn-editor-export-yaml')
    const quickImportBtn = container.querySelector('.btn-open-quick-import')
    const saveSongBtn = container.querySelector('#btn-save-song')

    expect(exportJsonBtn).not.toBeNull()
    expect(exportYamlBtn).not.toBeNull()
    expect(exportJsonBtn.textContent).toContain('JSON')
    expect(exportYamlBtn.textContent).toContain('Lyricsfile')

    // Verificar orden: a la derecha de Pegar Letra Completa y antes de Guardar Canción
    const headerActions = container.querySelector('.editor-header-actions')
    const children = Array.from(headerActions.children)
    const quickIdx = children.indexOf(quickImportBtn)
    const jsonIdx = children.indexOf(exportJsonBtn)
    const yamlIdx = children.indexOf(exportYamlBtn)
    const saveIdx = children.indexOf(saveSongBtn)

    expect(quickIdx).toBeLessThan(jsonIdx)
    expect(jsonIdx).toBeLessThan(yamlIdx)
    expect(yamlIdx).toBeLessThan(saveIdx)
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
  })
})
