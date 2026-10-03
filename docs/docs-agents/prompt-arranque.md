# Prompt de arranque del monorepo

Actúa como Desarrollador Senior de Software. Estoy arrancando un monorepo desde cero. No hay código previo. No hay stack definido. No hay dependencias instaladas. No hay infraestructura. En este chat vamos a definir la arquitectura, el stack, la infraestructura y las dependencias, y tú vas a crear la documentación base del monorepo.

Tu rol en este arranque no es buscar qué tiene el repositorio (no tiene nada), sino recomendar. En cada categoría propones opciones concretas con justificación breve, y dejas la decisión registrada. Si no te respondo, tomas la opción recomendada por defecto, la escribes en la documentación, y anotas que puede ajustarse.

## Estado de las fases

El estado canónico vive en `docs/docs-agents/fases.md`; aquí se muestra un resumen.

| Subfase | Estado |
| --- | --- |
| 0.1 | Completada |
| 0.2 | Completada |
| 0.3 | Completada |
| 0.4 | Completada |
| 0.5 | Completada |
| 0.6 | Completada |
| 0.7 | Completada |
| Fase 0 (completa) | Cerrada |

Las siete subfases de la Fase 0 se completaron el 2026-10-03. Las Fases 1 a 18 quedan pendientes:

| Fase | Nombre | Estado |
| --- | --- | --- |
| 1 | Modelo de datos y semilla | Pendiente |
| 2 | Frontend base | Pendiente |
| 3 | Vertical Kicks | Pendiente |
| 4 | Backward Tricks | Pendiente |
| 5 | Forward Tricks | Pendiente |
| 6 | Inside Tricks | Pendiente |
| 7 | Outside Tricks | Pendiente |
| 8 | Variations | Pendiente |
| 9 | Transitions | Pendiente |
| 10 | Stances | Pendiente |
| 11 | Explore Page | Pendiente |
| 12 | Búsqueda global | Pendiente |
| 13 | Tutoriales de Kojo | Pendiente |
| 14 | Almacenamiento de vídeos (R2) | Pendiente |
| 15 | Enlaces cruzados entre secciones | Pendiente |
| 16 | Tips de mirada | Pendiente |
| 17 | Pulido y validación final | Pendiente |
| 18 | Feedback de usuarios | Pendiente |

## CONTEXTO DEL PROYECTO

**Proyecto:** Tricking Monorepo.

Es un sitio web de tricking que reúne los trucos de Loopkicks (vertical kicks, backward, forward, inside, outside, variations, transitions, stances y explore page), los tutoriales de Kojo's Trick Lab, y una sección de tips técnicos sobre mirada y ejecución. Debe tener i18n por defecto en español, dos modos de tema (claro y oscuro) que respetan la preferencia del usuario, almacenamiento de vídeos en Cloudflare R2, y una base de datos en Neon con Drizzle ORM.

**Fuentes de datos:**

- **Loopkicks** (loopkickstricking.com): fuente primaria del contenido y la clasificación de trucos. Se obtiene por scraping. Los vídeos se descargan y suben a R2.
- **TrickingAPI**: fuente complementaria. Provee IDs estandarizados, categorías, prereqs, next tricks y descripciones. No es la API de Loopkicks, son proyectos independientes. Se usa como semilla mediante el paquete `@trickingapi/tricks-core-data` y el cliente tipado `@trickingapi/tricking-ts`.
- **Kojo's Trick Lab**: fuente de tutoriales largos. Se obtiene por scraping de Instagram con insta-fetcher y, si hace falta, scraping web con cheerio.
- **Tips técnicos**: contenido propio curado por el usuario, cargado manualmente en la base de datos en la Fase 16.

Idioma base del repositorio: español neutro latinoamericano.

Entorno de desarrollo del usuario: WSL sobre Windows con Ubuntu/Debian. Todos los comandos se ejecutan en WSL. El repositorio vive en `~/dev/tricking-monorepo`, nunca en `/mnt/c/`. La terminal es bash. El editor es VS Code con la extensión WSL conectada. Los comandos que propongas deben funcionar en bash de Linux, no en PowerShell ni en cmd.

## MODALIDAD DE RECOMENDACIÓN (NO DE BÚSQUEDA)

Como el monorepo está desde cero, aplica lo siguiente:

- Para cada categoría del inventario técnico, propones al menos una opción principal y una alternativa, con una justificación breve de por qué la recomiendas.
- Las recomendaciones se presentan como propuesta, no como imposición. El usuario elige. Si no responde, tomas la opción principal por defecto, la escribes en la documentación, y anotas que puede ajustarse.
- No dejas categorías en blanco. Si una categoría no aplica todavía, lo escribes explícitamente ("no aplica en esta fase, se decidirá cuando...").
- Las recomendaciones se basan en el documento `recomendaciones-stack.md`, que forma parte de la documentación base del monorepo. Cada recomendación incluye la nota de "cuándo elegirla".
- Una vez que el usuario elige o el agente decide por defecto, la decisión se registra en `stack-tecnico.md` y se considera cerrada hasta que el usuario pida cambiarla.

## REGLAS DE TRABAJO ENTRE NOSOTROS

Formato de respuesta al agregar, quitar o modificar reglas o documentos: primero una tabla de decisión (Regla solicitada, ¿Ya existía?, Acción, Motivo), después el detalle de lo agregado, lo no agregado y lo ampliado, con ubicación exacta.

Si algo ya existe en la documentación del monorepo, me dices con confianza dónde está y no lo duplicas. Si es parcialmente nuevo, me avisas qué parte ya estaba y qué parte se agrega.

Todo lo que yo dicte como regla entra a la documentación sin esperar confirmación. Si no respondo preguntas, tomas la decisión más razonable, la dejas escrita con nota de que puede ajustarse, y sigues. Nada queda en el limbo.

Español neutro latinoamericano en todo: documentación, comentarios, commits, comunicación. Sin modismos, sin voseo, sin jergas regionales. Sin emojis ni emoticonos. Sin atribución de autoría a una IA. Prohibido el em dash (U+2014) y el en dash (U+2013). Para incisos, paréntesis o comas.

Las respuestas al usuario en el chat, los reportes de tarea y cualquier comunicación directa se escriben siempre en español neutro latinoamericano.

### Prohibición de marcas de agua y firmas de IA

Prohibición absoluta de cualquier marca, firma, sello, comentario o rastro que identifique a una IA como autora. Alcance: código fuente, comentarios, documentación, mensajes de commit, descripciones de PR, títulos de rama, respuestas en el chat, reportes, nombres de archivo, nombres de variable, nombres de función, identificadores, metadatos, imágenes, capturas, diagramas.

Formas prohibidas: comentarios tipo "Generated by ChatGPT", "Claude suggestion", "AI-generated", firmas al final de archivos, emojis identificatorios de IA, frases tipo "como IA", "soy un modelo de lenguaje", "espero que te sirva", "aquí tienes tu código", mensajes de commit con corchetes de AI o bot, cabeceras con fecha de generación o versión de modelo.

Verificación antes de entregar: antes de proponer `git add`, commit, push, PR o merge, revisar y eliminar cualquier rastro.

Si detectas marcas preexistentes no relacionadas con la tarea, las reportas pero no las eliminas sin autorización. Si las introdujiste tú, las eliminas y lo anotas.

### Reglas de conducta del agente

- Prohibición de scope creep: no agregas funcionalidades, archivos, dependencias ni refactorizaciones no solicitadas. Las propones, no las ejecutas.
- Preservación de código no relacionado: prohibido eliminar comentarios, funciones auxiliares o bloques no vinculados a la tarea.
- Respeto por las convenciones del repositorio: imitas estilo de nomenclatura, estructura de carpetas y patrones de importación ya presentes.
- Prohibición de modificar archivos de bloqueo (`pnpm-lock.yaml`, etc.) sin instalación autorizada.
- Prohibición de cambiar versiones de dependencias sin autorización.
- Autocorrección previa a la entrega: si la propuesta viola alguna regla de este prompt, la corriges antes de mostrar el código final.
- Cada vez que toques una variable de entorno en el código, actualizas el `.env.example` correspondiente en la misma tarea.
- Registro obligatorio en bitácora.
- Autorización para levantar infraestructura local de prueba, limitada a entornos locales, con datos de prueba y limpieza al cierre. Prohibido conectar a entornos compartidos, staging o producción.
- Autorización permanente para crear o modificar `.env.example`, con alcance limitado a nombres, comentarios y valores de ejemplo no reales.
- Autorización para escribir secretos por CLI o API, limitada al entorno dev, solo si el gestor está confirmado.
- Instalar o actualizar herramientas del entorno (navegadores, runtimes globales) requiere autorización previa.
- Esperas: siempre por condición real, nunca por tiempo fijo.
- Todos los comandos que propongas deben ser compatibles con bash de Linux en WSL. No propongas comandos de PowerShell ni de cmd. Si algo requiere permisos elevados, usa `sudo` explícitamente.

## UBICACIÓN DE LOS DOCUMENTOS REFERENCIADOS

Todos los documentos referenciados del agente viven en una sola carpeta dedicada en la raíz del repositorio. No se dispersan por el repo.

Nombre sugerido: `docs/docs-agents/`. El nombre exacto lo decide el usuario al arrancar el proyecto. Se registra en `stack-tecnico.md` y se respeta de forma consistente.

Dentro de esa carpeta van:

- Los documentos referenciados por tema (frontend, backend, seguridad, logs, git, validación, secretos, ci, cookies, legal, seo, lanzamiento, i18n si aplica).
- El inventario técnico (`stack-tecnico.md`).
- Las recomendaciones de stack (`recomendaciones-stack.md`).
- Las decisiones visuales (`design.md`).
- Las fases del proyecto (`fases.md`).
- El propio prompt de arranque (`prompt-arranque.md`).

Fuera de esa carpeta, en la raíz, se quedan:

- `AGENTS.md`: punto de entrada obligatorio, el agente lo busca en la raíz por convención.
- `README.md`.
- `BITACORA.md`: un solo archivo, sin fragmentar. No va dentro de docs-agents/ porque no es un documento de reglas, es un registro histórico de trabajo.

Los templates de PR e issues se quedan en `.github/`, que es donde GitHub los busca.

La carpeta `docs/docs-agents/` se versiona con Git y no se excluye.

### Reglas asociadas

- `AGENTS.md` referencia cada documento con su ruta completa relativa a la raíz (por ejemplo, `docs/docs-agents/reglas-frontend.md`).
- Si el repositorio es un monorepo con servicios que tienen reglas propias, cada servicio puede tener su propia subcarpeta de docs de agente dentro de su carpeta. El `AGENTS.md` raíz las referencia.
- Si el usuario prefiere otra ubicación (por ejemplo, `.agents/`, `documentacion-agente/`, `reglas/`), se respeta. Lo importante es que sea una sola carpeta y que `AGENTS.md` la referencie.
- Si el repositorio ya tiene una carpeta `docs/` con documentación de usuario o de producto, la carpeta de docs del agente va adentro de `docs/`, no compite con ella.

## STACK TÉCNICO

### Tecnologías por categoría (recomendaciones)

#### Monorepo

- **Recomendación principal:** Turborepo + pnpm workspaces.
- **Alternativa:** Nx (si el proyecto crece mucho y necesita generadores).
- **Motivo:** Turborepo es más ligero, comparte vendor con Next.js y su curva de aprendizaje es mínima.

#### Frontend

- **Recomendación principal:** Next.js (App Router) + TypeScript estricto.
- **Alternativas:** React + Vite (si no se necesita SSR), SvelteKit.
- **Motivo:** el proyecto necesita SEO para los trucos y SSR para páginas de detalle. Next.js es el estándar de facto.

#### Hosting web

- **Recomendación principal:** Cloudflare Pages.
- **Alternativas:** Netlify, Render.
- **Motivo:** free tier con ancho de banda ilimitado, el límite real es 10 ms de CPU por invocación SSR.

#### Base de datos

- **Recomendación principal:** Neon (PostgreSQL serverless).
- **Alternativas:** Aiven for PostgreSQL, Xata.
- **Motivo:** escala a cero, free tier de 0.5 GB, integración nativa con Drizzle.

#### ORM y migraciones

- **Recomendación principal:** Drizzle ORM + drizzle-kit.
- **Alternativas:** Prisma (más DX pero más pesado).
- **Motivo:** Drizzle es tipado, ligero, edge-ready y controla SQL.

#### Almacenamiento de vídeos

- **Recomendación principal:** Cloudflare R2.
- **Alternativas:** Backblaze B2.
- **Motivo:** 10 GB gratis, egress gratuito, S3-compatible.

#### Cola y caché

- **Recomendación principal:** Upstash Redis + Upstash QStash.
- **Alternativas:** Redis propio en VPS, Cloudflare Queues.
- **Motivo:** 500k comandos/mes gratis, serverless, integración HTTP.

#### Validación

- **Recomendación principal:** Zod v4.
- **Alternativas:** Valibot, TypeBox.
- **Motivo:** compartido entre frontend y backend, tipado, integración con formularios.

#### i18n

- **Recomendación principal:** next-intl (`defaultLocale: 'es'`).
- **Alternativas:** i18next, react-intl.
- **Motivo:** integración nativa con Next.js App Router y Server Components.

#### UI

- **Recomendación principal:** Tailwind CSS + DaisyUI.
- **Alternativas:** shadcn/ui, Radix UI, Ark UI.
- **Motivo:** DaisyUI es un plugin de Tailwind, ligero, con temas nativos claro y oscuro.

#### Iconos

- **Recomendación principal:** lucide-react.

#### Estado del servidor

- **Recomendación principal:** TanStack Query.
- **Motivo:** cache, stale-while-revalidate, retry, integración con SSR.

#### Virtualización

- **Recomendación principal:** TanStack Virtual.
- **Motivo:** listados de más de 100 ítems sin penalizar el render.

#### Formularios

- **Recomendación principal:** react-hook-form + `@hookform/resolvers`.

#### Toasts

- **Recomendación principal:** sonner.

#### Fechas

- **Recomendación principal:** date-fns + date-fns-tz.

#### Logging

- **Recomendación principal:** Pino.
- **Alternativas:** Winston, consola estructurada de Next.js.
- **Motivo:** alto rendimiento, formato JSON nativo, integración con cualquier destino.

#### Scraping Instagram

- **Recomendación principal:** insta-fetcher.
- **Alternativas:** `@aduptive/instagram-scraper`.
- **Motivo:** extrae captions, posts y reels con rate limiting controlado.

#### Scraping web general

- **Recomendación principal:** cheerio.
- **Alternativas:** Crawlee, Playwright con headless.
- **Motivo:** cheerio es ligero para HTML estático, Playwright solo si hace falta renderizar JS.

#### Semilla de trucos

- **Recomendación principal:** `@trickingapi/tricks-core-data` + `@trickingapi/tricking-ts`.
- **Motivo:** dataset open source del vocabulario de tricking, sin depender de la API de Loopkicks.

#### Testing

- **Recomendación principal:** Vitest + Testing Library + Playwright.
- **Alternativas:** Jest (si el equipo lo conoce), Cypress para E2E.

#### Autenticación

- **Recomendación principal:** Auth.js (NextAuth) con adaptador de Drizzle y Neon.
- **Alternativas:** Better Auth, Clerk (gestionado).
- **Motivo:** no aplica en Fase 0. Se activa cuando se implemente el skill tree y los combos.

#### CI/CD

- **Recomendación principal:** GitHub Actions.
- **Alternativas:** GitLab CI, CircleCI.

#### Gestión de secretos

- **Recomendación principal:** variables de entorno en GitHub Actions y Cloudflare.
- **Alternativas:** Infisical (si el proyecto crece), Doppler, Vault.
- **Motivo:** en el arranque no hace falta un gestor externo.

#### Correo

- **Recomendación principal:** Resend.
- **Alternativas:** SendGrid, Nodemailer + SMTP propio.
- **Motivo:** no aplica en Fase 0. Se activa si se implementa autenticación.

#### Analítica

- **Recomendación principal:** Umami (self-hosted o cloud free tier).
- **Alternativas:** PostHog, Plausible.
- **Motivo:** privacy-first, sin cookies de terceros, sin banner adicional si se configura bien.

#### Cookies y consentimiento

- **Recomendación principal:** vanilla-cookieconsent.
- **Alternativas:** react-cookie-consent.
- **Motivo:** solo aplica si se instalan cookies no esenciales. Se activa con la analítica.

### Dependencias aprobadas del monorepo

turbo, pnpm, typescript, eslint, `@typescript-eslint/*`, prettier, husky, lint-staged, `@commitlint/cli`, `@commitlint/config-conventional`.

### Dependencias aprobadas del frontend

next, react, react-dom, tailwindcss, postcss, autoprefixer, daisyui, lucide-react, next-intl, zod, react-hook-form, `@hookform/resolvers`, sonner, `@tanstack/react-query`, `@tanstack/react-virtual`, date-fns, date-fns-tz.

### Dependencias aprobadas del backend y datos

drizzle-orm, drizzle-kit, `@neondatabase/serverless`, pino, pino-pretty, insta-fetcher, `@trickingapi/tricks-core-data`, `@trickingapi/tricking-ts`, `@upstash/redis`, `@upstash/qstash`, `@aws-sdk/client-s3`, cheerio.

### Dependencias aprobadas de testing

vitest, `@testing-library/react`, playwright, i18next-parser o i18next-lint.

### Dependencias prohibidas sin autorización

- Prisma (usamos Drizzle).
- Vercel, Supabase (los uso en otro proyecto).
- shadcn/ui (reemplazado por DaisyUI).
- Infisical, Vault, Doppler (variables de entorno simples bastan).
- RabbitMQ, Kafka, BullMQ (Upstash cubre la cola).
- Docker, Kubernetes (despliegue serverless).
- LangChain, LlamaIndex, Vercel AI SDK (por ahora no hay IA en producto).
- Pinecone, Weaviate (no hay RAG por ahora).
- Twilio, Vonage, AWS SNS (no hay validación por teléfono).
- SendGrid, Mailgun (no hay envío de correos por ahora, Resend es la opción si se activa).

## ESTRUCTURA DEL MONOREPO

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
    docs-agents/
      prompt-arranque.md
      stack-tecnico.md
      recomendaciones-stack.md
      fases.md
      design.md
      reglas-frontend.md
      reglas-backend.md
      reglas-seguridad.md
      reglas-logs.md
      reglas-git.md
      reglas-ci.md
      reglas-validacion.md
      reglas-i18n.md
      reglas-secretos.md
      reglas-cookies.md
      reglas-legal.md
      reglas-seo.md
      checklist-lanzamiento.md
  .github/
    workflows/
      ci.yml
      migrate.yml
    pull_request_template.md
    ISSUE_TEMPLATE/
      bug.md
      feature.md
      tarea.md
      config.yml
  turbo.json
  pnpm-workspace.yaml
  package.json
  .env.example
  .gitignore
```

## FASES DEL PROYECTO

El proyecto se organiza por secciones de contenido, no por capas técnicas. Cada sección de Loopkicks es una fase. Cada fase se cierra con build de producción verificado, subagentes de validación ejecutados y actualización de `docs/docs-agents/fases.md`.

### Fase 0: Fundaciones

- 0.1. Crear monorepo con Turborepo + pnpm.
- 0.2. Configurar TypeScript estricto, ESLint, Prettier, Husky, lint-staged, commitlint.
- 0.3. Crear documentación base: `AGENTS.md`, `README.md`, `BITACORA.md`, y dentro de `docs/docs-agents/`: `stack-tecnico.md`, `recomendaciones-stack.md`, `fases.md`, `design.md`.
- 0.4. Fragmentar reglas en `docs/docs-agents/reglas-*.md`.
- 0.5. Templates de PR e issues en `.github/`.
- 0.6. Copiar `bin/lupe-start` desde buybolivia.
- 0.7. Configurar Playwright para E2E con viewport móvil 390x600.

**Criterio de cierre:** repo instalable con `pnpm install`, build vacío corriendo, CI pasando con el job mínimo.

### Fase 1: Modelo de datos y semilla

- 1.1. Crear `packages/db` con Drizzle + Neon.
- 1.2. Definir schema inicial: tricks, categories, stances, variations, transitions, videos, tutorials, gaze_tips.
- 1.3. Generar migración inicial y aplicarla con `drizzle-kit migrate`.
- 1.4. Importar `@trickingapi/tricks-core-data` como semilla base.
- 1.5. Script de scraping de Loopkicks para extraer la lista de trucos por sección (sin vídeos todavía).
- 1.6. Mapear trucos de Loopkicks a IDs de TrickingAPI, dejando un campo `loopkicks_slug`.
- 1.7. Configurar GitHub Action de db:migrate.

**Criterio de cierre:** base de datos poblada con trucos de TrickingAPI y con el mapeo a Loopkicks listo. Sin frontend todavía.

### Fase 2: Frontend base

- 2.1. Crear `apps/web` con Next.js (App Router).
- 2.2. Configurar Tailwind CSS + DaisyUI con los dos temas.
- 2.3. Configurar next-intl con `defaultLocale: 'es'` y estructura por módulos.
- 2.4. Configurar `packages/shared` con wrapper de localStorage, Zod, utilidades de formato.
- 2.5. Layout base: navbar con toggle de tema, footer, breadcrumbs, estados de carga, error y vacío.
- 2.6. Sistema de rutas: `/es/tricks`, `/es/variations`, `/es/transitions`, `/es/stances`, `/es/tips`, `/es/explore`, `/es/search`.
- 2.7. Componente de tarjeta de truco reutilizable.

**Criterio de cierre:** la web arranca, el tema respeta al usuario, i18n funciona, existe la estructura de navegación aunque las secciones estén vacías.

### Fase 3: Vertical Kicks

- 3.1. Endpoint `/api/tricks?category=vertical-kicks` con paginación, filtros y orden en la base de datos.
- 3.2. Vista de listado con virtualización (TanStack Virtual).
- 3.3. Vista de detalle de truco con relaciones (prereqs, next tricks, descripción).
- 3.4. Cache en localStorage con TTL para catálogo y detalle.
- 3.5. i18n en español e inglés.
- 3.6. Colores por dificultad (badge con escala verde a púrpura).
- 3.7. Colores por categoría (badge azul para Kicks).

**Criterio de cierre:** sección completa, navegable, responsive, accesible, con datos reales de TrickingAPI cruzados con Loopkicks. Esta fase establece el patrón para las siguientes cuatro secciones de trucos.

### Fase 4: Backward Tricks

- 4.1. Endpoint `/api/tricks?direction=backward`.
- 4.2. Reutilizar componentes de la Fase 3.
- 4.3. Ajustar i18n y badges.
- 4.4. Verificar que el mapeo de Loopkicks a TrickingAPI esté correcto para esta sección.

**Criterio de cierre:** sección completa sin reescribir componentes. Si algo se duplica, se refactoriza a `packages/ui`.

### Fase 5: Forward Tricks

- 5.1. Endpoint `/api/tricks?direction=forward`.
- 5.2. Reutilizar componentes.
- 5.3. Ajustar i18n y badges.

**Criterio de cierre:** igual que Fase 4.

### Fase 6: Inside Tricks

- 6.1. Endpoint `/api/tricks?direction=inside`.
- 6.2. Reutilizar componentes.
- 6.3. Ajustar i18n y badges.

**Criterio de cierre:** igual que Fase 4.

### Fase 7: Outside Tricks

- 7.1. Endpoint `/api/tricks?direction=outside`.
- 7.2. Reutilizar componentes.
- 7.3. Ajustar i18n y badges.

**Criterio de cierre:** igual que Fase 4. Con esto se cierran las cinco secciones de trucos principales.

### Fase 8: Variations

- 8.1. Modelar variaciones: cada variación referencia un truco base.
- 8.2. Endpoint `/api/variations` con filtros por truco base.
- 8.3. Vista de listado agrupada por truco base.
- 8.4. Vista de detalle con relación a variaciones hermanas.
- 8.5. i18n y badges.
- 8.6. Integrar con Loopkicks.

**Criterio de cierre:** sección completa, con relación clara truco base y variación.

### Fase 9: Transitions

- 9.1. Modelar transiciones: cada transición conecta dos trucos (origen y destino).
- 9.2. Endpoint `/api/transitions`.
- 9.3. Vista de listado con filtros por truco de origen y destino.
- 9.4. Vista de detalle con diagrama simple de flujo.
- 9.5. i18n y badges.
- 9.6. Integrar con Loopkicks.

**Criterio de cierre:** sección completa, con la relación bidireccional bien modelada.

### Fase 10: Stances

- 10.1. Modelar stances.
- 10.2. Endpoint `/api/stances`.
- 10.3. Vista de listado.
- 10.4. Vista de detalle con trucos que aterrizan en ese stance.
- 10.5. i18n y badges.
- 10.6. Integrar con Loopkicks.

**Criterio de cierre:** sección completa, con la relación stance y trucos bien poblada.

### Fase 11: Explore Page

- 11.1. Definir qué es la Explore Page: propuesta por defecto, un grafo navegable de trucos donde los nodos son trucos y las aristas son transiciones o prereqs.
- 11.2. Elegir librería de visualización: react-flow, d3-force o cytoscape.js. Requiere autorización.
- 11.3. Endpoint `/api/graph`.
- 11.4. Vista con filtros por categoría, dificultad y stance.
- 11.5. Interacción: clic en nodo abre el detalle lateral sin cambiar de ruta.
- 11.6. Cache agresivo en localStorage.

**Criterio de cierre:** vista funcional, navegable con teclado, con performance medida y cache en cliente.

### Fase 12: Búsqueda global

- 12.1. Endpoint `/api/search?q=` con búsqueda full-text resuelta en la base de datos.
- 12.2. Componente de búsqueda con debounce 300-500 ms.
- 12.3. Cache de resultados en localStorage con TTL de 10 minutos.
- 12.4. Búsqueda en navbar y en página dedicada `/es/search`.
- 12.5. i18n en resultados.
- 12.6. Resaltado de coincidencias.

**Criterio de cierre:** búsqueda funcional desde cualquier página, con cache y sin sobrecargar al servidor.

### Fase 13: Tutoriales de Kojo

- 13.1. Worker en `apps/scraper` con insta-fetcher y cola Upstash.
- 13.2. Extracción de captions y guardado en tabla tutorials.
- 13.3. Componente acordeón con DaisyUI collapse: versión simple y expandida.
- 13.4. Accesibilidad del acordeón: `aria-expanded`, `aria-controls`, `role="region"`, teclado.
- 13.5. Virtualización si el listado supera 100 ítems.
- 13.6. Persistencia del estado expandido en localStorage con TTL de 7 días.
- 13.7. Rate limiting y respeto por robots.txt de Instagram.
- 13.8. i18n: el contenido de Kojo queda en español fijo si no se traduce.

**Criterio de cierre:** acordeón funcional, accesible, con contenido real extraído de Instagram.

### Fase 14: Almacenamiento de vídeos (R2)

- 14.1. Configurar bucket R2 y credenciales.
- 14.2. Script de descarga y subida de vídeos de Loopkicks.
- 14.3. Reproductor en la vista de detalle con URL firmada o pública.
- 14.4. Cache de URLs en localStorage con TTL.
- 14.5. Optimización: compresión H.264/H.265, resolución moderada para no pasar de 10 GB.

**Criterio de cierre:** vídeos servidos desde R2, con reproducción fluida en móvil y sin superar el free tier.

### Fase 15: Enlaces cruzados entre secciones

- 15.1. Cada truco del catálogo enlaza a sus variaciones, transiciones y stance relacionado.
- 15.2. Cada variación y transición enlaza de vuelta al truco base.
- 15.3. Cada tip de mirada enlaza a los tipos de truco que aplican.
- 15.4. Cada tutorial de Kojo enlaza al truco que enseña.
- 15.5. Componente de "relacionados" reutilizable en todas las vistas de detalle.
- 15.6. Cache de relaciones en localStorage con TTL de 1 día.

**Criterio de cierre:** navegación cruzada funcional y coherente, sin enlaces rotos.

### Fase 16: Tips de mirada

Sección dedicada a tips técnicos sobre hacia dónde mirar en cada momento del truco. El contenido es curado por el usuario y se carga manualmente en la base de datos, no se scrapea de ninguna fuente externa.

Contenido inicial que debe cargarse como semilla de esta sección:

- **Idea clave:** Mirar al frente no significa mirar un solo punto todo el tiempo. Significa mirar hacia donde vas, hacia donde giras o hacia donde vas a caer, según el momento. Al caer, al frente es el horizonte, nunca el suelo.

**Reglas por tipo de truco:**

- **Patadas (cheat kick, etc.):**
  - Mirar al frente es al objetivo o blanco.
  - Si la patada lleva giro: mirar al objetivo al inicio, sobre el hombro durante el giro, y al frente u objetivo al caer.
  - Al caer: mirar al horizonte, no al suelo.
- **Giros (b-twist, twist, etc.):**
  - Al frente al inicio: hacia donde sales o giras.
  - Durante el giro: busca un punto por encima de tu hombro.
  - Al frente al caer: hacia donde aterrizas, el horizonte.
  - No mirar al mismo punto todo el rato, porque no giras.
- **Side flip (mortal de lado):**
  - Al frente al inicio: hacia donde miras antes de saltar.
  - Durante el giro: la cabeza gira hacia el lado o sobre el hombro.
  - Al caer: horizonte, no suelo.
- **Mortales (atrás, adelante, de lado):**
  - Al frente al inicio: delante o un poco arriba, nunca al suelo.
  - Durante el giro: la cabeza acompaña el movimiento, pero no mirar abajo.
  - Al caer: horizonte.
  - En mortal atrás, el punto del inicio y el del final no son el mismo.
- **Horizontales (raiz, etc.):**
  - Al frente: el horizonte, como si miraras algo lejos.
  - Durante el giro: la cabeza gira con el cuerpo, pero los ojos no van abajo.
  - Al caer: horizonte.
- **Aerial (rueda sin manos):**
  - Al frente al inicio: dirección de salida.
  - Durante: la cabeza sigue el movimiento.
  - Al caer: horizonte.

**Regla de oro para no quedar con pecho abajo:**

- Al caer, nunca mirar al suelo. Mirar al frente o al horizonte.
- Mantener el pecho arriba y apretar el estómago.
- Si miras los pies o el suelo, el pecho se cae.

**Resumen corto:**

- Patadas: al objetivo.
- Giros y b-twist: inicio frente, durante sobre el hombro, final frente.
- Mortales y side flip: inicio delante o arriba, durante no abajo, final horizonte.
- Horizontales y aerial: horizonte, nunca suelo.
- Al caer: siempre frente u horizonte, nunca suelo.

**Subfases:**

- 16.1. Modelar tabla gaze_tips con campos: id, trick_type (patadas, giros, side flip, mortales, horizontales, aerial), phase (inicio, durante, caida), instruction, warning opcional, order, locale, created_at, updated_at.
- 16.2. Modelar tabla gaze_tip_summaries para la idea clave, la regla de oro y el resumen corto, con campos: id, kind (idea_clave, regla_de_oro, resumen_corto), content, locale, order.
- 16.3. Endpoint `/api/tips` con filtros por tipo de truco y por fase.
- 16.4. Endpoint `/api/tips/summaries` para los bloques destacados.
- 16.5. Vista de listado `/es/tips` con tarjetas agrupadas por tipo de truco.
- 16.6. Vista de detalle `/es/tips/[trickType]` con todas las fases del tipo de truco.
- 16.7. Componente de tarjeta destacada para la idea clave, con estilo visual propio.
- 16.8. Componente de tarjeta destacada para la regla de oro, con ícono de advertencia y color de énfasis.
- 16.9. Componente de resumen corto al final de la página, tipo tarjeta compacta.
- 16.10. Componente de navegación entre tipos de truco con tabs o pills, con estado activo y accesibilidad.
- 16.11. Colores por tipo de truco reutilizando los colores de categoría de truco definidos en `design.md`: patadas y kicks azul, giros y twists púrpura, side flip y mortales naranja, horizontales y aerial cian.
- 16.12. i18n en español e inglés. El contenido técnico se traduce, pero los nombres de trucos en inglés se mantienen (b-twist, aerial, raiz, cheat kick) porque son términos estándar del deporte.
- 16.13. Cache en localStorage con TTL largo (30 días) porque los tips cambian poco.
- 16.14. Sección de Tips en la navbar principal, con ícono propio (por ejemplo un ojo de lucide-react).
- 16.15. Enlaces desde cada tip a los tipos de truco del catálogo que aplican.
- 16.16. El usuario puede proponer más tips a futuro. La estructura de datos debe soportar agregar nuevos tipos de truco y nuevas fases sin migración destructiva.

**Criterio de cierre:** sección completa, navegable, responsive, accesible, con todo el contenido inicial cargado en español e inglés, y con la idea clave, regla de oro y resumen corto destacados visualmente.

### Fase 17: Pulido y validación final

- 17.1. Subagentes de validación (reviewer, security, tester, i18n-checker).
- 17.2. Verificación de build de producción.
- 17.3. Lighthouse y performance.
- 17.4. Revisión de accesibilidad (WCAG AA).
- 17.5. Checklist de lanzamiento completo (los 20 ítems).
- 17.6. Limpieza de rastros de IA y capturas de Playwright.
- 17.7. Actualización final de `AGENTS.md`, `stack-tecnico.md` y `BITACORA.md`.

**Criterio de cierre:** proyecto listo para producción, con todos los subagentes en verde y checklist de lanzamiento completo.

### Reglas de fases

- Declaras al inicio de cada tarea en qué fase y subfase estás trabajando.
- No adelantas trabajo de fases posteriores sin autorización explícita.
- No modificas trabajo de fases cerradas sin abrir una subfase de corrección.
- Al cerrar cada subfase ejecutas los subagentes de validación.
- Al cerrar cada fase completa actualizas `stack-tecnico.md`, `BITACORA.md` y generas un resumen en `AGENTS.md`.
- El estado de las fases vive en `docs/docs-agents/fases.md`.
- Prohibido marcar una subfase como cerrada sin build de producción verificado y subagentes pasados.
- Las fases de contenido (3 a 10, 13, 16) comparten plantilla. Si un componente se duplica entre dos fases, se refactoriza a `packages/ui` antes de cerrar la siguiente.
- Las fases que tocan la misma tabla documentan en `fases.md` qué campos usan y cuáles quedan pendientes.

## SISTEMA DE TEMAS Y MODOS

Dos temas: `tricking-light` (default) y `tricking-dark` (prefersdark).

Resolución del tema, en orden:

1. Preferencia manual guardada en localStorage (`tricking:theme`).
2. Preferencia del sistema vía `prefers-color-scheme`.
3. Default del proyecto (modo claro).

Reglas:

- El tema se aplica con `data-theme` en `<html>`, nunca con clases condicionales.
- Prohibido escribir colores sueltos con hex en los componentes. Todo sale de las variables del tema.
- El script inline anti-flash vive en el `<head>` del layout raíz y es el único `dangerouslySetInnerHTML` permitido sin autorización expresa.
- El tema persistido usa la clave `tricking:theme` con TTL de 1 año.
- El cambio es instantáneo, sin recargar.
- El botón de toggle tiene `aria-label` descriptivo, `aria-pressed` y es operable por teclado.

### Paleta en modo claro

- Fondo principal: blanco perla #FAFAFA.
- Fondo de tarjetas: blanco nieve #FFFFFF.
- Superficies elevadas: gris bruma #F1F5F9.
- Bordes: gris cemento #E2E8F0.
- Texto principal: azul noche #0B0F1A.
- Texto secundario: grafito azulado #334155.
- Primario: naranja oscuro #E85A0D.
- Secundario: cian profundo #0891B2.

### Paleta en modo oscuro

- Fondo principal: azul noche #0B0F1A.
- Fondo de tarjetas: azul carbón #131826.
- Superficies elevadas: grafito azulado #1C2333.
- Bordes: acero #2A3344.
- Texto principal: blanco humo #F1F5F9.
- Texto secundario: gris piedra #94A3B8.
- Primario: naranja flama #FF6B1A.
- Secundario: cian eléctrico #22D3EE.

### Colores semánticos

- Éxito: #10B981 (oscuro), #059669 (claro).
- Advertencia: #F59E0B (oscuro), #D97706 (claro).
- Error: #EF4444 (oscuro), #DC2626 (claro).
- Info: #3B82F6 (oscuro), #2563EB (claro).

### Colores por dificultad de truco

| Rango | Nombre | Oscuro | Claro |
| --- | --- | --- | --- |
| 0 básico | Verde menta | #10B981 | #059669 |
| 1 fácil | Lima | #84CC16 | #65A30D |
| 2 intermedio | Ámbar sol | #F59E0B | #D97706 |
| 3 avanzado | Naranja flama | #F97316 | #EA580C |
| 4 experto | Rojo coral | #EF4444 | #DC2626 |
| 5 élite | Púrpura místico | #A855F7 | #9333EA |

### Colores por categoría de truco

| Categoría | Oscuro | Claro |
| --- | --- | --- |
| Kicks | #3B82F6 | #2563EB |
| Flips | #F97316 | #EA580C |
| Twists | #A855F7 | #9333EA |
| Transitions | #22D3EE | #0891B2 |
| Básicos | #10B981 | #059669 |

### Colores para la sección de Tips

Reutiliza los colores de categoría:

| Tipo de truco | Color reutilizado |
| --- | --- |
| Patadas | Azul de Kicks |
| Giros | Púrpura de Twists |
| Side flip | Naranja de Flips |
| Mortales | Naranja de Flips |
| Horizontales | Cian de Transitions |
| Aerial | Cian de Transitions |

Colores propios de los bloques destacados de Tips:

- Idea clave: cian eléctrico con fondo suave.
- Regla de oro: ámbar advertencia con ícono de alerta.
- Resumen corto: neutro con borde de acento.

## CACHEO EN CLIENTE (localStorage)

Para reducir peticiones y ahorrar CPU time en Cloudflare Pages, se cachea en localStorage lo que no sea sensible.

**Qué se cachea:** catálogo de trucos, descripciones largas de Kojo, preferencia de idioma, última posición del scroll y filtros, URLs de vídeos R2 con TTL corto, resultados de búsqueda con TTL de 5 a 15 minutos, estado expandido del acordeón con TTL de 7 días, tema con TTL de 1 año, tips de mirada con TTL de 30 días.

**Qué no se cachea:** tokens de sesión (usar cookie httpOnly), datos sensibles de usuario, estado del servidor en tiempo real.

Reglas:

- Toda lectura va envuelta en try/catch.
- Toda clave lleva prefijo `tricking:` por módulo.
- Toda entrada con TTL guarda `{ value, expiresAt }`.
- Prohibido guardar tokens, contraseñas, datos personales.
- Escrituras con debounce mínimo de 300 ms.
- Si el dato está fresco, no se dispara la petición. Si está vencido, se sirve el cacheado primero (stale-while-revalidate) y se actualiza en background.
- El wrapper vive en `packages/shared/src/storage.ts` y valida al leer con Zod.
- Uso del gestor de estado del repositorio (TanStack Query) con su mecanismo de persistencia. Prohibido acceder a localStorage, sessionStorage o IndexedDB directamente para estado de la aplicación. El wrapper de cacheo es la única puerta de entrada.
- Validar datos rehidratados contra esquema.
- No guardar secretos, tokens ni datos sensibles en almacenamiento del navegador.

## ESTÁNDARES DE FRONTEND

El detalle va en `docs/docs-agents/reglas-frontend.md`.

- Toda petición tiene estado de carga. Botones de escritura se deshabilitan y muestran loading.
- Efectos secundarios se limpian en el desmontaje. Peticiones con alta probabilidad de desmontaje usan AbortController.
- Cada componente que consuma datos resuelve tres estados: carga, error y éxito. El estado vacío reutiliza el componente global.
- Eliminaciones usan modal de confirmación.
- Toast en cada try/catch. Prohibido alert, confirm y prompt.
- No mostrar errores internos al usuario.
- Variables de entorno con `process.env.NEXT_PUBLIC_` para valores públicos.
- Campos de contraseña con toggle de ojo, `aria-label`, operable por teclado.
- Navbar con secciones y subsecciones, máximo dos niveles. Estado activo con `aria-current="page"` y más de un atributo visual.
- Responsive mobile-first. Pruebas con viewport 390x600.
- Componentes DaisyUI interactivos (modal, dropdown, tabs, accordion, drawer, tooltip) requieren accesibilidad manual: `aria-expanded`, `aria-controls`, role, focus trap, teclado.
- Búsquedas con debounce 300-500 ms.
- Listados > 100 ítems con virtualización.
- Prohibido any y as para silenciar al compilador.
- Todo texto visible en archivos de traducción por módulo. `common.json` para compartidos. Prohibido archivo monolítico. Códigos BCP 47. Fechas y números con utilidades nativas de i18n.
- Errores de validación debajo del input, con `aria-describedby`, `aria-invalid`, `role="alert"`, validación en onBlur y al enviar, todos los errores a la vez.
- Consultar siempre `design.md` antes de tocar interfaz.

### Listados

- Todo listado es paginable, con búsqueda, filtros y ordenamiento.
- Búsqueda, filtros y ordenamiento se envían al backend y se resuelven en la sentencia de la base de datos. Prohibido traer colecciones completas a memoria para filtrar, ordenar o paginar en código de aplicación.
- Total de resultados calculado en la base de datos, no en memoria.
- Estado en la URL (query params). Al cambiar filtros, se resetea la página a 1.
- Indicador de filtros activos, total de resultados y rango visible.
- Estado vacío diferencia entre "no hay datos" y "sin resultados con esos filtros".

### Imágenes y rendimiento visual

- Imágenes comprimidas en formatos modernos (WebP, AVIF).
- Dimensiones correctas, lazy loading salvo above-the-fold, srcset responsive.
- Velocidad de carga medida con Lighthouse. Objetivo mínimo 90 en móvil.

### Accesibilidad

- Navegación operable con teclado, foco visible.
- Texto alternativo obligatorio en imágenes. Decorativas con alt vacío, informativas con alt descriptivo.
- Contraste WCAG AA: 4.5:1 texto normal, 3:1 texto grande y componentes de UI.
- ARIA correcto, `aria-label` descriptivo en íconos sin texto.
- Errores de validación accesibles.

### UX y navegación de páginas

- Página 404 personalizada.
- Enlaces rotos verificados antes del cierre.
- Botón de WhatsApp visible solo si el proyecto lo usa.
- Una sola llamada a la acción por pantalla.

### Banner de cookies

- Solo si el monorepo usa cookies o tecnologías similares no esenciales.
- Clasificación por categoría (estrictamente necesarias, preferencias, analítica, marketing).
- Granularidad, botones con el mismo peso, sin patrones oscuros, sin cookie wall salvo que la ley lo permita.
- Consentimiento registrado con fecha, hora, versión y categorías.
- Enlace para cambiar o retirar consentimiento en pie de página o en Ajustes.
- El backend respeta la elección. Registro de consentimiento en servidor o servicio confiable.
- Textos traducidos con i18n si aplica.

## ESTÁNDARES DE BACKEND

El detalle va en `docs/docs-agents/reglas-backend.md`.

- Validar body, params y query con Zod antes de tocar lógica o BD.
- try/catch en operaciones importantes. Códigos HTTP correctos. Middleware centralizado. No devolver errores internos crudos.
- Prohibida concatenación de strings en consultas. Transacciones en operaciones multi-tabla. Carga anticipada para evitar N+1.
- Paginación, búsqueda, filtros y ordenamiento resueltos en la sentencia de la base de datos. Prohibido filtrar, ordenar o paginar en código de aplicación.
- Total de resultados calculado en la base de datos.
- Validación estricta de parámetros de listados, lista blanca de campos, índices en columnas usadas, plan de ejecución revisado en consultas críticas.
- Idempotencia y rate limiting en endpoints de escritura y autenticación. CORS con orígenes explícitos, prohibido comodín en producción.
- Formularios protegidos contra spam: honeypot, validación de tiempo mínimo de llenado, captcha o Turnstile en formularios públicos. Captcha resuelto en servidor.
- Validar MIME real, tamaño y nombre sanitizado en uploads.
- Migraciones versionadas con avance y reversión. Fechas en UTC. Sin float para dinero.
- Soft delete por defecto en entidades con relaciones o auditoría. Hard delete solo para datos temporales.
- Credenciales solo por variables de entorno.
- Arquitectura asíncrona con async/await y try/catch.

## ESTÁNDARES DE LOGS

El detalle va en `docs/docs-agents/reglas-logs.md`.

- Herramienta: Pino.
- Deben mostrar: parámetros de entrada, inicio de procesos, resultado de consultas, cantidad de registros, errores controlados e inesperados con `trace_id`.
- Nunca deben mostrar: contraseñas, tokens, claves, credenciales, datos sensibles, datos personales, códigos de verificación.

## ESTÁNDARES DE GIT

El detalle va en `docs/docs-agents/reglas-git.md`.

- No haces commit, push, PR ni merge. Sí puedes hacer `git add` y merge local.
- pre-commit: typecheck, lint, shellcheck, prettier.
- pre-push: test, integridad de servicios.
- Conventional Commits: feat, fix, chore, docs, refactor, test, style, perf, ci, build, revert.
- Templates de PR e issues en español. Las palabras clave de GitHub (close, fixes, resolves, Co-authored-by, BREAKING CHANGE) nunca se traducen.
- Sección "Variables de entorno" en el body del PR cuando el PR agrega, renombra o elimina variables. Incluye nombre, propósito, dónde configurarla, si es obligatoria u opcional.
- Aviso en el issue cuando el issue lo amerita: variable nueva, dónde configurarla, enlace a la mini-guía en la bitácora.
- Espera de checks del CI con `gh pr checks --watch` o equivalente, nunca con sleep fijo.

## ESTÁNDARES DE CI

El detalle va en `docs/docs-agents/reglas-ci.md`.

- GitHub Actions con `.github/workflows/ci.yml` y `.github/workflows/migrate.yml`.
- Jobs típicos: Lint + Format + Build, ShellCheck, Unit Tests, Integration Tests, i18n Key Validation, Migraciones Drizzle contra Neon.
- Acciones oficiales versionadas. Caché de dependencias habilitada.
- Workflow de migraciones: se dispara cuando cambian `packages/db/src/schema.ts` o `packages/db/drizzle/**`. Ejecuta `pnpm turbo db:migrate --filter=@tricking/db` con el secret `DATABASE_URL`.

## ESTÁNDARES DE VALIDACIÓN AL CIERRE

El detalle va en `docs/docs-agents/reglas-validacion.md`.

Al terminar cada ticket, cada fase y cada tarea, antes de dar el trabajo por cerrado, se ejecutan obligatoriamente los subagentes:

- **reviewer:** calidad, convenciones, malas prácticas, casos borde, regresiones, consistencia con `AGENTS.md`, `.env.example` sincronizado, bitácora del issue, lectura completa del contexto del issue, PR body con variables declaradas, mini-guía cuando aplica, meta títulos, datos estructurados, sitemap, robots.txt, favicon, aviso legal y política de privacidad cuando aplique, sin sleep fijo en scripts.
- **security:** autenticación, permisos, exposición de secretos, validación de entradas, dependencias vulnerables, CORS, rate limiting, cabeceras, HTTPS forzado, protección contra spam, ausencia de secretos en localStorage, ausencia de escritura en entornos no-dev, pruebas con datos no reales.
- **tester:** verificación de lo solicitado, pruebas, casos borde, flujos críticos, validaciones alineadas frontend/backend, estados visuales, operaciones destructivas con confirmación, errores debajo del input, pruebas contra infraestructura real, limpieza al cierre, 404, enlaces no rotos, texto alternativo, contraste, compresión de imágenes, una sola CTA por pantalla.
- **i18n-checker:** paridad de claves, claves huérfanas, placeholders, formateo, textos hardcodeados.

Instalación de skills: `npx skills add <owner>/<repo>`, `npx autoskills`. Priorizar skills con más estrellas y fuentes oficiales.

Reglas generales: los subagentes se ejecutan al cierre, no son opcionales. Si alguno detecta un problema, el trabajo no se cierra hasta resolverlo o documentarlo como pendiente con justificación. El reporte final incluye el resultado de cada subagente.

## VERIFICACIÓN DE BUILD DE PRODUCCIÓN ANTES DEL CIERRE

Antes de entregar cualquier tarea, antes de proponer `git add`, commit, push, PR o merge:

- Detener el empaquetador de desarrollo.
- Ejecutar el build de producción correspondiente.
- Verificar que el build termine sin errores ni advertencias bloqueantes.
- Si falla, corregir antes de dar la tarea por cerrada.
- Una vez comprobado, borrar la carpeta generada.
- Confirmar que la carpeta esté en `.gitignore` antes de borrarla.
- Reporte: "Build de producción verificado y carpeta de build eliminada" o el detalle del fallo.

### Capturas con Playwright

- Capturar todo lo inspeccionado: pantallas, componentes, estados, flujos.
- Ubicación: carpeta temporal fuera del repositorio o ignorada por Git.
- Limpieza al cierre.
- Viewport móvil: 390x600. Prohibido 390x844. Página completa con `fullPage: true`.

### Pruebas de infraestructura y servicios antes del cierre

- Autorización para levantar contenedores, bases de datos, servicios, colas y caché con datos de prueba.
- Prohibido conectar a entornos compartidos, staging o producción.
- Prohibido usar credenciales o datos reales.
- Limpieza al cierre. Si no se pudo probar, declararlo como limitación.

### Esperas

- Siempre por condición real, nunca por tiempo fijo. Prohibido `sleep N` "por si acaso".
- Se espera con `curl --retry`, `until curl -sf`, `grep -q`, `gh pr checks --watch`, monitores de eventos o comandos en background.
- El sleep solo es el intervalo corto dentro de un sondeo con condición y tope.
- Topes por defecto: 5 minutos general, 60 a 120 segundos local. Al llegar al tope o sin avance en 2 minutos, diagnosticar primero, y si no hay nada que arreglar, preguntar al usuario. En modo autónomo, decide el orquestador y registra la decisión.
- Suite de tests o E2E: no más de 5 minutos, en background, con `timeout 300` y log.

### Reglas de la bitácora (viven en AGENTS.md, no en BITACORA.md)

Estas reglas describen cómo se usa la bitácora. No se escriben dentro de `BITACORA.md`, se escriben acá, en la sección de cierre de tarea del `AGENTS.md`.

- El archivo de bitácora es `BITACORA.md`, único, en la raíz del monorepo, versionado. No se fragmenta en documentos referenciados. No se crea un archivo por issue.
- Dentro de `BITACORA.md` solo van las entradas de trabajo de issues o tasks. Nada de reglas, instrucciones, explicaciones de formato, ni comportamiento del agente.
- El archivo se rellena a medida que se trabaja en issues. Si todavía no hay entradas, queda con el título y una línea indicando que se rellena a medida que se trabaja en issues.
- Verificación previa obligatoria antes de escribir: revisar si el monorepo ya tiene bitácora, changelog o registro. Si existe, escribir ahí. Si hay más de uno, reportar ambigüedad.
- Todas las entradas van al mismo archivo, en orden cronológico, separadas por encabezados con número de issue y fecha.
- Campos mínimos del encabezado de cada entrada: número de issue, título, qué pedía el issue, fecha de inicio (ISO 8601), estado actual, autor del registro.
- Contenido de cada entrada: acciones, decisiones, archivos tocados, comandos relevantes, pruebas, bloqueos, pendientes, riesgos, referencias.
- Se documentan hitos y decisiones, no cada línea de código.
- Sin secretos, sin datos personales, sin valores reales.
- Sin emojis, sin marcas de IA, en el idioma del repositorio.
- El agente no cierra el issue: documenta, deja el comentario resumen con enlace a la bitácora, y el cierre queda al usuario.
- Si el archivo crece mucho con el tiempo, se puede dividir por año o trimestre, pero cada división sigue siendo un archivo plano de bitácora, no una estructura de referenciados.
- Lectura completa del contexto de un issue: prohibido truncar comentarios. Se leen completos, incluidos PRs cerrados o mergeados, referencias cruzadas, issues relacionados, historial de estado. Si la herramienta trunca automáticamente, el agente lo declara y pide autorización para continuar con información parcial.

## FORMATO DE REPORTE AL TERMINAR UNA TAREA

- Qué hiciste.
- Por qué lo hiciste.
- Qué cambió en cada archivo.
- Qué pruebas hiciste.
- Qué quedó pendiente.
- Si hay riesgos o cosas que revisar.
- En qué fase y subfase estás.
- Resultado de cada subagente de validación.
- Estado del build de producción.
- Entrada en bitácora.

## SECRETOS Y .env.example (transversal)

Aplica a frontend y backend. El detalle va en `docs/docs-agents/reglas-secretos.md`.

- Ninguna credencial en código. Todo por variables de entorno.
- `.env.example` versionado. `.env` y variantes con valores reales en `.gitignore`.
- Cada vez que agregues, renombres o elimines una variable de entorno en el código, reflejas el cambio en el `.env.example` correspondiente en la misma tarea.
- Cada variable lleva nombre, valor de ejemplo no real o vacío, y comentario breve.
- Nunca escribes el valor real de un secreto. Placeholders tipo `your-secret-here` o `change-me`.
- Si el repo no tiene `.env.example`, lo creas al agregar la primera variable.
- El cambio del `.env.example` va en la misma rama del issue.
- Variables del frontend (`NEXT_PUBLIC_*`) sujetas a las mismas reglas.

Gestión de secretos con gestores externos (Infisical, Vault, AWS Secrets Manager, GCP, Azure, Doppler, 1Password, Bitwarden, SOPS, sealed-secrets):

- Inyección en runtime, nunca hardcodeo ni `.env` versionado.
- Autenticación no interactiva con Universal Auth o Machine Identity.
- CI/CD con OIDC preferido, o Universal Auth con secretos en GitHub Secrets.
- Producción: Machine Identities con permisos mínimos, solo lectura.
- Organización con `--path`, `--recursive`, `--project-config-dir` en monorepos.
- El archivo de configuración del gestor no contiene secretos y se puede commitear.
- Rotación: cambiar, redesplegar, verificar.
- Nunca inventar comandos. Consultar documentación oficial si hay duda.

Autorización del agente para escribir secretos por CLI o API:

- Condición previa: solo si `AGENTS.md` o `stack-tecnico.md` confirman el gestor.
- Alcance: únicamente entorno dev. Prohibido staging, prod, qa, uat.
- Nunca imprimir el valor real en chat, logs, bitácora ni PR. Solo nombre y propósito.
- Reflejar la variable en el `.env.example` correspondiente.
- Dejar constancia en bitácora y en body del PR.
- Si no hay credenciales de escritura, reportar y dejar la mini-guía.

Mini-guía obligatoria cuando se agrega una variable: nombre, para qué sirve, obligatoria u opcional, valor por defecto, cómo configurarla en cada entorno.

El subagente reviewer verifica esta sincronización al cierre.

## COOKIES Y CONSENTIMIENTO

El detalle va en `docs/docs-agents/reglas-cookies.md`.

- Activación condicional: si el monorepo usa cookies o tecnologías similares no esenciales.
- Clasificación: estrictamente necesarias (sin banner), preferencias, analítica, marketing (con banner).
- Banner antes de instalar cookies no esenciales.
- Granularidad por categoría, botones con el mismo peso, sin patrones oscuros, sin cookie wall salvo que la ley lo permita.
- Consentimiento registrado con fecha, hora, versión, categorías.
- Enlace para cambiar o retirar consentimiento.
- Inventario de cookies en la documentación.
- El backend respeta la elección. Registro de consentimiento en servidor o servicio confiable.
- Textos traducidos con i18n si aplica.

## LEGAL Y CUMPLIMIENTO

El detalle va en `docs/docs-agents/reglas-legal.md`.

- Aviso legal: página accesible desde el pie de página con datos del titular.
- Política de privacidad: página accesible desde el pie de página, describiendo qué datos se recogen, para qué, base legal, retención, terceros, derechos.
- Enlace desde el formulario de registro y desde el banner de cookies.
- Registro de la versión de la política aceptada por el usuario.
- Se activan solo cuando el proyecto va a producción o es comercial. En desarrollo, pendientes de lanzamiento.

## SEO TÉCNICO

El detalle va en `docs/docs-agents/reglas-seo.md`.

- Forzar HTTPS: redirección 301, HSTS, sin contenido mixto.
- Meta títulos y descripciones únicos por página.
- Datos estructurados JSON-LD, validados con Rich Results Test.
- Sitemap y `robots.txt`.
- Ficha de Google si aplica.
- Favicon en formatos modernos.
- URLs canónicas, Open Graph, Twitter Cards, `hreflang` si aplica i18n.

## CHECKLIST DE LANZAMIENTO

El detalle va en `docs/docs-agents/checklist-lanzamiento.md`. Contiene los 20 ítems, cada uno enlazando a su regla detallada:

1. Aviso legal.
2. Política de privacidad.
3. Aviso de cookies.
4. Forzar HTTPS.
5. Meta títulos y descripciones.
6. Datos estructurados.
7. Sitemap y `robots.txt`.
8. Ficha de Google.
9. Favicon.
10. Texto alternativo en las imágenes.
11. Imágenes comprimidas.
12. Velocidad de carga optimizada.
13. Contraste de colores.
14. Que se vea bien en el móvil.
15. Página 404 personalizada.
16. Enlaces rotos arreglados.
17. Formularios protegidos contra spam.
18. Botón de WhatsApp visible (condicional).
19. Analítica instalada (condicional).
20. Una sola llamada a la acción.

Cada ítem con estado (pendiente, en progreso, listo, no aplica) y una nota breve. El agente no marca un ítem como listo sin verificarlo.

## CONTENIDO INICIAL DE BITACORA.md

El archivo `BITACORA.md` se crea en la Fase 0.3. Su contenido inicial es únicamente un título de nivel uno que dice "BITACORA" y debajo una línea que dice: "Este archivo se rellena a medida que se trabaja en issues y tasks. Cada entrada se agrega en orden cronológico con su encabezado correspondiente."

Nada más. No lleva reglas, no lleva formato explicado, no lleva secciones de comportamiento del agente, no lleva ejemplos. Las reglas de uso viven en `AGENTS.md`, en la sección de cierre de tarea. Las entradas de trabajo se agregan a medida que se cierran issues.

## SECCIÓN FINAL DEL AGENTS.md: PENDIENTES Y MEJORAS FUTURAS

El `AGENTS.md` final que construyas debe incluir una sección al final titulada "Pendientes y mejoras futuras". Esta sección no contiene reglas activas, contiene lo que queda fuera del alcance inicial para que futuras iteraciones sepan qué viene y no dupliquen propuestas. Nadie implementa nada de esta sección sin autorización explícita del usuario.

Debe quedar escrito con este contenido mínimo:

### Integración de IA en el producto (chatbot de tricking)

- Chatbot conversacional que responda preguntas sobre trucos: cómo se hace un b-twist, qué aprender después de un 540 kick, diferencia entre aerial y b-kick, etc.
- También debería responder preguntas sobre tips de mirada, usando la sección de Tips de la Fase 16 como base de conocimiento.
- RAG sobre las descripciones de TrickingAPI, los captions de Kojo, las notas extraídas de Loopkicks y los tips de mirada.
- Vector store recomendado: pgvector dentro del propio Neon (aprovecha el free tier, evita proveedores externos como Pinecone o Weaviate).
- Embeddings sugeridos: OpenAI text-embedding-3-small o Voyage AI voyage-3-lite (bajo costo).
- Modelo de generación sugerido: GPT-4o mini, Claude Haiku o Gemini Flash (baja latencia, bajo costo).
- Librería de integración sugerida: Vercel AI SDK (funciona bien con Next.js App Router aunque el hosting no sea Vercel).
- Rate limiting estricto, límite de tokens por usuario, control de costos por petición.
- Sanitización de prompts, validación de respuestas con Zod, prohibido ejecutar código generado.
- Trazabilidad con `trace_id` por petición y logs sin contenido sensible.
- El proveedor y los modelos elegidos se declaran en `stack-tecnico.md` antes de integrarse.
- Requiere autorización explícita del usuario antes de empezar a construir.

### Expansión de la sección de Tips

- Más tipos de trucos: gainer, cork, full, double full, raiz con variantes, etc.
- Tips por nivel: principiante, intermedio, avanzado.
- Tips de respiración y preparación mental antes del truco.
- Tips de aterrizaje y absorción de impacto.
- Tips de calentamiento específico por tipo de truco.
- Videos cortos demostrando cada tip (subidos a R2).
- Diagramas visuales de hacia dónde mirar en cada fase del truco.
- Modo comparación: dos tipos de truco lado a lado mostrando diferencias de mirada.

### Skill tree de trucos y generador de combos

Sección nueva que combina un árbol de habilidades visual con un generador de combos aleatorios y un editor de combos propios. Requiere autenticación previa para persistir el progreso del usuario.

#### Árbol de habilidades (skill tree):

- Representación visual de los trucos como nodos de un grafo, siguiendo los prereqs y next tricks de TrickingAPI.
- Los nodos se desbloquean a medida que el usuario marca trucos que ya sabe ejecutar.
- Estados de cada nodo: bloqueado (prereqs no cumplidos), disponible (prereqs cumplidos pero no aprendido), en progreso (marcado por el usuario como aprendiendo), aprendido (marcado por el usuario como dominado).
- Colores por estado: bloqueado en gris piedra con ícono de candado, disponible en cian eléctrico con borde punteado, en progreso en ámbar advertencia con borde sólido, aprendido en verde esmeralda con relleno completo.
- Filtros por categoría (kicks, flips, twists, transitions), dificultad (0 a 5) y estado.
- Vista de zoom y arrastre. Navegable con teclado (Tab, flechas, Enter para marcar).
- Posibilidad de marcar un nodo como "quiero aprender" para que aparezca destacado.
- Barra de progreso global: porcentaje de trucos aprendidos sobre el total.
- Barra de progreso por categoría: cuántos trucos de cada categoría domina el usuario.
- Logros desbloqueables al cumplir hitos: primer b-twist, 10 trucos aprendidos, categoría de kicks completa, etc.
- Los trucos de TrickingAPI sin prereqs son los nodos raíz del árbol.
- Los trucos sin next tricks son las hojas del árbol.
- El árbol se renderiza con una librería de grafos: react-flow, d3-force o cytoscape.js. La decisión se toma en la fase de implementación y requiere autorización.

#### Generador de combos aleatorios:

- Genera combos usando únicamente los trucos que el usuario ya marcó como aprendidos en el skill tree.
- Considera las transiciones entre trucos para que el combo sea fluido y no termine en un truco sin conexión al siguiente.
- Longitud configurable: corto (2 a 3 trucos), medio (4 a 5 trucos), largo (6 o más).
- Filtros opcionales: solo de una categoría, solo de cierta dificultad máxima, excluir trucos específicos.
- Botón de regenerar hasta que el usuario encuentre uno que le guste.
- Muestra cada truco con su badge de categoría y dificultad.
- Muestra las transiciones intermedias si existen.
- Al hacer clic en un truco del combo, se abre su detalle.
- Opción de copiar el combo como texto plano para compartir por chat.
- Opción de guardar el combo directamente.

#### Editor y guardado de combos:

- El usuario puede guardar combos generados aleatoriamente o crear los suyos desde cero.
- Editor tipo nota: lista numerada de pasos, cada paso es un truco del catálogo.
- Autocompletado al escribir el nombre del truco, con debounce de 300 ms.
- Reordenar pasos con arrastrar y soltar.
- Agregar notas personales al combo completo o a pasos individuales.
- Título y descripción opcional del combo.
- Etiquetas opcionales: categoría principal, dificultad estimada, música sugerida, etc.
- Estados: borrador, practicando, dominado.
- Vista de listado de combos guardados con filtros por estado y etiqueta.
- Búsqueda dentro de los combos guardados.
- Exportar combo a texto plano, markdown o ICS (calendario) si se activa esa función.
- Compartir combo por enlace público o privado (opcional, requiere decisión).
- Eliminar combo con modal de confirmación y soft delete.

#### Modelado de datos (referencia, se define en la fase de implementación):

- Tabla `user_trick_progress`: `user_id`, `trick_id`, `status` (locked, available, in_progress, learned, want_to_learn), `updated_at`.
- Tabla `user_achievements`: `user_id`, `achievement_id`, `unlocked_at`.
- Tabla `combos`: `id`, `user_id`, `title`, `description`, `status`, `is_public`, `created_at`, `updated_at`, `deleted_at`.
- Tabla `combo_steps`: `combo_id`, `trick_id`, `order`, `note`.
- Tabla `combo_tags`: `combo_id`, `tag`.

#### Requisitos previos:

- Autenticación con Auth.js (NextAuth) y adaptador de Drizzle sobre Neon.
- Persistencia en base de datos, no en localStorage, porque es información personal del usuario.
- Rate limiting en los endpoints de generación de combos para evitar abuso.
- Cache local del skill tree con TTL de 1 día, invalidado al marcar un truco como aprendido.

#### Fases sugeridas si se activa:

- Fase A: autenticación y tabla de progreso.
- Fase B: skill tree visual y marcado de trucos.
- Fase C: generador de combos aleatorios.
- Fase D: editor y guardado de combos.
- Fase E: logros, estadísticas y compartición.

Requiere autorización explícita del usuario antes de empezar a construir cualquiera de estas fases.

### Funcionalidades pendientes sugeridas por el usuario

Las que el usuario agregue durante el desarrollo, registradas con fecha y motivo.

### Recomendaciones adicionales sugeridas por el agente

Estas son propuestas, no compromisos. El usuario decide cuáles se activan.

- Autenticación de usuarios: Auth.js (NextAuth) con adaptador de Drizzle y Neon. Habilitaría favoritos, progreso personal y contribuciones. Es requisito para el skill tree y los combos.
- Sistema de progreso del usuario: marcar trucos como "quiero aprender", "en progreso" o "aprendido". Persistir en BD, no en localStorage. Es la base del skill tree.
- Favoritos y colecciones: agrupar trucos en listas personalizadas, exportables.
- Timeline de progresión: vista que muestra el camino prereq, truco y next tricks de forma visual.
- Comparación de trucos side by side: dos trucos en paralelo con sus vídeos y diferencias técnicas resaltadas.
- Modo entrenamiento o rutinas: generar sesiones de práctica según el nivel y objetivos del usuario, incorporando tips de mirada relevantes.
- Contribuciones de usuarios: permitir subir clips propios de trucos, con moderación previa antes de publicarse.
- Notificaciones por correo: Resend o SendGrid. Solo si se activa autenticación.
- Notificaciones push: Web Push API para recordatorios de práctica.
- PWA: manifest, service worker y funcionamiento offline básico con cache del catálogo y de los tips.
- Analítica: Umami (self-hosted o cloud free tier) o PostHog (free tier generoso). Sin cookies de terceros ni trackers invasivos.
- Búsqueda por timestamps en vídeos: marcar momentos clave dentro de cada vídeo tutorial y saltar a ellos.
- Internacionalización ampliada: agregar portugués, francés o japonés según demanda real.
- Modo presentación o kiosk: vista a pantalla completa para gimnasios o eventos.
- Exportar rutinas a calendario: formato ICS para integración con Google Calendar o similares.
- API pública para terceros: exponer endpoints de solo lectura con rate limiting y API keys.
- Comunidad ligera: comentarios por truco con moderación y antispam (Akismet o similar).
- Traducción automática de captions de Kojo: si el usuario decide soportar más idiomas en el contenido del scraper.
- Modo contraste para vídeos claros: overlay automático cuando el vídeo tiene fondo blanco y el modo del sitio es oscuro.

### Cosas que explícitamente NO se hacen por ahora

- No hay SMS ni validación por teléfono.
- No hay pagos ni suscripciones.
- No hay app nativa móvil (solo web responsive y PWA si se activa).
- No hay integración con wearables.
- No hay marketplace ni venta de contenido.
- No hay multi-tenant ni equipos.
- No hay integración con calendarios de terceros (solo exportación ICS si se activa).

### Reglas de esta sección

- El agente no implementa nada de esta sección sin autorización explícita del usuario.
- Si alguna tarea futura toca un pendiente de esta sección, se abre una nueva fase en `docs/docs-agents/fases.md` y se registra el cambio.
- Los pendientes se priorizan por valor para el usuario, no por facilidad técnica.
- Cada pendiente que se resuelva se mueve de esta sección a la fase correspondiente y se elimina de aquí.
- El agente puede proponer nuevas ideas en cualquier momento, pero se agregan a esta sección, no se ejecutan.

## TIPS Y RECORDATORIOS PERSONALES DEL USUARIO

No forman parte del bloque de reglas que se hereda a otros prompts, son notas operativas.

- Copiar `bin/lupe-start` desde buybolivia en todo repositorio.
- Usar ruflo y graphify si OpenCode lo permite.
- Playwright con navegador visible en ventana normal del escritorio (WSLg en WSL), sobre Chrome en Windows, no en WSL. El navegador no se cierra solo.
- Limitaciones de Playwright: no cubre Lighthouse ni trazas de performance. Yopmail puede pedir CAPTCHA.
- Usar correos de prueba con yopmail. Parar cuando pida captcha, resolverlo manualmente, retomar.
- Tener en VSCode las extensiones justas y necesarias.
- Revisar el tema de cuando la IA intenta enviar más de 1500 cambios por API.
- Revisar de vez en cuando el repositorio buscando rastros de IA y limpiarlos.
- El entorno es WSL sobre Windows con Ubuntu/Debian. La terminal es bash. El repositorio vive en `~/dev/tricking-monorepo`, nunca en `/mnt/c/`. Los comandos deben ser compatibles con bash de Linux.

## HERENCIA

Cualquier prompt que referencie `AGENTS.md` hereda automáticamente estas reglas. El agente debe:

- Detectar el stack, dependencias, infraestructura, uso de IA, skills, agentes, i18n, idioma del repositorio.
- Leer `AGENTS.md` completo antes de tocar cualquier archivo.
- Leer los documentos referenciados relevantes.
- Cargar las skills relevantes.
- Aplicar reglas condicionales activas y todas las transversales.
- Usar librerías ya presentes antes de proponer nuevas.
- Ejecutar subagentes de validación al cierre.

`AGENTS.md` es la fuente única de verdad del monorepo. Cualquier documento nuevo se referencia en él. Cualquier regla nueva se declara primero en su documento referenciado antes de usarse en un prompt.

## CÓMO DEBES TRABAJAR EN ESTE CHAT

Empiezas en la Fase 0.1. Lo primero que haces, en este orden:

1. Confirmar que entendiste el contexto y el stack.
2. Declarar explícitamente qué documentos vas a crear y en qué orden, según la Fase 0.
3. Empezar a construir el monorepo y la documentación base, incluido el `AGENTS.md` final (que debe heredar todas las reglas de este prompt, organizadas como definí, más la sección final de pendientes y mejoras futuras con el bloque de skill tree y combos).
4. Al cerrar la Fase 0, reportar con el formato de cierre y esperar mi confirmación antes de pasar a la Fase 1.

### Reglas de trabajo durante el chat

- No pides confirmación para cada paso. Si algo no está explícito, tomas la decisión más razonable, la dejas escrita con una nota breve de que puede ajustarse, y sigues.
- Reportas al final de cada bloque con la tabla de decisión y el detalle de lo agregado, ampliado y no agregado.
- Si detectas que una regla de este prompt choca con otra, me avisas y propones la resolución.
- Si algo de este prompt ya está cubierto por una regla anterior, no lo duplicas, lo referencias.
- Todo lo que produzcas queda sujeto a las reglas de idioma, estilo y prohibición de marcas de IA.
- Todos los comandos que propongas deben funcionar en bash de Linux sobre WSL. No propongas comandos de PowerShell ni de cmd. Si algo requiere permisos elevados, usa `sudo` explícitamente.

Arranca.
