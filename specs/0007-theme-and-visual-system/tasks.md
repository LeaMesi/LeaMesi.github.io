# Tareas: Sistema Visual, Iconografía SVG y Configuración de Temas
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0007-theme-and-visual-system/spec.md)

---

## Tareas Completadas

- [x] **8.1 - 8.3. Biblioteca de Iconos SVG y Migración de Vistas:**
  - Creación de `src/views/icons.js`, supresión de emojis decorativos y migración completa de vistas.
- [x] **8.5. Centrado Geométrico del Encabezado Global:**
  - Alineación absoluta al 50% de `.song-header-info` con truncado tipográfico.
- [x] **12.1 - 12.5. Personalización de Temas y Visualización:**
  - Selector de 4 colores, sliders de escala, 5 presets, previsualización interactiva y exportación/importación JSON.
- [x] **12.6. Personalización Cromática de Sílabas Anteriores:**
  - Soporte de `completedColor`, `completedBold`, `completedItalic` y previsualización de 3 estados.
- [x] **16.1 - 16.7. Adaptación Completa para Móviles (Vertical y Horizontal):**
  - Safe areas, dock colapsable, asistente fijado arriba y preservación del 100% del layout de PC.
- [x] **20.3. Ergonomía en Controles:**
  - Ocultamiento de selectores sin opciones ('Texto' y 'Traducción') y reordenamiento de 'Siguientes'.
- [x] **28.4. Adaptación Cromática Reactiva del Resaltado de Canción Activa al Cambiar de Tema:**
  - Inyección de variables CSS dinámicas (`--active-song-border`, `--active-song-shadow`, `--active-song-glow`, `--active-song-bg`, `--active-song-list-bg`, `--badge-now-playing-bg`, `--badge-now-playing-color`, `--now-playing-bar-color`) en `src/services/themeService.js` y `src/style.css`, garantizando que al cambiar de tema (Cyberpunk, Bosque Esmeralda, Atardecer Cálido, Minimalista Claro o colores personalizados) el resaltado de la canción activa en cuadrícula y lista cambie de inmediato al nuevo esquema cromático.
- [x] **12.8. Personalización Cromática y Cierre de Cuadros de Aviso (Alertas de Estado):**
  - Incorporación de Sección 4 en `src/views/themeSettingsModal.js` ("Cuadros de Aviso y Notificaciones") para personalizar los colores de alertas de éxito, informativas y de error (`alertSuccessColor`, `alertInfoColor`, `alertErrorColor`).
  - Inyección en `:root` de variables CSS dinámicas (`--alert-*-bg`, `--alert-*-color`, `--alert-*-border`) con cálculo automático de opacidad y contraste según el brillo del panel.
  - Botón de cierre manual "X" (`.btn-close-alert`) en todos los cuadros de aviso de la aplicación y auto-cierre al cambiar de pantalla mediante `clearAllStatusAlerts()`.
- [x] **8.6. Renovación del Icono de Micrófono y Estilos Font Awesome:**
  - Sustitución de `iconMic` por un glifo vectorial estilizado de alta resolución con `fill="currentColor"` (`viewBox="0 0 340 340"`).
- [x] **16.8. Ergonomía Táctil y Solución de Popover en Móviles:**
  - Posicionamiento fijo (`position: fixed`) de `.controls-settings-popover` en móvil vertical y apaisado, eliminando el recorte de visualización provocado por el `overflow-x: auto` del contenedor de controles.
  - Supresión del destello azul de tap (`-webkit-tap-highlight-color: transparent`) y selección involuntaria de texto (`user-select: none; -webkit-user-select: none; touch-action: manipulation`) en `.controls-dock` y botones.
  - Blindaje contra fuga de clics en el botón de reproducción/pausa mediante `e.stopPropagation()` y verificación con `e.composedPath()` en el fondo del dock.
- [x] **16.9. Optimización de Controles de Modo Letra y Botones de Canciones en Móviles:**
  - Configuración de Modo Letra (`.controls-settings-popover`): labels visibles arriba de la opción (`display: block; font-weight: 600`) y selectores ocupando el 100% del ancho disponible (`width: 100%`) en móvil sin alterar la versión de PC.
  - Supresión del espacio en blanco en tarjetas de grilla móvil: ajuste de `.card-header` a `height: auto`, `justify-content: flex-start` y `.card-title-group` a `flex: 0 0 auto`, manteniendo el botón "Modo letra" directamente adyacente al título sin afectar PC.
  - Botones de acción en catálogo de canciones (grilla y lista): unificación en una sola fila horizontal (`flex-direction: row; flex-wrap: nowrap`), expansión al 100% del ancho del contenedor (`flex: 1; width: 100%`) para mayor área táctil e iconos SVG centrados (`justify-content: center; align-items: center`).
  - Compensación inferior de scroll para el minireproductor en móviles: ampliación del padding inferior en `.song-menu-view-container` (`calc(150px + var(--safe-bottom))` en vertical y `calc(110px + var(--safe-bottom))` en apaisado) para que el último elemento del catálogo quede 100% visible por encima del reproductor flotante sin solapamientos.
- [x] **16.10. Estandarización de Tamaños de Botones en Móvil y Reubicación de Botón 'Editar':**
  - Estandarización estricta de botones en teléfonos móviles (`@media (max-width: 768px)`): botones de icono unificados exactamente a 38x38px (`.btn-prev-song`, `.btn-next-song`, `.btn-controls-volume`, `.btn-controls-fullscreen`, `.btn-controls-settings-toggle`), botón de reproducción/pausa a 44x38px, y altura consistente de 38px en `.btn-open-playlist`.
  - Estandarización en vista apaisada / landscape móvil (`@media (max-height: 500px) and (orientation: landscape)`): altura estándar de 32px para todos los botones del dock.
  - Reubicación del botón "Editar" (`#btn-controls-edit`) dentro del popover de ajustes (`#controls-settings-popover`), posicionado a lo ancho completo debajo de una línea divisoria horizontal (`<hr class="settings-popover-separator">`) con su icono correspondiente, liberando espacio en el dock exterior.
- [x] **16.11. Optimización Integral de Rendimiento Móvil (Master Clock, DOM y CSS):**
  - Carga perezosa de `onlineLyricsModal.js` en `main.js`, reduciendo el paquete inicial JavaScript en casi 50% (de 603 KB a 344 KB).
  - Cacheo de referencias DOM y comprobación sucia (*dirty checking*) de segundos en `basicViewer.js`, `controlsView.js`, `floatingPlayerView.js` y `songEditorView.js`, eliminando miles de consultas y reduciendo mutaciones DOM en 98% en pantallas de 60/90/120 Hz.
  - Comprobación sucia de estados silábicos en el visor de letras, evitando conmutar clases CSS cuando no hay transición real de estado.
  - Actualización delta (*delta update*) en `songMenuView.js` al alternar canción activa, afectando únicamente a las 2 tarjetas en vez de iterar sobre el catálogo completo.
- [x] **16.12. Eliminación Global de Destellos Azules de Tap y Funcionamiento del Volumen en Teléfonos Móviles:**
  - Desactivación universal del cuadro/destello azul de tap (`-webkit-tap-highlight-color: transparent`) en toda la web aplicada a `*, *::before, *::after`, `html`, `body`, `a`, `button`, `input`, `select` y `textarea`, junto con `:focus:not(:focus-visible) { outline: none; }`.
  - Corrección integral del popover de volumen (`#controls-volume-popover`) en móviles portrait y landscape: posicionamiento fijo (`position: fixed !important`) con cálculo dinámico centrado sobre el botón `#btn-controls-volume`, impidiendo que el `overflow-x: auto` de `.controls-main-row` recorte y oculte el control.
  - Soporte táctil y de puntero interactivo en la pista vertical del slider de volumen (`.controls-volume-slider-track` con `touch-action: none`), permitiendo regular el volumen de 0 a 100% deslizando el dedo sin provocar scroll en la pantalla.
  - Sincronización de `mute()` y `unMute()` en la YouTube IFrame API y silenciamiento nativo en audio HTML5 (`audioElement.muted`) para compatibilidad total de volumen en dispositivos móviles.
- [x] **16.13. Supresión de Animaciones de Desplazamiento y Movimiento al Hacer Hover:**
  - Eliminación integral de traslaciones (`translateY`, `translateX`) y escalados (`scale`) en estados `:hover` y `:active` a lo largo de toda la interfaz (`src/style.css`): título del encabezado global (`.brand-title`), versos anteriores y siguientes del visor de letras (`.past-phrase-item`, `.upcoming-phrase-item`), botón de salida de pantalla completa (`.btn-exit-fullscreen`), botón de reproducción/pausa (`.btn-play-pause`), pastillas de bibliotecas (`.lib-tab-pill`), tarjetas y filas del catálogo de canciones (`.song-menu-card`, `.song-menu-list-row`), botón para entrar a la letra (`.btn-enter-lyrics`), botón flotante de retorno arriba (`.btn-online-scroll-top`), botón de cantar del asistente del editor (`.btn-assistant-sing`), icono de edición de pestañas (`.tab-edit-icon`), botones de reproducción en listas (`.btn-play-item`) y botón play del minireproductor flotante (`.btn-floating-icon.btn-floating-play`).
  - Preservación íntegra de la retroalimentación visual no disruptiva (cambios de color, brillo, fondo y sombras), eliminando la inestabilidad física o desplazamientos involuntarios al interactuar y hacer clic.

- [x] **12.9. Temas Visuales Personalizados por Canción:**
  - Nuevo apartado interactivo en el editor de canciones (`songEditorView.js`), ubicado estratégicamente abajo de metadatos y arriba de las letras (`#editor-theme-details`).
  - Permite configurar todos los atributos de un tema: 4 colores de interfaz (`bgColor`, `panelBg`, `primaryColor`, `textMain`), 3 sliders de escala tipográfica (letra original, traducción y Romaji), estilos y colores de versos (original, alt, traducción, activa con efecto de brillo, completadas), 3 colores de alertas de estado (`alertSuccessColor`, `alertInfoColor`, `alertErrorColor`), presets rápidos, botón de copia rápida del tema global actual y restablecimiento a valores por defecto.
  - Previsualización en vivo en tiempo real (`#editor-theme-live-preview-box`) y guardado automático integrado en segundo plano en `currentSong.lyrics_data.customTheme`.
  - Aplicación automática del tema en Modo Letra (`showLyricsScreen`) y restauración del tema global del usuario al salir (`showMenuScreen`, `showEditorScreen`).
  - Conmutador en el modal de temas (`themeSettingsModal.js` y `themeService.js`) para activar o desactivar la aplicación de temas de canciones (`enableSongThemes`), habilitado por defecto (`true`).

- [x] **16.14. Rediseño Suave y Redondeado de la Interfaz (Bordes Reducidos y Botones Píldora/Circulares):**
  - Renovación integral de la escala de radios en `:root`: `--radius-sm` (14px), `--radius-md` (20px), `--radius-lg` (26px), `--radius-btn` (9999px) y `--panel-border` suavizado a `0.05` de opacidad.
  - Transformación de todos los botones de acción (`.btn`, `.btn-primary`, `.btn-secondary`, `.btn-outline`, `.btn-play-pause`, `.btn-enter-lyrics`, `.btn-open-playlist`, etc.) a formato píldora (`border-radius: 9999px`) con padding ergonómico y sombras sutiles, eliminando el aspecto cuadrado y tosco.
  - Botones de iconos (`.btn-prev-song`, `.btn-next-song`, `.btn-controls-volume`, `.btn-controls-fullscreen`, `.btn-controls-settings-toggle`, `.btn-close-modal`, `.btn-close-alert`) transformados en botones circulares suaves (`border-radius: 50%`).
  - Redondeo ergonómico del buscador (`.search-input`), selectores de pista (`.track-toggle-group`), badges/etiquetas (`.badge`), alertas de estado (`.status-alert`), tarjetas de catálogo (`.song-menu-card` a 24px y `.song-menu-list-row` a 16px) y modales (`.modal-dialog` a 26px).
  - Optimización específica para móviles (vertical y horizontal): dock con botones circulares de tacto sedoso a 38px/32px, esquinas redondeadas en tarjetas y popovers sin bordes agresivos.

- [x] **16.15. Unificación Visual de Puntos de Tiempo (Seek Sliders / Thumbs):**
  - Homogeneización del punto indicador de posición temporal en los tres reproductores de la app: minireproductor (`.floating-seek-slider`), modo letra (`.seek-slider`) y selector de tiempo del editor (`.editor-progress-slider`).
  - Adopción uniforme del estilo del minireproductor: punto circular de 11px con fondo dinámico del tema (`var(--primary-color, #6366f1)`), borde blanco puro de 1.5px (`1.5px solid #fff`), sombra sutil envolvente (`box-shadow: 0 0 6px rgba(0, 0, 0, 0.4)`), cursor pointer y micro-animación en hover (`scale(1.2)`), eliminando deformaciones en hover y discrepancias entre navegadores y dispositivos móviles.
- [x] **12.10. Depuración Visual y Normalización Tipográfica en Selectores de Tema (`themeSettingsModal.js` y `style.css`):**
  - Supresión de subtítulos y textos explicativos redundantes (`.color-card-hint`, `.lyric-style-desc`) en los paneles de color general, estilos de letra y avisos, optimizando la altura útil del modal.
  - Normalización de mayúsculas a *sentence casing* ("Letra original", "Texto alternativo (romaji)", "Sílaba activa (resaltada)", "Sílabas anteriores", "Aviso de éxito", "Aviso informativo", "Alerta de error").
  - Estilización y mejora de tarjetas de selección de temas en CSS (`293fd22`).
- [x] **12.11. Eliminación de Avisos No Críticos y Simplificación de Alertas en Temas:**
  - Supresión integral de notificaciones informativas y de éxito al crear, editar, eliminar, copiar, traducir o exportar en toda la aplicación (`songMenuView.js`, `songEditorView.js`, `playlistModal.js`, `videoManagerModal.js`, `themeSettingsModal.js`), manteniendo activas únicamente las alertas críticas de error (`type === 'error'`).
  - Simplificación del apartado de temas globales (`themeSettingsModal.js`) y temas por canción (`songEditorView.js`), removiendo la configuración de colores de avisos de éxito e informativos y conservando únicamente la personalización de la alerta de error (`alertErrorColor`).

---

## Tareas Pendientes / Por Hacer
- [ ] **12.7. Animación sutil de pulso en sílaba activa:** Opción configurable para activar un resplandor pulsante suave al cantar cada sílaba.
