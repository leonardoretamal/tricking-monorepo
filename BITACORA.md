# BITACORA

Este archivo se rellena a medida que se trabaja en issues y tasks. Cada entrada se agrega en orden cronológico con su encabezado correspondiente.

## Fase 0: Fundaciones (2026-10-03)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Fundaciones del monorepo (subfases 0.1 a 0.7).
- Qué pedía: arrancar el monorepo desde cero con el esqueleto de Turborepo y pnpm, el tooling de calidad, la documentación base, las reglas fragmentadas, los templates de GitHub, el launcher y Playwright para E2E.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada, pendiente el cierre formal.
- Autor del registro: Leonardo Retamal.
- Acciones: se creó el workspace `@tricking/*`; se configuró TypeScript estricto, ESLint, Prettier, Husky, lint-staged y commitlint; se crearon `AGENTS.md`, `README.md`, `BITACORA.md` y los documentos de `docs/docs-agents/`; se fragmentaron las reglas; se crearon los templates de PR e issues y el workflow mínimo de CI; se verificó `bin/lupe-start`; se configuró Vitest y Playwright con viewport móvil 390x600.
- Archivos tocados: `package.json`, `turbo.json`, `pnpm-workspace.yaml`, `.npmrc`, `tsconfig.base.json`, `eslint.config.mjs`, `.prettierrc`, `.prettierignore`, `commitlint.config.cjs`, `.lintstagedrc.json`, `.husky/`, `vitest.config.ts`, `playwright.config.ts`, `e2e/`, `AGENTS.md`, `README.md`, `docs/docs-agents/*.md`, `.github/**`, `.gitignore`.
- Comandos relevantes: `pnpm install`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm exec prettier --check .`, `pnpm exec playwright test --list`, `shellcheck bin/lupe-start`.
- Pruebas: build de producción (vacío) en verde; lint, typecheck, test y formato en verde; hooks de git funcionando; Playwright lista dos pruebas (chromium y mobile).
- Decisiones: no hay gitflow, los commits y el push van directos a `main`; el workflow `ci.yml` se creó en la subfase 0.5 y `migrate.yml` queda diferido a la Fase 1.7; los paquetes usan el alcance `@tricking/*`.
- Pendientes y riesgos: los navegadores de Playwright no se instalaron (se hace en la Fase 2); las etiquetas `bug`, `feature` y `tarea` deben crearse en GitHub; el `.env.example` se creará con la primera variable en la Fase 1.
- Referencias: `docs/docs-agents/fases.md`, `AGENTS.md`, commits `ceab9da`, `6e1cd74`, `827f832`, `5cb7b83`.

## Fase 18: Feedback de usuarios (2026-10-03)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Registro de la Fase 18 (feedback de usuarios).
- Qué pedía: dejar constancia de que el feedback de usuarios (formulario, mini dashboard y aviso por correo) se programó como fase nueva.
- Fecha de inicio: 2026-10-03.
- Estado actual: pendiente.
- Autor del registro: Leonardo Retamal.
- Acciones: se agregó la Fase 18 con sus subfases 18.1 a 18.11 en `docs/docs-agents/fases.md` y se referenció en la sección 28.5 de `AGENTS.md`.
- Decisiones: el aviso por correo usa Resend y se activa en esta fase; el panel administrativo se protege con token o con Auth.js según disponibilidad.
- Pendientes y riesgos: la protección del panel y el orden respecto de la Fase 17 se deciden al implementar.
- Referencias: `docs/docs-agents/fases.md`, `AGENTS.md` sección 28.5.

## Reglas de ramas y confirmación previa, y archivos de entorno (2026-10-03)

- Issue: no aplica (trabajo de reglas y preparación de entorno).
- Título: Detección de ramas, confirmación previa de operaciones en producción y creación de `.env` y `.env.example`.
- Qué pedía: eliminar la prohibición de commit, push, PR y merge; agregar la detección de ramas del repositorio; exigir confirmación explícita para comandos que tocan producción; registrar el inventario de ramas y el flujo de trabajo; y crear los archivos de entorno con las variables de la Fase 1.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: se reescribió la sección de operaciones permitidas en `reglas-git.md` (ahora el agente opera sobre la rama de trabajo con autorización y las ramas de producción quedan prohibidas); se agregaron las secciones "Detección de ramas del repositorio" y "Operaciones que requieren confirmación previa"; se agregó "Ramas y flujo de trabajo" a `deteccion-stack.md`; se registró la convención del repositorio (directo sobre `main`, sin `dev` y sin rama de producción) y los archivos de entorno en `stack-tecnico.md`; se agregó el refuerzo de conducta en la sección 5 de `AGENTS.md` y se actualizó la sección 15; se creó `.env.example` versionado y `.env` no versionado con `DATABASE_URL` y `DATABASE_URL_UNPOOLED`.
- Archivos tocados: `docs/docs-agents/reglas-git.md`, `docs/docs-agents/deteccion-stack.md`, `docs/docs-agents/stack-tecnico.md`, `AGENTS.md`, `.env.example`, `.env`.
- Decisiones: se separan `DATABASE_URL` (pooled, runtime) y `DATABASE_URL_UNPOOLED` (directa, migraciones); las variables de fases futuras quedan como comentarios en `.env.example` hasta que su fase las active; la rama de trabajo es `main` y no hay zona de producción en Git.
- Pendientes y riesgos: `neon login` y la creación del branch de desarrollo de Neon siguen pendientes; el comando `neon link --branch production` requiere confirmación explícita por tocar producción.
- Referencias: `docs/docs-agents/reglas-git.md`, `docs/docs-agents/deteccion-stack.md`, `docs/docs-agents/stack-tecnico.md`, `AGENTS.md` secciones 5 y 15.

## Fase 1: Modelo de datos y semilla (2026-10-03)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Modelo de datos y semilla (subfases 1.1 a 1.7).
- Qué pedía: crear `packages/db` con Drizzle y Neon, definir el schema inicial, generar y aplicar la migración, sembrar la data de TrickingAPI, scrapear la lista de trucos de Loopkicks, mapearlos con `loopkicks_slug` y configurar la GitHub Action de `db:migrate`.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: se creó `packages/db` (cliente Drizzle sobre Neon, `drizzle.config.ts`, schema con `tricks`, `categories`, `trick_categories`, `stances`, `variations`, `transitions`, `videos`, `tutorials` y `gaze_tips`); se generó y aplicó la migración `0000`; se sembraron 558 trucos, 14 categorías y 672 relaciones; el scraper extrajo 556 trucos de Loopkicks; el mapeo dejó 556 trucos con `loopkicks_slug` (0 sin match); se creó `.github/workflows/migrate.yml`.
- Subagentes: 7 en paralelo, uno por subfase, con propiedad de archivos disjunta y barreras por archivo para la cadena de base de datos.
- Validación de cierre: `reviewer`, `security-auditor` y `tester` sobre el diff. `i18n-checker` no aplica (la fase no tiene textos de interfaz).
- Correcciones tras la validación: se hizo determinista e idempotente el mapeo (ambigüedad `backTuck`/`backtuck`); se declaró la tarea `db:migrate` en `turbo.json`; `migrate.yml` ya no migra en `pull_request`; se pasan `DATABASE_URL` y `DATABASE_URL_UNPOOLED`; el config falla si falta la URL; soft delete en `categories`, `transitions`, `videos` y `tutorials`; índices en las FKs de `videos`.
- Archivos tocados: `packages/db/**`, `apps/scraper/**`, `.github/workflows/migrate.yml`, `turbo.json`, `.prettierignore`, `.env.example`, `AGENTS.md`, `docs/docs-agents/fases.md`, `docs/docs-agents/stack-tecnico.md`, `BITACORA.md`.
- Comandos relevantes: `pnpm --filter @tricking/db db:generate`, `db:migrate`, `db:seed`, `db:map`; `pnpm --filter @tricking/scraper scrape:loopkicks`; `pnpm typecheck`; `pnpm build`; `pnpm exec prettier --check .`.
- Pruebas: typecheck 6/6, build de producción 6/6 en verde; semilla y mapeo idempotentes (dos corridas con el mismo resultado); scraper reejecutable.
- Decisiones: base de datos en el branch por defecto de Neon (llamado `production` por Neon, único); migraciones manuales con drizzle-kit; `migrate.yml` solo en `push` a `main` y `workflow_dispatch`; el repo trabaja directo sobre `main`.
- Pendientes y riesgos: drizzle-kit no genera reversión (rollback por restauración del branch de Neon o SQL inverso manual); el workflow usa Node 20 mientras el desarrollo local usa Node 22; `prereqs` y `next_tricks` viven como arreglos de texto sin integridad referencial (se normalizan en una fase posterior).
- Referencias: `docs/docs-agents/fases.md`, `docs/docs-agents/stack-tecnico.md`, commits `eeae9f4`, `89f7150`.
