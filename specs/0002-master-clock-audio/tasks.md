# Tareas: Master Clock, Reproductor Multimedia y Audio
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0002-master-clock-audio/spec.md)

---

## Tareas Completadas

- [x] **3.1. Adaptador Multimedia Híbrido (`src/player/mediaPlayer.js`):**
  - Implementar canal YouTube IFrame y canal HTML5 Audio con interfaz común (`play`, `pause`, `seek`, `getCurrentTime`).
- [x] **3.2. Emisor de Tiempo (Master Clock Bridge):**
  - Bucle `requestAnimationFrame` que sondea el tiempo en estado `PLAYING` y emite eventos de actualización.
- [x] **5.4. Video de YouTube Invisible (Audio-Only):**
  - Host de YouTube fuera de pantalla (`top: -9999px`) con opacidad cero para audio puro sin video en el layout.
- [x] **5.5. Soporte Multi-Video Dinámico con Offset:**
  - Cálculo dinámico de tiempos $\tau = t - \text{offset}$ en reproducción y saltos.
  - Conmutación fluida entre videos transfiriendo la posición de canto.
- [x] **9.1. Compatibilidad Universal con YouTube Music:**
  - Extractor de IDs `extractYouTubeVideoId` con soporte para `music.youtube.com`, `shorts`, `youtu.be` y parámetros adicionales.
- [x] **9.2. Control Deslizante de Volumen y Mute:**
  - `setVolume` y `getVolume` unificados con persistencia en `localStorage` (`saranga_player_volume`).
  - Slider interactivo y botón de silenciado con iconos SVG vectoriales.
- [x] **23.1. Corrección de Congelamiento en Barra de Progreso:**
  - Sustituir verificación de foco por bandera `isUserSeeking` y desenfoque automático (`seekSlider.blur()`).
- [x] **5.6. Ajuste Rápido de Offset en Caliente (-0.1s y +0.1s):**
  - Botones `-0.1s` y `+0.1s` con badge central del offset en el popover de configuración de `controlsView.js`.
  - Método `setActiveOffset` en `mediaPlayer.js` que actualiza `activeOffset` y sincroniza las letras en tiempo real sin pausar, reiniciar ni alterar la posición del reproductor de YouTube/audio.
  - Persistencia automática de los cambios en IndexedDB mediante `updateSongVideos`.

---

## Tareas Pendientes / Por Hacer
- [ ] **3.3. Detección de pérdida de conexión:** Manejo visual de buffering prolongado o desconexión temporal de YouTube.
