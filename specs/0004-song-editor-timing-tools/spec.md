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
5. **Edición Silábica y Distribución Proporcional con Ponderación Fonética Inteligente:**
   - Separación silábica fonética automática vía `syllablesHelper.js`.
   - Ajuste fino individual de inicio y duración por sílaba.
   - Algoritmo de auto-distribución proporcional basado en ponderación fonética musical (`calculateSyllableWeight`), asignando mayor duración relativa a diptongos, vocales abiertas, acentos tónicos y alargamiento de final de verso (*phrase-final lengthening*), con soporte alternativo de modo equitativo (`mode: 'equal'`).
6. **Herramientas de Borrado de Sílabas:**
   - Borrado por frase individual en el encabezado de la tarjeta y en la barra rápida.
   - Borrado masivo para todas las frases del idioma activo con confirmación obligatoria previa (`window.confirm`), informando el número total de versos y sílabas afectadas.
7. **Pestañas Multilingües y Configuración Limpia:**
   - Creación ilimitada de idiomas con botón compacto `+` en la barra de pestañas.
   - Edición interactiva de nombre, código ISO y rol (principal vs traducción) al hacer clic directamente sobre la pestaña activa (`.editor-lang-tab.active`).
   - Se prescinde de forma deliberada de la barra intermedia `.active-lang-settings-bar` para mantener el espacio de trabajo despejado y sin redundancias.
8. **Guía de Referencia de Frase Original para Traducción:**
   - Visualización contextual del verso original (texto original y texto alternativo/Romaji) al editar pistas de traducción.
   - Identificación explícita de versos vacíos como `⏸ [Pausa / Verso en blanco]` para mantener correspondencia precisa en pausas instrumentales.
   - Selector general de referencia en la barra de herramientas de versos con 4 modos: Ambos (Original + Alternativo), Solo texto original, Solo texto alternativo o Desactivado, con persistencia en `localStorage`.
   - Botón de copia rápida para transferir el texto original al verso traducido con un solo toque.
9. **Traducción Automática Gratuita (Zero-Backend):**
   - Integración nativa de traducción en tiempo real mediante `translationService.js` (cascada Unison API + MyMemory API).
   - Traducción puntual de verso con un clic (`Traducir`) en la tarjeta de frase, preservando tiempos e indicando localmente el estado de carga.
   - Traducción de toda la canción con un solo toque (`Traducir Toda la Canción`), respetando pausas instrumentales sin desfasar la estructura de versos.
   - **Overlay Bloqueante de Carga en Pantalla:** Durante la traducción completa (canción entera o adición de idioma), se oscurece y desenfoca el fondo con un diálogo centralizado que informa el progreso y previene interacciones o modificaciones erróneas del usuario mientras se procesa.
   - **Conservación de Texto sin Fragmentación Silábica:** Se desactiva la división silábica automática al traducir, entregando la frase íntegra sincronizada con sus marcas de inicio y fin, permitiendo al usuario silabear manualmente cuando lo desee.
   - Opción directa en el modal de nuevo idioma ("Traducir automáticamente todas las frases desde el original") para inicializar pistas de traducción instantáneas.
