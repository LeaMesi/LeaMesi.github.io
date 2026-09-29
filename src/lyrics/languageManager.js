// Gestor de idiomas y modo bilingüe para letras multilingües

export function createLanguageManager(initialLanguages = []) {
  let languages = Array.isArray(initialLanguages) ? [...initialLanguages] : []
  let activeLanguageCode = null
  let translationLanguageCode = null
  let isBilingualActive = true
  const listeners = []

  function setLanguages(newLanguages) {
    languages = Array.isArray(newLanguages) ? [...newLanguages] : []
    const main = getMainLanguage()
    activeLanguageCode = main ? main.code : (languages[0]?.code || null)

    const translations = getTranslations()
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
    return languages.find(l => l.code === activeLanguageCode) || getMainLanguage()
  }

  function getTranslationLanguage() {
    return languages.find(l => l.code === translationLanguageCode) || getTranslations()[0] || null
  }

  function setActiveLanguage(code) {
    if (activeLanguageCode !== code) {
      activeLanguageCode = code
      notify()
    }
  }

  function setTranslationLanguage(code) {
    if (translationLanguageCode !== code) {
      translationLanguageCode = code
      notify()
    }
  }

  function setBilingual(active) {
    if (isBilingualActive !== active) {
      isBilingualActive = active
      notify()
    }
  }

  function isBilingual() {
    return isBilingualActive && getTranslations().length > 0 && activeLanguageCode !== translationLanguageCode
  }

  function subscribe(callback) {
    listeners.push(callback)
    return () => {
      const idx = listeners.indexOf(callback)
      if (idx >= 0) listeners.splice(idx, 1)
    }
  }

  function notify() {
    listeners.forEach(cb => cb({
      activeLanguage: getActiveLanguage(),
      translationLanguage: getTranslationLanguage(),
      isBilingual: isBilingual(),
      availableLanguages: languages
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
