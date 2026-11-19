# Rule: Mock data must stay deterministic

**Repo facts this maps to:**
- `backend/app/routes.py`: todos los 9 endpoints llaman `generate_mock_movements(seed=42)`.
- `backend/tests/test_routes.py::test_generate_mock_movements_returns_full_year_sorted_data`:
  `assert len(movements) == 360` y orden cronológico estricto.
- `backend/app/routes.py::_year_for_month`: cada mes se coloca en el año actual si ya
  pasó, si no en el anterior (rollover anual).

**Rules:**
1. Nunca quites ni cambies el `seed=42` en los endpoints; la API debe ser
   reproducible (mismo JSON en cada llamada) — los tests y el frontend dependen de ello.
2. Mantén el invariante de 360 movimientos (12 meses × 30) y el orden cronológico.
3. No reemplaces el generador aleatorio por datos "más realistas" sin actualizar
   `backend/tests/test_routes.py`, que fija longitudes y fechas concretas.
4. Si tocas `_year_for_month` (rollover anual), verifica el eje de fechas del
   frontend: los gráficos agrupan por `YYYY-MM` y hoy abarcan nov-2025…oct-2026.