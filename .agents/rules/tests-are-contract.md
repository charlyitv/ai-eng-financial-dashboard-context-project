# Rule: Tests are the contract — run both suites before committing

**Repo facts this maps to:**
- `backend/tests/` (pytest, 15 tests, `TestClient` contra `app.main:app`) +
  `backend/tests/conftest.py` que inyecta `sys.path` con `ROOT_DIR` para que
  `from app.main import app` funcione.
- `frontend/src/lib/financial-utils.test.ts` (vitest, 5 tests) — tests
  **colocados junto a la fuente**, no en carpeta `tests/` aparte.
- `package.json` scripts: `test` = `vitest run`; `build` = `tsc -b && vite build`.

**Rules:**
1. Antes de cada commit: corre **todas las suites que el cambio toque**:
   `python3 -m pytest backend/tests -q` si hay cambios en `backend/` y
   `npm test` si hay cambios en `frontend/`. Si tocaste ambos (o dudas), corre
   ambas. Un cambio backend-only no obliga a re-ejecutar la suite TS salvo que
   el diff incluya `frontend/`.
2. Frontend: los tests de utilidades van en `<archivo>.test.ts` junto al archivo,
   nunca en una carpeta `tests/` separada.
3. Backend: no muevas `backend/app/` sin revisar `conftest.py` — rompería el
   `sys.path` y todos los imports de los tests.
4. `tsc -b` forma parte del contrato de build; un cambio TS que compila en Vite
   pero falla `tsc` NO está terminado.
5. Todo endpoint nuevo lleva test pytest — incluida la validación del formato
   de respuesta (headers/mimetype si no es JSON: `text/csv`, `Response(...)` —
   patrón no usado hoy por los 9 endpoints existentes, todos JSON con
   `response_model`, así que es excepcional y debe testearse explícitamente).