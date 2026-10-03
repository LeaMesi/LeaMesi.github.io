# Directivas del Sistema para el Agente AI: SarangaBaranga (`proy-letras`)

Este documento constituye el conjunto maestro de instrucciones, reglas de seguridad, estándares de código y protocolos de desarrollo para cualquier interacción y asistencia en este proyecto.

---

## 1. Regla de Oro y Contexto Obligatorio

> [!IMPORTANT]
> **Instrucción de lectura obligatoria:**  
> **Antes de proponer cualquier cambio estructural o escribir código nuevo, debes revisar en silencio [`design.md`](file:///home/hezztia/Documents/SarangaBaranga/design.md) y [`progress.md`](file:///home/hezztia/Documents/SarangaBaranga/progress.md) para mantener el contexto.**

No comiences ninguna implementación sin haber contrastado previamente:
1. El estado actual de avance en [`progress.md`](file:///home/hezztia/Documents/SarangaBaranga/progress.md).
2. Los patrones arquitectónicos y directrices técnicas en [`design.md`](file:///home/hezztia/Documents/SarangaBaranga/design.md) y [`specs.md`](file:///home/hezztia/Documents/SarangaBaranga/specs.md).
3. La especificación funcional correspondiente en [`specs/NNNN-*/spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/).
4. Las tareas pendientes y su orden prioritario en [`task.md`](file:///home/hezztia/Documents/SarangaBaranga/task.md) y en [`specs/NNNN-*/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/).

---

## 2. Reglas de Seguridad y Protección de Archivos

1. **Destrucción Prohibida sin Autorización:**
   * **NUNCA** elimines archivos (`rm`, comandos destructivos de bash o truncado total de archivos existentes) sin solicitar y recibir **confirmación explícita previa** del usuario.
2. **Preservación de Integridad:**
   * No borres comentarios explicativos, docstrings ni código preexistente no relacionado con la tarea en curso.
3. **Cero Fuga de Credenciales:**
   * **NUNCA** escribas claves de API, secretos de servicio o URLs privadas directamente en el código fuente. Utiliza siempre variables de entorno (`import.meta.env.VITE_*`) y asegúrate de que archivos `.env` o `.env.local` estén en [`.gitignore`](file:///home/hezztia/Documents/SarangaBaranga/.gitignore).
4. **Validación de Compilación y Rutas de Despliegue:**
   * Todo cambio de código debe someterse a verificación ejecutando `npm run build` para garantizar que la compilación de Vite concluya sin errores.
   * La aplicación se despliega como SPA estática en **GitHub Pages** (`usuario.github.io`): todas las rutas a recursos deben ser relativas (`base: './'`).

---

## 3. Estilo de Código y Convenciones

El código del proyecto debe ser homogéneo y seguir las siguientes directrices estilísticas (consistentes con la base de [`src/counter.js`](file:///home/hezztia/Documents/SarangaBaranga/src/counter.js) y [`src/main.js`](file:///home/hezztia/Documents/SarangaBaranga/src/main.js)):

* **Indentación:** Exactamente **2 espacios** (sin tabuladores duros).
* **Comillas:** 
  * Usar **comillas simples** (`'`) para cadenas de texto e importaciones de módulos (`import { setupPlayer } from './player/youtubePlayer.js'`).
  * Usar **template literals** (backticks `` ` ``) para interpolación de variables o inyección de fragmentos HTML dinámicos.
* **Punto y Coma (Semicolons):** **Omitir puntos y coma** al final de las sentencias (estilo JavaScript Standard / ASI), salvo en casos estrictamente requeridos para evitar ambigüedades de parsing.
* **Convenciones de Nombres:**
  * **Variables y Funciones:** `camelCase` descriptivo (ej. `setupPlayer`, `currentTime`, `syncSyllables`).
  * **Constantes Globales:** `UPPER_SNAKE_CASE` (ej. `DEFAULT_BPM`, `YOUTUBE_PLAYER_STATES`).
  * **Archivos JavaScript:** `camelCase` o `kebab-case` coherente dentro de su carpeta funcional (ej. `src/player/youtubePlayer.js`, `src/lyrics/timing.js`).
  * **Clases y Selectores CSS:** `kebab-case` semántico (ej. `.lyric-line`, `.active-syllable`, `#youtube-player-container`).
  * **Variables CSS (Tokens):** Prefijadas con `--` en minúsculas y guiones (ej. `--text-inactive`, `--text-active`, `--bg-color`).
* **Paradigma de Programación:**
  * Preferir **funciones modulares y closures léxicos** (Factory Pattern / Setup Functions) en lugar de jerarquías complejas de clases, salvo que una biblioteca externa lo exija.
  * Mantener módulos pequeños con responsabilidad única (SoC).

---

## 4. Reglas Técnicas Específicas del Stack

### 4.1. Separación de Datos y Esquema Local (IndexedDB)
* Toda canción gestiona su configuración en tres estructuras desacopladas que mapean a los almacenes de IndexedDB y al formato de intercambio JSON:
  1. `metadata`: Datos generales (`title`, `audio_path`), artistas (`artists`), etiquetas (`tags`) y géneros (`genres`).
  2. `basic` -> `songs.lyrics_data`: Letra (con soporte multilingüe: idioma principal y traducciones ilimitadas), compás, BPM/tiempos, desglose por sílabas/palabras y estilos básicos.
  3. `advanced` -> `songs.visuals_data`: Línea de tiempo de efectos de fondo, partículas y formas (GSAP/PixiJS).

### 4.2. Audio/Video y Sincronización con YouTube IFrame API
* **Master Clock indiscutible:** El tiempo de reproducción reportado por `player.getCurrentTime()` de YouTube gobierna todos los eventos de la aplicación.
* **Ciclo de Consulta (Clock Bridge):** Implementar un bucle ligero con `requestAnimationFrame` que solo sondee el tiempo cuando el estado del reproductor sea `PLAYING` (1), evitando sobrecarga de CPU cuando esté pausado.
* **Alternancia de Pista Fluida:** Al alternar entre el video original y el video "solo pista", se debe transferir el `currentTime` para no interrumpir el flujo del usuario.

### 4.3. Modo Sencillo vs Modo Avanzado
* El **Modo Sencillo** es la prioridad actual del proyecto: debe ser ligero, accesible y centrado en la letra y el canto por sílabas sin inicializar gráficos pesados.
* El **Modo Avanzado** (`pixi.js`, shaders, partículas, GIFs) debe permanecer aislado y solo instanciarse si el usuario lo activa explícitamente.

### 4.4. Persistencia Local en Navegador (IndexedDB), Intercambio JSON e Interoperabilidad con Lyricsfile
* **Almacenamiento Local Autónomo:** La persistencia se gestiona en el cliente mediante **IndexedDB** a través de un servicio desacoplado (`src/services/db.js` y `src/services/songService.js`), eliminando la necesidad de login o verificación en backend.
* **Intercambio Comunitario (Export / Import):** Proveer capacidades nativas de exportación e importación de canciones en formato JSON (`src/services/shareService.js`) para compartir creaciones entre usuarios sin requerir un servidor central.
* **Compatibilidad con Estándar Lyricsfile (YAML 1.0):** Soporte bidireccional para importar y exportar archivos `.lyricsfile.yaml` ([especificación `tranxuanthang/lyricsfile`](https://github.com/tranxuanthang/lyricsfile/blob/main/SPECIFICATION.md)) mediante `src/services/lyricsfileService.js`, permitiendo importar canciones nuevas o integrar traducciones a temas ya existentes.

---

## 5. Mantenimiento Continuo del Memory Bank

Al concluir cualquier intervención técnica significativa:
1. **Actualizar [`progress.md`](file:///home/hezztia/Documents/SarangaBaranga/progress.md):** Registrar qué funcionalidades pasaron de "Pendiente" a "Operativo", reportar nuevos bugs detectados y actualizar el estado de las pruebas.
2. **Actualizar [`task.md`](file:///home/hezztia/Documents/SarangaBaranga/task.md) y [`specs/NNNN-*/tasks.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/):** Marcar con `[x]` las subtareas completadas y desglosar nuevas tareas identificadas en el módulo correspondiente.
3. **Actualizar [`design.md`](file:///home/hezztia/Documents/SarangaBaranga/design.md) y [`specs/NNNN-*/spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/):** Reflejar cualquier cambio arquitectónico o nuevo esquema incorporado.
