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
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 10)

  const pad = (num) => num.toString().padStart(2, '0')

  if (includeMilliseconds) {
    return `${pad(mins)}:${pad(secs)}.${ms}`
  }
  return `${pad(mins)}:${pad(secs)}`
}
