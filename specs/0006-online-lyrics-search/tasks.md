# Tareas: Búsqueda de Canciones Online Multi-Motor
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0006-online-lyrics-search/spec.md)

---

## Tareas Completadas

- [x] **9.3 - 9.4. Integración BetterLyrics y Flujo al Editor:**
  - Cliente HTTP, parser TTML/LRC, traducción automática y modal de búsqueda.
- [x] **11.1 - 11.2. Búsqueda Multi-Modo en BetterLyrics:**
  - Búsqueda solo por artista con filtro 100%, artista y título exacto, enlace YouTube y pills de filtro.
- [x] **14.1 - 14.4. Orquestador Maestro y Modal Unificado (Genius y LRCLIB):**
  - Servicios de LRCLIB y Genius, búsqueda concurrente `Promise.allSettled` y modal con pestañas dedicadas.
- [x] **21.1 - 21.3. Integración de LRC.red y Límite de 6 Resultados:**
  - Servicio LRC.red (29M canciones), límite de 6 en búsqueda unificada y sin recorte en individuales.
- [x] **21.5. Ciclo de Vida y Resiliencia en Importación:**
  - Bloque `finally` en `handleSelectSong` restableciendo estado para permitir cargas consecutivas.
- [x] **28.1 - 28.3. Layout Adaptativo y Botón Flotante de Retorno:**
  - Detección de espacio útil para `.layout-scroll-controls` vs `.layout-fixed-controls` y botón flotante `#btn-online-scroll-top`.
- [x] **28.4. Integridad Visual Móvil y Prevención de Solapamiento:**
  - Fijación con `flex-shrink: 0 !important`, altura mínima `min-height: 44px` y aislamiento con `z-index: 2` en `.online-providers-bar` y `.online-inputs-container`, evitando la compresión vertical por flexbox al cargar resultados en pantallas móviles.
- [x] **29.2. Botón de Importación en Cabecera de Búsqueda Online:**
  - Integración del botón de importar (`#btn-modal-import`) a la izquierda del botón de creación vacía (`#btn-modal-create-empty`), provisto únicamente de icono SVG (`iconUpload`) sin texto, con input de archivo oculto para `.json`, `.yaml` y `.yml`, integrando `importUniversalFile` y cerrando el modal tras una importación exitosa.

---

## Tareas Pendientes / Por Hacer
- [ ] **14.8. Historial de búsquedas recientes:** Recordar las últimas 5 búsquedas en `localStorage` con chips para reintentar con 1 clic.
