# Tareas: Motor de Sincronización Lírica y Modo Básico
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0003-lyrics-engine-basic-mode/spec.md)

---

## Tareas Completadas

- [x] **4.1. Calculador de Tiempos y BPM (`src/lyrics/timing.js`):**
  - Soporte de compases, BPM, segundos y formateo `mm:ss.mmm`.
- [x] **4.2. Gestor de Idiomas y Traducciones (`src/lyrics/languageManager.js`):**
  - Gestión de pista principal y colección ilimitada de traducciones.
- [x] **4.3. Motor de Sincronización Multilingüe (`src/lyrics/sync.js`):**
  - Detección de líneas activas y estados silábicos en tiempo real con soporte bilingüe.
- [x] **4.4. Componente de Visualización Enfocado (`src/views/basicViewer.js`):**
  - Escenario centrado con letra suelta y frases siguientes interactivas con salto temporal.
- [x] **4.5. Resaltado Fiel de Sílabas y Palabras:**
  - Concatenación contigua inline (`join('')`) sin inserción de espacios falsos.
- [x] **4.6. Subtítulo de Traducción en Cursiva:**
  - Visualización del texto traducido en cursiva con `--translation-color`.
- [x] **4.7. Personalización de Estilo Básico:**
  - Inyección de variables CSS según la configuración de la canción o preferencias de usuario.
- [x] **13.1 - 13.3. Configuración Flexible de Previsualización (0 a 3 Frases):**
  - Soporte de 0 frases siguientes, ocultamiento de contenedor inferior y persistencia en `localStorage`.
- [x] **17.1 - 17.4. Soporte Integral de Texto Alternativo (Romaji / Fonetismo):**
  - Renderizado sincronizado en 3 capas (Original, AltText, Traducción) y selector de escritura (`both`, `original`, `alt`).
- [x] **22.1 - 22.4. Transliteración Automática a Romaji para Japonés:**
  - Diccionario de kanjis y palabras embebido (`kanjiDict.js`), motor Hepburn y enriquecimiento automático.
- [x] **23.2 - 23.3. Preservación y Reconstrucción de Espacios en Romaji:**
  - Algoritmo `getSyllableAltTextsWithSpacing` para erradicar aglutinación fonética y preservar espacios finales.
- [x] **13.4. Calibración en Caliente de Offset en el Popover de Configuración:**
  - Controles `-0.1s` y `+0.1s` integrados directamente en el menú de configuración de Modo Letra con display central numérico, permitiendo sincronizar la letra de inmediato sin pausar la canción.
- [x] **13.5. Separador Visual y Formato Limpio de Offset en el Popover de Configuración:**
  - Inserción de divisor horizontal (`<hr>`) entre la sección de calibración de video y los controles de visualización de frases.
  - Formateo conciso del valor de offset en las opciones del selector de video (`[${off}s]`), simplificando la lectura en la interfaz.

---

## Tareas Pendientes / Por Hacer
- [ ] **4.8. Soporte de marcadores de conteo (lead-in dots):** Mostrar 3 puntos luminosos para marcar el tempo de entrada antes de versos que inician tras una pausa larga.
