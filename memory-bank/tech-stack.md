# Stack tecnológico (verificado)

> Fuentes: `backend/requirements.txt`, `backend/Dockerfile`,
> `frontend/package.json`, `frontend/vite.config.ts`, `frontend/eslint.config.js`,
> `docker-compose.yml`. Versions de `package.json` son rangos de versión
> declarados (`^`/`~`); la versión instalada real es la de `package-lock.json`.

## Backend

| Componente | Hecho | Fuente |
|---|---|---|
| Lenguaje | Python (los tests se ejecutan con `python3` del sistema, 3.10 según el warning de pytest) | ejecución de `python3 -m pytest` |
| Framework | FastAPI (`fastapi`) | `requirements.txt` |
| Servidor ASGI | `uvicorn[standard]` | `requirements.txt` |
| Validación | Pydantic (modelos `response_model` en `routes.py`; FastAPI lo trae consigo) | `backend/app/routes.py` |
| Debug | `debugpy` (el Dockerfile expone el puerto 5678) | `requirements.txt`, regla `dependencies-and-tooling.md` |
| Tests | `pytest`, `pytest-cov`, `httpx` (TestClient de Starlette) | `requirements.txt` |
| Manifest de dependencias | **Solo** `backend/requirements.txt`; no existe `pyproject.toml` | verificado con lectura de `requirements.txt` y regla `dependencies-and-tooling.md` |
| Estructura | Dos módulos: `app/main.py` (app + CORS + router) y `app/routes.py` (modelos, generador, filtros, 11 endpoints) | lectura de ambos ficheros |
| Comando de arranque (Docker) | `uvicorn app.main:app --port 8000` con debugpy en 5678 | `backend/Dockerfile` (según regla `dependencies-and-tooling.md`) |

## Frontend

| Componente | Versión declarada | Fuente |
|---|---|---|
| React | `react` / `react-dom` `^19.2.4` (React 19) | `package.json` |
| TypeScript | `~6.0.2` | `package.json` |
| Vite | `^8.0.4` (requiere Node ≥ 20.19) | `package.json` |
| Vitest | `^4.1.4` (+ `@vitest/coverage-v8` `^4.1.4`) | `package.json` |
| Tailwind | `tailwindcss` `^4.2.2` + plugin `@tailwindcss/vite` `^4.2.2` (Tailwind 4) | `package.json` |
| Gráficos | `recharts` `^3.8.1` | `package.json` |
| Lint | ESLint `^9.39.4` con **flat config** (`eslint.config.js`): `@eslint/js`, `typescript-eslint` `^8.58.0`, `eslint-plugin-react-hooks` `^7.0.1`, `eslint-plugin-react-refresh` `^0.5.2` | `package.json`, `eslint.config.js` |
| Utilidades UI | `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react` (convención shadcn, ver `components.json`) | `package.json` |
| Alias de import | `@` → `./src` | `vite.config.ts` |

### Scripts npm (`frontend/package.json`)

- `dev` → `vite`
- `build` → `tsc -b && vite build`
- `lint` → `eslint .`
- `test` → `vitest run` (también `test:watch`, `test:coverage`)
- `preview` → `vite preview`

### Proxy de desarrollo

`frontend/vite.config.ts`: proxy `/api` → `http://backend:8000` (hostname de
Docker Compose; **no resuelve fuera de compose**). `VITE_API_BASE_URL` vacío por
defecto (ver regla `api-config-no-hardcoded-origins.md`).

## Puertos y servicios (docker-compose.yml)

| Servicio | Puertos publicados | Volumen |
|---|---|---|
| `frontend` | `5173:5173` | `./frontend:/app` (+ `node_modules` anonimo), `depends_on: backend` |
| `backend` | `8000:8000`, `5678:5678` | `./backend:/app` |

Los puertos **no** son configurables por env: están fijos en
`docker-compose.yml` (regla `dependencies-and-tooling.md`).

## Herramientas de test y build

- **Backend**: `python3 -m pytest backend/tests -q` con `conftest.py` que
  inyecta `sys.path` (`ROOT_DIR`) para que `from app.main import app` funcione.
- **Frontend**: `npm test` (vitest); los tests van junto a la fuente
  (`src/lib/financial-utils.test.ts`), no en carpeta `tests/` aparte.
- **Contrato de build**: `tsc -b` forma parte de `npm run build`; un cambio TS
  que compila en Vite pero falla `tsc` no está terminado (regla
  `tests-are-contract.md`).
- **Node**: ejecutar con Node ≥ 20 (`nvm use 24` en esta máquina); Vite 8 falla
  con Node 18 (regla `dependencies-and-tooling.md`).