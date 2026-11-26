---
name: api-contract-verification
description: Verifica de forma repetible las diferencias entre el contrato implementado, OpenAPI en vivo, respuestas HTTP y especificaciones del frontend. Úsala al revisar o cambiar contratos, rutas, esquemas o comportamiento HTTP del backend, y al actualizar su registro de verificación.
---

# Verificación del contrato de API

## Objective

Comprobar, con evidencia reproducible, si el contrato definido por el código, el OpenAPI en vivo, el comportamiento HTTP y las especificaciones del frontend coinciden. Registrar diferencias y su disposición sin confundir un resultado observado con un requisito ni asumir que una observación anterior sigue vigente.

## Inputs (defined)

Antes de empezar, identifica y registra:

- **Alcance de la revisión:** ruta o aspecto del contrato que se quiere verificar. Deriva rutas y métodos de `backend/app/routes.py` y/o del OpenAPI; no inventes endpoints.
- **Entorno:** fecha de ejecución, URL base y entorno (por ejemplo, local o desplegado). No incluyas secretos, tokens ni datos sensibles en la evidencia.
- **Fuentes disponibles:**
  - Implementación FastAPI: `backend/app/routes.py`.
  - OpenAPI servido por la aplicación: `/docs`.
  - Contrato de datos del frontend: `frontend/specs/data-contract.md`.
  - Registro de verificación: `frontend/specs/verificacion.md`.
  - Restricciones y convenciones aplicables: `frontend/specs/README.md`, `AGENTS.md` y `.agents/rules/tests-are-contract.md` si está disponible.
- **Cambios propuestos o recientes:** archivos afectados y si implican cambios de backend, endpoints nuevos, frontend o solo documentación.

## Expected output

Un resultado acotado al alcance revisado que incluya:

1. Una **tabla de diferencias de contrato** con estas columnas exactas:
   | code | OpenAPI | runtime | spec | disposition |
2. Comandos ejecutados y evidencia asociada, con fecha y entorno.
3. Validaciones y pruebas ejecutadas, sus resultados y cualquier limitación.
4. Un resumen de diferencias pendientes, resueltas o no concluyentes.

La columna `disposition` indica la decisión o el siguiente paso —por ejemplo, mantener, corregir, aclarar la especificación o investigar— y quién debe decidir si no está claro. No marques una diferencia como resuelta sin evidencia.

## Instructions flow

1. **Confirma el alcance y las restricciones.**
   - Lee `AGENTS.md`, la regla `.agents/rules/tests-are-contract.md` si existe, y las especificaciones pertinentes.
   - `frontend/specs/README.md` indica que esas especificaciones son *spec-only*, no implementación.
   - Respeta la restricción activa: no implementes componentes React ni llamadas a API. Si el alcance requiere hacerlo, detente, explica el impedimento y solicita autorización explícita.

2. **Inspecciona el contrato en el código.**
   - Revisa `backend/app/routes.py` y los modelos o referencias que use para identificar rutas, métodos, parámetros, respuestas, códigos de estado y tipos de contenido.
   - Distingue lo que el código define de lo que la especificación espera. No decidas cuál prevalece sin registrar la discrepancia.

3. **Comprueba OpenAPI en vivo.**
   - Consulta `/docs` en el entorno identificado y examina allí la definición de la operación correspondiente.
   - Registra la URL base, la ruta consultada, el método y la fecha. Si `/docs` no está disponible, anótalo como limitación; no sustituyas el OpenAPI en vivo por una suposición.
   - Si la página `/docs` no puede abrirse o la herramienta no puede extraer su contenido, intenta obtener el documento OpenAPI directamente desde `/openapi.json` en el mismo entorno. Si hay acceso a terminal, usa una petición HTTP de solo lectura (por ejemplo `curl -i <URL_BASE>/openapi.json`); si no, usa una herramienta HTTP/navegador disponible y registra el método. No afirmes que se consultó OpenAPI en vivo si la solicitud no produjo el documento.
   - Si tampoco es posible obtener `/openapi.json`, anota exactamente qué se intentó y el error. El esquema o código local puede servir para análisis estático, pero no como sustituto de evidencia OpenAPI/runtime. Deja esas columnas como `no verificado` y concluye de forma limitada/no concluyente; no bloquees el informe por la indisponibilidad.

4. **Verifica el comportamiento HTTP real.**
   - Deriva la URL y el método del código o del OpenAPI inspeccionados.
   - Usa `curl` contra el entorno identificado. Registra el comando exacto, omitiendo credenciales, y la respuesta relevante: estado HTTP, cabeceras —incluido `Content-Type`— y cuerpo.
   - Usa entradas representativas y no sensibles. Para comportamiento dependiente de parámetros, prueba los casos pertinentes al alcance; no infieras el comportamiento de casos no probados.
   - Si la solicitud falla por disponibilidad, configuración o datos, conserva el resultado como evidencia de esa limitación, no como prueba concluyente del contrato previsto.
   - Si no hay terminal, intenta una herramienta HTTP disponible (por ejemplo, navegador o cliente HTTP). Si ninguna herramienta puede emitir la solicitud, registra la limitación y proporciona un comando reproducible como instrucción futura, marcado explícitamente como **no ejecutado**. Nunca presentes una respuesta inferida o histórica como resultado actual.

5. **Contrasta las especificaciones y crea la tabla.**
   - Compara código, OpenAPI en vivo, runtime y `frontend/specs/data-contract.md`.
   - Completa cada columna con el valor observado o `no verificado`, indicando la fuente cuando ayude a auditarlo.
   - Registra diferencias y disposición en lugar de corregir documentación o implementación por inferencia.
   - `frontend/specs/verificacion.md` es el registro de verificación del repositorio: si se autoriza editarlo, añade el resultado fechado y enlaza o describe la evidencia. No afirmes que el registro está actualizado si no se modificó.

6. **Ejecuta las validaciones y pruebas aplicables.**
   - Para cambios de backend o endpoints nuevos, sigue `.agents/rules/tests-are-contract.md`: ejecuta las pruebas `pytest` pertinentes y registra el comando exacto y el resultado. No inventes un comando de proyecto no confirmado; consulta la configuración o las instrucciones del repositorio.
   - Para cambios de frontend, la regla exige pruebas de frontend. Respeta la restricción activa de no implementar componentes React ni llamadas a API; no hagas cambios de frontend prohibidos para satisfacer esta revisión.
   - Para una verificación sin cambios de código, ejecuta solo las validaciones pertinentes y deja constancia de que no se modificó código. No presentes pruebas omitidas como aprobadas.
   - Si una prueba no puede ejecutarse, anota el motivo y el efecto sobre la conclusión.

7. **Cierra con un resultado auditable.**
   - Incluye la tabla, comandos y evidencia, fecha y entorno, pruebas y limitaciones.
   - Separa claramente observaciones, decisiones y cuestiones pendientes.
   - No generalices a rutas o entornos que no se verificaron.

## Evidence handling

- Conserva evidencia suficiente para repetir la verificación: fecha, entorno, URL base sin secretos, operación, comando `curl` exacto y respuesta observada.
- En respuestas extensas, registra el cuerpo relevante de forma íntegra o explica qué parte se omitió y por qué. No alteres un resultado para que parezca coincidir con el contrato.
- Distingue evidencia de código, OpenAPI y runtime; una fuente no sustituye a las otras.
- Protege datos sensibles. Redacta secretos y datos personales, y deja constancia de que se redactaron.
- Trata cualquier resultado anterior como histórico, no como prueba del estado actual.

## Ejemplos que requieren re-verificación

Estos son ejemplos de discrepancias previamente observadas, no afirmaciones sobre el estado actual:

- CSV: texto de respuesta `text/csv` frente a OpenAPI `application/json`.
- Rango de fechas invertido: respuesta observada `200 []`.

Vuelve a verificar cada caso en el código, el OpenAPI en vivo y el runtime del entorno indicado antes de incluirlo como diferencia vigente o resolverlo.

## Acceptance criteria

Marca cada punto como **Sí**, **No** o **No aplica**, con referencia a la evidencia:

- [ ] Se identifica la ruta o aspecto revisado y las fuentes consultadas, sin inventar endpoints.
- [ ] Se registra fecha y entorno de la verificación.
- [ ] Se inspeccionan por separado `backend/app/routes.py`, OpenAPI en vivo en `/docs`, el comportamiento HTTP y `frontend/specs/data-contract.md`, o se documenta qué fuente no estuvo disponible.
- [ ] La tabla incluye exactamente las columnas `code`, `OpenAPI`, `runtime`, `spec` y `disposition`.
- [ ] Cada observación de runtime incluye el comando `curl` ejecutado y evidencia relevante de estado, cabeceras y cuerpo.
- [ ] Los ejemplos CSV y de rango de fechas invertido, si se mencionan, están marcados como observaciones previas y se re-verifican antes de tratarlos como actuales.
- [ ] Las pruebas aplicables se ejecutan y sus comandos y resultados se registran; las no ejecutadas incluyen motivo y limitación.
- [ ] Se respeta `frontend/specs/README.md` como especificación, no implementación, y no se implementan componentes React ni llamadas a API.
- [ ] Las diferencias no se declaran resueltas sin evidencia y las decisiones pendientes quedan identificadas.
- [ ] El resultado distingue hechos observados, interpretación y limitaciones, y permite a otra persona repetir la verificación.
