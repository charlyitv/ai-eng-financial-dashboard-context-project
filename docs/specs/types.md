# Tipos TypeScript propuestos (verificado)

> Cada interfaz fue contrastada campo a campo con los modelos Pydantic de
> `backend/app/routes.py` y/o con las respuestas reales de `curl`
> (2026-11-22). Marca por campo: ✅ verificado en contrato · ➕ propuesta
> nueva (no existe en backend).

Ubicación propuesta: `frontend/src/lib/financial-types.ts` (existentes) y
`frontend/src/lib/api-types.ts` (nuevos, para no mezclar con los tipos ya en
uso).

## Tipos existentes (ya en el repo, ✅ sin cambios)

```ts
export type OperationType = 'income' | 'outcome'                       // ✅
export type Category = 'suppliers' | 'sales' | 'operational'
  | 'administrative' | 'others'                                       // ✅
export type BusinessType = 'B2B' | 'B2C'                               // ✅

export interface FinancialMovement {                                  // ✅
  create_date: string   // date en backend → ISO
  amount: number        // float
  operation_type: OperationType
  category: Category
  business_type: BusinessType
}

export interface KPIMetrics { /* calculado en cliente */ }            // ➕ cliente
export interface MonthlyDataPoint { /* calculado en cliente */ }       // ➕ cliente
```

## Nuevos tipos por funcionalidad

### Spec 1 — Filtros ✅

```ts
export interface MetricsFilters {                 // ✅ mapea los Query params
  start_date?: string   // 'YYYY-MM-DD'            // ✅
  end_date?: string                                // ✅
  category?: Category                              // ✅
  operation_type?: OperationType                   // ✅
}

export interface MetricsFacets {                  // ✅ == MetricsFacets (Pydantic)
  operation_types: OperationType[]
  business_types: BusinessType[]
  categories: Category[]
  min_date: string                                 // ✅ date → ISO
  max_date: string                                 // ✅ date → ISO
}
```

### Spec 2 — Summary ✅

```ts
export type GroupBy = 'day' | 'week' | 'month'     // ✅ == GroupBy (Literal)

export interface MetricsSummaryItem {              // ✅ == MetricsSummaryItem
  period: string   // 'YYYY-MM-DD' | 'YYYY-Www' | 'YYYY-MM'
  income: number
  outcome: number
  net: number
}
```

### Spec 3 — CSV ✅ (sin tipo de request)

- ❌ `CsvExportOptions` **eliminado**: el endpoint no acepta parámetros.
- El contrato de respuesta es texto plano `text/csv` con cabecera
  `period,income,outcome,net` (✅ verificado).

### Spec 4 — Top categorías ✅

```ts
export interface TopCategoryItem {                 // ✅ == TopCategoryItem
  category: Category
  operation_type: OperationType
  total_amount: number   // round(x, 2)
}
```

### Spec 5 — Comparación ✅ (verificado con curl)

```ts
export interface MetricsComparison {               // ✅ == MetricsComparison
  current_period: number
  previous_period: number
  delta_abs: number
  delta_pct: number | null   // ✅ null ⇔ previous_period === 0 (curl)
}
```

### Spec 6 — Alertas ✅

```ts
export interface MetricsAlert {                    // ✅ == MetricsAlert
  period: string
  outcome_total: number
  baseline_average: number   // ✅ siempre > 0 en respuesta
  increase_ratio: number      // fracción; 0.3 = +30 %
}
```

### Spec 7 — B2B / B2C ✅

```ts
export interface ChannelBreakdown {                // ➕ envoltorio cliente
  b2b: FinancialMovement[]   // ✅ shape idéntico a /api/metrics
  b2c: FinancialMovement[]   // ✅ shape idéntico a /api/metrics
}
```

## Notas de tipado

- ✅ `create_date` llega como `date` de Python → JSON ISO (`YYYY-MM-DD`);
  `financial-types.ts` ya lo declara `string`.
- ✅ Los montos del backend son `float` con 2 decimales → `number` en TS;
  el formateo a 0 decimales es responsabilidad de `formatCurrency` (UI).
- ➕ `delta_pct: number | null` es el único campo nullable del contrato →
  es obligatorio manejar `null` en el componente (caso límite de la spec 5).