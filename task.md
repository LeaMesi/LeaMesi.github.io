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
- [x] **4.4. Componente de Visualización (`src/views/basicViewer.js`):**
  - Renderizar versos en pantalla con elementos `<span>` para cada sílaba.
  - Aplicar resaltado progresivo (efecto karaoke / color activo / texto sombreado brillante).
  - Renderizado del subtítulo traducido simultáneo bajo la línea principal en modo bilingüe.
- [x] **4.5. Personalización de Estilo Básico:**
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

