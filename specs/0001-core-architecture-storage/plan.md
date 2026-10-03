# Plan Futuro: Arquitectura Base y Persistencia
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0001-core-architecture-storage/spec.md)

---

## 1. Soporte de Archivos de Audio Locales Persistidos en IndexedDB
* **Objetivo:** Permitir al usuario arrastrar o seleccionar archivos de audio locales (`.mp3`, `.ogg`, `.wav`, `.flac`) y guardarlos como `Blob` dentro de un almacén dedicado en IndexedDB (`audio_blobs`).
* **Justificación:** Actualmente las canciones dependen de videos de YouTube o rutas de audio relativas. Con almacenamiento de Blobs locales, las canciones con archivos de audio propios funcionarán 100% offline sin servidor externo.
* **Componentes Afectados:**
  - `src/services/db.js`: Nuevo almacén de objetos `audio_blobs` (`keyPath: 'song_id'`).
  - `src/services/songService.js`: Funciones `saveAudioBlob(songId, blob)` y `getAudioBlob(songId)`.
  - `src/services/shareService.js`: Opción de exportar paquete con audio codificado en Base64 o empaquetado en archivo zip.
