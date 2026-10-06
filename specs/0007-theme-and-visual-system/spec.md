# Especificación: Sistema Visual, Iconografía SVG y Configuración de Temas
**Código:** `0007-theme-and-visual-system`  
**Estado:** Estable / En Producción  
**Versión:** 1.0.0

---

## 1. Principios de Diseño Visual y Bajo Ruido
1. **Erradicación de Emojis en la UI:** Cero emojis en la interfaz de usuario. Los elementos gráficos se limitan exclusivamente a zonas funcionales interactivas mediante iconos vectoriales SVG limpios (`stroke="currentColor"`).
2. **Biblioteca Centralizada de Iconos (`src/views/icons.js`):** Iconos vectoriales inline geométricos, accesibles y adaptables al color del contexto sin requerir fuentes pesadas. Para acciones musicales clave como el acceso a Modo Letra, se incorpora un glifo de micrófono de alta precisión (`iconMic` con `viewBox: "0 0 340 340"`) y se enlaza la hoja de estilos de Font Awesome 6.5.2 en `index.html`.

---

## 2. Personalización de Temas (`src/services/themeService.js`)
1. **Los 4 Colores Base de la Interfaz:**
   - Fondo general (`--bg-color`).
   - Paneles y barras (`--panel-bg`).
   - Botones y acentos principales (`--primary-color`).
   - Texto base (`--text-main`).
2. **Controles Tipográficos y de Escala:**
   - Sliders de escala (50% a 200%) para letra original (`--lyrics-scale`), traducción (`--translation-scale`) y texto alternativo (`--lyrics-alt-scale`).
   - Conmutadores independientes para negrita, cursiva y efecto resplandor (glow).
3. **Colores de Seguimiento Silábico:**
   - Letra inactiva / pendiente (`--text-inactive`).
   - Sílaba activa / en canto (`--lyrics-active-color`).
   - Sílabas anteriores / ya cantadas (`--lyrics-completed-color`).
4. **Catálogo de Presets:** 5 temas diseñados (*Predeterminado Oscuro*, *Cyberpunk Neón*, *Bosque Esmeralda*, *Atardecer Cálido*, *Minimalista Claro*), detección de tema personalizado y restauración de fábrica.
5. **Persistencia e Intercambio:** Persistencia en `localStorage` (`saranga_theme_settings`), con exportación e importación de archivos `saranga-theme-settings.json`.

---

## 3. Adaptación Responsive Móvil Integral (`src/style.css`)
- **Safe Areas:** Variables CSS `--safe-top`, `--safe-bottom`, etc. adaptadas a notches e islas dinámicas (`viewport-fit=cover`).
- **Móvil Vertical:** Tipografía fluida `clamp()`, dock en 2 filas limpias, botones táctiles $\ge 44\text{px}$ y modales `95vw` / `90dvh`.
- **Móvil Horizontal:** Dock ultra-delgado ($48\text{px}$), asistente de audio compacto fijado arriba y modales `96vw` / `94dvh`.
- **Modo Inmersivo:** Botón para colapsar el dock inferior y botón flotante discreto de expansión.

---

## 4. Temas Visuales Personalizados por Canción
1. **Configuración en el Editor (`songEditorView.js`):**
   - Apartado interactivo situado entre metadatos y letras (`#editor-theme-details`).
   - Permite personalizar los 4 colores de interfaz, 3 sliders de escala de fuentes, estilos de versos (original, alt, traducción, activa con brillo y completadas), 3 colores de cuadros de aviso y presets rápidos con opción de copiar el tema global.
   - Almacenamiento en `currentSong.lyrics_data.customTheme` con persistencia automática en IndexedDB y exportación/importación en paquetes JSON (`song-package.json`).
2. **Aplicación Dinámica en Modo Letra (`main.js`):**
   - Al entrar al Modo Letra de una canción con tema personalizado, se aplica de inmediato su combinación cromática y tipográfica.
   - Al regresar al menú o editor, se restaura inmediatamente el tema global del usuario.
3. **Preferencia Global de Activación (`themeSettingsModal.js`):**
   - Opción `enableSongThemes` configurable en la modal de temas, activa por defecto (`true`), que permite al usuario decidir si desea habilitar o deshabilitar la aplicación de temas propios de canciones en favor del tema global.
