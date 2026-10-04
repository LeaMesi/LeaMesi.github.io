import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  extractYouTubeVideoId,
  createMediaPlayer,
  TRACK_TYPE,
  PLAYER_STATE
} from '../../src/player/mediaPlayer.js'

describe('player/mediaPlayer.js', () => {
  describe('extractYouTubeVideoId', () => {
    it('extrae ID directamente si es un string de 11 caracteres válido', () => {
      expect(extractYouTubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(extractYouTubeVideoId('abc_12-XYZ9')).toBe('abc_12-XYZ9')
    })

    it('extrae ID de URLs estándar de YouTube', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(extractYouTubeVideoId('https://youtube.com/watch?v=dQw4w9WgXcQ&feature=shared')).toBe('dQw4w9WgXcQ')
    })

    it('extrae ID de URLs cortas de youtu.be', () => {
      expect(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(extractYouTubeVideoId('http://youtu.be/dQw4w9WgXcQ?t=10')).toBe('dQw4w9WgXcQ')
    })

    it('extrae ID de YouTube Music (music.youtube.com)', () => {
      expect(extractYouTubeVideoId('https://music.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
      expect(extractYouTubeVideoId('https://music.youtube.com/watch?v=dQw4w9WgXcQ&si=12345')).toBe('dQw4w9WgXcQ')
    })

    it('extrae ID de YouTube Shorts', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('extrae ID de embeds de YouTube', () => {
      expect(extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('retorna null para valores nulos o inválidos', () => {
      expect(extractYouTubeVideoId(null)).toBeNull()
      expect(extractYouTubeVideoId('')).toBeNull()
      expect(extractYouTubeVideoId('https://google.com')).toBeNull()
      expect(extractYouTubeVideoId('invalido')).toBeNull()
    })
  })

  describe('createMediaPlayer', () => {
    let player = null
    let container = null

    beforeEach(() => {
      container = document.createElement('div')
      container.id = 'yt-test-player'
      document.body.appendChild(container)
    })

    afterEach(() => {
      if (player) {
        player.destroy()
        player = null
      }
      if (container && container.parentNode) {
        container.parentNode.removeChild(container)
      }
    })

    it('inicializa con volumen desde localStorage o predeterminado 80', () => {
      localStorage.setItem('saranga_player_volume', '65')
      player = createMediaPlayer({ containerId: 'yt-test-player' })
      expect(player.getVolume()).toBe(65)
    })

    it('actualiza y persiste el volumen entre 0 y 100', () => {
      player = createMediaPlayer({ containerId: 'yt-test-player' })
      player.setVolume(45)
      expect(player.getVolume()).toBe(45)
      expect(localStorage.getItem('saranga_player_volume')).toBe('45')

      // Verificación de límites
      player.setVolume(150)
      expect(player.getVolume()).toBe(100)

      player.setVolume(-20)
      expect(player.getVolume()).toBe(0)
    })

    it('carga una canción con modo virtual y normaliza videos y offsets', async () => {
      const mockSongData = {
        title: 'Canción Demo',
        videos: [
          { id: 'v1', name: 'Pista 1', url: '', offset: 2.5 },
          { id: 'v2', name: 'Pista 2', url: '', offset: 0 }
        ]
      }

      player = createMediaPlayer({ containerId: 'yt-test-player' })
      await player.loadSong(mockSongData)

      expect(player.getVideos().length).toBe(2)
      expect(player.getActiveVideoId()).toBe('v1')
      expect(player.getActiveOffset()).toBe(2.5)

      // Cambiar a pista instrumental
      player.setTrackType(TRACK_TYPE.INSTRUMENTAL)
      expect(player.getActiveVideoId()).toBe('v2')
      expect(player.getActiveOffset()).toBe(0)
    })

    it('inicializa y reproduce con YouTube Player simulado', async () => {
      window.YT = {
        Player: class {
          constructor(id, opts) {
            this.opts = opts
            setTimeout(() => {
              if (opts.events?.onReady) opts.events.onReady()
            }, 10)
          }
          setVolume() {}
          getDuration() { return 120 }
          getCurrentTime() { return 15 }
          playVideo() {}
          pauseVideo() {}
          seekTo() {}
          cueVideoById() {}
          destroy() {}
        }
      }

      player = createMediaPlayer({ containerId: 'yt-test-player' })
      await player.loadSong({
        title: 'Canción YouTube',
        videos: [
          { id: 'v-yt', name: 'Video Oficial', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', offset: 2 }
        ]
      })

      expect(player.getActiveVideoId()).toBe('v-yt')
      expect(player.getActiveOffset()).toBe(2)
      // getCurrentTime reporta el tiempo real completo del video (15s)
      expect(player.getCurrentTime()).toBe(15)
      // getDuration reporta la duración completa del video (120s) sin acortar la canción
      expect(player.getDuration()).toBe(120)
      // getLyricsTime reporta el tiempo ajustado para sincronizar las letras: 15 - 2 = 13s
      expect(player.getLyricsTime()).toBe(13)
    })

    it('inicia reproducción automáticamente si autoplay es true al cargar canción', async () => {
      let isPlayingReported = false
      const playerInstance = createMediaPlayer({
        containerId: 'yt-test-player',
        onStateChange: (state) => {
          if (state === PLAYER_STATE.PLAYING) {
            isPlayingReported = true
          }
        }
      })

      await playerInstance.loadSong({
        title: 'Virtual Track',
        videos: []
      }, null, { autoplay: true })

      expect(playerInstance.getIsPlaying()).toBe(true)
      expect(isPlayingReported).toBe(true)
      playerInstance.destroy()
    })

    it('permite cambiar el offset en caliente mediante setActiveOffset sin pausar ni reiniciar el video', async () => {
      const timeUpdates = []
      player = createMediaPlayer({
        containerId: 'yt-test-player',
        onTimeUpdate: (currentTime, lyricsTime) => {
          timeUpdates.push({ currentTime, lyricsTime })
        }
      })

      await player.loadSong({
        title: 'Offset Test',
        videos: [
          { id: 'v1', name: 'Pista', url: '', offset: 1.0 }
        ]
      })

      expect(player.getActiveOffset()).toBe(1.0)

      // Cambiar offset en caliente
      player.setActiveOffset(1.5)
      expect(player.getActiveOffset()).toBe(1.5)
      expect(player.getVideos()[0].offset).toBe(1.5)

      // Debe haber emitido onTimeUpdate inmediatamente con el nuevo lyricsTime
      expect(timeUpdates.length).toBeGreaterThan(0)
      const lastUpdate = timeUpdates[timeUpdates.length - 1]
      expect(lastUpdate.lyricsTime).toBe(lastUpdate.currentTime - 1.5)
    })

    it('detiene la reproducción, resetea estado y notifica al llamar a stop()', async () => {
      const stateChanges = []
      player = createMediaPlayer({
        containerId: 'yt-test-player',
        onStateChange: (st) => stateChanges.push(st)
      })

      await player.loadSong({
        title: 'Stop Test',
        audio_path: 'test.mp3'
      }, null, { autoplay: false })

      player.play()
      expect(player.getIsPlaying()).toBe(true)

      player.stop()
      expect(player.getIsPlaying()).toBe(false)
      expect(player.getDuration()).toBe(0)
      expect(stateChanges).toContain(PLAYER_STATE.PAUSED)
    })
  })
})

