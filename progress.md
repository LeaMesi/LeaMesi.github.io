# Estado del Desarrollo: SarangaBaranga (`proy-letras`)

> **Estado Global:** Arquitectura reorientada a **Persistencia Local en Navegador (IndexedDB)** y compartición mediante **Exportación/Importación JSON**. Enfoque activo en **Modo Sencillo / Básico**.  
> **Última actualización:** 2026-10-02  
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
| **Video YouTube Invisible (Audio)** | 🟢 Operativo | Host de YouTube alojado fuera de pantalla con opacidad 0, garantizando reproducción fiel sin elementos de video visibles. |
| **Múltiples Videos con Offset** | 🟢 Operativo | Soporte para asociar N videos por canción (`videos: [{ id, name, url, offset }]`), cálculo dinámico de tiempos $\tau = t - \text{offset}$ y modal de edición (`src/views/videoManagerModal.js`). |
| **Modelo de Datos Relacional** | 🟢 Operativo | Esquema de entidades (`songs`, `artists`, `tags`, `genres`) en IndexedDB con soporte multilingüe en `lyrics_data` y array dinámico de `videos`. |
| **Soporte Multilingüe y Traducciones** | 🟢 Operativo | Implementado en `src/lyrics/languageManager.js` con indicador `isMain`, traducciones ilimitadas y renderizado bilingüe. |
| **Adaptador Lyricsfile 1.0 (.lyricsfile.yaml)** | 🟢 Operativo | `src/services/lyricsfileService.js` con mapeo bidireccional YAML 1.0 (importar nueva canción, añadir traducción, exportar). |
| **Entorno y Compilación** | 🟢 Operativo | Vite configurado con `base: './'` (`vite.config.js`), `.gitignore` y compilación verificada. |
| **Memory Bank** | 🟢 Actualizado | `specs.md`, `design.md`, `progress.md`, `task.md` y `GEMINI.md` alineados. |
| **Base de Datos Local (IndexedDB)** | 🟢 Operativo | `src/services/db.js` y `src/services/songService.js` con soporte para CRUD, relaciones N:M, gestión de videos, resolución y actualización dinámica de artista y sembrado automático con `mockSong`. |
| **Motor Export / Import JSON** | 🟢 Operativo | `src/services/shareService.js` para exportar e importar paquetes `song-package.json` conservando colección de videos y offsets. |
| **Servicio Lyricsfile (YAML)** | 🟢 Operativo | `src/services/lyricsfileService.js` validando versión 1.0, milisegundos y palabras/sílabas. |
| **Adaptador de Audio / YouTube** | 🟢 Operativo | `src/player/mediaPlayer.js` con selector multi-video, cálculo de offset, audio HTML5 y Master Clock RAF bridge con arranque inmediato en `play()` y resiliencia ante estados `BUFFERING`. |
| **Modo Básico (Letra y Sílabas)** | 🟢 Operativo | `src/views/basicViewer.js` con escenario enfocado y letras sueltas (sin cajas, bordes ni fondos): frase actual en el centro, frases siguientes debajo reducidas al 70% con colores atenuados, cantidad de frases configurables (0 a 3, incluyendo modo solo actual sin frases siguientes), resaltado continuo sin espacios extra ni deformación de escala, y subtítulo de traducción en cursiva. |
| **Cálculo de Tiempos / BPM** | 🟢 Operativo | `src/lyrics/timing.js` con utilidades de tiempo, compás y formateo mm:ss con soporte de milisegundos de alta precisión (`mm:ss.mmm`). |
| **UI de Controles y Selector de Pista** | 🟢 Operativo | `src/views/controlsView.js` con barra de progreso, selector de video y offsets, selector de traducción opcional, selector de frases siguientes (0 a 3, con opción 'Ninguna (solo actual)'), botón de retorno al menú y toggles. |
| **Modo Solo Frase Actual (0 Siguientes)** | 🟢 Operativo | Soporte integral en `src/views/controlsView.js`, `src/views/basicViewer.js` y `src/main.js` para prescindir de frases siguientes, ocultando el contenedor inferior y presentando exclusivamente la frase en curso perfectamente centrada, con persistencia en `localStorage` (`saranga_preview_lines`). |
| **Modo Avanzado (Pixi.js / FX)** | 🟡 Operativo Básico | `src/views/advancedViewer.js` montado bajo demanda con lienzo interactivo y partículas ambientales sin interferir con el modo básico. |
| **Editor de Creación y Edición de Letras** | 🟢 Operativo | `src/views/songEditorView.js` con creación desde cero, edición por frases, marcas de tiempo con inputs limpios y oscuros (eliminación de flechas nativas y fondos blancos), sílabas, asistente de audio con reloj en vivo de alta precisión (`mm:ss.mmm`), importación rápida y edición interactiva de idiomas. |
| **Separador Fonético de Sílabas y Tiempos** | 🟢 Operativo | `src/lyrics/syllablesHelper.js` con silabeo fonético en español, división por palabras y distribución proporcional de tiempos. |
| **Sistema de Iconos SVG Minimalistas** | 🟢 Operativo | `src/views/icons.js` con catálogo centralizado de iconos vectoriales SVG limpios. Sustitución de emojis en todas las vistas (`songMenuView`, `songEditorView`, `controlsView`, `libraryView`, `videoManagerModal`, `main.js`), eliminando ruido visual y limitando iconos exclusivamente a acciones funcionales (crear, editar, retroceder, guardar, reproducir, tiempos). |
| **Soporte YouTube Music** | 🟢 Operativo | Parser universal `extractYouTubeVideoId` en `src/player/mediaPlayer.js` con soporte para `music.youtube.com`, `youtube.com/shorts/`, `youtu.be`, embeds y parámetros de query. |
| **Slider de Volumen (Modo Canción)** | 🟢 Operativo | Control deslizante de volumen y botón mute/unmute en `src/views/controlsView.js` con control directo sobre YouTube IFrame y audio HTML5 en `src/player/mediaPlayer.js`, persistencia en `localStorage` e iconos SVG dedicados. |
| **Integración BetterLyrics / Unison** | 🟢 Operativo | Búsqueda comunitaria en tiempo real desde el menú principal (`src/views/betterLyricsModal.js`), parser de TTML silábico y LRC con milisegundos (`src/services/betterLyricsService.js`), traducción automática a español y precarga completa en el editor de canciones (`src/views/songEditorView.js`). |
| **Búsqueda Avanzada Multi-Modo BetterLyrics** | 🟢 Operativo | Búsqueda versátil con 4 modos dedicados (*General*, *Solo por Artista* con filtro estricto del 100%, *Artista y Título* con coincidencia dual de alta precisión, y *Enlace / Video YouTube* por ID o URL), filtros de sincronización (*Todas*, *Sílabas*, *Versos*), badges de *Artista Verificado* y sugerencias interactivas. |
| **Borrado de Sílabas (Frase y Masivo)** | 🟢 Operativo | Botón de borrado de sílabas por frase individual (`.btn-clear-line-syllables`) en encabezado y barra rápida, y botón de borrado masivo (`#btn-clear-all-syllables`) con confirmación obligatoria previa (`window.confirm`) y contador silábico en tiempo real (`.phrases-syl-count`) en `src/views/songEditorView.js`. |
| **Configuración de Temas y Visualización** | 🟢 Operativo | `src/services/themeService.js` y `src/views/themeSettingsModal.js` con selección de 4 colores de interfaz globales (fondo, paneles, botones, texto), sliders de tamaño de fuente (50% a 200%) para original y traducción, selectores de color para letra original, traducción, sílaba activa y sílabas anteriores cantadas (`completedColor` / `--lyrics-completed-color`), conmutadores de negrita, cursiva y efecto de brillo (glow), exportación e importación de archivos de tema JSON (`saranga-theme-settings.json`), vista previa interactiva en vivo (mostrando sílabas completadas, activas y pendientes), presets rápidos y persistencia en `localStorage`. |
| **Búsqueda Multi-Motor Online** | 🟢 Operativo | Modal unificado `src/views/onlineLyricsModal.js` y orquestador `src/services/onlineLyricsService.js` con búsqueda paralela simultánea en "Todas las Fuentes" (BetterLyrics, Genius.com y LRCLIB) y pestañas individuales por proveedor (conservando al 100% los 4 modos y filtros de BetterLyrics, búsqueda con carátulas y token en Genius, y letras sincronizadas LRC de LRCLIB), con badges de origen y precarga automática en el editor. |
| **Modo de Vista Dual en Menú (Cuadrícula / Lista)** | 🟢 Operativo | Soporte interactivo en `src/views/songMenuView.js` para alternar fluidamente entre visualización en tarjetas de cuadrícula y filas en lista compacta, con persistencia en `localStorage` (`saranga_menu_view_mode`), iconos SVG dedicados (`iconGrid`, `iconList`) y maquetación responsive. |
| **Adaptación Completa Móvil (Vertical y Horizontal)** | 🟢 Operativo | Soporte integral para teléfonos móviles en orientaciones Vertical (Portrait) y Horizontal (Landscape) preservando al 100% la versión PC/Escritorio: `viewport-fit=cover`, safe areas con notch/isla dinámica (`env(safe-area-inset-*)`), tipografía fluida `clamp()` en letras, dock de controles en 2 filas limpias (vertical) y ultra-delgado $48\text{px}$ (horizontal), modo inmersivo de pantalla completa con botón colapsable y botón flotante de expansión, editor con asistente de audio compacto fijado en la parte superior, prevención de zoom de iOS Safari (`font-size: 16px`), y modales responsivos `95vw`/`90dvh`. |
| **Carga de Letras Online Normalizada (BetterLyrics, LRCLIB, Genius)** | 🟢 Operativo | Resuelto el error `metadata.title` mediante normalización universal dual (`schemaValidator.js`), ensamblado completo en los tres proveedores online, fallbacks resilientes y desempaquetado automático en `songEditorView.js`. |
| **Suite de Pruebas Automatizadas (Vitest)** | 🟢 Operativo | 19 suites de pruebas unitarias y de integración (131 pruebas automatizadas al 100%) con Vitest, Happy-DOM y Fake-IndexedDB: cobertura integral de tiempos, silabeo fonético, gestor multilingüe, motor de sincronización de letras, reproductor multimedia híbrido con offsets, persistencia relacional local (IndexedDB), servicios de exportación/importación JSON y Lyricsfile YAML, configuración de temas y todas las vistas interactivas (`basicViewer`, `controlsView`, `songMenuView`, `songEditorView`, modales). |
| **Catálogo Supabase (Read-Only)** | ⚪ Pospuesto | Reservado para fase futura como catálogo público de solo lectura administrado por el creador. |

---

## 3. Próximo Hito Prioritario

**Refinamiento y Características Adicionales:**
1. Grabación de marcas de tiempo en tiempo real mediante toques/tecla espaciadora ("Tap to sync") en el editor de canciones.
2. Soporte para carga de archivos de audio locales en IndexedDB mediante `FileReader` / Blobs en el formulario de creación.
3. Pruebas de usuario y verificación de experiencia interactiva en vivo con canciones adicionales creadas por usuarios.



