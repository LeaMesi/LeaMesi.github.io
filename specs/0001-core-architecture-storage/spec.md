# Especificación: Arquitectura Base, Modelo de Datos y Persistencia Local
**Código:** `0001-core-architecture-storage`  
**Estado:** Estable / En Producción  
**Versión:** 1.0.0

---

## 1. Visión y Principios Arquitectónicos
1. **Zero-Backend (Client-Only):** Aplicación estática SPA construida con Vanilla JS y Vite, sin servidor backend propio ni sistema de autenticación de usuarios.
2. **Persistencia Local Soberana:** Todos los datos (canciones, artistas, géneros, etiquetas, relaciones y configuraciones) residen en el navegador del usuario a través de **IndexedDB** (`SarangaDB`).
3. **Intercambio Comunitario sin Servidor:** Portabilidad de contenido mediante importación y exportación de paquetes JSON nativos (`song-package.json`) y archivos de respaldo completo.
4. **Interoperabilidad con Estándar Abierto Lyricsfile:** Mapeo bidireccional con la especificación YAML 1.0 ([tranxuanthang/lyricsfile](https://github.com/tranxuanthang/lyricsfile/blob/main/SPECIFICATION.md)).

---

## 2. Modelo Relacional en IndexedDB (`SarangaDB` v3)
El servicio de almacenamiento `src/services/db.js` y el repositorio `src/services/songService.js` administran los siguientes Object Stores:

| Almacén | Clave Primaria (`keyPath`) | Índices | Descripción |
| :--- | :--- | :--- | :--- |
| `artists` | `id` (autoincrement) | `name` | Catálogo de artistas e intérpretes. |
| `songs` | `id` (autoincrement) | `title`, `artist_id` | Registro de canciones con `lyrics_data`, `visuals_data`, `audio_path`, `videos`. |
| `tags` | `id` (autoincrement) | `name` | Etiquetas descriptivas normalizadas. |
| `genres` | `id` (autoincrement) | `name` | Géneros musicales normalizados. |
| `song_tags` | `id` (autoincrement) | `song_id`, `tag_id` | Relación N:M entre canciones y etiquetas. |
| `song_genres` | `id` (autoincrement) | `song_id`, `genre_id` | Relación N:M entre canciones y géneros. |
| `libraries` | `id` (autoincrement) | `name`, `created_at` | Agrupaciones / playlists de canciones. |
| `song_libraries` | `id` (autoincrement) | `song_id`, `library_id`, `[song_id, library_id]` | Relación N:M entre canciones y bibliotecas. |
| `settings` | `key` | - | Parámetros clave-valor de configuración y control de sembrado. |

---

## 3. Separación Modular de Datos
Cada canción divide su estructura conceptual en tres capas independientes:
1. **`metadata`:** `title`, `artist`, `genres`, `tags`, `audio_path`, y colección dinámica de `videos` (`[{ id, name, url, offset }]`).
2. **`basic` (`lyrics_data`):** Sincronización lírica (BPM, compás, timestamps), colección multilingüe `languages` (con un idioma `isMain: true` y traducciones `isMain: false`), líneas, sílabas y estilos básicos.
3. **`advanced` (`visuals_data`):** Línea de tiempo de efectos de fondo, partículas y transiciones visuales (GSAP / PixiJS).

---

## 4. Normalización Universal de Paquetes (`src/services/schemaValidator.js`)
El validador procesa tanto paquetes empaquetados (`{ version, metadata, basic, advanced }`) como entidades directas de base de datos (`{ id, title, artist, ... }`), garantizando que la salida contenga ambas representaciones para evitar incompatibilidades o fallos de lectura (`metadata.title`).

---

## 5. Control de Sembrado Inicial (Default Songs)
En la primera visita del usuario, el sistema inicializa las canciones por defecto ("Still Alive" e "Idol") desde `src/data/defaultSongs.js`, registrando la versión de sembrado en `localStorage` y en el almacén `settings`. Si el usuario elimina estas canciones, la persistencia garantiza que **nunca se vuelvan a sembrar** automáticamente.
