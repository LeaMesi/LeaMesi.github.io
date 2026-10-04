# Tareas: Pruebas Automatizadas y Pipeline CI/CD
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0009-testing-and-ci-cd/spec.md)

---

## Tareas Completadas

- [x] **19.1. Infraestructura y Configuración de Pruebas:**
  - Configurar Vitest, happy-dom, fake-indexeddb y archivo de setup global `tests/setup.js`.
- [x] **19.2. Pruebas de Núcleo Lírico y Tiempos:**
  - Suites para `timing`, `syllablesHelper`, `languageManager`, `sync` y `transliterationHelper`.
- [x] **19.3. Pruebas de Reproducción y Multimedia:**
  - Suite integral para `mediaPlayer.js` con offsets, extractor universal de YouTube y autoplay.
- [x] **19.4. Pruebas de Servicios, Persistencia e Intercambio:**
  - Suites para `schemaValidator`, `db_and_songService`, `shareService`, `lyricsfileService`, `themeService`, `libraryService`, `playlistService` y `onlineLyricsService`.
- [x] **19.5. Pruebas de Vistas e Interfaz:**
  - Suites para `icons`, `basicViewer`, `controlsView`, `songMenuView`, `songEditorView`, `playlistModal`, `floatingPlayerView` y modales.
- [x] **19.6. Verificación de Suites Integrales:**
  - 26 suites de prueba y 282 pruebas automatizadas ejecutadas y pasando al 100%.
- [x] **25.1 - 25.3. Despliegue en GitHub Pages y Automatización CI/CD:**
  - `gh-pages` en `package.json`, workflow en `.github/workflows/deploy.yml` ejecutando tests, build y deploy automático.

---

## Tareas Pendientes / Por Hacer
- [ ] **19.7. Cobertura de Código en Pipeline:** Integrar comando `vitest run --coverage` en el flujo de GitHub Actions con reporte de umbral mínimo del 90%.
