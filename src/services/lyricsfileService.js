import { load, dump } from 'js-yaml'
import { saveSong, addTranslationToSong, fetchSongById } from './songService.js'

function triggerDownload(content, filename, contentType = 'text/yaml;charset=utf-8') {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function sanitizeFilename(name) {
  return (name || 'cancion')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
}

export function parseLyricsfile(yamlContent) {
  if (typeof yamlContent !== 'string') {
    throw new Error('El contenido a parsear debe ser una cadena YAML.')
  }

  const doc = load(yamlContent)
  if (!doc || typeof doc !== 'object') {
    throw new Error('Documento YAML inválido o vacío.')
  }

  const metadata = doc.metadata || {}
  const rawLines = Array.isArray(doc.lines) ? doc.lines : []

  const lines = rawLines.map((line, lineIndex) => {
    const startMs = Number(line.start_ms ?? 0)
    const endMs = Number(line.end_ms ?? (startMs + 3000))
    const startTime = startMs / 1000
    const endTime = endMs / 1000

    const rawWords = Array.isArray(line.words) ? line.words : []
    const syllables = rawWords.map((word, wordIndex) => {
      const wStartMs = Number(word.start_ms ?? startMs)
      const wEndMs = Number(word.end_ms ?? (wStartMs + 300))
      return {
        id: `syl-${lineIndex}-${wordIndex}`,
        text: word.text || '',
        startTime: wStartMs / 1000,
        duration: Math.max(0.05, (wEndMs - wStartMs) / 1000)
      }
    })

    return {
      id: `line-${lineIndex}`,
      text: line.text || rawWords.map(w => w.text).join(''),
      startTime,
      endTime,
      syllables
    }
  })

  const plain = doc.plain || lines.map(l => l.text).join('\n')

  return {
    version: doc.version || '1.0',
    metadata: {
      title: metadata.title || 'Canción Importada',
      artist: metadata.artist || 'Artista Desconocido',
      language: metadata.language || 'und',
      duration_ms: metadata.duration_ms,
      instrumental: Boolean(metadata.instrumental),
      offset_ms: Number(metadata.offset_ms || 0)
    },
    lines,
    plain
  }
}

export function convertToLyricsfileYaml(song, languageCode = null) {
  const lyricsData = song.lyrics_data || song.basic || {}
  const languages = Array.isArray(lyricsData.languages) ? lyricsData.languages : []

  let targetLang = null
  if (languageCode) {
    targetLang = languages.find(l => l.code === languageCode)
  }
  if (!targetLang) {
    targetLang = languages.find(l => l.isMain) || languages[0]
  }

  if (!targetLang) {
    throw new Error('No se encontró una pista de letra en la canción para exportar.')
  }

  const lines = (targetLang.lines || []).map(line => {
    const startMs = Math.round((line.startTime || 0) * 1000)
    const endMs = Math.round((line.endTime || (line.startTime + 3)) * 1000)

    const words = (line.syllables || []).map(syl => {
      const wStartMs = Math.round((syl.startTime || line.startTime) * 1000)
      const wEndMs = Math.round(((syl.startTime || line.startTime) + (syl.duration || 0.3)) * 1000)
      return {
        text: syl.text || '',
        start_ms: wStartMs,
        end_ms: Math.max(wStartMs + 50, wEndMs)
      }
    })

    return {
      text: line.text || '',
      start_ms: startMs,
      end_ms: endMs,
      words
    }
  })

  const plainText = targetLang.plain || lines.map(l => l.text).join('\n')

  const doc = {
    version: '1.0',
    metadata: {
      title: song.title || song.metadata?.title || 'Sin Título',
      artist: song.artist || song.metadata?.artist || 'Desconocido',
      language: targetLang.code || 'und',
      offset_ms: Math.round((lyricsData.timing?.globalOffset || 0) * 1000),
      instrumental: false
    },
    lines,
    plain: plainText
  }

  return dump(doc, { lineWidth: -1, noRefs: true })
}

export async function exportLanguageToLyricsfile(songId, languageCode = null) {
  const song = await fetchSongById(songId)
  if (!song) throw new Error('Canción no encontrada.')

  const yamlContent = convertToLyricsfileYaml(song, languageCode)
  const targetCode = languageCode || 'main'
  const filename = `${sanitizeFilename(song.title)}.${targetCode}.lyricsfile.yaml`
  triggerDownload(yamlContent, filename)
  return yamlContent
}

export async function importLyricsfileAsNewSong(fileOrYaml) {
  let yamlContent = ''
  if (typeof fileOrYaml === 'string') {
    yamlContent = fileOrYaml
  } else if (fileOrYaml instanceof Blob || fileOrYaml instanceof File) {
    yamlContent = await fileOrYaml.text()
  }

  const parsed = parseLyricsfile(yamlContent)

  const songData = {
    title: parsed.metadata.title,
    artist: parsed.metadata.artist,
    genres: [],
    tags: ['lyricsfile-import'],
    audio_path: '',
    lyrics_data: {
      timing: {
        bpm: 120,
        timeSignature: [4, 4],
        syncMode: 'timestamp',
        globalOffset: parsed.metadata.offset_ms / 1000
      },
      styles: {
        textColor: '#94a3b8',
        activeColor: '#fbbf24',
        completedColor: '#f59e0b',
        translationColor: '#38bdf8',
        backgroundColor: '#0f172a',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '2rem'
      },
      languages: [
        {
          code: parsed.metadata.language,
          name: parsed.metadata.language.toUpperCase(),
          isMain: true,
          plain: parsed.plain,
          lines: parsed.lines
        }
      ]
    },
    visuals_data: {
      enabled: false,
      effects: []
    }
  }

  const songId = await saveSong(songData)
  return songId
}

export async function importLyricsfileAsTranslation(songId, fileOrYaml) {
  let yamlContent = ''
  if (typeof fileOrYaml === 'string') {
    yamlContent = fileOrYaml
  } else if (fileOrYaml instanceof Blob || fileOrYaml instanceof File) {
    yamlContent = await fileOrYaml.text()
  }

  const parsed = parseLyricsfile(yamlContent)

  const translation = {
    code: parsed.metadata.language,
    name: `${parsed.metadata.language.toUpperCase()} (Importado)`,
    isMain: false,
    plain: parsed.plain,
    lines: parsed.lines
  }

  await addTranslationToSong(songId, translation)
  return translation
}
