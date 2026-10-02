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
})
