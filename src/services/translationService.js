// src/services/translationService.js
// Servicio de traducción automática gratuita (Zero-Backend)
// Utiliza una arquitectura en cascada con Unison API (por lote) y fallback a MyMemory API (neuronal)
// Conserva pausas instrumentales (versos en blanco) y decodifica entidades HTML.

import { hasJapanese } from '../lyrics/transliterationHelper.js'

const UNISON_BASE_URL = 'https://unison.boidu.dev'
const MYMEMORY_BASE_URL = 'https://api.mymemory.translated.net'

/**
 * Decodifica entidades HTML devueltas ocasionalmente por motores de traducción.
 */
export function decodeHtmlEntities(str) {
  if (!str || typeof str !== 'string') return ''
  return str
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

/**
 * Infiere el código de idioma de origen para APIs que no soportan 'auto'
 */
function resolveSourceLangCode(text, sourceLang = 'auto') {
  const clean = (sourceLang || 'auto').toLowerCase().trim()
  if (clean && clean !== 'auto' && clean !== 'und') {
    return clean
  }
  if (hasJapanese(text)) return 'ja'
  if (/[\uac00-\ud7af]/.test(text)) return 'ko'
  if (/[\u0400-\u04ff]/.test(text)) return 'ru'
  if (/[\u4e00-\u9fa5]/.test(text)) return 'zh'
  return 'en'
}

/**
 * Traduce un verso individual usando MyMemory API
 */
async function translateWithMyMemory(text, targetLang, sourceLang) {
  const src = resolveSourceLangCode(text, sourceLang)
  const tgt = (targetLang || 'es').toLowerCase().trim()
  const langpair = `${src}|${tgt}`
  const url = `${MYMEMORY_BASE_URL}/get?q=${encodeURIComponent(text)}&langpair=${langpair}&de=sarangabaranga@app.local`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`MyMemory HTTP error ${res.status}`)
  }

  const data = await res.json()
  const translated = data?.responseData?.translatedText
  if (data?.responseStatus === 200 && translated && !translated.startsWith('\'AUTO\' IS AN INVALID')) {
    return decodeHtmlEntities(translated)
  }
  throw new Error(`MyMemory returned error or empty: ${data?.responseDetails || 'unknown'}`)
}

/**
 * Traduce una frase individual usando Unison y fallback a MyMemory.
 * @param {string} text - Texto a traducir
 * @param {string} targetLang - Código del idioma destino (ej. 'es', 'en', 'fr')
 * @param {string} sourceLang - Código del idioma origen (ej. 'en', 'ja', 'auto')
 * @returns {Promise<string>} - Texto traducido (o el original si no se pudo traducir)
 */
export async function translatePhrase(text, targetLang = 'es', sourceLang = 'auto') {
  if (!text || !text.trim()) return ''

  const cleanText = text.trim()

  // 1. Intento con Unison API
  try {
    const unisonRes = await fetch(`${UNISON_BASE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: [cleanText],
        to: targetLang
      })
    })

    if (unisonRes.ok) {
      const data = await unisonRes.json()
      const candidate = data?.lines?.[0]?.translation
      if (candidate && typeof candidate === 'string' && candidate.trim()) {
        return decodeHtmlEntities(candidate.trim())
      }
    }
  } catch (err) {
    console.warn('Unison fallo al traducir frase individual, pasando a fallback:', err)
  }

  // 2. Fallback a MyMemory API
  try {
    const memoryResult = await translateWithMyMemory(cleanText, targetLang, sourceLang)
    if (memoryResult) {
      return memoryResult
    }
  } catch (err) {
    console.warn('MyMemory fallo al traducir frase individual:', err)
  }

  return cleanText
}

/**
 * Traduce una colección de versos (canción completa o bloque de líneas).
 * Mantiene intactas las pausas instrumentales (líneas vacías) sin enviarlas a las APIs.
 *
 * @param {string[]} linesArray - Arreglo de frases originales
 * @param {string} targetLang - Código de idioma destino
 * @param {string} sourceLang - Código de idioma origen o 'auto'
 * @returns {Promise<{ translatedLines: string[], detectedLang: string }>}
 */
export async function translateLines(linesArray, targetLang = 'es', sourceLang = 'auto') {
  if (!Array.isArray(linesArray) || linesArray.length === 0) {
    return { translatedLines: [], detectedLang: '' }
  }

  // Identificar índices de líneas con contenido para no enviar líneas vacías/pausas
  const nonBlankIndices = []
  const nonBlankTexts = []

  linesArray.forEach((txt, idx) => {
    const trimmed = (txt || '').trim()
    if (trimmed.length > 0) {
      nonBlankIndices.push(idx)
      nonBlankTexts.push(trimmed)
    }
  })

  // Si todas las líneas son pausas o vacías
  if (nonBlankTexts.length === 0) {
    return {
      translatedLines: linesArray.map(() => ''),
      detectedLang: sourceLang !== 'auto' ? sourceLang : ''
    }
  }

  const resultLines = new Array(linesArray.length).fill('')
  let detectedLang = sourceLang !== 'auto' ? sourceLang : ''

  // 1. Intento por lote con Unison API
  try {
    const unisonRes = await fetch(`${UNISON_BASE_URL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lines: nonBlankTexts,
        to: targetLang
      })
    })

    if (unisonRes.ok) {
      const data = await unisonRes.json()
      if (Array.isArray(data?.lines) && data.lines.length === nonBlankTexts.length) {
        let hasValidTranslations = false
        nonBlankIndices.forEach((origIdx, pos) => {
          const trans = data.lines[pos]?.translation
          if (trans && typeof trans === 'string' && trans.trim()) {
            resultLines[origIdx] = decodeHtmlEntities(trans.trim())
            hasValidTranslations = true
          } else {
            resultLines[origIdx] = nonBlankTexts[pos]
          }
        })

        if (hasValidTranslations) {
          return {
            translatedLines: resultLines,
            detectedLang: data.detectedLang || detectedLang
          }
        }
      }
    }
  } catch (err) {
    console.warn('Unison fallo al traducir lote de frases, usando MyMemory:', err)
  }

  // 2. Fallback con MyMemory (procesamiento concurrente controlado)
  try {
    const concurrency = 4
    const translatedNonBlank = new Array(nonBlankTexts.length).fill('')

    for (let i = 0; i < nonBlankTexts.length; i += concurrency) {
      const chunk = nonBlankTexts.slice(i, i + concurrency)
      const chunkPromises = chunk.map(async (text, offset) => {
        const itemIdx = i + offset
        try {
          const res = await translateWithMyMemory(text, targetLang, sourceLang)
          translatedNonBlank[itemIdx] = res || text
        } catch {
          translatedNonBlank[itemIdx] = text
        }
      })
      await Promise.all(chunkPromises)
    }

    nonBlankIndices.forEach((origIdx, pos) => {
      resultLines[origIdx] = translatedNonBlank[pos] || nonBlankTexts[pos]
    })

    return {
      translatedLines: resultLines,
      detectedLang
    }
  } catch (err) {
    console.error('Fallo en traducción con fallback:', err)
    nonBlankIndices.forEach((origIdx, pos) => {
      resultLines[origIdx] = nonBlankTexts[pos]
    })
    return {
      translatedLines: resultLines,
      detectedLang
    }
  }
}
