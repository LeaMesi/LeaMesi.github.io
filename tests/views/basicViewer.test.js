import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createBasicViewer } from '../../src/views/basicViewer.js'

describe('views/basicViewer.js', () => {
  let container = null

  const sampleLines = [
    {
      id: 'l1',
      startTime: 5.0,
      endTime: 9.0,
      text: 'Primera frase cantada',
      altText: 'Romaji frase uno',
      syllables: [
        { text: 'Pri', startTime: 5.0, duration: 1.0 },
        { text: 'me', startTime: 6.0, duration: 1.0 },
        { text: 'ra ', startTime: 7.0, duration: 1.0 },
        { text: 'fra', startTime: 8.0, duration: 0.5 },
        { text: 'se ', startTime: 8.5, duration: 0.5 },
        { text: 'can', startTime: 9.0, duration: 0.5 },
        { text: 'ta', startTime: 9.5, duration: 0.5 },
        { text: 'da', startTime: 10.0, duration: 0.5 }
      ]
    },
    {
      id: 'l2',
      startTime: 10.0,
      endTime: 14.0,
      text: 'Segunda frase cantada',
      altText: 'Romaji frase dos',
      syllables: [
        { text: 'Se', startTime: 10.0, duration: 2.0 },
        { text: 'gun', startTime: 12.0, duration: 2.0 }
      ]
    },
    {
      id: 'l3',
      startTime: 15.0,
      endTime: 19.0,
      text: 'Tercera frase cantada',
      syllables: []
    }
  ]

  const sampleTranslations = [
    { id: 't1', startTime: 5.0, endTime: 9.0, text: 'First sung phrase' },
    { id: 't2', startTime: 10.0, endTime: 14.0, text: 'Second sung phrase' }
  ]

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
  })

  it('muestra aviso de letra vacía cuando no hay versos', () => {
    const viewer = createBasicViewer(container)
    viewer.setLyrics({ lines: [] })
    expect(container.querySelector('.empty-lyrics-notice')).not.toBeNull()
  })

  it('renderiza la frase activa en el centro y las frases siguientes debajo', () => {
    const viewer = createBasicViewer(container, { initialPreviewCount: 2 })
    viewer.setLyrics({ lines: sampleLines })

    const activeBox = container.querySelector('#active-phrase-box')
    expect(activeBox).not.toBeNull()
    expect(activeBox.textContent).toContain('Primera frase cantada')

    const upcomingBox = container.querySelector('#upcoming-phrases-box')
    expect(upcomingBox).not.toBeNull()
    const upcomingItems = upcomingBox.querySelectorAll('.upcoming-phrase-item')
    expect(upcomingItems.length).toBe(2)
  })

  it('omite el contenedor inferior cuando previewCount es 0 (modo solo frase actual)', () => {
    const viewer = createBasicViewer(container, { initialPreviewCount: 0 })
    viewer.setLyrics({ lines: sampleLines })

    expect(container.querySelector('#active-phrase-box')).not.toBeNull()
    expect(container.querySelector('#upcoming-phrases-box')).toBeNull()
  })

  it('actualiza el resaltado de sílabas en tiempo real según el tiempo', () => {
    const viewer = createBasicViewer(container)
    viewer.setLyrics({ lines: sampleLines })

    // A tiempo 6.5s: 'Pri' (5-6) completada, 'me' (6-7) activa, 'ra ' (7-9) upcoming
    viewer.updateTime(6.5)

    const syl0 = container.querySelector('[data-syl="0"]')
    const syl1 = container.querySelector('[data-syl="1"]')
    const syl2 = container.querySelector('[data-syl="2"]')

    expect(syl0.classList.contains('is-completed-syl')).toBe(true)
    expect(syl1.classList.contains('is-active-syl')).toBe(true)
    expect(syl2.classList.contains('is-upcoming-syl')).toBe(true)
  })

  it('renderiza subtítulo de traducción cuando está activa', () => {
    const viewer = createBasicViewer(container)
    viewer.setLyrics({
      lines: sampleLines,
      translations: sampleTranslations,
      isTranslationActive: true
    })

    const transEl = container.querySelector('.translation-line.current-translation')
    expect(transEl).not.toBeNull()
    expect(transEl.textContent).toContain('First sung phrase')
  })

  it('soporta los 3 modos de texto alternativo (both, original, alt)', () => {
    const viewer = createBasicViewer(container, { initialScriptDisplayMode: 'both' })
    viewer.setLyrics({ lines: sampleLines })

    // Modo 'both'
    expect(container.querySelector('#active-line-main')).not.toBeNull()
    expect(container.querySelector('#active-line-alt')).not.toBeNull()

    // Modo 'original'
    viewer.setScriptDisplayMode('original')
    expect(container.querySelector('#active-line-main')).not.toBeNull()
    expect(container.querySelector('#active-line-alt')).toBeNull()

    // Modo 'alt'
    viewer.setScriptDisplayMode('alt')
    const primaryAlt = container.querySelector('#active-line-main.is-primary-alt')
    expect(primaryAlt).not.toBeNull()
    expect(primaryAlt.textContent).toContain('Romaji frase uno')
  })

  it('invoca onSeekLine al hacer clic en una frase siguiente', () => {
    const onSeekLine = vi.fn()
    const viewer = createBasicViewer(container, { onSeekLine, initialPreviewCount: 2 })
    viewer.setLyrics({ lines: sampleLines })

    const upcomingItem = container.querySelector('.upcoming-phrase-item')
    expect(upcomingItem).not.toBeNull()
    upcomingItem.click()

    expect(onSeekLine).toHaveBeenCalledWith(10.0) // startTime de la segunda frase
  })

  it('preserva los espacios entre palabras en la frase activa para letras alternativas (Romaji)', () => {
    const viewer = createBasicViewer(container, { initialScriptDisplayMode: 'both' })
    const jpLines = [
      {
        id: 'jp1',
        startTime: 0,
        endTime: 4,
        text: '無敵の笑顔で荒らすメディア',
        altText: 'muteki no egao de arasu media',
        syllables: [
          { text: '無敵の', altText: 'muteki no', startTime: 0, duration: 0.8 },
          { text: '笑顔', altText: 'egao', startTime: 0.8, duration: 0.5 },
          { text: 'で', altText: 'de', startTime: 1.3, duration: 0.2 },
          { text: '荒らす', altText: 'arasu', startTime: 1.5, duration: 0.4 },
          { text: 'メディ', altText: 'medi', startTime: 1.9, duration: 0.5 },
          { text: 'ア', altText: 'a', startTime: 2.4, duration: 0.4 }
        ]
      },
      {
        id: 'jp2',
        startTime: 4,
        endTime: 8,
        text: '知りたいその秘密ミステリアス',
        altText: 'shiritai sono himitsu misuteriasu',
        syllables: [
          { text: '知りたい', altText: 'shiritai', startTime: 4, duration: 0.6 },
          { text: 'その', altText: 'sono', startTime: 4.6, duration: 0.4 },
          { text: '秘密', altText: 'himitsu', startTime: 5.0, duration: 0.5 },
          { text: 'ミス', altText: 'misu', startTime: 5.5, duration: 0.4 },
          { text: 'テリ', altText: 'teri', startTime: 5.9, duration: 0.4 },
          { text: 'アス', altText: 'asu', startTime: 6.3, duration: 0.4 }
        ]
      }
    ]

    viewer.setLyrics({ lines: jpLines })

    // Frase activa 0
    const activeAlt = container.querySelector('#active-line-alt')
    expect(activeAlt).not.toBeNull()
    // El texto resultante debe tener exactamente todos los espacios, y no estar pegado
    expect(activeAlt.textContent).toBe('muteki no egao de arasu media')

    // Frase siguiente (previsualización)
    const upcomingAlt = container.querySelector('.upcoming-phrase-item .lyric-line-alt')
    expect(upcomingAlt).not.toBeNull()
    expect(upcomingAlt.textContent).toBe('shiritai sono himitsu misuteriasu')

    // Al avanzar a la frase 2 (tiempo 4.5s)
    viewer.updateTime(4.5)
    const newActiveAlt = container.querySelector('#active-line-alt')
    expect(newActiveAlt.textContent).toBe('shiritai sono himitsu misuteriasu')
  })
})
