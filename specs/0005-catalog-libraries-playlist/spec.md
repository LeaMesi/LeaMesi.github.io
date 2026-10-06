# Especificación: Catálogo, Bibliotecas, Playlist y Navegación
**Código:** `0005-catalog-libraries-playlist`  
**Estado:** Estable / En Producción  
**Versión:** 1.0.0

---

## 1. Menú Principal de Canciones (`src/views/songMenuView.js`)
1. **Punto de Entrada:** Pantalla de bienvenida con catálogo completo de canciones almacenadas localmente en IndexedDB.
2. **Modos de Vista Dual (Cuadrícula / Lista):**
   - **Cuadrícula:** Tarjetas visuales amplias con metadatos y botones de acceso.
   - **Lista:** Filas horizontales compactas tipo biblioteca musical multimedia.
   - Persistencia de preferencia en `localStorage` (`saranga_menu_view_mode`) y conmutación reactiva mediante iconos SVG vectoriales (`iconGrid`, `iconList`).
3. **Buscador Reactivo en Tiempo Real:** Filtrado instantáneo por título, artista o etiquetas sin peticiones de red.

---

## 2. Sistema de Bibliotecas y Agrupaciones N:M (`src/services/libraryService.js`)
1. **Organización Autónoma:** Permite categorizar canciones en grupos temáticos sin duplicar archivos ni datos temporales en IndexedDB.
2. **Operaciones CRUD:** Creación, listado reactivo con conteo de temas (`songCount`), renombramiento y eliminación (preservando intactas las canciones del catálogo general).
3. **Intercambio de Bibliotecas:** Exportación de paquetes `saranga-library-package` (`biblioteca-<nombre>.json`) e importación con detección de conflictos:
   - **Combinar:** Une las canciones del archivo con la biblioteca existente.
   - **Crear nueva:** Asigna un sufijo secuencial `(2)`, `(3)`, etc. mediante `getNextUniqueLibraryName`.

---

## 3. Playlist Dinámica y Cola de Reproducción (`src/services/playlistService.js`, `src/views/playlistModal.js`)
1. **Singleton Reactivo:** Cola interactiva persistida en `localStorage` (`saranga_playlist`).
2. **Transporte y Auto-Avance:**
   - Botones Anterior (`#btn-prev-song`) y Siguiente (`#btn-next-song`) en el dock de controles.
   - Detección de fin de reproducción (`PLAYER_STATE.ENDED`) que avanza automáticamente a la siguiente canción sin intervención del usuario.
   - Modo aleatorio (Shuffle con algoritmo Fisher-Yates) conservando el índice de la canción en curso.
3. **Audio Continuo en Segundo Plano:** El usuario puede salir de Modo Letra hacia el catálogo o manipular la playlist mientras la música continúa reproduciéndose.
4. **Barra de Herramientas Compacta (Toolbar):** Botones de acción rápida (`#btn-pl-toggle-add`, `#btn-pl-shuffle`, `#btn-pl-toggle-load-lib`, `#btn-pl-toggle-save-lib`) optimizados con solo iconos vectoriales SVG (`${iconPlus}`, `${iconShuffle}`, `${iconFolder}`, `${iconSave}`) y atributos `title` descriptivos, ofreciendo una apariencia minimalista y libre de desbordamientos en pantallas reducidas.
5. **Encabezado Compacto y Limpio:** Supresión de subtítulos redundantes en el encabezado del modal (`playlistModal.js`), maximizando el espacio vertical útil destinado a la cola de canciones en pantallas móviles y de escritorio.

---

## 4. Reproductor Flotante Mini (`src/views/floatingPlayerView.js`)
Widget compacto fijado en la esquina inferior derecha del catálogo cuando hay una canción en curso o cargada:
- Botón principal play/pause y botón `${iconRotateCcw}` para volver a empezar desde `0:00`.
- Botones anterior/siguiente con arranque automático (`autoplay: true`).
- Barra de control de tiempo (seek slider) con protección contra congelamiento `isUserSeeking`.
- Deslizador de volumen y silenciado sincronizado con `mediaPlayer`.
- Acceso directo `${iconMic} Letra` para volver instantáneamente a Modo Letra.

---

## 5. Botones de Acción en Canciones del Catálogo
- **Vista Cuadrícula:** El botón principal de cada tarjeta de canción (`.btn-enter-lyrics`) mantiene de forma fija el texto `${iconMic} Modo Letra` tanto en el renderizado inicial como ante actualizaciones reactivas de estado (`updateActiveSongHighlight`).
- **Vista Lista:** El botón compacto (`.btn-enter-lyrics`) muestra exclusivamente el icono `${iconMic}` sin texto alguno, integrándose de forma minimalista con los demás botones de acción compactos (`${iconFolder}`, `${iconListPlus}`, `${iconEdit}`, `${iconTrash}`).
