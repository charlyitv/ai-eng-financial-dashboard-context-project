# Rastro de verificación (corto)

> Qué se verificó, con qué y en qué commit. Todo con fecha **2026-11-22**.
> Artefactos: [`data-contract.md`](./data-contract.md) ·
> [`types.md`](./types.md) · [`components.md`](./components.md) ·
> [`frontend-specs.md`](./frontend-specs.md) (índice).

## Herramientas usadas

| Fuente | Uso |
|---|---|
| `backend/app/routes.py` (código) | fuente de verdad de params, modelos Pydantic, defaults y 422 |
| `/docs` (OpenAPI 3.1 en vivo) | mapeo de endpoints de las 3 funcionalidades 1–3 |
| `curl` en `localhost:8000` | respuestas reales, headers, formatos, códigos de error |
| `frontend/src/` (solo lectura) | contraste de patrones de fetch/estados existentes |

## Commits de verificación

### En `main` (specs iniciales, ya en `origin/main`)

| Commit | Qué aporta |
|---|---|
| `3d8a8b6` | `data-contract.md` — contrato de los 9 endpoints |
| `234a50d` | `types.md` — interfaces TS vs Pydantic |
| `f330c72` | `components.md` — prompts PM, componentes, casos límite |
| `49f7c3a` | `frontend-specs.md` — índice |
| `f3cc049` | `memory-bank/current-state.md` actualizado |

### En `feature/frontend-specs` (ronda `/docs` + curl)

| Commit | Qué aporta |
|---|---|
| `4bf8bc2` | mueve specs a `frontend/specs/` |
| `820aa01` | refresca rutas en `current-state.md` |
| `f18f377` | verificación func. 1–3: CSV `text/csv` real, orden de facets, rango invertido → `200 []` |
| `51ef057` | formatos de `period` por `group_by` (curl) |
| `71326dd` | evidencia curl en casos límite de filtros y CSV |
| `d4609a4` | `/docs` como fuente de verificación en el índice |
| `8506987` | `current-state.md`: branch + ronda de verificación |
| `8cbf850` | contraste con el patrón de fetch de `App.tsx` |
| `cb45a33` | desajustes wording PM ↔ campos API (resueltos en spec) |

## Evidencia clave (una línea por hallazgo)

- ✅ `api-types.ts`: `FacetsResponse` / `AlertEntry`+`AlertResponse` /
  `CategoryEntry`+`TopCategoriesResponse` verificadas contra Pydantic +
  `curl` (2026-11-22); `npx tsc --strict --noEmit` → sin errores.
- ✅ `param-types.ts`: `DateRangeFilter` / `AlertsParam` /
  `TopCategoriesParams` verificados contra firmas `Query(...)` (defaults,
  `ge`/`le`) + `curl`; `npx tsc --strict --noEmit` → sin errores.

- ✅ CSV: `content-type: text/csv; charset=utf-8` (OpenAPI dice `application/json` — discrepancia documentada).
- ✅ `period`: `YYYY-MM-DD` / `YYYY-Www` / `YYYY-MM` según `group_by` (curl).
- ✅ Rango invertido `start > end` → `200 []` (validar orden solo en cliente).
- ✅ `delta_pct === null ⇔ previous_period === 0`; `|delta_pct|` puede superar 100 %.
- ✅ `/export/csv` sin params; `/comparison` con `start_date`/`end_date` obligatorios.
- ✅ 422 verificados: enum inválido, fecha mal formada, `group_by=quarter`, `business_type=invalid`, `limit` fuera de 1–20, `threshold < 0`.

## Pendiente

- ⚠️ Decisión de UI con el PM: escala de `|delta_pct| > 100 %` (spec 5).
- ⚠️ Decisión de PM en spec 3: copy "dataset completo" vs export client-side.
- **0 afirmaciones ❓ sin verificar** en todos los artefactos.