# Roadmap y Tareas de Desarrollo: SarangaBaranga (`proy-letras`)

> **Plan de Ejecución del Memory Bank**  
> Prioridad máxima actual: **Modo Sencillo / Básico**, **Persistencia Local en Navegador (IndexedDB)**, motor de **Exportación e Importación JSON**, soporte de **sílabas** y reproducción de audio (**YouTube / Audio Local**).

---

## Fase 0: Configuración para GitHub Pages y Entorno

- [ ] **0.1. Compatibilidad con GitHub Pages:**
  - Crear [`vite.config.js`](file:///home/hezztia/Documents/SarangaBaranga/vite.config.js) configurando `base: './'` para asegurar que las rutas a los bundles y assets sean relativas en `usuario.github.io`.
- [ ] **0.2. Entorno y Repositorio Git:**
  - Configurar `.gitignore` para dependencias y builds.
  - Opcional: `.env.example` reservado para futuro catálogo remoto Supabase.
  - Inicializar repositorio Git y registrar el primer commit estructurado.

---

## Fase 1: Esquema de Datos Modular, Paquete JSON y Demostración

- [x] **1.1. Modelo Conceptual Relacional Diseñado:**
  - Esquema estructurado y normalizado (`artists`, `songs`, `tags`, `genres`, `song_tags`, `song_genres`).
  - Separación modular de `metadata`, `basic` (`lyrics_data`) y `advanced` (`visuals_data`).
- [ ] **1.2. Definición de Schemas JSON para Validación e Intercambio:**
  - Definir esquema y validadores para el paquete de intercambio `song-package.json`:
    - `metadata`: Título, artista, géneros, tags, URLs de YouTube, ruta/enlace de audio.
    - `basic` / `lyrics_data`: Timing (BPM / compás / timestamps), colección multilingüe `languages` (idioma principal con `isMain: true` y traducciones ilimitadas con `isMain: false`), líneas sincronizadas, desglose de sílabas/palabras y estilos visuales.
    - `advanced` / `visuals_data`: Efectos de fondo, disparadores temporales y animaciones (GSAP / PixiJS).
- [ ] **1.3. Especificación de Compatibilidad con Estándar `lyricsfile`:**
  - Esquema y validador de interoperabilidad con la especificación YAML 1.0 ([tranxuanthang/lyricsfile](https://github.com/tranxuanthang/lyricsfile/blob/main/SPECIFICATION.md)).
  - Mapeo bidireccional de metadatos, marcas temporales (milisegundos <-> segundos) y palabras sincronizadas (`words` <-> `syllables`).
- [ ] **1.4. Canción de Demostración Local Multilingüe:**
  - Crear un set de archivos de prueba en `src/data/mockSong/` con idioma original y al menos una traducción sincronizada para sembrar la base de datos local en la primera carga.

---

## Fase 2: Capa de Persistencia Local (IndexedDB) y Compartición (Import/Export)

- [ ] **2.1. Adaptador de Base de Datos Local (`src/services/db.js`):**
  - Implementar inicialización de IndexedDB (`SarangaDB`) con Object Stores (`songs`, `artists`, `tags`, `genres`, `song_tags`, `song_genres`) e índices correspondientes.
  - Función de sembrado inicial (seed) con la canción demo mock si la base de datos está vacía.
- [ ] **2.2. Repositorio de Canciones (`src/services/songService.js`):**
  - Implementar métodos CRUD locales con resolución lógica de relaciones (joins):
    - `getSongById(id)` (une canción con artista, tags y géneros).
    - `saveSong(songData)` (crea o actualiza canción y sus relaciones).
    - `listSongs()` (listado ordenado para la biblioteca local).
    - `deleteSong(id)` (eliminación con limpieza de relaciones).
- [ ] **2.3. Motor de Exportación e Importación JSON (`src/services/shareService.js`):**
  - `exportSongPackage(songId)`: Generar y descargar archivo JSON estructurado con soporte multilingüe completo (`languages`).
  - `importSongPackage(jsonFileOrData)`: Validar estructura JSON, normalizar versiones monoidioma anteriores si fuese necesario, insertar entidades en IndexedDB y devolver la canción importada.
  - `exportLibraryBackup()` / `importLibraryBackup()`: Respaldo y restauración completa de la biblioteca local.
- [ ] **2.4. Adaptador de Estándar `lyricsfile` (`src/services/lyricsfileService.js`):**
  - Parser seguro para archivos `.lyricsfile.yaml` (validación de versión 1.0 y campos requeridos).
  - Conversor de formato: `start_ms`/`end_ms` a segundos decimales y reconstrucción de `syllables` preservando espaciado de `words`.
  - Serializador inverso para exportar cualquier idioma a `.lyricsfile.yaml`.
  - Flujo de importación como nueva canción (`isMain: true`) o incorporación como traducción a canción existente (`isMain: false`).
- [ ] **2.5. (Futuro / Pospuesto) Conector Supabase Read-Only (`src/services/supabaseCatalog.js`):**
  - Conexión opcional de sólo lectura para consultar catálogo oficial administrado por el creador y clonar canciones a la base de datos local.

---

## Fase 3: Reproductor de Audio y Reloj Maestro

- [ ] **3.1. Adaptador Multimedia Híbrido (`src/player/mediaPlayer.js`):**
  - **Canal YouTube:** Soporte para YouTube IFrame API (alternando entre video oficial y solo pista conservando `currentTime`).
  - **Canal Audio HTML5 / Local:** Soporte para elemento `<audio>` nativo (Blob local o URL remota de audio).
  - Exponer una interfaz unificada: `play()`, `pause()`, `seek(time)`, `getCurrentTime()`.
- [ ] **3.2. Emisor de Tiempo (Master Clock Bridge):**
  - Bucle con `requestAnimationFrame` que consulta el tiempo de reproducción y despacha eventos a la capa de sincronización de letras.

---

## Fase 4: Modo Sencillo / Básico (Letra, Sílabas y Traducciones)

- [ ] **4.1. Calculador de Tiempos y BPM (`src/lyrics/timing.js`):**
  - Soporte para sincronización por segundos absolutos o cálculo musical por BPM y compás.
- [ ] **4.2. Gestor de Idiomas y Traducciones (`src/lyrics/languageManager.js`):**
  - Módulo encargado de gestionar el idioma principal, las traducciones disponibles y la selección activa del usuario.
- [ ] **4.3. Motor de Sincronización Multilingüe (`src/lyrics/sync.js`):**
  - Algoritmo que identifique en tiempo real la estrofa actual, la línea activa y la sílaba en curso para el idioma seleccionado.
  - Sincronización paralela para visualización dual (emparejamiento temporal entre idioma principal y traducción activa).
- [ ] **4.4. Componente de Visualización (`src/views/basicViewer.js`):**
  - Renderizar versos en pantalla con elementos `<span>` para cada sílaba.
  - Aplicar resaltado progresivo (efecto karaoke / color activo) mediante CSS o animaciones ligeras con GSAP.
  - Renderizado del subtítulo traducido simultáneo bajo la línea principal en modo bilingüe.
- [ ] **4.5. Personalización de Estilo Básico:**
  - Inyectar dinámicamente las propiedades de estilo definidas en `lyrics_data.styles` (color inactivo, activo, color de traducción, fondo, tipografía).

---

## Fase 5: Shell de la Aplicación, Biblioteca y Controles

- [ ] **5.1. Barra de Herramientas y Controles:**
  - Selector de modo: **Modo Sencillo** vs **Modo Avanzado**.
  - Conmutador de pista: **Pista Oficial** vs **Solo Pista (Instrumental)**.
  - Selector de idioma en tiempo real (idioma principal y lista de traducciones disponibles).
  - Interruptor para activar/desactivar subtitulado bilingüe simultáneo.
  - Barra de progreso interactiva para saltar a partes de la canción (Seek).
- [ ] **5.2. Panel de Biblioteca y Compartición:**
  - Selector y listado de canciones guardadas en el navegador.
  - Botón "Exportar Canción (JSON)" y "Exportar a Lyricsfile (.lyricsfile.yaml)".
  - Botón / Área Drag & Drop "Importar Canción" con detección automática de archivos JSON o YAML de `lyricsfile`.
  - Acción "Añadir Traducción" desde archivo local o `lyricsfile` a una canción seleccionada.

---

## Fase 6: Modo Avanzado (Pospuesto para Segunda Etapa)

- [ ] **6.1. Integración de Escenario con Pixi.js:**
  - Inicializar canvas WebGL detrás del visor de letras.
- [ ] **6.2. Intérprete de Efectos (`visuals_data`):**
  - Leer la línea de tiempo de `visuals_data.effects` y disparar transiciones de color, formas geométricas y overlays de GIFs en timestamps específicos.
