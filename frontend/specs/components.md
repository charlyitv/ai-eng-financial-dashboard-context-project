# Componentes propuestos por funcionalidad (verificado)

> Cada sección: **Prompt del PM (outcome)** → **Desajustes wording PM ↔ API**
> (si los hay) → **Componentes propuestos** → **Casos límite**. Los desajustes
> se resuelven **aquí, en la spec** (copy, alcance o defaults), nunca en la
> implementación. Verificación: ✅ contrastado con código del backend, `/docs`
> o respuestas `curl` (2026-11-22) · ❌ afirmación incorrecta corregida · ➕
> propuesta de diseño (decisión de implementación, no hecho de API).
> El contrato de datos de cada spec está en `data-contract.md`; los tipos, en
> `types.md`.

## Convenciones globales (aplican a todas las specs)

### Contraste con los patrones de fetch existentes (verificado 2026-11-22)

El repo tiene **un único punto de fetch**: `fetchFinancialData()` en
`App.tsx` (vanilla `fetch`, sin axios ni react-query — `package.json` no los
incluye). Patrón observado ✅:

| Aspecto | Patrón existente (`App.tsx`) | Estado |
|---|---|---|
| Base URL | `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""` a nivel módulo; `.env` local = `http://localhost:8000` (el proxy de Vite apunta a `http://backend:8000`, hostname Docker que no resuelve fuera de compose) | ✅ reutilizar tal cual |
| Error HTTP | `if (!response.ok) throw new Error(\`Failed to fetch financial data: ${status}\`)` | ✅ mismo estilo en `fetchJson<T>` |
| Error UI | `.catch(() => setError("No se pudo cargar la informacion financiera..."))` → **un solo bloque de error** arriba; `.finally(() => setLoading(false))` | ✅ política ya codificada |
| Loading | boolean `loading` prop → cada componente hace `if (loading) return <Skeleton/>` | ✅ mismos estados en las specs |
| Cancelación | **no hay** `AbortController` ni limpieza en el `useEffect` | ❌ gap: necesario al filtrar (fetch por cambio de filtro) |
| Re-fetch | `useEffect(..., [])` — solo una vez | ❌ gap: filtros/summary requieren re-fetch con resets de `loading` |
| Response | `response.json()` sin tipar (`Promise<FinancialMovement[]>` anotado en la firma) | ✅ `fetchJson<T>` lo formaliza |

- **Capa de API** (➕): crear `frontend/src/lib/api.ts` con un cliente tipado
  (`fetchJson<T>`), `AbortController` para cancelar peticiones superpuestas y
  `API_BASE_URL` centralizado (hoy está inline en `App.tsx`). ✅ coherente con
  el patrón vanilla existente: **sin nuevas dependencias** (mismo `fetch`,
  mismo manejo `!response.ok → throw`,
  mismo bloque de error único) — solo añade tipado, reutilización y
  cancelación que hoy no existen.
- **Política de fallo** ✅ (regla del proyecto): si el fetch falla, se muestra
  **solo** el bloque de error de `App.tsx`; nunca datos alternativos ni
  `mock-data.ts` (huérfano, prohibido importarlo desde `App.tsx`).
- **Estados** ✅: cada región con datos usa skeleton (`ui/skeleton.tsx`) en
  loading y contenido vacío explícito cuando la respuesta es `[]`.
- **Determinismo** ✅: los endpoints regeneran movimientos con `seed=42` en
  cada llamada; consistentes dentro del día, pero el rango de fechas depende
  de la fecha de ejecución (`_year_for_month()`).

---

## 1. Filtros globales de datos

### Prompt del PM (outcome)

> Como usuario quiero filtrar los datos por rango de fechas, categoría y tipo
> de operación para centrarme en el segmento que me interesa; los KPIs y los
> dos gráficos deben recalcularse con el subconjunto filtrado.

### Desajustes de wording PM ↔ campos reales (resueltos en spec)

| Wording del PM | Campo real en la API | Resolución en spec |
|---|---|---|
| "**segmento** que me interesa" (implícito: ¿canal B2B/B2C?) | ❌ `GET /api/metrics` **no acepta** `business_type` (verificado en `/docs` + `data-contract.md`); solo `start_date`, `end_date`, `category`, `operation_type` | Se define: en esta funcionalidad "segmento" = **rango de fechas + categoría + tipo de operación**. El filtro por canal queda fuera del `filter-bar` global → pertenece a la spec 4 (`b2b`/`b2c`) o a los filtros de `summary` (que sí acepta `business_type`). No se propone selector B2B/B2C en la barra global. |
| "KPIs y los **dos gráficos**" | ✅ coincide: hay exactamente 2 gráficos (`IncomeOutcomeChart`, `ProfitPercentChart`) | Sin desajuste; se reutilizan sin cambios. |

### Componentes propuestos

- `components/filters/filter-bar.tsx` — contenedor: lee facets, renderiza los
  controles, emite `MetricsFilters` y ofrece "Limpiar filtros".
- `components/filters/date-range-field.tsx` — dos `<input type="date">`
  limitados a `[min_date, max_date]` ✅ (campos de `MetricsFacets`).
- `components/filters/select-field.tsx` — select genérico reutilizable
  (categoría, tipo de operación).
- Reutilizar `KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart` sin cambios
  (ya consumen datos derivados).

### Casos límite

1. ✅ `start_date > end_date` → invalidar en cliente (no disparar fetch) y
   mostrar aviso inline. ✅ curl: el backend **no** valida el orden y responde
   `200` con `[]`, así que la validación es 100 % responsabilidad del cliente.
2. ✅ Respuesta vacía (`[]` tras filtrar) → KPIs en cero/"—", gráficos con
   estado vacío; no romper `derivePeriod()` (devuelve `""` → cabecera `—`).
3. ✅ Cambios rápidos de filtro → cancelar la petición anterior con
   `AbortController` (evita respuestas fuera de orden).
4. ✅ Facets con listas vacías → deshabilitar el control correspondiente.
5. ✅ `profitPercent` con `totalIncome === 0` → protegido en `computeKPIs`
   (devuelve `0`); `formatPercent(0)` → `"0.0%"`.
6. ✅ Fechas fuera del rango de facets → clamp a `[min_date, max_date]`.

---

## 2. Resumen agrupado (tabla / series alternativas)

### Prompt del PM (outcome)

> Como usuario quiero ver ingresos, gastos y neto agrupados por día, semana o
> mes para detectar en qué periodos se concentra el resultado.

### Desajustes de wording PM ↔ campos reales (resueltos en spec)

| Wording del PM | Campo real en la API | Resolución en spec |
|---|---|---|
| "ingresos, **gastos** y **neto**" | ✅ `income`, `outcome`, `net` (nombres técnicos ≠ wording, pero 1:1) | Mapeo explícito en la spec: gastos → `outcome`, neto → `net`. El PM dice "gasto", la API dice `outcome`; el subtítulo de la tabla usará el lenguaje del PM y el contrato mantiene `outcome`. |
| "en qué **periodos** se concentra" (asume serie continua) | ⚠️ la respuesta **no trae periodos vacíos** y `period` cambia de formato según `group_by` (`YYYY-MM-DD` / `YYYY-Www` / `YYYY-MM`, verificado con curl) | Etiquetas formateadas **en cliente** por modo; los huecos se rellenan client-side si el PM quiere serie continua (decisión ya registrada como caso límite 2). |
| "agrupados por día, semana o mes" | ✅ `group_by: day \| week \| month`, default `month` | Sin desajuste; el toggle envía siempre `group_by` explícito. |

### Componentes propuestos

- `components/summary/summary-table.tsx` — tabla con periodo, ingresos,
  gastos, neto (neto con `formatCurrency` y color por signo).
- `components/summary/group-by-toggle.tsx` — control segmentado
  día/semana/mes ✅ (`GroupBy`).

### Casos límite

1. ✅ **Formato de `period` varía con `group_by`** → un parser/formatter por
   modo; semanas ISO (`2025-W44`, verificado con curl) cruzan años y no son
   `YYYY-MM`.
2. ✅ Los periodos sin movimientos **no aparecen** en la respuesta → decidir
   si se muestran huecos (rellenar client-side) o solo periodos con datos.
3. ✅ `group_by=day` con 360 movimientos → hasta ~360 filas; paginar o limitar
   la altura con scroll.
4. ✅ `net` negativo → resaltar en rojo (`variant` de `KPICard` como
   referencia).
5. ✅ `group_by` inválido → 422; validar en cliente contra `GroupBy` antes de
   enviar (verificado: validación `Literal` de FastAPI).

---

## 3. Exportación CSV

### Prompt del PM (outcome)

> Como usuario quiero descargar en CSV los datos que estoy viendo para
> analizarlos fuera del dashboard.

### Desajustes de wording PM ↔ campos reales (resueltos en spec)

| Wording del PM | Campo real en la API | Resolución en spec |
|---|---|---|
| "los **datos que estoy viendo**" (implícito: con los filtros activos) | ❌ `GET /api/metrics/export/csv` **no acepta ningún parámetro** (verificado en `/docs` + curl): siempre devuelve el resumen mensual completo (cabecera + 12 filas) | Desajuste resuelto en spec, con 2 opciones para el PM: **(a)** el botón exporta el dataset completo y el copy de la UI lo dice ("Exportar resumen mensual completo"); **(b)** exportación client-side serializando `/summary` + filtros con la misma cabecera. **No** se promete en la spec que los filtros afecten al CSV vía API. |
| "los datos" (¿fila a fila o agregado?) | ⚠️ el CSV es **agregado** (`period,income,outcome,net`), no los 360 movimientos crudos | Se especifica en la spec: la exportación es del **resumen agrupado**, no del detalle; si el PM esperaba detalle (`/api/metrics`), la opción (b) cliente tendría que serializar ese endpoint — decisión pendiente de PM. |

### Componentes propuestos

- `components/export/export-csv-button.tsx` — botón con estado `loading`;
  descarga vía `fetch` → `Blob` → `URL.createObjectURL` (respeta
  `API_BASE_URL` y CORS). ✅ Sin parámetros: el endpoint no los acepta.
  ✅ curl: `Content-Type: text/csv; charset=utf-8` real (el OpenAPI de `/docs`
  declara `application/json` — fiarse del header observado, no del schema).

### Casos límite

1. ❌ **CORREGIDO**: los filtros activos **no** pueden reflejarse en el CSV vía
   query params (el endpoint no los acepta, ✅ verificado). Opciones: a) avisar
   al usuario de que la exportación es del dataset completo, o b) exportar en
   cliente (serializar `summary` + filtros con la misma cabecera).
2. ✅ El endpoint siempre devuelve 12 filas mensuales + cabecera → estado
   vacío **no** es posible aquí; sí puede serlo la opción cliente (b).
3. ✅ Descarga fallida → usar el bloque de error/política de fallo global.
4. ✅ Sin `Content-Disposition` → el nombre de fichero lo elige el cliente
   (`metrics_<hoy>.csv`); el rango de fechas aplica solo a la variante (b).
5. ✅ No bloquear la UI: botón disabled mientras genera.

---

## 4. Top categorías

### Prompt del PM (outcome)

> Como usuario quiero ver qué categorías concentran más gasto (o ingreso) para
> priorizar dónde actuar.

### Desajustes de wording PM ↔ campos reales (resueltos en spec)

| Wording del PM | Campo real en la API | Resolución en spec |
|---|---|---|
| "**qué categorías** concentran" (implícito: el listado completo) | ⚠️ `/categories/top` devuelve solo **top N** (`limit` default **5**, `ge=1 le=20`) y **no acepta filtro `category`** | La spec define el título/labels como "Top 5 categorías" (o Top N según `limit`), nunca "todas las categorías". Drill-down por categoría no existe vía API. |
| "gasto (o ingreso)" | ✅ `operation_type` (default **`outcome`** = gasto) | El toggle es la traducción exacta; default coincide con el wording principal ("gasto"). |

### Componentes propuestos

- `components/categories/top-categories-card.tsx` — Card con lista o barras
  horizontales (porcentaje relativo al total del top) usando `formatCurrency`.
- `components/categories/operation-type-toggle.tsx` — alternar
  `income` / `outcome` ✅ (`operation_type` default `outcome`).

### Casos límite

1. ✅ `income` solo puede tener `sales` y `others` (regla del generador) → la
   lista de ingresos será corta; no pintar huecos inventados.
2. ✅ `limit` fuera de 1–20 → clamp en cliente (422 verificado, `ge=1 le=20`;
   default 5).
3. ✅ Respuesta `[]` → posible con rangos de fecha estrechos o
   `business_type` + `operation_type`; estado vacío explícito.
4. ✅ `total_amount` con 2 decimales → redondear con `formatCurrency`
   (0 decimales) en la UI, sin perder precisión en porcentajes.

---

## 5. Comparación de periodos

### Prompt del PM (outcome)

> Como usuario quiero comparar el periodo actual con el anterior para saber si
> mejoro o empeoro.

### Desajustes de wording PM ↔ campos reales (resueltos en spec)

| Wording del PM | Campo real en la API | Resolución en spec |
|---|---|---|
| "el **periodo actual** con el anterior" (asume que la API los elige) | ❌ `/comparison` **no define periodos por sí mismo**: `start_date`/`end_date` son **obligatorios** (422 sin ellos); el "anterior" lo calcula el servidor desplazando la misma duración | La spec define en cliente qué es "el periodo actual" (p. ej. último mes completo en `[min_date, max_date]` de facets) y envía ese rango; `previous_period` se delega al backend. |
| "si **mejoro o empeoro**" (implícito: ingresos) | ✅ la métrica comparada es el **neto** (`calculate_net_value`), no `income` | Copy de la card dice "neto" explícitamente; la flecha color por signo ya es coherente (`delta_pct`/`delta_abs` mismo signo, verificado). |

### Componentes propuestos

- `components/comparison/comparison-card.tsx` — valor actual, valor anterior,
  delta absoluto y % con flecha (iconos `lucide-react` como en `kpi-row`).

### Casos límite

1. ✅ `delta_pct === null` ⇔ `previous_period === 0` (verificado con curl) →
   renderizar `"—"`/`"n/a"`, nunca `NaN%`.
2. ✅ `start_date`/`end_date` **obligatorios** (422 sin ellos) → validar
   formato `YYYY-MM-DD` y `start ≤ end` antes del fetch.
3. ✅ `sign(delta_pct) === sign(delta_abs)` siempre (denominador
   `abs(previous_net)`; verificado con curl: +237.24 / −275.65 / −114.8) →
   pintar por signo es consistente, nunca contradictorio.
4. ⚠️ (derivado, verificado) **`|delta_pct|` puede superar 100 %** cuando el
   neto cruza el cero (hasta +590 % con datos reales). **Decisión de UI con
   el PM**: mostrar tal cual o limitar la escala del indicador.
5. ✅ Card de loading → skeleton igual que `KPICard`.
6. ✅ La métrica comparada es el **neto** (`calculate_net_value`), no los
   ingresos; no duplicar el cálculo en cliente.

**Resultado**: el ❓ original (signo con `previous_net` negativo) quedó
**resuelto → ✅**; solo queda la decisión de UI del punto 4.

---

## 6. Alertas de gasto

### Prompt del PM (outcome)

> Como usuario quiero ser avisado cuando un periodo tiene un gasto
> significativamente por encima de mi media para corregir a tiempo.

### Desajustes de wording PM ↔ campos reales (resueltos en spec)

| Wording del PM | Campo real en la API | Resolución en spec |
|---|---|---|
| "un **gasto** significativamente por encima de **mi media**" | ✅ `outcome_total` vs `baseline_average` = media de `outcome` de los **periodos anteriores ya procesados** (no una media global ni configurable) | La spec describe el baseline como "media de los periodos anteriores del propio rango"; el primer periodo no tiene baseline → 0 alertas (ya como caso límite 6). |
| "**significativamente**" (el PM no da cifra) | ✅ `threshold` (default **0.3**, `ge=0`; sin límite superior) | Se especifica en spec: el slider traduce "significativamente" a `threshold` por defecto 0.3 (30 % sobre la media); el PM puede redefinir el default sin cambiar la spec de componentes. |
| "ser avisado" (¿push/email?) | ⚠️ la API solo **lista** alertas (`GET /alerts → MetricsAlert[]`); no hay notificaciones push/email | Se resuelve en spec: "avisado" = **visualización en dashboard** (lista de alertas); cualquier notificación externa queda fuera de alcance. |

### Componentes propuestos

- `components/alerts/alert-list.tsx` — lista de periodos en alerta ordenada
  por `increase_ratio` descendente.
- `components/alerts/threshold-slider.tsx` — control del `threshold`
  (default 0.3 ✅), con formato porcentaje (`formatPercent(threshold * 100)`).

### Casos límite

1. ✅ Sin alertas (`[]`) → estado vacío positivo ("Sin desviaciones
   detectadas"); comprobado que `threshold ≥ 1` devuelve `[]` sin error.
2. ❌ **CORREGIDO**: el backend solo valida `threshold ≥ 0` (acepta ≥1 = "sin
   alertas"); **no** da 422 por valor alto. Clamp en cliente (0–1) por UX, no
   por 422. `threshold < 0` sí da 422.
3. ✅ `baseline_average` es siempre `> 0` en la respuesta (el backend solo
   calcula ratio cuando `baseline > 0`) → sin riesgo de `0`/`inf`/`null`.
4. ✅ Cambiar `threshold` o `group_by` → cancelar fetch anterior
   (`AbortController` del cliente API).
5. ✅ `group_by=day` puede generar muchas alertas → límite visual (top N) o
   scroll.
6. ✅ El **primer periodo nunca genera alerta** (no hay baseline previo) —
   esperar 0 alertas legítimas en el periodo inicial de la serie.

---

## 7. Desglose B2B / B2C

### Prompt del PM (outcome)

> Como usuario quiero separar el rendimiento entre clientes B2B y B2C para
> entender qué canal aporta más.

### Desajustes de wording PM ↔ campos reales (resueltos en spec)

| Wording del PM | Campo real en la API | Resolución en spec |
|---|---|---|
| "**clientes** B2B y B2C" | ⚠️ el campo se llama `business_type` y los valores son `B2B`/`B2C` — es un **canal/segmento de negocio**, no una lista de clientes (no hay entidades de cliente en la API) | Copy de la spec usa "canal" (B2B/B2C) en lugar de "clientes"; los endpoints `/b2b` y `/b2c` filtran `business_type`. |
| "**qué canal aporta más**" (comparación simultánea) | ⚠️ no hay endpoint que devuelva ambos canales a la vez; solo `/b2b` y `/b2c` por separado (o `summary?business_type=`) | La spec resuelve la comparación con **dos fetches** (`Promise.all`, ya como caso límite 1) o alternando pestañas; si el PM quiere comparación lado a lado estable, usar `summary?business_type=B2B` + `summary?business_type=B2C` en vez de crudos. |

### Componentes propuestos

- `components/channels/channel-toggle.tsx` — pestañas B2B / B2C que alternan
  la fuente de datos de KPIs y gráficos.
- Reutilizar `KPIRow`, `IncomeOutcomeChart`, `ProfitPercentChart` sin cambios.

### Casos límite

1. ✅ `/api/metrics` no acepta `business_type` → el desglose de movimientos
   crudos pasa por `/b2b` + `/b2c` (verificado). `Promise.all`; si falla uno,
   política de fallo global (no mostrar un canal a medias).
2. ✅ Un canal vacío → KPIs en cero y gráfico vacío; no mezclar canales.
3. ✅ 2 fetches por pestaña → cachear por canal en estado (el seed hace la
   respuesta estable dentro del día).
4. ✅ `derivePeriod` por canal (el rollover de fechas puede dar años distintos
   por canal).

---

## Orden sugerido de implementación

1. **Spec 1 (filtros)** — desbloquea que todo lo demás opere sobre subconjuntos.
2. **Spec 2 (summary)** + **Spec 3 (CSV)** — comparten `MetricsFilters`.
3. **Spec 5 (comparación)** y **Spec 6 (alertas)** — cards independientes.
4. **Spec 4 (top categorías)** y **Spec 7 (B2B/B2C)** — drill-down opcional.