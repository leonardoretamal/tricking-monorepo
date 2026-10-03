# Reglas de validación al cierre

Propósito: definir los subagentes de validación obligatorios, sus alcances, las reglas generales de cierre, la verificación del build de producción, las capturas con Playwright, las pruebas de infraestructura y las esperas por condición.

## Subagentes de validación obligatorios

Al terminar cada ticket, cada fase y cada tarea, antes de dar el trabajo por cerrado, se ejecutan obligatoriamente los siguientes subagentes.

### reviewer

Alcance:

- Calidad.
- Convenciones.
- Malas prácticas.
- Casos borde.
- Regresiones.
- Consistencia con AGENTS.md.
- .env.example sincronizado.
- Bitácora del issue.
- Lectura completa del contexto del issue.
- PR body con las variables declaradas.
- Mini-guía cuando aplica.
- Meta títulos.
- Datos estructurados.
- Sitemap.
- robots.txt.
- Favicon.
- Aviso legal y política de privacidad cuando aplique.
- Ausencia de sleep fijo en scripts.

### security

Alcance:

- Autenticación.
- Permisos.
- Exposición de secretos.
- Validación de entradas.
- Dependencias vulnerables.
- CORS.
- Rate limiting.
- Cabeceras.
- HTTPS forzado.
- Protección contra spam.
- Ausencia de secretos en localStorage.
- Ausencia de escritura en entornos que no sean dev.
- Pruebas con datos no reales.

El detalle está en reglas-seguridad.md.

### tester

Alcance:

- Verificación de lo solicitado.
- Pruebas.
- Casos borde.
- Flujos críticos.
- Validaciones alineadas entre frontend y backend.
- Estados visuales.
- Operaciones destructivas con confirmación.
- Errores debajo del input.
- Pruebas contra infraestructura real.
- Limpieza al cierre.
- Página 404.
- Enlaces no rotos.
- Texto alternativo.
- Contraste.
- Compresión de imágenes.
- Una sola llamada a la acción por pantalla.
- Que la paginación, la búsqueda, los filtros y el ordenamiento se resuelvan en la sentencia de la base de datos.
- Que el total de resultados se calcule en la base de datos.
- Que no haya .filter(), .sort(), .slice() ni un equivalente sobre colecciones completas del recurso, ni en el backend ni en el frontend.
- Que el borrado se comporte según la política (soft delete o hard delete) y con las verificaciones previas.

### i18n-checker

Alcance:

- Paridad de claves.
- Claves huérfanas.
- Placeholders.
- Formateo.
- Textos hardcodeados.
- Número de claves consistente, interpolación consistente y plurales.
- Estructura de carpetas de traducción.

Herramientas sugeridas: i18next-parser, i18next-lint, eslint-plugin-i18n-json, @lingui/cli, vue-i18n-extract, ngx-translate-extract, intl_utils o un script propio. El test corre en CI.

El detalle está en reglas-i18n.md.

## Instalación de skills

- Al iniciar un proyecto nuevo, o al detectar que el repositorio no tiene skills de validación instaladas, se instalan las skills de reviewer, security, tester e i18n-checker.
- La instalación se hace con npx skills add <owner>/<repo> (y la variante con -a claude-code -a opencode) y npx autoskills.
- Se priorizan las skills con más estrellas y más instalaciones, de fuentes oficiales o reconocidas, actualizadas y con buenos resultados de escaneo de seguridad. Si ya hay una instalada, se usa esa.
- Fuentes de ranking: skills.sh, https://github.com/LinklyAI/best-skills y https://github.com/jaychempan/Agent-Leaderboard.

## Reglas generales de cierre

- Los subagentes se ejecutan al cierre y no son opcionales.
- Se ejecutan una sola vez por tarea. Si la tarea ya tuvo su corrida al cierre y luego se mergea localmente a otra rama, no se repiten: el merge local no genera código nuevo, solo integra lo que ya fue validado. Si después del merge se agrega código nuevo, esa tarea nueva ejecuta sus propios subagentes. Antes de ejecutar, el agente verifica si la tarea ya tuvo su corrida y no repite.
- Si alguno detecta un problema, el trabajo no se cierra hasta resolverlo o documentarlo como pendiente con justificación.
- El reporte final incluye el resultado de cada subagente.
- Prohibido marcar una subfase como cerrada sin build de producción verificado y subagentes pasados.

## Lectura completa del contexto del issue

- Prohibido truncar comentarios. Se leen completos, incluidos PRs cerrados o mergeados, referencias cruzadas, issues relacionados e historial de estado.
- Si la herramienta trunca automáticamente, el agente lo declara y pide autorización para continuar con información parcial.

## Verificación de build de producción antes del cierre

Antes de entregar cualquier tarea, antes de proponer git add, commit, push, PR o merge:

1. Si el repositorio tiene el build de producción en un gancho (pre-commit o pre-push), no se ejecuta manualmente: se confía en el gancho y se deja anotado en el reporte.
2. Si el repositorio no tiene el build en ningún gancho, se ejecuta manualmente antes de proponer git add, commit, push, PR o merge.
3. Verificar que el build termine sin errores ni advertencias bloqueantes.
4. Si falla, corregir antes de dar la tarea por cerrada.
5. En ambos casos, si se generó una carpeta de build, borrarla para no dejarla cacheada ni ocupar espacio.
6. Confirmar que la carpeta esté en .gitignore antes de borrarla.
7. Reportar "Build de producción verificado (por el gancho o manualmente) y carpeta de build eliminada" o el detalle del fallo.

## Capturas con Playwright

- Se activan solo si el repositorio usa Playwright y las capturas aportan valor. No son obligatorias en cada tarea: consumen tiempo y espacio.
- Se toman solo cuando el cambio toca diseño o interfaz visual y hace falta evidencia, cuando el agente necesita ver algo específico para verificar, o cuando el usuario las pide. Los snapshots siguen el mismo criterio.
- Ubicación: carpeta temporal fuera del repositorio o ignorada por Git.
- Limpieza al cierre: todas las capturas y snapshots se borran al terminar la tarea. Excepción: si el usuario pide conservarlas, se avisa dónde quedaron.
- Viewport móvil: 390x600. Prohibido 390x844. Página completa con fullPage: true.
- Limitaciones conocidas: Playwright no cubre Lighthouse ni trazas de performance.
- Reporte: "Capturas eliminadas" o "Capturas conservadas en <ruta> a pedido del usuario".

## Pruebas de infraestructura y servicios antes del cierre

- Autorización para levantar contenedores, bases de datos, servicios, colas y caché con datos de prueba.
- Prohibido conectar a entornos compartidos, staging o producción.
- Prohibido usar credenciales o datos reales.
- Limpieza al cierre.
- Si no se pudo probar, declararlo como limitación.

## Esperas

- Siempre por condición real, nunca por tiempo fijo. Prohibido sleep N "por si acaso".
- Se espera con curl --retry, until curl -sf, grep -q, gh pr checks --watch, monitores de eventos o comandos en background.
- El sleep solo es el intervalo corto dentro de un sondeo con condición y tope.
- Topes por defecto: 5 minutos general y 60 a 120 segundos local. Al llegar al tope o al no haber avance en 2 minutos, diagnosticar primero y, si no hay nada que arreglar, preguntar al usuario. En modo autónomo, decide el orquestador y registra la decisión.
- Suite de tests o E2E: no más de 5 minutos, en background, con timeout 300 y log.

## Limpieza de rastros y capturas

- Al cierre se limpian los rastros de autoría automatizada y las capturas de Playwright (Fase 17.6).

## Reglas transversales relacionadas

- Seguridad: docs/docs-agents/reglas-seguridad.md.
- i18n: docs/docs-agents/reglas-i18n.md.
- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Git: docs/docs-agents/reglas-git.md.
- CI: docs/docs-agents/reglas-ci.md.
- Checklist de lanzamiento: docs/docs-agents/checklist-lanzamiento.md.
