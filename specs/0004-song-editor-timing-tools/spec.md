# Especificación: Editor de Canciones y Herramientas de Tiempo
**Código:** `0004-song-editor-timing-tools`  
**Estado:** Estable / En Producción  
**Versión:** 1.0.0

---

## 1. Visión y Alcance
El Editor de Canciones (`src/views/songEditorView.js`) proporciona un entorno de creación y ajuste fino integral para letras, metadatos, videos y marcas de tiempo, tanto para canciones creadas desde cero como para temas precargados desde la búsqueda online.

---

## 2. Componentes Principales del Editor
1. **Gestión de Metadatos y Videos:** Título, artista, géneros, etiquetas y lista dinámica de videos de YouTube con offsets de sincronización individuales.
2. **Asistente de Audio en Tiempo Real:** Mini-reproductor integrado para escuchar la canción, pausar y capturar tiempos al vuelo. Dispone de un reloj de alta precisión (`mm:ss.mmm`) gobernado por el Master Clock con números tabulares (`font-variant-numeric: tabular-nums`) para evitar oscilaciones de layout.
3. **Inputs Numéricos Limpios:** Campos numéricos con aspecto oscuro espacioso, eliminando las flechas nativas y fondos blancos del navegador (`appearance: textfield; -webkit-appearance: none`), preservando el ajuste fino mediante teclado y rueda de desplazamiento.
4. **Edición por Frases:**
   - Adición, reordenamiento y eliminación de versos.
   - Configuración de `startTime` y `endTime` con botón de preescucha puntual del intervalo de audio.
   - Modal de importación rápida ("Pegar Letra Completa") para generar automáticamente versos a partir de texto plano.
5. **Edición Silábica y Distribución Proporcional:**
   - Separación silábica fonética automática vía `syllablesHelper.js`.
   - Ajuste fino individual de inicio y duración por sílaba.
   - Algoritmo de auto-distribución proporcional en el intervalo de la frase.
6. **Herramientas de Borrado de Sílabas:**
   - Borrado por frase individual en el encabezado de la tarjeta y en la barra rápida.
   - Borrado masivo para todas las frases del idioma activo con confirmación obligatoria previa (`window.confirm`), informando el número total de versos y sílabas afectadas.
7. **Pestañas Multilingües:**
   - Creación ilimitada de idiomas con opción de clonar las marcas temporales del idioma original para acelerar traducciones.
   - Edición interactiva de nombre y código ISO al pulsar sobre la pestaña activa.
