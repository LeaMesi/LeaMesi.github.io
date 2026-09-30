// src/services/themeService.js
// Servicio desacoplado para la gestión y persistencia de temas visuales,
// personalización de la interfaz en 4 colores y estilos de visualización de letras.

const STORAGE_KEY = 'saranga_theme_settings'

export const DEFAULT_THEME = {
  // 1. Colores de la Interfaz (4 colores principales)
  bgColor: '#0b0f19',
  panelBg: '#0f172a',
  primaryColor: '#6366f1',
  textMain: '#f8fafc',

  // 2. Modo Canción - Escala de tamaño (50% a 200%)
  lyricsScale: 100, // Slider 50 - 200 (%)
  translationScale: 100, // Slider 50 - 200 (%)

  // 3. Modo Canción - Colores y Estilos de Letra
  originalColor: '#cbd5e1',
  translationColor: '#38bdf8',
  activeColor: '#fbbf24',
  originalBold: true,
  originalItalic: false,
  translationBold: false,
  translationItalic: true,
  activeBold: true,
  activeItalic: false,
  activeGlow: true
}

export const THEME_PRESETS = [
  {
    id: 'default',
    name: 'Predeterminado Oscuro',
    settings: {
      bgColor: '#0b0f19',
      panelBg: '#0f172a',
      primaryColor: '#6366f1',
      textMain: '#f8fafc',
      lyricsScale: 100,
      translationScale: 100,
      originalColor: '#cbd5e1',
      translationColor: '#38bdf8',
      activeColor: '#fbbf24',
      originalBold: true,
      originalItalic: false,
      translationBold: false,
      translationItalic: true,
      activeBold: true,
      activeItalic: false,
      activeGlow: true
    }
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neón',
    settings: {
      bgColor: '#0a0518',
      panelBg: '#180e33',
      primaryColor: '#ec4899',
      textMain: '#fdf4ff',
      lyricsScale: 100,
      translationScale: 100,
      originalColor: '#c084fc',
      translationColor: '#22d3ee',
      activeColor: '#facc15',
      originalBold: true,
      originalItalic: false,
      translationBold: false,
      translationItalic: true,
      activeBold: true,
      activeItalic: false,
      activeGlow: true
    }
  },
  {
    id: 'emerald',
    name: 'Bosque Esmeralda',
    settings: {
      bgColor: '#051813',
      panelBg: '#0c2e25',
      primaryColor: '#10b981',
      textMain: '#ecfdf5',
      lyricsScale: 100,
      translationScale: 100,
      originalColor: '#a7f3d0',
      translationColor: '#38bdf8',
      activeColor: '#fde047',
      originalBold: true,
      originalItalic: false,
      translationBold: false,
      translationItalic: true,
      activeBold: true,
      activeItalic: false,
      activeGlow: true
    }
  },
  {
    id: 'sunset',
    name: 'Atardecer Cálido',
    settings: {
      bgColor: '#160909',
      panelBg: '#2a1111',
      primaryColor: '#f97316',
      textMain: '#fff7ed',
      lyricsScale: 100,
      translationScale: 100,
      originalColor: '#fed7aa',
      translationColor: '#fb7185',
      activeColor: '#fde047',
      originalBold: true,
      originalItalic: false,
      translationBold: false,
      translationItalic: true,
      activeBold: true,
      activeItalic: false,
      activeGlow: true
    }
  },
  {
    id: 'light',
    name: 'Minimalista Claro',
    settings: {
      bgColor: '#f1f5f9',
      panelBg: '#ffffff',
      primaryColor: '#4f46e5',
      textMain: '#0f172a',
      lyricsScale: 100,
      translationScale: 100,
      originalColor: '#475569',
      translationColor: '#0284c7',
      activeColor: '#d97706',
      originalBold: true,
      originalItalic: false,
      translationBold: false,
      translationItalic: true,
      activeBold: true,
      activeItalic: false,
      activeGlow: false
    }
  }
]

let listeners = []

// Utilidades cromáticas
export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return { r: 0, g: 0, b: 0 }
  let clean = hex.replace('#', '').trim()
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('')
  }
  const num = parseInt(clean, 16)
  if (isNaN(num) || clean.length !== 6) return { r: 0, g: 0, b: 0 }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  }
}

export function hexToRgba(hex, alpha = 1) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getLuminance(hex) {
  const { r, g, b } = hexToRgb(hex)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

export function getContrastColor(hex) {
  return getLuminance(hex) > 0.55 ? '#0f172a' : '#ffffff'
}

export function adjustBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex)
  const factor = 1 + percent / 100
  const clamp = v => Math.min(255, Math.max(0, Math.round(v * factor)))
  const toHex = v => v.toString(16).padStart(2, '0')
  return `#${toHex(clamp(r))}${toHex(clamp(g))}${toHex(clamp(b))}`
}

/**
 * Obtiene la configuración guardada o la predeterminada
 */
export function getThemeSettings() {
  if (typeof localStorage === 'undefined') return { ...DEFAULT_THEME }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_THEME }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_THEME, ...parsed }
  } catch (err) {
    console.warn('Error al leer temas de localStorage:', err)
    return { ...DEFAULT_THEME }
  }
}

/**
 * Guarda y aplica la configuración en el documento
 */
export function saveThemeSettings(newSettings) {
  try {
    const merged = { ...getThemeSettings(), ...newSettings }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
    }
    applyTheme(merged)
    notifyListeners(merged)
    return merged
  } catch (err) {
    console.error('Error al guardar tema:', err)
    return getThemeSettings()
  }
}

/**
 * Restablece la configuración a los valores por defecto
 */
export function resetThemeSettings() {
  localStorage.removeItem(STORAGE_KEY)
  const defaultTheme = { ...DEFAULT_THEME }
  applyTheme(defaultTheme)
  notifyListeners(defaultTheme)
  return defaultTheme
}

/**
 * Inyecta las variables CSS dinámicas en :root
 */
export function applyTheme(theme = getThemeSettings()) {
  if (typeof document === 'undefined') return
  const root = document.documentElement

  const {
    bgColor,
    panelBg,
    primaryColor,
    textMain,
    lyricsScale = 100,
    translationScale = 100,
    originalColor,
    translationColor,
    activeColor,
    originalBold,
    originalItalic,
    translationBold,
    translationItalic,
    activeBold,
    activeItalic,
    activeGlow
  } = theme

  // 1. Aplicación de los 4 colores de la Interfaz
  root.style.setProperty('--bg-color', bgColor)
  root.style.setProperty('--panel-bg', panelBg)

  const isLightPanel = getLuminance(panelBg) > 0.5
  const panelBorder = isLightPanel ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.08)'
  root.style.setProperty('--panel-border', panelBorder)

  root.style.setProperty('--primary-color', primaryColor)
  root.style.setProperty('--primary-hover', adjustBrightness(primaryColor, isLightPanel ? -15 : 15))
  root.style.setProperty('--primary-contrast', getContrastColor(primaryColor))

  root.style.setProperty('--text-main', textMain)
  const isLightText = getLuminance(textMain) > 0.5
  root.style.setProperty('--text-muted', hexToRgba(textMain, 0.65))
  root.style.setProperty('--text-inactive', hexToRgba(textMain, 0.45))

  // 2. Sliders de tamaño de fuentes (50% a 200%)
  const clampedLyricScale = Math.max(50, Math.min(200, Number(lyricsScale) || 100)) / 100
  const clampedTransScale = Math.max(50, Math.min(200, Number(translationScale) || 100)) / 100

  root.style.setProperty('--lyrics-scale', clampedLyricScale.toFixed(2))
  root.style.setProperty('--translation-scale', clampedTransScale.toFixed(2))
  root.style.setProperty('--lyrics-original-size', `calc(2.3rem * var(--lyrics-scale))`)
  root.style.setProperty('--lyrics-translation-size', `calc(1.265rem * var(--translation-scale))`)

  // 3. Colores de Letras y Seguimiento de Sílabas
  root.style.setProperty('--lyrics-original-color', originalColor || '#cbd5e1')
  root.style.setProperty('--translation-color', translationColor || '#38bdf8')
  root.style.setProperty('--lyrics-active-color', activeColor || '#fbbf24')
  root.style.setProperty('--text-active', activeColor || '#fbbf24')

  // 4. Estilos tipográficos y Efecto de Brillo (Glow)
  root.style.setProperty('--lyrics-original-font-weight', originalBold ? '700' : '400')
  root.style.setProperty('--lyrics-original-font-style', originalItalic ? 'italic' : 'normal')

  root.style.setProperty('--lyrics-translation-font-weight', translationBold ? '700' : '400')
  root.style.setProperty('--lyrics-translation-font-style', translationItalic ? 'italic' : 'normal')

  root.style.setProperty('--lyrics-active-font-weight', activeBold ? '700' : '400')
  root.style.setProperty('--lyrics-active-font-style', activeItalic ? 'italic' : 'normal')

  if (activeGlow) {
    const glowColor1 = hexToRgba(activeColor || '#fbbf24', 0.8)
    const glowColor2 = hexToRgba(activeColor || '#fbbf24', 0.45)
    root.style.setProperty('--lyrics-active-glow', `0 0 16px ${glowColor1}, 0 0 32px ${glowColor2}`)
  } else {
    root.style.setProperty('--lyrics-active-glow', 'none')
  }
}

/**
 * Suscribirse a cambios de tema
 */
export function subscribeTheme(callback) {
  if (typeof callback === 'function') {
    listeners.push(callback)
  }
  return () => {
    listeners = listeners.filter(fn => fn !== callback)
  }
}

function notifyListeners(theme) {
  listeners.forEach(fn => {
    try {
      fn(theme)
    } catch (e) {
      console.error('Error en listener de tema:', e)
    }
  })
}

function triggerDownload(content, filename, contentType = 'application/json') {
  if (typeof document === 'undefined') return
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

/**
 * Exporta la configuración del tema actual como archivo JSON descargable
 */
export function exportThemePackage() {
  const currentTheme = getThemeSettings()
  const pkg = {
    app: 'SarangaBaranga',
    type: 'saranga-theme-settings',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    theme: currentTheme
  }
  const jsonStr = JSON.stringify(pkg, null, 2)
  const filename = 'saranga-theme-settings.json'
  triggerDownload(jsonStr, filename)
  return pkg
}

/**
 * Importa y aplica una configuración de tema desde un archivo JSON o string
 */
export async function importThemePackage(fileOrString) {
  let jsonString = ''
  if (typeof fileOrString === 'string') {
    jsonString = fileOrString
  } else if (fileOrString instanceof Blob || fileOrString instanceof File) {
    jsonString = await fileOrString.text()
  } else if (typeof fileOrString === 'object' && fileOrString !== null) {
    jsonString = JSON.stringify(fileOrString)
  }

  let parsed
  try {
    parsed = JSON.parse(jsonString)
  } catch (err) {
    throw new Error('El archivo seleccionado no es un formato JSON válido.')
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('El archivo de tema no contiene un objeto válido.')
  }

  const rawTheme = (parsed.theme && typeof parsed.theme === 'object') ? parsed.theme : parsed

  const validKeys = [
    'bgColor', 'panelBg', 'primaryColor', 'textMain',
    'lyricsScale', 'translationScale',
    'originalColor', 'translationColor', 'activeColor',
    'originalBold', 'originalItalic', 'translationBold', 'translationItalic',
    'activeBold', 'activeItalic', 'activeGlow'
  ]

  const hasAnyKey = validKeys.some(key => key in rawTheme)
  if (!hasAnyKey) {
    throw new Error('El archivo no contiene una configuración de tema válida para SarangaBaranga.')
  }

  const cleanSettings = {}
  validKeys.forEach(key => {
    if (key in rawTheme) {
      cleanSettings[key] = rawTheme[key]
    }
  })

  if ('lyricsScale' in cleanSettings) {
    cleanSettings.lyricsScale = Math.max(50, Math.min(200, Number(cleanSettings.lyricsScale) || 100))
  }
  if ('translationScale' in cleanSettings) {
    cleanSettings.translationScale = Math.max(50, Math.min(200, Number(cleanSettings.translationScale) || 100))
  }

  const merged = saveThemeSettings(cleanSettings)
  return merged
}
