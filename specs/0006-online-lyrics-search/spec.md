# Especificación: Búsqueda de Canciones Online Multi-Motor
**Código:** `0006-online-lyrics-search`  
**Estado:** Estable / En Producción  
**Versión:** 1.0.0

---

## 1. Visión General
Proveer a los usuarios acceso inmediato a millones de letras sincronizadas con sílabas, versos y traducciones sin salir de la aplicación, conectando en paralelo con las principales plataformas comunitarias abiertas.

---

## 2. Proveedores y Servicios Integrados
1. **BetterLyrics & Unison (`src/services/betterLyricsService.js`):**
   - Búsqueda abierta por texto, artista estricto, artista+canción o enlace/video de YouTube.
   - Parser nativo de TTML (sincronización silábica precisa) y LRC.
   - Traducción multilingüe automática en tiempo real vía Unison (`POST /translate`).
2. **LRC.red (`src/services/lrcRedService.js`):**
   - Catálogo abierto de más de 29 millones de temas vía `https://lrc.red/search.json`.
   - Soporte nativo CORS libre de tokens para descarga en TTML, Lyricsfile YAML y LRC.
3. **LRCLIB (`src/services/lrclibService.js`):**
   - API comunitaria abierta libre de tokens con letras sincronizadas y no sincronizadas.
   - Distribución fonética automática de sílabas para fuentes en versos (`linesync`).
4. **Genius.com (`src/services/geniusService.js`):**
   - Consulta con metadatos completos, carátulas y Client Access Token opcional.
   - Cascada resiliente de obtención lírica con fallbacks.

---

## 3. Orquestador y Reglas de Búsqueda (`src/services/onlineLyricsService.js`)
1. **Límite de 6 por Proveedor en "Todas las Fuentes":** Consulta concurrente (`Promise.allSettled`) limitada a un máximo estricto de 6 resultados por motor (`slice(0, 6)`), evitando la monopolización visual.
2. **Límite Completo en Búsquedas Individuales:** Al buscar dentro de una pestaña específica (BetterLyrics, LRC.red, Genius o LRCLIB), se entregan todos los resultados disponibles sin recorte.
3. **Clasificación Heurística:** Ordenamiento prioritario:
   1. TTML silábico (`richsync`).
   2. Versos sincronizados (`linesync`).
   3. Letra plana.
   4. Presencia de video oficial de YouTube y carátula (`artwork`).

---

## 4. Modal Unificado y Layout Adaptativo (`src/views/onlineLyricsModal.js`)
1. **Arquitectura Adaptativa (`layout-scroll-controls` vs `layout-fixed-controls`):**
   - En PC con espacio vertical amplio ($\ge 260\text{px}$): controles fijos arriba y scroll interno en resultados (`.layout-fixed-controls`).
   - En móviles ($\le 768\text{px}$) o ventanas de resultados reducidas ($< 260\text{px}$): todo el modal scrollea unificado (`.layout-scroll-controls`), cediendo el 100% de la altura útil de la pantalla a los resultados.
2. **Botón Flotante "Subir" (`#btn-online-scroll-top`):** Aparece al desplazarse $> 70\text{px}$ hacia abajo; al hacer clic, ejecuta desplazamiento suave arriba y re-enfoca el input de búsqueda.
3. **Precarga al Editor:** Al seleccionar una canción, se genera el paquete normalizado y se abre de inmediato en `songEditorView.open(songPackage)`.
4. **Inmunidad a la Compresión Vertical en Móviles:** La barra de proveedores (`.online-providers-bar`) y el bloque de inputs (`.online-inputs-container`) tienen fijados `flex-shrink: 0 !important;` y altura mínima (`min-height: 44px;`) junto a contextos de apilamiento escalonados (`z-index: 2` vs `1`), impidiendo que el motor flexbox colapse los botones de fuentes cuando se cargan las tarjetas de resultados.
