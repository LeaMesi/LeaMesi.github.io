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
- [x] **23.2. Área Segura contra Missclics en la Barra de Progreso (`controlsView.js`):**
  - Implementación de área segura (banda geométrica desde el borde superior del dock hasta la fila de botones y eventos de captura en `.progress-bar-row`) que previene navegaciones accidentales a la lista de canciones al adelantar o retroceder la pista, preservando al 100% los estilos visuales y calculando el salto temporal si el toque cae alineado al slider.
- [x] **5.6. Ajuste Rápido de Offset en Caliente (-0.1s y +0.1s):**
  - Botones `-0.1s` y `+0.1s` con badge central del offset en el popover de configuración de `controlsView.js`.
  - Método `setActiveOffset` en `mediaPlayer.js` que actualiza `activeOffset` y sincroniza las letras en tiempo real sin pausar, reiniciar ni alterar la posición del reproductor de YouTube/audio.
- [x] **3.4. Optimización de Master Clock Bridge y Ahorro de CPU Móvil:**
  - Despacho condicional de eventos en bucle de 60fps (`onTimeUpdate` y `onStateChange`) en `main.js` restringido estrictamente a la pantalla activa (`currentScreen` igual a `lyrics`, `menu` o `editor`).
  - Evita el sondeo y recálculos innecesarios en vistas ocultas, reduciendo drásticamente el consumo de CPU y batería en dispositivos móviles.
- [x] **9.3. Menú Popover Vertical de Volumen en Modo Letra (`controlsView.js`):**
  - Ocultamiento del slider horizontal en el dock y sustitución por botón de parlante (`#btn-controls-volume`) que despliega un popover vertical hacia arriba (`#controls-volume-popover`) idéntico al del editor de canciones.
  - Integra slider vertical (`.volume-slider`), etiqueta de porcentaje (`.volume-percent-label`), botón de activación/silenciado (`.btn-mute-toggle`) y cierre automático ante clics exteriores.

---

## Tareas Pendientes / Por Hacer
- [ ] **3.3. Detección de pérdida de conexión:** Manejo visual de buffering prolongado o desconexión temporal de YouTube.
