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
 *  - ✅ `curl`: 422 con enum/fecha/limit inválidos; defaults reales
 *  - ✅ `npx tsc --strict --noEmit` → sin errores; sin `any`, sin `object`
 *
 * Cada propiedad lleva JSDoc con **significado, valores válidos y formato**.
 * Todos los campos son opcionales porque **todos** los query params de estos
 * endpoints son `Optional`/con default en el backend; `undefined` = "no
 * enviar el parámetro" (aplica el default del servidor).
 */

import type { OperationType } from '../src/lib/financial-types';

/**
 * ISO date string estricto: `YYYY-MM-DD` (p. ej. `2026-01-01`).
 * Formato `date` de FastAPI: cualquier otra forma → 422 (verificado con
 * `start_date=not-a-date`).
 */
export type YmdDate = string;

/* ──────────────────────────────────────────────────────────────────────────
 * Base — rango de fechas opcional (compartido por /metrics, /summary,
 * /alerts, /categories/top, /comparison[obligatorio], /b2b, /b2c)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * DateRangeFilter — fechas opcionales de inicio/fin del rango de consulta.
 * ✅ Backend: `start_date: date | None = Query(default=None)` (y análogo
 *    `end_date`) en todos los endpoints con rango.
 * ⚠️ Rango invertido (`start > end`) → **200 con `[]`** (sin 422): el orden
 *    se valida **en cliente** (spec 1 de `components.md`).
 */
export interface DateRangeFilter {
  /**
   * Significado: inicio del rango de consulta, **inclusive** (incluye ese día).
   * Formato: `YYYY-MM-DD` estricto; inválido → 422.
   * Valores: `undefined` = sin límite inferior; si se envía, debe caer dentro
   * de `[min_date, max_date]` de `FacetsResponse` (clamp en cliente).
   */
  start_date?: YmdDate;

  /**
   * Significado: fin del rango de consulta, **inclusive** (incluye ese día).
   * Formato: `YYYY-MM-DD` estricto; inválido → 422.
   * Valores: `undefined` = sin límite superior. Si `start_date > end_date`
   * el backend responde `[]` (validar el orden en cliente).
   */
  end_date?: YmdDate;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Funcionalidad 6 — Alertas de gasto
 * GET /api/metrics/alerts
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * AlertsParam — `threshold` + filtro de fechas (más `group_by` y canal,
 * que el endpoint también acepta ✅ verificado en firmas/curl/OpenAPI).
 */
export interface AlertsParam extends DateRangeFilter {
  /**
   * Significado: sensibilidad de la alerta — fracción del exceso sobre la
   * media a partir de la cual un periodo cuenta como anomalía
   * (0.3 = +30 % sobre el baseline).
   * Formato/tipo: `number` (OpenAPI `number, minimum 0, default 0.3`).
   * Valores válidos: `[0, ∞)` — `ge=0` en el backend (`< 0` → 422);
   * **sin límite superior**: `≥ 1` es legítimo y devuelve `[]`.
   * `undefined` → default del servidor `0.3`.
   */
  threshold?: number;

  /**
   * Significado: granularidad de los periodos de la tabla de alertas.
   * Valores válidos (enum OpenAPI): `'day' | 'week' | 'month'`.
   * `undefined` → default del servidor `'month'`; cualquier otro → 422.
   * Determina también el formato de `AlertEntry.period`.
   */
  group_by?: 'day' | 'week' | 'month';

  /**
   * Significado: restre las alertas a un canal de negocio.
   * Valores válidos (enum OpenAPI): `'B2B' | 'B2C'`.
   * `undefined` = ambos canales.
   */
  business_type?: 'B2B' | 'B2C';
}

/* ──────────────────────────────────────────────────────────────────────────
 * Funcionalidad 4/7 — Top categorías (tabla comparativa B2B vs B2C)
 * GET /api/metrics/categories/top
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * TopCategoriesParams — tipo de operación, `limit` y filtro de fechas
 * (más `business_type` ✅ aceptado por el endpoint).
 * ❌ **Sin** parámetro `category` (el ranking siempre trae top N).
 */
export interface TopCategoriesParams extends DateRangeFilter {
  /**
   * Significado: sentido del ranking — qué se ordena (gasto o ingreso).
   * Valores válidos (enum OpenAPI): `'income' | 'outcome'`.
   * `undefined` → default del servidor `'outcome'`; inválido → 422.
   */
  operation_type?: OperationType;

  /**
   * Significado: tamaño del ranking — cuántas categorías devolver.
   * Tipo: entero (OpenAPI `integer, minimum 1, maximum 20, default 5`).
   * Valores válidos: enteros `1–20` (fuera de rango → 422).
   * `undefined` → default del servidor `5`.
   */
  limit?: number;

  /**
   * Significado: canal para la vista comparativa — una petición por valor
   * (`?business_type=B2B` y `?business_type=B2C`), combinadas en cliente.
   * Valores válidos (enum OpenAPI): `'B2B' | 'B2C'`.
   * `undefined` = ambos canales mezclados en el mismo ranking.
   */
  business_type?: 'B2B' | 'B2C';
}

/* ──────────────────────────────────────────────────────────────────────────
 * Utilidad de serialización (➕ propuesta de spec, no hecho de API)
 * ───────────────────────────────────────────────────────────────────────── */

/**
 * Significado: unión opcional de los filtros anteriores para construir la
 * query string de cualquier endpoint de los tres grupos.
 * Valores: `DateRangeFilter & Partial<AlertsParam & TopCategoriesParams>`.
 * Regla de serialización: los campos `undefined` **no** se serializan
 * (omitirlos para que apliquen los defaults del servidor). `null` no existe
 * en query strings: en estas interfaces el ausente = `undefined`.
 */
export type QueryParams = DateRangeFilter &
  Partial<AlertsParam & TopCategoriesParams>;