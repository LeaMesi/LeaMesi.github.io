// src/views/betterLyricsModal.js
// Re-exporta el modal interactivo de búsqueda online unificada
// (BetterLyrics, Genius, LRCLIB) para preservar compatibilidad con módulos existentes.

export {
  createOnlineLyricsModal,
  createOnlineLyricsModal as createBetterLyricsModal
} from './onlineLyricsModal.js'
