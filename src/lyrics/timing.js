// Utilidades para cálculo de métrica musical, BPM y formateo de tiempos

export function beatToSeconds(beat, bpm = 120) {
  if (bpm <= 0) return 0
  const secondsPerBeat = 60 / bpm
  return beat * secondsPerBeat
}

export function secondsToBeat(seconds, bpm = 120) {
  if (bpm <= 0) return 0
  const secondsPerBeat = 60 / bpm
  return seconds / secondsPerBeat
}

export function formatTime(seconds, includeMilliseconds = false) {
  if (isNaN(seconds) || seconds < 0) seconds = 0
  const totalMs = Math.round(seconds * 1000)
  const mins = Math.floor(totalMs / 60000)
  const secs = Math.floor((totalMs % 60000) / 1000)
  const pad = (num, len = 2) => num.toString().padStart(len, '0')

  if (includeMilliseconds) {
    const ms = totalMs % 1000
    return `${pad(mins)}:${pad(secs)}.${pad(ms, 3)}`
  }
  return `${pad(mins)}:${pad(secs)}`
}
