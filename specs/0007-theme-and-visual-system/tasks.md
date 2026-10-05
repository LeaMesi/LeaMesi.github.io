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

---

## Tareas Pendientes / Por Hacer
- [ ] **12.7. Animación sutil de pulso en sílaba activa:** Opción configurable para activar un resplandor pulsante suave al cantar cada sílaba.
