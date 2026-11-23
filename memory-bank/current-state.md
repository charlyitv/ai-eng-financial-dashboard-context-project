# Estado actual

> Fecha de verificación: **2026-11-22**. Toda afirmación fue verificada con
> `git log`, `ps`/`curl`, o ejecución de las suites de tests.
> (Verificación previa: 2026-11-18 — ver histórico más abajo.)

## Último commit conocido

`git log --oneline -5`:

```
d4609a4 (HEAD -> feature/frontend-specs) docs(specs): note /docs (OpenAPI) as verification source in index
71326dd docs(specs): add curl evidence to filter and CSV edge cases
51ef057 docs(specs): mark summary period formats as curl-verified
f18f377 docs(specs): verify functionalities 1-3 contract via /docs + curl
820aa01 docs: update current-state spec paths (docs/specs -> frontend/specs)
```

HEAD está en `d4609a4` (rama **`feature/frontend-specs`**, creada desde
`main`), **6 commits por delante de `origin/main`** (verificado con
`git rev-list --count origin/main..HEAD`): `4bf8bc2`/`820aa01` (mover specs
a `frontend/specs/` + refresco de rutas) y `f18f377`/`51ef057`/`71326dd`/
`d4609a4` (verificación funcionalidades 1–3 vía `/docs` + curl). Specs
iniciales (`3d8a8b6`…`f3cc049`) ya están en `origin/main`.

### Commiteado y verificado (2026-11-22)

- ✅ `memory-bank/` (3 ficheros) y `.agents/rules/` (6 ficheros) están
  trackeados y commiteados (`a148485` y `63979a9`; `current-state.md`
  actualizado en `c1faf58`).
- ✅ Artefactos de spec en `frontend/specs/` (movidos desde `docs/specs/`
  en `4bf8bc2` — esa carpeta ya no existe; 4 ficheros: `frontend-specs.md`
  índice, `data-contract.md`, `types.md`, `components.md`); todas las
  afirmaciones de API verificadas contra `backend/app/routes.py` + **`/docs`
  (OpenAPI 3.1 en vivo)** + `curl` en vivo; **0 ❓ pendientes**; 1 decisión
  ⚠️ de UI abierta con el PM (`|delta_pct| > 100%`).
- ✅ Funcionalidades 1–3 (filtros, summary, CSV) re-mapeadas desde `/docs` y
  re-verificadas con curl (2026-11-22): CSV real `text/csv; charset=utf-8`
  (OpenAPI declara `application/json` — discrepancia documentada), formatos
  de `period` (`YYYY-MM-DD` / `YYYY-Www` / `YYYY-MM`), y **rango de fechas
  invertido → `200 []`** (validación del orden es solo cliente).
- ⚠️ Restricción activa (fichero de memoria del repo): **no implementar
  componentes React ni llamadas a la API** en este proyecto; el alcance es
  specs (`frontend/specs/`) y verificación.

## Servicios en ejecución (verificados con `ps` + `curl`)

| Servicio | Detalle | Verificación |
|---|---|---|
| Backend | `python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000` (terminal `9a0d9a6c`, PID 11720; **sin `--reload`** — lanzado solo para verificación de specs) | `curl /health/ready` → **200** (2026-11-22) |
| Frontend | **Caído** en esta verificación | `curl http://localhost:5173` → `000` (conexión rechazada) |
| Docker Compose | **NO en uso**: `docker compose up --build -d` falló con exit code 127 (comando no disponible) | registro de terminal de la sesión |

Nota (2026-11-22): el backend se reinició sin `--reload` para verificar el
contrato de API con `curl`; para desarrollo conviene relanzarlo con `--reload`
(como en el Dockerfile y como constaba en la verificación del 2026-11-18).
El frontend no estaba levantado en el momento de la verificación.

**Historial**: el aviso previo (uvicorn sin `--reload` sirviendo 404 en
`/health/ready` y solo 9 rutas en OpenAPI) se corrigió el 2026-11-18
reiniciando con `--reload` (misma flag que usa el `Dockerfile`): `/health/ready`
→ 200, 11 rutas en OpenAPI y CSV export → 200. ⚠️ Desde entonces el proceso
fue parado y relanzado varias veces; **en esta verificación (2026-11-22) corre
sin `--reload`** (ver tabla de servicios). Al relanzarlo con `--reload`, el
reloader vigila la raíz del proyecto (como en Docker), así que cambios en
frontend también recargan el backend.

## Estado de tests (ejecutados el 2026-11-18)

### Backend — `python3 -m pytest backend/tests -q`

```
...................                                                      [100%]
19 passed, 1 warning in 2.59s
```

(19 tests; la única warning es un `StarletteDeprecationWarning` sobre
`httpx`/`TestClient` — no afecta al resultado.)

### Frontend — `export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh" && nvm use 24 && npm test`

```
Now using node v24.22.1 (npm v11.19.1)
 RUN  v4.1.4 .../frontend
 Test Files  1 passed (1)
      Tests  5 passed (5)
   Duration  1.62s
```

(5 tests en `src/lib/financial-utils.test.ts`.)

## Pendientes conocidos

1. **`frontend/src/lib/mock-data.ts` huérfano**: grep de imports en
   `frontend/src` → 0 referencias (verificado hoy). Sus datos (60 registros
   fijos de 2024) difieren de los del backend (360 movimientos 2025-2026).
   Criterio en `.agents/rules/project-layout.md`: a) si un test futuro lo
   necesita como fixture, moverlo junto al test; b) si no, borrarlo en un
   commit propio `chore: remove orphaned mock-data`; c) nunca usarlo como
   fuente de la UI. Mientras no se ejerza a) ni b) está prohibido importarlo
   desde `App.tsx`.
2. **`.agents/skills/` inexistente**: AGENTS.md lo menciona. ✅ `memory-bank/`
   ya existe y está commiteado (`a148485`, actualizado en `c1faf58` y en el
   commit de este documento); `.agents/skills/` sigue sin crearse
   (verificado 2026-11-22).
3. **Rollover anual de fechas en gráficos**: `_year_for_month()` en
   `backend/app/routes.py` asigna cada mes al año actual si ya pasó, si no al
   anterior — los datos se desplazan con el reloj y los gráficos del frontend
   agrupan por `YYYY-MM` (regla `deterministic-mock-data.md`). Consecuencia no
   resuelta: el rango del eje X cambia según la fecha en que se ejecuta el
   backend (hoy los datos abarcan nov-2025…oct-2026 según dicha regla; no
   re-verificado contra la respuesta viva de la API en esta sesión —
   *sin verificar*).
4. **Proxy de Vite no funciona fuera de Docker**: `vite.config.ts` apunta a
   `http://backend:8000`, hostname que solo resuelve en Docker Compose (regla
   `api-config-no-hardcoded-origins.md`, hecho 502 verificado en su momento).
   Aun así, en esta sesión `VITE_API_BASE_URL` puede apuntar directo (CORS
   `*` en el backend).

## Decisiones recientes (verificadas en `git log` y reglas)

- **`4b19413`** — *fix: derive dashboard period from fetched data instead of
  hardcoding 2024*: la etiqueta de periodo estaba hardcodeada ("2024 - Full
  Year") en `App.tsx` y como default de `dashboard-header.tsx`; ahora se deriva
  con `derivePeriod()` desde los años presentes en la respuesta de
  `/api/metrics` (código actual verificado en `App.tsx`).
- **`b519273`** — *feat: add health/ready and CSV export endpoints*: añade las
  rutas 2 y 6 de la tabla de `product.md`. (Los tests pasan y, tras el
  reinicio con `--reload`, el proceso vivo ya las sirve — ver «Servicios en
  ejecución».)
- **`63979a9`** — *docs: add agent rules in `.agents/rules`*: crea las 6
  reglas que AGENTS.md exige leer (`api-config-no-hardcoded-origins`,
  `dependencies-and-tooling`, `deterministic-mock-data`, `frontend-data-flow`,
  `project-layout`, `tests-are-contract`). Todas fueron leídas antes de
  redactar este directorio.