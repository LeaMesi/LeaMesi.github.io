# Constitución de SarangaBaranga

1. **Simplicidad del stack:** SPA estática zero-backend (Vanilla JS + Vite); persistencia 100% local en IndexedDB sin servidores ni login.
2. **Especificación como ley:** Nada se implementa si no está en la spec activa. Si falta una decisión, se para y se pregunta.
3. **Separación lógica e interfaz:** Los módulos de sincronización, parsers y persistencia no acceden al DOM ni a estilos visuales.
4. **Soberanía del Master Clock:** El tiempo del reproductor de audio gobierna el sistema; prohibidos timers o estados temporales paralelos.
5. **Política de tests:** Toda lógica pura debe tener cobertura en Vitest; la suite debe pasar al 100% antes de integrar cambios.
6. **Integridad de textos y UI:** Cero emojis en la interfaz (solo SVG funcionales); preservación exacta de letras, espacios y traducciones.
