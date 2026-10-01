// Validador y normalizador de paquetes de canciones (song-package.json)

export function validateSongPackage(pkg) {
  if (!pkg || typeof pkg !== 'object') {
    throw new Error('El archivo proporcionado no es un objeto JSON válido.')
  }

  const metadata = pkg.metadata || {}
  if (!metadata.title || typeof metadata.title !== 'string') {
    throw new Error('El paquete debe contener un título válido en metadata.title.')
  }

  const basic = pkg.basic || {}
  const videos = normalizeVideos(metadata, basic)

  const normalizedPackage = {
    version: pkg.version || '1.1.0',
    metadata: {
      title: metadata.title.trim(),
      artist: (metadata.artist || 'Artista Desconocido').trim(),
      genres: Array.isArray(metadata.genres) ? metadata.genres : [],
      tags: Array.isArray(metadata.tags) ? metadata.tags : [],
      audioPath: metadata.audioPath || '',
      videos,
      youtubeUrlFull: metadata.youtubeUrlFull || basic.youtube?.full || (videos[0]?.url || ''),
      youtubeUrlInstrumental: metadata.youtubeUrlInstrumental || basic.youtube?.instrumental || (videos[1]?.url || videos[0]?.url || '')
    },
    basic: {
      timing: {
        bpm: basic.timing?.bpm || 120,
        timeSignature: basic.timing?.timeSignature || [4, 4],
        syncMode: basic.timing?.syncMode || 'timestamp',
        globalOffset: basic.timing?.globalOffset || 0
      },
      styles: {
        textColor: basic.styles?.textColor || '#94a3b8',
        activeColor: basic.styles?.activeColor || '#fbbf24',
        completedColor: basic.styles?.completedColor || '#f59e0b',
        translationColor: basic.styles?.translationColor || '#38bdf8',
        backgroundColor: basic.styles?.backgroundColor || '#0f172a',
        fontFamily: basic.styles?.fontFamily || 'Inter, system-ui, sans-serif',
        fontSize: basic.styles?.fontSize || '2rem'
      },
      videos,
      youtube: {
        full: basic.youtube?.full || metadata.youtubeUrlFull || (videos[0]?.url || ''),
        instrumental: basic.youtube?.instrumental || metadata.youtubeUrlInstrumental || (videos[1]?.url || videos[0]?.url || '')
      },
      languages: normalizeLanguages(basic)
    },
    advanced: pkg.advanced && typeof pkg.advanced === 'object' ? pkg.advanced : { enabled: false, effects: [] }
  }

  return normalizedPackage
}

export function normalizeVideos(metadata = {}, basic = {}) {
  let sourceVideos = []
  if (Array.isArray(metadata.videos) && metadata.videos.length > 0) {
    sourceVideos = metadata.videos
  } else if (Array.isArray(basic.videos) && basic.videos.length > 0) {
    sourceVideos = basic.videos
  } else {
    const full = metadata.youtubeUrlFull || basic.youtube?.full || ''
    const inst = metadata.youtubeUrlInstrumental || basic.youtube?.instrumental || ''
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
        startTime: Number(syl.startTime ?? syl.start ?? startTime),
        duration: Number(syl.duration ?? 0.3)
      }))
      : []

    return {
      id: line.id || `line-${lineIndex}`,
      text: line.text || '',
      startTime,
      endTime,
      syllables
    }
  })
}

export { validateSongPackage as normalizeSongPackage }
