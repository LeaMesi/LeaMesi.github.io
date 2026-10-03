# Plan Futuro: Modo Avanzado y Efectos Visuales
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0008-advanced-visual-mode/spec.md)

---

## 1. Despachador de Eventos Visuales en Tiempo Real
* **Objetivo:** Implementar un bucle de suscripción al Master Clock que ejecute la activación y finalización de efectos según `visuals_data.effects`:
  - `bgColorTransition`: Interpolación suave de color mediante GSAP.
  - `shapeBurst`: Partículas emitidas desde el centro o coordenadas arbitrarias con gravedad y desvanecimiento.
  - `imageGifOverlay`: Carga y renderizado de GIFs en capas transparentes con temporizador de descarte.

## 2. Editor Visual de Efectos
* **Objetivo:** Extender `songEditorView.js` con una pista visual secundaria para añadir disparadores de efectos con arrastrar y soltar (drag & drop).
