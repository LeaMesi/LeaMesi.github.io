# Especificación: Modo Avanzado y Efectos Visuales
**Código:** `0008-advanced-visual-mode`  
**Estado:** En Desarrollo (Segunda Etapa)  
**Versión:** 0.5.0

---

## 1. Visión y Principio de Aislamiento
El Modo Avanzado está diseñado para presentaciones escénicas, videos líricos (*lyric videos*) y experiencias interactivas dinámicas.
- **Regla de Oro de Rendimiento:** El Modo Avanzado **permanece completamente aislado** y jamás se inicializa en el arranque ni interfiere con el Modo Básico.
- Solo se instancian los recursos de `pixi.js` y WebGL si el usuario conmuta explícitamente al modo avanzado en el selector de vistas.

---

## 2. Esquema de Datos de Efectos (`songs.visuals_data`)
```json
{
  "enabled": true,
  "effects": [
    {
      "id": "fx-1",
      "triggerTime": 10.5,
      "type": "bgColorTransition",
      "params": { "toColor": "#1E1B4B", "duration": 1.2 }
    },
    {
      "id": "fx-2",
      "triggerTime": 25.0,
      "type": "shapeBurst",
      "params": { "shape": "stars", "count": 25, "palette": ["#FF007A", "#7928CA"] }
    },
    {
      "id": "fx-3",
      "triggerTime": 42.0,
      "type": "imageGifOverlay",
      "params": { "url": "https://media.giphy.com/media/...", "duration": 5.0, "position": "center" }
    }
  ]
}
```

---

## 3. Capa de Visualización (`src/views/advancedViewer.js`)
- Conserva el renderizado de la letra y el soporte multilingüe en primer plano.
- Monta un lienzo interactivo de fondo que responde al Master Clock despachando transiciones cromáticas, partículas ambientales y formas geométricas reactivas.
