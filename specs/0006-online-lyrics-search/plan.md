# Plan Futuro: Búsqueda de Canciones Online
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0006-online-lyrics-search/spec.md)

---

## 1. Caché Inteligente de Búsqueda
* **Objetivo:** Guardar en IndexedDB los resultados TTML/LRC obtenidos durante 48 horas para permitir recargas instantáneas sin peticiones de red repetidas ante búsquedas frecuentes.

## 2. Detección Automática de Audio desde Micrófono (Reconocimiento Tipo Shazam)
* **Objetivo:** Evaluar la integración con la Web Audio API y servicios comunitarios de audio fingerprinting para identificar la canción que suena en el ambiente y buscar su letra automáticamente.
