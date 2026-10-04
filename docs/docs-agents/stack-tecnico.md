# Stack técnico

Registro de las decisiones cerradas del stack del monorepo. Cada decisión se tomó a partir de la opción principal recomendada en `docs/docs-agents/recomendaciones-stack.md`. Las decisiones se consideran cerradas hasta que el usuario pida cambiarlas; mientras tanto, cada una puede ajustarse si el usuario lo solicita.

Este documento es el inventario técnico del proyecto y la referencia para saber qué está aprobado. Las decisiones condicionales quedan marcadas como tales y se cierran cuando la fase correspondiente se active.

## Decisiones cerradas

| Categoría                | Decisión                                                 | Alternativa descartada por defecto     | Estado              | Nota de ajuste                                                                                           |
| ------------------------ | -------------------------------------------------------- | -------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| Monorepo                 | Turborepo + pnpm workspaces                              | Nx                                     | Cerrada             | Puede ajustarse si el proyecto crece y necesita generadores                                              |
| Frontend                 | Next.js (App Router) + TypeScript estricto               | React + Vite, SvelteKit                | Cerrada             | Puede ajustarse si no se necesita SSR                                                                    |
| Hosting web              | Cloudflare Pages                                         | Netlify, Render                        | Cerrada             | Puede ajustarse si el SSR supera los 10 ms de CPU por invocación                                         |
| Base de datos            | Neon (PostgreSQL serverless)                             | Aiven for PostgreSQL, Xata             | Cerrada             | Puede ajustarse si se necesita una instancia siempre encendida                                           |
| ORM y migraciones        | Drizzle ORM + drizzle-kit                                | Prisma                                 | Cerrada             | Prisma está prohibido sin autorización                                                                   |
| Almacenamiento de vídeos | Cloudflare R2                                            | Backblaze B2                           | Cerrada             | Puede ajustarse por política de costos                                                                   |
| Cola y caché             | Upstash Redis + Upstash QStash                           | Redis propio, Cloudflare Queues        | Cerrada             | Puede ajustarse si se necesita control total                                                             |
| Validación               | Zod v4                                                   | Valibot, TypeBox                       | Cerrada             | Puede ajustarse si el tamaño del bundle es crítico                                                       |
| i18n                     | next-intl (defaultLocale `es`)                           | i18next, react-intl                    | Cerrada             | Puede ajustarse si cambia el framework                                                                   |
| UI                       | Tailwind CSS + DaisyUI                                   | Radix UI, Ark UI                       | Cerrada             | shadcn/ui está prohibido sin autorización                                                                |
| Iconos                   | lucide-react                                             | Otro set compatible con React          | Cerrada             | Puede ajustarse si aparece una necesidad específica                                                      |
| Estado del servidor      | TanStack Query                                           | SWR                                    | Cerrada             | Puede ajustarse si se necesita una API más pequeña                                                       |
| Estado del cliente       | Zustand + localStorage                                   | useState, Context, Redux               | Cerrada             | Sin login, el estado del usuario vive en el cliente; la persistencia pasa por el wrapper de localStorage |
| Virtualización           | TanStack Virtual                                         | react-window                           | Cerrada             | Puede ajustarse si se necesita otra API                                                                  |
| Formularios              | react-hook-form + @hookform/resolvers                    | Formik                                 | Cerrada             | Puede ajustarse si el equipo ya usa Formik                                                               |
| Toasts                   | sonner                                                   | react-hot-toast                        | Cerrada             | Puede ajustarse por preferencia                                                                          |
| Fechas                   | date-fns + date-fns-tz                                   | Day.js                                 | Cerrada             | Puede ajustarse por preferencia                                                                          |
| Logging                  | Pino                                                     | Winston, consola de Next.js            | Cerrada             | Puede ajustarse si el equipo ya usa Winston                                                              |
| Scraping Instagram       | insta-fetcher                                            | @aduptive/instagram-scraper            | Cerrada             | Puede ajustarse si la principal deja de funcionar                                                        |
| Scraping web general     | cheerio                                                  | Crawlee, Playwright headless           | Cerrada             | Playwright headless solo si hace falta renderizar JavaScript                                             |
| Semilla de trucos        | @trickingapi/tricks-core-data + @trickingapi/tricking-ts | No aplica                              | Cerrada             | Es la semilla base; Loopkicks es la fuente primaria del contenido                                        |
| Testing                  | Vitest + Testing Library + Playwright                    | Jest, Cypress                          | Cerrada             | Puede ajustarse si el equipo conoce Jest o Cypress                                                       |
| Autenticación            | No aplica: el producto es público, sin login de usuario  | Auth.js (NextAuth), Better Auth, Clerk | No aplica           | Todo el contenido se ve sin cuenta; si se activa el skill tree (sección 28.3 de AGENTS.md), se reevalúa  |
| CI/CD                    | GitHub Actions                                           | GitLab CI, CircleCI                    | Cerrada             | Puede ajustarse si el repositorio se muda de plataforma                                                  |
| Gestión de secretos      | Variables de entorno en GitHub Actions y Cloudflare      | Infisical, Doppler, Vault              | Cerrada             | Puede ajustarse si el proyecto crece                                                                     |
| Correo                   | Resend                                                   | SendGrid, Nodemailer + SMTP            | No aplica en Fase 0 | Se activa en la Fase 18 (aviso de feedback nuevo); otras notificaciones dependen de la autenticación     |
| Analítica                | Umami                                                    | PostHog, Plausible                     | Condicional         | Se activa si el proyecto la necesita                                                                     |
| Cookies y consentimiento | vanilla-cookieconsent                                    | react-cookie-consent                   | Condicional         | Solo si se usan cookies no esenciales                                                                    |

## Dependencias aprobadas del monorepo

turbo, pnpm, typescript, eslint, `@typescript-eslint/*`, prettier, husky, lint-staged, `@commitlint/cli`, `@commitlint/config-conventional`.

## Dependencias aprobadas del frontend

next, react, react-dom, tailwindcss, postcss, autoprefixer, daisyui, lucide-react, next-intl, zod, react-hook-form, `@hookform/resolvers`, sonner, zustand, `@tanstack/react-query`, `@tanstack/react-query-persist-client`, `@tanstack/react-virtual`, `@xyflow/react`, date-fns, date-fns-tz.

## Dependencias aprobadas del backend y datos

drizzle-orm, drizzle-kit, `@neondatabase/serverless`, pino, pino-pretty, insta-fetcher, `@trickingapi/tricks-core-data`, `@trickingapi/tricking-ts`, `@upstash/redis`, `@upstash/qstash`, `@aws-sdk/client-s3`, cheerio.

## Dependencias aprobadas de testing

vitest, `@testing-library/react`, playwright, i18next-parser o i18next-lint.

## Dependencias prohibidas sin autorización

- Prisma (se usa Drizzle).
- Vercel y Supabase.
- shadcn/ui (reemplazado por DaisyUI).
- Infisical, Vault y Doppler (basta con variables de entorno simples).
- RabbitMQ, Kafka y BullMQ (Upstash cubre la cola).
- Docker y Kubernetes (despliegue serverless).
- LangChain, LlamaIndex y Vercel AI SDK (por ahora no hay IA en producto).
- Pinecone y Weaviate (no hay RAG por ahora).
- Twilio, Vonage y AWS SNS (no hay validación por teléfono).
- SendGrid y Mailgun (no hay envío de correos por ahora; Resend es la opción si se activa).

Agregar cualquiera de estas dependencias requiere autorización explícita del usuario.

## Ubicación de documentos y bitácora

- Carpeta de docs del agente: `docs/docs-agents/`. Es una sola carpeta, se versiona con Git y no se excluye.
- Bitácora: `BITACORA.md`, único archivo en la raíz, versionado, sin fragmentar. Las reglas de uso viven en la sección 19 de `AGENTS.md`.

## Ramas y flujo de trabajo

- Rama principal y de trabajo: `main`.
- No existe rama de desarrollo (`dev`, `developer`, `develop`).
- No existe rama de producción separada (`production`, `prod`, `release/*`) en Git. Si se crea en el futuro, queda como zona prohibida para operaciones del agente.
- Flujo de trabajo: directo sobre `main`, sin ramas por issue y sin PRs. Los commits y el push van a `main` con autorización del usuario.
- El branch por defecto del proyecto de Neon se llama `production` (nomenclatura de Neon) y es el único branch de base de datos; se usa tal cual y no se crea un branch `dev`. No confundirlo con una rama de Git de producción: Git tiene solo `main`.
- Convención de nombres de ramas por issue: no aplica mientras se trabaje directo sobre `main`.
- Esta convención puede ajustarse si el usuario lo pide.

## Archivos de entorno

- `.env.example` en la raíz, versionado, creado en la Fase 1 con la primera variable (`DATABASE_URL`).
- `.env` en la raíz, no versionado (cubierto por `.gitignore`), con los valores reales de desarrollo.
- Las variables de fases futuras se listan como comentarios en `.env.example` hasta que su fase las active.

## Nomenclatura de paquetes del workspace

Nombres resueltos con el scope `@tricking/`:

| Ruta              | Nombre del paquete  | Contenido                               |
| ----------------- | ------------------- | --------------------------------------- |
| `apps/web`        | `@tricking/web`     | Next.js (App Router) + next-intl        |
| `apps/scraper`    | `@tricking/scraper` | Worker de scraping (Node/TS)            |
| `packages/db`     | `@tricking/db`      | Drizzle ORM + schema + migraciones      |
| `packages/ui`     | `@tricking/ui`      | Componentes compartidos                 |
| `packages/shared` | `@tricking/shared`  | Tipos, Zod schemas, utilidades, storage |
| `packages/config` | `@tricking/config`  | tsconfig, eslint, prettier              |

Estos nombres pueden ajustarse si el usuario lo pide. El filtro de CI usa `@tricking/db` para las migraciones.

## Base de CI

- Base actual: `.github/workflows/ci.yml` y `.github/workflows/migrate.yml`.
- `ci.yml` corre los jobs: Lint + formato + build, Pruebas unitarias (`pnpm test`), Validación de claves i18n (`pnpm --filter @tricking/web i18n:check`) y Pruebas E2E (`pnpm exec playwright test`, con instalación previa de Chromium). ShellCheck, Integration Tests y Migraciones Drizzle contra Neon se agregan cuando apliquen.
- CI usa Node 22 (el mismo que el entorno de desarrollo); `undici@8` (vía `jsdom`) exige Node >= 22.19 y fallaba en Node 20. El `engines` del `package.json` raíz es `>=22.19.0`.
- El job `e2e` recibe `DATABASE_URL` (secreto, solo lectura) para las pruebas de trucos; si el secreto no está configurado, omite esas pruebas con un aviso y ejecuta solo las de layout. `migrate.yml` sí requiere los secretos `DATABASE_URL` y `DATABASE_URL_UNPOOLED` para aplicar migraciones.
- `migrate.yml` se creó en la Fase 1.7. Se dispara en `push` a `main` (nunca en `pull_request`, para no migrar la base antes del merge) o por `workflow_dispatch`, cuando cambian `packages/db/src/schema.ts` o `packages/db/drizzle/**`. Ejecuta `pnpm turbo db:migrate --filter=@tricking/db` (tarea declarada en `turbo.json`) con los secrets `DATABASE_URL` y `DATABASE_URL_UNPOOLED`; la migración usa la conexión directa.
- Esta decisión puede ajustarse si el usuario lo pide.

## Frontend implementado (Fase 2)

- `apps/web` usa Next.js 16.3.8 + React 19.3.0 (App Router). `params` y `searchParams` se manejan como `Promise` (Next 16).
- UI con Tailwind CSS 4.3.3 en modo CSS-first (sin `tailwind.config.js`) y DaisyUI 5.7.47. Los temas `tricking-light` (default) y `tricking-dark` (prefersdark) se declaran en `apps/web/src/app/globals.css`; los colores viven solo ahí.
- i18n con next-intl 4.14.9: `locales ['es','en']`, `defaultLocale 'es'`, `localePrefix 'always'` y `localeDetection false` (la raíz va siempre a `/es`). El layout raíz es `apps/web/src/app/[locale]/layout.tsx` y el middleware de locale es `apps/web/src/proxy.ts` (convención de Next 16). Los mensajes se organizan por módulo en `apps/web/messages/{es,en}/`.
- `packages/ui` y `packages/shared` se consumen como fuente TypeScript (`exports` a `src/index.ts`) con `transpilePackages` en `next.config.ts`, sin paso de build a `dist`.
- No hay `loading.tsx` de ruta global a propósito: su boundary de Suspense hacía que las rutas desconocidas respondieran HTTP 200. El estado de carga se resuelve con el componente `LoadingState` en las fases con carga de datos.
- Estado del servidor (TanStack Query) y el consumo de la base de datos arrancan en la Fase 3; la Fase 2 no cablea datos.

## Trucos y API (Fase 3)

- La sección de Loopkicks se modela con la columna `section` en `tricks`. Valores: `vertical-kicks`, `backward`, `forward`, `inside`, `outside`.
- La capa de consulta vive en `packages/db/src/queries/tricks.ts` (`listTricks`, `getTrickById`) con paginación, filtros, búsqueda y orden resueltos en SQL y el total calculado en la base de datos.
- Endpoints: `GET /api/tricks` (valida query con Zod, whitelist de orden y tope de `pageSize` en 100) y `GET /api/tricks/[id]`. Runtime Node; el detalle es `force-dynamic`.
- El frontend usa TanStack Query con persistencia en localStorage a través de un `Persister` propio (`apps/web/src/lib/query-persister.ts`) que pasa por el wrapper `packages/shared/src/storage.ts`. TTL del cache: 1 día.
- La dificultad (0 a 5) se cura a mano en `packages/db/src/seed/difficulty/` (un archivo por sección) y se aplica con `db:difficulty`; ni TrickingAPI ni Loopkicks la publican.
- `@tricking/db` se consume desde `apps/web` como fuente TS con `transpilePackages`. El `.env` de la raíz se carga en `apps/web/next.config.ts` para el runtime de desarrollo (no-op si no existe; en producción las variables vienen del entorno).
- `pino` se usa para el logging del backend (route handlers); no se registran datos sensibles ni errores crudos.

## Ganchos de Git

- pre-commit: lint-staged con `--concurrent false`, `pnpm typecheck`, formato en modo verificación, chequeo de `.env.example` sincronizado (`scripts/check-env-example.mjs`) y shellcheck sobre `bin/lupe-start` y los ganchos. Imprime su duración.
- pre-push: `pnpm test`, validación de claves i18n y build de producción; borra `apps/web/.next` al terminar. Imprime su duración.
- El build de producción vive en pre-push, así que el agente no lo ejecuta a mano (ver AGENTS.md sección 18).
- `apps/web/next-env.d.ts` está en `.gitignore` y no se versiona: Next lo regenera en cada dev o build y cambiaba entre `.next/dev` y `.next`.

## Migraciones

- Modo: manual con drizzle-kit (`db:generate` y `db:migrate`). No hay migraciones automáticas al desplegar.
- Las migraciones se versionan en `packages/db/drizzle/` (artefactos generados, excluidos de Prettier).
- drizzle-kit no genera migraciones de reversión. Para revertir se restaura el branch de Neon a un punto anterior o se aplica el SQL inverso a mano.
- La base de datos es el branch por defecto del proyecto de Neon, que Neon nombra `production`; es el único branch y no se crea `dev` (ver "Ramas y flujo de trabajo").

## Fases 11 a 14 (Explore, busqueda, tutoriales de Kojo, videos en R2)

- Fase 11 (Explore Page): grafo con `@xyflow/react` (dependencia aprobada del frontend). Sin variables de entorno. Endpoint `GET /api/graph`.
- Correccion de la Fase 3 (subfase de correccion): la tabla `trick_relations(trick_id, related_id, kind)` resuelve `prereqs`/`nextTricks` (que la semilla guarda como nombres) a ids; se puebla con `pnpm --filter @tricking/db db:relations` y `getTrickById` lee de ahi. Migracion `0005`, junto con la busqueda full-text.
- Fase 12 (busqueda global): columna generada `tricks.search_vector` (tsvector) con indice GIN; la consulta usa `websearch_to_tsquery` y `ts_rank` en SQL. Sin variables nuevas.
- Fase 13 (tutoriales de Kojo): la fuente real es la API publica de `kojostricklab.com` (`GET /api/user/get-more-recent-videos`), porque el sitio es una SPA de Vue y su HTML inicial no trae datos; cheerio queda como respaldo. Instagram con `insta-fetcher` y la cola Upstash quedan RESERVADOS como respaldo opcional, sin ejecutar por falta de credenciales. Variables `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `QSTASH_TOKEN`, `KOJO_WORKER_URL` (reservadas para cuando se active ese worker). Si nada responde, el contenido se carga a mano en `tutorials`.
- Fase 14 (videos en R2): `@aws-sdk/client-s3` contra el endpoint S3 de R2. Variables `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`. Compresion H.264/H.265 con `ffmpeg` (binario del sistema, ruta opcional en `FFMPEG_PATH`).
- Mini-guia de cada variable: queda en el bloque correspondiente de `.env.example`. Son opcionales para build y typecheck; sin ellas las fases 13 y 14 degradan (tutoriales por carga manual, videos sin subir) sin romper el resto.

## Notas sobre decisiones no aplicables

- Autenticación: no aplica en el producto. Todo el contenido es público y visible sin login; el estado del usuario (última posición, filtros, favoritos locales) vive en el cliente con Zustand y localStorage, no en una cuenta.
- Correo no aplica en Fase 0. Se registra aquí para que la decisión quede cerrada cuando se active y para que ninguna iteración futura lo trate como pendiente de definición.
- Analítica y cookies son condicionales: solo se activan si el proyecto instala cookies no esenciales o necesita analítica. Mientras no se activen, no se agregan dependencias relacionadas.
