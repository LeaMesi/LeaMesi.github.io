import { KANJI_WORDS, KANJI_CHARS } from './kanjiDict.js'

/**
 * Tabla de conversión fonética Hepburn para Hiragana y Katakana básico
 */
const KANA_MAP = {
  // Hiragana
  'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
  'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
  'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
  'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
  'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
  'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
  'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
  'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
  'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
  'わ': 'wa', 'を': 'o', 'ん': 'n',
  'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
  'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
  'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
  'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
  'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
  // Pequeñas kana individuales (fallback)
  'ぁ': 'a', 'ぃ': 'i', 'ぅ': 'u', 'ぇ': 'e', 'ぉ': 'o',
  'ゃ': 'ya', 'ゅ': 'yu', 'ょ': 'yo', 'ゎ': 'wa',

  // Katakana
  'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
  'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
  'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
  'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
  'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
  'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
  'マ': 'ma', 'ミ': 'mi', 'む': 'mu', 'メ': 'me', 'モ': 'mo',
  'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
  'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
  'ワ': 'wa', 'ヲ': 'o', 'ン': 'n',
  'ガ': 'ga', 'ギ': 'gi', 'グ': 'gu', 'ゲ': 'ge', 'ゴ': 'go',
  'ザ': 'za', 'ジ': 'ji', 'ズ': 'zu', 'ゼ': 'ze', 'ゾ': 'zo',
  'ダ': 'da', 'ヂ': 'ji', 'ヅ': 'zu', 'デ': 'de', 'ド': 'do',
  'バ': 'ba', 'ビ': 'bi', 'ブ': 'bu', 'ベ': 'be', 'ボ': 'bo',
  'パ': 'pa', 'ピ': 'pi', 'プ': 'pu', 'ペ': 'pe', 'ポ': 'po',
  'ァ': 'a', 'ィ': 'i', 'ゥ': 'u', 'ェ': 'e', 'ォ': 'o',
  'ャ': 'ya', 'ュ': 'yu', 'ョ': 'yo', 'ヮ': 'wa',
  'ヴ': 'vu'
}

/**
 * Dígrafos y combinaciones silábicas yōon (Hepburn estándar y préstamos extranjeros)
 */
const COMBO_KANA = {
  // Hiragana Yōon
  'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
  'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
  'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
  'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
  'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
  'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
  'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
  'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
  'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
  'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
  'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',

  // Katakana Yōon y préstamos
  'キャ': 'kya', 'キュ': 'kyu', 'キョ': 'kyo',
  'シャ': 'sha', 'シュ': 'shu', 'ショ': 'sho',
  'チャ': 'cha', 'チュ': 'chu', 'チョ': 'cho',
  'ニャ': 'nya', 'ニュ': 'nyu', 'ニョ': 'nyo',
  'ヒャ': 'hya', 'ヒュ': 'hyu', 'ヒョ': 'hyo',
  'ミャ': 'mya', 'ミュ': 'myu', 'ミョ': 'myo',
  'リャ': 'rya', 'リュ': 'ryu', 'リョ': 'ryo',
  'ギャ': 'gya', 'ギュ': 'gyu', 'ギョ': 'gyo',
  'ジャ': 'ja', 'ジュ': 'ju', 'ジョ': 'jo',
  'ビャ': 'bya', 'ビュ': 'byu', 'ビョ': 'byo',
  'ピャ': 'pya', 'ピュ': 'pyu', 'ピョ': 'pyo',

  'ティ': 'ti', 'ディ': 'di', 'トゥ': 'tu', 'ドゥ': 'du',
  'チェ': 'che', 'シェ': 'she', 'ジェ': 'je',
  'ファ': 'fa', 'フィ': 'fi', 'フェ': 'fe', 'フォ': 'fo', 'フュ': 'fyu',
  'ウィ': 'wi', 'ウェ': 'we', 'ウォ': 'wo',
  'ヴァ': 'va', 'ヴィ': 'vi', 'ヴ': 'vu', 'ヴェ': 've', 'ヴォ': 'vo',
  'ツァ': 'tsa', 'ツィ': 'tsi', 'ツェ': 'tse', 'ツォ': 'tso',
  'クァ': 'kwa', 'グァ': 'gwa', 'イェ': 'ye'
}

/**
 * Puntuación japonesa a occidental
 */
const PUNCTUATION_MAP = {
  '、': ', ',
  '。': '. ',
  '！': '!',
  '？': '?',
  '〜': '~',
  '～': '~',
  '・': ' ',
  '…': '...',
  '「': '"',
  '」': '"',
  '『': '"',
  '』': '"',
  '（': '(',
  '）': ')'
}

// Lista ordenada de palabras kanji por longitud descendente para coincidencia más larga (greedy)
const SORTED_KANJI_WORDS = Object.keys(KANJI_WORDS).sort((a, b) => b.length - a.length)

/**
 * Determina si una cadena contiene caracteres japoneses (Hiragana, Katakana o Kanji)
 */
export function hasJapanese(text) {
  if (!text || typeof text !== 'string') return false
  return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)
}

/**
 * Determina si una cadena está compuesta exclusivamente por Katakana
 */
export function isKatakana(str) {
  if (!str) return false
  return /^[\u30A0-\u30FFー]+$/.test(str.trim())
}

/**
 * Translitera una secuencia de Kana (Hiragana/Katakana) a Romaji Hepburn
 */
export function kanaToRomaji(text) {
  if (!text) return ''

  let result = ''
  let i = 0

  while (i < text.length) {
    // Manejo de puntuación
    const punct = PUNCTUATION_MAP[text[i]]
    if (punct !== undefined) {
      result += punct
      i++
      continue
    }

    // Sokuon (pequeño tsu: っ o ッ) duplica la siguiente consonante
    if (text[i] === 'っ' || text[i] === 'ッ') {
      if (i + 1 < text.length) {
        const nextTwo = text.slice(i + 1, i + 3)
        const nextOne = text[i + 1]
        const nextRomaji = COMBO_KANA[nextTwo] || KANA_MAP[nextOne] || ''
        if (nextRomaji) {
          result += nextRomaji[0] === 'c' ? 't' : nextRomaji[0]
          i++
          continue
        }
      }
    }

    // Dígrafos de 2 caracteres (yōon)
    if (i + 1 < text.length) {
      const two = text.slice(i, i + 2)
      if (COMBO_KANA[two]) {
        result += COMBO_KANA[two]
        i += 2
        continue
      }
    }

    // Kana individual
    const one = text[i]
    if (KANA_MAP[one]) {
      result += KANA_MAP[one]
      i++
      continue
    }

    // Alargador de sonido katakana (ー)
    if (one === 'ー') {
      const lastChar = result[result.length - 1]
      if (lastChar && 'aeiou'.includes(lastChar.toLowerCase())) {
        result += lastChar
      }
      i++
      continue
    }

    // Cualquier otro carácter (alfanumérico, espacio, puntuación occidental) se mantiene
    result += one
    i++
  }

  return result
}

/**
 * Translitera una cadena japonesa completa (Kanji + Kana) a Romaji Hepburn limpio
 */
export function transliterateJapaneseToRomaji(text) {
  if (!text || typeof text !== 'string') return ''
  if (!hasJapanese(text)) return text

  let processed = text

  // 1. Reemplazo de palabras compuestas (greedy: más largas primero)
  for (const word of SORTED_KANJI_WORDS) {
    if (processed.includes(word)) {
      const reading = KANJI_WORDS[word]
      const romaji = kanaToRomaji(reading)
      processed = processed.split(word).join(` ${romaji} `)
    }
  }

  // 2. Reemplazo de kanjis individuales restantes
  for (const [k, r] of Object.entries(KANJI_CHARS)) {
    if (processed.includes(k)) {
      const romaji = kanaToRomaji(r)
      processed = processed.split(k).join(` ${romaji} `)
    }
  }

  // 3. Conversión de Kana restante y puntuación
  let romaji = kanaToRomaji(processed)

  // 4. Normalización de partículas comunes en posición de palabra
  // Partícula 'ha' cuando va como palabra aislada -> 'wa'
  romaji = romaji.replace(/\bha\b/g, 'wa')
  // Partícula 'wo' -> 'o'
  romaji = romaji.replace(/\bwo\b/g, 'o')

  // Limpieza de espacios redundantes
  return romaji.replace(/\s+/g, ' ').trim()
}

/**
 * Determina si debe agregarse un espacio de separación entre dos sílabas contiguas.
 * Evita partir palabras en katakana fragmentadas en múltiples sílabas (ej. メディ + ア).
 */
export function shouldAddTrailingSpace(currentSylText, nextSylText) {
  if (!nextSylText) return false
  if (currentSylText.endsWith(' ') || nextSylText.startsWith(' ')) return false

  const curClean = currentSylText.trim()
  const nextClean = nextSylText.trim()

  // Si ambas partes son exclusivamente Katakana, forman parte de la misma palabra
  if (isKatakana(curClean) && isKatakana(nextClean)) {
    return false
  }

  return true
}

/**
 * Translitera una sílaba individual preservando espaciado y aplicando reglas de partículas
 */
export function transliterateSyllable(sylText, isFollowedByWord = true) {
  if (!sylText || typeof sylText !== 'string') return ''
  const hasLeading = sylText.startsWith(' ')
  const hasTrailing = sylText.endsWith(' ')
  const clean = sylText.trim()

  if (!clean) return sylText
  if (!hasJapanese(clean)) return sylText

  let rom = transliterateJapaneseToRomaji(clean)

  // Partículas si la sílaba aislada es exactamente 'は' o 'を'
  if (clean === 'は') rom = 'wa'
  if (clean === 'を') rom = 'o'

  let out = rom
  if (hasLeading) out = ' ' + out
  if (isFollowedByWord) {
    out = out + ' '
  } else if (hasTrailing && !isKatakana(clean)) {
    out = out + ' '
  }

  return out
}

/**
 * Translitera un arreglo de sílabas preservando los límites correctos de palabras
 */
export function transliterateSyllables(syllables) {
  if (!Array.isArray(syllables) || syllables.length === 0) return []

  return syllables.map((syl, idx) => {
    const nextSyl = syllables[idx + 1]
    const needsSpace = shouldAddTrailingSpace(syl.text || '', nextSyl ? nextSyl.text || '' : '')
    const altText = transliterateSyllable(syl.text || '', needsSpace)

    return {
      ...syl,
      altText
    }
  })
}

/**
 * Auto-genera texto alternativo (Romaji) para un arreglo de líneas de SarangaBaranga.
 * Aplica transliteración tanto al verso completo (`line.altText`) como a cada sílaba (`syl.altText`).
 */
export function autoGenerateRomajiForLines(lines) {
  if (!Array.isArray(lines) || lines.length === 0) return lines

  return lines.map(line => {
    const hasJp = hasJapanese(line.text)
    const syllablesHaveJp = Array.isArray(line.syllables) && line.syllables.some(s => hasJapanese(s.text))

    if (!hasJp && !syllablesHaveJp) {
      return line
    }

    const updatedLine = { ...line }

    // 1. Transliterar sílabas si existen
    if (Array.isArray(line.syllables) && line.syllables.length > 0) {
      const updatedSyllables = line.syllables.map((syl, idx) => {
        const nextSyl = line.syllables[idx + 1]
        const needsSpace = shouldAddTrailingSpace(syl.text || '', nextSyl ? nextSyl.text || '' : '')
        // Si no tiene altText o tiene caracteres japoneses en el altText previo, auto-generar
        if (!syl.altText || hasJapanese(syl.altText)) {
          return {
            ...syl,
            altText: transliterateSyllable(syl.text || '', needsSpace)
          }
        }
        return syl
      })

      updatedLine.syllables = updatedSyllables

      // El altText de la línea se deriva limpiamente de las sílabas concatenadas
      if (!updatedLine.altText || hasJapanese(updatedLine.altText)) {
        updatedLine.altText = updatedSyllables
          .map(s => s.altText || s.text || '')
          .join('')
          .replace(/\s+/g, ' ')
          .trim()
      }
    } else {
      // 2. Transliterar solo la línea si no cuenta con desglose silábico
      if (!updatedLine.altText || hasJapanese(updatedLine.altText)) {
        updatedLine.altText = transliterateJapaneseToRomaji(line.text)
      }
    }

    return updatedLine
  })
}

/**
 * Enriquece un paquete de canción de SarangaBaranga con Romaji automático
 * si detecta idioma japonés en cualquiera de sus pistas lingüísticas.
 */
export function autoEnrichSongWithRomaji(songPackage) {
  if (!songPackage) return songPackage

  const pkg = { ...songPackage }
  const lyricsData = pkg.lyrics_data || pkg.basic

  if (lyricsData && Array.isArray(lyricsData.languages)) {
    lyricsData.languages = lyricsData.languages.map(lang => {
      const sampleText = (lang.plain || '') + ' ' + (lang.lines || []).map(l => l.text).join(' ')
      if (hasJapanese(sampleText)) {
        const updatedLines = autoGenerateRomajiForLines(lang.lines || [])
        const isCurrentlyUndOrEn = lang.code === 'und' || lang.code === 'en'

        return {
          ...lang,
          code: isCurrentlyUndOrEn ? 'ja' : lang.code,
          name: isCurrentlyUndOrEn ? (lang.isMain ? 'Japonés (Original)' : 'Japonés (Traducción)') : lang.name,
          lines: updatedLines
        }
      }
      return lang
    })
  }

  return pkg
}
