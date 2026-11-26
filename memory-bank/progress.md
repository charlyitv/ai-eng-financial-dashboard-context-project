# Progreso de skills y verificaciones

Fecha de actualización: 2026-11-25

## Skills del ecosistema revisadas y aplicadas

- **`addyosmani/web-quality-skills@performance`** — elegida y aplicada como revisión de rendimiento. Es pertinente porque el build frontend registrado previamente señaló un chunk minificado por encima del umbral de 500 kB. La skill recomienda medir antes de optimizar; por eso se registró la advertencia y el tamaño comprimido previo (175,31 kB gzip) sin asumir que fueran una regresión de experiencia de usuario.
- **`addyosmani/web-quality-skills@seo`** — se buscó con `npx skills find seo`, pero no se instaló ni se aplicó. La búsqueda también devolvió otras skills SEO.
- **`performance` y `seo`** fueron los dos temas utilizados para satisfacer la búsqueda de skills comunitarias. Ejecutar `npx skills find` fue descubrimiento, no aplicación de esas skills.

## Cambios y verificaciones registrados

- Se creó `memory-bank/performance-skill-review.md` con la razón de elegir la skill de rendimiento, la evidencia disponible y los límites de medición.
- Se creó `.agents/skills/api-contract-verification/SKILL.md`, una skill interna con objetivo, inputs, output esperado, flujo y criterios de aceptación para contrastar código de API, OpenAPI, respuestas HTTP y specs.
- La skill interna se aplicó mediante el agente a una auditoría de solo lectura de `GET /api/metrics/export/csv`. El resultado fue accionable y dejó explícitos los límites: no se pudo obtener una verificación en vivo de OpenAPI/runtime en esa ejecución; los datos históricos se mantuvieron como históricos.
- Tras esa prueba, se mejoró la skill con una alternativa: probar `/openapi.json` si `/docs` no es legible, probar herramientas HTTP disponibles si no hay terminal y marcar como no ejecutadas las instrucciones de repetición cuando ninguna herramienta pueda enviar la solicitud.
- Se actualizó `.agents/rules/project-layout.md` para incluir la skill interna nueva en el inventario.
- Se comprobó que no hubo errores reportados por el editor para los dos documentos modificados en la última actualización. No se ejecutaron suites de pruebas de la aplicación porque los cambios fueron de documentación/workflow.
- No se modificaron componentes React ni implementaciones de llamadas a API.

## Estado y cautelas

- El warning de chunk de Vite no demuestra por sí solo un problema de rendimiento. La evidencia de bundle (584,46 kB minificado / 175,31 kB gzip) corresponde a un build anterior, no a una medición actual de navegación.
- El ensayo de `api-contract-verification` no verificó OpenAPI/runtime en vivo. La discrepancia CSV registrada previamente y el caso de rango de fechas invertido siguen siendo ejemplos históricos que deben re-verificarse antes de tratarlos como comportamiento actual.
- El estado de seguimiento/versionado de estos documentos debe consultarse con `git status`; esta nota registra el trabajo y no presupone que esté commiteado.
