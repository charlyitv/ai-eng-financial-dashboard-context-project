# Contrato de datos (verificado)

> Afirmaciones de API contrastadas con `backend/app/routes.py` (código), con
> **`/docs`** (OpenAPI 3.1 del backend en vivo) y con `curl` contra el backend.
> Fecha de verificación: **2026-11-22**.
>
> Leyenda: ✅ verificada · ❌ incorrecta (corregida in situ) · ❓ sin verificar

## Endpoints consumibles por el frontend

| Endpoint | Parámetros ✅/❌ | Respuesta | Estado |
|---|---|---|---|
| `GET /api/metrics` | ✅ `start_date`, `end_date`, `category`, `operation_type` (todos opcionales). ❌ sin `business_type` | `FinancialMovement[]` cronológico | ✅ |
| `GET /api/metrics/facets` | ✅ sin parámetros | `MetricsFacets` | ✅ |
| `GET /api/metrics/summary` | ✅ `group_by` (default `month`, 422 si inválido), `start_date`, `end_date`, `category`, `operation_type`, `business_type` | `MetricsSummaryItem[]` | ✅ |
| `GET /api/metrics/export/csv` | ❌ **ningún parámetro acepta** — siempre resumen mensual completo (12 filas + cabecera) | ✅ curl: `content-type: text/csv; charset=utf-8` (`period,income,outcome,net`). ⚠️ OpenAPI declara `application/json` — discrepancia documentada; el contrato real es el de curl | ✅ |
| `GET /api/metrics/categories/top` | ✅ `operation_type` (default `outcome`), `limit` (default 5, `ge=1 le=20`), `start_date`, `end_date`, `business_type`. ❌ sin `category` | `TopCategoryItem[]` | ✅ |
| `GET /api/metrics/comparison` | ✅ `start_date`/`end_date` **obligatorios** (422 sin ellos), `business_type`. ❌ sin `category` ni `operation_type` | `MetricsComparison` | ✅ |
| `GET /api/metrics/alerts` | ✅ `threshold` (default 0.3, `ge=0` — ❌ sin límite superior), `group_by` (default `month`), `start_date`, `end_date`, `business_type`. ❌ sin `category` ni `operation_type` | `MetricsAlert[]` | ✅ |
| `GET /api/metrics/b2b` | ✅ `start_date`, `end_date`, `category`, `operation_type` | `FinancialMovement[]` (solo B2B) | ✅ |
| `GET /api/metrics/b2c` | ✅ `start_date`, `end_date`, `category`, `operation_type` | `FinancialMovement[]` (solo B2C) | ✅ |

Notas de contrato:

- ✅ El periodo anterior de `comparison` se calcula en servidor con la misma
  duración: `previous = [start − duration − 1d, start − 1d]`.
- ✅ El baseline de `alerts` es la media de `outcome` de los periodos
  anteriores ya procesados; el primer periodo nunca genera alerta.
- ✅ `summary`, `top`, `alerts` y `comparison` aceptan `business_type`;
  `/api/metrics`, `b2b` y `b2c` no lo necesitan (son por canal).

## Verificación con curl (2026-11-22)

### `delta_pct` — signo y `null` (spec 5)

| Rango | previous | current | `delta_pct` | Signo |
|---|---|---|---|---|
| 2026-01 | −35 017.53 | +48 056.49 | +237.24 | ✅ mejora → + |
| 2026-04 | −18 933.38 | +80 654.92 | +525.99 | ✅ mejora → + |
| 2026-10 | −9 371.66 | +45 965.92 | +590.48 | ✅ mejora → + |
| 2026-09 | +5 335.54 | −9 371.66 | −275.65 | ✅ empeora → − |
| 2026-03 | +137 061.59 | −20 287.47 | −114.8 | ✅ empeora → − |
| (rango con `previous = 0`) | 0.0 | — | `null` | ✅ |

Conclusiones:

1. ✅ `delta_pct === null` ⇔ `previous_period === 0` → renderizar `"—"`/`"n/a"`.
2. ✅ `sign(delta_pct) === sign(delta_abs)` **siempre** (denominador
   `abs(previous_net) ≥ 0`) → el color por signo es consistente.
3. ⚠️ **Decisión de UI pendiente**: `|delta_pct|` puede superar 100 % cuando
   el neto cruza el cero (hasta +590 % con datos reales); definir con el PM
   si se muestra tal cual o se limita la escala.
4. ✅ La métrica comparada es el **neto** (`calculate_net_value`), no ingresos.

### Otros chequeos

- ✅ `group_by` inválido en `summary` → 422 (validación `Literal` de FastAPI).
- ✅ `limit` fuera de 1–20 en `top` → 422.
- ✅ `threshold < 0` en `alerts` → 422; `threshold ≥ 1` → 200 con `[]`.
- ✅ El CSV no envía `Content-Disposition` → el nombre de fichero lo elige el
  cliente.
- ❓ **sin verificar**: ninguno pendiente en este documento.

### Funcionalidades 1–3 — evidencia curl (2026-11-22, desde `/docs` → OpenAPI 3.1)

| Chequeo | Resultado | Estado |
|---|---|---|
| `/health` antes de todo | `200` | ✅ |
| `GET /api/metrics/export/csv` headers | `content-type: text/csv; charset=utf-8`, sin `Content-Disposition`, `content-length: 453` (cabecera + 12 filas) | ✅ |
| `GET /api/metrics/facets` cuerpo | `operation_types: [income, outcome]`, `business_types: [B2B, B2C]`, `categories` **orden alfabético** (`administrative, operational, others, sales, suppliers` — ≠ orden del enum Pydantic), `min_date: 2025-11-01`, `max_date: 2026-10-28` | ✅ |
| `GET /api/metrics?category=sales&operation_type=income` | `200` (filtros combinados) | ✅ |
| `GET /api/metrics?category=invalid` | `422` (enum) | ✅ |
| `GET /api/metrics?start_date=not-a-date` | `422` (formato date) | ✅ |
| `GET /api/metrics` sin filtros | `200` con **360** movimientos | ✅ |
| `group_by=day` → formato `period` | `YYYY-MM-DD` (`2025-11-01`) | ✅ |
| `group_by=week` → formato `period` | `YYYY-Www` ISO con año (`2025-W44`) | ✅ |
| `group_by=month` → formato `period` | `YYYY-MM` (`2025-11`) | ✅ |
| `group_by=quarter` | `422` | ✅ |
| `business_type=invalid` en `summary` | `422` | ✅ |
| `summary` con los 5 filtros combinados | `200` | ✅ |
| **Rango invertido** (`start_date > end_date`) en `/api/metrics` y `/summary` | **`200` con `[]`** — el backend **no** valida el orden; la invalidación es responsabilidad del cliente | ✅ (nuevo) |
| OpenAPI de `/export/csv` declara `application/json` | ⚠️ discrepancia vs. `text/csv` real; el spec de UI usa el header observado con curl | ✅ |