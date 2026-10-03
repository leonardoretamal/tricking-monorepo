# Stack técnico

Registro de las decisiones cerradas del stack del monorepo. Cada decisión se tomó a partir de la opción principal recomendada en `docs/docs-agents/recomendaciones-stack.md`. Las decisiones se consideran cerradas hasta que el usuario pida cambiarlas; mientras tanto, cada una puede ajustarse si el usuario lo solicita.

Este documento es el inventario técnico del proyecto y la referencia para saber qué está aprobado. Las decisiones condicionales quedan marcadas como tales y se cierran cuando la fase correspondiente se active.

## Decisiones cerradas

| Categoría                | Decisión                                                 | Alternativa descartada por defecto | Estado              | Nota de ajuste                                                    |
| ------------------------ | -------------------------------------------------------- | ---------------------------------- | ------------------- | ----------------------------------------------------------------- |
| Monorepo                 | Turborepo + pnpm workspaces                              | Nx                                 | Cerrada             | Puede ajustarse si el proyecto crece y necesita generadores       |
| Frontend                 | Next.js (App Router) + TypeScript estricto               | React + Vite, SvelteKit            | Cerrada             | Puede ajustarse si no se necesita SSR                             |
| Hosting web              | Cloudflare Pages                                         | Netlify, Render                    | Cerrada             | Puede ajustarse si el SSR supera los 10 ms de CPU por invocación  |
| Base de datos            | Neon (PostgreSQL serverless)                             | Aiven for PostgreSQL, Xata         | Cerrada             | Puede ajustarse si se necesita una instancia siempre encendida    |
| ORM y migraciones        | Drizzle ORM + drizzle-kit                                | Prisma                             | Cerrada             | Prisma está prohibido sin autorización                            |
| Almacenamiento de vídeos | Cloudflare R2                                            | Backblaze B2                       | Cerrada             | Puede ajustarse por política de costos                            |
| Cola y caché             | Upstash Redis + Upstash QStash                           | Redis propio, Cloudflare Queues    | Cerrada             | Puede ajustarse si se necesita control total                      |
| Validación               | Zod v4                                                   | Valibot, TypeBox                   | Cerrada             | Puede ajustarse si el tamaño del bundle es crítico                |
| i18n                     | next-intl (defaultLocale `es`)                           | i18next, react-intl                | Cerrada             | Puede ajustarse si cambia el framework                            |
| UI                       | Tailwind CSS + DaisyUI                                   | Radix UI, Ark UI                   | Cerrada             | shadcn/ui está prohibido sin autorización                         |
| Iconos                   | lucide-react                                             | Otro set compatible con React      | Cerrada             | Puede ajustarse si aparece una necesidad específica               |
| Estado del servidor      | TanStack Query                                           | SWR                                | Cerrada             | Puede ajustarse si se necesita una API más pequeña                |
| Virtualización           | TanStack Virtual                                         | react-window                       | Cerrada             | Puede ajustarse si se necesita otra API                           |
| Formularios              | react-hook-form + @hookform/resolvers                    | Formik                             | Cerrada             | Puede ajustarse si el equipo ya usa Formik                        |
| Toasts                   | sonner                                                   | react-hot-toast                    | Cerrada             | Puede ajustarse por preferencia                                   |
| Fechas                   | date-fns + date-fns-tz                                   | Day.js                             | Cerrada             | Puede ajustarse por preferencia                                   |
| Logging                  | Pino                                                     | Winston, consola de Next.js        | Cerrada             | Puede ajustarse si el equipo ya usa Winston                       |
| Scraping Instagram       | insta-fetcher                                            | @aduptive/instagram-scraper        | Cerrada             | Puede ajustarse si la principal deja de funcionar                 |
| Scraping web general     | cheerio                                                  | Crawlee, Playwright headless       | Cerrada             | Playwright headless solo si hace falta renderizar JavaScript      |
| Semilla de trucos        | @trickingapi/tricks-core-data + @trickingapi/tricking-ts | No aplica                          | Cerrada             | Es la semilla base; Loopkicks es la fuente primaria del contenido |
| Testing                  | Vitest + Testing Library + Playwright                    | Jest, Cypress                      | Cerrada             | Puede ajustarse si el equipo conoce Jest o Cypress                |
| Autenticación            | Auth.js (NextAuth) con adaptador de Drizzle y Neon       | Better Auth, Clerk                 | No aplica en Fase 0 | Se activa con el skill tree y los combos                          |
| CI/CD                    | GitHub Actions                                           | GitLab CI, CircleCI                | Cerrada             | Puede ajustarse si el repositorio se muda de plataforma           |
| Gestión de secretos      | Variables de entorno en GitHub Actions y Cloudflare      | Infisical, Doppler, Vault          | Cerrada             | Puede ajustarse si el proyecto crece                              |
| Correo                   | Resend                                                   | SendGrid, Nodemailer + SMTP        | No aplica en Fase 0 | Se activa si se implementa autenticación                          |
| Analítica                | Umami                                                    | PostHog, Plausible                 | Condicional         | Se activa si el proyecto la necesita                              |
| Cookies y consentimiento | vanilla-cookieconsent                                    | react-cookie-consent               | Condicional         | Solo si se usan cookies no esenciales                             |

## Dependencias aprobadas del monorepo

turbo, pnpm, typescript, eslint, `@typescript-eslint/*`, prettier, husky, lint-staged, `@commitlint/cli`, `@commitlint/config-conventional`.

## Dependencias aprobadas del frontend

next, react, react-dom, tailwindcss, postcss, autoprefixer, daisyui, lucide-react, next-intl, zod, react-hook-form, `@hookform/resolvers`, sonner, `@tanstack/react-query`, `@tanstack/react-virtual`, date-fns, date-fns-tz.

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

- Base actual: `.github/workflows/ci.yml`.
- Jobs típicos planificados: Lint + Format + Build, ShellCheck, Unit Tests, Integration Tests, i18n Key Validation y Migraciones Drizzle contra Neon.
- `migrate.yml` queda diferido a la Fase 1.7. Se dispara cuando cambian `packages/db/src/schema.ts` o `packages/db/drizzle/**` y ejecuta `pnpm turbo db:migrate --filter=@tricking/db` con el secret `DATABASE_URL`.
- Esta decisión puede ajustarse si el usuario lo pide.

## Notas sobre decisiones no aplicables

- Autenticación y correo no aplican en Fase 0. Se registran aquí para que la decisión quede cerrada cuando se activen y para que ninguna iteración futura las trate como pendiente de definición.
- Analítica y cookies son condicionales: solo se activan si el proyecto instala cookies no esenciales o necesita analítica. Mientras no se activen, no se agregan dependencias relacionadas.
