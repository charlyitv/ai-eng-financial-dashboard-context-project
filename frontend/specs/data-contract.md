# Contrato de datos (verificado)

> Afirmaciones de API contrastadas con `backend/app/routes.py` (código) y con
> `curl` contra el backend en vivo. Fecha de verificación: **2026-11-22**.
>
> Leyenda: ✅ verificada · ❌ incorrecta (corregida in situ) · ❓ sin verificar

## Endpoints consumibles por el frontend

| Endpoint | Parámetros ✅/❌ | Respuesta | Estado |
|---|---|---|---|
| `GET /api/metrics` | ✅ `start_date`, `end_date`, `category`, `operation_type` (todos opcionales). ❌ sin `business_type` | `FinancialMovement[]` cronológico | ✅ |
| `GET /api/metrics/facets` | ✅ sin parámetros | `MetricsFacets` | ✅ |
| `GET /api/metrics/summary` | ✅ `group_by` (default `month`, 422 si inválido), `start_date`, `end_date`, `category`, `operation_type`, `business_type` | `MetricsSummaryItem[]` | ✅ |
| `GET /api/metrics/export/csv` | ❌ **ningún parámetro acepta** — siempre resumen mensual completo (12 filas + cabecera) | `text/csv` (`period,income,outcome,net`) | ✅ |
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