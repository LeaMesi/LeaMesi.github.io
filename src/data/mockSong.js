// Canción de demostración multilingüe con marcas de tiempo y sílabas
export const mockSong = {
  version: '1.1.0',
  metadata: {
    title: 'Caminando por la Ciudad',
    artist: 'Saranga Band',
    genres: ['Rock Alternativo', 'Pop'],
    tags: ['karaoke', 'enérgico', 'bilingüe', 'demo'],
    audioPath: '',
    videos: [
      {
        id: 'vid-demo-1',
        name: 'Video Oficial',
        url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        offset: 0
      },
      {
        id: 'vid-demo-2',
        name: 'Pista Karaoke',
        url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        offset: 0
      }
    ],
    youtubeUrlFull: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk', // Demo video
    youtubeUrlInstrumental: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
  },
  basic: {
    timing: {
      bpm: 110,
      timeSignature: [4, 4],
      syncMode: 'timestamp',
      globalOffset: 0
    },
    styles: {
      textColor: '#94a3b8',
      activeColor: '#fbbf24',
      translationColor: '#38bdf8',
      backgroundColor: '#0f172a',
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      fontSize: '2.1rem'
    },
    videos: [
      {
        id: 'vid-demo-1',
        name: 'Video Oficial',
        url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        offset: 0
      },
      {
        id: 'vid-demo-2',
        name: 'Pista Karaoke',
        url: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
        offset: 0
      }
    ],
    youtube: {
      full: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk',
      instrumental: 'https://www.youtube.com/watch?v=kJQP7kiw5Fk'
    },
    languages: [
      {
        code: 'es',
        name: 'Español (Original)',
        isMain: true,
        plain: 'Caminando por la ciudad\nBajo la luz del sol brillante\nCada paso es libertad\nSintiendo el ritmo hacia adelante\n\nLas luces van a despertar\nLa noche empieza a florecer\nUna melodía sin final\nNos acompaña hasta el amanecer',
        lines: [
          {
            id: 'line-es-1',
            startTime: 2.0,
            endTime: 5.5,
            text: 'Caminando por la ciudad',
            syllables: [
              { text: 'Ca', startTime: 2.0, duration: 0.4 },
              { text: 'mi', startTime: 2.4, duration: 0.35 },
              { text: 'nan', startTime: 2.75, duration: 0.4 },
              { text: 'do ', startTime: 3.15, duration: 0.45 },
              { text: 'por ', startTime: 3.6, duration: 0.35 },
              { text: 'la ', startTime: 3.95, duration: 0.3 },
              { text: 'ciu', startTime: 4.25, duration: 0.45 },
              { text: 'dad', startTime: 4.7, duration: 0.7 }
            ]
          },
          {
            id: 'line-es-2',
            startTime: 6.0,
            endTime: 9.8,
            text: 'Bajo la luz del sol brillante',
            syllables: [
              { text: 'Ba', startTime: 6.0, duration: 0.35 },
              { text: 'jo ', startTime: 6.35, duration: 0.35 },
              { text: 'la ', startTime: 6.7, duration: 0.3 },
              { text: 'luz ', startTime: 7.0, duration: 0.45 },
              { text: 'del ', startTime: 7.45, duration: 0.35 },
              { text: 'sol ', startTime: 7.8, duration: 0.5 },
              { text: 'bri', startTime: 8.3, duration: 0.4 },
              { text: 'llan', startTime: 8.7, duration: 0.45 },
              { text: 'te', startTime: 9.15, duration: 0.6 }
            ]
          },
          {
            id: 'line-es-3',
            startTime: 10.5,
            endTime: 14.0,
            text: 'Cada paso es libertad',
            syllables: [
              { text: 'Ca', startTime: 10.5, duration: 0.35 },
              { text: 'da ', startTime: 10.85, duration: 0.35 },
              { text: 'pa', startTime: 11.2, duration: 0.4 },
              { text: 'so ', startTime: 11.6, duration: 0.4 },
              { text: 'es ', startTime: 12.0, duration: 0.35 },
              { text: 'li', startTime: 12.35, duration: 0.35 },
              { text: 'ber', startTime: 12.7, duration: 0.45 },
              { text: 'tad', startTime: 13.15, duration: 0.8 }
            ]
          },
          {
            id: 'line-es-4',
            startTime: 14.5,
            endTime: 18.5,
            text: 'Sintiendo el ritmo hacia adelante',
            syllables: [
              { text: 'Sin', startTime: 14.5, duration: 0.35 },
              { text: 'tien', startTime: 14.85, duration: 0.4 },
              { text: 'do el ', startTime: 15.25, duration: 0.4 },
              { text: 'rit', startTime: 15.65, duration: 0.35 },
              { text: 'mo ', startTime: 16.0, duration: 0.45 },
              { text: 'ha', startTime: 16.45, duration: 0.3 },
              { text: 'cia a', startTime: 16.75, duration: 0.4 },
              { text: 'de', startTime: 17.15, duration: 0.35 },
              { text: 'lan', startTime: 17.5, duration: 0.45 },
              { text: 'te', startTime: 17.95, duration: 0.55 }
            ]
          },
          {
            id: 'line-es-5',
            startTime: 19.5,
            endTime: 23.5,
            text: 'Las luces van a despertar',
            syllables: [
              { text: 'Las ', startTime: 19.5, duration: 0.35 },
              { text: 'lu', startTime: 19.85, duration: 0.35 },
              { text: 'ces ', startTime: 20.2, duration: 0.4 },
              { text: 'van ', startTime: 20.6, duration: 0.4 },
              { text: 'a ', startTime: 21.0, duration: 0.25 },
              { text: 'des', startTime: 21.25, duration: 0.4 },
              { text: 'per', startTime: 21.65, duration: 0.45 },
              { text: 'tar', startTime: 22.1, duration: 0.9 }
            ]
          },
          {
            id: 'line-es-6',
            startTime: 24.0,
            endTime: 28.0,
            text: 'La noche empieza a florecer',
            syllables: [
              { text: 'La ', startTime: 24.0, duration: 0.3 },
              { text: 'no', startTime: 24.3, duration: 0.35 },
              { text: 'che em', startTime: 24.65, duration: 0.45 },
              { text: 'pie', startTime: 25.1, duration: 0.35 },
              { text: 'za a ', startTime: 25.45, duration: 0.4 },
              { text: 'flo', startTime: 25.85, duration: 0.4 },
              { text: 're', startTime: 26.25, duration: 0.45 },
              { text: 'cer', startTime: 26.7, duration: 0.9 }
            ]
          },
          {
            id: 'line-es-7',
            startTime: 28.5,
            endTime: 32.5,
            text: 'Una melodía sin final',
            syllables: [
              { text: 'U', startTime: 28.5, duration: 0.3 },
              { text: 'na ', startTime: 28.8, duration: 0.3 },
              { text: 'me', startTime: 29.1, duration: 0.35 },
              { text: 'lo', startTime: 29.45, duration: 0.35 },
              { text: 'dí', startTime: 29.8, duration: 0.45 },
              { text: 'a ', startTime: 30.25, duration: 0.3 },
              { text: 'sin ', startTime: 30.55, duration: 0.45 },
              { text: 'fi', startTime: 31.0, duration: 0.45 },
              { text: 'nal', startTime: 31.45, duration: 0.95 }
            ]
          },
          {
            id: 'line-es-8',
            startTime: 33.0,
            endTime: 37.5,
            text: 'Nos acompaña hasta el amanecer',
            syllables: [
              { text: 'Nos ', startTime: 33.0, duration: 0.35 },
              { text: 'a', startTime: 33.35, duration: 0.3 },
              { text: 'com', startTime: 33.65, duration: 0.4 },
              { text: 'pa', startTime: 34.05, duration: 0.45 },
              { text: 'ña ', startTime: 34.5, duration: 0.35 },
              { text: 'has', startTime: 34.85, duration: 0.35 },
              { text: 'ta el ', startTime: 35.2, duration: 0.4 },
              { text: 'a', startTime: 35.6, duration: 0.3 },
              { text: 'ma', startTime: 35.9, duration: 0.35 },
              { text: 'ne', startTime: 36.25, duration: 0.45 },
              { text: 'cer', startTime: 36.7, duration: 0.8 }
            ]
          }
        ]
      },
      {
        code: 'en',
        name: 'English (Translation)',
        isMain: false,
        plain: 'Walking through the city\nUnder the bright sunlight\nEvery step is freedom\nFeeling the rhythm moving forward\n\nThe lights are about to wake up\nThe night begins to bloom\nAn endless melody\nAccompanies us until sunrise',
        lines: [
          {
            id: 'line-en-1',
            startTime: 2.0,
            endTime: 5.5,
            text: 'Walking through the city',
            syllables: [
              { text: 'Wal', startTime: 2.0, duration: 0.45 },
              { text: 'king ', startTime: 2.45, duration: 0.4 },
              { text: 'through ', startTime: 2.85, duration: 0.45 },
              { text: 'the ', startTime: 3.3, duration: 0.35 },
              { text: 'ci', startTime: 3.65, duration: 0.45 },
              { text: 'ty', startTime: 4.1, duration: 0.8 }
            ]
          },
          {
            id: 'line-en-2',
            startTime: 6.0,
            endTime: 9.8,
            text: 'Under the bright sunlight',
            syllables: [
              { text: 'Un', startTime: 6.0, duration: 0.35 },
              { text: 'der ', startTime: 6.35, duration: 0.35 },
              { text: 'the ', startTime: 6.7, duration: 0.3 },
              { text: 'bright ', startTime: 7.0, duration: 0.5 },
              { text: 'sun', startTime: 7.5, duration: 0.45 },
              { text: 'light', startTime: 7.95, duration: 0.8 }
            ]
          },
          {
            id: 'line-en-3',
            startTime: 10.5,
            endTime: 14.0,
            text: 'Every step is freedom',
            syllables: [
              { text: 'Ev', startTime: 10.5, duration: 0.35 },
              { text: 'ery ', startTime: 10.85, duration: 0.35 },
              { text: 'step ', startTime: 11.2, duration: 0.45 },
              { text: 'is ', startTime: 11.65, duration: 0.35 },
              { text: 'free', startTime: 12.0, duration: 0.5 },
              { text: 'dom', startTime: 12.5, duration: 0.7 }
            ]
          },
          {
            id: 'line-en-4',
            startTime: 14.5,
            endTime: 18.5,
            text: 'Feeling the rhythm moving forward',
            syllables: [
              { text: 'Fee', startTime: 14.5, duration: 0.4 },
              { text: 'ling ', startTime: 14.9, duration: 0.35 },
              { text: 'the ', startTime: 15.25, duration: 0.35 },
              { text: 'rhy', startTime: 15.6, duration: 0.4 },
              { text: 'thm ', startTime: 16.0, duration: 0.35 },
              { text: 'mo', startTime: 16.35, duration: 0.35 },
              { text: 'ving ', startTime: 16.7, duration: 0.35 },
              { text: 'for', startTime: 17.05, duration: 0.4 },
              { text: 'ward', startTime: 17.45, duration: 0.7 }
            ]
          },
          {
            id: 'line-en-5',
            startTime: 19.5,
            endTime: 23.5,
            text: 'The lights are about to wake up',
            syllables: [
              { text: 'The ', startTime: 19.5, duration: 0.35 },
              { text: 'lights ', startTime: 19.85, duration: 0.45 },
              { text: 'are ', startTime: 20.3, duration: 0.3 },
              { text: 'a', startTime: 20.6, duration: 0.3 },
              { text: 'bout ', startTime: 20.9, duration: 0.35 },
              { text: 'to ', startTime: 21.25, duration: 0.3 },
              { text: 'wake ', startTime: 21.55, duration: 0.5 },
              { text: 'up', startTime: 22.05, duration: 0.8 }
            ]
          },
          {
            id: 'line-en-6',
            startTime: 24.0,
            endTime: 28.0,
            text: 'The night begins to bloom',
            syllables: [
              { text: 'The ', startTime: 24.0, duration: 0.35 },
              { text: 'night ', startTime: 24.35, duration: 0.45 },
              { text: 'be', startTime: 24.8, duration: 0.35 },
              { text: 'gins ', startTime: 25.15, duration: 0.4 },
              { text: 'to ', startTime: 25.55, duration: 0.3 },
              { text: 'bloom', startTime: 25.85, duration: 0.9 }
            ]
          },
          {
            id: 'line-en-7',
            startTime: 28.5,
            endTime: 32.5,
            text: 'An endless melody',
            syllables: [
              { text: 'An ', startTime: 28.5, duration: 0.35 },
              { text: 'end', startTime: 28.85, duration: 0.4 },
              { text: 'less ', startTime: 29.25, duration: 0.35 },
              { text: 'me', startTime: 29.6, duration: 0.35 },
              { text: 'lo', startTime: 29.95, duration: 0.4 },
              { text: 'dy', startTime: 30.35, duration: 0.85 }
            ]
          },
          {
            id: 'line-en-8',
            startTime: 33.0,
            endTime: 37.5,
            text: 'Accompanies us until sunrise',
            syllables: [
              { text: 'Ac', startTime: 33.0, duration: 0.3 },
              { text: 'com', startTime: 33.3, duration: 0.35 },
              { text: 'pa', startTime: 33.65, duration: 0.35 },
              { text: 'nies ', startTime: 34.0, duration: 0.4 },
              { text: 'us ', startTime: 34.4, duration: 0.35 },
              { text: 'un', startTime: 34.75, duration: 0.35 },
              { text: 'til ', startTime: 35.1, duration: 0.4 },
              { text: 'sun', startTime: 35.5, duration: 0.5 },
              { text: 'rise', startTime: 36.0, duration: 0.9 }
            ]
          }
        ]
      }
    ]
  },
  advanced: {
    enabled: false,
    effects: []
  }
}
