// Motor de sincronización en tiempo real para versos, sílabas y subtitulado bilingüe

export function findActiveLineIndex(lines, currentTime) {
  if (!Array.isArray(lines) || lines.length === 0) return -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (currentTime >= line.startTime && currentTime <= line.endTime) {
      return i
    }
    // Si estamos en un silencio breve entre esta línea y la siguiente
    const nextLine = lines[i + 1]
    if (nextLine && currentTime > line.endTime && currentTime < nextLine.startTime) {
      // Si faltan menos de 1.5 segundos para la siguiente, anticipamos la siguiente
      if (nextLine.startTime - currentTime < 1.5) {
        return i + 1
      }
      return i // o mantenemos la actual
    }
  }

  // Si está antes de la primera línea
  if (currentTime < lines[0].startTime) {
    return 0
  }

  return lines.length - 1
}

export function evaluateSyllablesState(syllables, currentTime) {
  if (!Array.isArray(syllables) || syllables.length === 0) return []

  return syllables.map(syl => {
    const start = syl.startTime
    const end = syl.startTime + syl.duration

    if (currentTime >= end) {
      return {
        ...syl,
        state: 'completed',
        progress: 1.0
      }
    } else if (currentTime >= start && currentTime < end) {
      const progress = Math.max(0, Math.min(1, (currentTime - start) / syl.duration))
      return {
        ...syl,
        state: 'active',
        progress
      }
    } else {
      return {
        ...syl,
        state: 'upcoming',
        progress: 0.0
      }
    }
  })
}

export function findMatchingTranslationLine(translationLines, mainLine) {
  if (!Array.isArray(translationLines) || !mainLine) return null

  // Emparejar por superposición temporal
  const targetMid = (mainLine.startTime + mainLine.endTime) / 2
  let bestMatch = null
  let minDiff = Infinity

  for (const transLine of translationLines) {
    // Si se superponen
    if (transLine.startTime <= mainLine.endTime && transLine.endTime >= mainLine.startTime) {
      return transLine
    }
    const transMid = (transLine.startTime + transLine.endTime) / 2
    const diff = Math.abs(targetMid - transMid)
    if (diff < minDiff) {
      minDiff = diff
      bestMatch = transLine
    }
  }

  return minDiff < 4.0 ? bestMatch : null
}
