// Utilidades para división silábica y distribución de tiempos de canto
// Respeta reglas fonéticas de separación en sílabas en español y soporte para división por palabras

const STRONG_VOWELS = new Set(['a', 'e', 'o', 'á', 'é', 'ó', 'A', 'E', 'O', 'Á', 'É', 'Ó'])
const WEAK_VOWELS = new Set(['i', 'u', 'ü', 'I', 'U', 'Ü'])
const ACCENTED_WEAK_VOWELS = new Set(['í', 'ú', 'Í', 'Ú'])
const ALL_VOWELS = new Set([
  'a', 'e', 'i', 'o', 'u', 'á', 'é', 'í', 'ó', 'ú', 'ü',
  'A', 'E', 'I', 'O', 'U', 'Á', 'É', 'Í', 'Ó', 'Ú', 'Ü'
])

const INSEPARABLE_PAIRS = new Set([
  'bl', 'cl', 'fl', 'gl', 'pl',
  'br', 'cr', 'dr', 'fr', 'gr', 'pr', 'tr',
  'ch', 'll', 'rr'
])

function isVowel(char) {
  return ALL_VOWELS.has(char)
}

function isAccentedWeak(char) {
  return ACCENTED_WEAK_VOWELS.has(char)
}

function isWeak(char) {
  return WEAK_VOWELS.has(char)
}

function isStrong(char) {
  return STRONG_VOWELS.has(char) || isAccentedWeak(char)
}

/**
 * Determina si dos vocales adyacentes forman diptongo/triptongo o hiato.
 */
function areVowelsInSameSyllable(v1, v2) {
  // Si una vocal débil tiene acento diacrítico ortográfico, rompe el diptongo (hiato)
  if (isAccentedWeak(v1) || isAccentedWeak(v2)) return false
  // Dos vocales fuertes nunca forman diptongo en español estándar (hiato)
  if (isStrong(v1) && isStrong(v2)) return false
  // Fuerte + débil, débil + fuerte, o débil + débil -> Diptongo
  return true
}

/**
 * Divide una palabra individual en sílabas fonéticas en español.
 * @param {string} word - Palabra a silabear.
 * @returns {string[]} Array de sílabas.
 */
export function syllabifyWord(word) {
  if (!word || word.length <= 1) return [word || '']

  // Si la palabra ya contiene guiones explícitos del usuario (ej: "Ca-mi-nar"), respetarlos
  if (word.includes('-')) {
    const parts = word.split('-').filter(Boolean)
    return parts.length > 0 ? parts : [word]
  }

  // Si no tiene vocales, es una abreviatura o sigla; devolverla entera
  let hasAnyVowel = false
  for (let i = 0; i < word.length; i++) {
    if (isVowel(word[i])) {
      hasAnyVowel = true
      break
    }
  }
  if (!hasAnyVowel) return [word]

  const syllables = []
  let currentSyl = ''
  const len = word.length
  let i = 0

  while (i < len) {
    const char = word[i]
    currentSyl += char

    if (isVowel(char)) {
      // Mirar hacia adelante
      let nextVowelIndex = -1
      for (let j = i + 1; j < len; j++) {
        if (isVowel(word[j])) {
          nextVowelIndex = j
          break
        }
      }

      // Si no quedan más vocales adelante, el resto de la palabra pertenece a esta sílaba
      if (nextVowelIndex === -1) {
        currentSyl += word.slice(i + 1)
        syllables.push(currentSyl)
        currentSyl = ''
        break
      }

      const consonantsBetween = word.slice(i + 1, nextVowelIndex)
      const numConsonants = consonantsBetween.length

      if (numConsonants === 0) {
        // Dos vocales juntas
        const nextV = word[nextVowelIndex]
        if (!areVowelsInSameSyllable(char, nextV)) {
          // Hiato: se corta aquí
          syllables.push(currentSyl)
          currentSyl = ''
        }
        // Si forman diptongo, no se corta; continúa en la misma sílaba
      } else if (numConsonants === 1) {
        // Una consonante entre vocales va a la siguiente sílaba: V - CV
        syllables.push(currentSyl)
        currentSyl = ''
      } else if (numConsonants === 2) {
        const pair = consonantsBetween.toLowerCase()
        if (INSEPARABLE_PAIRS.has(pair)) {
          // Grupo consonántico inseparable va a la siguiente sílaba: V - CCV
          syllables.push(currentSyl)
          currentSyl = ''
        } else {
          // Se divide entre las consonantes: VC - CV
          currentSyl += consonantsBetween[0]
          syllables.push(currentSyl)
          currentSyl = ''
          i++ // Avanzar la consonante absorbida
        }
      } else if (numConsonants === 3) {
        const lastPair = consonantsBetween.slice(1).toLowerCase()
        if (INSEPARABLE_PAIRS.has(lastPair)) {
          // La primera consonante con la anterior, las dos siguientes inseparables con la siguiente: VC - CCV
          currentSyl += consonantsBetween[0]
          syllables.push(currentSyl)
          currentSyl = ''
          i++
        } else {
          // Las dos primeras con la anterior, la tercera con la siguiente: VCC - CV
          currentSyl += consonantsBetween.slice(0, 2)
          syllables.push(currentSyl)
          currentSyl = ''
          i += 2
        }
      } else {
        // 4 o más consonantes: dos con la anterior, resto con la siguiente: VCC - CCV
        currentSyl += consonantsBetween.slice(0, 2)
        syllables.push(currentSyl)
        currentSyl = ''
        i += 2
      }
    }

    i++
  }

  if (currentSyl) {
    if (syllables.length > 0) {
      syllables[syllables.length - 1] += currentSyl
    } else {
      syllables.push(currentSyl)
    }
  }

  return syllables.filter(Boolean)
}

/**
 * Divide una frase de texto en sílabas preservando los espacios entre palabras en la última sílaba de cada palabra.
 * @param {string} phraseText - Texto de la frase.
 * @returns {string[]} Array de strings de sílabas con espacios preservados.
 */
export function splitPhraseIntoSyllables(phraseText) {
  if (!phraseText || !phraseText.trim()) return []

  // Dividir por palabras preservando espacios
  const tokens = phraseText.match(/\S+\s*/g) || [phraseText]
  const result = []

  tokens.forEach(token => {
    // Separar palabra de sus espacios finales
    const match = token.match(/^(\S+)(\s*)$/)
    if (!match) {
      result.push(token)
      return
    }

    const word = match[1]
    const trailingSpaces = match[2]

    const wordSyllables = syllabifyWord(word)

    if (wordSyllables.length === 0) {
      result.push(token)
    } else {
      // Adjuntar los espacios finales a la última sílaba de la palabra
      wordSyllables.forEach((syl, idx) => {
        if (idx === wordSyllables.length - 1) {
          result.push(syl + trailingSpaces)
        } else {
          result.push(syl)
        }
      })
    }
  })

  return result
}

/**
 * Divide una frase de texto simplemente por palabras, preservando los espacios.
 * @param {string} phraseText - Texto de la frase.
 * @returns {string[]} Array de palabras.
 */
export function splitPhraseIntoWords(phraseText) {
  if (!phraseText || !phraseText.trim()) return []
  const tokens = phraseText.match(/\S+\s*/g)
  return tokens || [phraseText]
}

/**
 * Calcula el peso fonético relativo de una sílaba o palabra para sincronización de canto.
 * Considera:
 * - Vocales, diptongos y triptongos (las vocales sostienen la melodía y el tono).
 * - Acento ortográfico / prosódico (la sílaba tónica coincide con compases fuertes y mayor duración).
 * - Apertura vocálica (vocales abiertas vs cerradas).
 * - Complejidad de codas y grupos consonánticos.
 * - Signos de puntuación interna (pausas o cesuras melódicas).
 * - Alargamiento de final de frase (phrase-final lengthening en el cierre de verso).
 *
 * @param {string|{ text: string }} syl - Sílaba o palabra a ponderar.
 * @param {number} [index=0] - Posición de la sílaba dentro del verso (0-indexed).
 * @param {number} [totalSyllables=1] - Total de sílabas en el verso.
 * @returns {number} Peso fonético normalizado (>= 0.6).
 */
export function calculateSyllableWeight(syl, index = 0, totalSyllables = 1) {
  const rawText = typeof syl === 'string' ? syl : (syl?.text || '')
  if (!rawText) return 1.0

  const trimmed = rawText.trim()
  if (!trimmed) return 1.0

  let weight = 1.0

  // 1. Detección y conteo de vocales, acentos y fonemas sostenidos
  let vowelCount = 0
  let hasAccent = false
  let hasOpenVowel = false

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i]
    if (isVowel(char) || char === 'y' || char === 'Y') {
      vowelCount++
      if (
        ACCENTED_WEAK_VOWELS.has(char) ||
        char === 'á' || char === 'é' || char === 'ó' ||
        char === 'Á' || char === 'É' || char === 'Ó' ||
        char === 'ā' || char === 'ē' || char === 'ī' || char === 'ō' || char === 'ū'
      ) {
        hasAccent = true
      }
      if (STRONG_VOWELS.has(char)) {
        hasOpenVowel = true
      }
    }
  }

  // 2. Aportación de vocales (sostén melódico en el canto)
  if (vowelCount >= 2) {
    // Diptongos (+0.4) y triptongos (+0.8): requieren mayor tiempo de fonación
    weight += (vowelCount - 1) * 0.4
  } else if (vowelCount === 0) {
    // Interjección o sigla sin vocales
    weight = 0.8
  }

  // 3. Sílaba tónica acentuada (énfasis rítmico y musical)
  if (hasAccent) {
    weight += 0.35
  } else if (hasOpenVowel && vowelCount === 1) {
    // Vocal abierta simple (a, e, o) resuena con más volumen que una débil átona
    weight += 0.1
  }

  // 4. Complejidad consonántica (articulación)
  const consonantCount = Math.max(0, trimmed.length - vowelCount)
  if (consonantCount >= 3) {
    weight += 0.25
  } else if (consonantCount === 2) {
    weight += 0.1
  } else if (consonantCount === 0 && trimmed.length <= 1 && !hasAccent) {
    // Monosílabo átono de una sola letra (ej. "a", "y") como nexo rápido
    weight = Math.max(0.75, weight - 0.15)
  }

  // 5. Signos de puntuación interna (pausa o cesura musical)
  if (/[,;:!?¡¿—\-…]$/.test(trimmed)) {
    weight += 0.3
  }

  // 6. Alargamiento de final de frase (Phrase-final lengthening)
  // En canto, la última sílaba de un verso casi siempre prolonga su nota
  if (totalSyllables > 1 && index === totalSyllables - 1) {
    weight += 0.5
  }

  return +Math.max(0.6, Math.min(3.5, weight)).toFixed(3)
}

/**
 * Distribuye automáticamente las marcas de tiempo entre una lista de sílabas dentro de un rango [startTime, endTime].
 * Por defecto aplica un algoritmo de ponderación fonética inteligente, ajustando la duración de cada sílaba según:
 * vocales, diptongos, acentos, consonantes, pausas y alargamiento de final de verso.
 * También soporta distribución equitativa mediante options: { mode: 'equal' } o { equal: true }.
 *
 * @param {Array<{ id?: string, text: string, startTime?: number, duration?: number }|string>} syllables
 * @param {number} lineStartTime
 * @param {number} lineEndTime
 * @param {{ mode?: 'phonetic' | 'equal', equal?: boolean }} [options={}]
 * @returns {Array<{ id: string, text: string, startTime: number, duration: number }>}
 */
export function autoDistributeSyllables(syllables, lineStartTime, lineEndTime, options = {}) {
  if (!Array.isArray(syllables) || syllables.length === 0) return []

  const start = Number(lineStartTime) || 0
  const end = Math.max(start + 0.5, Number(lineEndTime) || (start + 3))
  const totalDuration = end - start

  if (totalDuration <= 0) return []

  const isPhonetic = options?.mode !== 'equal' && !options?.equal

  if (!isPhonetic) {
    const step = totalDuration / syllables.length
    return syllables.map((syl, index) => {
      const sStart = +(start + index * step).toFixed(2)
      const sDur = +(step * 0.95).toFixed(2) // Pequeño margen entre sílabas

      return {
        id: syl.id || `syl-${Date.now()}-${index}`,
        text: typeof syl === 'string' ? syl : (syl.text || ''),
        startTime: sStart,
        duration: Math.max(0.08, sDur)
      }
    })
  }

  // Cálculo de pesos fonéticos
  const weights = syllables.map((syl, idx) => {
    const text = typeof syl === 'string' ? syl : (syl.text || '')
    return calculateSyllableWeight(text, idx, syllables.length)
  })

  const totalWeight = weights.reduce((sum, w) => sum + w, 0) || 1

  let currentStart = start

  return syllables.map((syl, index) => {
    const text = typeof syl === 'string' ? syl : (syl.text || '')
    const weight = weights[index]
    const slotDuration = totalDuration * (weight / totalWeight)
    const sStart = +currentStart.toFixed(2)
    // Dejar un margen sutil del 95% para transición limpia de resaltado
    const sDur = Math.max(0.08, +(slotDuration * 0.95).toFixed(2))

    currentStart += slotDuration

    return {
      id: syl.id || `syl-${Date.now()}-${index}`,
      text,
      startTime: sStart,
      duration: sDur
    }
  })
}
