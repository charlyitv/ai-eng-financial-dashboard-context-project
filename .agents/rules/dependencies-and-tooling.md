# Rule: Dependencies and tooling come from the manifests — nothing else

**Repo facts this maps to:**
- `backend/requirements.txt` es la única fuente de dependencias backend (lo usa
  `backend/Dockerfile`: `pip install -r requirements.txt`); no existe
  `pyproject.toml`.
- `backend/Dockerfile` lanza `uvicorn app.main:app --port 8000` con debugpy en
  `5678`; `docker-compose.yml` publica 5173 (frontend), 8000 y 5678 (backend).
- `frontend/package.json`: `vite ^8.0.4` (requiere Node ≥ 20.19; el nvm default
  de esta máquina es 18), scripts `dev/build/lint/test/preview`.
- `frontend/eslint.config.js`: flat config con `typescript-eslint`,
  `react-hooks` y `react-refresh`.

**Rules:**
1. Dependencias backend nuevas → añadirlas a `requirements.txt` (nunca solo
   `pip install` sin declarar): Docker build fallaría si no.
2. Dependencias frontend nuevas → `package.json` + `package-lock.json` juntos.
3. Ejecuta frontend con Node ≥ 20 (`nvm use 24` en esta máquina); `npm run dev`
   con Node 18 fallará con Vite 8.
4. Los puertos NO son configurables por env: están fijos en `docker-compose.yml`
   (5173/8000/5678) y en README. Si cambias uno, cambia compose + README + el
   proxy de Vite a la vez.
5. Pasa `npm run lint` y `npx tsc -b` además de los tests antes de dar un cambio
   por terminado.