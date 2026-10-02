import { describe, it, expect } from 'vitest'
import {
  hasJapanese,
  isKatakana,
  kanaToRomaji,
  transliterateJapaneseToRomaji,
  shouldAddTrailingSpace,
  transliterateSyllable,
  transliterateSyllables,
  autoGenerateRomajiForLines,
  autoEnrichSongWithRomaji
} from '../../src/lyrics/transliterationHelper.js'

describe('transliterationHelper', () => {
  describe('hasJapanese', () => {
    it('detecta correctamente texto con hiragana, katakana o kanji', () => {
      expect(hasJapanese('アイドル')).toBe(true)
      expect(hasJapanese('ひらがな')).toBe(true)
      expect(hasJapanese('無敵の笑顔')).toBe(true)
      expect(hasJapanese('YOASOBI - アイドル')).toBe(true)
      expect(hasJapanese('君が好きだと叫びたい')).toBe(true)
    })

    it('retorna false para textos sin caracteres japoneses', () => {
      expect(hasJapanese('Hello world')).toBe(false)
      expect(hasJapanese('Caminando por la ciudad')).toBe(false)
      expect(hasJapanese('12345 !?')).toBe(false)
      expect(hasJapanese('')).toBe(false)
      expect(hasJapanese(null)).toBe(false)
    })
  })

  describe('isKatakana', () => {
    it('identifica fragmentos puramente en katakana', () => {
      expect(isKatakana('アイドル')).toBe(true)
      expect(isKatakana('メディア')).toBe(true)
      expect(isKatakana('メディ')).toBe(true)
      expect(isKatakana('ア')).toBe(true)
      expect(isKatakana('ひらがな')).toBe(false)
      expect(isKatakana('笑顔')).toBe(false)
    })
  })

  describe('kanaToRomaji', () => {
    it('convierte vocales y consonantes básicas en hiragana y katakana', () => {
      expect(kanaToRomaji('あいうえお')).toBe('aiueo')
      expect(kanaToRomaji('かきくけこ')).toBe('kakikukeko')
      expect(kanaToRomaji('アイウエオ')).toBe('aiueo')
      expect(kanaToRomaji('カキクケコ')).toBe('kakikukeko')
    })

    it('maneja dígrafos yōon', () => {
      expect(kanaToRomaji('きゃきゅきょ')).toBe('kyakyukyo')
      expect(kanaToRomaji('しゃしゅしょ')).toBe('shashusho')
      expect(kanaToRomaji('ちゃちゅちょ')).toBe('chachucho')
      expect(kanaToRomaji('じゃじゅじょ')).toBe('jajujo')
      expect(kanaToRomaji('ティディ')).toBe('tidi')
    })

    it('maneja sokuon (っ / ッ) duplicando consonantes', () => {
      expect(kanaToRomaji('ずっと')).toBe('zutto')
      expect(kanaToRomaji('やっぱり')).toBe('yappari')
      expect(kanaToRomaji('ちょっと')).toBe('chotto')
      expect(kanaToRomaji('キット')).toBe('kitto')
    })

    it('maneja alargador chōonpu (ー)', () => {
      expect(kanaToRomaji('スター')).toBe('sutaa')
      expect(kanaToRomaji('コーヒー')).toBe('koohii')
    })

    it('convierte puntuación japonesa', () => {
      expect(kanaToRomaji('あ、い。う！？')).toBe('a, i. u!?')
    })
  })

  describe('transliterateJapaneseToRomaji', () => {
    it('translitera oraciones y versos icónicos con kanji a Romaji Hepburn', () => {
      const line1 = transliterateJapaneseToRomaji('無敵の笑顔で荒らすメディア')
      expect(line1).toContain('muteki')
      expect(line1).toContain('egao')
      expect(line1).toContain('arasu')
      expect(line1).toContain('media')

      const line2 = transliterateJapaneseToRomaji('完璧で嘘つきな君は')
      expect(line2).toContain('kanpeki')
      expect(line2).toContain('usotsuki')
      expect(line2).toContain('kimi')

      const line3 = transliterateJapaneseToRomaji('天才的なアイドル様')
      expect(line3).toContain('tensai')
      expect(line3).toContain('aidoru')
      expect(line3).toContain('sama')

      const line4 = transliterateJapaneseToRomaji('君が好きだと叫びたい')
      expect(line4).toContain('kimi')
      expect(line4).toContain('suki')
      expect(line4).toContain('sakebi')
    })

    it('conserva texto no japonés intacto', () => {
      expect(transliterateJapaneseToRomaji('Hello 123')).toBe('Hello 123')
    })
  })

  describe('shouldAddTrailingSpace', () => {
    it('no agrega espacio entre fragmentos continuos de Katakana de una misma palabra', () => {
      expect(shouldAddTrailingSpace('メディ', 'ア')).toBe(false)
      expect(shouldAddTrailingSpace('ミス', 'テリ')).toBe(false)
      expect(shouldAddTrailingSpace('テリ', 'アス')).toBe(false)
    })

    it('agrega espacio cuando hay frontera de palabras', () => {
      expect(shouldAddTrailingSpace('無敵の', '笑顔')).toBe(true)
      expect(shouldAddTrailingSpace('笑顔', 'で')).toBe(true)
      expect(shouldAddTrailingSpace('で', '荒らす')).toBe(true)
      expect(shouldAddTrailingSpace('荒らす', 'メディ')).toBe(true)
    })
  })

  describe('transliterateSyllables y autoGenerateRomajiForLines', () => {
    it('translitera un arreglo de sílabas preservando sincronización y límites de palabra', () => {
      const syllables = [
        { text: '無敵の', startTime: 0.5, duration: 0.8 },
        { text: '笑顔', startTime: 1.3, duration: 0.5 },
        { text: 'で', startTime: 1.8, duration: 0.2 },
        { text: '荒らす', startTime: 2.0, duration: 0.3 },
        { text: 'メディ', startTime: 2.3, duration: 0.4 },
        { text: 'ア', startTime: 2.7, duration: 0.3 }
      ]

      const result = transliterateSyllables(syllables)
      expect(result).toHaveLength(6)
      expect(result[0].altText.trim()).toBe('muteki no')
      expect(result[1].altText.trim()).toBe('egao')
      expect(result[2].altText.trim()).toBe('de')
      expect(result[3].altText.trim()).toBe('arasu')
      expect(result[4].altText.trim()).toBe('medi')
      expect(result[5].altText.trim()).toBe('a')

      // Concatenación total no debe tener espacio entre medi y a
      const joined = result.map(s => s.altText).join('').replace(/\s+/g, ' ').trim()
      expect(joined).toBe('muteki no egao de arasu media')
    })

    it('auto-genera altText en líneas y sílabas completas', () => {
      const lines = [
        {
          id: 'line-1',
          startTime: 0.5,
          endTime: 3.1,
          text: '無敵の笑顔で荒らすメディア',
          syllables: [
            { text: '無敵の', startTime: 0.5, duration: 0.8 },
            { text: '笑顔', startTime: 1.3, duration: 0.5 },
            { text: 'で', startTime: 1.8, duration: 0.2 },
            { text: '荒らす', startTime: 2.0, duration: 0.3 },
            { text: 'メディ', startTime: 2.3, duration: 0.4 },
            { text: 'ア', startTime: 2.7, duration: 0.3 }
          ]
        },
        {
          id: 'line-2',
          startTime: 3.4,
          endTime: 6.0,
          text: '知りたいその秘密ミステリアス',
          syllables: [
            { text: '知りたい', startTime: 3.4, duration: 0.8 },
            { text: 'その', startTime: 4.2, duration: 0.4 },
            { text: '秘密', startTime: 4.6, duration: 0.5 },
            { text: 'ミス', startTime: 5.1, duration: 0.3 },
            { text: 'テリ', startTime: 5.4, duration: 0.3 },
            { text: 'アス', startTime: 5.7, duration: 0.3 }
          ]
        }
      ]

      const updated = autoGenerateRomajiForLines(lines)
      expect(updated[0].altText).toBe('muteki no egao de arasu media')
      expect(updated[0].syllables[0].altText.trim()).toBe('muteki no')
      expect(updated[0].syllables[5].altText.trim()).toBe('a')

      expect(updated[1].altText).toBe('shiritai sono himitsu misuteriasu')
      expect(updated[1].syllables[0].altText.trim()).toBe('shiritai')
      expect(updated[1].syllables[2].altText.trim()).toBe('himitsu')
    })
  })

  describe('autoEnrichSongWithRomaji', () => {
    it('enriquece el paquete completo de canción y ajusta el código a ja', () => {
      const songPkg = {
        title: 'アイドル',
        artist: 'YOASOBI',
        lyrics_data: {
          languages: [
            {
              code: 'en', // API a veces devuelve 'en' por error para canciones japonesas
              name: 'English (Original)',
              isMain: true,
              plain: '無敵の笑顔で荒らすメディア\n知りたいその秘密ミステリアス',
              lines: [
                {
                  id: 'line-1',
                  startTime: 0.5,
                  endTime: 3.1,
                  text: '無敵の笑顔で荒らすメディア',
                  syllables: [
                    { text: '無敵の', startTime: 0.5, duration: 0.8 },
                    { text: '笑顔で荒らすメディア', startTime: 1.3, duration: 1.8 }
                  ]
                }
              ]
            }
          ]
        }
      }

      const enriched = autoEnrichSongWithRomaji(songPkg)
      const mainLang = enriched.lyrics_data.languages[0]
      expect(mainLang.code).toBe('ja')
      expect(mainLang.name).toBe('Japonés (Original)')
      expect(mainLang.lines[0].altText).toBeTruthy()
      expect(mainLang.lines[0].syllables[0].altText).toBeTruthy()
      expect(hasJapanese(mainLang.lines[0].altText)).toBe(false)
    })
  })
})
