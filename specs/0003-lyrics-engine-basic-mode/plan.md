# Plan Futuro: Motor de Sincronización y Modo Básico
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0003-lyrics-engine-basic-mode/spec.md)

---

## 1. Puntos Guía Rítmicos (Lead-in Countdown Dots)
* **Objetivo:** Para versos precedidos por silencios $> 3.0\text{s}$, renderizar tres puntos luminosos pulsantes a tempo con el compás musical (beat) durante el compás previo al canto.
* **Justificación:** Previene entradas a destiempo en canciones con pausas largas entre estrofas.

## 2. Transliteración Fonética para Nuevos Alfabetos (Hangul / Pinyin)
* **Objetivo:** Incorporar diccionarios fonéticos compactos similares a `kanjiDict.js` para transliterar automáticamente canciones en coreano (Hangul a Revised Romanization) y chino (Hanzi a Pinyin con marcas tonales).
