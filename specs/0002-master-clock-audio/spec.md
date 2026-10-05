# Especificación: Master Clock, Reproductor Multimedia y Audio
**Código:** `0002-master-clock-audio`  
**Estado:** Estable / En Producción  
**Versión:** 1.0.0

---

## 1. Principio Fundamental: Master Clock Indiscutible
El tiempo de reproducción emitido por el reproductor de audio (`player.getCurrentTime()`) es la **única fuente de verdad temporal** del sistema. Ningún componente o vista debe mantener cronómetros o intervalos independientes para el avance de las letras.

---

## 2. Fuentes de Audio Soportadas (`src/player/mediaPlayer.js`)
1. **YouTube IFrame API:**
   - Reproductor invisible (`position: fixed; top: -9999px; left: -9999px; opacity: 0; pointer-events: none;`) para garantizar reproducción de audio fiel sin elementos de video visibles en el DOM.
   - Compatibilidad universal con enlaces estándar (`youtube.com/watch?v=...`), acortados (`youtu.be`), Shorts (`/shorts/`), embeds y YouTube Music (`music.youtube.com`).
2. **Audio HTML5 Nativo:**
   - Reproducción mediante elemento `<audio>` para archivos locales (Blob) o URLs de audio directas.

---

## 3. Modelo Multi-Video con Offsets Dinámicos
Cada canción puede tener N videos asociados en su metadato (`videos: [{ id, name, url, offset }]`):
- **Cálculo de tiempo de letra:**  
  $$\tau_{\text{letra}} = t_{\text{video}} - \text{video.offset}$$
- **Búsqueda y saltos (Seek):** Al solicitar un salto a la posición $\tau$, el reproductor se posiciona en $\tau + \text{video.offset}$.
- **Duración real:** La duración total de la canción y la barra de progreso reflejan la totalidad real del video sin recortes.

---

## 4. Master Clock Bridge (Bucle RAF)
- Un bucle de consulta gobernado por `requestAnimationFrame` sondea el tiempo de reproducción únicamente cuando el reproductor está en estado `PLAYING` (1).
- Despacha el tiempo de forma reactiva a la capa de sincronización de letras y a los controles de usuario.

---

## 5. Control Maestro de Volumen y Silenciado
- Métodos expuestos: `setVolume(volume)` (0 a 100) y `getVolume()`.
- Controla simultáneamente la API de YouTube (`ytPlayer.setVolume(vol)`) y el elemento de audio HTML5 (`audio.volume = vol / 100`).
- Persistencia en `localStorage` (`saranga_player_volume`).

---

## 6. Modelo de Interacción de la Barra de Progreso (Seek Slider)
Para erradicar el congelamiento del thumb del `<input type="range">` por retención de foco en el navegador, `controlsView.js` y `floatingPlayerView.js` implementan la bandera de interacción `isUserSeeking`:
- Al interactuar (`pointerdown`, `touchstart`, `input`), `isUserSeeking = true`.
- Al soltar (`change`, `pointerup`, `touchend`), se ejecuta el salto temporal, se apaga la bandera y se desenfoca el slider (`seekSlider.blur()`), permitiendo que el Master Clock retome la actualización sin interrupciones ni pausas.

---

## 7. Navegación Temporal con Teclado y Configuración de Salto (`seekStep`)
- **Atajos de teclado:** Las flechas izquierda (`ArrowLeft`) y derecha (`ArrowRight`) retroceden y adelantan la reproducción por un intervalo configurable de segundos.
- **Detección de contexto:** Se omiten automáticamente cuando el foco está en campos de texto editables (`<input>`, `<textarea>`, `contenteditable`) o diálogos modales activos, permitiendo la edición normal sin saltos de tiempo accidentales.
- **Configuración del reproductor:** Selector integrado en el menú de configuración de Modo Letra (`controls-settings-popover` en `src/views/controlsView.js`), permitiendo elegir entre 1s, 2s, 3s, 5s, 10s, 15s o 30s (con 5s por defecto).
- **Persistencia local:** Se almacena en `localStorage` (`saranga_seek_step`) para mantenerse constante entre sesiones.

---

## 8. Atajo Global de Barra Espaciadora para Pausar/Reanudar
- **Atajo global:** La tecla Espacio (` ` / `Spacebar` / `Space`) invoca `mediaPlayer.togglePlay()` para alternar entre reproducción y pausa.
- **Acceso universal:** Funciona en cualquier pantalla o estado de la aplicación, incluyendo menús y modales abiertos (menú de selección de canciones, modal de playlist, modal de videos, popovers de configuración, etc.).
- **Detección de contexto de escritura (`isTypingContext`):** No se intercepta el evento si el usuario está interactuando con `<input type="text|search|url|number...">`, `<textarea>` o contenedores con `contenteditable`, permitiendo escribir espacios sin interferencia en la reproducción.
- **Prevención de efectos colaterales:** En contextos no interactivos de texto, se ejecuta `e.preventDefault()` para evitar el desplazamiento vertical de la ventana y la activación accidental por teclado de botones enfocados. Además se descarta la repetición sostenida (`e.repeat`).
