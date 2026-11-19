# Rule: Respected layout & orphaned files

**Repo facts this maps to:**
- Backend: solo dos módulos — `app/main.py` (app + CORS + router mount) y
  `app/routes.py` (modelos Pydantic + generador + filtros + los 9 endpoints
  en un único `APIRouter`).
- Frontend: componentes en `components/dashboard/` (header, kpi-row, kpi-card,
  income-outcome-chart, profit-percent-chart) y `components/ui/` (shadcn-style
  `card.tsx`, `skeleton.tsx`); utilidades en `src/lib/`.
- **`frontend/src/lib/mock-data.ts` está huérfano**: ningún archivo lo importa
  (grep verificado) — y sus datos (60 registros fijos de 2024) difieren de los
  del backend (360 movimientos 2025-2026).
- `AGENTS.md` exige `.agents/rules`, `.agents/skills`, `memory-bank/` — las dos
  últimas no existen en el repo.

**Rules:**
1. No repartas `routes.py` en paquetes sin necesidad; es un archivo único a
   propósito y `conftest.py`/los tests importan de `app.routes`.
2. `mock-data.ts`: **estado actual = huérfano sin decidir** (grep verificó 0
   imports). Criterio de decisión, en este orden:
   a. Si un test futuro lo necesita como fixture → moverlo junto al test y
      documentarlo ahí;
   b. si no → borrarlo en un commit propio `chore: remove orphaned mock-data`;
   c. en ningún caso usarlo como fuente de datos de la UI (duplicaría lógica
      con el backend y contradice los datasets: 60×2024 vs 360×2025-2026).
   Mientras no se ejerza a) ni b), sigue prohibido importarlo desde `App.tsx`.
3. Componentes nuevos de dashboard → `components/dashboard/`; primitivas de
   estilo → `components/ui/` (convención shadcn, ver `components.json`).
4. Antes de asumir que una convención no existe, revisa `./.agents/rules/`
   (este directorio) — `AGENTS.md` lo manda.
5. `.agents/skills/` y `memory-bank/` no existen aún: no inventes referencias a
   ellos en docs hasta crearlos.