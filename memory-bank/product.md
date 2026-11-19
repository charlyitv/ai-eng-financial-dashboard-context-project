# Producto: Dashboard de Métricas Financieras

> Fuentes de este documento: `backend/app/routes.py`, `backend/app/main.py`,
> `frontend/src/App.tsx`, `frontend/src/lib/financial-utils.ts`,
> `frontend/src/components/dashboard/*`. Toda afirmación es verificable en el repo.

## ¿Qué es?

Un dashboard web que visualiza métricas financieras (ingresos, gastos y
beneficio) a partir de un conjunto de movimientos. Consta de dos partes:

- **Backend (FastAPI)**: una API que genera y sirve datos de movimientos
  financieros de forma determinista (semilla `seed=42`) y expone agregaciones.
- **Frontend (React + Vite)**: una SPA que consume la API, calcula los KPIs en
  cliente y los renderiza con gráficos.

## ¿Para quién?

El repo no declara un usuario/público objetivo en ningún fichero (sin
documentación de usuario más allá de `README.md` / `README.es.md`); no se
afirma nada más aquí para no inventar.

## Qué muestra el frontend

Fuente: `frontend/src/App.tsx` y `frontend/src/components/dashboard/`.

- **Cabecera con periodo** (`dashboard-header.tsx`): la etiqueta de periodo se
  **deriva de los datos** con `derivePeriod()` (ej. `2025-2026`), nunca se
  hardcodea (fix del commit `4b19413`).
- **Fila de KPIs** (`kpi-row.tsx`, `kpi-card.tsx`): total ingresos
  (`totalIncome`), total gastos (`totalOutcome`), beneficio (`profit`) y
  porcentaje de beneficio (`profitPercent`), calculados en cliente por
  `computeKPIs()` en `frontend/src/lib/financial-utils.ts`.
- **Gráfico ingresos vs gastos** (`income-outcome-chart.tsx`): serie mensual de
  ingresos y gastos, calculada por `computeMonthlyData()`.
- **Gráfico de % de beneficio** (`profit-percent-chart.tsx`): porcentaje mensual
  de beneficio.
- **Estados de carga y error**: skeleton (`components/ui/skeleton.tsx`) mientras
  carga; si el fetch falla, se muestra **únicamente** el bloque de error de
  `App.tsx` (política de fallo: no se sirven datos de fuentes alternativas).

El frontend hace **un único** `fetch` a `/api/metrics` (verificado con grep en
`App.tsx`); los demás endpoints del backend no se consumen hoy.

## Qué hace el backend

Fuente: `backend/app/main.py` y `backend/app/routes.py`.

- `FastAPI(title="Financial Metrics API")` con middleware CORS
  (`allow_origins=["*"]`) y un único `APIRouter` montado desde `app/routes.py`.
- Genera movimientos con `generate_mock_movements(seed=42)`:
  **360 movimientos** (12 meses × 30 días), orden cronológico estricto
  (invariante fijado por los tests). Categorías: `suppliers`, `sales`,
  `operational`, `administrative`, `others`; tipos: `income`/`outcome`;
  negocio: `B2B`/`B2C` (ver `frontend/src/lib/financial-types.ts`).
- Rollover anual de fechas: `_year_for_month()` coloca cada mes en el año actual
  si ya pasó, si no en el anterior — los datos se desplazan con el reloj.

## Endpoints (11 rutas en total)

Verificados con `grep -c "@router.get" backend/app/routes.py` → **11** y
listados con `grep -n "@router.get"`:

| # | Método | Ruta | Respuesta |
|---|--------|------|-----------|
| 1 | GET | `/health` | `{"status": "ok"}` |
| 2 | GET | `/health/ready` | modelo `HealthReady` (determinista) |
| 3 | GET | `/api/metrics` | lista `FinancialMovement[]`; filtros: `start_date`, `end_date`, `category`, `operation_type` |
| 4 | GET | `/api/metrics/facets` | `MetricsFacets` |
| 5 | GET | `/api/metrics/summary` | lista `MetricsSummaryItem[]`; `group_by` (default `month`), filtros de fecha/tipo/negocio |
| 6 | GET | `/api/metrics/export/csv` | `Response` CSV (`text/csv`) |
| 7 | GET | `/api/metrics/categories/top` | lista `TopCategoryItem[]`; `operation_type`, `limit` (1–20), filtros |
| 8 | GET | `/api/metrics/comparison` | `MetricsComparison` |
| 9 | GET | `/api/metrics/alerts` | lista `MetricsAlert[]`; `threshold` (default 0.3), `group_by`, filtros |
| 10 | GET | `/api/metrics/b2b` | lista `FinancialMovement[]` (solo B2B) |
| 11 | GET | `/api/metrics/b2c` | lista `FinancialMovement[]` (solo B2C) |

Notas verificadas:

- 9 de las 11 rutas llaman `generate_mock_movements(seed=42)` (las dos
  excepciones son `health` y `health/ready`, que no generan datos).
- Los endpoints `/health/ready` y `/api/metrics/export/csv` fueron añadidos en
  el commit `b519273`.
- Regla de `.agents/rules/tests-are-contract.md`: todo endpoint nuevo lleva
  test pytest, incluida la validación de formato si no es JSON.

## Qué NO hace

Hechos verificados por ausencia/lectura:

- **No hay base de datos**: `requirements.txt` solo contiene
  `fastapi`, `uvicorn[standard]`, `debugpy`, `pytest`, `pytest-cov`, `httpx`.
  No hay drivers ORM ni sqlalchemy; los datos se generan en memoria.
- **No hay autenticación ni autorización**: no aparece ninguna dependencia ni
  configuración de seguridad en el código; CORS está en `allow_origins=["*"]`.
- **No hay escritura**: las 11 rutas son GET; no hay POST/PUT/DELETE ni
  persistencia.
- **No hay i18n ni multi-tenant** (sin evidencia en el repo).
- El frontend **no consume** 9 de los 11 endpoints (grep de `fetch(` en
  `App.tsx` → 1 sola llamada, a `/api/metrics`).