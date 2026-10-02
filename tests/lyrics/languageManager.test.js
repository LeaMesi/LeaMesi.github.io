import { describe, it, expect, vi } from 'vitest'
import { createLanguageManager } from '../../src/lyrics/languageManager.js'

describe('lyrics/languageManager.js', () => {
  const sampleLanguages = [
    { code: 'es', name: 'Español', isMain: true, lines: [] },
    { code: 'en', name: 'English', isMain: false, lines: [] },
    { code: 'pt', name: 'Português', isMain: false, lines: [] }
  ]

  it('inicializa correctamente con la lista de idiomas', () => {
    const manager = createLanguageManager(sampleLanguages)

    expect(manager.getMainLanguage()?.code).toBe('es')
    expect(manager.getActiveLanguage()?.code).toBe('es')
    expect(manager.getTranslations().map(t => t.code)).toEqual(['en', 'pt'])
    expect(manager.getAvailableLanguages().length).toBe(3)
  })

  it('preselecciona la primera traducción disponible por defecto', () => {
    const manager = createLanguageManager(sampleLanguages)
    expect(manager.getTranslationLanguage()?.code).toBe('en')
    expect(manager.isBilingual()).toBe(true)
  })

  it('permite alternar el idioma de traducción', () => {
    const manager = createLanguageManager(sampleLanguages)

    manager.setTranslationLanguage('pt')
    expect(manager.getTranslationLanguage()?.code).toBe('pt')

    manager.setTranslationLanguage(null)
    expect(manager.getTranslationLanguage()).toBeNull()
    expect(manager.isBilingual()).toBe(false)
  })

  it('permite activar y desactivar el modo bilingüe con setBilingual', () => {
    const manager = createLanguageManager(sampleLanguages)

    manager.setBilingual(false)
    expect(manager.isBilingual()).toBe(false)
    expect(manager.getTranslationLanguage()).toBeNull()

    manager.setBilingual(true)
    expect(manager.isBilingual()).toBe(true)
    expect(manager.getTranslationLanguage()?.code).toBe('en')
  })

  it('notifica a los suscriptores cuando cambian los idiomas o la traducción', () => {
    const manager = createLanguageManager([])
    const listener = vi.fn()

    const unsubscribe = manager.subscribe(listener)
    manager.setLanguages(sampleLanguages)

    expect(listener).toHaveBeenCalled()
    const lastCallArg = listener.mock.calls[listener.mock.calls.length - 1][0]
    expect(lastCallArg.mainLanguage?.code).toBe('es')
    expect(lastCallArg.isBilingual).toBe(true)

    unsubscribe()
    listener.mockClear()
    manager.setTranslationLanguage('pt')
    expect(listener).not.toHaveBeenCalled()
  })

  it('funciona adecuadamente cuando solo hay un idioma sin traducciones', () => {
    const monoLang = [{ code: 'es', name: 'Español', isMain: true, lines: [] }]
    const manager = createLanguageManager(monoLang)

    expect(manager.getMainLanguage()?.code).toBe('es')
    expect(manager.getTranslations()).toEqual([])
    expect(manager.getTranslationLanguage()).toBeNull()
    expect(manager.isBilingual()).toBe(false)
  })
})
