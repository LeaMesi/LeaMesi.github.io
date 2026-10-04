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
  - Resaltado visual en cuadrícula y lista con clases `.is-active-song`, `.is-playing`, botón dinámico 'Ver'/'Ver Modo Letra' y animación de tres barras ecualizadoras (`.now-playing-bars`): ubicada a la izquierda del todo del pie de la tarjeta en modo cuadrícula (`.card-now-playing-indicator`) separada de los botones de acción, y reemplazando al icono de nota musical en el modo lista (`.list-song-icon-wrap`), suprimiendo el badge de texto redundante.
- [x] **29.1. Limpieza de Barra Superior de Catálogo:**
  - Reubicación del botón de importar: retirado de la barra superior del catálogo (`.menu-actions-right` en `songMenuView.js`), dejando exclusivamente el botón "Respaldo Completo" y centralizando las acciones de incorporación de canciones en el menú de búsqueda online.

---

## Tareas Pendientes / Por Hacer
- [ ] **5.6. Búsqueda por filtros combinados:** Permitir filtrar en el catálogo por múltiples tags y géneros simultáneos mediante pills interactivas.
