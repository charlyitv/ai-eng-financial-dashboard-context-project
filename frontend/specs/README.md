# frontend/specs — Contrato de datos y especificaciones frontend

> Artefactos de **especificación** (no implementación) para las funcionalidades
> del dashboard financiero. Todo está verificado contra el backend en vivo
> (`/docs` OpenAPI 3.1 + `curl` + código de `backend/app/routes.py`), fecha
> **2026-11-22**. ✅ verificada · ❌ incorrecta (corregida in situ) · ❓ sin
> verificar · ➕ propuesta de diseño (decisión de implementación, no hecho de
> API). **Estado actual: 0 ❓ y 0 ⚠️ abiertos.**

## Qué hay aquí

| Artefacto | Qué resuelve |
|---|---|
| [`data-contract.md`](./data-contract.md) | **Contrato de datos**: los 9 endpoints con parámetros ✅/❌, formas de respuesta, notas de contrato y evidencia `curl` (headers reales, formatos de `period`, 422). Fuente de verdad para lo que la API acepta y devuelve. |
| [`api-types.ts`](./api-types.ts) | Interfaces TS de **respuesta** de las tres funcionalidades: `FacetsResponse` (rango de fechas y vistas B2B/B2C), `AlertEntry`/`AlertResponse` (tabla de anomalías), `CategoryEntry`/`TopCategoriesResponse` (tabla comparativa). JSDoc por propiedad: significado, valores válidos, formato. |
| [`param-types.ts`](./param-types.ts) | Tipos TS de **query params**: `DateRangeFilter`, `AlertsParam` (threshold + fechas + `group_by`), `TopCategoriesParams` (operación, limit, fechas), `QueryParams`. Todos opcionales salvo la excepción documentada de `/comparison`. |
| [`types.md`](./types.md) | Correspondencia TS ↔ modelos Pydantic de la API (incluye tipos de `src/lib/financial-types.ts`). |
| [`components.md`](./components.md) | 7 specs por funcionalidad: Prompt del PM → Desajustes wording PM ↔ API → Componentes → **Props (alineadas con fase 2)** → Tipos asociados → Casos límite. |
| [`verificacion.md`](./verificacion.md) | Rastro corto de verificación: herramientas, commits por artefacto y una línea de evidencia por hallazgo. |
| [`frontend-specs.md`](./frontend-specs.md) | Índice general con la tabla de artefactos y orden de implementación. |

## Orden de lectura recomendado

1. **`data-contract.md`** — qué endpoints existen, qué aceptan y qué devuelven.
2. **`api-types.ts` + `param-types.ts`** — los mismos hechos, en TypeScript
   compilable (`npx tsc --strict --noEmit` pasa; sin `any`, sin `object`).
3. **`components.md`** — cómo se traduce el contrato en props de componentes,
   con las ambigüedades del brief PM ya cerradas (CSV opción (a),
   `|delta_pct|` sin tope, sin relleno de huecos).
4. **`verificacion.md`** — qué se verificó, cómo y en qué commit.

## Reglas fijas por la verificación

- **El contrato manda sobre el copy**: los desajustes wording PM ↔ campos
  reales se resuelven **en la spec**, nunca en la implementación.
- **`/docs` no es infalible**: `export/csv` declara `application/json` pero
  el header real es `text/csv; charset=utf-8` (fiarse de `curl`).
- **El cliente valida lo que la API no**: rango invertido (`start > end`)
  devuelve `200 []` sin 422 → validación 100 % de cliente.
- **Sin implementar aquí**: no se escriben componentes React ni llamadas a la
  API en esta rama; los `.ts` de spec son interfaces/JSDoc, no código en
  ejecución.
- **Sin dependencias nuevas**: el patrón de fetch del repo es `fetch`
  vanilla (`App.tsx`); la capa propuesta (`lib/api.ts`) solo añade tipado,
  `AbortController` y re-fetch.