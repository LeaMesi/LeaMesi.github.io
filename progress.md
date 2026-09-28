# Estado del Desarrollo: SarangaBaranga (`proy-letras`)

> **Estado Global:** Arquitectura reorientada a **Persistencia Local en Navegador (IndexedDB)** y compartición mediante **Exportación/Importación JSON**. Enfoque activo en **Modo Sencillo / Básico**.  
> **Última actualización:** 2026-09-28  
> **Plataforma:** SPA Estática (GitHub Pages) + IndexedDB Local & Export/Import JSON (+ Catálogo Opcional Supabase Read-Only a futuro)

---

## 1. Decisiones Arquitectónicas y Configuración de Datos

* **Persistencia 100% Local en el Navegador (IndexedDB):**
  * Para evitar la necesidad de autenticación de usuarios (login) y un backend que valide subidas públicas, los datos se almacenan directamente en el navegador del cliente.
  * Se mantiene de forma íntegra el esquema relacional estructurado previamente diseñado:
    * `artists`: Catálogo de artistas.
    * `songs`: Registro principal con `audio_path`, `lyrics_data` (JSON con marcas de tiempo, sílabas y estilos) y `visuals_data` (JSON con efectos GSAP/PixiJS).
    * `tags` y `genres`: Tablas de categorización normalizadas.
    * `song_tags` y `song_genres`: Relaciones N:M.
* **Intercambio Comunitario sin Servidor (Export / Import JSON):**
  * Cada canción puede exportarse como un paquete unificado `song-package.json` para compartirse fácilmente entre usuarios.
  * La aplicación cuenta con un importador que valida la estructura JSON y la almacena en el IndexedDB local del destinatario.
* **Soporte Multilingüe y Traducciones Ilimitadas:**
  * Cada canción puede albergar un número arbitrario de pistas lingüísticas en `lyrics_data.languages`.
  * Un idioma se designa como principal (`isMain: true`), representando la interpretación original, mientras los demás operan como traducciones (`isMain: false`).
  * Soporte diseñado para conmutación de idioma y modo bilingüe simultáneo (letra principal con guía de canto y traducción debajo como subtítulo sincronizado).
* **Interoperabilidad con Estándar Abierto `lyricsfile` (YAML 1.0):**
  * Compatibilidad con la especificación de [tranxuanthang/lyricsfile](https://github.com/tranxuanthang/lyricsfile/blob/main/SPECIFICATION.md).
  * Permite importar archivos `.lyricsfile.yaml` (como canciones nuevas o como pistas de traducción adicionales) y exportar cualquier idioma a este formato abierto.
* **Integración Futura con Supabase (Catálogo Solo Lectura):**
  * Supabase se pospone para una etapa posterior y se utilizará exclusivamente en modo **Read-Only** para distribuir un catálogo curado por el autor, sin escritura abierta en el cliente.
* **Mecanismo de Reproducción y Reloj Maestro:**
  * Soporte para **YouTube IFrame API** (alternancia oficial / instrumental conservando `currentTime`) y audio nativo HTML5 (archivos locales o URLs).
* **Despliegue Estático:**
  * Configuración para GitHub Pages sin servidor (`usuario.github.io`).

---

## 2. Estado Actual de la Implementación (Código Fuente)

| Módulo / Funcionalidad | Estado | Descripción |
| :--- | :--- | :--- |
| **Modelo de Datos Relacional** | 🟢 Definido | Esquema de entidades (`songs`, `artists`, `tags`, `genres`) adaptado a IndexedDB con soporte multilingüe en `lyrics_data`. |
| **Soporte Multilingüe y Traducciones** | 🟢 Diseñado | Estructura en `languages` con indicador `isMain`, traducciones ilimitadas y renderizado bilingüe especificados. |
| **Adaptador Lyricsfile 1.0 (.lyricsfile.yaml)** | 🟢 Diseñado | Mapeo bidireccional entre la especificación YAML 1.0 de `tranxuanthang/lyricsfile` y el formato interno de SarangaBaranga. |
| **Entorno y Compilación** | 🟢 Operativo | Vite 8 compilando correctamente (`npm run build`). |
| **Memory Bank** | 🟢 Actualizado | [`specs.md`](file:///home/hezztia/Documents/SarangaBaranga/specs.md), [`design.md`](file:///home/hezztia/Documents/SarangaBaranga/design.md), [`progress.md`](file:///home/hezztia/Documents/SarangaBaranga/progress.md), [`task.md`](file:///home/hezztia/Documents/SarangaBaranga/task.md) y [`GEMINI.md`](file:///home/hezztia/Documents/SarangaBaranga/GEMINI.md) alineados. |
| **Base de Datos Local (IndexedDB)** | 🔴 Pendiente | Falta crear `src/services/db.js` y `src/services/songService.js` con soporte para CRUD y relaciones. |
| **Motor Export / Import JSON** | 🔴 Pendiente | Falta crear `src/services/shareService.js` para exportar e importar canciones en JSON (con todas sus traducciones). |
| **Servicio Lyricsfile (YAML)** | 🔴 Pendiente | Falta implementar `src/services/lyricsfileService.js` para parsear y exportar archivos `.lyricsfile.yaml`. |
| **Adaptador de Audio / YouTube** | 🔴 Pendiente | Falta implementar el reproductor con soporte para YouTube IFrame API y audio local HTML5. |
| **Modo Básico (Letra y Sílabas)** | 🔴 Pendiente | Falta implementar el componente de renderizado de versos, selección de idioma y animación por sílabas (karaoke). |
| **Cálculo de Tiempos / BPM** | 🔴 Pendiente | Falta la función de conversión de BPM y compases a segundos relativos. |
| **Modo Avanzado (Pixi.js / FX)** | ⚪ Pospuesto | Diseñado arquitectónicamente (`visuals_data`), pero aplazado deliberadamente hasta completar el Modo Básico. |
| **Catálogo Supabase (Read-Only)** | ⚪ Pospuesto | Pospuesto para una fase futura como catálogo público de sólo lectura administrado por el creador. |

---

## 3. Próximo Hito Prioritario

**Construcción de la Persistencia Local, Export/Import, Adaptador Lyricsfile y Núcleo del Modo Sencillo:**
1. Crear el servicio de base de datos local IndexedDB (`src/services/db.js`) y el repositorio de canciones (`src/services/songService.js`).
2. Crear el motor de exportación e importación de paquetes JSON (`src/services/shareService.js`) con soporte multilingüe.
3. Crear el adaptador de archivos `.lyricsfile.yaml` (`src/services/lyricsfileService.js`) para importar/exportar según el estándar abierto.
4. Implementar el reproductor multimedia (YouTube IFrame API y audio HTML5 local).
5. Crear el motor de sincronización de texto, idiomas y sílabas en pantalla (`lyrics_data.languages`).
6. Permitir configurar y personalizar colores de fuente, traducción y fondo.
