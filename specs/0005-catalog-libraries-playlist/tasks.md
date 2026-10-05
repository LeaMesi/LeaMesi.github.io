# Tareas: Catálogo, Bibliotecas, Playlist y Navegación
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0005-catalog-libraries-playlist/spec.md)

---

## Tareas Completadas

- [x] **5.3. Menú Principal de Selección de Canciones (`src/views/songMenuView.js`):**
  - Catálogo inicial, buscador, tarjetas interactivas y acceso directo a Modo Letra.
- [x] **15.1 - 15.3. Modos de Vista Dual en Menú (Cuadrícula / Lista):**
  - Iconos vectoriales `iconGrid` / `iconList`, selector en barra de búsqueda y renderizado responsivo.
- [x] **20.2. Corrección de Desbordamiento en Tarjetas:**
  - `overflow: hidden`, `flex-wrap: wrap` y truncado de textos largos en botones y títulos.
- [x] **24.1 - 24.4. Gestión y Organización en Bibliotecas (SarangaDB v3):**
  - Almacenes `libraries` y `song_libraries`, operaciones CRUD, pertenencia N:M, exportación/importación de paquetes y diálogo de conflictos.
- [x] **26.1 - 26.6. Sistema de Playlist y Cola de Reproducción Dinámica:**
  - `playlistService.js`, modal interactivo, botones en el dock de controles, audio ininterrumpido en segundo plano y auto-avance en `PLAYER_STATE.ENDED`.
  - Auto-adición transparente de canciones a la playlist al entrar directamente desde el menú o editor (`setCurrentSong`), sincronizando reactivamente los botones anterior/siguiente y contadores tanto en el minireproductor como en la barra de controles de modo letra.
- [x] **27.1 - 27.3. Reproductor Flotante Mini en Catálogo (`src/views/floatingPlayerView.js`):**
  - Widget flotante con seek slider, volumen, restart, prev/next con autoplay y pre-carga en pausa.
- [x] **28.1 - 28.3. Resaltado Reactivo de Canción en Reproducción y Navegación sin Reinicio:**
  - Si se hace clic en la canción actualmente en reproducción desde el catálogo (grilla o lista), navega directamente a Modo Letra continuando la reproducción sin pausar ni reiniciar desde 0.
  - Resaltado visual en cuadrícula y lista con clases `.is-active-song`, `.is-playing`, animación de tres barras ecualizadoras (`.now-playing-bars`), y botón principal con texto fijo `${iconMic} Modo Letra` en cuadrícula y exclusivamente el icono `${iconMic}` sin texto en modo lista.
- [x] **29.1. Limpieza de Barra Superior de Catálogo:**
  - Reubicación del botón de importar: retirado de la barra superior del catálogo (`.menu-actions-right` en `songMenuView.js`), dejando exclusivamente el botón "Respaldo Completo" y centralizando las acciones de incorporación de canciones en el menú de búsqueda online.
- [x] **29.2. Botón de Cierre "X" en Alertas de Estado y Limpieza al Cambiar de Pantalla:**
  - Incorporación de botón "X" (`#btn-close-menu-alert` / `.btn-close-alert`) para descartar mensajes de confirmación e información (como "Respaldo completo exportado con éxito").
  - Método `clearStatus()` en la interfaz del componente y auto-cierre automático de alertas al cambiar entre Menú, Modo Letra y Editor de Canciones en `main.js`.
- [x] **29.3. Desalojo y Detención Inmediata al Eliminar Canciones (Desconexión de Playlist y Reproductor):**
  - Incorporación de callback `onDeleteSong` en `createSongMenuView` y `onRemoveSong` en `createPlaylistModal`, orquestados mediante `handleSongEviction` y `clearActivePlayback` en `src/main.js`.
  - Al eliminar una canción de la base de datos o retirarla de la lista de reproducción, se remueve automáticamente de la playlist activa (`playlistService.removeSongById`).
  - Si la canción eliminada o retirada es la que está sonando o cargada en ese momento, el reproductor multimedia detiene la reproducción y libera el canal de audio de inmediato (`mediaPlayer.stop()`), transicionando fluidamente a la siguiente canción de la cola (si existe) o reseteando por completo el estado del reproductor flotante, controles y visor si no quedan más canciones.
- [x] **29.4. Diálogos y Prompts Personalizados de Interfaz (`src/views/customPrompt.js`):**
  - Creación de diálogos modales custom (`showPrompt`, `showConfirm`, `showAlert`) adaptados a los temas de la aplicación (colores `--panel-bg`, `--primary-color`, etc.).
  - Sustitución de `window.prompt` y `window.confirm` en la creación de bibliotecas, renombrado, eliminación y desvinculación de canciones, eliminando las ventanas feas nativas de Javascript y el riesgo de bloqueo de mensajes del navegador.
  - Bloqueo completo al resto de la interfaz con backdrop (`position: fixed; inset: 0; z-index: 10000; backdrop-filter: blur(8px);`) y cierre con restauración del control al hacer clic fuera del prompt (backdrop) o presionar Escape.

---

## Tareas Pendientes / Por Hacer
- [ ] **5.6. Búsqueda por filtros combinados:** Permitir filtrar en el catálogo por múltiples tags y géneros simultáneos mediante pills interactivas.
