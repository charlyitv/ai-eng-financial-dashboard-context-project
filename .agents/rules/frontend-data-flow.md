# Rule: Frontend owns KPI computation; never hardcode displayed facts

**Repo facts this maps to:**
- `frontend/src/App.tsx`: un **único** `fetch` a `/api/metrics`; los otros 8
  endpoints del backend (`facets`, `summary`, `comparison`, `alerts`, `b2b`,
  `b2c`, `categories/top`, `health`) no se consumen.
- `frontend/src/lib/financial-utils.ts`: `computeKPIs` y `computeMonthlyData`
  calculan KPIs y series mensuales **en cliente**; el backend solo envía crudos.
- `frontend/src/lib/financial-types.ts`: todos los tipos compartidos
  (`FinancialMovement`, `KPIMetrics`, `MonthlyDataPoint`).
- Commit `4b19413`: la etiqueta de periodo estaba hardcodeada ("2024 - Full Year"
  en `App.tsx` y como default de `dashboard-header.tsx`) mientras los datos
  reales eran 2025-2026 — bug corregido derivando el periodo con `derivePeriod()`.

**Rules:**
1. Prohibido hardcodear en la UI valores derivados de los datos (periodos,
   años, totales). Si se muestra, se calcula desde la respuesta de la API.
2. Endpoint nuevo → su alcance lo decide **si la UI ya lo consume hoy** (hecho
   verificable con grep de `fetch` en `App.tsx`), no la naturaleza del dato:
   - **La UI lo va a consumir en esta iteración** → es un cambio de **ambos
     lados**: `fetch` en `App.tsx` + test backend. No añadas imports de
     `mock-data.ts` como atajo (ver `project-layout.md`).
   - **La UI todavía no lo consume** (infraestructura `health`/`ready`, export
     que llega en una iteración futura, endpoint intermedio) → solo test
     backend; NO toques `frontend/` y NO añadas referencias al endpoint en el
     frontend hasta que exista el `fetch` correspondiente.
3. Cualquier tipo nuevo de datos va en `financial-types.ts`, no inline en
   componentes — `financial-utils.ts` ya importa de ahí.
4. Los errores de red se muestran con el bloque de error existente de `App.tsx`,
   no con `console.log` silencioso.
5. Nunca cambies la firma de `fetchFinancialData` ni el contrato de
   `/api/metrics` (lista de `FinancialMovement`) sin actualizar
   `financial-types.ts`, `financial-utils.ts` y sus tests — es el único
   contrato consumido por la UI.
6. **Política de fallo**: si el fetch de `/api/metrics` falla, se muestra el
   bloque de error existente de `App.tsx` y nada más. Prohibido servir datos
   de cualquier otra fuente (fixtures locales, `mock-data.ts`, datos stale sin
   marcar) — un fallback con datos falsos oculta el fallo tras cifras plausibles
   pero incorrectas (hecho: `mock-data.ts` tiene 60 registros de 2024 vs. 360
   de 2025-2026 del backend). Mejoras de robustez (retry, caché de la última
   respuesta exitosa) son diseño nuevo → proponerlas al usuario, no
   implementarlas por iniciativa propia.