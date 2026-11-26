# Revisión de skill: rendimiento

Fecha: 2026-11-25

## Skill aplicada

`addyosmani/web-quality-skills@performance` — guía de optimización basada en evidencia: establecer una línea base antes de editar, priorizar señales de usuarios reales y usar trazas del navegador para diagnosticar cuellos de botella. Si no se puede ejecutar la página, los hallazgos estáticos deben tratarse como hipótesis, no como regresiones medidas.

## Justificación de elección

La skill es pertinente para este dashboard React/Vite porque la última compilación registrada (`memory-bank/current-state.md`, sección «Verificación vigente») completó correctamente pero Vite advirtió que un chunk minificado superó el límite de 500 kB. La skill ayuda a evitar optimizaciones especulativas y a distinguir el tamaño del artefacto de una experiencia lenta observada.

## Evidencia disponible y límites

- La compilación anterior produjo un bundle JavaScript de 584,46 kB minificado y 175,31 kB gzip; esos tamaños son datos de una ejecución anterior, no una medición de navegación actual.
- El valor gzip está por debajo de la guía inicial de la skill de <300 kB para JavaScript comprimido. Este presupuesto es una referencia orientativa, no un criterio universal ni sustituto de métricas reales.
- En la comprobación del 2026-11-25, la página `http://localhost:5173/` respondió, pero el navegador registró `ERR_CONNECTION_REFUSED` para `http://localhost:8000/api/metrics`. Por ello no fue posible observar el dashboard con los datos de la API ni obtener una traza representativa de esa experiencia.
- No hay datos CrUX/RUM ni una comparación de laboratorio repetida antes/después registrada aquí. El warning de chunk, por sí solo, no demuestra una regresión de rendimiento.

## Recomendación de verificación

Cuando frontend y backend estén disponibles, registrar una traza de navegación en una condición reproducible y anotar URL/estado, navegador, viewport, CPU/red, caché y métricas observadas (por ejemplo LCP y CLS). Investigar el chunk únicamente si la traza o datos de usuario muestran un coste relevante; después repetir la misma medición para comparar. No se aplicaron cambios de código de rendimiento en esta revisión.
