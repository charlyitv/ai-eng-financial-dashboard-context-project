/**
 * param-types.ts — tipos de parámetros de query para las funcionalidades.
 *
 * ESPEC (artefacto de spec, no implementación). Ubicación propuesta al
 * implementar: `frontend/src/lib/param-types.ts` (junto a `api-types.ts`).
 *
 * Verificación (2026-11-22):
 *  - ✅ nombre y tipo de **cada parámetro** 1:1 contra los `parameters` de
 *    `/docs` (OpenAPI: `threshold` number min 0 default 0.3; `limit` integer
 *    1–20 default 5; `group_by` enum; fechas `string $date | null`)
 *  - ✅ firmas con `Query(...)` de `backend/app/routes.py` (defaults, `ge`,
 *    `le`, nullables)
 *  - ✅ `curl` en el backend vivo: 422 con enum/fecha/limit inválidos;
 *    defaults reales (`threshold=0.3`, `group_by=month`, `limit=5`)
 *  - ✅ `npx tsc --strict --noEmit` → sin errores
 *
 * Nota: todos los campos son opcionales porque **todos** los query params de
 * estos endpoints son `Optional`/con default en el backend; `undefined` =
 * "no enviar el parámetro" (usa el default del servidor).
 */

import type { OperationType } from '../src/lib/financial-types';

/** ISO date string estricto: 'YYYY-MM-DD' (formato `date` de FastAPI/Pydantic). */
export type YmdDate = string;

/* ──────────────────────────────────────────────────────────────────────────
 * Base — rango de fechas opcional (compartido por /metrics, /summary,
 * /alerts, /categories/top, /comparison[obligatorio], /b2b, /b2c)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * DateRangeFilter — fechas opcionales de inicio/fin.
 * ✅ Backend: `start_date: date | None = Query(default=None)` y análogo para
 *    `end_date` en todos los endpoints con rango.
 * ✅ curl: fecha mal formada (`start_date=not-a-date`) → 422.
 * ⚠️ Rango invertido (`start > end`) → **200 con `[]`** (sin 422); el orden
 *    se valida **en cliente** (resuelto en spec 1 de `components.md`).
 */
export interface DateRangeFilter {
  /** 'YYYY-MM-DD'; omitir = sin límite inferior. */
  start_date?: YmdDate;
  /** 'YYYY-MM-DD'; omitir = sin límite superior. */
  end_date?: YmdDate;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Funcionalidad 6 — Alertas de gasto
 * GET /api/metrics/alerts
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * AlertsParam — `threshold` + filtro de fechas (más `group_by` y canal,
 * que el endpoint también acepta ✅ verificado en firmas/curl).
 *
 * ✅ curl: `threshold=0.3` es el default; `threshold < 0` → 422 (`ge=0`);
 *    `threshold ≥ 1` → 200 con `[]` (sin límite superior).
 */
export interface AlertsParam extends DateRangeFilter {
  /** Fracción 0+ sobre la media (0.3 = 30 %). Omitir = default 0.3. */
  threshold?: number;
  /** 'day' | 'week' | 'month'. Omitir = 'month' (✅ curl). */
  group_by?: 'day' | 'week' | 'month';
  /** Filtro por canal; Omitir = ambos. */
  business_type?: 'B2B' | 'B2C';
}

/* ──────────────────────────────────────────────────────────────────────────
 * Funcionalidad 4/7 — Top categorías (tabla comparativa B2B vs B2C)
 * GET /api/metrics/categories/top
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * TopCategoriesParams — tipo de operación, `limit` y filtro de fechas
 * (más `business_type` ✅ aceptado por el endpoint).
 *
 * ✅ curl + firmas: `operation_type` default `'outcome'`; `limit` default 5
 *    con `ge=1 le=20` (fuera de rango → 422).
 * ❌ **Sin** parámetro `category` (el ranking siempre trae top N).
 */
export interface TopCategoriesParams extends DateRangeFilter {
  /** 'income' | 'outcome'. Omitir = 'outcome' (✅ default del backend). */
  operation_type?: OperationType;
  /** 1–20. Omitir = 5 (✅ ge=1 le=20, 422 fuera de rango). */
  limit?: number;
  /** Canal para la vista comparativa: una petición por valor (B2B y B2C). */
  business_type?: 'B2B' | 'B2C';
}

/* ──────────────────────────────────────────────────────────────────────────
 * Utilidad de serialización (➕ propuesta de spec, no hecho de API)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * ✔️ Los parámetros `undefined` **no** se serializan (omitirlos de la query
 * para que apliquen los defaults del servidor). `null` no existe en query
 * strings: en las interfaces el ausente = `undefined`.
 */
export type QueryParams = DateRangeFilter &
  Partial<AlertsParam & TopCategoriesParams>;