# Tareas: Editor de Canciones y Herramientas de Tiempo
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0004-song-editor-timing-tools/spec.md)

---

## Tareas Completadas

- [x] **7.1. Vista y Controlador del Editor (`src/views/songEditorView.js`):**
  - Creación y edición con guardado directo en IndexedDB y botón "Probar en Modo Letra".
- [x] **7.2. Escritura por Frases y Tiempos:**
  - Agregar, reordenar, preescucha puntual e importación rápida de letra completa.
- [x] **7.3. Tiempos por Sílabas y Silabeo Automático:**
  - Separación fonética, chips de sílabas y distribución proporcional.
- [x] **7.4. Gestión Multilingüe en el Editor:**
  - Pestañas con designación de principal/traducción, clonación de tiempos y edición de metadatos de idioma.
- [x] **7.6. Normalización de Inputs Numéricos de Tiempo:**
  - Eliminación de flechas nativas y fondos blancos con `appearance: textfield`.
- [x] **7.7. Reloj Maestro en Vivo con Milisegundos:**
  - Actualización reactiva de reloj `mm:ss.mmm` con números tabulares sin desfases.
- [x] **10.1. Borrado de Sílabas por Frase Individual:**
  - Botón de vaciado de sílabas preservando texto y marcas de inicio/fin.
- [x] **10.2. Borrado Masivo de Sílabas con Confirmación Previa:**
  - Botón con confirmación obligatoria mediante `window.confirm` y contador dinámico.
- [x] **20.1. Reubicación de Botones de Exportación:**
  - Botones de exportar JSON y YAML trasladados al encabezado del editor para mayor coherencia.

---

## Tareas Pendientes / Por Hacer
- [ ] **7.8. Zoom en la línea de tiempo de frases:** Permitir ampliar o contraer la vista de versos para mayor comodidad en pantallas táctiles o teclados reducidos.
