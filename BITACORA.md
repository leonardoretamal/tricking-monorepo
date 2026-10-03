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
