# Rule: No hardcoded backend origins

**Repo facts this maps to:**
- `frontend/vite.config.ts`: proxy `/api` → `http://backend:8000` (hostname de
  Docker Compose; NO resuelve fuera de compose — verificado con 502 local).
- `frontend/.env.example`: `VITE_API_BASE_URL=` vacío por defecto; el proxy ya
  cubre dev local y Codespaces.
- `frontend/src/App.tsx`: `const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ""`
  y `fetch(`${API_BASE_URL}/api/metrics`)`.
- `.gitignore`: `.env` y `.env.*` están ignorados (salvo `.env.example`).
- `backend/app/main.py`: CORS `allow_origins=["*"]`.

**Rules:**
1. Nunca escribas orígenes como `http://localhost:8000` directamente en
   componentes TS — usa `VITE_API_BASE_URL` (vacío = proxy de Vite).
2. No "arregles" el 502 del proxy cambiando `vite.config.ts` a
   `localhost:8000`: rompería Docker Compose (el hostname `backend` es correcto
   ahí) y Codespaces.
3. El archivo `.env` es local y jamás se commitea; si añades una variable nueva,
   documéntala en `frontend/.env.example`.
4. No elimines el middleware CORS de `main.py`: el frontend lo necesita cuando
   usa `VITE_API_BASE_URL` (origin directo, sin proxy).