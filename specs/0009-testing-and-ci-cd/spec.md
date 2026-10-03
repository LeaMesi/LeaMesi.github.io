# Especificación: Pruebas Automatizadas y Pipeline CI/CD
**Código:** `0009-testing-and-ci-cd`  
**Estado:** Estable / En Producción  
**Versión:** 1.0.0

---

## 1. Principio Constitucional de Calidad
Toda lógica pura, cálculo de tiempos, silabeo, persistencia y componentes de interfaz deben contar con pruebas automatizadas en **Vitest**. Ningún cambio de código se considera terminado si las pruebas no pasan al 100% (`npm test`) o si la compilación de Vite (`npm run build`) produce advertencias o errores.

---

## 2. Infraestructura de Pruebas
1. **Runner y Entorno:** Vitest configurado con entorno `happy-dom` en `vite.config.js`.
2. **Setup y Aislamiento (`tests/setup.js`):**
   - Emulación de IndexedDB en memoria mediante `fake-indexeddb/auto`.
   - Mocks de APIs de navegador (`URL.createObjectURL`, `URL.revokeObjectURL`, `requestAnimationFrame`).
   - Limpieza automática de `localStorage` y bases de datos antes de cada suite.

---

## 3. Organización de la Suite de Pruebas
- **`tests/lyrics/`:** Tiempos (`timing.test.js`), silabeo fonético (`syllablesHelper.test.js`), gestor de idiomas (`languageManager.test.js`), sincronización (`sync.test.js`) y Romaji (`transliterationHelper.test.js`).
- **`tests/player/`:** Reproductor multimedia híbrido, extractor de YouTube, volumen y offsets (`mediaPlayer.test.js`).
- **`tests/services/`:** Validación de esquemas (`schemaValidator.test.js`), IndexedDB (`db_and_songService.test.js`), exportación e importación (`shareService.test.js`), Lyricsfile YAML (`lyricsfileService.test.js`), bibliotecas (`libraryService.test.js`), playlist (`playlistService.test.js`), temas (`themeService.test.js`) y búsqueda online (`onlineLyricsService.test.js`).
- **`tests/views/`:** Iconos SVG (`icons.test.js`), modo básico (`basicViewer.test.js`), dock de controles (`controlsView.test.js`), menú de canciones (`songMenuView.test.js`), editor (`songEditorView.test.js`), playlist modal (`playlistModal.test.js`), reproductor flotante (`floatingPlayerView.test.js`) y modales.

---

## 4. Pipeline de Despliegue Continuo (CI/CD con GitHub Actions)
Archivo de configuración: `.github/workflows/deploy.yml`
1. **Disparador:** Automático en cada `git push` a la rama `main` o manual mediante `workflow_dispatch`.
2. **Pasos de Ejecución:**
   1. Checkout del código con `actions/checkout@v4`.
   2. Configuración de Node.js 20 con caché de dependencias npm (`actions/setup-node@v4`).
   3. Instalación limpia de dependencias con `npm ci`.
   4. Ejecución de la suite completa de pruebas con `npm test`.
   5. Compilación de artefactos estáticos con `npm run build` (`base: '/'`).
   6. Publicación del directorio `dist/` en la rama `gh-pages` mediante `peaceiris/actions-gh-pages@v4`.
