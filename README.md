# Tricking Monorepo

Monorepo del sitio web de tricking. Reúne tres bloques de contenido:

- Los trucos de Loopkicks (vertical kicks, backward, forward, inside, outside, variations, transitions, stances y la explore page), que son la fuente primaria del contenido y de la clasificación. Se obtienen por scraping y sus vídeos se descargan y se suben a Cloudflare R2.
- Los tutoriales de Kojo's Trick Lab, tutoriales largos que se obtienen por scraping de Instagram con insta-fetcher y, si hace falta, scraping web con cheerio.
- Una sección de tips técnicos sobre mirada y ejecución, contenido propio curado por el usuario y cargado manualmente en la base de datos en la Fase 16.

El sitio tiene i18n con idioma por defecto en español y dos modos de tema (claro y oscuro) que respetan la preferencia del usuario.

## Stack a alto nivel

- Monorepo: Turborepo + pnpm workspaces.
- Frontend: Next.js (App Router) + TypeScript estricto, Tailwind CSS + DaisyUI, next-intl.
- Hosting web: Cloudflare Pages.
- Base de datos: Neon (PostgreSQL serverless) con Drizzle ORM y drizzle-kit.
- Almacenamiento de vídeos: Cloudflare R2.
- Cola y caché: Upstash Redis + Upstash QStash.
- Validación: Zod v4.
- Testing: Vitest + Testing Library + Playwright.
- CI/CD: GitHub Actions.

El detalle cerrado del stack vive en `docs/docs-agents/stack-tecnico.md` y las opciones comparadas en `docs/docs-agents/recomendaciones-stack.md`.

## Estructura del monorepo

```text
tricking-monorepo/
  AGENTS.md
  README.md
  BITACORA.md
  apps/
    web/        Next.js (App Router) + next-intl
    scraper/    Worker de scraping (Node/TS)
  packages/
    db/         Drizzle ORM + schema + migraciones
    ui/         Componentes compartidos
    shared/     Tipos, Zod schemas, utilidades, storage
    config/     tsconfig, eslint, prettier
  docs/
    docs-agents/  Documentación y reglas del agente
  .github/        Templates de PR e issues, workflows de CI
  turbo.json
  pnpm-workspace.yaml
  package.json
```

## Requisitos

- Node.js >= 20.
- pnpm 10.33.4 (la versión está fijada en `packageManager` del `package.json`).

## Comandos disponibles

Se ejecutan desde la raíz del monorepo, en bash de Linux sobre WSL.

- `pnpm install`: instala las dependencias del workspace.
- `pnpm build`: compila todos los paquetes y aplicaciones con Turborepo.
- `pnpm dev`: levanta el entorno de desarrollo.
- `pnpm lint`: ejecuta ESLint.
- `pnpm typecheck`: ejecuta la verificación de tipos con Turborepo.
- `pnpm test`: ejecuta las pruebas con Vitest.
- `pnpm format`: formatea el código con Prettier.

## Documentación

- `AGENTS.md`: fuente única de verdad del monorepo. Cualquier agente debe leerlo completo antes de tocar un archivo.
- `docs/docs-agents/`: reglas del agente por tema, inventario del stack, recomendaciones, fases y decisiones visuales. Ver `docs/docs-agents/fases.md` para el estado del proyecto.
- `BITACORA.md`: registro histórico de trabajo por issue o task.
