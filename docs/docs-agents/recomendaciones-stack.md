# Recomendaciones de stack

Catálogo de opciones por categoría. Para cada categoría se propone al menos una opción principal y una alternativa, con justificación breve y la nota de cuándo elegir cada una.

Las recomendaciones son una propuesta, no una imposición. El usuario elige. Si no responde, se toma la opción principal por defecto, se registra en `docs/docs-agents/stack-tecnico.md` y se anota que puede ajustarse. Ninguna categoría queda en blanco; las que no aplican todavía se marcan de forma explícita.

## Monorepo

- Opción principal: Turborepo + pnpm workspaces.
- Alternativa: Nx.
- Motivo: Turborepo es más ligero, comparte vendor con Next.js y su curva de aprendizaje es mínima.
- Cuándo elegirla: Turborepo si se busca simplicidad y velocidad de arranque. Nx si el proyecto crece mucho y necesita generadores, plugins y un grafo de dependencias más potente.

## Frontend

- Opción principal: Next.js (App Router) + TypeScript estricto.
- Alternativas: React + Vite, SvelteKit.
- Motivo: el proyecto necesita SEO para los trucos y SSR para las páginas de detalle. Next.js es el estándar de facto.
- Cuándo elegirla: Next.js si hacen falta SEO y SSR. React + Vite si solo se necesita una SPA sin SSR. SvelteKit si se prefiere otro modelo de reactividad.

## Hosting web

- Opción principal: Cloudflare Pages.
- Alternativas: Netlify, Render.
- Motivo: free tier con ancho de banda ilimitado; el límite real es 10 ms de CPU por invocación SSR.
- Cuándo elegirla: Cloudflare Pages si el SSR es liviano y se quiere ancho de banda sin costo. Netlify o Render si se necesita más tiempo de cómputo por invocación o funciones específicas.

## Base de datos

- Opción principal: Neon (PostgreSQL serverless).
- Alternativas: Aiven for PostgreSQL, Xata.
- Motivo: escala a cero, free tier de 0.5 GB e integración nativa con Drizzle.
- Cuándo elegirla: Neon si se quiere PostgreSQL serverless con escala a cero. Aiven o Xata si se necesita una instancia siempre encendida o características administradas adicionales.

## ORM y migraciones

- Opción principal: Drizzle ORM + drizzle-kit.
- Alternativa: Prisma.
- Motivo: Drizzle es tipado, ligero, edge-ready y controla el SQL.
- Cuándo elegirla: Drizzle para control fino del SQL y despliegue edge. Prisma si se prioriza la experiencia de desarrollo y un ORM más pesado (prohibido sin autorización en este repositorio).

## Almacenamiento de vídeos

- Opción principal: Cloudflare R2.
- Alternativa: Backblaze B2.
- Motivo: 10 GB gratis, egress gratuito y API compatible con S3.
- Cuándo elegirla: R2 si el tráfico de salida de los vídeos es alto y se quiere evitar el costo de egress. B2 si se prefiere otra política de precios y almacenamiento.

## Cola y caché

- Opción principal: Upstash Redis + Upstash QStash.
- Alternativas: Redis propio en VPS, Cloudflare Queues.
- Motivo: 500k comandos por mes gratis, serverless e integración por HTTP.
- Cuándo elegirla: Upstash si se quiere serverless y sin administrar infraestructura. Redis propio o Cloudflare Queues si se necesita control total o integración con el ecosistema de Cloudflare.

## Validación

- Opción principal: Zod v4.
- Alternativas: Valibot, TypeBox.
- Motivo: compartido entre frontend y backend, tipado e integración con formularios.
- Cuándo elegirla: Zod si se quiere un esquema único para validación y tipos. Valibot si el tamaño del bundle es crítico. TypeBox si se necesita interoperabilidad con JSON Schema.

## i18n

- Opción principal: next-intl (defaultLocale: `es`).
- Alternativas: i18next, react-intl.
- Motivo: integración nativa con Next.js App Router y Server Components.
- Cuándo elegirla: next-intl si el frontend es Next.js. i18next o react-intl si se necesita un ecosistema más amplio o se usa otro framework.

## UI

- Opción principal: Tailwind CSS + DaisyUI.
- Alternativas: shadcn/ui, Radix UI, Ark UI.
- Motivo: DaisyUI es un plugin de Tailwind, ligero y con temas nativos claro y oscuro.
- Cuándo elegirla: Tailwind + DaisyUI para velocidad y temas listos. Radix o Ark UI si se necesitan primitivas accesibles sin estilos. shadcn/ui está prohibido sin autorización.

## Iconos

- Opción principal: lucide-react.
- Alternativa: no hay alternativa obligatoria; se puede usar cualquier set compatible con React si se autoriza.
- Motivo: consistente con DaisyUI y Tailwind, ligero en tamaño y sencillo de usar.
- Cuándo elegirla: por defecto. Solo se cambia si aparece una necesidad de iconografía específica.

## Estado del servidor

- Opción principal: TanStack Query.
- Alternativa: SWR.
- Motivo: cache, stale-while-revalidate, reintentos e integración con SSR.
- Cuándo elegirla: TanStack Query por su ecosistema y su mecanismo de persistencia. SWR si se busca una API más pequeña.

## Virtualización

- Opción principal: TanStack Virtual.
- Alternativa: react-window.
- Motivo: listados de más de 100 ítems sin penalizar el render.
- Cuándo elegirla: TanStack Virtual si ya se usa TanStack Query. react-window si se necesita otra API o menos dependencias.

## Formularios

- Opción principal: react-hook-form + @hookform/resolvers.
- Alternativa: Formik.
- Motivo: rendimiento, bajo número de renders y buena integración con Zod.
- Cuándo elegirla: react-hook-form por defecto. Formik solo si el equipo ya lo conoce.

## Toasts

- Opción principal: sonner.
- Alternativa: react-hot-toast.
- Motivo: simple, accesible y con buen soporte de temas.
- Cuándo elegirla: sonner por defecto. Otra librería si se necesita una API distinta.

## Fechas

- Opción principal: date-fns + date-fns-tz.
- Alternativa: Day.js.
- Motivo: modular, tipado y con soporte de zonas horarias.
- Cuándo elegirla: date-fns si se prioriza el tamaño por función y el manejo explícito de zonas. Day.js si se prefiere una API tipo Moment.

## Logging

- Opción principal: Pino.
- Alternativas: Winston, consola estructurada de Next.js.
- Motivo: alto rendimiento, formato JSON nativo e integración con cualquier destino.
- Cuándo elegirla: Pino por defecto. Winston si el equipo ya lo usa. La consola de Next.js solo para desarrollo.

## Scraping de Instagram

- Opción principal: insta-fetcher.
- Alternativa: @aduptive/instagram-scraper.
- Motivo: extrae captions, posts y reels con rate limiting controlado.
- Cuándo elegirla: insta-fetcher como respaldo de Instagram para el índice de técnicas de Kojo. La alternativa si la principal deja de funcionar.

## Scraping web general

- Opción principal: cheerio.
- Alternativas: Crawlee, Playwright con headless.
- Motivo: cheerio es ligero para HTML estático; Playwright solo si hace falta renderizar JavaScript.
- Cuándo elegirla: cheerio para HTML estático. Playwright con headless solo si el contenido se renderiza en el cliente. Crawlee si se necesita orquestar crawling a escala.

## Semilla de trucos

- Opción principal: @trickingapi/tricks-core-data + @trickingapi/tricking-ts.
- Alternativa: no aplica una alternativa equivalente; la API de Loopkicks no reemplaza esta semilla.
- Motivo: dataset open source del vocabulario de tricking, sin depender de la API de Loopkicks.
- Cuándo elegirla: siempre como semilla base. Loopkicks es la fuente primaria del contenido y la clasificación, no una alternativa a la semilla.

## Testing

- Opción principal: Vitest + Testing Library + Playwright.
- Alternativas: Jest, Cypress para E2E.
- Motivo: Vitest comparte configuración con Vite y es rápido; Playwright cubre E2E y capturas con viewport móvil.
- Cuándo elegirla: Vitest + Testing Library para unitarias e integración, y Playwright para E2E. Jest si el equipo lo conoce. Cypress como alternativa de E2E.

## Autenticación

- Opción principal: Auth.js (NextAuth) con adaptador de Drizzle y Neon.
- Alternativas: Better Auth, Clerk (gestionado).
- Motivo: no aplica en Fase 0. Se activa cuando se implemente el skill tree y los combos.
- Cuándo elegirla: cuando se active autenticación. Auth.js si se quiere control y adaptador propio. Clerk si se prefiere una solución gestionada.

## CI/CD

- Opción principal: GitHub Actions.
- Alternativas: GitLab CI, CircleCI.
- Motivo: integración directa con GitHub y acciones oficiales versionadas.
- Cuándo elegirla: GitHub Actions por defecto. Las alternativas solo si el repositorio se muda de plataforma.

## Gestión de secretos

- Opción principal: variables de entorno en GitHub Actions y Cloudflare.
- Alternativas: Infisical, Doppler, Vault.
- Motivo: en el arranque no hace falta un gestor externo.
- Cuándo elegirla: variables de entorno simples mientras el equipo es chico. Un gestor externo si el proyecto crece y necesita rotación, auditoría y accesos por entorno.

## Correo

- Opción principal: Resend.
- Alternativas: SendGrid, Nodemailer + SMTP propio.
- Motivo: no aplica en Fase 0. Se activa si se implementa autenticación.
- Cuándo elegirla: cuando se active el envío de correos. Resend si se quiere una API simple. SMTP propio si se necesita control de infraestructura.

## Analítica

- Opción principal: Umami (self-hosted o cloud free tier).
- Alternativas: PostHog, Plausible.
- Motivo: privacy-first, sin cookies de terceros y sin banner adicional si se configura bien.
- Cuándo elegirla: condicional. Se activa con la analítica si el proyecto la necesita. PostHog si se quieren más funciones de producto. Plausible como alternativa simple y privada.

## Cookies y consentimiento

- Opción principal: vanilla-cookieconsent.
- Alternativa: react-cookie-consent.
- Motivo: solo aplica si se instalan cookies no esenciales. Se activa con la analítica.
- Cuándo elegirla: condicional. Solo si el monorepo usa cookies o tecnologías similares no esenciales.
