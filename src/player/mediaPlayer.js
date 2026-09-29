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

function extractYouTubeVideoId(url) {
  if (!url) return null
  const str = url.trim()
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str
  }
  const match = str.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
  return match ? match[1] : null
}

let ytApiPromise = null
function loadYouTubeApi() {
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

  // Inicializar elemento de audio HTML5
  audioElement = document.createElement('audio')
  audioElement.preload = 'metadata'
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
    const YT = await loadYouTubeApi()
    return new Promise((resolve) => {
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
            if (ytPlayer.getDuration) {
              const dur = ytPlayer.getDuration()
              if (dur > 0) {
                lastKnownDuration = dur
                if (onDurationChange) onDurationChange(getDuration())
              }
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
            } else {
              isPlaying = false
              stopClock()
              if (onTimeUpdate) onTimeUpdate(getCurrentTime())
            }
            if (onStateChange) onStateChange(state)
          }
        }
      })
    })
  }

  async function loadSong(song, preferredVideoId = null) {
    stopClock()
    isPlaying = false
    fallbackTime = 0
    currentSong = song

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
      if (!ytPlayer) {
        await initYouTubePlayer(containerId, primaryVideoId)
      } else if (ytPlayer.cueVideoById) {
        ytPlayer.cueVideoById(primaryVideoId)
      }
    } else if (audioUrl) {
      activeSource = 'audio'
      audioElement.src = audioUrl
      audioElement.load()
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

  function seek(targetLyricsSeconds) {
    const dur = getDuration()
    const target = Math.max(0, Math.min(targetLyricsSeconds, dur))
    const targetVideoTime = Math.max(0, target + activeOffset)

    if (activeSource === 'youtube' && ytPlayer && ytPlayer.seekTo) {
      ytPlayer.seekTo(targetVideoTime, true)
    } else if (activeSource === 'audio' && audioElement) {
      audioElement.currentTime = targetVideoTime
    } else if (activeSource === 'virtual') {
      fallbackTime = target
    }
    if (onTimeUpdate) onTimeUpdate(target)
  }

  function getCurrentTime() {
    if (activeSource === 'youtube' && ytPlayer && ytPlayer.getCurrentTime) {
      const rawVideoTime = ytPlayer.getCurrentTime() || 0
      return rawVideoTime - activeOffset
    }
    if (activeSource === 'audio' && audioElement) {
      return (audioElement.currentTime || 0) - activeOffset
    }
    return fallbackTime
  }

  function getRawVideoTime() {
    if (activeSource === 'youtube' && ytPlayer && ytPlayer.getCurrentTime) {
      return ytPlayer.getCurrentTime() || 0
    }
    if (activeSource === 'audio' && audioElement) {
      return audioElement.currentTime || 0
    }
    return fallbackTime + activeOffset
  }

  function getDuration() {
    if (activeSource === 'youtube' && ytPlayer && ytPlayer.getDuration) {
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
    destroy
  }
}
