# Componentes propuestos por funcionalidad (verificado)

> Cada sección: **Prompt del PM (outcome)** → **Componentes propuestos** →
> **Casos límite**. Verificación: ✅ contrastado con código del backend o con
> respuestas `curl` (2026-11-22) · ❌ afirmación incorrecta corregida · ➕
> propuesta de diseño (decisión de implementación, no hecho de API).
> El contrato de datos de cada spec está en `data-contract.md`; los tipos, en
> `types.md`.

## Convenciones globales (aplican a todas las specs)

- **Capa de API** (➕): crear `frontend/src/lib/api.ts` con un cliente tipado
  (`fetchJson<T>`), `AbortController` para cancelar peticiones superpuestas y
  `API_BASE_URL` centralizado (hoy está inline en `App.tsx`).
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