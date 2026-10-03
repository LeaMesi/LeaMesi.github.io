import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  decodeHtmlEntities,
  translatePhrase,
  translateLines
} from '../../src/services/translationService.js'

describe('services/translationService.js', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('decodeHtmlEntities', () => {
    it('decodifica comillas simples, dobles y entidades comunes', () => {
      expect(decodeHtmlEntities('It&#39;s a &quot;great&quot; success &amp; joy')).toBe(
        'It\'s a "great" success & joy'
      )
      expect(decodeHtmlEntities('&lt;tag&gt;')).toBe('<tag>')
      expect(decodeHtmlEntities('&#65;&#66;&#67;')).toBe('ABC')
    })

    it('devuelve cadena vacía si se pasa un valor vacío o nulo', () => {
      expect(decodeHtmlEntities('')).toBe('')
      expect(decodeHtmlEntities(null)).toBe('')
    })
  })

  describe('translatePhrase', () => {
    it('devuelve cadena vacía si el texto está en blanco o solo espacios', async () => {
      const res = await translatePhrase('   ', 'es', 'en')
      expect(res).toBe('')
    })

    it('traduce exitosamente usando Unison cuando responde ok', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lines: [{ translation: 'Hola mundo' }],
          detectedLang: 'en'
        })
      })

      const res = await translatePhrase('Hello world', 'es', 'en')
      expect(res).toBe('Hola mundo')
      expect(global.fetch).toHaveBeenCalledWith(
        'https://unison.boidu.dev/translate',
        expect.objectContaining({
          method: 'POST'
        })
      )
    })

    it('recurre a MyMemory si Unison responde con error HTTP 502', async () => {
      // 1. Fallo Unison
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: false,
          status: 502
        })
        // 2. Éxito MyMemory
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            responseStatus: 200,
            responseData: {
              translatedText: 'Nadie lo cree.'
            }
          })
        })

      const res = await translatePhrase('誰も信じない', 'es', 'ja')
      expect(res).toBe('Nadie lo cree.')
      expect(global.fetch).toHaveBeenCalledTimes(2)
      expect(global.fetch.mock.calls[1][0]).toContain('api.mymemory.translated.net')
      expect(global.fetch.mock.calls[1][0]).toContain('langpair=ja|es')
    })

    it('devuelve el texto original si ambos motores fallan', async () => {
      global.fetch = vi.fn()
        .mockRejectedValueOnce(new Error('Network error Unison'))
        .mockRejectedValueOnce(new Error('Network error MyMemory'))

      const res = await translatePhrase('Test line', 'es', 'en')
      expect(res).toBe('Test line')
    })
  })

  describe('translateLines', () => {
    it('maneja listas vacías', async () => {
      const res = await translateLines([], 'es', 'en')
      expect(res.translatedLines).toEqual([])
    })

    it('conserva versos en blanco / pausas instrumentales sin enviarlos a la API', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          lines: [
            { translation: 'Primera línea' },
            { translation: 'Tercera línea' }
          ],
          detectedLang: 'en'
        })
      })

      const inputLines = ['First line', '', 'Third line', '   ']
      const res = await translateLines(inputLines, 'es', 'en')

      // Solo se deben enviar las 2 líneas que no están vacías
      const requestBody = JSON.parse(global.fetch.mock.calls[0][1].body)
      expect(requestBody.lines).toEqual(['First line', 'Third line'])

      // El resultado debe preservar las posiciones originales de las pausas
      expect(res.translatedLines).toEqual([
        'Primera línea',
        '',
        'Tercera línea',
        ''
      ])
      expect(res.detectedLang).toBe('en')
    })

    it('si todas las líneas están vacías, no hace llamadas HTTP', async () => {
      global.fetch = vi.fn()
      const res = await translateLines(['', '  ', ''], 'es', 'en')
      expect(global.fetch).not.toHaveBeenCalled()
      expect(res.translatedLines).toEqual(['', '', ''])
    })

    it('utiliza MyMemory concurrentemente como fallback si Unison falla', async () => {
      global.fetch = vi.fn()
        // Unison falla
        .mockResolvedValueOnce({ ok: false, status: 500 })
        // MyMemory para línea 1
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            responseStatus: 200,
            responseData: { translatedText: 'Línea uno' }
          })
        })
        // MyMemory para línea 2
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            responseStatus: 200,
            responseData: { translatedText: 'Línea dos' }
          })
        })

      const res = await translateLines(['Line one', 'Line two'], 'es', 'en')
      expect(res.translatedLines).toEqual(['Línea uno', 'Línea dos'])
    })
  })
})
