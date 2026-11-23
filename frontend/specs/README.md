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

## Las tres funcionalidades (rutas verificadas en `/docs`)

> Las tres primeras funcionalidades del índice de implementación: filtros
> globales, resumen agrupado y exportación CSV. Rutas, parámetros y enums
> contrastados con `/docs` (OpenAPI 3.1 en vivo) y `curl` el 2026-11-22.

### 1. Filtros globales de datos

**Endpoints que consume** ✅ en `/docs`

| Endpoint | Rol |
|---|---|
| `GET /api/metrics/facets` | Poblar el date-picker y los catálogos de los controles |
| `GET /api/metrics` | KPIs y gráficos sobre el subconjunto filtrado |

**Tipos TypeScript de petición y respuesta**

| Sentido | Tipo | Fichero |
|---|---|---|
| Petición | `MetricsFilters = DateRangeFilter & { operation_type?: OperationType; category?: Category }` ➕ (extensión de spec: fase 2 no cubre `category`) | `components.md` spec 1 |
| Respuesta (facets) | `FacetsResponse { operation_types, business_types, categories, min_date, max_date }` | `api-types.ts` |
| Respuesta (movimientos) | `FinancialMovement[]` → derivados `KPIMetrics` | `financial-types.ts` / `types.md` |

**Valores válidos y restricciones de cada parámetro**

| Parámetro | Endpoint | Valores válidos | Restricciones |
|---|---|---|---|
| `start_date` / `end_date` | ambos | ISO `YYYY-MM-DD` (p. ej. `2025-11-01`) | Opcionales; inválido → **422**; inclusive; `start > end` → **200 con `[]`** (validar en cliente); `undefined` = sin límite; clamp a `[min_date, max_date]` de facets |
| `category` | `/api/metrics` | `'suppliers' \| 'sales' \| 'operational' \| 'administrative' \| 'others'` (5) | Enum → 422 si inválido; en facets llegan **ordenadas alfabéticamente** |
| `operation_type` | `/api/metrics` | `'income' \| 'outcome'` | Enum → 422 si inválido |
| `business_type` | — | ❌ **no aceptado** por `/api/metrics` | Filtro por canal fuera de esta barra global (spec 4/7) |

**Casos límite**

1. ✅ `start_date > end_date` → **200 con `[]`** sin 422 (curl) → invalidar en cliente, sin disparar fetch.
2. ✅ Respuesta `[]` tras filtrar → KPIs en cero/`—`, gráficos con estado vacío; `derivePeriod()` devuelve `""` sin romper.
3. ✅ Fechas fuera de `[min_date, max_date]` → clamp en cliente (rollo anual: el rango real cambia con la fecha).
4. ✅ Cambios rápidos de filtro → `AbortController` para cancelar peticiones superpuestas.

### 2. Resumen agrupado (tabla / series)

**Endpoints que consume** ✅ en `/docs`

| Endpoint | Rol |
|---|---|
| `GET /api/metrics/summary` | Ingresos, gastos y neto agrupados por día/semana/mes |

**Tipos TypeScript de petición y respuesta**

| Sentido | Tipo | Fichero |
|---|---|---|
| Petición | `DateRangeFilter & { group_by: 'day' \| 'week' \| 'month'; category?: Category; operation_type?: OperationType; business_type?: 'B2B' \| 'B2C' }` (la unión literal reutiliza `AlertsParam['group_by']`) | `param-types.ts` / `QueryParams` |
| Respuesta | `MetricsSummaryItem[] { period, income, outcome, net }` | `types.md` |

**Valores válidos y restricciones de cada parámetro**

| Parámetro | Valores válidos | Restricciones |
|---|---|---|
| `group_by` | `'day' \| 'week' \| 'month'` | Default del servidor `month`; inválido (p. ej. `quarter`) → **422** (curl); el toggle envía siempre explícito |
| `start_date` / `end_date` | ISO `YYYY-MM-DD` | Opcionales; 422 si inválido; mismas reglas que la spec 1 |
| `category` / `operation_type` | mismos enums de la spec 1 | 422 si inválido |
| `business_type` | `'B2B' \| 'B2C'` | ✅ **sí aceptado** aquí; `undefined` = ambos canales |

Formato de `period` en la respuesta (según `group_by`, verificado con curl):

| `group_by` | Formato de `period` | Ejemplo |
|---|---|---|
| `day` | `YYYY-MM-DD` | `2025-11-03` |
| `week` | `YYYY-Www` (semana ISO) | `2025-W44` |
| `month` (default) | `YYYY-MM` | `2025-12` |

**Casos límite**

1. ✅ El formato de `period` **cambia con `group_by`** → parser/formatter por modo; las semanas ISO cruzan años y no son `YYYY-MM`.
2. ✅ Los periodos sin movimientos **no aparecen** → la tabla muestra solo periodos con datos (decisión cerrada en spec 2: sin relleno de huecos).
3. ✅ `group_by=day` con 360 movimientos → hasta ~360 filas; scroll o límite visual.
4. ✅ `net` negativo → resaltar en rojo; `group_by` fuera del enum → 422 (validar en cliente antes de enviar).

### 3. Exportación CSV

**Endpoints que consume** ✅ en `/docs`

| Endpoint | Rol |
|---|---|
| `GET /api/metrics/export/csv` | Descarga el resumen mensual completo (cabecera + 12 filas) |

**Tipos TypeScript de petición y respuesta**

| Sentido | Tipo | Fichero |
|---|---|---|
| Petición | **Ninguno**: el endpoint **no acepta query params** (verificado en `/docs` + curl) | `param-types.ts` (sin tipo aplicable) |
| Respuesta | `Blob` de texto CSV con cabecera literal `period,income,outcome,net` ➕ (`type CsvExportResponse = Blob` es propuesta de UI) | contrato en `data-contract.md` |

**Valores válidos y restricciones de cada parámetro**

| Parámetro | Valores válidos | Restricciones |
|---|---|---|
| — | — | ❌ **Sin parámetros**: ningún filtro, fecha ni canal forma parte del contrato; siempre devuelve el resumen mensual completo (12 filas) |
| (respuesta) | `text/csv; charset=utf-8` ✅ curl | ⚠️ OpenAPI declara `application/json` — fiarse del header observado; sin `Content-Disposition` → nombre de fichero lo elige el cliente |

**Casos límite**

1. ✅ Los filtros activos **no** se reflejan en el CSV → copy honesto: "Exportar resumen mensual completo: no aplica los filtros" (opción (a), decisión cerrada en spec 3).
2. ✅ **Sin estado vacío** en la variante API: siempre 12 filas mensuales + cabecera.
3. ✅ Descarga fallida → bloque de error global (política de fallo del repo); botón `disabled` mientras genera.
4. ✅ Sin `Content-Disposition` → nombre sugerido `metrics_<hoy>.csv` en cliente.

---

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