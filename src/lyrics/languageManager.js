// Gestor de idiomas y modo bilingüe para letras multilingües

export function createLanguageManager(initialLanguages = []) {
  let languages = Array.isArray(initialLanguages) ? [...initialLanguages] : []
  let translationLanguageCode = null
  const listeners = []

  function setLanguages(newLanguages) {
    languages = Array.isArray(newLanguages) ? [...newLanguages] : []
    const translations = getTranslations()
    // Si hay traducciones, por defecto preseleccionamos la primera traducción disponible
    translationLanguageCode = translations[0]?.code || null
    notify()
  }

  function getMainLanguage() {
    return languages.find(l => l.isMain) || languages[0] || null
  }

  function getTranslations() {
    return languages.filter(l => !l.isMain)
  }

  function getAvailableLanguages() {
    return languages
  }

  function getActiveLanguage() {
    // El idioma original rige siempre la pista principal cantada
    return getMainLanguage()
  }

  function getTranslationLanguage() {
    if (!translationLanguageCode) return null
    return languages.find(l => l.code === translationLanguageCode && !l.isMain) || null
  }

  function setActiveLanguage(code) {
    // Mantenido por retrocompatibilidad; el idioma original siempre permanece activo
  }

  function setTranslationLanguage(code) {
    const nextCode = code && code.trim() ? code.trim() : null
    if (translationLanguageCode !== nextCode) {
      translationLanguageCode = nextCode
      notify()
    }
  }

  function setBilingual(active) {
    if (!active) {
      setTranslationLanguage(null)
    } else {
      const translations = getTranslations()
      if (translations.length > 0 && !translationLanguageCode) {
        setTranslationLanguage(translations[0].code)
      }
    }
  }

  function isBilingual() {
    return Boolean(getTranslationLanguage())
  }

  function subscribe(callback) {
    listeners.push(callback)
    return () => {
      const idx = listeners.indexOf(callback)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }

  function notify() {
    const mainLang = getMainLanguage()
    const transLang = getTranslationLanguage()
    const isTransActive = Boolean(transLang)

    listeners.forEach(cb => cb({
      mainLanguage: mainLang,
      activeLanguage: mainLang,
      translationLanguage: transLang,
      isBilingual: isTransActive,
      isTranslationActive: isTransActive,
      availableLanguages: languages,
      translations: getTranslations()
    }))
  }

  if (initialLanguages.length > 0) {
    setLanguages(initialLanguages)
  }

  return {
    setLanguages,
    getMainLanguage,
    getTranslations,
    getAvailableLanguages,
    getActiveLanguage,
    getTranslationLanguage,
    setActiveLanguage,
    setTranslationLanguage,
    setBilingual,
    isBilingual,
    subscribe
  }
}
