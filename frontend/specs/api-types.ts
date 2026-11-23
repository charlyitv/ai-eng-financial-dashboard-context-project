/**
 * api-types.ts — interfaces de respuesta para las tres funcionalidades con
 * tipo propio (encargo del PM): facets (spec 1 de components.md), alertas
 * (spec 6) y top categorías (specs 4/7). ⚠️ No confundir con "las tres
 * funcionalidades" de README.md, que son filtros/resumen/CSV (specs 1–3).
 *
 * ESPEC (artefacto de spec, no implementación). Ubicación propuesta al
 * implementar: `frontend/src/lib/api-types.ts` (ver `types.md`).
 *
 * Verificación (2026-11-22):
 *  - ✅ nombre y tipo de **cada propiedad** 1:1 contra los schemas OpenAPI
 *    de `/docs` (`MetricsFacets`, `MetricsAlert`, `TopCategoryItem`)
 *  - ✅ campo a campo contra los modelos Pydantic de `backend/app/routes.py`
 *  - ✅ formas reales con `curl` en el backend vivo:
 *      GET /api/metrics/facets
 *      GET /api/metrics/alerts?threshold=0.2
 *      GET /api/metrics/categories/top?limit=3
 *  - ✅ `npx tsc --strict --noEmit` → sin errores; sin `any`, sin `object`
 *
 * Cada propiedad lleva JSDoc con **significado, valores válidos y formato**.
 * Nota: los tipos base (OperationType, Category, BusinessType) existen ya en
 * `frontend/src/lib/financial-types.ts` y no se redefinen aquí.
 */

import type {
  BusinessType,
  Category,
  OperationType,
} from '../src/lib/financial-types';

/**
 * ISO date string estricto: `YYYY-MM-DD` (p. ej. `2025-11-01`).
 * Formato `date` de FastAPI/Pydantic en OpenAPI (`string $date`).
 */
export type IsoDate = string;

/* ──────────────────────────────────────────────────────────────────────────
 * Funcionalidad 1 — Filtros globales (referencia de rango y vistas)
 * GET /api/metrics/facets  →  200 MetricsFacets (sin query params)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * FacetsResponse — valores válidos para poblar los controles de filtro:
 * rango de fechas permitido (`min_date`/`max_date`), catálogo de filtros y
 * las vistas por canal B2B vs B2C (`business_types`).
 *
 * Fuente de verdad de la UI: poblar los selects desde esta respuesta, no
 * hardcodear enums. La respuesta siempre está presente (sin estado vacío).
 *
 * ✅ curl: `categories` llega en orden alfabético (≠ orden del enum Pydantic).
 */
export interface FacetsResponse {
  /**
   * Significado: tipos de operación disponibles para filtrar (ingreso/gasto).
   * Valores válidos (enum OpenAPI): `'income' | 'outcome'`.
   * Orden real en la respuesta: `[income, outcome]`. Longitud: 2.
   */
  operation_types: OperationType[];

  /**
   * Significado: canales de negocio disponibles → vistas B2B vs B2C.
   * Valores válidos (enum OpenAPI): `'B2B' | 'B2C'`.
   * Orden real en la respuesta: `[B2B, B2C]`. Longitud: 2.
   */
  business_types: BusinessType[];

  /**
   * Significado: categorías disponibles para el filtro de categoría.
   * Valores válidos (enum OpenAPI, 5 elementos):
   * `'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'`.
   * ✅ curl: llegan en orden **alfabético**
   * (`administrative, operational, others, sales, suppliers`) — poblar los
   * selects con ese orden, no con el del enum.
   */
  categories: Category[];

  /**
   * Significado: límite inferior del rango de fechas con datos (mínimo del
   * date-picker).
   * Formato: ISO `YYYY-MM-DD` (`string $date` en OpenAPI).
   * ✅ curl: `2025-11-01` (rollo anual `_year_for_month`: cambia con el reloj).
   */
  min_date: IsoDate;

  /**
   * Significado: límite superior del rango de fechas con datos (máximo del
   * date-picker).
   * Formato: ISO `YYYY-MM-DD`.
   * ✅ curl: `2026-10-28` — **no es "hoy"**: es la última fecha generada.
   */
  max_date: IsoDate;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Funcionalidad 6 — Tabla de anomalías (alertas de gasto)
 * GET /api/metrics/alerts  →  200 MetricsAlert[] (JSON array, NO objeto)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * AlertEntry — un periodo cuyo gasto supera el baseline: una fila de la
 * tabla de anomalías.
 *
 * ✅ curl: `[{"period": "2025-12", "outcome_total": 103378.98,
 * "baseline_average": 41404.44, "increase_ratio": 1.4968}, ...]`.
 * Orden real de la respuesta: `period` ascendente.
 */
export interface AlertEntry {
  /**
   * Significado: periodo que está en alerta.
   * Formato **varía con `group_by`** (no es siempre lo mismo):
   * - `'YYYY-MM-DD'` con `group_by=day` (p. ej. `2025-11-03`)
   * - `'YYYY-Www'` semana ISO con `group_by=week` (p. ej. `2025-W44`)
   * - `'YYYY-MM'` con `group_by=month` (default; p. ej. `2025-12`)
   * Valores: `string` no vacío; validar con el parser del modo activo.
   */
  period: string;

  /**
   * Significado: gasto total (`outcome`) del periodo alertado.
   * Tipo `number` (float). Formato en la respuesta: 2 decimales.
   * Valores: `≥ 0`; nunca `null` ni negativo.
   */
  outcome_total: number;

  /**
   * Significado: baseline = media de `outcome` de los periodos anteriores ya
   * procesados (no es una media global ni configurable).
   * Tipo `number`. Formato: 2 decimales.
   * Valores: ✅ **siempre > 0** (el backend solo calcula el ratio si
   * `baseline > 0`) → sin riesgo de `0`/`Infinity`/`null`.
   */
  baseline_average: number;

  /**
   * Significado: cuánto se ha disparado el gasto sobre la media:
   * `outcome_total / baseline_average − 1`.
   * Valores: `≥ threshold` (por diseño ≥ 0; con `threshold ≥ 1` no hay
   * filas). Ejemplo: `1.4968` = +149.68 % sobre la media. Formato: float.
   * El primer periodo de la serie nunca aparece (sin baseline previo).
   */
  increase_ratio: number;
}

/**
 * Significado: envoltorio de respuesta de alertas — **no lo hay**: la API
 * devuelve directamente el array.
 * Valores: `AlertEntry[]`; `[]` es estado vacío legítimo (p. ej.
 * `threshold ≥ 1` → 200 con lista vacía, sin error).
 * ✅ OpenAPI + curl.
 */
export type AlertResponse = AlertEntry[];

/* ──────────────────────────────────────────────────────────────────────────
 * Funcionalidad 4/7 — Tabla comparativa B2B vs B2C (top categorías)
 * GET /api/metrics/categories/top  →  200 TopCategoryItem[]
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * CategoryEntry — una categoría del ranking (una fila de la tabla
 * comparativa).
 *
 * ✅ curl: `[{"category": "others", "operation_type": "outcome",
 * "total_amount": 224428.44}, ...]`, ordenado por `total_amount` descendente.
 * ⚠️ El endpoint **no acepta filtro `category`** y trae solo top N
 * (`limit` default 5, `ge=1 le=20`) → nunca tipar como listado completo.
 */
export interface CategoryEntry {
  /**
   * Significado: categoría rankeada.
   * Valores válidos (enum OpenAPI, 5 elementos):
   * `'suppliers' | 'sales' | 'operational' | 'administrative' | 'others'`.
   * Dentro de una misma respuesta no se repite (ranking de categorías).
   */
  category: Category;

  /**
   * Significado: sentido del ranking, espejo del parámetro `operation_type`
   * enviado en la petición.
   * Valores válidos (enum OpenAPI): `'income' | 'outcome'`.
   * Default del endpoint: `'outcome'` (gasto).
   */
  operation_type: OperationType;

  /**
   * Significado: suma total de la categoría en el sentido `operation_type`.
   * Tipo `number`. Formato en la respuesta: **2 decimales**
   * (p. ej. `224428.44`); redondear a 0 decimales solo al pintar
   * (`formatCurrency`). Valores: `≥ 0`.
   */
  total_amount: number;
}

/**
 * Significado: lista del ranking de categorías — respuesta directa, sin
 * objeto envolvente.
 * Valores: `CategoryEntry[]` ordenado por `total_amount` descendente;
 * `[]` = estado vacío posible (rangos de fecha estrechos).
 *
 * La vista comparativa B2B vs B2C **no** viene de un solo array: se obtiene
 * con dos peticiones (`?business_type=B2B` y `?business_type=B2C`) y se
 * combinan en cliente (✅ resuelto en spec 7 de `components.md`).
 */
export type TopCategoriesResponse = CategoryEntry[];