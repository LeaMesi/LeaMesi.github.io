# Tareas: Arquitectura Base, Modelo de Datos y Persistencia Local
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0001-core-architecture-storage/spec.md)

---

## Tareas Completadas

- [x] **0.1. Compatibilidad con GitHub Pages:**
  - Configurar `vite.config.js` con `base: '/'` adecuado para despliegue de usuario raíz `LeaMesi.github.io`.
- [x] **0.2. Entorno y Repositorio Git:**
  - Configurar `.gitignore` para dependencias, artefactos y variables de entorno.
- [x] **1.1. Modelo Conceptual Relacional:**
  - Diseñar el esquema relacional (`artists`, `songs`, `tags`, `genres`, `song_tags`, `song_genres`).
  - Separar conceptualmente `metadata`, `basic` (`lyrics_data`) y `advanced` (`visuals_data`).
- [x] **1.2. Definición de Schemas JSON para Validación e Intercambio:**
  - Implementar `src/services/schemaValidator.js` para validar la estructura del paquete `song-package.json`.
- [x] **1.3. Especificación de Compatibilidad con Estándar `lyricsfile`:**
  - Diseñar mapeo bidireccional YAML 1.0 en `src/services/lyricsfileService.js`.
- [x] **1.4. Canciones por Defecto del Sistema:**
  - Crear `src/data/defaultSongs.js` y `src/data/mockSong.js` con "Still Alive" e "Idol" con soporte multilingüe completo.
- [x] **2.1. Adaptador de Base de Datos Local (`src/services/db.js`):**
  - Inicializar IndexedDB (`SarangaDB` v2/v3) con stores estructurados y migración controlada.
  - Implementar sembrado único persistido en `localStorage` y `settings` sin reaparición de canciones eliminadas.
- [x] **2.2. Repositorio de Canciones (`src/services/songService.js`):**
  - Métodos CRUD completos con joins lógicos (`fetchSongById`, `saveSong`, `listSongs`, `deleteSong`, `addTranslationToSong`).
- [x] **2.3. Motor de Exportación e Importación JSON (`src/services/shareService.js`):**
  - `exportSongPackage(songId)` e `importSongPackage(data)`.
  - `exportLibraryBackup()` e `importLibraryBackup()` para respaldo completo.
- [x] **2.4. Adaptador de Estándar `lyricsfile` (`src/services/lyricsfileService.js`):**
  - Parser seguro de YAML 1.0, conversor de milisegundos a segundos y generador inverso.
- [x] **18.1. Normalización Universal de Esquemas:**
  - Enriquecer `validateSongPackage` para soportar simultáneamente formato empaquetado y entidad directa.
- [x] **18.2. Ensamblado Dual de Paquetes en Proveedores:**
  - Generar paquetes con propiedades raíz y anidadas (`metadata`, `basic`).

---

## Tareas Pendientes / Por Hacer
- [ ] **1.5. Compresión opcional de paquetes de exportación:** Permitir exportar archivos `.json.gz` para paquetes grandes con carátulas embebidas.
- [ ] **1.6. Migrador automático de esquemas:** Mecanismo de actualización transparente si se incrementa la versión de `song-package.json`.
