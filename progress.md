# Estado del Desarrollo: SarangaBaranga (`proy-letras`)

> **Estado Global:** Arquitectura reorientada a **Persistencia Local en Navegador (IndexedDB)** y compartición mediante **Exportación/Importación JSON**. Enfoque activo en **Modo Sencillo / Básico**.  
> **Última actualización:** 2026-09-29  
> **Plataforma:** SPA Estática (GitHub Pages) + IndexedDB Local & Export/Import JSON (+ Catálogo Opcional Supabase Read-Only a futuro)

---

## 1. Decisiones Arquitectónicas y Configuración de Datos

* **Persistencia 100% Local en el Navegador (IndexedDB):**
  * Para evitar la necesidad de autenticación de usuarios (login) y un backend que valide subidas públicas, los datos se almacenan directamente en el navegador del cliente.
  * Se mantiene de forma íntegra el esquema relacional estructurado previamente diseñado:
    * `artists`: Catálogo de artistas.
    * `songs`: Registro principal con `audio_path`, `lyrics_data` (JSON con marcas de tiempo, sílabas y estilos) y `visuals_data` (JSON con efectos GSAP/PixiJS).
    * `tags` y `genres`: Tablas de categorización normalizadas.
    * `song_tags` y `song_genres`: Relaciones N:M.
* **Intercambio Comunitario sin Servidor (Export / Import JSON):**
  * Cada canción puede exportarse como un paquete unificado `song-package.json` para compartirse fácilmente entre usuarios.
  * La aplicación cuenta con un importador que valida la estructura JSON y la almacena en el IndexedDB local del destinatario.
* **Soporte Multilingüe y Traducciones Ilimitadas:**
  * Cada canción puede albergar un número arbitrario de pistas lingüísticas en `lyrics_data.languages`.
  * Un idioma se designa como principal (`isMain: true`), representando la interpretación original, mientras los demás operan como traducciones (`isMain: false`).
  * Soporte diseñado para conmutación de idioma y modo bilingüe simultáneo (letra principal con guía de canto y traducción debajo como subtítulo sincronizado).
* **Interoperabilidad con Estándar Abierto `lyricsfile` (YAML 1.0):**
  * Compatibilidad con la especificación de [tranxuanthang/lyricsfile](https://github.com/tranxuanthang/lyricsfile/blob/main/SPECIFICATION.md).
  * Permite importar archivos `.lyricsfile.yaml` (como canciones nuevas o como pistas de traducción adicionales) y exportar cualquier idioma a este formato abierto.
* **Integración Futura con Supabase (Catálogo Solo Lectura):**
  * Supabase se pospone para una etapa posterior y se utilizará exclusivamente en modo **Read-Only** para distribuir un catálogo curado por el autor, sin escritura abierta en el cliente.
* **Mecanismo de Reproducción y Reloj Maestro:**
  * Soporte para **YouTube IFrame API** (alternancia oficial / instrumental conservando `currentTime`) y audio nativo HTML5 (archivos locales o URLs).
* **Despliegue Estático:**
  * Configuración para GitHub Pages sin servidor (`usuario.github.io`).

---

## 2. Estado Actual de la Implementación (Código Fuente)

| Módulo / Funcionalidad | Estado | Descripción |
| :--- | :--- | :--- |
| **Menú de Selección de Canciones** | 🟢 Operativo | `src/views/songMenuView.js` como pantalla de inicio con catálogo, buscador, importación, respaldo y acceso directo a Modo Letra. |
| **Video YouTube Invisible (Audio)** | 🟢 Operativo | Host de YouTube alojado dentro del viewport (`bottom: 0; right: 0; opacity: 0.001`), evitando la suspensión y lazy loading agresivo de iframes fuera de pantalla en navegadores modernos. |
| **Múltiples Videos con Offset** | 🟢 Operativo | Soporte para asociar N videos por canción (`videos: [{ id, name, url, offset }]`), cálculo dinámico de tiempos $\tau = t - \text{offset}$ y modal de edición (`src/views/videoManagerModal.js`). |
| **Modelo de Datos Relacional** | 🟢 Operativo | Esquema de entidades (`songs`, `artists`, `tags`, `genres`) en IndexedDB con soporte multilingüe en `lyrics_data` y array dinámico de `videos`. |
| **Soporte Multilingüe y Traducciones** | 🟢 Operativo | Implementado en `src/lyrics/languageManager.js` con indicador `isMain`, traducciones ilimitadas y renderizado bilingüe. |
| **Adaptador Lyricsfile 1.0 (.lyricsfile.yaml)** | 🟢 Operativo | `src/services/lyricsfileService.js` con mapeo bidireccional YAML 1.0 (importar nueva canción, añadir traducción, exportar). |
| **Entorno y Compilación** | 🟢 Operativo | Vite configurado con `base: './'` (`vite.config.js`), `.gitignore` y compilación verificada. |
| **Memory Bank** | 🟢 Actualizado | `specs.md`, `design.md`, `progress.md`, `task.md` y `GEMINI.md` alineados. |
| **Base de Datos Local (IndexedDB)** | 🟢 Operativo | `src/services/db.js` y `src/services/songService.js` con soporte para CRUD, relaciones N:M, gestión de videos, resolución y actualización dinámica de artista y sembrado automático con `mockSong`. |
| **Motor Export / Import JSON** | 🟢 Operativo | `src/services/shareService.js` para exportar e importar paquetes `song-package.json` conservando colección de videos y offsets. |
| **Servicio Lyricsfile (YAML)** | 🟢 Operativo | `src/services/lyricsfileService.js` validando versión 1.0, milisegundos y palabras/sílabas. |
| **Adaptador de Audio / YouTube** | 🟢 Operativo | `src/player/mediaPlayer.js` con inicialización no bloqueante, cola de carga pendiente (`pendingVideoLoad`), bandera de disponibilidad de API (`isPlayerReady`), espera en `play()`, reseteo limpio de audio al alternar canciones (`cueVideoById({ videoId, startSeconds })`), y prevención de throttling en navegadores ubicando el contenedor con `z-index: 2` detrás del dock de controles (`z-index: 30`). |
| **Modo Básico (Letra y Sílabas)** | 🟢 Operativo | `src/views/basicViewer.js` con escenario enfocado y letras sueltas (sin cajas, bordes ni fondos): renderizado forzado inmediato (`forceRender()`) al ingresar al modo letra o cambiar temas, soporte de esquemas mono/multilingües con `normalizeLanguages`, frase actual en el centro, frases siguientes configurables (0 a 3, con opción de 0 para ver solo la frase actual), resaltado continuo sin espacios extra ni deformación de escala, y subtítulo de traducción en cursiva. |
| **Cálculo de Tiempos / BPM** | 🟢 Operativo | `src/lyrics/timing.js` con utilidades de tiempo, compás y formateo mm:ss con soporte de milisegundos de alta precisión (`mm:ss.mmm`). |
| **UI de Controles y Selector de Pista** | 🟢 Operativo | `src/views/controlsView.js` con barra de progreso, selector de video y offsets, selector de traducción opcional, selector de frases siguientes (0 a 3: "0 (Solo actual)", 1, 2 y 3 frases), botón de retorno al menú y toggles. |
| **Modo Avanzado (Pixi.js / FX)** | 🟡 Operativo Básico | `src/views/advancedViewer.js` montado bajo demanda con lienzo interactivo y partículas ambientales sin interferir con el modo básico. |
| **Editor de Creación y Edición de Letras** | 🟢 Operativo | `src/views/songEditorView.js` con creación desde cero, edición por frases, marcas de tiempo con inputs limpios y oscuros (eliminación de flechas nativas y fondos blancos), sílabas, asistente de audio con reloj en vivo de alta precisión (`mm:ss.mmm`), importación rápida y edición interactiva de idiomas. |
| **Separador Fonético de Sílabas y Tiempos** | 🟢 Operativo | `src/lyrics/syllablesHelper.js` con silabeo fonético en español, división por palabras y distribución proporcional de tiempos. |
| **Sistema de Iconos SVG Minimalistas** | 🟢 Operativo | `src/views/icons.js` con catálogo centralizado de iconos vectoriales SVG limpios. Sustitución de emojis en todas las vistas (`songMenuView`, `songEditorView`, `controlsView`, `libraryView`, `videoManagerModal`, `main.js`), eliminando ruido visual y limitando iconos exclusivamente a acciones funcionales (crear, editar, retroceder, guardar, reproducir, tiempos). |
| **Soporte YouTube Music** | 🟢 Operativo | Parser universal `extractYouTubeVideoId` en `src/player/mediaPlayer.js` con soporte para `music.youtube.com`, `youtube.com/shorts/`, `youtu.be`, embeds y parámetros de query. |
| **Slider de Volumen (Modo Canción)** | 🟢 Operativo | Control deslizante de volumen y botón mute/unmute en `src/views/controlsView.js` con control directo sobre YouTube IFrame y audio HTML5 en `src/player/mediaPlayer.js`, persistencia en `localStorage` e iconos SVG dedicados. |
| **Integración BetterLyrics / Unison** | 🟢 Operativo | Búsqueda comunitaria en tiempo real desde el menú principal (`src/views/betterLyricsModal.js`), parser de TTML silábico y LRC con milisegundos (`src/services/betterLyricsService.js`), traducción automática a español y precarga completa en el editor de canciones (`src/views/songEditorView.js`). |
| **Búsqueda Avanzada Multi-Modo BetterLyrics** | 🟢 Operativo | Búsqueda versátil con 4 modos dedicados (*General*, *Solo por Artista* con filtro estricto del 100%, *Artista y Título* con coincidencia dual de alta precisión, y *Enlace / Video YouTube* por ID o URL), filtros de sincronización (*Todas*, *Sílabas*, *Versos*), badges de *Artista Verificado* y sugerencias interactivas. |
| **Borrado de Sílabas (Frase y Masivo)** | 🟢 Operativo | Botón de borrado de sílabas por frase individual (`.btn-clear-line-syllables`) en encabezado y barra rápida, y botón de borrado masivo (`#btn-clear-all-syllables`) con confirmación obligatoria previa (`window.confirm`) y contador silábico en tiempo real (`.phrases-syl-count`) en `src/views/songEditorView.js`. |
| **Configuración de Temas y Visualización** | 🟢 Operativo | `src/services/themeService.js` y `src/views/themeSettingsModal.js` con selección de 4 colores de interfaz globales (fondo, paneles, botones, texto), sliders de tamaño de fuente (50% a 200%) para original y traducción, selectores de color para letra original, traducción y sílabas activas, conmutadores de negrita, cursiva y efecto de brillo (glow), exportación e importación de archivos de tema JSON (`saranga-theme-settings.json`), vista previa interactiva en vivo, presets rápidos y persistencia en `localStorage`. |
| **Navegación Fluida y Estabilidad Hover** | 🟢 Operativo | Transición inmediata y resiliente a Modo Letra desde el Menú y el Editor (`main.js` con `finally { showLyricsScreen() }`), corrección del parpadeo en hover del botón "Entrar a Modo Letra" (sin jitter ni saltos de gradiente) y supresión de interferencias de cursor en SVG (`pointer-events: none`). |
| **Catálogo Supabase (Read-Only)** | ⚪ Pospuesto | Reservado para fase futura como catálogo público de solo lectura administrado por el creador. |

---

## 3. Próximo Hito Prioritario

**Refinamiento y Características Adicionales:**
1. Grabación de marcas de tiempo en tiempo real mediante toques/tecla espaciadora ("Tap to sync") en el editor de canciones.
2. Soporte para carga de archivos de audio locales en IndexedDB mediante `FileReader` / Blobs en el formulario de creación.
3. Pruebas de usuario y verificación de experiencia interactiva en vivo con canciones adicionales creadas por usuarios.



