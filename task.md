# Roadmap y Tareas de Desarrollo: SarangaBaranga (`proy-letras`)

> **Plan de Ejecución del Memory Bank**  
> Prioridad máxima actual: **Modo Sencillo / Básico**, **Persistencia Local en Navegador (IndexedDB)**, motor de **Exportación e Importación JSON**, soporte de **sílabas** y reproducción de audio (**YouTube / Audio Local**).

---

## Fase 0: Configuración para GitHub Pages y Entorno

- [x] **0.1. Compatibilidad con GitHub Pages:**
  - Crear [`vite.config.js`](file:///home/hezztia/Documents/SarangaBaranga/vite.config.js) configurando `base: './'` para asegurar que las rutas a los bundles y assets sean relativas en `usuario.github.io`.
- [x] **0.2. Entorno y Repositorio Git:**
  - Configurar `.gitignore` para dependencias y builds (.env, .env.local).
  - Creado `.env.example` reservado para futuro catálogo remoto Supabase.

---

## Fase 1: Esquema de Datos Modular, Paquete JSON y Demostración

- [x] **1.1. Modelo Conceptual Relacional Diseñado:**
  - Esquema estructurado y normalizado (`artists`, `songs`, `tags`, `genres`, `song_tags`, `song_genres`).
  - Separación modular de `metadata`, `basic` (`lyrics_data`) y `advanced` (`visuals_data`).
- [x] **1.2. Definición de Schemas JSON para Validación e Intercambio:**
  - Definido esquema y validadores en `src/services/schemaValidator.js` para el paquete de intercambio `song-package.json`:
    - `metadata`: Título, artista, géneros, tags, URLs de YouTube, ruta/enlace de audio.
    - `basic` / `lyrics_data`: Timing (BPM / compás / timestamps), colección multilingüe `languages` (idioma principal con `isMain: true` y traducciones ilimitadas con `isMain: false`), líneas sincronizadas, desglose de sílabas/palabras y estilos visuales.
    - `advanced` / `visuals_data`: Efectos de fondo, disparadores temporales y animaciones.
- [x] **1.3. Especificación de Compatibilidad con Estándar `lyricsfile`:**
  - Esquema y validador de interoperabilidad con la especificación YAML 1.0 en `src/services/lyricsfileService.js`.
  - Mapeo bidireccional de metadatos, marcas temporales (milisegundos <-> segundos) y palabras sincronizadas (`words` <-> `syllables`).
- [x] **1.4. Canción de Demostración Local Multilingüe:**
  - Creado `src/data/mockSong.js` con idioma original (Español) y traducción sincronizada (Inglés) para sembrar la base de datos local en la primera carga.

---

## Fase 2: Capa de Persistencia Local (IndexedDB) y Compartición (Import/Export)

- [x] **2.1. Adaptador de Base de Datos Local (`src/services/db.js`):**
  - Implementada inicialización de IndexedDB (`SarangaDB`) con Object Stores (`songs`, `artists`, `tags`, `genres`, `song_tags`, `song_genres`) e índices correspondientes.
  - Función de sembrado inicial (seed) con la canción demo mock si la base de datos está vacía.
- [x] **2.2. Repositorio de Canciones (`src/services/songService.js`):**
  - Implementados métodos CRUD locales con resolución lógica de relaciones (joins):
    - `fetchSongById(id)` (une canción con artista, tags y géneros).
    - `saveSong(songData)` (crea o actualiza canción y sus relaciones).
    - `listSongs()` (listado ordenado para la biblioteca local).
    - `deleteSong(id)` (eliminación con limpieza de relaciones).
    - `addTranslationToSong(id, translation)` (agrega pista de idioma).
- [x] **2.3. Motor de Exportación e Importación JSON (`src/services/shareService.js`):**
  - `exportSongPackage(songId)`: Generar y descargar archivo JSON estructurado con soporte multilingüe completo (`languages`).
  - `importSongPackage(jsonFileOrData)`: Validar estructura JSON, normalizar versiones monoidioma anteriores si fuese necesario, insertar entidades en IndexedDB y devolver la canción importada.
  - `exportLibraryBackup()` / `importLibraryBackup()`: Respaldo y restauración completa de la biblioteca local.
- [x] **2.4. Adaptador de Estándar `lyricsfile` (`src/services/lyricsfileService.js`):**
  - Parser seguro para archivos `.lyricsfile.yaml` (validación de versión 1.0 y campos requeridos).
  - Conversor de formato: `start_ms`/`end_ms` a segundos decimales y reconstrucción de `syllables` preservando espaciado de `words`.
  - Serializador inverso para exportar cualquier idioma a `.lyricsfile.yaml`.
  - Flujo de importación como nueva canción (`isMain: true`) o incorporación como traducción a canción existente (`isMain: false`).
- [ ] **2.5. (Futuro / Pospuesto) Conector Supabase Read-Only (`src/services/supabaseCatalog.js`):**
  - Conexión opcional de sólo lectura para consultar catálogo oficial administrado por el creador y clonar canciones a la base de datos local.

---

## Fase 3: Reproductor de Audio y Reloj Maestro

- [x] **3.1. Adaptador Multimedia Híbrido (`src/player/mediaPlayer.js`):**
  - **Canal YouTube:** Soporte para YouTube IFrame API (alternando entre video oficial y solo pista conservando `currentTime`).
  - **Canal Audio HTML5 / Local:** Soporte para elemento `<audio>` nativo (Blob local o URL remota de audio).
  - Exponer interfaz unificada: `play()`, `pause()`, `seek(time)`, `getCurrentTime()`, `setTrackType(trackType)`.
- [x] **3.2. Emisor de Tiempo (Master Clock Bridge):**
  - Bucle con `requestAnimationFrame` que consulta el tiempo de reproducción y despacha eventos a la capa de sincronización de letras cuando está activo.

---

## Fase 4: Modo Sencillo / Básico (Letra, Sílabas y Traducciones)

- [x] **4.1. Calculador de Tiempos y BPM (`src/lyrics/timing.js`):**
  - Soporte para sincronización por segundos absolutos, cálculo musical por BPM y formateo mm:ss.
- [x] **4.2. Gestor de Idiomas y Traducciones (`src/lyrics/languageManager.js`):**
  - Módulo encargado de gestionar el idioma principal, las traducciones disponibles y la selección activa del usuario.
- [x] **4.3. Motor de Sincronización Multilingüe (`src/lyrics/sync.js`):**
  - Algoritmo que identifica en tiempo real la línea activa y la sílaba en curso (`upcoming`, `active`, `completed`) para el idioma seleccionado.
  - Sincronización paralela para visualización dual (emparejamiento temporal entre idioma principal y traducción activa).
- [x] **4.4. Componente de Visualización Enfocado (`src/views/basicViewer.js`):**
  - Frase actual centrada vertical y horizontalmente en el escenario principal con tamaño completo, animación de entrada y letra suelta (sin cajas, fondos ni bordes opacos).
  - Frases siguientes (0 a 3 configurables, admitiendo modo solo frase actual sin letras siguientes) renderizadas directamente debajo a escala reducida (~70%), colores más apagados/atenuados y presentación suelta sin contenedor visible.
  - Clic en frases siguientes para salto temporal interactivo (Seek).
- [x] **4.5. Resaltado Fiel de Sílabas y Palabras sin Espacios Extra:**
  - Desglose contiguo (`join('')` sin saltos de línea ni espaciado espurio en template literals).
  - Estilos inline con preservación de espacios tipográficos estándar (`white-space: pre-wrap;`) y eliminación de deformaciones de escala (`transform: scale`).
  - Resaltado limpio con color activo (`--text-active`) y brillo (`text-shadow`).
- [x] **4.6. Gestión de Idioma Original y Subtítulo de Traducción en Cursiva:**
  - Garantizar que la frase cantada principal sea siempre el idioma original (`isMain: true`).
  - Selector de traducción opcional en la barra de controles (`(Sin traducción)` o idiomas secundarios).
  - Renderizado del subtítulo traducido directamente debajo de la frase en estilo cursiva (`font-style: italic`) y color `--translation-color`.
- [x] **4.7. Personalización de Estilo Básico:**
  - Inyección dinámica de las propiedades de estilo definidas en `lyrics_data.styles` (`--text-inactive`, `--text-active`, `--translation-color`, `--bg-color`).

---

## Fase 5: Shell de la Aplicación, Biblioteca y Controles

- [x] **5.1. Barra de Herramientas y Controles (`src/views/controlsView.js`):**
  - Selector de modo: **Modo Sencillo** vs **Modo Avanzado**.
  - Conmutador de pista: **🎤 Oficial** vs **🎹 Solo Pista (Instrumental)**.
  - Selector de idioma en tiempo real (idioma principal y lista de traducciones disponibles).
  - Interruptor para activar/desactivar subtitulado bilingüe simultáneo.
  - Barra de progreso interactiva para saltar a partes de la canción (Seek).
- [x] **5.2. Panel de Biblioteca y Compartición (`src/views/libraryView.js`):**
- [x] **5.3. Menú Principal de Selección de Canciones (`src/views/songMenuView.js`):**
  - Pantalla principal de inicio con listado y filtrado en tiempo real de canciones locales.
  - Tarjetas de canción con información de títulos, artistas, idiomas, etiquetas y conteo de videos asociados.
  - Botón de acción destacado "🎤 Entrar a Modo Letra" para cargar e ingresar al visor de letras.
  - Navegación bidireccional: botón "← Menú de Canciones" en el encabezado y en los controles para retornar desde Modo Letra.
- [x] **5.4. Video de YouTube Invisible (Audio-Only):**
  - Host de YouTube desacoplado visualmente de la página (`position: fixed; top: -9999px; left: -9999px; opacity: 0; pointer-events: none;`), reproduciendo audio sin mostrar el video en el DOM.
- [x] **5.5. Soporte Multi-Video Dinámico con Offset (`src/views/videoManagerModal.js`):**
  - Superación del modelo estático de 2 pistas: cualquier canción puede asociar N videos de YouTube.
  - Cada video incluye `name`, `url` y `offset` numérico en segundos.
  - Sincronización precisa de letra: $\tau_{\text{letra}} = t_{\text{video}} - \text{offset}$ en reproducción y saltos (seek).
  - Modal interactivo para agregar, renombrar, ajustar offsets y remover videos asociados.
  - Selector dinámico de videos en la barra de controles con indicación de offset y conmutación fluida.

---

## Fase 6: Modo Avanzado (Pospuesto para Segunda Etapa)

- [x] **6.1. Integración de Escenario de Fondo:**
  - Canvas interactivo (`src/views/advancedViewer.js`) montado condicionalmente sin sobrecargar el Modo Básico.
- [ ] **6.2. Intérprete Completo de Efectos (`visuals_data`):**
  - Leer la línea de tiempo de `visuals_data.effects` y disparar transiciones de color, formas geométricas y overlays de GIFs en timestamps específicos.

---

## Fase 7: Menú y Editor de Creación y Edición de Letras

- [x] **7.1. Vista y Controlador del Editor (`src/views/songEditorView.js`):**
  - Creación de canciones desde cero y edición de canciones existentes en IndexedDB.
  - Gestión de metadatos (título, artista, géneros, etiquetas) y colección dinámica de videos de YouTube con offsets.
  - Asistente de audio en vivo sincronizado con el reproductor para capturar marcas de tiempo (`⏱️`) sobre la marcha.
  - Guardado directo en IndexedDB y botón "🎤 Probar en Modo Letra" para verificar inmediatamente.
- [x] **7.2. Escritura por Frases y Tiempos:**
  - Agregar, editar, reordenar y eliminar versos/frases.
  - Configurar marcas de tiempo de inicio (`startTime`) y fin (`endTime`) para cada verso con preescucha de audio puntual.
  - Modal de importación rápida de letra completa para generar versos y pausas a partir de texto plano en segundos.
- [x] **7.3. Tiempos por Sílabas y Silabeo Automático (`src/lyrics/syllablesHelper.js`):**
  - Motor fonético de separación silábica en español (con soporte de guiones explícitos o palabras con espacios preservados).
  - Configuración individual de `startTime` y `duration` por cada sílaba con botones de captura en vivo.
  - Algoritmo de auto-distribución proporcional de tiempos entre sílabas en el intervalo de la frase.
- [x] **7.4. Gestión Multilingüe en el Editor:**
  - Sistema de pestañas de idiomas con indicador de idioma principal (`isMain: true`) y traducciones (`isMain: false`).
  - Creación de nuevos idiomas con opción de clonar las marcas de tiempo del idioma original para facilitar traducciones.
  - Conmutación, eliminación y edición interactiva de nombre y código ISO haciendo clic sobre la pestaña o badge del idioma activo.
- [x] **7.5. Puntos de Entrada y Navegación:**
  - Botón "Crear Canción" en el Menú de Selección de Canciones (`src/views/songMenuView.js`).
  - Botón "Editar Letra" en cada tarjeta de canción de la biblioteca.
  - Botón "Editar" en la barra inferior de controles de Modo Letra (`src/views/controlsView.js`).
- [x] **7.6. Normalización de Inputs Numéricos de Tiempo:**
  - Eliminación de flechas nativas y fondos blancos invasivos en inputs numéricos del editor mediante `appearance: textfield` y `-webkit-appearance: none`.
  - Espaciado amplio y fidedigno para lectura de números decimales, conservando el ajuste por teclado (Up/Down) y captura instantánea por reloj.
- [x] **7.7. Reloj Maestro en Vivo con Milisegundos de Alta Precisión:**
  - Inicio instantáneo del bucle de reloj con `requestAnimationFrame` al pulsar Reproducir en `mediaPlayer.play()`, evitando bloqueos por estados transitorios `BUFFERING` de YouTube.
  - Soporte de 3 dígitos de milisegundos en `formatTime` (`src/lyrics/timing.js`) con cálculo entero mediante `Math.round(seconds * 1000)`.
  - Actualización en vivo de `#assistant-clock-time` en `src/views/songEditorView.js` en formato `mm:ss.mmm`, estilizado con `font-variant-numeric: tabular-nums` y ancho fijo en `src/style.css` para evitar vibración de layout.

---

## Fase 8: Refactorización Visual - Sistema de Iconos SVG Minimalistas

- [x] **8.1. Biblioteca de Iconos SVG Vectoriales (`src/views/icons.js`):**
  - Creación de iconos SVG limpios, accesibles y con `stroke="currentColor"`.
  - Iconos disponibles: `iconPlus`, `iconEdit`, `iconSave`, `iconTrash`, `iconArrowLeft`, `iconPlay`, `iconPause`, `iconMic`, `iconClock`, `iconSearch`, `iconClose`, `iconSettings`, `iconChevronUp`, `iconChevronDown`, `iconUpload`, `iconDownload`, `iconMusic`, `iconFileText`.
- [x] **8.2. Eliminación de Ruido Visual y Emojis Decorativos:**
  - Supresión de emojis en títulos, encabezados, acordeones, dropzones y badges informativos.
  - Restricción de iconos estrictamente a zonas funcionales interactivas (crear, editar, retroceder, guardar, reproducir/pausa, capturar tiempos, expandir/contraer).
- [x] **8.3. Migración Completa de Vistas:**
  - `src/views/songMenuView.js`: Tarjetas de canciones, buscador, botón crear y modal dropzone limpios.
  - `src/views/songEditorView.js`: Encabezado, asistente de audio, pestañas de idiomas, cuadrícula de frases, edición de sílabas y modales.
  - `src/views/controlsView.js`: Botón play/pause con SVG dinámico, selector de pista y retroceso.
  - `src/views/videoManagerModal.js`: Lista de videos, offset informativo y botones de acción.
  - `src/views/libraryView.js`: Listado local, exportación/importación y respaldo.
  - `src/main.js`: Botones globales de navegación y retorno.
- [x] **8.4. Verificación de Compilación y Estilos:**
  - Integración de reglas `.icon-svg` y alineaciones en `src/style.css`.
  - Validación de compilación exitosa con `npm run build`.
- [x] **8.5. Centrado Geométrico del Encabezado Global:**
  - Ajuste en `src/style.css` para que `.song-header-info` (título de menú o canción y artista) quede centrado de forma absoluta al 50% de la pantalla, evitando el desfase producido por la asimetría entre la marca (`.brand-section`) y las acciones (`.header-actions`).
  - Truncado con puntos suspensivos (`ellipsis`) en títulos largos y adaptación a 2 filas en pantallas pequeñas (<= 800px).

---

## Fase 9: Integración de BetterLyrics, Control de Volumen y Soporte YouTube Music

- [x] **9.1. Compatibilidad Universal con YouTube Music (`music.youtube.com`):**
  - Actualizado `extractYouTubeVideoId` en `src/player/mediaPlayer.js` con soporte para `music.youtube.com`, `youtube.com/shorts/`, `youtu.be` y parámetros de consulta (`&si=`, `&list=`).
  - Actualizados placeholders, etiquetas y textos de ayuda en `src/views/videoManagerModal.js` y `src/views/songEditorView.js`.
- [x] **9.2. Control Deslizante (Slider) de Volumen y Mute en Modo Canción:**
  - Añadido soporte de volumen en `src/player/mediaPlayer.js` (`setVolume`, `getVolume`) controlando tanto `ytPlayer.setVolume(0-100)` como `audioElement.volume (0.0-1.0)`.
  - Persistencia del volumen preferido del usuario en `localStorage` (`saranga_player_volume`).
  - Incorporados nuevos iconos SVG `iconVolume` e `iconVolumeMute` en `src/views/icons.js`.
  - Integrado control deslizante (`.volume-slider`) y botón toggle de silencio en `src/views/controlsView.js`, con estilos responsivos en `src/style.css`.
- [x] **9.3. Servicio de Integración BetterLyrics y Unison (`src/services/betterLyricsService.js`):**
  - Implementado cliente HTTP para búsqueda pública de canciones en `https://unison.boidu.dev/lyrics/search?q={query}`.
  - Implementada obtención de cuerpo lírico completo por ID o videoId (`https://unison.boidu.dev/lyrics/:id` y fallback a `https://api.betterlyrics.org/getLyrics`).
  - Implementado parser nativo de TTML (XML) a la estructura multilingüe de SarangaBaranga (`lines` con marcas de inicio/fin y `syllables` con duraciones).
  - Implementado parser de LRC con asignación fonética automática de sílabas (`syllablesHelper.js`) para canciones sincronizadas sólo por líneas.
  - Integrada traducción automática en tiempo real vía `POST https://unison.boidu.dev/translate` para generar pestañas de traducción secundaria instantáneas.
- [x] **9.4. Modal de Búsqueda BetterLyrics y Flujo al Editor (`src/views/betterLyricsModal.js`):**
  - Creado modal interactivo con buscador de canciones, listado de resultados con badges de formato (`TTML Silábico` vs `LRC`) y selector de traducción complementaria.
  - Añadido botón de acceso rápido en el menú principal (`src/views/songMenuView.js`) junto al botón "Crear Canción".
  - Al seleccionar un resultado, convierte la letra y tiempos, asocia el video de YouTube/YouTube Music y transfiere el paquete al editor (`src/views/songEditorView.js`) con todos los campos preconfigurados para revisión y guardado local en IndexedDB.

---

## Fase 10: Herramientas de Edición y Borrado de Sílabas en el Editor

- [x] **10.1. Borrado de Sílabas por Frase Individual (`src/views/songEditorView.js`):**
  - Incorporado botón `${iconTrash} Sílabas` en el encabezado de cada tarjeta de frase (`.phrase-actions`, visible cuando la frase posee sílabas).
  - Incorporado botón `${iconTrash} Borrar Sílabas` dentro del panel expandido (`.syllables-quick-actions`, deshabilitado si no hay sílabas).
  - Vaciado instantáneo del array `line.syllables = []`, preservando texto de la frase y marcas de inicio/fin (`startTime`, `endTime`), con notificación y re-renderizado reactivo.
- [x] **10.2. Borrado Masivo de Sílabas en Todas las Frases con Confirmación Previa:**
  - Añadido botón `${iconTrash} Borrar Todas las Sílabas` (`#btn-clear-all-syllables`) en la barra de herramientas superior de frases (`.phrases-toolbar`) y al pie de la lista (`.phrases-footer-actions`).
  - Cálculo de total de sílabas (`totalSylCount`) y badge numérico en vivo (`.phrases-syl-count`). Deshabilitado automáticamente si el conteo es 0.
  - Diálogo de confirmación obligatorio mediante `window.confirm`, informando explícitamente el idioma y la cantidad exacta de versos y sílabas que se vaciarán antes de ejecutar la acción destructiva.
- [x] **10.3. Estilos y Estados Visuales (`src/style.css`):**
  - Reglas para botones deshabilitados (`.btn:disabled`, `.btn[disabled]`) con opacidad atenuada, cursor `not-allowed` y bloqueo de eventos.
  - Badge estilizado para conteo silábico de la pista activa (`.phrases-syl-count`).

---

## Fase 11: Búsqueda Exhaustiva y Multi-Modo en BetterLyrics

- [x] **11.1. Motor de Búsqueda Multi-Modo en el Servicio (`src/services/betterLyricsService.js`):**
  - Implementado algoritmo de coincidencia de artista con alta fidelidad (`isArtistMatch`) que maneja colaboraciones (`feat.`, `ft.`, `&`, `with`, `x`), artículos (`The`) y normalización diacrítica/acentos.
  - Búsqueda **Solo por Artista**: Consulta la API y aplica un filtro estricto garantizando que el 100% de los resultados pertenezcan exclusivamente al artista buscado o sus colaboraciones directas.
  - Búsqueda **Artista y Título**: Coincidencia exacta mediante `GET /lyrics/search?song=...&artist=...` combinada con fallback inteligente priorizando coincidencias duales de título y artista.
  - Búsqueda **Video / Enlace YouTube**: Detección y extracción automática de Video ID o URL (YouTube / YouTube Music) y consulta directa a `GET /lyrics?v=...` y `GET /lyrics/variants/...`.
  - Búsqueda **General**: Búsqueda rápida por texto libre con soporte de sugerencias.
- [x] **11.2. Interfaz Avanzada con Pestañas y Filtros (`src/views/betterLyricsModal.js`):**
  - Pestañas de modo de búsqueda: *General*, *Solo por Artista*, *Artista y Título* y *Enlace / Video ID*.
  - Inputs dinámicos según el modo: input simple, input dual de artista + canción o input de enlace con auto-focus reactivo.
  - Toggle de filtro estricto de artista (`#bl-check-strict`).
  - Pills de filtro por tipo de sincronización (*Todas*, *✨ Sílabas / RichSync*, *📝 Por Versos / LRC*) con re-filtrado en tiempo real.
  - Resumen cuantitativo y badges de *Artista Verificado* en las tarjetas de resultados.
- [x] **11.3. Estilos Responsivos y Nuevos Iconos SVG (`src/style.css`, `src/views/icons.js`):**
  - Nuevos iconos SVG `iconLink` e `iconMusicNote`.
  - Estilos de pestañas `.bl-mode-tab`, cuadrícula dual `.bl-dual-inputs-grid`, pills de filtro `.bl-filter-pill` y badge `.badge-verified`, adaptados para escritorio y móviles.

---

## Fase 12: Configuración de Usuario para Temas, Escala y Personalización de Letras

- [x] **12.1. Servicio de Temas y Persistencia (`src/services/themeService.js`):**
  - Módulo desacoplado para almacenar y sincronizar preferencias en `localStorage` (`saranga_theme_settings`).
  - Motor de inyección dinámica de variables CSS en `:root` (`--bg-color`, `--panel-bg`, `--primary-color`, `--text-main`, `--lyrics-scale`, `--translation-scale`, `--lyrics-original-color`, `--translation-color`, `--lyrics-active-color`, estilos y resplandores).
  - Cálculo automático de contrastes y brillo de acentos (`getContrastColor`, `adjustBrightness`, `hexToRgba`).
  - Catálogo de 5 temas predefinidos (*Predeterminado Oscuro*, *Cyberpunk Neón*, *Bosque Esmeralda*, *Atardecer Cálido*, *Minimalista Claro*), más detección de tema personalizado y restauración de fábrica.
- [x] **12.2. Modal Interactivo de Configuración de Temas (`src/views/themeSettingsModal.js`):**
  - Selector de los 4 colores base de la interfaz (Fondo, Barras/Paneles, Botones/Acentos y Texto) con entradas duales (selector cromático nativo + texto hexadecimal sincronizado).
  - Controles deslizantes independientes (sliders de 50% a 200%) para la escala de la letra original y la letra de traducciones con indicador numérico en tiempo real.
  - Opciones de color y tipografía para la letra original, traducciones y seguimiento de sílabas (conmutadores para Negrita, Cursiva y Efecto de Brillo/Glow).
  - Escenario interactivo de previsualización en vivo (`#theme-live-preview-box`) con actualización instantánea al manipular cualquier parámetro.
- [x] **12.3. Puntos de Entrada y Conexión en la Aplicación (`src/main.js`, `src/views/controlsView.js`, `src/views/basicViewer.js`):**
  - Botón de acceso global `${iconPalette} Temas` en el encabezado de la aplicación (`.header-actions`), accesible en todo momento (Menú, Modo Letra y Editor).
  - Botón directo `${iconPalette} Temas` en la barra inferior de controles de Modo Canción (`controlsDock`).
  - Adaptación de `basicViewer.js` para respetar de forma permanente las preferencias y el tema del usuario sobre los estilos estáticos de las canciones.
- [x] **12.4. Estilos y Nuevos Iconos SVG (`src/style.css`, `src/views/icons.js`):**
  - Nuevos iconos SVG `iconPalette`, `iconCheck` e `iconRotateCcw`.
  - Estilos responsivos para el diálogo de temas, cuadrícula de colores, tarjetas de control, sliders y chips tipográficos.
- [x] **12.5. Importación y Exportación de Configuraciones de Tema (`src/services/themeService.js`, `src/views/themeSettingsModal.js`):**
  - Función `exportThemePackage()`: exporta el tema a `saranga-theme-settings.json` mediante descarga dinámica con `Blob`.
  - Función `importThemePackage()`: procesa archivos JSON (paquetes o configuraciones directas), valida campos y rangos, sanea datos, guarda en `localStorage` y actualiza la UI de inmediato.
  - Botones de exportar e importar integrados tanto en la cabecera de presets como en el pie del diálogo de configuración con alertas de estado.

---

## Fase 13: Modo Solo Frase Actual y Configuración Flexible de Previsualización (0 a 3 Frases)

- [x] **13.1. Soporte de 0 Frases Siguientes en el Motor de Renderizado (`src/views/basicViewer.js`):**
  - Actualizada la lógica de corte `currentLines.slice` y el estado interno `previewCount` para admitir de forma nativa `0`.
  - Renderizado condicional que omite completamente el contenedor `.upcoming-phrases-container` cuando `previewCount === 0`, asegurando que la frase activa se mantenga centrada en el escenario sin márgenes espurios.
- [x] **13.2. Selector Dinámico de Frases Siguientes con Opción "Ninguna (solo actual)" (`src/views/controlsView.js`):**
  - Incorporada la opción `<option value="0">Ninguna (solo actual)</option>` en el menú desplegable `#preview-lines-select`.
  - Normalización de parsing y eventos para evitar conversiones booleanas falsas (`0 || 2`), permitiendo seleccionar y conservar `0` sin saltar al valor por defecto.
- [x] **13.3. Persistencia Robusta de Preferencia de Previsualización (`src/main.js`):**
  - Ajustada la lectura inicial desde `localStorage` (`saranga_preview_lines`) con validación de valor no nulo (`savedPreviewLines !== null && !isNaN(Number(savedPreviewLines))`), preservando la preferencia `0` entre sesiones y recargas de página.
- [x] **13.4. Reglas CSS y Limpieza Estética (`src/style.css`):**
  - Incorporada regla `.upcoming-phrases-container:empty { display: none; margin: 0; }` para prevenir cualquier desfase vertical cuando no haya versos siguientes disponibles.






