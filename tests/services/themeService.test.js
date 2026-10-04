import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  DEFAULT_THEME,
  THEME_PRESETS,
  hexToRgb,
  hexToRgba,
  getLuminance,
  getContrastColor,
  adjustBrightness,
  getThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  applyTheme,
  subscribeTheme,
  exportThemePackage,
  importThemePackage
} from '../../src/services/themeService.js'

describe('services/themeService.js', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  describe('utilidades cromáticas', () => {
    it('hexToRgb convierte valores de 6 y 3 dígitos', () => {
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 })
      expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 })
      expect(hexToRgb('invalido')).toEqual({ r: 0, g: 0, b: 0 })
    })

    it('hexToRgba retorna cadena rgba con canal alfa', () => {
      expect(hexToRgba('#ffffff', 0.5)).toBe('rgba(255, 255, 255, 0.5)')
    })

    it('getLuminance y getContrastColor calculan contraste adecuado', () => {
      // Blanco tiene luminancia alta -> contraste oscuro
      expect(getContrastColor('#ffffff')).toBe('#0f172a')
      // Negro tiene luminancia baja -> contraste claro
      expect(getContrastColor('#000000')).toBe('#ffffff')
    })

    it('adjustBrightness modifica el brillo del color', () => {
      const brighter = adjustBrightness('#101010', 50)
      expect(brighter).not.toBe('#101010')
    })
  })

  describe('gestión y persistencia de temas', () => {
    it('retorna DEFAULT_THEME cuando no hay configuración guardada', () => {
      const settings = getThemeSettings()
      expect(settings.bgColor).toBe(DEFAULT_THEME.bgColor)
      expect(settings.primaryColor).toBe(DEFAULT_THEME.primaryColor)
      expect(settings.lyricsScale).toBe(100)
    })

    it('guarda configuración personalizada en localStorage y aplica al DOM', () => {
      saveThemeSettings({
        bgColor: '#123456',
        lyricsScale: 150
      })

      const updated = getThemeSettings()
      expect(updated.bgColor).toBe('#123456')
      expect(updated.lyricsScale).toBe(150)

      // Verificar variables CSS en documentElement
      const rootStyle = document.documentElement.style
      expect(rootStyle.getPropertyValue('--bg-color')).toBe('#123456')
      expect(rootStyle.getPropertyValue('--lyrics-scale')).toBe('1.50')
      expect(rootStyle.getPropertyValue('--active-song-border')).toBeDefined()
      expect(rootStyle.getPropertyValue('--active-song-bg')).toBeDefined()
    })

    it('actualiza las variables CSS de resaltado de canción activa al cambiar de tema', () => {
      // Tema Cyberpunk (rosa)
      applyTheme(THEME_PRESETS.find(p => p.id === 'cyberpunk').settings)
      const rootStyle = document.documentElement.style
      expect(rootStyle.getPropertyValue('--active-song-border')).toBe('#ec4899')
      expect(rootStyle.getPropertyValue('--active-song-bg')).toContain('rgba(')

      // Tema Bosque Esmeralda (verde)
      applyTheme(THEME_PRESETS.find(p => p.id === 'emerald').settings)
      expect(rootStyle.getPropertyValue('--active-song-border')).toBe('#10b981')

      // Tema Minimalista Claro
      applyTheme(THEME_PRESETS.find(p => p.id === 'light').settings)
      expect(rootStyle.getPropertyValue('--active-song-border')).toBe('#4338ca')
    })

    it('resetThemeSettings restablece los valores de fábrica', () => {
      saveThemeSettings({ bgColor: '#ff0000' })
      expect(getThemeSettings().bgColor).toBe('#ff0000')

      resetThemeSettings()
      expect(getThemeSettings().bgColor).toBe(DEFAULT_THEME.bgColor)
    })

    it('subscribeTheme notifica a los oyentes de cambios de tema', () => {
      const listener = vi.fn()
      const unsubscribe = subscribeTheme(listener)

      saveThemeSettings({ primaryColor: '#00ff00' })
      expect(listener).toHaveBeenCalled()
      expect(listener.mock.calls[0][0].primaryColor).toBe('#00ff00')

      unsubscribe()
      listener.mockClear()
      saveThemeSettings({ primaryColor: '#0000ff' })
      expect(listener).not.toHaveBeenCalled()
    })
  })

  describe('exportación e importación de paquetes de tema', () => {
    it('exporta el tema actual como paquete JSON descargable', () => {
      const pkg = exportThemePackage()
      expect(pkg.type).toBe('saranga-theme-settings')
      expect(pkg.theme).toBeDefined()
      expect(pkg.theme.bgColor).toBe(DEFAULT_THEME.bgColor)
    })

    it('importa y sanea un paquete de tema válido', async () => {
      const themeData = {
        type: 'saranga-theme-settings',
        theme: {
          bgColor: '#001122',
          primaryColor: '#ff4400',
          lyricsScale: 250 // Supera 200, debe sanearse a 200
        }
      }

      const imported = await importThemePackage(JSON.stringify(themeData))
      expect(imported.bgColor).toBe('#001122')
      expect(imported.primaryColor).toBe('#ff4400')
      expect(imported.lyricsScale).toBe(200)
    })

    it('rechaza archivos que no contienen configuración de tema válida', async () => {
      await expect(importThemePackage('{"foo": "bar"}')).rejects.toThrow('El archivo no contiene una configuración de tema válida')
      await expect(importThemePackage('not-json')).rejects.toThrow('El archivo seleccionado no es un formato JSON válido')
    })
  })
})
