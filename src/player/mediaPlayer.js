// Reproductor multimedia unificado y Master Clock Bridge (YouTube IFrame API + HTML5 Audio)
import { normalizeVideos } from '../services/schemaValidator.js'

export const TRACK_TYPE = {
  OFFICIAL: 'official',
  INSTRUMENTAL: 'instrumental'
}

export const PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5
}

export function extractYouTubeVideoId(url) {
  if (!url) return null
  const str = String(url).trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str
  }
  try {
    const urlObj = new URL(str.startsWith('http') ? str : `https://${str}`)
    const host = urlObj.hostname.toLowerCase()
    if (host.includes('youtube.com')) {
      if (urlObj.searchParams.has('v')) {
        const v = urlObj.searchParams.get('v')
        if (/^[a-zA-Z0-9_-]{11}$/.test(v)) return v
      }
      const parts = urlObj.pathname.split('/').filter(Boolean)
      if (['embed', 'v', 'shorts', 'live'].includes(parts[0]) && parts[1]) {
        const candidate = parts[1]
        if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate
      }
    } else if (host === 'youtu.be') {
      const candidate = urlObj.pathname.replace(/^\//, '').split(/[?#]/)[0]
      if (/^[a-zA-Z0-9_-]{11}$/.test(candidate)) return candidate
    }
  } catch (_) {
    // Si falla la construcción con URL, recurrir a regex robusto
  }
  const match = str.match(/(?:(?:music\.|www\.|m\.)?youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

let ytApiPromise = null
function loadYouTubeApi() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT)
  }
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      let isDone = false
      const safeResolve = (val) => {
        if (!isDone) {
          isDone = true
          resolve(val)
        }
      }

      // Timeout de seguridad: si después de 4 segundos no hay API (red lenta, offline, adblock), no colgar
      const timer = setTimeout(() => {
        console.warn('YouTube IFrame API: tiempo de espera alcanzado, continuando con fallback.')
        safeResolve(window.YT || null)
      }, 4000)

      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]')
      if (!existing) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        tag.async = true
        tag.onerror = () => {
          clearTimeout(timer)
          console.warn('No se pudo cargar la API de YouTube (offline o bloqueada por adblock).')
          safeResolve(null)
        }
        document.head.appendChild(tag)
      }

      const prevOnReady = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        clearTimeout(timer)
        if (typeof prevOnReady === 'function') {
          try { prevOnReady() } catch (_) {}
        }
        safeResolve(window.YT || null)
      }
    })
  }
  return ytApiPromise
}

export function createMediaPlayer({ containerId, onTimeUpdate, onStateChange, onDurationChange }) {
  let ytPlayer = null
  let isPlayerReady = false
  let pendingVideoLoad = null
  let isInitializingYt = false
  let audioElement = null
  let activeSource = 'none' // 'youtube' | 'audio'
  let currentTrackType = TRACK_TYPE.OFFICIAL
  let currentSong = null
  let currentVideos = []
  let activeVideo = null
  let activeVideoId = null
  let activeOffset = 0
  let audioUrl = null
  let isPlaying = false
  let rafId = null
  let lastKnownDuration = 0
  let fallbackTime = 0
  let fallbackTimer = null
  let currentVolume = (() => {
    const saved = localStorage.getItem('saranga_player_volume')
    if (saved !== null) {
      const n = Number(saved)
      if (!isNaN(n) && n >= 0 && n <= 100) return n
    }
    return 80
  })()

  // Inicializar elemento de audio HTML5
  audioElement = document.createElement('audio')
  audioElement.preload = 'metadata'
  audioElement.volume = currentVolume / 100
  document.body.appendChild(audioElement)

  audioElement.addEventListener('durationchange', () => {
    if (activeSource === 'audio' && audioElement.duration) {
      lastKnownDuration = audioElement.duration
      if (onDurationChange) onDurationChange(getDuration())
    }
  })

  audioElement.addEventListener('ended', () => {
    if (activeSource === 'audio') {
      stopClock()
      isPlaying = false
      if (onStateChange) onStateChange(PLAYER_STATE.ENDED)
    }
  })

  function startClock() {
    stopClock()
    const loop = () => {
      if (!isPlaying) return
      const currentTime = getCurrentTime()
      if (onTimeUpdate) onTimeUpdate(currentTime)
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
  }

  function stopClock() {
    if (rafId) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (fallbackTimer) {
      clearInterval(fallbackTimer)
      fallbackTimer = null
    }
  }

  async function initYouTubePlayer(domElementId, initialVideoId) {
    if (ytPlayer) return ytPlayer
    if (isInitializingYt) {
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (!isInitializingYt) {
            clearInterval(check)
            resolve(ytPlayer)
          }
        }, 100)
      })
    }

    isInitializingYt = true
    try {
      const YT = await loadYouTubeApi()
      if (!YT || !YT.Player) {
        console.warn('YouTube IFrame API no disponible. Se utilizará modo de audio virtual/local.')
        return null
      }

      return await new Promise((resolve) => {
        let hasResolved = false
        const safeResolve = (val) => {
          if (!hasResolved) {
            hasResolved = true
            isInitializingYt = false
            resolve(val)
          }
        }

        // Timeout de seguridad: si onReady no dispara en 3.5 segundos, resolver para no trabar la interfaz
        const timer = setTimeout(() => {
          console.warn('YouTube Player onReady demoró más de 3.5s. Continuando de forma no bloqueante.')
          safeResolve(ytPlayer)
        }, 3500)

        try {
          ytPlayer = new YT.Player(domElementId, {
            videoId: initialVideoId || '',
            playerVars: {
              autoplay: 0,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
              enablejsapi: 1
            },
            events: {
              onReady: () => {
                clearTimeout(timer)
                isPlayerReady = true
                if (ytPlayer && ytPlayer.setVolume) {
                  try { ytPlayer.setVolume(currentVolume) } catch (_) {}
                }
                if (ytPlayer && ytPlayer.getDuration) {
                  try {
                    const dur = ytPlayer.getDuration()
                    if (dur > 0) {
                      lastKnownDuration = dur
                      if (onDurationChange) onDurationChange(getDuration())
                    }
                  } catch (_) {}
                }
                if (pendingVideoLoad && ytPlayer && ytPlayer.cueVideoById) {
                  const { videoId, offset } = pendingVideoLoad
                  pendingVideoLoad = null
                  try {
                    ytPlayer.cueVideoById({
                      videoId,
                      startSeconds: Math.max(0, offset)
                    })
                    ytPlayer.seekTo(Math.max(0, offset), true)
                  } catch (err) {
                    console.warn('Error cueing pending video onReady:', err)
                  }
                }
                safeResolve(ytPlayer)
              },
              onError: (event) => {
                clearTimeout(timer)
                console.warn('YouTube Player error code:', event?.data)
                safeResolve(ytPlayer)
              },
              onStateChange: (event) => {
                const state = event.data
                if (state === PLAYER_STATE.PLAYING) {
                  isPlaying = true
                  startClock()
                  if (ytPlayer && ytPlayer.getDuration) {
                    try {
                      const dur = ytPlayer.getDuration()
                      if (dur > 0 && dur !== lastKnownDuration) {
                        lastKnownDuration = dur
                        if (onDurationChange) onDurationChange(getDuration())
                      }
                    } catch (_) {}
                  }
                } else if (state === PLAYER_STATE.BUFFERING) {
                  // Si el usuario activó la reproducción, no detener el reloj ni marcar en falso
                  if (isPlaying) {
                    startClock()
                  }
                } else if (state === PLAYER_STATE.PAUSED || state === PLAYER_STATE.ENDED) {
                  isPlaying = false
                  stopClock()
                  if (onTimeUpdate) onTimeUpdate(getCurrentTime())
                }
                if (onStateChange) onStateChange(state)
              }
            }
          })
        } catch (playerErr) {
          clearTimeout(timer)
          console.warn('Error al instanciar YT.Player:', playerErr)
          safeResolve(null)
        }
      })
    } catch (err) {
      console.warn('Error general inicializando reproductor YouTube:', err)
      return null
    } finally {
      isInitializingYt = false
    }
  }

  async function loadSong(song, preferredVideoId = null) {
    stopClock()
    isPlaying = false
    fallbackTime = 0
    currentSong = song

    if (audioElement) {
      audioElement.pause()
      audioElement.removeAttribute('src')
      audioElement.load()
    }
    if (ytPlayer && isPlayerReady && ytPlayer.pauseVideo) {
      try {
        ytPlayer.pauseVideo()
      } catch (_) {}
    }

    const metadata = song.metadata || song
    const lyricsData = song.lyrics_data || song.basic || {}

    currentVideos = normalizeVideos(metadata, lyricsData)

    if (preferredVideoId) {
      activeVideo = currentVideos.find(v => String(v.id) === String(preferredVideoId)) || currentVideos[0] || null
    } else {
      activeVideo = currentVideos[0] || null
    }

    activeVideoId = activeVideo ? activeVideo.id : null
    activeOffset = activeVideo ? (Number(activeVideo.offset) || 0) : 0

    const primaryVideoId = activeVideo ? extractYouTubeVideoId(activeVideo.url) : null
    audioUrl = metadata.audioPath || song.audio_path || null

    if (primaryVideoId) {
      activeSource = 'youtube'
      try {
        if (!ytPlayer) {
          pendingVideoLoad = { videoId: primaryVideoId, offset: activeOffset }
          await initYouTubePlayer(containerId, primaryVideoId)
        } else if (isPlayerReady && ytPlayer.cueVideoById) {
          pendingVideoLoad = null
          ytPlayer.cueVideoById({
            videoId: primaryVideoId,
            startSeconds: Math.max(0, activeOffset)
          })
          ytPlayer.seekTo(Math.max(0, activeOffset), true)
        } else {
          pendingVideoLoad = { videoId: primaryVideoId, offset: activeOffset }
        }
      } catch (ytErr) {
        console.warn('Error al cargar video en YouTube player:', ytErr)
      }
    } else if (audioUrl) {
      activeSource = 'audio'
      try {
        audioElement.src = audioUrl
        audioElement.load()
      } catch (audioErr) {
        console.warn('Error al cargar audio:', audioErr)
      }
    } else {
      // Modo emulado sin audio / local
      activeSource = 'virtual'
      lastKnownDuration = 180
      if (onDurationChange) onDurationChange(lastKnownDuration)
    }

    if (onStateChange) onStateChange(PLAYER_STATE.CUED)
  }

  function setVideo(videoId) {
    const target = currentVideos.find(v => String(v.id) === String(videoId))
    if (!target) return
    if (activeVideo && String(activeVideo.id) === String(target.id)) return

    const curLyricsTime = getCurrentTime()
    activeVideo = target
    activeVideoId = target.id
    activeOffset = Number(target.offset) || 0

    const targetVideoTime = Math.max(0, curLyricsTime + activeOffset)
    const ytVideoId = extractYouTubeVideoId(target.url)

    if (ytVideoId && ytPlayer) {
      activeSource = 'youtube'
      if (isPlayerReady) {
        if (isPlaying && ytPlayer.loadVideoById) {
          ytPlayer.loadVideoById({
            videoId: ytVideoId,
            startSeconds: targetVideoTime
          })
        } else if (ytPlayer.cueVideoById) {
          ytPlayer.cueVideoById({
            videoId: ytVideoId,
            startSeconds: targetVideoTime
          })
          ytPlayer.seekTo(targetVideoTime, true)
        }
      } else {
        pendingVideoLoad = { videoId: ytVideoId, offset: targetVideoTime }
      }
    }
  }

  function startVirtualPlayback() {
    startClock()
    if (fallbackTimer) clearInterval(fallbackTimer)
    let lastTime = performance.now()
    fallbackTimer = setInterval(() => {
      const now = performance.now()
      fallbackTime += (now - lastTime) / 1000
      lastTime = now
      if (fallbackTime >= lastKnownDuration) {
        pause()
        seek(0)
        if (onStateChange) onStateChange(PLAYER_STATE.ENDED)
      }
    }, 50)
    if (onStateChange) onStateChange(PLAYER_STATE.PLAYING)
  }

  async function play() {
    isPlaying = true
    if (activeSource === 'youtube') {
      if (!isPlayerReady && ytPlayer) {
        // Esperar brevemente (hasta 3s) si el reproductor está terminando de inicializar
        await new Promise((resolve) => {
          let count = 0
          const check = setInterval(() => {
            count++
            if (isPlayerReady || count > 30) {
              clearInterval(check)
              resolve()
            }
          }, 100)
        })
      }

      if (ytPlayer && isPlayerReady && ytPlayer.playVideo) {
        startClock()
        try {
          ytPlayer.playVideo()
        } catch (err) {
          console.warn('Error al invocar playVideo en YouTube:', err)
          startVirtualPlayback()
        }
      } else {
        startVirtualPlayback()
      }
    } else if (activeSource === 'audio' && audioElement) {
      audioElement.play().catch(err => {
        console.warn('Audio play prevented:', err)
        startVirtualPlayback()
      })
      startClock()
      if (onStateChange) onStateChange(PLAYER_STATE.PLAYING)
    } else {
      startVirtualPlayback()
    }
  }

  function pause() {
    isPlaying = false
    stopClock()
    if (activeSource === 'youtube' && ytPlayer && isPlayerReady && ytPlayer.pauseVideo) {
      try { ytPlayer.pauseVideo() } catch (_) {}
    } else if (activeSource === 'audio' && audioElement) {
      audioElement.pause()
    }
    if (onStateChange) onStateChange(PLAYER_STATE.PAUSED)
  }

  function togglePlay() {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  function seek(targetLyricsSeconds) {
    const dur = getDuration()
    const target = Math.max(0, Math.min(targetLyricsSeconds, dur))
    const targetVideoTime = Math.max(0, target + activeOffset)

    if (activeSource === 'youtube' && ytPlayer && isPlayerReady && ytPlayer.seekTo) {
      ytPlayer.seekTo(targetVideoTime, true)
    } else if (activeSource === 'audio' && audioElement) {
      audioElement.currentTime = targetVideoTime
    } else if (activeSource === 'virtual') {
      fallbackTime = target
    }
    if (onTimeUpdate) onTimeUpdate(target)
  }

  function getCurrentTime() {
    if (activeSource === 'youtube' && ytPlayer && isPlayerReady && ytPlayer.getCurrentTime) {
      const rawVideoTime = ytPlayer.getCurrentTime() || 0
      return rawVideoTime - activeOffset
    }
    if (activeSource === 'audio' && audioElement) {
      return (audioElement.currentTime || 0) - activeOffset
    }
    return fallbackTime
  }

  function getRawVideoTime() {
    if (activeSource === 'youtube' && ytPlayer && isPlayerReady && ytPlayer.getCurrentTime) {
      return ytPlayer.getCurrentTime() || 0
    }
    if (activeSource === 'audio' && audioElement) {
      return audioElement.currentTime || 0
    }
    return fallbackTime + activeOffset
  }

  function getDuration() {
    if (activeSource === 'youtube' && ytPlayer && isPlayerReady && ytPlayer.getDuration) {
      const dur = ytPlayer.getDuration()
      if (dur > 0) return Math.max(1, dur - activeOffset)
    }
    if (activeSource === 'audio' && audioElement && audioElement.duration) {
      return Math.max(1, audioElement.duration - activeOffset)
    }
    return Math.max(1, (lastKnownDuration || 180) - activeOffset)
  }

  function setTrackType(trackType) {
    if (trackType === currentTrackType) return
    currentTrackType = trackType

    if (trackType === TRACK_TYPE.INSTRUMENTAL && currentVideos[1]) {
      setVideo(currentVideos[1].id)
    } else if (currentVideos[0]) {
      setVideo(currentVideos[0].id)
    }
  }

  function setVolume(volume) {
    const v = Math.max(0, Math.min(100, Number(volume) || 0))
    currentVolume = v
    localStorage.setItem('saranga_player_volume', String(v))
    if (ytPlayer && ytPlayer.setVolume) {
      ytPlayer.setVolume(currentVolume)
    }
    if (audioElement) {
      audioElement.volume = currentVolume / 100
    }
  }

  function getVolume() {
    return currentVolume
  }

  function destroy() {
    stopClock()
    if (ytPlayer && ytPlayer.destroy) {
      ytPlayer.destroy()
      ytPlayer = null
    }
    if (audioElement) {
      audioElement.pause()
      audioElement.remove()
      audioElement = null
    }
  }

  return {
    loadSong,
    play,
    pause,
    togglePlay,
    seek,
    getCurrentTime,
    getRawVideoTime,
    getDuration,
    getVideos: () => currentVideos,
    getActiveVideo: () => activeVideo,
    getActiveVideoId: () => activeVideoId,
    getActiveOffset: () => activeOffset,
    setVideo,
    setTrackType,
    getTrackType: () => currentTrackType,
    getIsPlaying: () => isPlaying,
    setVolume,
    getVolume,
    destroy
  }
}

