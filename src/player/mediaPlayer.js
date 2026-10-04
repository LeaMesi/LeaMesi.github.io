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
export function loadYouTubeApi() {
  if (window.YT && window.YT.Player) {
    return Promise.resolve(window.YT)
  }
  if (!ytApiPromise) {
    ytApiPromise = new Promise((resolve) => {
      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]')
      if (!existing) {
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
      }
      const prevOnReady = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevOnReady === 'function') prevOnReady()
        resolve(window.YT)
      }
    })
  }
  return ytApiPromise
}

export function createMediaPlayer({ containerId, onTimeUpdate, onStateChange, onDurationChange }) {
  let ytPlayer = null
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
      const lyricsTime = getLyricsTime()
      if (onTimeUpdate) onTimeUpdate(currentTime, lyricsTime)
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

  async function initYouTubePlayer(domElementId, initialVideoId, autoplay = false) {
    const YT = await loadYouTubeApi()
    return new Promise((resolve) => {
      ytPlayer = new YT.Player(domElementId, {
        videoId: initialVideoId || '',
        playerVars: {
          autoplay: autoplay ? 1 : 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1
        },
        events: {
          onReady: () => {
            if (ytPlayer.setVolume) {
              ytPlayer.setVolume(currentVolume)
            }
            if (ytPlayer.getDuration) {
              const dur = ytPlayer.getDuration()
              if (dur > 0) {
                lastKnownDuration = dur
                if (onDurationChange) onDurationChange(getDuration())
              }
            }
            if (autoplay) {
              isPlaying = true
              startClock()
              if (ytPlayer.playVideo) ytPlayer.playVideo()
            }
            resolve(ytPlayer)
          },
          onStateChange: (event) => {
            const state = event.data
            if (state === PLAYER_STATE.PLAYING) {
              isPlaying = true
              startClock()
              const dur = ytPlayer.getDuration ? ytPlayer.getDuration() : 0
              if (dur > 0 && dur !== lastKnownDuration) {
                lastKnownDuration = dur
                if (onDurationChange) onDurationChange(getDuration())
              }
            } else if (state === PLAYER_STATE.BUFFERING) {
              // Si el usuario activó la reproducción, no detener el reloj ni marcar en falso
              if (isPlaying) {
                startClock()
              }
            } else if (state === PLAYER_STATE.PAUSED || state === PLAYER_STATE.ENDED) {
              isPlaying = false
              stopClock()
              if (onTimeUpdate) onTimeUpdate(getCurrentTime(), getLyricsTime())
            }
            if (onStateChange) onStateChange(state)
          }
        }
      })
    })
  }

  async function loadSong(song, preferredVideoId = null, options = {}) {
    let autoplay = false
    let targetVideoId = null

    if (preferredVideoId && typeof preferredVideoId === 'object') {
      autoplay = Boolean(preferredVideoId.autoplay)
      targetVideoId = preferredVideoId.preferredVideoId || null
    } else {
      targetVideoId = preferredVideoId
      if (options && typeof options === 'object') {
        autoplay = Boolean(options.autoplay)
        if (options.preferredVideoId) targetVideoId = options.preferredVideoId
      }
    }

    stopClock()
    isPlaying = autoplay
    fallbackTime = 0
    currentSong = song

    const metadata = song.metadata || song
    const lyricsData = song.lyrics_data || song.basic || {}

    currentVideos = normalizeVideos(metadata, lyricsData)

    if (targetVideoId) {
      activeVideo = currentVideos.find(v => String(v.id) === String(targetVideoId)) || currentVideos[0] || null
    } else {
      activeVideo = currentVideos[0] || null
    }

    activeVideoId = activeVideo ? activeVideo.id : null
    activeOffset = activeVideo ? (Number(activeVideo.offset) || 0) : 0

    const primaryVideoId = activeVideo ? extractYouTubeVideoId(activeVideo.url) : null
    audioUrl = metadata.audioPath || song.audio_path || null

    if (primaryVideoId) {
      activeSource = 'youtube'
      if (!ytPlayer) {
        await initYouTubePlayer(containerId, primaryVideoId, autoplay)
      } else if (autoplay && ytPlayer.loadVideoById) {
        ytPlayer.loadVideoById(primaryVideoId)
        isPlaying = true
        startClock()
        if (ytPlayer.playVideo) ytPlayer.playVideo()
      } else if (ytPlayer.cueVideoById) {
        ytPlayer.cueVideoById(primaryVideoId)
        if (autoplay) {
          isPlaying = true
          startClock()
          if (ytPlayer.playVideo) ytPlayer.playVideo()
        }
      }
    } else if (audioUrl) {
      activeSource = 'audio'
      audioElement.src = audioUrl
      audioElement.load()
      if (autoplay) {
        isPlaying = true
        startClock()
        audioElement.play().catch(err => console.warn('Audio play prevented:', err))
      }
    } else {
      // Modo emulado sin audio / local
      activeSource = 'virtual'
      lastKnownDuration = 180
      if (onDurationChange) onDurationChange(lastKnownDuration)
      if (autoplay) {
        play()
      }
    }

    if (onStateChange) onStateChange(autoplay ? PLAYER_STATE.PLAYING : PLAYER_STATE.CUED)
  }

  function setVideo(videoId) {
    const target = currentVideos.find(v => String(v.id) === String(videoId))
    if (!target) return
    if (activeVideo && String(activeVideo.id) === String(target.id)) return

    // Mantener la posición sincronizada de la letra entre diferentes pistas/videos
    const curLyricsTime = getLyricsTime()
    activeVideo = target
    activeVideoId = target.id
    activeOffset = Number(target.offset) || 0

    // En el nuevo video, el segundo correspondiente es su offset + el tiempo de la letra
    const targetVideoTime = Math.max(0, curLyricsTime + activeOffset)
    const ytVideoId = extractYouTubeVideoId(target.url)

    if (ytVideoId && ytPlayer) {
      activeSource = 'youtube'
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
    }
  }

  function play() {
    isPlaying = true
    if (activeSource === 'youtube' && ytPlayer && ytPlayer.playVideo) {
      startClock()
      ytPlayer.playVideo()
    } else if (activeSource === 'audio' && audioElement) {
      audioElement.play().catch(err => console.warn('Audio play prevented:', err))
      startClock()
      if (onStateChange) onStateChange(PLAYER_STATE.PLAYING)
    } else if (activeSource === 'virtual') {
      startClock()
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
  }

  function pause() {
    isPlaying = false
    stopClock()
    if (activeSource === 'youtube' && ytPlayer && ytPlayer.pauseVideo) {
      ytPlayer.pauseVideo()
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

  function seek(targetSeconds) {
    const dur = getDuration()
    const targetVideoTime = Math.max(0, Math.min(targetSeconds, dur))

    if (activeSource === 'youtube' && ytPlayer && ytPlayer.seekTo) {
      ytPlayer.seekTo(targetVideoTime, true)
    } else if (activeSource === 'audio' && audioElement) {
      audioElement.currentTime = targetVideoTime
    } else if (activeSource === 'virtual') {
      fallbackTime = targetVideoTime
    }
    if (onTimeUpdate) onTimeUpdate(targetVideoTime, getLyricsTime())
  }

  function seekLyricsTime(targetLyricsSeconds) {
    const targetVideoTime = targetLyricsSeconds + activeOffset
    seek(targetVideoTime)
  }

  function getCurrentTime() {
    if (activeSource === 'youtube' && ytPlayer && ytPlayer.getCurrentTime) {
      return ytPlayer.getCurrentTime() || 0
    }
    if (activeSource === 'audio' && audioElement) {
      return audioElement.currentTime || 0
    }
    return fallbackTime
  }

  function setActiveOffset(newOffset) {
    const off = Math.round((Number(newOffset) || 0) * 10) / 10
    activeOffset = off
    if (activeVideo) {
      activeVideo.offset = off
    }
    const curTime = getCurrentTime()
    const lyricsTime = getLyricsTime()
    if (onTimeUpdate) {
      onTimeUpdate(curTime, lyricsTime)
    }
  }

  function getLyricsTime() {
    return getCurrentTime() - activeOffset
  }

  function getRawVideoTime() {
    return getCurrentTime()
  }

  function getDuration() {
    if (activeSource === 'youtube' && ytPlayer && ytPlayer.getDuration) {
      const dur = ytPlayer.getDuration()
      if (dur > 0) return dur
    }
    if (activeSource === 'audio' && audioElement && audioElement.duration) {
      return audioElement.duration
    }
    return lastKnownDuration || 180
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
    seekLyricsTime,
    getCurrentTime,
    getLyricsTime,
    getRawVideoTime,
    getDuration,
    getVideos: () => currentVideos,
    getActiveVideo: () => activeVideo,
    getActiveVideoId: () => activeVideoId,
    getActiveOffset: () => activeOffset,
    setActiveOffset,
    setVideo,
    setTrackType,
    getTrackType: () => currentTrackType,
    getIsPlaying: () => isPlaying,
    setVolume,
    getVolume,
    destroy
  }
}

