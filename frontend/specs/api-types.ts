/**
 * api-types.ts — interfaces de respuesta para las tres funcionalidades.
 *
 * ESPEC (artefacto de spec, no implementación). Ubicación propuesta al
 * implementar: `frontend/src/lib/api-types.ts` (ver `types.md`).
 *
 * Verificación (2026-11-22):
 *  - ✅ campo a campo contra los modelos Pydantic de `backend/app/routes.py`
 *  - ✅ formas reales con `curl` en el backend vivo:
 *      GET /api/metrics/facets
 *      GET /api/metrics/alerts?threshold=0.2
 *      GET /api/metrics/categories/top?limit=3
 *
 * Nota: los tipos base (OperationType, Category, BusinessType) existen ya en
 * `frontend/src/lib/financial-types.ts` y no se redefinen aquí.
 */

import type {
  BusinessType,
  Category,
  OperationType,
} from '../src/lib/financial-types';

/** ISO date string ('YYYY-MM-DD') — coincide con `date` de Pydantic. */
export type IsoDate = string;

/* ──────────────────────────────────────���───────────────────────────────────
 * Funcionalidad 1 — Filtros globales (referencia de rango y vistas)
 * GET /api/metrics/facets  →  200 MetricsFacets (sin query params)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * FacetsResponse — valores válidos para poblar los controles de filtro:
 * rango de fechas permitido (`min_date`/`max_date`) y las vistas por canal
 * B2B vs B2C (`business_types`).
 *
 * ✅ curl: `categories` llega en orden alfabético (≠ orden del enum Pydantic);
 * poblar los selects con este orden, no hardcodear.
 */
export interface FacetsResponse {
  operation_types: OperationType[]; // ✅ [income, outcome]
  business_types: BusinessType[]; // ✅ [B2B, B2C] → vistas por canal
  categories: Category[]; // ✅ 5 valores, orden alfabético
  min_date: IsoDate; // ✅ ej. 2025-11-01 (límite inferior del date-picker)
  max_date: IsoDate; // ✅ ej. 2026-10-28 (límite superior del date-picker)
}

/* ──────────────────────────────────────────────────────────────────────────
 * Funcionalidad 6 — Tabla de anomalías (alertas de gasto)
 * GET /api/metrics/alerts  →  200 MetricsAlert[] (JSON array, NO objeto)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * AlertEntry — un periodo cuyo gasto supera el baseline.
 * ✅ curl: `period` usa formato `YYYY-MM` con `group_by=month` (default).
 * ✅ `baseline_average` siempre > 0 (el backend solo calcula el ratio si
 *    baseline > 0) → sin riesgo de 0/inf/null.
 */
export interface AlertEntry {
  period: string; // 'YYYY-MM-DD' | 'YYYY-Www' | 'YYYY-MM' según group_by
  outcome_total: number; // gasto total del periodo
  baseline_average: number; // media de outcome de periodos anteriores (> 0)
  increase_ratio: number; // outcome_total / baseline_average − 1 (≥ threshold)
}

/**
 * AlertResponse — la API responde **directamente con el array** (no un
 * objeto envolvente); el `[]` es estado vacío legítimo (ej. threshold ≥ 1).
 * ✅ OpenAPI + curl.
 */
export type AlertResponse = AlertEntry[];

/* ──────────────────────────────────────────────────────────────────────────
 * Funcionalidad 4/7 — Tabla comparativa B2B vs B2C (top categorías)
 * GET /api/metrics/categories/top  →  200 TopCategoryItem[]
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * CategoryEntry — una categoría del ranking.
 * ✅ curl: ranking ordenado por `total_amount` descendente.
 * ⚠️ El endpoint **no acepta filtro `category`** y trae solo top N
 *    (`limit` default 5, ge=1 le=20) → nunca tipar como listado completo.
 */
export interface CategoryEntry {
  category: Category;
  operation_type: OperationType; // default del endpoint: 'outcome'
  total_amount: number; // ✅ curl: 2 decimales en la respuesta
}

/**
 * TopCategoriesResponse — también array directo.
 * La vista comparativa B2B vs B2C NO viene de un solo array: se obtiene con
 * dos peticiones (`?business_type=B2B` y `?business_type=B2C`) y se combinan
 * en cliente (✅ resuelto en spec 7 de `components.md`).
 */
export type TopCategoriesResponse = CategoryEntry[];