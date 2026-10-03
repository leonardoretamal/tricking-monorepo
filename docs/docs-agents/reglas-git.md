# Reglas de Git

Propósito: definir qué operaciones de Git puede ejecutar el agente, los hooks de pre-commit y pre-push, el formato de commits, los templates y la espera de checks del CI.

## Operaciones permitidas y prohibidas

- El agente opera sobre la rama de trabajo del repositorio. En este repositorio la rama de trabajo es `main` (ver la convención de ramas en `docs/docs-agents/stack-tecnico.md`).
- El agente puede hacer `git add`, commit y push a la rama de trabajo cuando el usuario lo autoriza. No crea ramas ni PRs si el repositorio no los usa.
- Las ramas de producción (`production`, `prod`, `release/*`) son zona prohibida para operaciones del agente.
- Prohibido modificar archivos de bloqueo (por ejemplo pnpm-lock.yaml) sin una instalación autorizada.
- Prohibido cambiar versiones de dependencias sin autorización.

## Detección de ramas del repositorio

Antes de cualquier operación que toque ramas, entornos o despliegues, el agente:

- Detecta las ramas del repositorio y su propósito: la principal (`main`, `master`), la de desarrollo (`dev`, `developer`, `develop`) y las de entorno (`staging`, `production`, `release/*`).
- Detecta el flujo de trabajo: si se trabaja directo sobre `main`, si se promueve desde `dev`, o si se usan ramas por issue con merge a `dev`. La convención se registra en `docs/docs-agents/stack-tecnico.md`.
- Si el repositorio no tiene rama `dev` o equivalente y trabaja directo sobre `main`, registra esa convención y trata `main` como rama de trabajo, salvo que exista una rama de producción separada.
- Si el repositorio tiene una rama de producción explícita (`production`, `prod`, `release/*`), la marca como zona prohibida para operaciones del agente.
- Antes de cualquier comando que toque un entorno (deploy, migración, secretos, configuración), confirma en qué rama está y a qué entorno apunta el comando.
- Si el comando toca producción (por nombre de rama, por variable de entorno, por bandera `--env=production`, `--branch production`, `deploy to production` o equivalentes), frena y pide confirmación explícita al usuario antes de ejecutarlo. No asume.

## Operaciones que requieren confirmación previa

- Cualquier comando que apunte a producción (deploy, migración, secretos, cambios de configuración) requiere confirmación explícita del usuario, aunque el comando parezca inocuo o el usuario haya dado permiso general para operar.
- El agente no ejecuta comandos con banderas `--branch production`, `--env=prod`, `--environment=production` o equivalentes sin confirmación.
- Si el agente detecta que el comando que iba a ejecutar toca producción, lo reporta antes de correrlo, explica el impacto y espera la confirmación. Si el usuario no responde y el agente está en modo autónomo, no ejecuta el comando productivo: lo deja pendiente y registra la decisión.
- La regla de escritura de secretos solo en dev (ver `docs/docs-agents/reglas-secretos.md`) se extiende a los comandos de deploy, migración y cambios de configuración.

## Verificación previa antes de proponer operaciones

- Antes de proponer git add, commit, push, PR o merge, revisar y eliminar cualquier rastro de autoría automatizada.
- Si se detectan marcas preexistentes no relacionadas con la tarea, se reportan pero no se eliminan sin autorización.
- Si las introdujo el agente, se eliminan y se anota la corrección.

## Hooks

- pre-commit: typecheck, lint, shellcheck y prettier. Corre rápido, en cada commit.
- pre-push: test e integridad de servicios. Corre más lento, en cada push.
- Si el repositorio configura el build de producción en pre-push (o pre-commit), el gancho lo ejecuta y borra la carpeta de build al terminar, para no dejarla cacheada ni ocupar espacio. En este repositorio el build NO está en ningún gancho: se ejecuta a mano antes de proponer git add, commit, push, PR o merge (ver AGENTS.md sección 18).
- Los ganchos nunca se saltan: ni `--no-verify`, ni variables como `HUSKY=0` o `LEFTHOOK=0`, ni tocar `core.hooksPath`.

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
