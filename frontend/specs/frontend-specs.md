# Specs de funcionalidades frontend — índice

> Cada funcionalidad sigue el patrón: **Prompt del PM (outcome)** →
> **Propuesta** (tipos, componentes, casos límite). Las specs están divididas
> en tres artefactos independientes, cada uno verificado antes de su commit:
>
> | Artefacto | Contenido | Verificación |
> |---|---|---|
> | [`data-contract.md`](./data-contract.md) | Contrato de endpoints (parámetros, respuestas) con leyenda ✅/❌/❓ y evidencia `curl` | ✅ código + `/docs` (OpenAPI) + `curl` en vivo (2026-11-22) |
> | [`types.md`](./types.md) | Interfaces TypeScript propuestas, campo a campo contra los modelos Pydantic | ✅ código de `backend/app/routes.py` |
> | [`components.md`](./components.md) | Prompt del PM, componentes propuestos y casos límite por funcionalidad | ✅ código + estructura frontend |
> | [`verificacion.md`](./verificacion.md) | Rastro corto: qué se verificó, con qué herramienta y en qué commit | ✅ `git log` + registros de sesión |
> | [`api-types.ts`](./api-types.ts) | Interfaces TS de respuesta (Facets, Alerts, TopCategories) — artefacto de spec, no implementación | ✅ Pydantic + `curl` + `tsc --strict` |
> | [`param-types.ts`](./param-types.ts) | Tipos de query params (DateRange, Alerts, TopCategories) — artefacto de spec, no implementación | ✅ firmas `Query(...)` + `curl` + `tsc --strict` |
| [`README.md`](./README.md) | README del contrato de datos: índice de lectura y reglas fijas por la verificación | ✅ derivado de los artefactos verificados |
>
> **Leyenda de verificación de afirmaciones de API**:
>
> - ✅ verificada (código del backend y/o `curl`)
> - ❌ incorrecta → corregida in situ en el artefacto correspondiente
> - ❓ sin verificar → comprobación pendiente antes de implementar
> - ➕ propuesta de diseño / decisión de implementación (no es hecho de API)
>
> Al cierre de la verificación (2026-11-22): **0 afirmaciones ❓ sin
> verificar** y **0 decisiones ⚠️ abiertas** (CSV → opción (a),
> `|delta_pct|` → sin tope, huecos → sin relleno; cerradas en
> `components.md`).

## Funcionalidades (orden de implementación sugerido)

1. **Filtros globales** → `/api/metrics` + `/api/metrics/facets`
2. **Resumen agrupado** → `/api/metrics/summary` y **Exportación CSV** →
   `/api/metrics/export/csv`
3. **Comparación de periodos** → `/api/metrics/comparison` y **Alertas de
   gasto** → `/api/metrics/alerts`
4. **Top categorías** → `/api/metrics/categories/top` y **Desglose B2B/B2C** →
   `/api/metrics/b2b` + `/api/metrics/b2c`