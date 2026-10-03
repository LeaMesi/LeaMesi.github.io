# Plan Futuro: Catálogo, Bibliotecas y Playlist
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0005-catalog-libraries-playlist/spec.md)

---

## 1. Modo Fiesta / Karaoke Kiosk (Pantalla Bloqueada)
* **Objetivo:** Ofrecer un modo de pantalla completa simplificado donde los usuarios solo puedan buscar canciones en la biblioteca y agregarlas a la cola de la playlist, bloqueando la edición o eliminación de temas.
* **Casos de Uso:** Fiestas, reuniones familiares o bares donde múltiples personas eligen qué cantar sin riesgo de alterar las letras guardadas.

## 2. Paginación y Virtualización de Catálogo Grande
* **Objetivo:** Si la biblioteca supera las 500 canciones, renderizar únicamente las tarjetas/filas visibles en el viewport mediante una lista virtual ligera, manteniendo 60 FPS estables.
