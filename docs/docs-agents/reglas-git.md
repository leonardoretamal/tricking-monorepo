# Reglas de Git

Propósito: definir qué operaciones de Git puede ejecutar el agente, los hooks de pre-commit y pre-push, el formato de commits, los templates y la espera de checks del CI.

## Operaciones permitidas y prohibidas

- El agente no hace commit, push, PR ni merge.
- El agente sí puede hacer git add y merge local.
- Prohibido modificar archivos de bloqueo (por ejemplo pnpm-lock.yaml) sin una instalación autorizada.
- Prohibido cambiar versiones de dependencias sin autorización.

## Verificación previa antes de proponer operaciones

- Antes de proponer git add, commit, push, PR o merge, revisar y eliminar cualquier rastro de autoría automatizada.
- Si se detectan marcas preexistentes no relacionadas con la tarea, se reportan pero no se eliminan sin autorización.
- Si las introdujo el agente, se eliminan y se anota la corrección.

## Hooks

- pre-commit: typecheck, lint, shellcheck y prettier.
- pre-push: test e integridad de servicios.

## Commits

- Se usa Conventional Commits con los siguientes tipos: feat, fix, chore, docs, refactor, test, style, perf, ci, build, revert.

## Templates de PR e issues

- Los templates de PR e issues están en español.
- Las palabras clave de GitHub (close, fixes, resolves, Co-authored-by, BREAKING CHANGE) nunca se traducen.
- Los templates viven en .github/, que es donde GitHub los busca.

## Sección de variables de entorno en el body del PR

- Se incluye una sección "Variables de entorno" en el body del PR cuando el PR agrega, renombra o elimina variables.
- La sección incluye nombre, propósito, dónde configurarla y si es obligatoria u opcional.

## Aviso en el issue

- Se deja un aviso en el issue cuando el issue lo amerita: variable nueva, dónde configurarla y enlace a la mini-guía en la bitácora.

## Espera de checks del CI

- La espera de checks del CI se hace con gh pr checks --watch o un equivalente, nunca con sleep fijo.

## Reglas transversales relacionadas

- CI: docs/docs-agents/reglas-ci.md.
- Secretos y variables de entorno: docs/docs-agents/reglas-secretos.md.
- Validación al cierre: docs/docs-agents/reglas-validacion.md.
