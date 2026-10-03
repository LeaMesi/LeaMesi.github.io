# Especificaciones del Proyecto: SarangaBaranga (`proy-letras`)

> **Estado del Proyecto:** Definición funcional refinada. Enfoque prioritario en **Modo Básico / Sencillo** y **Persistencia Local en Navegador**.  
> **Arquitectura de Despliegue:** Single Page Application (SPA) estática (preparada para `usuario.github.io` / GitHub Pages) con almacenamiento local en el navegador (IndexedDB) y soporte de Exportación/Importación de creaciones en JSON.  
> **Nombre del Paquete:** `proy-letras`

---

## 1. Resumen y Visión del Proyecto

**SarangaBaranga** es una aplicación web multimedia e interactiva para la creación, configuración y reproducción sincronizada de **letras de canciones y karaoke**. 

La aplicación está diseñada para operar como una SPA estática alojada en GitHub Pages sin necesidad de backend propio ni sistema de autenticación/login de usuarios. Todos los datos (canciones, artistas, etiquetas, géneros, letras y estilos) se **almacenan directamente en el navegador del usuario (IndexedDB)**, preservando el modelo de datos relacional y modular previamente diseñado.

Para facilitar la colaboración y el intercambio entre la comunidad sin requerir un servidor centralizado que verifique contenido, el sistema incorpora capacidades de **Exportación e Importación de canciones en formato JSON**. De este modo, los usuarios pueden crear sus canciones localmente, exportarlas en un archivo y compartirlas fácilmente con otras personas para que las importen en sus propios navegadores.

El reproductor musical admite enlaces a **videos de YouTube y canciones de YouTube Music (`music.youtube.com`)** (permitiendo asociar múltiples videos y pistas con offsets de sincronización individuales) así como archivos de audio locales o remotos, con control maestro de volumen y silenciado. Además, la aplicación se conecta con la API abierta de **BetterLyrics y Unison** para permitir la búsqueda instantánea de canciones sincronizadas con sílabas y traducciones automáticas desde la pantalla de inicio, precargándolas de forma inmediata en el editor de canciones.


---

## 2. Los Dos Modos de la Aplicación

La interfaz permite a los usuarios alternar entre dos modos de experiencia según sus preferencias de visualización y rendimiento:

### 2.1. Modo Sencillo / Básico (Prioridad Actual)
Enfocado exclusivamente en la lectura, práctica vocal y canto sin distracciones visuales complejas:
* **Avance de Letra Sincronizada:** Las estrofas y versos avanzan en pantalla conforme progresa la canción (en el segundo o compás indicado).
* **Sincronización Flexible:**
  * **Por tiempo absoluto:** Sincronización basada en timestamps exactos en segundos/milisegundos (`segundo -> texto`).
  * **Por compás / BPM:** Configuración de BPM (beats por minuto) y compases musicales para facilitar el cálculo de entradas y cambios de compás.
* **Canto Guiado (Sílabas / Palabras / Karaoke):**
  * Posibilidad de configurar la letra para que se ilumine o aparezca **sílaba por sílaba** o **palabra por palabra**, facilitando la entonación y dicción al cantar.
* **Soporte Multilingüe y Traducciones Ilimitadas:**
  * Cada canción puede almacenar tantas pistas líricas en distintos idiomas como se desee.
  * **Idioma Principal vs. Traducciones:** Un idioma está designado como el **idioma principal** (idioma original en que se canta el tema), mientras que los demás se registran como **traducciones**.
  * **Conmutación Dinámica de Idioma:** Selector en tiempo real para alternar el idioma de la letra mostrada durante el karaoke.
  * **Modo Bilingüe / Subtitulado Simultáneo:** Opción para mostrar el texto en el idioma principal en tamaño destacado y, simultáneamente justo debajo, la traducción activa elegida sincronizada en tiempo real.
* **Personalización Visual Básica:**
  * Configuración de colores de tipografía (color inactivo, color activo/resaltado, color de subtítulo de traducción).
  * Selección de colores o degradados sencillos de fondo.
  * Ajustes de tamaño y familia tipográfica.

### 2.2. Modo Avanzado (Fase Posterior)
Diseñado para presentaciones visuales dinámicas, shows interactivos o videos líricos (*lyric videos*):
* **Efectos de Fondo Sincronizados:** Disparo de eventos visuales al ritmo de la música.
* **Elementos Visuales Dinámicos:**
  * Cambios de color y transiciones de fondo rítmicas.
  * Formas geométricas reactivas (renderizadas mediante [`pixi.js`](file:///home/hezztia/Documents/SarangaBaranga/package.json#L17) / canvas WebGL).
  * Inserción y animación de imágenes estáticas y GIFs animados.
  * Efectos de partículas y animaciones de cámara/escena.

---

## 3. Estructura de Configuración Modular y Base de Datos Local

Para garantizar la separación de responsabilidades, permitir exportar/importar configuraciones y mantener intacto el modelo relacional estructurado, los datos de cada canción se organizan en tres estructuras independientes gestionadas localmente en el navegador (IndexedDB):

1. **`metadata` (Información General, Clasificación y Enlaces):**
   * Título de la canción (`songs.title`).
   * Artista asociado (`artists.name` vía relación con `artist_id`).
   * Géneros musicales (`genres` vinculados mediante relación N:M `song_genres`).
   * Tags / Etiquetas de búsqueda (`tags` vinculados mediante relación N:M `song_tags`).
   * Enlaces a video de YouTube (versión oficial y versión instrumental / solo pista).
   * Ruta o Blob de audio opcional (`songs.audio_path` para pistas de audio locales o remotas).
2. **`basic` (Configuración de Letra, Traducciones y Sincronización Básica) -> `songs.lyrics_data`:**
   * Configuración de tempo (BPM, compás, modo de sincronización).
   * **Colección de idiomas (`languages`):**
     * Idioma principal (`isMain: true`): idioma original en que se canta la pista con su código (ej. `es`, `ja`, `en`), nombre descriptivo, líneas y sílabas.
     * Traducciones ilimitadas (`isMain: false`): cada traducción cuenta con su código de idioma, nombre, líneas sincronizadas o mapeadas y texto plano de lectura (`plain`).
   * Desglose de sílabas/palabras y tiempos de resaltado progresivo para cada línea.
   * Configuración de estilo básico (colores de texto inactivo y activo, color de traducción/subtítulo, color de fondo, tamaño, fuentes).
3. **`advanced` (Línea de Tiempo de Efectos Visuales) -> `songs.visuals_data`:**
   * Eventos de cambio de fondo y animaciones rítmicas (GSAP y PixiJS).
   * Catálogo de formas geométricas, URLs de GIFs o imágenes decorativas.
   * Triggers de efectos visuales en timestamps o beats específicos.

### 3.1. Almacenamiento Local (IndexedDB) e Intercambio de Canciones (Import/Export)
* **Persistencia Local en IndexedDB:** Las entidades (`songs`, `artists`, `tags`, `genres`, `song_tags`, `song_genres`) se almacenan en almacenes de objetos (Object Stores) dentro del navegador del usuario, garantizando persistencia permanente entre sesiones sin requerir login ni backend.
* **Paquete de Canción Nativo (`song-package.json`):** Cada canción puede ser exportada en un archivo JSON unificado con todas sus traducciones, estilos y efectos, o por componentes individuales (`metadata.json`, `lyrics_data.json`, `visuals_data.json`).
* **Interoperabilidad con Estándar `lyricsfile` (`.lyricsfile.yaml`):**
  * Soporte pleno para la especificación abierta **Lyricsfile 1.0** ([tranxuanthang/lyricsfile](https://github.com/tranxuanthang/lyricsfile/blob/main/SPECIFICATION.md)).
  * **Importación:** Carga de archivos `.lyricsfile.yaml` creados en herramientas o repositorios externos, convirtiendo automáticamente marcas de milisegundos (`start_ms`, `end_ms`), texto plano (`plain`) y sincronización palabra por palabra (`words`). Permite crear una nueva canción o añadir el archivo como una traducción adicional a una canción existente.
  * **Exportación:** Posibilidad de exportar la pista lírica principal o cualquiera de las traducciones al formato estándar `.lyricsfile.yaml`.
* **Importación Simple Drag & Drop:** Cualquier usuario puede arrastrar o seleccionar archivos JSON propios o archivos `.lyricsfile.yaml` externos; la aplicación valida la estructura y la almacena en el IndexedDB local de su navegador al instante.

---

## 4. Público Objetivo

1. **Cantantes, Estudiantes de Música y Aficionados al Karaoke:**
   * Personas que desean practicar canciones con guía sílaba por sílaba y la opción de cambiar al video de "solo pista" (karaoke instrumental).
2. **Creadores de Contenido y Editores de Letras:**
   * Usuarios que configuran y sincronizan temas musicales vinculando videos de YouTube o audios locales, afinando la métrica y exportando sus creaciones en JSON o `lyricsfile` para compartirlas.
3. **Estudiantes y Educadores Lingüísticos / Musicales:**
   * Usuarios y profesores que utilizan canciones para aprender y enseñar idiomas extranjeros mediante la visualización simultánea de la letra original y su traducción sincronizada, además del estudio de ritmo y pronunciación.
4. **Espectadores y Audiencia en Vivo:**
   * Personas que disfrutan de visualizaciones de canciones con letras claras en su propio idioma o con fondos dinámicos según el modo elegido.

---

## 5. Requisitos Técnicos y de Despliegue

* **Despliegue Estático:** Compatibilidad total con GitHub Pages (`https://<usuario>.github.io/<repo>/`). Todo el código se ejecuta 100% en el navegador del cliente.
* **Persistencia Local (Client-Side DB):** Motor de base de datos en el navegador utilizando **IndexedDB**, implementando las entidades relacionales (`artists`, `songs`, `tags`, `genres`, `song_tags`, `song_genres`) sin dependencias de backend obligatorias.
* **Portabilidad y Estándares Abiertos:** Soporte completo de **Exportación e Importación** de canciones en formato JSON nativo y compatibilidad bidireccional con el formato abierto **Lyricsfile 1.0 (YAML)**.
* **Gestión Multilingüe:** Modelo de datos capaz de albergar un idioma nativo y múltiples traducciones por canción, con códigos normalizados (ISO 639-1 / BCP 47) y renderizado bilingüe sincronizado.
* **Soporte Multimedia Universal:** Soporte integral para videos y canciones de **YouTube y YouTube Music (`music.youtube.com`)** mediante la **YouTube IFrame Player API**, con soporte multi-video, cálculo dinámico de offsets, control maestro de volumen (0-100), botón de silenciado y reproducción de archivos de audio nativos (`<audio>` HTML5 / Blob).
* **Integración con API de Letras Comunitarias:** Búsqueda en vivo y obtención de letras en formato TTML/LRC y traducciones automáticas mediante la API abierta de **BetterLyrics & Unison**, con precarga completa en el editor de canciones.
* **Sincronización:** Margen de error inferior a 50 milisegundos entre el tiempo de reproducción reportado y la actualización visual de la letra.

