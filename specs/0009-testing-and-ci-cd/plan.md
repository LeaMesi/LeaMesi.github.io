# Plan Futuro: Pruebas y CI/CD
**Spec asociada:** [`spec.md`](file:///home/hezztia/Documents/SarangaBaranga/specs/0009-testing-and-ci-cd/spec.md)

---

## 1. Pruebas End-to-End (E2E) con Playwright
* **Objetivo:** Automatizar flujos de usuario reales en navegadores sin cabeza (Chromium, Firefox, WebKit):
  - Flujo de creación de canción -> guardado en IndexedDB -> reproducción en Modo Letra.
  - Flujo de importación de paquete JSON -> asignación a biblioteca -> reproducción en playlist.
  - Flujo de búsqueda online -> selección de canción -> precarga en el editor.

## 2. Reporte Visual de Cobertura en Pull Requests
* **Objetivo:** Generar badge y comentario automático en GitHub Actions con el porcentaje de líneas cubiertas por Vitest.
