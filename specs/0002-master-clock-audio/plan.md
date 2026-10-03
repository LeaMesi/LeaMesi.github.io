# Plan Futuro: Master Clock y Audio
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0002-master-clock-audio/spec.md)

---

## 1. Control de Velocidad de Reproducción (Playback Rate)
* **Objetivo:** Permitir cambiar la velocidad de la pista (0.75x, 0.85x, 1.0x, 1.25x) para facilitar el aprendizaje y la práctica vocal de canciones rápidas.
* **Detalles Técnicos:**
  - Invocar `player.setPlaybackRate(rate)` en la YouTube Player API.
  - Sincronizar el reloj de letras automáticamente ya que `getCurrentTime()` avanza a la velocidad correspondiente.

## 2. Detección y Marcado de Secciones Instrumentales Prolongadas
* **Objetivo:** Si entre dos versos hay una pausa de más de 8 segundos, mostrar un indicador visual discreto de cuenta regresiva (countdown) hasta la entrada del siguiente verso.
