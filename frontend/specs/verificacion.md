# Rastro de verificación (corto)

> Qué se verificó, con qué y en qué commit. Todo con fecha **2026-11-22**.
> Artefactos: [`data-contract.md`](./data-contract.md) ·
> [`types.md`](./types.md) · [`components.md`](./components.md) ·
> [`api-types.ts`](./api-types.ts) · [`param-types.ts`](./param-types.ts) ·
> [`README.md`](./README.md) · [`frontend-specs.md`](./frontend-specs.md) (índice).
>
> Glosario: "fase 2" = tipos TS (`api-types.ts` + `param-types.ts`);
> "las tres funcionalidades" = filtros/resumen/CSV (specs 1–3), salvo en
> `api-types.ts` donde = facets/alertas/top (encargo del PM).
> Ver detalle en el glosario de `README.md`.

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
| `d8db355` | `verificacion.md` — rastro corto de verificación |
| `62dd28d` | `api-types.ts` — interfaces de respuesta (facets/alertas/top) |
| `2023da4` | `param-types.ts` — tipos de query params |
| `3495f69` | cada nombre/tipo de propiedad verificado 1:1 contra OpenAPI de `/docs` |
| `a2c40ec` | JSDoc completo por propiedad (significado, valores, formato) en ambos `.ts` |
| `4f400cc` | `components.md`: tipos asociados + props por funcionalidad + ambigüedades PM cerradas |
| `4dc8a4f` | `README.md` — índice y reglas fijas |
| `68b626d` | `README.md`: las 3 funcionalidades (endpoints, tipos, params, casos límite) |

## Evidencia clave (una línea por hallazgo)

- ✅ `api-types.ts`: `FacetsResponse` / `AlertEntry`+`AlertResponse` /
  `CategoryEntry`+`TopCategoriesResponse` — **nombre y tipo de cada
  propiedad** verificados 1:1 contra los schemas OpenAPI de `/docs`
  (`MetricsFacets`, `MetricsAlert`, `TopCategoryItem`, todos `required`),
  + Pydantic + `curl`; `npx tsc --strict --noEmit` → sin errores.
- ✅ `param-types.ts`: nombre/tipo de cada query param verificado 1:1 contra
  los `parameters` de `/docs` (`threshold` number ≥0 default 0.3;
  `limit` integer 1–20 default 5; `group_by` enum; fechas `string $date
  | null` opcionales); **sin `any`, sin `object`** (grep 0 coincidencias);
  `npx tsc --strict --noEmit` → sin errores.
- ✅ `param-types.ts`: `DateRangeFilter` / `AlertsParam` /
  `TopCategoriesParams` verificados contra firmas `Query(...)` (defaults,
  `ge`/`le`) + `curl`; `npx tsc --strict --noEmit` → sin errores.
- ✅ JSDoc completo: **cada propiedad** de `api-types.ts` (14) y
  `param-types.ts` (9) con significado, valores válidos (enums, defaults,
  rangos) y formato (`YYYY-MM-DD`, `YYYY-MM`/`YYYY-Www`, 2 decimales) —
  grep `Significado|Valores|Formato` = 14+9 campos cubiertos; `tsc --strict`
  OK; `grep ': any\|: object'` → 0 en código.

- ✅ `components.md` → tipos por funcionalidad: cada una de las 7 specs
  tiene subsección "Tipos asociados" (grep = 7) enlazando con `api-types.ts`
  / `param-types.ts`: 1 → `FacetsResponse`+`DateRangeFilter`+`QueryParams`;
  2 → `DateRangeFilter`+`group_by`; 3 → ❌ sin params (CSV sin query);
  4 → `TopCategoriesResponse`/`TopCategoriesParams`; 5 → `DateRangeFilter`
  (obligatorio en `/comparison`); 6 → `AlertEntry`/`AlertResponse`+
  `AlertsParam`; 7 → `business_types`/`QueryParams`/`DateRangeFilter`.
- ✅ Props de componentes alineadas con fase 2: 7 specs con subsección
  "Props (alineadas con los tipos de la fase 2)" (grep = 7) — props tipadas con
  `FacetsResponse`, `DateRangeFilter`, `AlertResponse`, `TopCategoriesResponse`,
  `AlertsParam`, `QueryParams` y `Required<DateRangeFilter>` en `/comparison`;
  `MetricsFilters` marcado ➕ (fase 2 no cubre `category` de `/api/metrics`).
- ✅ Ambigüedades del brief PM cerradas en spec: spec 3 → opción (a) CSV
  completo con copy honesto (b descartada); spec 5 → `|delta_pct| > 100 %`
  se muestra tal cual; spec 2 → sin relleno de huecos (solo periodos con datos).
- ✅ `README.md` (contrato de datos): índice de los 7 artefactos + reglas
  fijas por verificación (copy vs contrato, header CSV real de `curl`,
  validación cliente de rango invertido, sin implementación en rama, sin
  dependencias nuevas) — derivado 1:1 de artefactos ya verificados; enlazado
  desde la tabla de `frontend-specs.md` (7 filas).
- ✅ `README.md` → tres funcionalidades (grep = 3 secciones "### "): 4 endpoints
  rutas comprobadas contra `openapi.json` en vivo (facets/metrics sin params de
  canal, summary con los 5 params, csv con **0 params**); tipos petición/respuesta
  por funcionalidad; tablas de valores válidos y restricciones (enums, defaults,
  422, 200 `[]`); 4 casos límite cada una (≥2 exigido).
- ✅ CSV: `content-type: text/csv; charset=utf-8` (OpenAPI dice `application/json` — discrepancia documentada).
- ✅ `period`: `YYYY-MM-DD` / `YYYY-Www` / `YYYY-MM` según `group_by` (curl).
- ✅ Rango invertido `start > end` → `200 []` (validar orden solo en cliente).
- ✅ `delta_pct === null ⇔ previous_period === 0`; `|delta_pct|` puede superar 100 %.
- ✅ `/export/csv` sin params; `/comparison` con `start_date`/`end_date` obligatorios.
- ✅ 422 verificados: enum inválido, fecha mal formada, `group_by=quarter`, `business_type=invalid`, `limit` fuera de 1–20, `threshold < 0`.

## Pendiente

- ✅ Cerradas en esta ronda (antes ⚠️): spec 5 → `|delta_pct| > 100 %` se
  muestra tal cual (card numérica, color por signo); spec 3 → opción (a):
  CSV = resumen mensual completo con copy honesto (opción b descartada);
  spec 2 → sin relleno de huecos.
- **0 afirmaciones ❓ sin verificar** y **0 decisiones ⚠️ abiertas** en todos
  los artefactos.