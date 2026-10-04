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
  - Inclusión de Font Awesome 6.5.2 en `index.html` para soporte tipográfico y de recursos iconográficos complementarios.

---

## Tareas Pendientes / Por Hacer
- [ ] **12.7. Animación sutil de pulso en sílaba activa:** Opción configurable para activar un resplandor pulsante suave al cantar cada sílaba.
