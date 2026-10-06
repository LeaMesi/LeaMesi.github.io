// Colección de iconos SVG minimalistas y geométricos para la interfaz
// Sustituyen los emojis con un diseño limpio, moderno y de bajo ruido visual

function createSvg(content, { size = 16, viewBox = '0 0 24 24', fill = 'none', stroke = 'currentColor', strokeWidth = 2, className = 'icon-svg' } = {}) {
  return `<svg class="${className}" width="${size}" height="${size}" viewBox="${viewBox}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`
}

export const iconPlus = createSvg(
  '<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'
)

export const iconEdit = createSvg(
  '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>'
)

export const iconSave = createSvg(
  '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline>'
)

export const iconTrash = createSvg(
  '<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>'
)

export const iconArrowLeft = createSvg(
  '<line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline>'
)

export const iconPlay = createSvg(
  '<polygon points="5 3 19 12 5 21 5 3"></polygon>',
  { fill: 'currentColor', stroke: 'none' }
)

export const iconPause = createSvg(
  '<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>',
  { fill: 'currentColor', stroke: 'none' }
)

export const iconMic = createSvg(
  '<path d="M 272.475 183.171 c 14.644 -4.42 28.075 -12.416 38.961 -23.291 c 36.362 -36.367 36.362 -95.527 0 -131.889 c -36.356 -36.367 -95.526 -36.365 -131.885 0 c -10.877 10.872 -18.902 24.328 -23.316 38.962 c -4.804 -0.654 -9.851 0.848 -13.533 4.536 c -6.277 6.276 -6.277 16.447 -0.002 22.719 l 8.887 8.888 L 9.109 259.25 c -10.64 10.64 -12.548 32.802 0.466 45.817 c -0.01 0.009 -0.575 -1.067 0.623 0.672 C 23 319 23 319 35.449 329.828 c 13.019 13.017 35.178 11.106 45.817 0.467 l 156.152 -142.479 l 8.884 8.882 c 6.27 6.273 16.442 6.277 22.726 0 C 271.632 193.029 273.13 187.979 272.475 183.171 z M 135.999 203.682 c -0.045 -0.042 -0.076 -0.09 -0.118 -0.132 c -0.041 -0.039 -0.088 -0.072 -0.129 -0.116 c -7.889 -7.89 -6.643 -21.93 2.778 -31.354 c 9.434 -9.428 23.47 -10.671 31.356 -2.778 c 0.037 0.04 0.071 0.087 0.111 0.128 c 0.04 0.04 0.087 0.073 0.128 0.114 c 7.895 7.886 6.65 21.922 -2.776 31.356 C 157.926 210.319 143.886 211.566 135.999 203.682 z M 270.287 164.148 c -14.167 -14.221 -72.036 -73.656 -94.567 -96.23 c 3.71 -9.945 9.563 -19.064 17.126 -26.625 c 29.028 -29.028 76.262 -29.028 105.295 0 c 29.022 29.024 29.024 76.254 -0.003 105.287 C 290.257 154.461 280.706 160.472 270.287 164.148 z"/>',
  { viewBox: "0 0 340 340", fill: 'currentColor', stroke: 'none' }
)

export const iconClock = createSvg(
  '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
  { size: 14 }
)

export const iconSearch = createSvg(
  '<circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>'
)

export const iconClose = createSvg(
  '<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>'
)

export const iconSettings = createSvg(
  '<circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>',
  { size: 14 }
)

export const iconChevronUp = createSvg(
  '<polyline points="18 15 12 9 6 15"></polyline>',
  { size: 13 }
)

export const iconChevronDown = createSvg(
  '<polyline points="6 9 12 15 18 9"></polyline>',
  { size: 13 }
)

export const iconUpload = createSvg(
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>'
)

export const iconDownload = createSvg(
  '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line>'
)

export const iconMusic = createSvg(
  '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
  { size: 40, strokeWidth: 1.5 }
)

export const iconFileText = createSvg(
  '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline>'
)

export const iconVolume = createSvg(
  '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>'
)

export const iconVolumeMute = createSvg(
  '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line>'
)

export const iconGlobe = createSvg(
  '<circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>'
)

export const iconLink = createSvg(
  '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>',
  { size: 14 }
)

export const iconMusicNote = createSvg(
  '<path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle>',
  { size: 14 }
)

export const iconPalette = createSvg(
  '<circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>',
  { size: 15 }
)

export const iconCheck = createSvg(
  '<polyline points="20 6 9 17 4 12"></polyline>',
  { size: 14 }
)

export const iconRotateCcw = createSvg(
  '<polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>',
  { size: 14 }
)

export const iconSparkles = createSvg(
  '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>',
  { size: 14 }
)

export const iconGrid = createSvg(
  '<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect>'
)

export const iconList = createSvg(
  '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>'
)

export const iconFolder = createSvg(
  '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>'
)

export const iconFolderPlus = createSvg(
  '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path><line x1="12" y1="11" x2="12" y2="17"></line><line x1="9" y1="14" x2="15" y2="14"></line>'
)

export const iconSkipBack = createSvg(
  '<polygon points="19 20 9 12 19 4 19 20"></polygon><line x1="5" y1="19" x2="5" y2="5"></line>'
)

export const iconSkipForward = createSvg(
  '<polygon points="5 4 15 12 5 20 5 4"></polygon><line x1="19" y1="5" x2="19" y2="19"></line>'
)

export const iconShuffle = createSvg(
  '<polyline points="16 3 21 3 21 8"></polyline><line x1="4" y1="20" x2="21" y2="3"></line><polyline points="21 16 21 21 16 21"></polyline><line x1="15" y1="15" x2="21" y2="21"></line><line x1="4" y1="4" x2="9" y2="9"></line>'
)

export const iconListMusic = createSvg(
  '<path d="M21 15V6"></path><path d="M18.5 18a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z"></path><path d="M12 12H3"></path><path d="M16 6H3"></path><path d="M12 18H3"></path>'
)

export const iconListPlus = createSvg(
  '<path d="M11 12H3"></path><path d="M16 6H3"></path><path d="M11 18H3"></path><path d="M18 9v6"></path><path d="M15 12h6"></path>'
)

export const iconEye = createSvg(
  '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
  { size: 14 }
)

export const iconMaximize = createSvg(
  '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>'
)

export const iconMinimize = createSvg(
  '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>'
)

export const iconYoutube = createSvg(
  '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon>'
)

export const iconCopy = createSvg(
  '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>',
  { size: 14 }
)







