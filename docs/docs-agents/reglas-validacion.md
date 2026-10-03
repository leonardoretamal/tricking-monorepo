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

### i18n-checker

Alcance:

- Paridad de claves.
- Claves huérfanas.
- Placeholders.
- Formateo.
- Textos hardcodeados.

El detalle está en reglas-i18n.md.

## Instalación de skills

- La instalación se hace con npx skills add <owner>/<repo> y npx autoskills.
- Se priorizan las skills con más estrellas y las fuentes oficiales.

## Reglas generales de cierre

- Los subagentes se ejecutan al cierre y no son opcionales.
- Si alguno detecta un problema, el trabajo no se cierra hasta resolverlo o documentarlo como pendiente con justificación.
- El reporte final incluye el resultado de cada subagente.
- Prohibido marcar una subfase como cerrada sin build de producción verificado y subagentes pasados.

## Lectura completa del contexto del issue

- Prohibido truncar comentarios. Se leen completos, incluidos PRs cerrados o mergeados, referencias cruzadas, issues relacionados e historial de estado.
- Si la herramienta trunca automáticamente, el agente lo declara y pide autorización para continuar con información parcial.

## Verificación de build de producción antes del cierre

Antes de entregar cualquier tarea, antes de proponer git add, commit, push, PR o merge:

1. Detener el empaquetador de desarrollo.
2. Ejecutar el build de producción correspondiente.
3. Verificar que el build termine sin errores ni advertencias bloqueantes.
4. Si falla, corregir antes de dar la tarea por cerrada.
5. Una vez comprobado, borrar la carpeta generada.
6. Confirmar que la carpeta esté en .gitignore antes de borrarla.
7. Reportar "Build de producción verificado y carpeta de build eliminada" o el detalle del fallo.

## Capturas con Playwright

- Capturar todo lo inspeccionado: pantallas, componentes, estados y flujos.
- Ubicación: carpeta temporal fuera del repositorio o ignorada por Git.
- Limpieza al cierre.
- Viewport móvil: 390x600. Prohibido 390x844. Página completa con fullPage: true.
- Limitaciones conocidas: Playwright no cubre Lighthouse ni trazas de performance.

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
