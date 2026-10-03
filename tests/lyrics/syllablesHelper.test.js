import { describe, it, expect } from 'vitest'
import {
  syllabifyWord,
  splitPhraseIntoSyllables,
  splitPhraseIntoWords,
  calculateSyllableWeight,
  autoDistributeSyllables
} from '../../src/lyrics/syllablesHelper.js'

describe('lyrics/syllablesHelper.js', () => {
  describe('syllabifyWord', () => {
    it('retorna array con palabra si tiene 1 caracter o está vacía', () => {
      expect(syllabifyWord('')).toEqual([''])
      expect(syllabifyWord('a')).toEqual(['a'])
      expect(syllabifyWord('y')).toEqual(['y'])
    })

    it('respeta palabras pre-divididas con guiones explícitos', () => {
      expect(syllabifyWord('Ca-mi-nar')).toEqual(['Ca', 'mi', 'nar'])
      expect(syllabifyWord('co-ra-zón')).toEqual(['co', 'ra', 'zón'])
    })

    it('mantiene intactas palabras o siglas sin vocales', () => {
      expect(syllabifyWord('km')).toEqual(['km'])
      expect(syllabifyWord('psst')).toEqual(['psst'])
    })

    it('silabea palabras regulares en español', () => {
      expect(syllabifyWord('casa')).toEqual(['ca', 'sa'])
      expect(syllabifyWord('caminar')).toEqual(['ca', 'mi', 'nar'])
      expect(syllabifyWord('sol')).toEqual(['sol'])
    })

    it('maneja grupos consonánticos inseparables (bl, cl, tr, ch, ll, rr)', () => {
      expect(syllabifyWord('playa')).toEqual(['pla', 'ya'])
      expect(syllabifyWord('coche')).toEqual(['co', 'che'])
      expect(syllabifyWord('perro')).toEqual(['pe', 'rro'])
      expect(syllabifyWord('blanco')).toEqual(['blan', 'co'])
    })

    it('maneja diptongos (fuerte + débil o débil + débil)', () => {
      expect(syllabifyWord('aire')).toEqual(['ai', 're'])
      expect(syllabifyWord('ciudad')).toEqual(['ciu', 'dad'])
      expect(syllabifyWord('cielo')).toEqual(['cie', 'lo'])
    })

    it('reconoce hiato por dos vocales fuertes contiguas', () => {
      expect(syllabifyWord('teatro')).toEqual(['te', 'a', 'tro'])
      expect(syllabifyWord('poeta')).toEqual(['po', 'e', 'ta'])
    })

    it('reconoce hiato provocado por acento en vocal débil', () => {
      expect(syllabifyWord('país')).toEqual(['pa', 'ís'])
      expect(syllabifyWord('caída')).toEqual(['ca', 'í', 'da'])
      expect(syllabifyWord('día')).toEqual(['dí', 'a'])
    })

    it('separa adecuadamente combinaciones con 3 o más consonantes', () => {
      expect(syllabifyWord('estrella')).toEqual(['es', 'tre', 'lla'])
      expect(syllabifyWord('instante')).toEqual(['ins', 'tan', 'te'])
    })
  })

  describe('splitPhraseIntoSyllables', () => {
    it('retorna array vacío si el texto es nulo o vacío', () => {
      expect(splitPhraseIntoSyllables('')).toEqual([])
      expect(splitPhraseIntoSyllables('   ')).toEqual([])
      expect(splitPhraseIntoSyllables(null)).toEqual([])
    })

    it('preserva los espacios entre palabras en la última sílaba de cada palabra', () => {
      const syls = splitPhraseIntoSyllables('Hola mundo')
      // 'Hola ' -> 'Ho', 'la '
      // 'mundo' -> 'mun', 'do'
      expect(syls).toEqual(['Ho', 'la ', 'mun', 'do'])
    })

    it('reconstruye exactamente la frase original al concatenarse', () => {
      const phrase = 'Caminando por la hermosa ciudad'
      const syls = splitPhraseIntoSyllables(phrase)
      expect(syls.join('')).toBe(phrase)
    })
  })

  describe('splitPhraseIntoWords', () => {
    it('retorna array vacío si la frase está vacía', () => {
      expect(splitPhraseIntoWords('')).toEqual([])
      expect(splitPhraseIntoWords('  ')).toEqual([])
    })

    it('divide por palabras preservando espacios', () => {
      const words = splitPhraseIntoWords('Cantar bajo la lluvia')
      expect(words).toEqual(['Cantar ', 'bajo ', 'la ', 'lluvia'])
      expect(words.join('')).toBe('Cantar bajo la lluvia')
    })
  })

  describe('calculateSyllableWeight', () => {
    it('retorna peso por defecto para textos vacíos o nulos', () => {
      expect(calculateSyllableWeight('')).toBe(1.0)
      expect(calculateSyllableWeight('   ')).toBe(1.0)
      expect(calculateSyllableWeight(null)).toBe(1.0)
    })

    it('asigna mayor peso a diptongos y triptongos que a vocales simples', () => {
      const singleVowel = calculateSyllableWeight('de', 0, 3)
      const diphthong = calculateSyllableWeight('ciel', 0, 3)
      const triphthong = calculateSyllableWeight('buey', 0, 3)

      expect(diphthong).toBeGreaterThan(singleVowel)
      expect(triphthong).toBeGreaterThan(diphthong)
    })

    it('asigna mayor peso a sílabas con acento ortográfico tónico', () => {
      const unaccented = calculateSyllableWeight('co', 0, 3)
      const accented = calculateSyllableWeight('cá', 0, 3)
      expect(accented).toBeGreaterThan(unaccented)
    })

    it('aplica alargamiento de final de frase (phrase-final lengthening)', () => {
      const internalSyl = calculateSyllableWeight('mar', 0, 3)
      const finalSyl = calculateSyllableWeight('mar', 2, 3)
      expect(finalSyl).toBeGreaterThan(internalSyl)
    })

    it('asigna peso adicional por signos de puntuación o cesura', () => {
      const withoutComma = calculateSyllableWeight('sol', 0, 3)
      const withComma = calculateSyllableWeight('sol,', 0, 3)
      expect(withComma).toBeGreaterThan(withoutComma)
    })
  })

  describe('autoDistributeSyllables', () => {
    it('retorna array vacío si la lista de sílabas no es válida', () => {
      expect(autoDistributeSyllables([], 0, 5)).toEqual([])
      expect(autoDistributeSyllables(null, 0, 5)).toEqual([])
    })

    it('distribuye con modo equitativo cuando se especifica mode: "equal"', () => {
      const rawSyls = ['Ca', 'mi', 'nar']
      const distributed = autoDistributeSyllables(rawSyls, 10, 13, { mode: 'equal' })

      expect(distributed.length).toBe(3)
      // Duración total = 3 segundos, 3 sílabas => step = 1.0s
      expect(distributed[0].startTime).toBe(10)
      expect(distributed[1].startTime).toBe(11)
      expect(distributed[2].startTime).toBe(12)

      // Margen de duración 95% = 0.95
      expect(distributed[0].duration).toBe(0.95)
      expect(distributed[0].text).toBe('Ca')
      expect(distributed[1].text).toBe('mi')
      expect(distributed[2].text).toBe('nar')
      expect(distributed[0].id).toBeDefined()
    })

    it('distribuye inteligentemente con ponderación fonética por defecto', () => {
      const rawSyls = ['Ca', 'mi', 'nar']
      const distributed = autoDistributeSyllables(rawSyls, 10, 13)

      expect(distributed.length).toBe(3)
      // Comienza en startTime exacto
      expect(distributed[0].startTime).toBe(10)
      // Orden secuencial estricto
      expect(distributed[0].startTime).toBeLessThan(distributed[1].startTime)
      expect(distributed[1].startTime).toBeLessThan(distributed[2].startTime)

      // La sílaba final 'nar' tiene mayor peso por alargamiento final y consonantes que 'mi'
      expect(distributed[2].duration).toBeGreaterThan(distributed[1].duration)

      // Margen de duración y textos preservados
      expect(distributed[0].text).toBe('Ca')
      expect(distributed[1].text).toBe('mi')
      expect(distributed[2].text).toBe('nar')
      expect(distributed[0].id).toBeDefined()
    })

    it('soporta elementos que ya sean objetos con text', () => {
      const objSyls = [{ text: 'Hola ' }, { text: 'mundo' }]
      const distributed = autoDistributeSyllables(objSyls, 0, 2)
      expect(distributed[0].text).toBe('Hola ')
      expect(distributed[1].text).toBe('mundo')
      expect(distributed[0].startTime).toBe(0)
      expect(distributed[1].startTime).toBeGreaterThan(0)
      expect(distributed[0].startTime).toBeLessThan(distributed[1].startTime)
      expect(distributed[1].startTime + distributed[1].duration).toBeLessThanOrEqual(2.05)
    })
  })
})
