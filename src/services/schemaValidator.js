// Validador y normalizador universal de canciones y paquetes (song-package.json / song entity)

export function validateSongPackage(pkg) {
  if (!pkg || typeof pkg !== 'object') {
    throw new Error('El archivo proporcionado no es un objeto JSON válido.')
  }

  // Extraer metadata, basic y advanced admitiendo tanto formato paquete como formato entidad directa
  const rawMetadata = (pkg.metadata && typeof pkg.metadata === 'object') ? pkg.metadata : {}
  const rawBasic = (pkg.basic && typeof pkg.basic === 'object')
    ? pkg.basic
    : ((pkg.lyrics_data && typeof pkg.lyrics_data === 'object') ? pkg.lyrics_data : {})
  const rawAdvanced = (pkg.advanced && typeof pkg.advanced === 'object')
    ? pkg.advanced
    : ((pkg.visuals_data && typeof pkg.visuals_data === 'object') ? pkg.visuals_data : { enabled: false, effects: [] })

  // Título: buscar en rawMetadata.title, o en la raíz (pkg.title, pkg.song, pkg.trackName)
  const rawTitle = rawMetadata.title || pkg.title || pkg.song || pkg.trackName || ''
  if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
    throw new Error('El paquete debe contener un título válido en metadata.title.')
  }
  const title = rawTitle.trim()

  // Artista: buscar en rawMetadata.artist, o en la raíz (pkg.artist, pkg.artistName)
  const rawArtist = rawMetadata.artist || pkg.artist || pkg.artistName || 'Artista Desconocido'
  const artist = (typeof rawArtist === 'string' && rawArtist.trim()) ? rawArtist.trim() : 'Artista Desconocido'

  // Géneros y Etiquetas
  const genres = Array.isArray(rawMetadata.genres)
    ? rawMetadata.genres
    : (Array.isArray(pkg.genres) ? pkg.genres : [])
  const tags = Array.isArray(rawMetadata.tags)
    ? rawMetadata.tags
    : (Array.isArray(pkg.tags) ? pkg.tags : [])

  // Audio path
  const audioPath = rawMetadata.audioPath || pkg.audio_path || pkg.audioPath || ''

  // Normalización de videos
  const videos = normalizeVideos(rawMetadata, rawBasic, pkg)

  const youtubeFull = rawMetadata.youtubeUrlFull || rawBasic.youtube?.full || pkg.youtubeUrlFull || (videos[0]?.url || '')
  const youtubeInstrumental = rawMetadata.youtubeUrlInstrumental || rawBasic.youtube?.instrumental || pkg.youtubeUrlInstrumental || (videos[1]?.url || videos[0]?.url || '')

  const normalizedLanguages = normalizeLanguages(rawBasic)

  const timing = {
    bpm: rawBasic.timing?.bpm || 120,
    timeSignature: rawBasic.timing?.timeSignature || [4, 4],
    syncMode: rawBasic.timing?.syncMode || 'timestamp',
    globalOffset: rawBasic.timing?.globalOffset || 0
  }

  const styles = {
    textColor: rawBasic.styles?.textColor || '#94a3b8',
    activeColor: rawBasic.styles?.activeColor || '#fbbf24',
    completedColor: rawBasic.styles?.completedColor || '#f59e0b',
    translationColor: rawBasic.styles?.translationColor || '#38bdf8',
    backgroundColor: rawBasic.styles?.backgroundColor || '#0f172a',
    fontFamily: rawBasic.styles?.fontFamily || 'Inter, system-ui, sans-serif',
    fontSize: rawBasic.styles?.fontSize || '2rem'
  }

  const youtube = {
    full: youtubeFull,
    instrumental: youtubeInstrumental
  }

  const lyricsData = {
    timing,
    styles,
    videos,
    youtube,
    languages: normalizedLanguages
  }

  const visualsData = rawAdvanced && typeof rawAdvanced === 'object'
    ? rawAdvanced
    : { enabled: false, effects: [] }

  const normalizedPackage = {
    // 1. Formato de Paquete JSON (song-package.json para shareService y db.js)
    version: pkg.version || '1.1.0',
    metadata: {
      title,
      artist,
      genres,
      tags,
      audioPath,
      videos,
      youtubeUrlFull: youtubeFull,
      youtubeUrlInstrumental: youtubeInstrumental
    },
    basic: lyricsData,
    advanced: visualsData,

    // 2. Formato de Entidad Directa (para songEditorView, mediaPlayer, main.js y DB)
    id: pkg.id ?? null,
    title,
    artist,
    genres,
    tags,
    audio_path: audioPath,
    videos,
    lyrics_data: lyricsData,
    visuals_data: visualsData
  }

  return normalizedPackage
}

export function normalizeVideos(metadata = {}, basic = {}, pkg = {}) {
  let sourceVideos = []
  if (Array.isArray(metadata.videos) && metadata.videos.length > 0) {
    sourceVideos = metadata.videos
  } else if (Array.isArray(pkg.videos) && pkg.videos.length > 0) {
    sourceVideos = pkg.videos
  } else if (Array.isArray(basic.videos) && basic.videos.length > 0) {
    sourceVideos = basic.videos
  } else {
    const full = metadata.youtubeUrlFull || basic.youtube?.full || pkg.youtubeUrlFull || ''
    const inst = metadata.youtubeUrlInstrumental || basic.youtube?.instrumental || pkg.youtubeUrlInstrumental || ''
    if (full) {
      sourceVideos.push({
        id: 'vid-1',
        name: 'Video Oficial',
        url: full,
        offset: 0
      })
    }
    if (inst && inst !== full) {
      sourceVideos.push({
        id: 'vid-2',
        name: 'Versión Karaoke / Instrumental',
        url: inst,
        offset: 0
      })
    }
  }

  return sourceVideos.map((v, index) => ({
    id: v.id ? String(v.id) : `vid-${Date.now()}-${index}`,
    name: (v.name || `Video ${index + 1}`).trim(),
    url: (v.url || '').trim(),
    offset: Number(v.offset) || 0
  }))
}

function normalizeLanguages(basic) {
  // Retrocompatibilidad con esquemas anteriores mono-idioma
  if (Array.isArray(basic.languages) && basic.languages.length > 0) {
    let hasMain = false
    return basic.languages.map((lang, index) => {
      const isMain = lang.isMain ?? (index === 0 && !hasMain)
      if (isMain) hasMain = true
      return {
        code: lang.code || (index === 0 ? 'es' : `trans-${index}`),
        name: lang.name || (isMain ? 'Idioma Principal' : `Traducción ${index}`),
        isMain,
        plain: lang.plain || '',
        lines: Array.isArray(lang.lines) ? normalizeLines(lang.lines) : []
      }
    })
  }

  // Si venía un esquema antiguo con lines en la raíz de basic
  if (Array.isArray(basic.lines)) {
    return [
      {
        code: 'und',
        name: 'Original',
        isMain: true,
        plain: basic.plain || '',
        lines: normalizeLines(basic.lines)
      }
    ]
  }

  return [
    {
      code: 'es',
      name: 'Español (Original)',
      isMain: true,
      plain: '',
      lines: []
    }
  ]
}

function normalizeLines(lines) {
  return lines.map((line, lineIndex) => {
    const startTime = Number(line.startTime ?? line.start ?? 0)
    const endTime = Number(line.endTime ?? line.end ?? (startTime + 3))
    const syllables = Array.isArray(line.syllables)
      ? line.syllables.map((syl, sylIndex) => ({
        id: syl.id || `syl-${lineIndex}-${sylIndex}`,
        text: syl.text || '',
        altText: String(syl.altText ?? syl.romaji ?? ''),
        startTime: Number(syl.startTime ?? syl.start ?? startTime),
        duration: Number(syl.duration ?? 0.3)
      }))
      : []

    return {
      id: line.id || `line-${lineIndex}`,
      text: line.text || '',
      altText: String(line.altText ?? line.romaji ?? '').trim(),
      startTime,
      endTime,
      syllables
    }
  })
}

export { validateSongPackage as normalizeSongPackage }
