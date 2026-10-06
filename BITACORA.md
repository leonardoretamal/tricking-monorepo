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

## Fase 2: Frontend base (2026-10-03)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Frontend base (subfases 2.1 a 2.7).
- Qué pedía: crear `apps/web` con Next.js (App Router), configurar Tailwind CSS + DaisyUI con los dos temas, configurar next-intl con `defaultLocale` es y estructura por módulos, configurar `packages/shared` con wrapper de localStorage, Zod y utilidades de formato, el layout base (navbar con toggle de tema, footer, breadcrumbs y estados de carga, error y vacío), el sistema de rutas y el componente de tarjeta de truco reutilizable.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: se creó `apps/web` con Next.js 16.3.8 + React 19.3.0; Tailwind CSS 4.3.3 (CSS-first) con DaisyUI 5.7.47 y los temas `tricking-light` (default) y `tricking-dark` (prefersdark); next-intl 4.14.9 con `defaultLocale` es, mensajes por módulo en `apps/web/messages/{es,en}/` y script de paridad `i18n:check`; `packages/shared` con el wrapper de localStorage (prefijo `tricking:`, TTL, Zod, guarda SSR) y utilidades de formato con Intl; `packages/ui` con `EmptyState`, `ErrorState`, `LoadingState` y `TrickCard`; layout base con navbar, footer, breadcrumbs, toggle de tema y selector de idioma; las rutas de las 7 secciones vacías y la 404 personalizada; el CI se amplió con los jobs `test`, `i18n` y `e2e`.
- Subagentes: 7 en paralelo, uno por subfase (2.1 a 2.7), con propiedad de archivos disjunta; el orquestador hizo el esqueleto de paquetes, la integración, las pruebas y el cierre.
- Validación de cierre: `reviewer`, `security-auditor`, `tester` e `i18n-checker` sobre el diff. Hallazgos aplicados: `next-env.d.ts` excluido de Prettier (rompía el CI), textos de `error`/`loading` movidos a `[locale]` con i18n, `aria-current` en el submenú de la navbar, claves i18n huérfanas eliminadas, y la 404 de rutas desconocidas ahora responde HTTP 404 (se quitó el `loading.tsx` de ruta que causaba un soft 404). Pendientes documentados: contraste del primario en tema claro (decisión de paleta de la Fase 0), dependencias de desarrollo con avisos de `pnpm audit` (`vitest`, `braces`) y el aviso de React por el `<script>` anti-flash (excepción de diseño).
- Archivos tocados: `apps/web/**`, `packages/shared/**`, `packages/ui/**`, `e2e/base.spec.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`, `eslint.config.mjs`, `.prettierignore`, `package.json` de los paquetes, `pnpm-lock.yaml`, `docs/docs-agents/fases.md`, `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/prompt-arranque.md`, `AGENTS.md`.
- Comandos relevantes: `pnpm install`, `pnpm typecheck`, `pnpm lint`, `pnpm exec prettier --check .`, `pnpm test`, `pnpm --filter @tricking/web i18n:check`, `pnpm --filter @tricking/web build`, `pnpm exec playwright test`.
- Pruebas: typecheck 8/8, lint, formato y 19 tests unitarios en verde; `i18n:check` con paridad es/en; build de producción con 18 rutas es/en prerenderizadas; E2E 14 passed y 2 skipped (viewport 390x600 en móvil); 404 con HTTP 404 verificado contra el build de producción.
- Decisiones: sin gitflow, commits y push directos a `main`; el layout raíz es `[locale]/layout.tsx` y el middleware de locale es `src/proxy.ts` (convención de Next 16); `localeDetection` en `false`; sin `loading.tsx` de ruta global para preservar el estado 404; paquetes compartidos como fuente TS con `transpilePackages`.
- Pendientes y riesgos: contraste del primario en tema claro (3.41:1) a revisar en la Fase 17; avisos de `pnpm audit` en dependencias de desarrollo; el `<script>` anti-flash genera un aviso de React en desarrollo (permitido por `design.md`); los enlaces del submenú de "Trucos" apuntan a `/tricks` hasta las Fases 3 a 7.
- Referencias: `docs/docs-agents/fases.md`, `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/design.md`, `AGENTS.md`.

## Reglas: build en gancho y correo de prueba con Maildrop (2026-10-03)

- Issue: no aplica (trabajo de reglas).
- Título: Verificación del build según el gancho y cambio de yopmail a Maildrop.
- Qué pedía: que la verificación del build de producción dependa de si el repositorio lo corre en un gancho (pre-commit o pre-push), y reemplazar yopmail por Maildrop en todo lo que lo referencie.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: se actualizó la sección 18 de `AGENTS.md` y la sección "Verificación de build de producción antes del cierre" de `docs/docs-agents/reglas-validacion.md` con la regla condicional (si el build está en un gancho, no se ejecuta a mano, se confía en el gancho; si no está en ningún gancho, se ejecuta antes de proponer `git add`, commit, push, PR o merge; en ambos casos se borra la carpeta de build y se confirma que está en `.gitignore`); se reemplazó yopmail por Maildrop en `AGENTS.md` y `docs/docs-agents/prompt-arranque.md`. Fuera del repositorio se actualizaron la skill `orquestar` (`SKILL.md`, `templates/subagente-ticket.md`, `references/compuerta.md`, `references/navegador.md`, `references/captcha.md`, `profiles/buybolivia.md`), las skills `prompt-creator` y `prompt-creator-global`, y las memorias de los proyectos que citaban yopmail.
- Archivos tocados (repo): `AGENTS.md`, `docs/docs-agents/reglas-validacion.md`, `docs/docs-agents/prompt-arranque.md`, `BITACORA.md`.
- Pruebas: revisión de que no queden referencias a yopmail en skills, documentos ni memoria; verificación de formato del repositorio.
- Decisiones: la regla de build es transversal y vive en la skill `orquestar` (plantilla del líder y compuerta) además de `AGENTS.md`; Maildrop es el buzón de respaldo cuando el repositorio no trae uno propio.
- Pendientes y riesgos: ninguno.
- Referencias: `AGENTS.md` sección 18, `docs/docs-agents/reglas-validacion.md`, skill `orquestar`.

## Integración del setup global de IA (2026-10-03)

- Issue: no aplica (trabajo de reglas).
- Título: Incorporación de las reglas faltantes del documento "SETUP PARA PROGRAMAR ALGO CON IA".
- Qué pedía: revisar el documento maestro de setup (14 secciones numeradas, de la 0 a la 13) e incorporar al repositorio todo lo que faltara.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: se agregaron al repositorio las reglas que no existían. En `AGENTS.md`: el umbral de longitud de `AGENTS.md` sube a 500 o 600 líneas; la regla de build con el detalle de que el gancho borra la carpeta de build al terminar; las capturas de Playwright pasan a tomarse solo cuando aportan valor; la bitácora se redacta siempre en español y suma los subagentes al contenido; los correos de prueba quedan con mail.tm (automatizado) y Maildrop (manual); y se agrega el archivo de faltantes al adoptar un repositorio existente. En `docs/docs-agents/reglas-frontend.md`: carga inicial y loadings de esqueleto. En `reglas-git.md`: los ganchos con el build en pre-push y la prohibición de saltarlos. En `reglas-validacion.md`: una corrida de subagentes por tarea sin repetir por merge local, y capturas solo cuando aportan. En `reglas-backend.md`: login, recuperación de contraseña, sesiones y eliminación de cuenta (condicionales a que exista autenticación). Se reflejaron los mismos cambios en `docs/docs-agents/prompt-arranque.md`.
- Archivos tocados: `AGENTS.md`, `docs/docs-agents/reglas-frontend.md`, `docs/docs-agents/reglas-git.md`, `docs/docs-agents/reglas-validacion.md`, `docs/docs-agents/reglas-backend.md`, `docs/docs-agents/prompt-arranque.md`, `BITACORA.md`.
- Pruebas: verificación de formato del repositorio y de que no queden contradicciones con las reglas anteriores.
- Decisiones: las reglas de autenticación y eliminación de cuenta quedan marcadas como condicionales (no aplican mientras el producto no tenga login); el umbral de `AGENTS.md` se sube a 500 o 600 líneas.
- Pendientes y riesgos: el repositorio no usa autenticación, así que las reglas de login y eliminación de cuenta quedan documentadas pero inactivas.
- Referencias: `AGENTS.md`, `docs/docs-agents/`.

## Ganchos de Git endurecidos (2026-10-03)

- Issue: no aplica (trabajo de reglas y tooling).
- Título: Endurecer los ganchos de pre-commit y pre-push.
- Qué pedía: implementar el pendiente registrado en `AGENTS.md` sección 28.4: sumar formato en modo verificación y chequeo de `.env.example` al pre-commit, sumar build de producción y validación i18n al pre-push, `lint-staged` con `--concurrent false` y medir la duración de cada gancho.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: se reescribió `.husky/pre-commit` (lint-staged con `--concurrent false`, `pnpm typecheck`, `prettier --check .`, `scripts/check-env-example.mjs` y shellcheck sobre `bin/lupe-start` y los ganchos, con duración al final); se reescribió `.husky/pre-push` (`pnpm test`, `pnpm --filter @tricking/web i18n:check`, `pnpm build` y borrado de `apps/web/.next`, con duración al final); se creó `scripts/check-env-example.mjs` (detecta variables de entorno nuevas en los cambios preparados que no estén declaradas en `.env.example`); se agregó el script `env:check` al `package.json` raíz; se agregó `apps/web/next-env.d.ts` a `.gitignore` y se dejó de versionar (generaba churn entre la variante de dev y la de build). Se actualizó `docs/docs-agents/reglas-git.md`, `AGENTS.md` (secciones 15, 18 y 28.4), `docs/docs-agents/stack-tecnico.md` y `docs/docs-agents/fases.md` (subfase 17.0).
- Archivos tocados: `.husky/pre-commit`, `.husky/pre-push`, `scripts/check-env-example.mjs`, `package.json`, `.gitignore`, `apps/web/next-env.d.ts` (destrackeado), `docs/docs-agents/reglas-git.md`, `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/fases.md`, `AGENTS.md`, `BITACORA.md`.
- Pruebas: el chequeo de `.env.example` falla con una variable nueva sin declarar y pasa en el caso normal; shellcheck sin hallazgos en `bin/lupe-start` y los ganchos; typecheck de la web en verde sin `next-env.d.ts`.
- Decisiones: el build de producción pasa al gancho pre-push, así que el agente deja de ejecutarlo a mano (sección 18); `next-env.d.ts` deja de versionarse para eliminar el churn.
- Pendientes y riesgos: el pre-push ahora corre el build, lo que alarga el push; ambos ganchos imprimen su duración para vigilarlo.
- Referencias: `AGENTS.md` sección 28.4, `docs/docs-agents/reglas-git.md`, `docs/docs-agents/fases.md`.

## Fase 3: Vertical Kicks (2026-10-03)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Vertical Kicks (subfases 3.1 a 3.7) y fundación de datos de trucos para las fases 4 a 7.
- Qué pedía: endpoint de listado con paginación, filtros y orden en la base de datos; vista de listado con virtualización; vista de detalle con relaciones; cache en localStorage; i18n es/en; y colores por dificultad y por categoría.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: se agregó la columna `section` a `tricks` (migración `0002`) y se pobló desde `apps/scraper/data/loopkicks-tricks.json` (conteos: vertical-kicks 95, backward 245, forward 20, inside 123, outside 73); se agregó la curaduría de dificultad por sección en `packages/db/src/seed/difficulty/`; la capa de consulta `listTricks` y `getTrickById` en `packages/db/src/queries/tricks.ts`; los endpoints `GET /api/tricks` y `GET /api/tricks/[id]` con Zod y Pino; el proveedor de TanStack Query con persistencia propia sobre el wrapper de storage; los componentes de badge (dificultad y categoría) y el esqueleto en `packages/ui`; el navegador de trucos con filtros en la URL, paginación y virtualización por carriles; las rutas `/es/tricks/[section]` y `/es/tricks/[section]/[id]` con redirección de `/es/tricks` a vertical-kicks; el submenú del navbar con las rutas reales; y los textos i18n es/en.
- Archivos tocados: `packages/db/**`, `apps/web/**`, `packages/ui/**`, `packages/shared/src/storage.ts`, `e2e/tricks.spec.ts`, `.github/workflows/ci.yml`, `docs/docs-agents/fases.md`, `docs/docs-agents/stack-tecnico.md`, `BITACORA.md`.
- Comandos relevantes: `pnpm --filter @tricking/db db:generate`, `db:migrate`, `db:map`, `db:difficulty`; `pnpm install`; `pnpm typecheck`; `pnpm lint`; `pnpm test`; `pnpm --filter @tricking/web i18n:check`; `pnpm exec playwright test`; consultas HTTP contra `next dev`.
- Pruebas: typecheck 8/8 y lint en verde; 32 tests unitarios; `i18n:check` con paridad es/en; 24 pruebas E2E en verde (chromium y mobile, viewport 390x600) contra datos reales; verificación de conteos por sección y de los endpoints (200, 400 de query inválida y 404).
- Decisiones: la sección de Loopkicks es la clasificación primaria y el parámetro de la API es `section` (se unificaron `category`/`direction` de la spec); la dificultad se cura a mano por sección; las rutas son anidadas; el cache persistido pasa por el wrapper de storage; en CI el job `e2e` recibe `DATABASE_URL` (solo lectura).
- Pendientes y riesgos: la dificultad de backward, forward e inside queda por curar (lo hacen las fases 4 a 6); las secciones no tienen video (Fase 14); la búsqueda full-text es de la Fase 12 y aquí `q` usa `ilike`; el build de producción se delega al gancho pre-push.
- Subagentes: la ronda de validación de las fases 3 a 6 se ejecuta como parte de esta tarea, con un subagente por fase.
- Referencias: `docs/docs-agents/fases.md`, `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/design.md`, `AGENTS.md` secciones 12 y 17.

## Fases 4, 5 y 6: Backward, Forward e Inside (2026-10-03)

- Issue: no aplica (trabajo de fases, sin issue asociado).
- Título: Backward (Fase 4), Forward (Fase 5) e Inside (Fase 6) sobre la fundación de la Fase 3.
- Qué pedía: cada sección con su endpoint, reutilizando los componentes de la Fase 3, con i18n y badges ajustados y el mapeo de Loopkicks verificado.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: las tres secciones se resolvieron con la fundación genérica de la Fase 3 (endpoint `GET /api/tricks?section=...`, rutas `/es/tricks/[section]` y detalle, componentes en `packages/ui`), sin reescribir componentes. Se curó la dificultad de cada sección en su archivo de `packages/db/src/seed/difficulty/` (backward 245, forward 20, inside 123) y se aplicó a la base. Se agregaron E2E por sección. Se corrigieron hallazgos de la validación: consistencia de la sección en el detalle (404 si el truco no pertenece a la sección de la URL), validación con Zod del `id` de `GET /api/tricks/[id]`, orden de dificultad con `nulls last`, y limpieza de código muerto.
- Subagentes: 4 en paralelo, uno por fase (3, 4, 5 y 6), con propiedad de archivos disjunta (un archivo de dificultad y un E2E por sección); el orquestador hizo la integración, la aplicación de la dificultad, las correcciones transversales, la documentación y el commit.
- Validación de cierre: cada subagente actuó como reviewer, security, tester e i18n-checker sobre su fase. Hallazgos aplicados por el orquestador: los 4 corregibles listados arriba. Pendientes documentados: la dificultad es una propuesta inicial ajustable por el usuario (por ejemplo `jackknife1080`, `shurikane` frente a `shuriken`, `touchdownQuat`); el job `e2e` de CI depende del secreto `DATABASE_URL` (no disponible en PRs de forks, irrelevante mientras se trabaje directo sobre `main`); `loadEnvFile` está duplicado en cuatro scripts del backend.
- Archivos tocados: `packages/db/src/seed/difficulty/{backward,forward,inside,vertical-kicks}.ts`, `packages/db/src/queries/tricks.ts`, `apps/web/src/app/[locale]/tricks/[section]/[id]/page.tsx`, `apps/web/src/app/api/tricks/[id]/route.ts`, `apps/web/src/lib/{api-schemas,sections}.ts`, `e2e/tricks-{vertical-kicks,backward,forward,inside}.spec.ts`, `docs/docs-agents/fases.md`, `BITACORA.md`.
- Comandos relevantes: `pnpm --filter @tricking/db db:difficulty`; `pnpm typecheck`; `pnpm lint`; `pnpm test`; `pnpm test:e2e`; verificación de cobertura de dificultad por sección contra la base.
- Pruebas: typecheck y lint en verde; 32 tests unitarios; cobertura de dificultad 100% en las cuatro secciones (483 trucos); 52 pruebas E2E en verde (chromium y mobile) contra datos reales.
- Decisiones: el parámetro de la API es `section` (no `direction`); la dificultad se cura por sección en archivos separados para no chocar entre fases; la consistencia entre sección de la URL y truco es un 404.
- Pendientes y riesgos: dificultad inicial sujeta a ajuste; la sección Outside (Fase 7) queda sin curar; videos y búsqueda full-text son de fases posteriores; el build de producción se delega al gancho pre-push.
- Referencias: `docs/docs-agents/fases.md`, `docs/docs-agents/stack-tecnico.md`, `AGENTS.md` secciones 12 y 17.

## Corrección del CI tras las fases 3 a 6 (2026-10-03)

- Issue: no aplica (corrección de CI).
- Título: Alinear CI a Node 22 y evitar el rojo por falta de secretos.
- Qué pedía: que los runs de CI del push de las fases 3 a 6 quedaran en verde.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Diagnóstico: el job de pruebas unitarias fallaba con `TypeError: webidl.util.markAsUncloneable is not a function` porque `jsdom@30` resuelve `undici@8.11.2`, que exige Node >= 22.19, y el CI usaba Node 20. Los jobs de migraciones y E2E fallaban porque los secretos `DATABASE_URL` y `DATABASE_URL_UNPOOLED` no están configurados en el repositorio (el log de migraciones dice "Falta DATABASE_URL_UNPOOLED o DATABASE_URL"). Ninguna de las dos causas era del código de la fase.
- Acciones: se subió Node de 20 a 22 en `ci.yml` (los cuatro jobs) y en `migrate.yml`; se ajustó `engines` del `package.json` raíz a `>=22.19.0`; el job `e2e` ahora omite con aviso las pruebas que dependen de la base cuando falta `DATABASE_URL` y ejecuta solo las de layout; se documentó en `stack-tecnico.md`.
- Archivos tocados: `.github/workflows/ci.yml`, `.github/workflows/migrate.yml`, `package.json`, `docs/docs-agents/stack-tecnico.md`, `BITACORA.md`.
- Pruebas: reproducción local del fallo de jsdom/undici (Node 22 pasa, Node 20 no); verificación de que el build de producción y las suites locales siguen verdes.
- Decisiones: CI se alinea a Node 22; el E2E que consulta la base queda condicionado a la existencia del secreto en vez de fallar por infraestructura ausente.
- Resolución de los secretos: se verificó con `gh api repos/leonardoretamal/tricking-monorepo/actions/secrets` que el repositorio tenía `total_count: 0` (por eso `migrate.yml` fallaba desde la Fase 1 con "Falta DATABASE_URL_UNPOOLED o DATABASE_URL"). Se configuraron los secretos `DATABASE_URL` y `DATABASE_URL_UNPOOLED` a nivel de repositorio (los valores se tomaron del `.env` local de desarrollo, sin imprimirlos). Se relanzó solo el job fallido de Migraciones (`gh run rerun 37160305544 --failed`) y quedó en verde.
- Pendientes y riesgos: el E2E completo en CI queda verificado en el siguiente push (con el secreto ya disponible corre las pruebas que dependen de la base). `migrate.yml` sigue usando Node 22; las anotaciones de "Node.js 20 is deprecated" son de las acciones de GitHub, no del job.
- Referencias: `.github/workflows/ci.yml`, `.github/workflows/migrate.yml`, `docs/docs-agents/stack-tecnico.md`.

## Fases 7, 8, 9 y 10: Outside, Variations, Transitions y Stances (2026-10-03)

- Issue: no aplica (trabajo de fases, sin issue asociado).
- Título: Outside (Fase 7), Variations (Fase 8), Transitions (Fase 9) y Stances (Fase 10).
- Qué pedía: cerrar la quinta sección de trucos reutilizando la fundación de la Fase 3, y sumar las tres secciones semánticas con su modelo de datos, endpoints, listados, detalles, i18n y E2E.
- Fecha de inicio: 2026-10-03.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: se curó la dificultad de los 73 trucos de outside; se modeló la migración `0003` (`variations.kind/trick_id/family_id`, `transitions.group` y las tablas `variation_examples`, `transition_examples`, `trick_stances`); se extendió el scraper con `scrape-loopkicks-semantics.ts` que vuelca las tres páginas de Loopkicks a JSON; se crearon las semillas `variations`, `transitions`, `stances` y `stance-links` (idempotentes, sin transacciones por el driver `neon-http`); se agregaron las consultas y endpoints `GET /api/variations`, `/api/transitions` y `/api/stances` (más sus detalles) con Zod y Pino; se implementaron las páginas de listado y detalle de las tres secciones con TanStack Query, estado en la URL, estados de carga/error/vacío y el diagrama accesible de grupos de transiciones; y los textos i18n es/en.
- Decisiones del usuario: variaciones en dos ejes (familias conceptuales de Loopkicks + variaciones concretas de TrickingAPI ligadas a truco base); transiciones como tipos conceptuales con grupo y ejemplos (no pares origen-destino); stances con las 6 de Loopkicks y enlace truco-stance curado y parcial; pipeline de datos scraper Loopkicks a JSON y semilla a la base, con TrickingAPI como complemento.
- Subagentes: 4 de implementación en paralelo, uno por fase, con propiedad de archivos disjunta sobre la fundación construida serialmente; luego 4 de validación en paralelo, uno por fase, cada uno con los cuatro sombreros (reviewer, security, tester, i18n-checker).
- Validación de cierre y correcciones aplicadas por el orquestador: (1) bloqueante, la caché persistida del contrato viejo rompía `/es/variations`; se subió el `buster` del persister y se blindó la tarjeta; (2) mayor, el scraper concatenaba ejemplos separados por `<br>` en una sola cadena (13 de 16 transiciones); se corrigió `paragraphText` y se re-sembró; (3) se expuso `examples` en el listado de variaciones para eliminar el N+1 que hacía el cliente; (4) `familyId` de las variaciones concretas ahora se deriva por alias del nombre; (5) el contador de stances del detalle se calcula con `count()` en la base; (6) las páginas nuevas acotan `page` a `totalPages`; (7) las consultas de detalle se memoizan con `cache()` de React; (8) se corrigió el encabezado de la dificultad de outside para que refleje el criterio real.
- Archivos tocados: `packages/db/src/schema.ts`, `packages/db/drizzle/0003_*.sql` y `meta/`, `packages/db/src/seed/{variations,transitions,stances,stance-links,load-env,normalize}.ts`, `packages/db/src/seed/difficulty/{outside,index}.ts`, `packages/db/src/queries/{variations,transitions,stances}.ts`, `packages/db/src/index.ts`, `packages/db/package.json`, `apps/scraper/src/scrape-loopkicks-semantics.ts`, `apps/scraper/data/loopkicks-{variations,transitions,stances}.json`, `apps/scraper/package.json`, `apps/web/src/app/api/{variations,transitions,stances}/**`, `apps/web/src/app/[locale]/{variations,transitions,stances}/**`, `apps/web/src/components/{variation,transition,stance}-*.tsx`, `apps/web/src/components/providers.tsx`, `apps/web/src/lib/{semantic-api,semantic-schemas,api-schemas,variation-params,transition-groups,transition-params}.ts`, `apps/web/messages/{es,en}/{variations,transitions,stances}.json`, `e2e/{variations,transitions,stances,tricks-outside}.spec.ts`, `docs/docs-agents/fases.md`, `BITACORA.md`.
- Comandos relevantes: `pnpm --filter @tricking/scraper scrape:loopkicks:semantics`; `pnpm --filter @tricking/db db:generate`, `db:migrate`, `db:difficulty`, `db:variations`, `db:transitions`, `db:stances`, `db:stance-links`; `pnpm typecheck`; `pnpm lint`; `pnpm --filter @tricking/web i18n:check`; `pnpm exec prettier --check .`; `pnpm exec playwright test --project=chromium`.
- Pruebas: typecheck 9/9 y lint en verde; `i18n:check` con paridad es/en; formato en verde; 39 pruebas E2E en verde (1 skipped preexistente) contra datos reales; conteos verificados: outside 73, variaciones 19 familias + 37 concretas, transiciones 16 tipos, stances 6 y 14 enlaces truco-stance.
- Pendientes y riesgos: (1) bug preexistente de la Fase 3 detectado durante la validación, `prereqs`/`nextTricks` de la semilla guardan nombres y `getTrickById` los resuelve por id, así que las listas de "prerrequisitos" y "siguientes trucos" del detalle de truco salen casi vacías (4 de 777 coincidencias); no se tocó por la regla de no modificar fases cerradas sin subfase de corrección; (2) la cobertura de `trick_stances` es parcial y se amplía a mano; (3) `transitions.originTrickId/destinationTrickId` quedan sin uso; (4) el build de producción se delega al gancho pre-push.
- Referencias: `docs/docs-agents/fases.md` (Fases 7 a 10), `docs/docs-agents/design.md`, `AGENTS.md` secciones 9, 11, 12, 13 y 17.

## Traduccion al espanol de etiquetas y contenido (2026-10-04)

- Issue: no aplica (correccion pedida por el usuario).
- Título: Traducir al español la interfaz y el contenido técnico del catálogo.
- Qué pedía: el usuario vio que las páginas en español mezclaban etiquetas y contenido en inglés. Pidió traducir todo al español (etiquetas como Stances y las categorías, y también las descripciones del contenido).
- Fecha de inicio: 2026-10-04.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Diagnóstico: el i18n de la interfaz ya funcionaba, pero (1) había una fuga de UI en inglés (los grupos de transiciones decían Unified/Singular/Sequential en el archivo `es`), y (2) el contenido de las fuentes (Loopkicks, TrickingAPI) viene en inglés y se guarda como dato, no como clave i18n, así que las descripciones salían en inglés en las páginas en español. Esto ya pasaba en las fases 3-6.
- Decisiones del usuario: traducir el contenido (eligió "servicio automático" y luego indicó que lo tradujera el propio agente, sin voseo ni jerga); traducir también las etiquetas técnicas del deporte.
- Acciones: se tradujeron las etiquetas de UI al español (nav y títulos de sección: Patadas verticales, Hacia atrás, Hacia adelante, Interior, Exterior, Posturas; categorías: Patada vertical, Giro, Mortal; grupos de transiciones: Unificado, Singular, Secuencial). Para el contenido se agregó la columna `description_es` a `tricks`, `variations`, `transitions` y `stances` (migración `0004_graceful_gamma_corps.sql`); la API devuelve `description` (en) y `descriptionEs` (es); el frontend elige por locale con el helper `apps/web/src/lib/description.ts` (es usa `descriptionEs` con fallback al original; en usa la fuente). Las traducciones se hicieron a mano (el agente), sin servicio externo ni dependencias nuevas, y se guardaron en `packages/db/src/seed/translations/es-*.json`; el script `packages/db/src/seed/apply-translations.ts` (`db:translations`) las aplica de forma idempotente. Se tradujeron 558 descripciones de trucos, 19 familias de variaciones, 16 transiciones y 6 stances; las 37 variaciones concretas heredan la traducción de su truco. Se actualizaron las aserciones E2E de los títulos traducidos.
- Archivos tocados: `packages/db/src/schema.ts`, `packages/db/drizzle/0004_*.sql` y `meta/`, `packages/db/src/queries/{tricks,variations,transitions,stances}.ts`, `packages/db/src/seed/apply-translations.ts`, `packages/db/src/seed/translations/**`, `packages/db/package.json`, `apps/web/src/lib/{description,trick-schemas,semantic-schemas}.ts`, `apps/web/src/components/*.tsx`, `apps/web/src/app/[locale]/{tricks,variations,transitions,stances}/**`, `apps/web/messages/es/{common,tricks,stances,transitions}.json`, `e2e/*.spec.ts`, `AGENTS.md`, `docs/docs-agents/reglas-validacion.md`.
- Comandos relevantes: `pnpm --filter @tricking/db db:generate`, `db:migrate`, `db:translations`; `pnpm typecheck`; `pnpm lint`; `pnpm --filter @tricking/web i18n:check`; `pnpm exec prettier --check .`; `pnpm exec playwright test`.
- Pruebas: typecheck, lint, i18n y formato en verde; 78 E2E en verde (2 skipped) en chromium y mobile; verificado en el navegador real que `/es/tricks/vertical-kicks` muestra las descripciones en español y `/en/tricks/vertical-kicks` las muestra en inglés.
- Decisiones: el contenido se guarda por idioma con `description_es` (no se pisa el original en inglés); los nombres de trucos se mantienen en inglés (términos estándar del deporte); la traducción es manual y queda versionada en el repo, sin servicio externo ni variable de entorno nueva.
- Pendientes y riesgos: la traducción es una propuesta editable; si se agrega contenido nuevo en inglés, hay que traducirlo y volver a correr `db:translations`. Los textos de ejemplo de las transiciones (combos como "Roundoff (punch) Back Tuck") se dejaron en inglés porque son nombres de trucos.
- Referencias: `docs/docs-agents/fases.md`, `docs/docs-agents/design.md`, `AGENTS.md` secciones 12 y 17.

## Fases 11 a 14: Explore, busqueda, tutoriales de Kojo, videos R2 y correccion de prereqs (2026-10-04)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Fases 11 (Explore Page), 12 (busqueda global), 13 (tutoriales de Kojo) y 14 (videos en R2), mas la subfase de corrección de la Fase 3.
- Qué pedía: el usuario aprobó el plan de las cuatro fases, pidió un subagente por fase en simultáneo (no secuencial) y commits y push directos a `main` sin ramas; confirmó `kojostricklab.com` como fuente de Kojo y autorizó `@xyflow/react`, `insta-fetcher`, `@upstash/redis`, `@upstash/qstash`, `@aws-sdk/client-s3` y la compresión con `ffmpeg`.
- Fecha de inicio: 2026-10-04.
- Estado actual: completada, con dos pendientes de entorno (credenciales de R2 y `ffmpeg`).
- Autor del registro: Leonardo Retamal.
- Acciones: se construyó una fundación serial (corrección de la Fase 3, migración `0005`, stubs de queries, registro de dependencias y variables) y luego se lanzaron 4 subagentes en paralelo, uno por fase. Fase 11: grafo con `@xyflow/react`, `GET /api/graph` con filtros y tope de nodos en SQL, panel lateral accesible y cache en localStorage. Fase 12: columna generada `tricks.search_vector` (tsvector) con índice GIN, `GET /api/search` con `websearch_to_tsquery`/`ts_rank`, input en navbar con debounce y página `/es/search` con resaltado. Fase 13: 417 tutoriales reales extraídos de la API pública de `kojostricklab.com` y sembrados; acordeón accesible y estado expandido a 7 días. Fase 14: 556 videos reales de Loopkicks sembrados como `status='external'`, tubería de subida a R2 lista (con transcode opcional) y reproductor en el detalle. Corrección de la Fase 3: tabla `trick_relations` poblada resolviendo el nombre normalizado a id (1500 relaciones, 547 trucos) y `getTrickById` leyendo de ahí.
- Archivos tocados: `packages/db/src/schema.ts`, `packages/db/drizzle/0005_*.sql` y `meta/`, `packages/db/src/queries/{tricks,graph,search,tutorials,videos}.ts`, `packages/db/src/seed/{trick-relations,tutorials,videos}.ts`, `packages/db/src/index.ts`, `packages/db/package.json`, `apps/scraper/src/{scrape-kojo,scrape-loopkicks-videos,upload-videos}.ts`, `apps/scraper/data/{kojo-tutorials,loopkicks-videos}.json`, `apps/scraper/package.json`, `apps/web/src/app/api/{graph,search,tutorials,videos}/`, `apps/web/src/app/[locale]/{explore,search,tutorials}/`, `apps/web/src/components/{explore-*,nav-search,search-results,tutorial-*,trick-video-player,trick-detail-view,navbar,breadcrumbs}.tsx`, `apps/web/src/lib/{graph,search,tutorial,video}-*.ts`, `apps/web/src/i18n/request.ts`, `apps/web/messages/{es,en}/{common,explore,search,tutorials,tricks}.json`, `packages/ui/src/{accordion.tsx,index.ts}`, `e2e/{explore,search,tutorials,trick-video,tricks-relations}.spec.ts`, `.env.example`, `docs/docs-agents/{fases,stack-tecnico,reglas-i18n}.md`, `pnpm-lock.yaml`.
- Comandos relevantes: `pnpm --filter @tricking/db db:generate`, `db:migrate`, `db:relations`, `db:tutorials`, `db:videos`; `pnpm --filter @tricking/scraper scrape:kojo`; `pnpm typecheck`; `pnpm lint`; `pnpm test`; `pnpm --filter @tricking/web i18n:check`; `pnpm exec prettier --check .`; `pnpm exec playwright test`; `git push origin main`.
- Pruebas: typecheck 9/9, lint, formato, `env:check` e i18n en verde; Vitest 32/32; E2E chromium 58 passed + 1 skipped; verificación en navegador real (grafo con nodos y panel, búsqueda con 17 resultados y resaltado, acordeón con persistencia, reproductor de video, móvil 390x600 sin desbordes). Se corrigió un bug de i18n del panel del grafo (categorías direccionales sin traducción).
- Subagentes de validación: reviewer, security, tester e i18n-checker, los cuatro con veredicto PASA CON OBSERVACIONES; se aplicaron las correcciones accionables (búsqueda cliente-segura sin importar `@tricking/db`, desempate de paginación de tutoriales, carga del `.env` en `upload-videos.ts`, E2E de regresión de prereqs, alineación de la documentación de Kojo).
- Decisiones: el grafo usa `@xyflow/react`; la corrección de la Fase 3 se hizo con una tabla de relación en vez de resolver al vuelo; la fuente real de Kojo es su API pública (el sitio es una SPA); Instagram y Upstash quedan reservados como respaldo; sin credenciales de R2 el reproductor usa la URL externa real de Loopkicks.
- Pendientes y riesgos: (1) no hay credenciales de R2 en `.env`, así que no se subió ni se probó `status='ready'`; (2) `ffmpeg` no está instalado, no se probó el transcode; (3) Instagram y Upstash quedan reservados sin worker; (4) la cobertura de `trick_stances` sigue parcial; (5) `transitions.originTrickId/destinationTrickId` sin uso.
- Referencias: `docs/docs-agents/fases.md` (Fases 11 a 14), `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/reglas-i18n.md`, `AGENTS.md` secciones 9, 11, 12, 13, 17 y 18.

## Politica de contenido de terceros y descripcion propia (2026-10-04)

- Issue: no aplica (cambio de política pedido por el usuario).
- Título: No re-hospedar contenido de Loopkicks ni de Kojo; embed oficial y descripción propia.
- Qué pedía: el usuario preguntó por el riesgo de usar los vídeos de Loopkicks y decidió no re-hospedar contenido de terceros, mostrar embeds oficiales o enlazar al original, y agregar una descripción propia de "cómo se hace" cada truco.
- Fecha de inicio: 2026-10-04.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Acciones: se borró el objeto `arabian.mp4` del bucket R2 y el manifiesto local; el seed de vídeos ya no apunta a R2 (status `external`, URL original de Loopkicks); `upload-videos.ts` exige `--confirm-rights` y queda reservado a contenido propio o con licencia; los tutoriales de Kojo se muestran con su título, autor, fecha y enlace al original (Vimeo bloquea el embed en dominios de terceros con 403, así que no se embebe ni se aloja el vídeo; la columna nueva `tutorials.vimeo_id` queda guardada por si se habilita); se agregó `tricks.how_to`/`how_to_es` y el mecanismo curado `db:how-to` (`packages/db/src/seed/how-to/how-to.json`, dos ejemplos); el footer lleva aviso de "no afiliado" y crédito; el detalle de truco muestra "Cómo se hace" y la fuente del vídeo (Loopkicks).
- Archivos tocados: `packages/db/src/schema.ts`, `drizzle/0006_freezing_deadpool.sql`, `seed/{tutorials,videos,apply-how-to,how-to/how-to.json}.ts`, `apps/scraper/src/upload-videos.ts`, `queries/{tricks,tutorials}.ts`, `apps/web/src/lib/{trick,tutorial}-schemas.ts`, `components/{tutorial-accordion,trick-detail-view,trick-video-player,footer}.tsx`, `messages/{es,en}/{common,tricks,tutorials}.json`, `lib/trick-schemas.test.ts`, `.env.example`, `docs/docs-agents/{fases,stack-tecnico,reglas-legal}.md`.
- Comandos relevantes: `pnpm --filter @tricking/db db:generate`, `db:migrate`, `db:how-to`, `db:tutorials`, `db:videos`; borrado del objeto R2 con `DeleteObjectCommand`.
- Pruebas: typecheck 9/9, lint, formato, i18n (10 módulos por locale) y `env:check` en verde; Vitest 32/32; verificación en navegador real pendiente de repetir tras el cambio.
- Decisiones: sin re-hospedaje de terceros; R2 reservado para contenido propio o con licencia; Kojo con embed oficial de Vimeo; descripción propia en `tricks` (visible en detalle); retiro inmediato por soft delete; la atribución no se trata como defensa legal, se pide permiso antes de cualquier re-hospedaje futuro.
- Pendientes y riesgos: reemplazar "contáctanos" del footer por una dirección real cuando exista; ampliar las descripciones propias; el vídeo de prueba ya se borró de R2.
- Referencias: `docs/docs-agents/fases.md` (Fases 13 y 14), `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/reglas-legal.md`.

## Rediseno de la Fase 13 (tecnicas de Kojo) y consolidacion de documentos (2026-10-04)

- Issue: no aplica (corrección de diseño pedida por el usuario).
- Título: De Kojo se toma el conocimiento de técnica, no sus vídeos; se alinean todos los documentos y la memoria.
- Qué pedía: el usuario aclaró que de Kojo quería las técnicas (nombres y tips), no sus vídeos, y pidió modificar todos los documentos y la memoria para evitar problemas a futuro.
- Fecha de inicio: 2026-10-04.
- Estado actual: en curso.
- Autor del registro: Leonardo Retamal.
- Diagnóstico: la Fase 13 se había construido como listado de tutoriales con enlace a los vídeos de Kojo, cuando el usuario quería un acordeón de técnicas (conocimiento), no vídeos. La documentación describía a Kojo como "tutoriales largos vía Instagram" y los vídeos de Loopkicks como "se descargan y suben a R2"; ambas cosas quedaron incorrectas.
- Acciones: se actualizaron `AGENTS.md` (contexto, fuentes, características del producto, cache, RAG y pendientes), `docs/docs-agents/fases.md` (Fases 13 y 14 y el punto 15.4), `stack-tecnico.md`, `reglas-legal.md`, `reglas-i18n.md`, `reglas-frontend.md`, `recomendaciones-stack.md` y `prompt-arranque.md`. Política final: los vídeos de Loopkicks (gratuitos) se muestran desde su URL original, sin almacenar; de Kojo solo se toma el conocimiento de técnica (tips propios) con crédito; R2 reservado a contenido propio o con licencia. En código se inició el rediseño con `tutorials.level`/`tips`/`tips_es` y las tablas `tutorial_tricks` y `content_blocks` (migración `0007`, pendiente de generar).
- Decisiones: sección "Técnicas de Kojo" en acordeón; tips de técnica PROPIOS curados; emparejamiento automático de títulos con trucos del catálogo más revisión curada; bloque "General" redactado por el agente y aprobado por el usuario.
- Pendientes y riesgos: generar y aplicar la migración `0007`; seeds de tips, emparejamientos y general; rehacer el frontend del acordeón; E2E y verificación en navegador; reemplazar "contáctanos" del footer por una dirección real.
- Referencias: `docs/docs-agents/fases.md` (Fase 13), `docs/docs-agents/reglas-legal.md`, `AGENTS.md` secciones 1 y 7.

## Detalle del truco con Loopkicks y Kojo (2026-10-04)

- Issue: no aplica (diseño pedido por el usuario).
- Título: Lista común de trucos y detalle con vídeo, "cómo se hace" y versiones de Loopkicks y Kojo.
- Qué pedía: todos los trucos en un lugar común; al hacer clic, vídeo a la izquierda, "cómo se hace" a la derecha y, debajo, un acordeón de Loopkicks y otro de Kojo.
- Fecha de inicio: 2026-10-04.
- Estado actual: completada (el "cómo se hace" propio queda casi vacío, pendiente de contenido).
- Autor del registro: Leonardo Retamal.
- Acciones: `/tricks` pasó a ser una sola lista con los 558 trucos y filtro por sección; el detalle se reordenó en dos columnas (vídeo izquierda, "cómo se hace" derecha) con acordeones "Loopkicks" y "Kojo" debajo. Se scrapearon las descripciones reales de Loopkicks (556 trucos) a `tricks.loopkicks_notes` (migración `0008`; `scrape:notes` y `db:loopkicks-notes`). El acordeón de Kojo usa el emparejamiento `tutorial_tricks` con los tips propios y crédito. Se agregó el bloque general de técnicas y la sección `/tutorials`.
- Diagnóstico de datos: la API pública de Kojo no expone texto de técnica (las descripciones están tras login de suscriptor; `programme-video-data` responde `Unauthorized`), así que de la "versión gratuita" solo hay título, autor y nivel. Loopkicks sí publica una descripción por truco.
- Archivos tocados: `apps/scraper/src/scrape-loopkicks-notes.ts`, `packages/db/src/seed/loopkicks-notes.ts`, `packages/db/src/schema.ts`, `drizzle/0008_kind_paper_doll.sql`, `queries/tricks.ts`, `trick-detail-view.tsx`, `trick-browser.tsx`, `trick-params.ts`, `app/[locale]/tricks/page.tsx`, `trick-schemas.ts`, mensajes i18n, `providers.tsx` (CACHE_BUSTER).
- Pruebas: typecheck, lint, formato, i18n, `env:check` y Vitest 32/32 en verde; E2E chromium 60 passed + 1 skipped; navegador real (lista común, detalle con dos columnas y acordeones, móvil 390x600).
- Pendientes y riesgos: cargar el "cómo se hace" propio (solo aerial y btwist de ejemplo) con `db:how-to`; decidir si la sección `/tutorials` se mantiene o se fusiona con el detalle; reemplazar "contáctanos" del footer.
- Referencias: `docs/docs-agents/fases.md` (Fases 13 y 14), `docs/docs-agents/stack-tecnico.md`.

## Fases 15 a 18: enlaces cruzados, tips de mirada, pulido y feedback (2026-10-05)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Enlaces cruzados (15), tips de mirada (16), pulido y validación final (17) y feedback de usuarios (18).
- Qué pedía: cerrar las cuatro fases; el usuario aprobó el orden 15, 16, 18 y 17 al final, ejecutar subagentes simultáneos (1 por fase) y commits/push directos a `main` sin ramas.
- Fecha de inicio: 2026-10-04.
- Estado actual: Fases 15, 16 y 18 completadas; Fase 17 completada con pendientes de entorno (Lighthouse y claves de Resend/Turnstile).
- Autor del registro: Leonardo Retamal.
- Acciones: fundación serial (schema + migración `0009_fancy_prism.sql` con `gaze_tips.label`, `gaze_tip_summaries`, `gaze_tip_sections` y `feedback`; deps `resend`, `@marsidev/react-turnstile`, `@upstash/redis`, `sonner`, `react-hook-form`, `@hookform/resolvers`; variables en `.env.example` y `stack-tecnico.md`). Tres subagentes de implementación en paralelo (15, 16, 18). Fase 15: `getTrickRelations` y componente `RelatedItems` en el detalle. Fase 16: seed es/en (19 tips y 3 resúmenes por locale, traducción propia), APIs `/api/tips`, `/api/tips/summaries`, `/api/tips/[trickType]`, rutas `/es/tips` y `/es/tips/[trickType]`, navbar con icono de ojo. Fase 18: `POST /api/feedback` (Zod, rate limit, honeypot, tiempo mínimo, Turnstile en servidor), panel `/es/admin/feedback` con token, formulario `/es/feedback` y aviso por Resend. Fase 17: ronda de 4 subagentes de validación en paralelo.
- Decisiones: taxonomía de tips por las 5 secciones del catálogo más `piso-transiciones` (con `label` por truco de piso); puente tip -> catálogo en `gaze_tip_sections`; panel protegido con `FEEDBACK_ADMIN_TOKEN` (valor real solo en `.env`, no versionado); Turnstile se aplica siempre (dev y producción son el mismo entorno); el panel no se persiste en localStorage.
- Correcciones de validación: el bloqueante unánime fue que el cache persistido de TanStack Query filtraba a localStorage el token del panel y la PII del feedback; se corrigió con `dehydrateOptions.shouldDehydrateQuery` en `providers.tsx` y se verificó en navegador que `tricking:query-cache` ya no contiene token, clave `feedback-admin` ni correos. Menores aplicados: validar el mínimo del mensaje tras sanear, `parseId` estricto, eliminar clave huérfana, mover el texto del honeypot a i18n, mostrar etiqueta localizada en vez del slug crudo, memoizar `getTrickById` con `cache()` y sincronizar `AGENTS.md`.
- Archivos tocados: `packages/db/src/schema.ts`, `packages/db/drizzle/0009_fancy_prism.sql`, `packages/db/src/queries/{relations,gaze-tips,feedback}.ts`, `packages/db/src/seed/gaze-tips/*`, `apps/web/src/app/api/{tips,feedback}/**`, `apps/web/src/app/[locale]/{tips,feedback}/**`, `apps/web/src/app/[locale]/admin/feedback/**`, `apps/web/src/components/{providers,trick-detail-view,breadcrumbs,gaze-*,feedback-*}.tsx`, `packages/ui/src/related-items.tsx`, mensajes i18n, `e2e/{tips,feedback}.spec.ts`, `AGENTS.md`, `docs/docs-agents/{fases,stack-tecnico,checklist-lanzamiento}.md`, `.env.example`.
- Pruebas: typecheck db/web, lint db/web, Prettier, `i18n:check`, `env:check` y Vitest 26/26 en verde; migración aplicada; seed de tips (6 resúmenes, 38 tips, 30 enlaces); APIs de tips y feedback verificadas por HTTP; flujo de feedback end-to-end (POST guarda, GET con token lista, sin token 401); navegador real en `/es/tips`, `/es/tips/backward`, `/es/tricks/inside/aerial`, `/es/feedback` y `/es/admin/feedback`, con móvil 390x600 sin desborde. Build de producción delegado al gancho pre-push (regla del repo).
- Pendientes y riesgos: configurar `RESEND_API_KEY` y las claves de Turnstile en el `.env` (sin ellas el feedback se guarda y el correo/captcha degradan con aviso); correr Lighthouse móvil cuando haya herramienta; ítems de lanzamiento en progreso (favicon, sitemap/robots, datos estructurados, HTTPS, contraste medido); el formulario usa estado controlado con Zod en vez de react-hook-form (las deps están instaladas; desviación consciente).
- Referencias: `docs/docs-agents/fases.md` (Fases 15 a 18), `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/checklist-lanzamiento.md`.

## Correccion de E2E de busqueda en movil (2026-10-05)

- Issue: no aplica (correccion detectada al revisar el CI).
- Título: `e2e/search.spec.ts` fallaba en el proyecto móvil.
- Qué pedía: dejar el CI en verde; el último run de `main` (commit `6ce2897`) ya fallaba antes de las Fases 15 a 18.
- Fecha de inicio: 2026-10-05.
- Estado actual: completada.
- Autor del registro: Leonardo Retamal.
- Diagnóstico: la prueba "la busqueda en la navbar navega a la pagina dedicada" rellenaba el input de la navbar, que en móvil se oculta con `hidden md:block`; en el proyecto `mobile` el elemento nunca es visible y la prueba agotaba el timeout. Los otros 135 E2E pasaron.
- Acciones: se agrega `test.skip(isMobile, ...)` para que la prueba corra solo en escritorio (su alcance real).
- Pruebas: el resto de la suite E2E seguía en verde; el arreglo es de alcance de prueba, no de producto.
- Referencias: `e2e/search.spec.ts`, `docs/docs-agents/fases.md` (Fase 12), run de CI `37250601619`.

## Fases 19 a 22: lanzamiento, rendimiento y PWA, progreso sin login, asistente de IA (2026-10-05)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Lanzamiento legal y SEO (19), rendimiento/accesibilidad/PWA (20), progreso del usuario sin login (21) y asistente de IA acotado a tricking más generador de combinaciones (22).
- Qué pedía: implementar las cuatro fases con 4 subagentes simultáneos (1 por fase) y commits/push directos a `main`. Decisiones del usuario: sin autenticación (el progreso vive en localStorage con Zustand y el wrapper); el asistente es una burbuja de chat (no una sección nueva), sin memoria (se borra al recargar), con IA real acotada a tricking y considerando los trucos que el usuario ya tiene; el generador de combinaciones vive en `/progress`.
- Fecha de inicio: 2026-10-05.
- Estado actual: completada con pendientes de entorno.
- Autor del registro: Leonardo Retamal.
- Acciones: fundación serial (declaración de las fases, contrato del progress store, namespaces i18n `legal`/`progress`/`assistant`, `.env.example`). Cuatro subagentes de implementación en paralelo. Fase 19: páginas de aviso legal y privacidad, `robots.ts`, `sitemap.ts` (1292 URLs), `icon.svg` y `apple-icon`, `opengraph-image`, JSON-LD `WebSite`, metadata con canonical/Open Graph/Twitter/hreflang y cabeceras HSTS y de seguridad. Fase 20: contraste WCAG AA medido y ajustado, `manifest` y service worker propio, enlace de salto y página offline. Fase 21: store de Zustand sobre el wrapper, control de estado en tarjeta y detalle, resumen con contador y barras, export/import JSON y página `/progress`. Fase 22: `POST /api/assistant` (Zod, rate limit, pre-filtro, tope diario, contexto full-text y `knownTrickIds`) y `POST /api/combos/generate` (determinista más refinamiento IA opcional), burbuja de chat flotante con animación de apertura y el generador dentro de `/progress`. Proveedor de IA por HTTP compatible con OpenAI, por defecto Google Gemini gratuito.
- Decisiones: la IA se llama por HTTP sin SDK (el Vercel AI SDK sigue prohibido); el chat no persiste (ni localStorage ni base); se envían la pregunta y la lista de trucos marcados al proveedor (declarado en la privacidad); el JSON-LD usa `dangerouslySetInnerHTML` con escapado de `<`.
- Correcciones de validación: e2e del chat acotado con `.first()` por texto duplicado; variable de verificación de Google cableada en `generateMetadata`; `/progress` agregado al sitemap; `/apple-icon` excluido del middleware de locale; `FALLBACK_TEXT` con acentos. Hallazgos aceptados o documentados: sin captcha en los endpoints de IA (mitigado por rate limit, tope diario y Upstash), pre-filtro denylist sin post-filtro, el service worker no cachea catálogo ni tips, `canonical` por página pendiente y la autorización expresa del `dangerouslySetInnerHTML` del JSON-LD.
- Archivos tocados: `apps/web/src/app/[locale]/{legal,privacidad,offline,progress}/**`, `apps/web/src/app/{robots,sitemap,manifest}.ts`, `apps/web/src/app/icon.svg`, `apps/web/src/app/apple-icon.tsx`, `apps/web/src/app/[locale]/opengraph-image.tsx`, `apps/web/src/app/api/{assistant,combos}/**`, `apps/web/src/components/{json-ld,skip-link,pwa-register,progress-*,trick-card,assistant-bubble,assistant-chat,combo-generator}.tsx`, `apps/web/src/lib/{site,progress-schemas,progress-store,assistant-schemas,assistant-api,ai-client,ai-guardrails,combo-schemas,combo-builder}.ts`, `apps/web/public/sw.js`, `packages/db/src/queries/assistant.ts`, `packages/db/src/index.ts`, `apps/web/messages/{es,en}/{legal,progress,assistant}.json`, `apps/web/messages/{es,en}/common.json`, `apps/web/src/i18n/request.ts`, `apps/web/next.config.ts`, `apps/web/src/proxy.ts`, `apps/web/src/app/[locale]/layout.tsx`, `apps/web/src/components/{navbar,footer}.tsx`, `vitest.config.ts`, `e2e/{legal-seo,pwa,progress,assistant}.spec.ts`, `docs/docs-agents/{fases,stack-tecnico,design,checklist-lanzamiento}.md`, `.env.example`.
- Pruebas: typecheck, lint, Prettier, `i18n:check`, `env:check` y Vitest 53/53 en verde; navegador real (`/es`, `/es/legal`, `/es/privacidad`, `/es/progress`, `/es/tricks/inside/aerial`, `/es/offline`, la burbuja del asistente con foco y Escape, el generador con trucos marcados y móvil 390x600 sin desborde); APIs por HTTP (rechazo de lo ajeno, degradación sin key y combinación solo con trucos conocidos). Build de producción delegado al gancho pre-push.
- Pendientes de entorno: `AI_API_KEY` de un proveedor gratuito, datos del titular para legal y privacidad, `RESEND_API_KEY` y Turnstile, Lighthouse no ejecutado y validación con Rich Results Test.
- Referencias: `docs/docs-agents/fases.md` (Fases 19 a 22), `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/checklist-lanzamiento.md`.

## Fase 23 (cierre de lanzamiento) y activacion de las Fases 24 a 36 (2026-10-05)

- Issue: no aplica (trabajo de fase y planificacion, sin issue asociado).
- Título: Cierre de lanzamiento de la Fase 23 (datos estructurados, HTTPS y Lighthouse) y activación de las mejoras de la sección 28 como Fases 24 a 36.
- Qué pedía: cerrar la Fase 23 (datos estructurados, Lighthouse móvil, HTTPS y guía de Rich Results y Search Console) y presentar los pendientes de la sección 28 de `AGENTS.md` con un selector para activar los elegidos, abriendo fases nuevas con subfases, criterio de cierre, dependencias y variables.
- Fecha de inicio: 2026-10-05.
- Estado actual: Fase 23 completada con pendientes de lanzamiento; Fases 24 a 36 planificadas, sin implementar.
- Autor del registro: Leonardo Retamal.
- Acciones: se completaron los datos estructurados con `BreadcrumbList` en el detalle de truco, variaciones, transiciones y posturas, y una ficha por truco con schema.org `LearningResource` (incluye `teaches` con el "cómo se hace" cuando existe), en `apps/web/src/components/json-ld.tsx` y las páginas de detalle, con tests. Se agregó la redirección 301 de HTTP a HTTPS en `apps/web/src/proxy.ts` (Cloudflare Workers no la aplica en `*.workers.dev` y la app respondía 200 por `http`). Se instaló `lighthouse` como devDependency raíz y se agregó el script `pnpm lighthouse` (requiere `CHROME_PATH`), y se midió la producción. Se verificaron robots, sitemap, favicon, cabeceras y enlaces. Se actualizaron `fases.md` (Fase 23 y Fases 24 a 36), `stack-tecnico.md`, `checklist-lanzamiento.md` y `.env.example`.
- Decisiones del usuario (respuestas al selector): datos estructurados completos; `lighthouse` como devDependency; datos del titular diferidos; RAG con NVIDIA NIM más `pgvector`; analítica y notificaciones push diferidas a futuro; traducción automática es/en del contenido propio; "cómo se hace" redactado por lotes con revisión del usuario; trucos nuevos para dificultad básica y fácil con lista propuesta por el agente y aprobada por el usuario.
- Archivos tocados: `apps/web/src/components/json-ld.tsx`, `apps/web/src/components/json-ld.test.tsx` (nuevo), `apps/web/src/proxy.ts`, `apps/web/src/app/[locale]/tricks/[section]/[id]/page.tsx`, `apps/web/src/app/[locale]/{variations,transitions,stances}/[slug]/page.tsx`, `apps/web/next.config.ts` (comentario), `vitest.config.ts` (runtime JSX automático), `package.json`, `pnpm-lock.yaml`, `.env.example`, `docs/docs-agents/{fases,stack-tecnico,checklist-lanzamiento}.md`, `BITACORA.md`.
- Comandos relevantes: `pnpm add -D -w lighthouse`; `pnpm typecheck`; `pnpm test`; `pnpm --filter @tricking/web typecheck`; `pnpm exec prettier --check`; `pnpm env:sync`; `CHROME_PATH=... pnpm run lighthouse`; `curl` de verificación contra la producción.
- Pruebas: typecheck 9/9 y 67 tests unitarios en verde (incluido el test nuevo de JSON-LD con escape de `<`); Lighthouse móvil: performance 89 a 90, accesibilidad 100, buenas prácticas 100, SEO 100; en producción `robots.txt` y `sitemap.xml` con 200 (1294 URLs), `icon.svg` y `apple-icon` con 200, HSTS, X-Content-Type-Options, X-Frame-Options y Referrer-Policy presentes, enlaces externos de Loopkicks con 200; navegador real: el detalle de truco emite `BreadcrumbList` (4 ítems) y `LearningResource` con `teaches`, la home emite `WebSite` y el detalle de variación emite `BreadcrumbList` (3 ítems), sin desborde horizontal a 390x600.
- Subagentes: tres en paralelo de implementación o verificación (JSON-LD, Lighthouse, verificaciones de lanzamiento de solo lectura) más uno para la redirección HTTPS; luego cuatro de cierre (reviewer, security, tester e i18n-checker) con veredicto PASA o PASA CON OBSERVACIONES, sin bloqueantes. Se aplicaron los hallazgos accionables: spread robusto para `description` y `teaches`, comentario de `next.config.ts` actualizado, test de escape del JSON-LD con jsdom, runtime JSX automático en `vitest.config.ts` y script de Lighthouse sin el subdominio personal.
- Pendientes y riesgos: los cambios de código esperan el push a `main` para desplegarse; datos del titular en aviso legal y privacidad (items 1 y 2, diferidos); la validación del JSON-LD con Rich Results Test quedó diferida a futuro por decisión del usuario, y registrar el sitio en Search Console (operación externa del usuario; si se usa verificación por meta, cargar `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` como variable de build); performance en 89 a 90, justo en el umbral, con el TBT y el redirect de `/` a `/es` como cuellos de botella; el lint local de `apps/web` falla por los artefactos de `apps/web/.open-next` (preexistente; conviene ignorarlos en `eslint.config.mjs`). No se hizo commit ni push.
- Referencias: `docs/docs-agents/fases.md` (Fase 23 y Fases 24 a 36), `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/checklist-lanzamiento.md`, `docs/docs-agents/reglas-seo.md`, `docs/docs-agents/reglas-ia.md`.

## Fases 24 y 25, i18n real de Loopkicks y del asistente, y footer (2026-10-05)

- Issue: no aplica (trabajo de fase y correcciones pedidas por el usuario).
- Título: Cierre de la Fase 24 ("cómo se hace" del catálogo) y la Fase 25 (12 trucos nuevos de básico/fácil), más la i18n real de las notas de Loopkicks y del asistente, el arreglo del generador de combinaciones libres y el rediseño del footer.
- Qué pedía: el usuario pidió cerrar los pendientes de contenido (cómo se hace de todos los trucos y trucos nuevos de dificultad básica y fácil), que las notas de Loopkicks y la IA o el chat sigan el idioma de la página, arreglar el error del generador de combinaciones libres y mejorar el footer.
- Fecha de inicio: 2026-10-05.
- Estado actual: completada. La Fase 24 queda con el texto como borrador pendiente de revisión del usuario por tanda.
- Autor del registro: Leonardo Retamal.
- Acciones: se redactó el "cómo se hace" propio de los 568 trucos con sección (es/en) en 7 archivos `packages/db/src/seed/how-to/*.json` con `apply-how-to.ts` leyendo y fusionando el directorio, y se aplicó con `db:how-to` (cobertura 568/568). Se cargaron 12 trucos nuevos con `manual-tricks/tricks.json` y `db:manual-tricks` (básico 0 a 6 y fácil 2 a 8, total 570). Se agregó `tricks.loopkicks_notes_es` (migración `0010`), se tradujeron las 556 notas y el detalle elige por locale. Se corrigió el generador de combinaciones libres del asistente (`isComboRequest`, con tests y acotamiento para no clasificar frases ajenas). Se hizo multiidioma real el prompt de sistema y las plantillas del chat. Se rediseñó el footer en grupos.
- Decisiones del usuario: activar los pendientes de la sección 28 como fases 24 a 36; cómo se hace redactado por lotes con revisión; trucos nuevos con lista propuesta y aprobación; analítica y push diferidos; RAG con NVIDIA NIM y pgvector; traducción automática es/en del contenido.
- Archivos tocados: `packages/db/src/schema.ts`, `drizzle/0010_tidy_morlun.sql` + snapshot + journal, `queries/tricks.ts`, `queries/assistant.ts`, `seed/{manual-tricks.ts,manual-tricks/,apply-how-to.ts,translate-loopkicks.ts,apply-loopkicks-notes-es.ts,how-to/*,translations/loopkicks-notes-es.json}`, `packages/db/package.json`; `apps/web/src/lib/{ai-guardrails.ts,ai-guardrails.test.ts,trick-schemas.ts,trick-schemas.test.ts}`, `apps/web/src/app/api/assistant/route.ts`, `apps/web/src/components/{footer,trick-detail-view,providers}.tsx`, `apps/web/messages/{es,en}/{assistant,common}.json`; `docs/docs-agents/{fases,stack-tecnico}.md`, `BITACORA.md`.
- Comandos relevantes: `pnpm --filter @tricking/db db:generate`, `db:migrate`, `db:manual-tricks`, `db:how-to`, `db:translate-loopkicks`, `db:loopkicks-notes-es`; `pnpm typecheck`, `pnpm test`, `pnpm --filter @tricking/web i18n:check`, `pnpm env:check`, `pnpm exec prettier --check .`.
- Pruebas: typecheck 9/9 y 76 tests unitarios en verde; i18n con paridad; cobertura de cómo se hace 568/568 y notas de Loopkicks 556/556; navegador real: footer con tres grupos y sin desborde a 390x600, cómo se hace y notas de Loopkicks en español en `/es` y en inglés en `/en`, truco nuevo (Donkey Kick) con su detalle, y combinación libre del chat funcionando en español ("libre") y en inglés ("Free combo").
- Subagentes: cierre con reviewer, security, tester e i18n-checker; veredicto PASA CON OBSERVACIONES sin bloqueantes. Se aplicaron los hallazgos: acotamiento de `isComboRequest` para no clasificar frases ajenas (con tests), `apply-how-to` tolerante a directorio ausente y con reporte de ids repetidos o sin fila, y eliminación de la clave muerta `btwist`.
- Pendientes y riesgos: revisión del usuario de los textos de "cómo se hace" por tanda; la calidad semántica de las traducciones automáticas de Loopkicks no se evaluó; `FALLBACK_TEXT` del asistente duplica claves de `assistant.json` (deuda preexistente ampliada); build de producción delegado al gancho pre-push.
- Referencias: `docs/docs-agents/fases.md` (Fases 13, 14, 22, 24 y 25 y "Correcciones aplicadas"), `docs/docs-agents/stack-tecnico.md`, `docs/docs-agents/reglas-i18n.md`, `docs/docs-agents/reglas-ia.md`.

## Rediseño visual - Fase 37 (2026-10-06)

- Issue: no aplica (trabajo de fase, sin issue asociado).
- Título: Rediseño visual - Fase 37.
- Qué pedía: renovar la interfaz con la paleta "Neón nocturno" (dark-first), tipografía display, utilidades de efecto, fondo global e imágenes libres, empezando por la fundación visual (U0). Sin cambiar la funcionalidad ni el contenido y sin salir del alcance de los archivos asignados.
- Fecha de inicio: 2026-10-06.
- Estado actual: completada. Unidades U0 (fundación), U1 (shell), U2 (home), U3 (catálogo) y U4 (resto) implementadas, verificadas en navegador real (escritorio y móvil 390x600) y cerradas con subagentes de validación. Pendiente el push a `main`, que lo pide el usuario.
- Autor del registro: Leonardo Retamal Morales.
- Acciones: se reescribió `apps/web/src/app/globals.css` con la paleta nueva en `@plugin 'daisyui/theme'` (`tricking-dark` con `default: true` y `tricking-light` con `default: false, prefersdark: false`), los tokens de dificultad y categoría para ambos temas reajustados a WCAG AA, las utilidades nuevas (`.tb-display`, `.tb-eyebrow`, `.tb-surface`, `.tb-surface-hover`, `.tb-glow`, `.tb-gradient-text`, `.tb-mesh`, `.tb-grain`, `.tb-reveal`/`.is-visible`, `.tb-marquee`), los keyframes `tb-marquee`, `tb-float`, `tb-fade-up` y `tb-pulse-glow`, y el bloque `prefers-reduced-motion`. Se actualizó `apps/web/src/app/[locale]/layout.tsx` con `Inter` y `Anton` de `next/font/google`, el script anti-flash con default oscuro, el fondo global y la capa de contenido. Se crearon `apps/web/src/components/site-background.tsx` y `apps/web/src/components/reveal.tsx`. Se descargaron seis imágenes WebP de Pexels (artes marciales, patadas y flips) a `apps/web/public/img/` con su `CREDITS.md`. Se actualizó `docs/docs-agents/design.md` (paleta, tipografías, utilidades, contraste y créditos) y se agregó la Fase 37 en `docs/docs-agents/fases.md`. Luego se rediseñaron, en paralelo, el shell (navbar y pie), la pantalla de inicio, el catálogo de trucos y las secciones restantes; se corrigieron el desborde horizontal del hero, la persistencia de queries de TanStack Query (una query pendiente se guardaba y rechazaba al rehidratar), el favicon y el icono de app con la marca nueva, y las imágenes pasaron de gimnasia a tricking.
- Archivos tocados: `apps/web/src/app/globals.css`, `apps/web/src/app/[locale]/layout.tsx`, `apps/web/src/components/site-background.tsx`, `apps/web/src/components/reveal.tsx`, `apps/web/public/img/*.webp` (6), `apps/web/public/img/CREDITS.md`, `docs/docs-agents/design.md`, `docs/docs-agents/fases.md`, `BITACORA.md`.
- Pruebas: contraste WCAG AA re-medido con las bases nuevas (todos los tokens de badge igual o por encima de 4.5:1, peor caso claro 4.502 y oscuro 4.768). Las seis imágenes verificadas con `file` como WebP y con peso total de 783086 bytes. Typecheck, ESLint e i18n en verde; build de producción (`next build`) ejecutado una vez como diagnóstico, sin errores; verificación en navegador real de todas las pantallas, sin errores de consola propios y sin desborde horizontal en móvil. Subagentes reviewer, security y tester: PASA CON OBSERVACIONES, con las correcciones aplicadas (documentación, `opengraph-image`, capa de `.tb-eyebrow`, fallback sin JS de Reveal, contraste forzado y `aria-label` de badges).
- Pendientes y riesgos: `AGENTS.md` (sección 10), `reglas-frontend.md` y `design.md` quedaron alineados al dark-first. Pendiente correr Lighthouse móvil sobre el build de producción y el push a `main` cuando el usuario lo pida.
- Referencias: `docs/docs-agents/fases.md` (Fase 37), `docs/docs-agents/design.md`, `apps/web/public/img/CREDITS.md`.
