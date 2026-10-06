# Roadmap y Tareas de Desarrollo: SarangaBaranga (`proy-letras`)

> **Organización Modular:** Las tareas del proyecto se encuentran organizadas y distribuidas en subcarpetas dentro de [`specs/`](file:///home/hezztia/Documents/SarangaBaranga/specs/).  
> Cada subcarpeta contiene su archivo individual [`tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0001-core-architecture-storage/tasks.md) para registrar de forma precisa las tareas completadas y pendientes, además de su correspondiente [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0001-core-architecture-storage/spec.md) y [`plan.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0001-core-architecture-storage/plan.md).

---

## Índice General de Tareas por Especificación

| Especificación | Tareas Asociadas | Enlace a Tareas | Estado |
| :--- | :--- | :--- | :--- |
| **0001-core-architecture-storage** | Configuración de entorno, modelo relacional IndexedDB, paquete JSON, estándar Lyricsfile YAML y canciones por defecto. | [`specs/0001-core-architecture-storage/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0001-core-architecture-storage/tasks.md) | 🟢 Operativo |
| **0002-master-clock-audio** | Reproductor híbrido YouTube invisible y HTML5, bucle Master Clock RAF, soporte multi-video con offsets, volumen maestro y seek slider sin congelamiento. | [`specs/0002-master-clock-audio/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0002-master-clock-audio/tasks.md) | 🟢 Operativo |
| **0003-lyrics-engine-basic-mode** | Cálculo de BPM y tiempos, gestor multilingüe, silabeo fonético, transliteración Hepburn a Romaji, visualizador centrado con letras sueltas y frases siguientes (0 a 3). | [`specs/0003-lyrics-engine-basic-mode/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0003-lyrics-engine-basic-mode/tasks.md) | 🟢 Operativo |
| **0004-song-editor-timing-tools** | Editor interactivo de canciones y letras, asistente de audio en vivo con reloj `mm:ss.mmm`, resaltado reactivo en tiempo real de verso y sílaba activa con el color del tema, inputs limpios, guía de referencia original para traducción y borrado de sílabas por frase o masivo. | [`specs/0004-song-editor-timing-tools/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0004-song-editor-timing-tools/tasks.md) | 🟢 Operativo |
| **0005-catalog-libraries-playlist** | Menú con vista dual (cuadrícula/lista), organización en bibliotecas N:M con resolución de conflictos, playlist dinámica con auto-avance y reproductor flotante mini. | [`specs/0005-catalog-libraries-playlist/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0005-catalog-libraries-playlist/tasks.md) | 🟢 Operativo |
| **0006-online-lyrics-search** | Búsqueda simultánea en BetterLyrics, LRC.red, LRCLIB y Genius con tope de 6 por fuente, layout adaptativo móvil/PC y pestaña dedicada de importación desde YouTube / YouTube Music (videos y playlists sin letras y sin API keys). | [`specs/0006-online-lyrics-search/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0006-online-lyrics-search/tasks.md) | 🟢 Operativo |
| **0007-theme-and-visual-system** | Catálogo de iconos SVG (cero emojis), personalización de 4 colores de UI, colores de sílabas cantadas, escala de fuentes, temas visuales por canción (con toggle global y editor integrado) y adaptación responsive móvil/desktop. | [`specs/0007-theme-and-visual-system/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0007-theme-and-visual-system/tasks.md) | 🟢 Operativo |
| **0008-advanced-visual-mode** | Escenario gráfico aislado con Pixi.js/WebGL y despachador de eventos visuales (segunda etapa). | [`specs/0008-advanced-visual-mode/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0008-advanced-visual-mode/tasks.md) | 🟡 En Desarrollo |
| **0009-testing-and-ci-cd** | Suite de pruebas unitarias y de integración con Vitest (30 suites, 350 tests al 100%) y pipeline automatizado en GitHub Actions. | [`specs/0009-testing-and-ci-cd/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0009-testing-and-ci-cd/tasks.md) | 🟢 Operativo |

---

## Próximos Hitos Prioritarios Globales

1. **Grabación de marcas de tiempo al vuelo ("Tap to sync")**: Ver plan detallado en [`specs/0004-song-editor-timing-tools/plan.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0004-song-editor-timing-tools/plan.md).
2. **Soporte de archivos de audio locales en IndexedDB (Blobs)**: Ver plan detallado en [`specs/0001-core-architecture-storage/plan.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0001-core-architecture-storage/plan.md).
3. **Puntos guía rítmicos previos a estrofas**: Ver plan detallado en [`specs/0003-lyrics-engine-basic-mode/plan.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0003-lyrics-engine-basic-mode/plan.md).
4. **Intérprete completo de efectos para Modo Avanzado**: Ver plan detallado en [`specs/0008-advanced-visual-mode/plan.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0008-advanced-visual-mode/plan.md).
