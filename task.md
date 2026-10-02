# Roadmap y Tareas de Desarrollo: SarangaBaranga (`proy-letras`)

> **Plan de Ejecución del Memory Bank**  
> Prioridad máxima actual: **Modo Sencillo / Básico**, **Persistencia Local en Navegador (IndexedDB)**, motor de **Exportación e Importación JSON**, soporte de **sílabas** y reproducción de audio (**YouTube / Audio Local**).

---

## Fase 0: Configuración para GitHub Pages y Entorno

- [x] **0.1. Compatibilidad con GitHub Pages:**
  - Configurar [`vite.config.js`](file:///home/hezztia/Documents/SarangaBaranga/vite.config.js) con `base: '/'` adecuado para el repositorio y dominio de usuario raíz `LeaMesi.github.io`.
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
- [x] **1.4. Canciones por Defecto del Sistema Multilingües ("Still Alive" e "Idol"):**
  - Módulos `src/data/defaultSongs.js` y `src/data/mockSong.js` integrando los paquetes completos desde `still_alive.json` (Portal / Aperture Science, inglés + traducción español) y `yoasobi_idol.json` (YOASOBI, japonés con transliteración y videos con offsets).
  - Eliminación de canciones de demostración previas ("Caminando por la ciudad" y "Kimi ga Suki da to Sakebitai").

---

## Fase 2: Capa de Persistencia Local (IndexedDB) y Compartición (Import/Export)

- [x] **2.1. Adaptador de Base de Datos Local (`src/services/db.js`):**
  - Inicialización de IndexedDB (`SarangaDB` v2) con Object Stores (`songs`, `artists`, `tags`, `genres`, `song_tags`, `song_genres`, `settings`).
  - Sembrado inicial único en la primera apertura desde `defaultSongs` con metadatos completos, letras, videos de YouTube y offsets.
  - Registro de inicialización dual en `localStorage` (`saranga_seed_version`, `saranga_default_songs_seeded`) y store `settings` en IndexedDB para asegurar que las canciones eliminadas por el usuario no reaparezcan de forma automática.
  - Limpieza automática de canciones demo heredadas.
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
- [x] **12.6. Personalización Cromática de Sílabas Anteriores / Cantadas (`src/services/themeService.js`, `src/views/themeSettingsModal.js`, `src/style.css`):**
  - Incorporado parámetro `completedColor` (`--lyrics-completed-color` y `--text-completed`), `completedBold` y `completedItalic` en `DEFAULT_THEME` y en los 5 temas predefinidos.
  - Añadida tarjeta "Sílabas Anteriores" en el modal de temas con selector dual (picker cromático + entrada hex) y toggles tipográficos de negrita y cursiva.
  - Distinción explícita en la interfaz entre "Sílaba Activa (Resaltada)" y "Sílabas Anteriores".
  - Actualizado el escenario de previsualización en vivo (`#theme-live-preview-box`) reflejando la progresión completa: sílaba completada ("Cami"), sílaba activa ("nan") y texto pendiente ("do por la ciudad").
  - Inclusión en exportación/importación de paquetes de tema JSON y esquemas de canciones.

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

---

## Fase 14: Búsqueda de Canciones Online Multi-Motor (BetterLyrics, Genius y LRCLIB)

- [x] **14.1. Servicio de Integración LRCLIB (`src/services/lrclibService.js`):**
  - Cliente HTTP para consulta directa a la API de LRCLIB (`https://lrclib.net/api/search`).
  - Parser de letras sincronizadas LRC (`[mm:ss.xx]`) y texto plano.
  - Distribución proporcional fonética de sílabas (`src/lyrics/syllablesHelper.js`) para canciones sincronizadas línea a línea.
  - Soporte de traducción automática al español u otros idiomas mediante Unison.
- [x] **14.2. Servicio de Integración Genius.com (`src/services/geniusService.js`):**
  - Gestor de Client Access Token opcional con persistencia en `localStorage` (`saranga_genius_token`) y fallback a `VITE_GENIUS_ACCESS_TOKEN`.
  - Búsqueda oficial con metadatos completos, artistas, álbumes y carátulas (`artwork`) en `https://api.genius.com/search` (con soporte CORS nativo).
  - Cascada de recuperación de letras resiliente con fallback a LRCLIB y Lyrics.ovh para garantizar carga al 100%.
- [x] **14.3. Orquestador Maestro Multi-Motor (`src/services/onlineLyricsService.js`):**
  - Módulo centralizado que expone la lista de proveedores (`all`, `betterlyrics`, `genius`, `lrclib`).
  - Búsqueda simultánea en paralelo (`Promise.allSettled`) en todas las fuentes con clasificación y ordenamiento heurístico (prioridad: sílabas/TTML > versos/LRC > texto plano, presencia de video y carátula).
  - Ensamblado y saneamiento del paquete de canción (`buildSongPackageFromOnlineResult` y `normalizeSongPackage`) para su carga en SarangaBaranga.
- [x] **14.4. Modal Unificado de Búsqueda Online (`src/views/onlineLyricsModal.js`):**
  - Pestaña "Todas las Fuentes" con una única barra de búsqueda que consulta los 3 motores en paralelo.
  - Pestañas individuales para BetterLyrics (conservando los 4 modos: General, Solo Artista con filtro estricto, Artista y Canción, y Video de YouTube, más filtros de sincronización), Genius (con configuración de token y modo general o dual) y LRCLIB.
  - Badges visuales de origen (`BetterLyrics`, `Genius`, `LRCLIB`), badges de sincronización (`Sílabas TTML`, `Versos LRC`, `Letra Plana`), carátulas de álbumes y selector de idioma para traducción automática.
  - Precarga directa de la canción seleccionada en el editor (`songEditorView.open(songPackage)`).
- [x] **14.5. Integración en Shell, Menú y Retrocompatibilidad (`src/views/songMenuView.js`, `src/main.js`, `src/views/betterLyricsModal.js`):**
  - Actualizados botones de cabecera y estado vacío en el Menú de Canciones a "Buscar Canción Online".
  - Cableado reactivo en `src/main.js` y preservación de alias `createBetterLyricsModal` en `betterLyricsModal.js` para 100% de compatibilidad.
- [x] **14.6. Estilos Visuales y Nuevos Iconos SVG (`src/style.css`, `src/views/icons.js`):**
  - Nuevo icono SVG `iconSparkles` para sincronización silábica.
  - Estilos de pestañas `.online-provider-tab` con acentos cromáticos por marca (púrpura BetterLyrics, ámbar Genius, cian LRCLIB).
  - Badges cromáticos `.source-badge`, miniaturas `.result-card-artwork`, panel de token de Genius y reglas responsivas móviles.
- [x] **14.7. Corrección de Parámetros de Sincronización y Acceso Seguro a Variables de Entorno:**
  - Corregida la referencia `syncFilter` en `handleSearch` de [`src/views/onlineLyricsModal.js`](file:///home/hezztia/Documents/SarangaBaranga/src/views/onlineLyricsModal.js), resolviendo el error `ReferenceError: syncType is not defined` en búsquedas y clics de filtros.
  - Soporte y reenvío de `syncType` en [`src/services/onlineLyricsService.js`](file:///home/hezztia/Documents/SarangaBaranga/src/services/onlineLyricsService.js) y [`src/services/lrclibService.js`](file:///home/hezztia/Documents/SarangaBaranga/src/services/lrclibService.js).
  - Acceso seguro mediante encadenamiento opcional a `import.meta.env?.VITE_GENIUS_ACCESS_TOKEN` en [`src/services/geniusService.js`](file:///home/hezztia/Documents/SarangaBaranga/src/services/geniusService.js).

---

## Fase 15: Modos de Vista Dual en Menú de Canciones (Cuadrícula / Lista)

- [x] **15.1. Iconos Vectoriales para Modos de Vista (`src/views/icons.js`):**
  - Incorporados nuevos iconos SVG limpios `iconGrid` (matriz 2x2) e `iconList` (filas ordenadas con viñetas) con `stroke="currentColor"`.
- [x] **15.2. Control de Alternancia y Persistencia Local (`src/views/songMenuView.js`):**
  - Estado reactivo `viewMode` (`'grid'` | `'list'`) persistido en `localStorage` (`saranga_menu_view_mode`).
  - Grupo de botones de conmutación rápida `.view-mode-toggle-group` situado en la barra de búsqueda y filtro junto al contador de canciones.
- [x] **15.3. Renderizado y Maquetación de Vista en Lista (`src/views/songMenuView.js`, `src/style.css`):**
  - Componente de fila horizontal interactiva (`.song-menu-card.song-menu-list-row`) con distribución balanceada:
    - Columna principal con icono musical (`.list-song-icon-wrap`), título y artista con truncado seguro (`ellipsis`).
    - Columna de metadatos con badges de idioma principal, traducciones, géneros y etiquetas.
    - Columna de videos con resumen y botón de gestión (`btn-manage-videos`).
    - Columna de acciones compactas (Editar, JSON, Lyricsfile YAML, Eliminar y botón destacado "🎤 Entrar").
  - Preservación del 100% de los identificadores de eventos (`data-song-id`, clic en fila para reproducir, atajos de edición y exportación).
  - Adaptación responsive para pantallas medianas y móviles con envoltura fluida.

---

## Fase 16: Adaptación Completa para Teléfonos Móviles (Vertical y Horizontal) y Coexistencia PC

- [x] **16.1. Soporte de Viewport y Áreas Seguras (`index.html`, `src/style.css`):**
  - Añadido `viewport-fit=cover` en la metaetiqueta viewport de [`index.html`](file:///home/hezztia/Documents/SarangaBaranga/index.html).
  - Variables CSS para safe areas (`--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right`) y altura dinámica moderna (`100dvh`) en `#app` y `body`.
  - Regla global de prevención de zoom indeseado en iOS Safari (`font-size: 16px` en inputs/selects).
  - Áreas táctiles mínimas $\ge 40\text{px} - 46\text{px}$ para pantallas touch (`@media (hover: none) and (pointer: coarse)`).
- [x] **16.2. Encabezado Global Responsivo (`src/main.js`, `src/style.css`):**
  - Identificador de pantalla activa en `appContainer.dataset.screen` (`menu`, `lyrics`, `editor`).
  - Ocultamiento del título duplicado en el header en modo menú para pantallas móviles.
  - Modo ultra-delgado en apaisado ($38\text{px}$ de altura) con alineación en línea de título de canción y acciones compactas.
- [x] **16.3. Menú de Canciones Adaptable en Móvil (`src/style.css`):**
  - Modo Vertical: cuadrícula a 1 columna (`grid-template-columns: 1fr`), botones de acción principales en cuadrícula 2x2, botón "Entrar a Modo Letra" de ancho completo, filas de lista apiladas limpiamente.
  - Modo Horizontal: cuadrícula a 2 columnas (`grid-template-columns: repeat(2, 1fr)`), cabecera compacta y desplazamiento suave.
- [x] **16.4. Escenario de Letras con Tipografía Fluida y Dock Colapsable (`src/views/controlsView.js`, `src/style.css`):**
  - Tipografía responsiva fluida mediante `clamp(1.35rem, 5.5vw, 2.2rem)` para frase activa y escala adaptativa de traducciones y frases siguientes.
  - Dock en vertical: 2 filas limpias (Fila 1: barra de avance con thumb de $22\text{px}$; Fila 2: play, volumen, selector de video, traducciones y edición).
  - Dock en horizontal: ultra-delgado ($48\text{px}$) con elementos horizontales optimizados.
  - Modo Inmersivo de Pantalla Completa: botón para colapsar/ocultar el dock (`btn-dock-collapse`) y botón flotante discreto (`btn-dock-floating-expand`) para restaurarlo con 1 toque.
- [x] **16.5. Editor de Canciones en Teléfonos Móviles (`src/style.css`):**
  - Asistente de audio fijado de forma compacta en la parte superior con reloj `mm:ss.mmm` y botones de captura accesibles sin colisionar con el teclado virtual.
  - Tarjetas de frases y chips de sílabas con botones táctiles y campos de tiempo ordenados.
  - Pestañas de idiomas con desplazamiento horizontal táctil (`-webkit-overflow-scrolling: touch`).
- [x] **16.6. Modales del Sistema Responsivos (`src/style.css`):**
  - Dimensionado flexible `95vw` / `90dvh` en vertical y `96vw` / `94dvh` en horizontal para modales de Búsqueda Online, Temas, Videos y Atajos.
  - Cabeceras y pies fijos con scroll interno continuo.
- [x] **16.7. Verificación de Compilación y Preservación de PC:**
  - Compilación verificada con `npm run build` sin errores.
  - 100% de los estilos y maquetación de PC ($\ge 1025\text{px}$) intactos y sin alteraciones.

---

## Fase 17: Soporte Integral de Texto Alternativo (Romaji / Fonetismo) y Modos Duales de Escritura

- [x] **17.1. Modelo de Datos y Validación de Esquemas (`src/services/schemaValidator.js`):**
  - Soporte y preservación de `altText` en versos (`line.altText`) y sílabas (`syl.altText`), con compatibilidad de retroceso para `romaji`.
- [x] **17.2. Configuración Visual de Texto Alternativo en Temas (`src/services/themeService.js`, `src/views/themeSettingsModal.js`):**
  - Nuevas propiedades `altColor` (`--lyrics-alt-color`), `altScale` (`--lyrics-alt-scale`, `--lyrics-alt-size`), `altBold`, `altItalic` en `DEFAULT_THEME` y en los 5 temas predefinidos.
  - Añadido slider de escala (50% a 200%) y tarjeta de personalización de color y tipografía en el modal de temas con previsualización en vivo en japonés.
  - Inclusión de parámetros en exportación e importación de paquetes de tema JSON (`saranga-theme-settings.json`).
- [x] **17.3. Renderizado y Sincronización en Modo Letra (`src/views/basicViewer.js`):**
  - Renderizado simultáneo en 3 capas: Caracteres Originales (`.lyric-line-main`), Texto Alternativo (`.lyric-line-alt`) y Traducción (`.translation-line`).
  - Extensión a todas las frases siguientes en previsualización (`upcoming-phrase-item`).
  - Sincronización sílaba a sílaba concurrente (`updateTime` iluminando simultáneamente kanji y romaji al mismo tiempo).
  - Manejo de estados `both`, `original` y `alt` (con fallback seguro a `line.text`).
- [x] **17.4. Selector de Escritura en Dock de Controles (`src/views/controlsView.js`, `src/main.js`):**
  - Menú desplegable `#script-select` en `.center-controls` con opciones `both` (Caracteres + Alternativo), `original` (Solo Caracteres) y `alt` (Solo Alternativo Romaji), garantizando la regla de "siempre uno de los dos".
  - Detección automática de presencia de texto alternativo (`hasAltText`) en la pista activa y persistencia de preferencia en `localStorage` (`saranga_script_display`).
- [x] **17.5. Soporte en el Editor de Canciones (`src/views/songEditorView.js`):**
  - Inputs `.input-phrase-alt` en cada tarjeta de verso para ingresar la transliteración completa.
  - Inputs `.input-syl-alt` en cada chip de sílaba para sincronización fonética individual.
- [x] **17.6. Interoperabilidad Lyricsfile YAML (`src/services/lyricsfileService.js`):**
  - Importación y exportación de `alt_text` en especificación `.lyricsfile.yaml`.
- [x] **17.7. Canción Demo en Japonés y Sembrado Automático (`src/data/mockSong.js`, `src/services/db.js`):**
  - Incorporada canción demo `mockJapaneseSong` ('君が好きだと叫びたい') con kanji, romaji y traducción al español sembrada en IndexedDB.
- [x] **17.8. Estilos CSS y Comportamiento Responsivo (`src/style.css`):**
  - Estilos dedicados para `.lyric-line-alt`, `.is-primary-alt`, `.input-phrase-alt`, `.input-syl-alt` y reglas fluidas `clamp()` en móvil portrait y landscape.
  - Verificación de compilación exitosa con `npm run build`.

---

## Fase 18: Corrección y Normalización Universal de Carga de Letras Online (BetterLyrics, LRCLIB y Genius)

- [x] **18.1. Normalización Universal de Esquemas (`src/services/schemaValidator.js`):**
  - `validateSongPackage` adaptado para aceptar tanto el formato de paquete JSON (`{ version, metadata, basic, advanced }`) como el formato de entidad directa de canción (`{ id, title, artist, genres, tags, audio_path, videos, lyrics_data, visuals_data }`).
  - Extracción tolerante a fallos de título (`metadata.title || pkg.title || pkg.song || pkg.trackName`), artista, videos y lenguajes.
  - El objeto normalizado resultante incluye simultáneamente las propiedades de paquete (`metadata`, `basic`, `advanced`) y las de entidad plana (`id`, `title`, `artist`, `genres`, `tags`, `audio_path`, `videos`, `lyrics_data`, `visuals_data`), resolviendo el error `metadata.title` y garantizando compatibilidad cruzada al 100%.
- [x] **18.2. Ensamblado Dual de Paquetes en Proveedores Online (`src/services/betterLyricsService.js`, `src/services/lrclibService.js`, `src/services/geniusService.js`):**
  - `buildSongPackageFromBetterLyrics`, `buildSongPackageFromLrclib` y `buildSongPackageFromGenius` enriquecidos para incluir tanto las propiedades raíz como los objetos `metadata` y `basic`.
  - Detección precisa de LRC mediante expresión regular `/\[\d{1,2}:\d{1,2}/` y fallback a texto plano para evitar que encabezados de sección tipo `[Verse 1]` vacíen la lista de versos.
- [x] **18.3. Resiliencia de Consultas y Fallbacks en el Orquestador (`src/services/onlineLyricsService.js`):**
  - Paso de parámetros de respaldo (`item.videoId`, `item.song`, `item.artist`) a `fetchBetterLyricsDetails`.
  - Integración de fallback local en `fetchLrclibDetails` aprovechando los datos ya provistos por la API de búsqueda.
- [x] **18.4. Desempaquetado Defensivo en el Editor (`src/views/songEditorView.js`):**
  - `songEditorView.open(songToEdit)` desempaqueta defensivamente metadatos y colección lingüística si se recibe un paquete de canción o una entidad.
  - Preservación de `altText` en versos y sílabas durante la persistencia en `handleSaveSong`.

---

## Fase 19: Suite de Pruebas Automatizadas Integrales (Vitest, Happy-DOM y Fake-IndexedDB)

- [x] **19.1. Infraestructura y Configuración de Pruebas (`vite.config.js`, `package.json`, `tests/setup.js`):**
  - Incorporadas dependencias de desarrollo `vitest`, `happy-dom` y `fake-indexeddb`.
  - Configurado entorno de prueba `happy-dom` en `vite.config.js` y scripts `"test": "vitest run"` y `"test:watch": "vitest"` en `package.json`.
  - Archivo de inicialización `tests/setup.js` con soporte en memoria de IndexedDB (`fake-indexeddb/auto`), mocks globales para `URL.createObjectURL`/`URL.revokeObjectURL` y limpieza automática de `localStorage`.
- [x] **19.2. Pruebas de Núcleo Lírico y Tiempos (`tests/lyrics/`):**
  - `tests/lyrics/timing.test.js`: Conversión bidireccional beats/segundos con BPMs variados y formateo `mm:ss` con milisegundos de alta precisión (`mm:ss.mmm`).
  - `tests/lyrics/syllablesHelper.test.js`: Silabeo fonético en español (`syllabifyWord`, diptongos, hiatos, grupos consonánticos), división preservando espacios finales (`splitPhraseIntoSyllables`), división en palabras y distribución equitativa de tiempos (`autoDistributeSyllables`).
  - `tests/lyrics/languageManager.test.js`: Gestión reactiva de idioma principal (`isMain: true`), lista de traducciones, selección activa, modo bilingüe y suscripciones a eventos.
  - `tests/lyrics/sync.test.js`: Motor de búsqueda de verso activo (`findActiveLineIndex`, anticipación a < 1.5s), evaluación de estados de sílabas (`upcoming`, `active`, `completed`) y emparejamiento de traducciones (`findMatchingTranslationLine`).
- [x] **19.3. Pruebas de Reproducción y Multimedia (`tests/player/`):**
  - `tests/player/mediaPlayer.test.js`: Extractor universal de IDs de YouTube (enlaces estándar, acortados, Shorts, YouTube Music `music.youtube.com`, embeds, parámetros `&si=`), control maestro de volumen con persistencia en `localStorage`, cálculo de tiempos efectivos con offset ($\tau = t - \text{offset}$), conmutación de pista y compatibilidad con YouTube Player API simulado.
- [x] **19.4. Pruebas de Servicios, Persistencia e Intercambio (`tests/services/`):**
  - `tests/services/schemaValidator.test.js`: Normalización universal de paquetes (`song-package.json`) y entidades directas, validación de títulos, retrocompatibilidad mono-idioma, preservación de `altText`/`romaji` y normalización de videos.
  - `tests/services/db_and_songService.test.js`: CRUD completo en IndexedDB (`SarangaDB`), joins lógicos (artista, géneros, tags, videos), sembrado automático de demos (`mockSong`, `mockJapaneseSong`), agregado de traducciones y actualización de videos con offsets.
  - `tests/services/shareService.test.js`: Exportación e importación de paquetes `song-package.json` y respaldos completos de la biblioteca (`saranga-library-backup`).
  - `tests/services/lyricsfileService.test.js`: Parser y serializador de la especificación YAML 1.0 (.lyricsfile.yaml), conversión milisegundos <-> segundos, preservación de `alt_text` e importación como nueva canción o traducción secundaria.
  - `tests/services/themeService.test.js`: Utilidades cromáticas (`hexToRgb`, `hexToRgba`, luminancia, contrastes automáticos, brillo), persistencia en `localStorage`, inyección de variables CSS en `:root`, exportación e importación de paquetes de tema con saneamiento de escalas.
  - `tests/services/onlineLyricsService.test.js`: Pruebas de BetterLyrics (parser TTML, LRC, coincidencia de artista `isArtistMatch`), Genius (tokens y letra plana), LRCLIB (letras sincronizadas) y orquestador maestro unificado con scoring heurístico (richsync > linesync > plain).
- [x] **19.5. Pruebas de Vistas e Interfaz (`tests/views/`):**
  - `tests/views/icons.test.js`: Validación de los 29 iconos SVG vectoriales libres de emojis.
  - `tests/views/basicViewer.test.js`: Renderizado del escenario centrado, previsualización de 0 a 3 frases siguientes, subtitulado de traducción, resaltado de sílabas en tiempo real, modos de escritura (`both`, `original`, `alt`) e interacción de salto temporal (seek).
  - `tests/views/controlsView.test.js`: Barra de controles, botón cantar/pausa, slider de volumen y mute, selectores de video, texto alternativo, traducción y frases siguientes, y modo inmersivo de dock colapsable.
  - `tests/views/songMenuView.test.js`: Menú de bienvenida, alternancia entre vista cuadrícula y lista (`saranga_menu_view_mode`), buscador reactivo, entradas a Modo Letra y apertura de modales.
  - `tests/views/songEditorView.test.js`: Plantilla en blanco, precarga de canciones existentes, creación de frases, asistentes de tiempo y navegación.
  - `tests/views/videoManagerModal.test.js`: Modal de gestión de videos y offsets, adición, eliminación y actualización reactiva.
  - `tests/views/themeSettingsModal.test.js`: Modal de temas, selección de presets, sliders de escala y previsualización en vivo.
- [x] **19.6. Verificación y Compilación Continua:**
  - Ejecución integral de 19 suites de prueba (131 pruebas automáticas) concluidas exitosamente al 100%.
  - Compilación de producción con `npm run build` verificada sin errores.

---

## Fase 20: Refinamiento de UI y Ergonomía del Flujo de Trabajo

- [x] **20.1. Reubicación de Botones de Respaldo Individual (JSON / Lyricsfile):**
  - Eliminados los botones `.btn-export-json` y `.btn-export-yaml` de las tarjetas de canciones en el menú general (`src/views/songMenuView.js`, tanto en modo cuadrícula como en modo lista) para limpiar la interfaz y evitar sobrecarga visual.
  - Reubicados en el encabezado del editor de canciones (`src/views/songEditorView.js`), posicionados a la derecha de "Pegar Letra Completa" y antes de "Guardar Canción".
  - Cableado de persistencia previa con `handleSaveSong` antes de la exportación para asegurar que cualquier cambio sin guardar se incluya en el paquete exportado.
- [x] **20.2. Corrección de Desbordamiento en Tarjetas de Cuadrícula:**
  - Corregido el bug visual donde el botón "Entrar a Modo Letra" (`.btn-enter-lyrics`) se salía del contenedor en `.song-menu-card`.
  - Añadido `overflow: hidden;` y `box-sizing: border-box;` en `.song-menu-card`.
  - Añadido `flex-wrap: wrap;` en `.card-header` y `min-width: 0; word-break: break-word;` en `.card-title-group` y `.card-title`.
  - Añadido `max-width: 100%; text-overflow: ellipsis; overflow: hidden;` en `.btn-enter-lyrics`.
  - Ajustadas las columnas responsive de `.card-footer-actions` y `.list-col-actions` a 2 columnas para una distribución equilibrada.
- [x] **20.3. Ergonomía en los Controles de Modo Letra (`src/views/controlsView.js`):**
  - Reordenado el grupo central de controles (`.center-controls`) para que el selector "Siguientes:" (`.preview-lines-group`) ocupe siempre la primera posición.
  - Ocultamiento dinámico (`display: none`) del selector "Texto:" (`.script-selector-group`) cuando la canción activa no cuenta con texto alternativo (`!hasAltText`).
  - Ocultamiento dinámico (`display: none`) del selector "Traducción:" (`.translation-group`) cuando no hay pistas de traducción adicionales (`translations.length === 0`).
- [x] **20.4. Pruebas y Verificación:**
  - Actualizadas las suites `tests/views/songMenuView.test.js`, `tests/views/songEditorView.test.js` y `tests/views/controlsView.test.js` con 3 nuevas pruebas específicas (total 134 pruebas, 100% pasando).
  - Compilación de Vite (`npm run build`) concluida con éxito.

---

## Fase 21: Integración de LRC.red (https://lrc.red/) y Límite de 6 Resultados por Fuente en Búsqueda General

- [x] **21.1. Servicio de Integración con LRC.red (`src/services/lrcRedService.js`):**
  - Conexión cliente con la API de LRC.red (`https://lrc.red/search.json?q=...`) para búsqueda directa entre 29.8 millones de canciones sin requerir backend ni tokens.
  - Endpoint de detalles `/s/{isrc}.json` con soporte para extracción de archivos `.ttml` (sincronización silábica precisa), `.lyricsfile.yaml` (estándar abierto) y `.lrc`.
  - Soporte de traducción integrada mediante `translateLyricsLines` y saneamiento de metadatos.
- [x] **21.2. Límite de 6 Resultados por Fuente en Búsqueda General (`src/services/onlineLyricsService.js`):**
  - Configurado límite estricto de máximo 6 resultados por proveedor (`items.slice(0, 6)`) exclusivamente cuando se busca en "Todas las Fuentes" (`provider === 'all'`).
  - Preservación sin recortes del límite normal (por defecto 30-40) al buscar individualmente en cualquiera de las fuentes (BetterLyrics, LRC.red, Genius, LRCLIB).
  - Incorporado `lrcred` en el listado de proveedores (`ONLINE_PROVIDERS`) y en el mapeador de importación `buildSongPackageFromOnlineResult`.
- [x] **21.3. UI de Búsqueda Online y Pestaña LRC.red (`src/views/onlineLyricsModal.js`, `src/style.css`):**
  - Añadida pestaña interactiva dedicada para LRC.red con icono `iconMic`, con modos de Búsqueda General y Artista + Canción.
  - Badges de procedencia `.badge-source-lrcred` con acento rojo carmesí de marca (`#ef4444` / `#f87171`) y estilo de pestaña activa `.tab-prov-lrcred.is-active`.
  - Placeholder e indicadores de ayuda actualizados en "Todas las Fuentes" reflejando la consulta simultánea a los 4 motores de búsqueda con tope de 6 por fuente.
- [x] **21.4. Pruebas Automatizadas y Validación de Compilación:**
  - Actualizadas suites de prueba `tests/services/onlineLyricsService.test.js` y `tests/views/onlineLyricsModal.test.js` con 5 nuevas pruebas automáticas (total 139 pruebas, 100% pasando).
  - Compilación de producción con `npm run build` verificada sin errores.
- [x] **21.5. Corrección del Estado de Importación y Botones Deshabilitados (`src/views/onlineLyricsModal.js`):**
  - Incorporado bloque `finally` en `handleSelectSong` para garantizar que `isImporting` y `activeLoadingItemId` se restablezcan a `false` y `null` tras una carga exitosa.
  - Asegurado el restablecimiento de estado en las funciones `open()` y `close()` del modal para permitir que el usuario busque y cargue canciones consecutivas sin que los botones queden permanentemente deshabilitados.

---

## Fase 22: Transliteración Fonética Automática a Romaji para Canciones en Japonés

- [x] **22.1. Investigación de Fuentes y Ecosistema BetterLyrics:**
  - Verificado que las APIs online (BetterLyrics/Unison, LRC.red, LRCLIB, Genius) no devuelven Romaji en sus respuestas TTML o LRC; retornan exclusivamente caracteres originales en kanji y kana.
  - Comprobado que la aplicación de escritorio BetterLyrics ofrece Romaji mediante un plugin de cliente (`BetterLyrics.Plugins.Transliteration.Romaji` basado en MeCab y diccionario UniDic local) y no a través de su API.
- [x] **22.2. Diccionario Fonético Embebido Autónomo (`src/lyrics/kanjiDict.js`):**
  - Mapeo de más de 7,000 vocablos de uso común y canciones japonesas (`KANJI_WORDS`) y lecturas individuales para 2,136 caracteres kanji Joyo (`KANJI_CHARS`), con carga instantánea y sin dependencias de red ni diccionarios pesados de 40MB.
- [x] **22.3. Motor de Transliteración Hepburn Autónomo (`src/lyrics/transliterationHelper.js`):**
  - Función `hasJapanese(text)` para detección precisa de Hiragana, Katakana y Kanji.
  - Función `kanaToRomaji(text)` con soporte integral de dígrafos yōon (`kya`, `shu`, `cho`, `ti`, `di`, `fo`), duplicación por sokuon (`っ` / `ッ`), alargador chōonpu (`ー`) y puntuación japonesa.
  - Función `transliterateJapaneseToRomaji(text)` con coincidencia más larga (greedy) de compuestos kanji, kanjis individuales y normalización de partículas gramaticales (`ha` -> `wa`, `wo` -> `o`).
  - Función `transliterateSyllables(syllables)` con detección de fronteras de palabras para evitar separar fragmentos continuos de palabras en katakana (ej. `メディ` + `ア` -> `media`).
  - Función `autoGenerateRomajiForLines(lines)` para poblar automáticamente `line.altText` y `syl.altText` en simultáneo manteniendo la sincronización milimétrica para Modo Letra.
  - Función `autoEnrichSongWithRomaji(songPackage)` para enriquecer cualquier paquete de canción y corregir códigos de idioma `'und'` o `'en'` a `'ja'`.
- [x] **22.4. Integración en Proveedores Online y Editor:**
  - Auto-generación transparente al importar canciones desde BetterLyrics, LRC.red, LRCLIB y Genius.
  - Botón interactivo `${iconSparkles} Romaji Automático` en la barra de herramientas de frases del editor (`src/views/songEditorView.js`), permitiendo re-transliterar o generar Romaji bajo demanda con un solo clic.
- [x] **22.5. Pruebas y Validación de Compilación:**
  - Creada suite `tests/lyrics/transliterationHelper.test.js` con 15 pruebas unitarias y añadida prueba de integración en `tests/services/onlineLyricsService.test.js` con la canción "YOASOBI - Idol" (20 suites, 155 pruebas pasando al 100%).
  - Compilación de producción con `npm run build` verificada sin errores.

---

## Fase 23: Corrección de Congelamiento en Barra de Progreso y Espacios en Letras Alternativas (Romaji)

- [x] **23.1. Corrección de Congelamiento en Barra de Progreso (`src/views/controlsView.js`):**
  - Sustituida la comprobación de foco persistente en el DOM (`document.activeElement !== seekSlider`) por una bandera reactiva de interacción de usuario `isUserSeeking`.
  - Capturados eventos `pointerdown`, `mousedown`, `touchstart`, `pointerup`, `mouseup`, `touchend`, `input` y `change` con desenfoque (`seekSlider.blur()`) al completar la búsqueda.
  - El icono y thumb de progreso avanzan inmediatamente al reproducir tras cualquier salto o clic sobre la barra sin necesidad de pausar.
- [x] **23.2. Preservación y Reconstrucción de Espacios en Letras Alternativas (`src/views/basicViewer.js`):**
  - Implementada la función `getSyllableAltTextsWithSpacing(line)` para alinear y restaurar con precisión los espacios entre palabras a partir de `line.altText` en la frase actual activa.
  - Actualizados `renderLineAltContent` y `getLineAltText` para renderizar los spans de sílabas (`.syllable`) preservando todos los espacios intermedios (`display: inline; white-space: pre-wrap;`), garantizando paridad total con las frases siguientes (evitando aglutinaciones como `muteki noegaodearasumedia` y mostrando `muteki no egao de arasu media`).
- [x] **23.3. Preservación de Espacios en Validación y Editor (`src/services/schemaValidator.js`, `src/views/songEditorView.js`, `yoasobi_idol.json`):**
  - Eliminado `.trim()` destructivo sobre `syl.altText` en `normalizeLines` (`schemaValidator.js`) y en el guardado de canciones del editor (`songEditorView.js`), impidiendo la pérdida de espacios finales en sílabas intencionales.
  - Sincronizado `yoasobi_idol.json` con el espaciado silábico adecuado en sus 74 versos.
- [x] **23.4. Pruebas Automatizadas y Verificación de Compilación:**
  - Añadidas pruebas unitarias en `tests/views/controlsView.test.js` y `tests/views/basicViewer.test.js` (20 suites, 158 pruebas pasando al 100%).
  - Compilación de producción con `npm run build` verificada exitosamente.

---

## Fase 24: Gestión y Organización en Bibliotecas (Playlists / Grupos)

- [x] **24.1. Esquema de Datos y Persistencia Local (SarangaDB v3):**
  - Actualizada la versión de base de datos a `DB_VERSION = 3` en [`src/services/db.js`](file:///home/hezztia/Documents/SarangaBaranga/src/services/db.js).
  - Creados los almacenes de objetos `libraries` (`keyPath: 'id'`, índices `name`, `created_at`) y `song_libraries` (`keyPath: 'id'`, índices `song_id`, `library_id` e índice compuesto único `song_library: [song_id, library_id]`).
  - Actualizado `deleteSong` en [`src/services/songService.js`](file:///home/hezztia/Documents/SarangaBaranga/src/services/songService.js) para limpiar automáticamente las relaciones huérfanas en `song_libraries`.
  - Enriquecidas las funciones `fetchSongById` y `listSongs` para resolver e incluir la lista de bibliotecas (`libraries: [{ id, name }]`) a las que pertenece cada canción.
- [x] **24.2. Módulo de Servicios de Bibliotecas ([`src/services/libraryService.js`](file:///home/hezztia/Documents/SarangaBaranga/src/services/libraryService.js)):**
  - Implementadas funciones CRUD completas: `createLibrary`, `listLibraries` con conteo reactivo de canciones (`songCount`), `getLibraryById`, `getLibraryByName`, `renameLibrary` y `deleteLibrary` (preservando intactas las canciones).
  - Implementada gestión de relaciones N:M: `addSongToLibrary`, `removeSongFromLibrary`, `getSongLibraries`, `getLibrarySongs` y `setSongLibraries`.
  - Implementado algoritmo `getNextUniqueLibraryName(baseName, existingNames)` para calcular automáticamente sufijos secuenciales `(2)`, `(3)`, etc., ante nombres repetidos.
- [x] **24.3. Exportación e Importación de Paquetes de Biblioteca ([`src/services/shareService.js`](file:///home/hezztia/Documents/SarangaBaranga/src/services/shareService.js)):**
  - Implementada función `exportLibraryPackage(libraryId)`: genera y descarga el archivo JSON `saranga-library-package` (`biblioteca-<nombre>.json`) conteniendo exclusivamente las canciones de la biblioteca seleccionada.
  - Implementada función `importLibraryPackage(fileOrString, { onConflictChoice })`:
    - Creación automática si la biblioteca no existe en la base de datos local.
    - Detección de colisión de nombre con consulta al usuario mediante callback `onConflictChoice` o modal interactivo.
    - Soporte de resolución dual: **Combinar** (añade las canciones a la existente) o **Crear nueva** (crea biblioteca con sufijo secuencial `(2)`, `(3)`, etc.).
    - Prevención de duplicados a nivel de canciones vinculando temas existentes o registrando nuevas canciones.
- [x] **24.4. Interfaz de Usuario y Navegación en el Menú ([`src/views/songMenuView.js`](file:///home/hezztia/Documents/SarangaBaranga/src/views/songMenuView.js), [`src/style.css`](file:///home/hezztia/Documents/SarangaBaranga/src/style.css)):**
  - Barra de pestañas horizontal con soporte de desplazamiento táctil: pestaña "Todas" activa por defecto mostrando el total del catálogo, pestañas de bibliotecas personalizadas con badges de recuento y botón `+ Nueva Biblioteca`.
  - Barra de herramientas para biblioteca activa con opciones de **Renombrar**, **Exportar Biblioteca** y **Eliminar Biblioteca**.
  - Badges visuales `.badge-library` en tarjetas de cuadrícula y filas de lista.
  - Botón `${iconFolder} Bibliotecas` en cada canción y modal interactivo `.song-libraries-modal` para asignar o desasignar bibliotecas con checkboxes y creación al vuelo.
  - Diálogo interactivo de resolución de conflictos `.library-conflict-dialog` integrado en el flujo de importación desde dropzone/selector de archivos.
  - Nuevos iconos SVG `iconFolder` e `iconFolderPlus` en [`src/views/icons.js`](file:///home/hezztia/Documents/SarangaBaranga/src/views/icons.js).
- [x] **24.5. Suite de Pruebas Automatizadas y Verificación:**
  - Creada suite de pruebas unitarias y de integración [`tests/services/libraryService.test.js`](file:///home/hezztia/Documents/SarangaBaranga/tests/services/libraryService.test.js) con 15 pruebas cubriendo sufijos únicos, CRUD, conteos y relaciones N:M.
  - Añadidas 4 pruebas en [`tests/services/shareService.test.js`](file:///home/hezztia/Documents/SarangaBaranga/tests/services/shareService.test.js) para exportación, importación automática, combinación y creación con sufijo `(2)`.
  - Añadidas 8 pruebas en [`tests/views/songMenuView.test.js`](file:///home/hezztia/Documents/SarangaBaranga/tests/views/songMenuView.test.js) para la barra de navegación, filtrado, renombrado, exportación, eliminación y diálogo de conflicto (185 pruebas automatizadas al 100%).
  - Compilación de producción con `npm run build` verificada sin errores.

---

## Fase 25: Despliegue en GitHub Pages y Automatización CI/CD con GitHub Actions

- [x] **25.1. Configuración de Scripts y Dependencias de Despliegue ([`package.json`](file:///home/hezztia/Documents/SarangaBaranga/package.json)):**
  - Añadida dependencia de desarrollo `gh-pages` (`^6.3.0`).
  - Añadido script `"predeploy": "npm run build"` para compilación previa obligatoria antes de publicar.
  - Añadido script `"deploy": "gh-pages -d dist"` para publicación directa a la rama remota `gh-pages`.
- [x] **25.2. Ajuste de Base para Dominio de Usuario Raíz ([`vite.config.js`](file:///home/hezztia/Documents/SarangaBaranga/vite.config.js)):**
  - Configurada propiedad `base: '/'` en `vite.config.js` adaptada a la URL canónica `https://leamesi.github.io/` de GitHub Pages (sitio de usuario raíz `username.github.io`).
- [x] **25.3. Automatización de Despliegue Continuo ([`.github/workflows/deploy.yml`](file:///home/hezztia/Documents/SarangaBaranga/.github/workflows/deploy.yml)):**
  - Creado flujo de trabajo de GitHub Actions activado automáticamente en cada push a la rama `main` (o manualmente vía `workflow_dispatch`).
  - Configurado runner Ubuntu con Node.js 20 y caché de npm (`actions/setup-node@v4`).
  - Pipeline de calidad y entrega continua: ejecuta `npm ci`, corre la suite de 185 pruebas automatizadas (`npm test`), compila los paquetes de producción (`npm run build`) y despliega `dist` a la rama `gh-pages` con `peaceiris/actions-gh-pages@v4` y `GITHUB_TOKEN`.

---

## Fase 26: Sistema de Playlist, Cola de Reproducción Dinámica e Interoperabilidad con Bibliotecas

- [x] **26.1. Servicio de Playlist Reactivo y Persistente ([`src/services/playlistService.js`](file:///home/hezztia/Documents/SarangaBaranga/src/services/playlistService.js)):**
  - Singleton reactivo de cola de reproducción con persistencia automática en `localStorage` (`saranga_playlist`).
  - Métodos `addSong`, `addSongs`, `removeSongByIndex`, `removeSongById`, `moveSong`, `moveUp`, `moveDown` y `shuffle` (Fisher-Yates) conservando y recalculando el índice de la canción que está sonando (`currentPlayingId`).
  - Métodos de navegación secuencial `next`, `prev`, `hasNext`, `hasPrev`, `setCurrentSongById` y `clear`.
  - Integración `savePlaylistAsLibrary` (guardar la playlist actual como una nueva biblioteca permanente en IndexedDB mediante `libraryService`) y `loadLibraryIntoPlaylist` (cargar biblioteca en orden o en orden aleatorio).
- [x] **26.2. Iconos Vectoriales SVG para Controles de Reproducción y Playlist ([`src/views/icons.js`](file:///home/hezztia/Documents/SarangaBaranga/src/views/icons.js)):**
  - Incorporados nuevos iconos vectoriales SVG `iconSkipBack`, `iconSkipForward`, `iconShuffle`, `iconListMusic` e `iconListPlus`.
- [x] **26.3. Modal Interactivo de Playlist y Gestión de Cola ([`src/views/playlistModal.js`](file:///home/hezztia/Documents/SarangaBaranga/src/views/playlistModal.js), [`src/style.css`](file:///home/hezztia/Documents/SarangaBaranga/src/style.css)):**
  - Modal interactivo `#playlist-modal` con listado ordenado de canciones, badge de canción activa, botones de reordenamiento arriba/abajo, botón de reproducir y botón de eliminar.
  - Subpaneles colapsables para guardar como nueva biblioteca, cargar cualquier biblioteca existente en orden o aleatorio y búsqueda rápida en catálogo local para agregar canciones.
  - Comportamiento no intrusivo: todas las acciones se realizan sin pausar ni alterar la música de fondo.
- [x] **26.4. Controles de Transporte de Cola en Barra de Reproducción ([`src/views/controlsView.js`](file:///home/hezztia/Documents/SarangaBaranga/src/views/controlsView.js)):**
  - Incorporados botones Anterior (`#btn-prev-song`) y Siguiente (`#btn-next-song`) flanqueando el botón central de cantar/pausa, deshabilitados automáticamente si no hay pista previa/siguiente.
  - Botón de acceso a la playlist (`#btn-controls-playlist`) con badge dinámico de cantidad de canciones.
- [x] **26.5. Integración en Catálogo del Menú de Canciones ([`src/views/songMenuView.js`](file:///home/hezztia/Documents/SarangaBaranga/src/views/songMenuView.js)):**
  - Botón `+ Playlist` en cada tarjeta de cuadrícula y fila de lista con feedback visual inmediato (`✓ Añadida`).
  - Botones "▶ Cargar Playlist" y "🔀 Cargar Aleatoria" en la barra de herramientas de cualquier biblioteca seleccionada.
  - Botón directo de acceso a playlist en cabecera del menú con badge de conteo.
- [x] **26.6. Orquestación, Audio Continuo en Segundo Plano y Auto-Avance ([`src/main.js`](file:///home/hezztia/Documents/SarangaBaranga/src/main.js)):**
  - Botones `#btn-header-playlist` y `#btn-header-now-playing` en el encabezado global para alternar entre catálogo y letra sin perder la reproducción.
  - `showMenuScreen` actualizado para permitir reproducción continua sin pausa forzada.
  - Detección de fin de pista (`PLAYER_STATE.ENDED`) en `mediaPlayer.onStateChange` para avanzar automáticamente a la siguiente canción de la playlist si existe.
- [x] **26.7. Suite de Pruebas Automatizadas y Verificación de Compilación:**
  - Creadas suites de prueba `tests/services/playlistService.test.js` (11 pruebas) y `tests/views/playlistModal.test.js` (6 pruebas).
  - Actualizadas `tests/views/icons.test.js`, `tests/views/controlsView.test.js` y `tests/views/songMenuView.test.js` (total 23 suites y 204 pruebas pasando al 100%).
  - Compilación de producción con `npm run build` verificada sin errores.

---

## Fase 27: Reproductor Flotante Mini en Catálogo de Canciones

- [x] **27.1. Componente de Vista del Reproductor Flotante ([`src/views/floatingPlayerView.js`](file:///home/hezztia/Documents/SarangaBaranga/src/views/floatingPlayerView.js)):**
  - Módulo desacoplado para renderizar un widget compacto fijado en la esquina inferior derecha (`bottom: 24px; right: 24px; z-index: 90`).
  - Muestra título y artista con truncado seguro (`ellipsis`) y botón táctil `${iconMic} Letra` para regresar a Modo Letra.
  - Ocultamiento completo cuando no hay canción activa o la pantalla no es el menú.
- [x] **27.2. Controles de Reproducción, Posición (Seek) y Volumen:**
  - Control de tiempo con barra deslizante interactiva, bloqueo por interacción `isUserSeeking` para prevenir saltos de audio y marcas numéricas `mm:ss` (transcurrido y duración total).
  - Deslizador de volumen (0-100) y botón de silenciado toggle (`iconVolume` / `iconVolumeMute`) sincronizado con `mediaPlayer` y `controlsView`.
  - Botón dedicado `${iconRotateCcw}` para volver a empezar desde `0:00`.
  - Botón `${iconSkipBack}` para ir a la pista anterior de la playlist con fallback a reinicio.
  - Botón principal circular `${iconPlay}` / `${iconPause}` para alternar reproducción y pausa.
  - Botón `${iconSkipForward}` para avanzar a la siguiente pista de la cola.
- [x] **27.3. Integración en el Orquestador y Reglas de Visibilidad ([`src/main.js`](file:///home/hezztia/Documents/SarangaBaranga/src/main.js), [`src/style.css`](file:///home/hezztia/Documents/SarangaBaranga/src/style.css)):**
  - Contenedor `#floating-player-container` montado en `#app`.
  - Regla defensiva CSS `#app:not([data-screen="menu"]) .floating-player-container { display: none !important; }` asegurando que solo esté visible en el catálogo de canciones.
  - Sincronización continua de tiempo (`setTime`), duración (`setDuration`), estado de reproducción (`setPlayingState`), volumen (`setVolume`) y cola (`setPlaylistState`).
  - Estilos de diseño glassmorphism (`backdrop-filter: blur(16px)`), sombras profundas y adaptación responsive móvil con safe areas.
- [x] **27.4. Suite de Pruebas Automatizadas y Verificación de Compilación:**
  - Creada suite unitaria [`tests/views/floatingPlayerView.test.js`](file:///home/hezztia/Documents/SarangaBaranga/tests/views/floatingPlayerView.test.js) con 8 pruebas automáticas cubriendo renderizado, visibilidad, play/pause, restart, prev/next, volumen, mute y seek slider.
  - Total de 24 suites de prueba y 212 pruebas ejecutadas y pasando exitosamente al 100%.
  - Compilación de producción con `npm run build` verificada sin errores.












