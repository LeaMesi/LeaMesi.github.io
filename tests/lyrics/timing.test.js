import { describe, it, expect } from 'vitest'
import { beatToSeconds, secondsToBeat, formatTime } from '../../src/lyrics/timing.js'

describe('lyrics/timing.js', () => {
  describe('beatToSeconds', () => {
    it('calcula segundos por beat a 120 BPM', () => {
      // 120 BPM = 2 beats por segundo => 1 beat = 0.5 segundos
      expect(beatToSeconds(1, 120)).toBe(0.5)
      expect(beatToSeconds(4, 120)).toBe(2.0)
    })

    it('calcula segundos por beat a 60 BPM', () => {
      expect(beatToSeconds(1, 60)).toBe(1.0)
      expect(beatToSeconds(3.5, 60)).toBe(3.5)
    })

    it('retorna 0 si bpm es menor o igual a cero', () => {
      expect(beatToSeconds(4, 0)).toBe(0)
      expect(beatToSeconds(4, -10)).toBe(0)
    })
  })

  describe('secondsToBeat', () => {
    it('calcula beats a partir de segundos a 120 BPM', () => {
      expect(secondsToBeat(1, 120)).toBe(2)
      expect(secondsToBeat(0.5, 120)).toBe(1)
    })

    it('calcula beats a 60 BPM', () => {
      expect(secondsToBeat(3, 60)).toBe(3)
    })

    it('retorna 0 si bpm es menor o igual a cero', () => {
      expect(secondsToBeat(5, 0)).toBe(0)
      expect(secondsToBeat(5, -60)).toBe(0)
    })
  })

  describe('formatTime', () => {
    it('formatea minutos y segundos mm:ss correctamente', () => {
      expect(formatTime(0)).toBe('00:00')
      expect(formatTime(65)).toBe('01:05')
      expect(formatTime(754)).toBe('12:34')
    })

    it('formatea con milisegundos de alta precisión mm:ss.mmm', () => {
      expect(formatTime(0, true)).toBe('00:00.000')
      expect(formatTime(12.345, true)).toBe('00:12.345')
      expect(formatTime(65.078, true)).toBe('01:05.078')
    })

    it('maneja valores inválidos o negativos como 00:00', () => {
      expect(formatTime(-10)).toBe('00:00')
      expect(formatTime(NaN)).toBe('00:00')
      expect(formatTime(undefined)).toBe('00:00')
    })
  })
})
