# Especificación: Motor de Sincronización Lírica y Modo Básico
**Código:** `0003-lyrics-engine-basic-mode`  
**Estado:** Estable / En Producción  
**Versión:** 1.0.0

---

## 1. Visión y Principios del Modo Básico
El Modo Básico es el núcleo funcional prioritario de SarangaBaranga. Su diseño está orientado a la lectura inmersiva, práctica vocal y karaoke con consumo mínimo de recursos, sin elementos visuales distractores.

---

## 2. Arquitectura de Módulos Líricos
1. **`src/lyrics/timing.js`:** Cálculo de tiempos, conversión entre compases/beats (BPM) y segundos decimales, y formateo `mm:ss` con milisegundos (`mm:ss.mmm`).
2. **`src/lyrics/languageManager.js`:** Administración de la pista lingüística principal (`isMain: true`) y traducciones ilimitadas (`isMain: false`), con soporte de conmutación reactiva y modo bilingüe simultáneo.
3. **`src/lyrics/sync.js`:** Algoritmo de detección de verso activo (`findActiveLineIndex`) con anticipación de hasta 1.5s, evaluación de estados silábicos (`upcoming`, `active`, `completed`) y emparejamiento con la traducción correspondiente.
4. **`src/lyrics/syllablesHelper.js`:** Motor fonético para separación de sílabas en español (diptongos, triptongos, hiatos y grupos consonánticos), preservación de espacios y distribución proporcional de duraciones.
5. **`src/lyrics/transliterationHelper.js` & `src/lyrics/kanjiDict.js`:** Motor autónomo de transliteración fonética Hepburn a Romaji con diccionario embebido de más de 7,000 vocablos y 2,136 kanjis Joyo.

---

## 3. Escenario de Visualización Centrado (`src/views/basicViewer.js`)
1. **Filosofía de Letra Suelta:** Las frases flotan limpias sobre el fondo de la aplicación (`background: transparent; border: none;`), sin cajas, tarjetas ni bordes opacos.
2. **Frase Actual:** Fijada en el centro geométrico del visor con tipografía fluida destacada (`clamp(1.35rem, 5.5vw, 2.2rem)`) y peso 700.
3. **Frases Siguientes (0 a 3 configurables):**
   - Renderizadas debajo al 70% del tamaño y con tonos atenuados.
   - En el modo de 0 frases ("Ninguna (solo actual)"), el contenedor inferior se omite por completo del DOM, conservando la frase actual perfectamente centrada.
   - Clic en cualquier frase siguiente ejecuta salto temporal inmediato (`seek(line.startTime)`).
4. **Subtitulado de Traducción Simultáneo:** La traducción seleccionada se muestra inmediatamente debajo de la frase cantada en cursiva (`font-style: italic`) con `--translation-color`.
5. **Resaltado Silábico Continuo sin Espacios Espurios:** Desglose en elementos `<span>` contiguos con `white-space: pre-wrap; display: inline;` concatenados mediante `join('')`, evitando saltos de línea artificiales.
6. **Alineación de Espacios en Texto Alternativo (Romaji):** Algoritmo `getSyllableAltTextsWithSpacing(line)` que reconstruye exactamente los espacios y puntuaciones entre palabras para evitar aglutinaciones tipográficas.
