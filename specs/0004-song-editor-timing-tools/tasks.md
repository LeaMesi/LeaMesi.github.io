# Tareas: Editor de Canciones y Herramientas de Tiempo
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0004-song-editor-timing-tools/spec.md)

---

## Tareas Completadas

- [x] **7.1. Vista y Controlador del Editor (`src/views/songEditorView.js`):**
  - Creación y edición con guardado directo en IndexedDB y botón "Probar en Modo Letra".
- [x] **7.2. Escritura por Frases y Tiempos:**
  - Agregar, reordenar, preescucha puntual e importación rápida de letra completa.
- [x] **7.3. Tiempos por Sílabas y Silabeo Automático:**
  - Separación fonética, chips de sílabas y distribución proporcional.
- [x] **7.4. Gestión Multilingüe en el Editor:**
  - Pestañas con designación de principal/traducción, clonación de tiempos y edición de metadatos de idioma.
- [x] **7.6. Normalización de Inputs Numéricos de Tiempo:**
  - Eliminación de flechas nativas y fondos blancos con `appearance: textfield`.
- [x] **7.7. Reloj Maestro en Vivo con Milisegundos:**
  - Actualización reactiva de reloj `mm:ss.mmm` con números tabulares sin desfases.
- [x] **10.1. Borrado de Sílabas por Frase Individual:**
  - Botón de vaciado de sílabas preservando texto y marcas de inicio/fin.
- [x] **10.2. Borrado Masivo de Sílabas con Confirmación Previa:**
  - Botón con confirmación obligatoria mediante `window.confirm` y contador dinámico.
- [x] **20.1. Reubicación y Optimización de la Barra Superior del Editor:**
  - Eliminación de la barra superior previa (`editor-header-bar`) y supresión del botón redundante "Guardar Canción".
  - Botón "Probar en Modo Letra" (`#btn-save-and-sing`) transformado en botón con solo icono (`${iconMic}`) ubicado a la derecha de los controles de tiempo en la barra del asistente de audio (`.editor-audio-assistant`).
  - Botones de respaldo individual (`#btn-editor-export-json` y `#btn-editor-export-yaml`) reubicados al final del acordeón "Metadatos Generales y Videos Asociados" (`#editor-metadata-details`), justo tras la gestión de videos asociados.
- [x] **7.9. Ponderación Fonética Inteligente en Tiempos de Sílabas (`src/lyrics/syllablesHelper.js`):**
  - Algoritmo `calculateSyllableWeight` que pondera diptongos/triptongos, acentuación tónica, apertura vocálica, codas consonánticas, cesuras y alargamiento de final de verso (phrase-final lengthening).
  - Actualización de `autoDistributeSyllables` con ponderación fonética por defecto y preservación de modo equitativo (`{ mode: 'equal' }`).
  - Integración en `src/views/songEditorView.js` (tooltips claros, mensajes de estado reactivos y distribución automática en silabeo y palabras).
- [x] **7.10. Guía de Referencia de Frase Original al Traducir (`src/views/songEditorView.js` y `src/style.css`):**
  - Visualización contextual de la frase original (texto original y texto alternativo/Romaji) en cada tarjeta de verso al editar idiomas de traducción.
  - Identificación explícita de versos vacíos como `⏸ [Pausa / Verso en blanco]` para evitar desfasajes y confusiones al traducir canciones con pausas instrumentales.
  - Selector general de visualización en la barra de herramientas con 4 modos: Ambos (Original y Alternativo), Solo texto original, Solo alternativo o Desactivado, con persistencia en `localStorage`.
  - Botón de copia directa (`Copiar`) para transferir el texto original al verso traducido en un clic.
- [x] **7.11. Traducción Automática y Gratuita de Canciones y Versos (`src/services/translationService.js`, `src/views/songEditorView.js` y `src/style.css`):**
  - Motor de traducción en cascada sin costo ni backend propio (Zero-Backend) combinando Unison API (por lote) y fallback neuronal a MyMemory API.
  - Decodificación automática de entidades HTML y preservación estricta de pausas instrumentales (versos en blanco).
  - Overlay de bloqueo visual centralizado con fondo oscurecido y desenfocado (`translation-loading-backdrop` y `translation-loading-dialog`) durante la traducción completa para prevenir acciones no deseadas del usuario.
  - Botón individual "Traducir" con indicador local "Traduciendo..." en la guía de referencia de cada verso.
  - Desactivación del silabeo automático en la traducción para preservar el texto traducido intacto con tiempos sin fragmentación silábica forzada.
  - Botón "Traducir Toda la Canción" en la barra de herramientas y estado vacío que procesa el tema completo respetando marcas de inicio/fin y pausas.
  - Opción de traducción automática al crear un nuevo idioma o pista de traducción en el modal del editor.
- [x] **20.2. Guardado Automático en Tiempo Real (Auto-Save):**
  - Persistencia automática en segundo plano de cualquier cambio realizado por el usuario: edición de versos, tiempos, metadatos, videos, sílabas, adición o eliminación de elementos, traducciones o herramientas masivas.
  - Guardado con debounce de 400ms en inputs de texto/números y guardado inmediato en eventos `change`/blur y acciones discretas.
  - Indicador visual no invasivo (`#editor-autosave-badge`) con animación de pulso y estados "Guardando...", "Guardado" y "Error al guardar".
  - Flusheo y persistencia garantizada al salir del editor desde el botón de retroceso (`#btn-header-back-menu` o `#brand-title`), al probar en Modo Letra o antes de descargar respaldos.
- [x] **20.3. Optimización de Pestañas y Modal de Configuración de Idiomas:**
  - Botón "Añadir Idioma / Traducción" reubicado desde el encabezado general a la barra de pestañas (`.editor-lang-tabs-bar`) como un botón compacto `+` (`.btn-add-lang-tab`).
  - Supresión definitiva de la barra intermedia `.active-lang-settings-bar`: la apertura del modal de configuración se dispara haciendo clic directamente en la pestaña del idioma activo (`.editor-lang-tab.active`).
  - Unificación de controles de idioma dentro del modal de configuración:
    - Botón "Hacer Principal" condicional: visible y funcional para idiomas secundarios, oculto si la pista ya es el idioma principal.
    - Botón "Eliminar Idioma" con protección: deshabilitado y bloqueado con tooltip explicativo si la pista es el idioma principal (`disabled`), habilitado con diálogo de confirmación para traducciones y secundarias.
- [x] **20.4. Desactivación de Edición de Sílabas en Traducciones:**
  - Edición de sílabas (`.btn-toggle-syllables`, `.phrase-syllables-panel`, `#btn-clear-all-syllables` y contador silábico) restringida con exclusividad al idioma principal (`isMain: true`).
  - Ocultamiento de herramientas y controles silábicos en la interfaz al editar idiomas secundarios/traducciones.
  - Supresión de casilla de división en sílabas en modal de importación rápida al encontrarse en una traducción y limpieza de array `syllables` en la persistencia de traducciones.
- [x] **20.5. Preservación de Posición de Scroll en el Editor:**
  - Captura y restauración automática e inmediata de `scrollTop` de `.editor-content-scroll`, `scrollLeft` de `.editor-lang-tabs-bar` y `window.scrollY` durante los ciclos de renderizado.
  - Al hacer clic en el botón "Sílabas" para mostrar o contraer el panel de sílabas de cualquier verso, la pantalla mantiene con total exactitud la posición en la que está sin saltos ni desplazamientos hacia arriba.
  - Supresión de `scroll-behavior: smooth` en `.editor-content-scroll` para evitar deslizamientos animados indeseados al alternar elementos dinámicos.
- [x] **20.6. Botón de Cierre "X" en Alertas del Editor y Limpieza al Navegar:**
  - Botón de descarte "X" (`#btn-close-editor-alert` / `.btn-close-alert`) para cerrar manualmente cualquier aviso de confirmación, guardado o exportación en el editor.
  - Método `clearStatus()` expuesto en la API del editor y auto-cierre automático al salir o cambiar de pantalla en `main.js`.
- [x] **20.7. Reorganización Ergonómica del Asistente de Audio Superior:**
  - Menú vertical emergente de volumen activado por icono de parlante (`iconVolume` / `iconVolumeMute`) con slider vertical y porcentaje, con cierre automático al hacer clic en cualquier otro lado (`documentClickListener`).
  - Barra de progreso interactiva con tiempo actual y duración total de la canción (`00:00 / 03:45`), sincronizada con el Master Clock en tiempo real y con capacidad de búsqueda (*seek*) interactiva al arrastrar.
  - Ubicación ergonómica: volumen y barra de progreso a la izquierda de los botones de transporte y reloj, y texto de estado de guardado automático ("Guardando..." / "Guardado") fijado y pegado al extremo derecho (`margin-left: auto`).
- [x] **20.8. Resaltado Reactivo de Verso y Sílaba Activa en el Editor:**
  - Detección en tiempo real de la posición de reproducción del asistente de audio (`updateClock` y scrubbing en barra de progreso).
  - Resaltado del contenedor de la tarjeta del verso activo (`.phrase-editor-card.is-active-phrase`) con borde distintivo y resplandor adaptados al color de la sílaba activa del tema visual configurado (`var(--lyrics-active-color)`), incluyendo badge `#` resaltado.
  - Resaltado en tiempo real del contenedor de la sílaba activa (`.syllable-edit-chip.is-active-syllable`) dentro del panel de sílabas expandido, cambiando el borde del chip al color de sílaba activa del tema (`var(--lyrics-active-color)`), con resplandor glow y badge `#` destacado.
  - Rendimiento óptimo en bucle RAF sin reflows innecesarios mediante comparación de conjuntos activos (`Set`), y sincronización reactiva al arrastrar el slider de progreso o al saltar en la pista.

---

## Tareas Pendientes / Por Hacer
- [ ] **7.8. Zoom en la línea de tiempo de frases:** Permitir ampliar o contraer la vista de versos para mayor comodidad en pantallas táctiles o teclados reducidos.
