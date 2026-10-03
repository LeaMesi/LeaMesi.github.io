# Plan Futuro: Editor de Canciones y Herramientas de Tiempo
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0004-song-editor-timing-tools/spec.md)

---

## 1. Modo de Sincronización en Vivo por Toques ("Tap to Sync")
* **Objetivo:** Permitir al usuario reproducir la canción y marcar las marcas de tiempo de versos y sílabas en tiempo real simplemente pulsando la barra espaciadora o tocando la pantalla mientras se canta.
* **Flujo de Trabajo:**
  1. El usuario pulsa "Iniciar Grabación de Tiempos".
  2. La música arranca y el primer verso o sílaba se resalta en espera.
  3. Cada pulsación registra `startTime` y avanza inmediatamente al siguiente elemento.
  4. Permite corregir o rebobinar 5 segundos con una tecla rápida.

## 2. Atajos de Teclado Profesionales
* **Objetivo:** Incorporar atajos de productividad tipo DAW:
  - `Espacio`: Play / Pausa.
  - `J` / `L`: Rebobinar / Avanzar 2 segundos.
  - `K`: Capturar tiempo actual en el input enfocado.
  - `Ctrl + Enter`: Guardar canción y abrir Modo Letra.
