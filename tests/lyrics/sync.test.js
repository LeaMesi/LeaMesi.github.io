import { describe, it, expect } from 'vitest'
import {
  findActiveLineIndex,
  evaluateSyllablesState,
  findMatchingTranslationLine
} from '../../src/lyrics/sync.js'

describe('lyrics/sync.js', () => {
  const lines = [
    { id: 'l1', startTime: 10, endTime: 14, text: 'Primera frase' },
    { id: 'l2', startTime: 16, endTime: 20, text: 'Segunda frase' },
    { id: 'l3', startTime: 25, endTime: 30, text: 'Tercera frase' }
  ]

  describe('findActiveLineIndex', () => {
    it('retorna -1 si el array de líneas está vacío', () => {
      expect(findActiveLineIndex([], 10)).toBe(-1)
      expect(findActiveLineIndex(null, 10)).toBe(-1)
    })

    it('retorna 0 si el tiempo es menor al inicio de la primera línea', () => {
      expect(findActiveLineIndex(lines, 5)).toBe(0)
    })

    it('identifica la línea activa cuando el tiempo cae en su intervalo', () => {
      expect(findActiveLineIndex(lines, 10)).toBe(0)
      expect(findActiveLineIndex(lines, 12.5)).toBe(0)
      expect(findActiveLineIndex(lines, 14)).toBe(0)
      expect(findActiveLineIndex(lines, 18)).toBe(1)
      expect(findActiveLineIndex(lines, 27)).toBe(2)
    })

    it('anticipa la siguiente línea si faltan menos de 1.5 segundos para que comience', () => {
      // Línea 1 termina en 14, línea 2 empieza en 16.
      // A tiempo 15.0 faltan 1.0s para línea 2 -> anticipa índice 1
      expect(findActiveLineIndex(lines, 15.0)).toBe(1)

      // A tiempo 14.2 faltan 1.8s (> 1.5s) -> mantiene índice 0
      expect(findActiveLineIndex(lines, 14.2)).toBe(0)
    })

    it('retorna la última línea si el tiempo supera el final de la última línea', () => {
      expect(findActiveLineIndex(lines, 50)).toBe(2)
    })
  })

  describe('evaluateSyllablesState', () => {
    const syllables = [
      { text: 'Ca', startTime: 10.0, duration: 1.0 },
      { text: 'mi', startTime: 11.0, duration: 1.0 },
      { text: 'nar', startTime: 12.0, duration: 1.0 }
    ]

    it('retorna array vacío si no hay sílabas', () => {
      expect(evaluateSyllablesState([], 10)).toEqual([])
      expect(evaluateSyllablesState(null, 10)).toEqual([])
    })

    it('clasifica sílabas futuras como upcoming con progreso 0', () => {
      const states = evaluateSyllablesState(syllables, 8.0)
      expect(states.every(s => s.state === 'upcoming' && s.progress === 0)).toBe(true)
    })

    it('clasifica sílabas pasadas como completed con progreso 1', () => {
      const states = evaluateSyllablesState(syllables, 15.0)
      expect(states.every(s => s.state === 'completed' && s.progress === 1)).toBe(true)
    })

    it('clasifica sílaba en reproducción como active con progreso proporcional', () => {
      // A tiempo 11.5: 'Ca' (10-11) completada, 'mi' (11-12) activa al 50%, 'nar' (12-13) upcoming
      const states = evaluateSyllablesState(syllables, 11.5)

      expect(states[0].state).toBe('completed')
      expect(states[0].progress).toBe(1.0)

      expect(states[1].state).toBe('active')
      expect(states[1].progress).toBeCloseTo(0.5, 2)

      expect(states[2].state).toBe('upcoming')
      expect(states[2].progress).toBe(0.0)
    })
  })

  describe('findMatchingTranslationLine', () => {
    const transLines = [
      { id: 't1', startTime: 10.2, endTime: 14.1, text: 'First phrase' },
      { id: 't2', startTime: 16.0, endTime: 19.8, text: 'Second phrase' }
    ]

    it('empareja por índice directo si los tiempos están cercanos', () => {
      const mainLine = { startTime: 10.0, endTime: 14.0, text: 'Primera frase' }
      const match = findMatchingTranslationLine(transLines, mainLine, 0)
      expect(match?.text).toBe('First phrase')
    })

    it('empareja por superposición temporal cuando los índices no coinciden', () => {
      const mainLine = { startTime: 16.2, endTime: 19.5, text: 'Segunda frase' }
      const match = findMatchingTranslationLine(transLines, mainLine, -1)
      expect(match?.text).toBe('Second phrase')
    })

    it('retorna null si no hay líneas de traducción o mainLine es nula', () => {
      expect(findMatchingTranslationLine([], lines[0], 0)).toBeNull()
      expect(findMatchingTranslationLine(transLines, null, 0)).toBeNull()
    })
  })
})
