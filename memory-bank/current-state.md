# Estado actual

> Fecha de verificación: 2026-11-18. Toda afirmación fue verificada con
> `git log`, `ps`/`curl`, o ejecución de las suites de tests.

## Último commit conocido

`git log --oneline -5`:

```
a148485 (HEAD -> main) docs: add memory-bank (product, tech-stack, current-state)
63979a9 docs: add agent rules in .agents/rules
b519273 feat: add health/ready and CSV export endpoints
4b19413 fix: derive dashboard period from fetched data instead of hardcoding 2024
954f812 (origin/main, origin/HEAD) Merge pull request #1 from deimianvasquez/main
```

HEAD está en `a148485` (rama `main`), 4 commits por delante de `origin/main`
(`954f812`). `git status --short` limpio: los 3 ficheros de `memory-bank/`
fueron commiteados en `a148485`; este mismo documento se actualizó después
para reflejar el reinicio del backend (commit `docs:` posterior).

## Servicios en ejecución (verificados con `ps` + `curl`)

| Servicio | Detalle | Verificación |
|---|---|---|
| Backend | `python3 -m uvicorn app.main:app --app-dir .../backend --host 0.0.0.0 --port 8000 --reload` (reloader PID 26314, server PID 26316) | `curl /health/ready` → **200** `{"status":"ok"}`/`{"status":"ready","seed_used":42}`; `/api/metrics` → 200; `/api/metrics/export/csv` → 200 (cabecera `period,income,outcome,net`); OpenAPI lista **11 rutas** |
| Frontend | `vite` (node, terminal `npm`) | `curl http://localhost:5173` → 200 |
| Docker Compose | **NO en uso**: `docker compose up --build -d` falló con exit code 127 (comando no disponible) | registro de terminal de la sesión |

**Resuelto**: el aviso previo (uvicorn sin `--reload` sirviendo 404 en
`/health/ready` y solo 9 rutas en OpenAPI) se **verificó y corrigió**:
el proceso se reinició con `--reload` (misma flag que usa el `Dockerfile`) y
la verificación posterior dio `/health/ready` → 200, 11 rutas en OpenAPI y
CSV export → 200. Nota: el reloader vigila la raíz del proyecto (como en
Docker), así que cambios en frontend también recargan el backend.

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
2. **`.agents/skills/` y `memory-bank/` inexistentes**: AGENTS.md los menciona.
   Verificado con `ls`: ninguno existía. Este documento crea `memory-bank/`;
   `.agents/skills/` sigue sin crearse.
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