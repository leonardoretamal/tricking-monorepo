# AGENTS.md

Este archivo es la fuente única de verdad del monorepo. Cualquier agente (o cualquier prompt que referencie AGENTS.md) debe leerlo completo antes de tocar un solo archivo. Las reglas detalladas por tema viven en los documentos referenciados de `docs/docs-agents/`; aquí se resumen y se delega con la ruta exacta. No se duplica el detalle.

Si una regla nueva aparece, primero se declara en su documento referenciado y después se referencia desde aquí. Si un documento se agrega al monorepo, se referencia en este archivo.

## 1. Contexto del proyecto

Tricking Monorepo es un sitio web de tricking que reúne:

- Los trucos de Loopkicks (loopkickstricking.com): vertical kicks, backward, forward, inside, outside, variations, transitions, stances y la explore page. Es la fuente primaria del contenido y de la clasificación de trucos, y se obtiene por scraping. Los vídeos se descargan y se suben a Cloudflare R2.
- Los tutoriales de Kojo's Trick Lab: tutoriales largos que se obtienen por scraping de Instagram con insta-fetcher y, si hace falta, scraping web con cheerio.
- Una sección de tips técnicos sobre mirada y ejecución, contenido propio curado por el usuario y cargado manualmente en la base de datos en la Fase 16.

Fuentes de datos:

- Loopkicks: fuente primaria del contenido y la clasificación. Scraping. Los vídeos se descargan y se suben a R2.
- TrickingAPI: fuente complementaria. Provee IDs estandarizados, categorías, prereqs, next tricks y descripciones. No es la API de Loopkicks; son proyectos independientes. Se usa como semilla mediante el paquete `@trickingapi/tricks-core-data` y el cliente tipado `@trickingapi/tricking-ts`.
- Kojo's Trick Lab: fuente de tutoriales largos vía scraping de Instagram con insta-fetcher y, si hace falta, cheerio.
- Tips técnicos: contenido propio, carga manual, sin scraping.

Características obligatorias del producto:

- i18n con idioma por defecto en español.
- Dos modos de tema (claro y oscuro) que respetan la preferencia del usuario.
- Almacenamiento de vídeos en Cloudflare R2.
- Base de datos en Neon con Drizzle ORM.

Idioma base del repositorio: español neutro latinoamericano.

Entorno de desarrollo del usuario: WSL sobre Windows con Ubuntu/Debian. Todos los comandos se ejecutan en WSL, en bash de Linux. El repositorio vive en `~/dev/tricking-monorepo`, nunca en `/mnt/c/`. El editor es VS Code con la extensión WSL conectada. Los comandos propuestos deben funcionar en bash de Linux; no se proponen comandos de PowerShell ni de cmd. Si algo requiere permisos elevados, se usa `sudo` explícito.

## 2. Modalidad de recomendación

En cada categoría del inventario técnico se proponen al menos una opción principal y una alternativa, con justificación breve y la nota de cuándo elegir una u otra. Ver `docs/docs-agents/recomendaciones-stack.md`.

Las recomendaciones se presentan como propuesta, no como imposición. El usuario elige. Si no responde, se toma la opción principal por defecto, se escribe en `docs/docs-agents/stack-tecnico.md` y se anota que puede ajustarse.

Ninguna categoría queda en blanco. Si una categoría no aplica todavía, se escribe de forma explícita ("no aplica en esta fase, se decidirá cuando...").

Una vez que el usuario elige o el agente decide por defecto, la decisión se registra en `docs/docs-agents/stack-tecnico.md` y se considera cerrada hasta que el usuario pida cambiarla.

## 3. Reglas de trabajo y comunicación

- Español neutro latinoamericano en todo: documentación, comentarios, commits, descripciones de PR, respuestas en el chat y reportes. Sin modismos, sin voseo, sin jergas regionales.
- Sin emojis ni emoticonos.
- Sin atribución de autoría a una IA.
- Prohibido el em dash (U+2014) y el en dash (U+2013). Para incisos se usan paréntesis o comas.
- Al agregar, quitar o modificar reglas o documentos, la respuesta empieza con una tabla de decisión (Regla solicitada, ¿Ya existía?, Acción, Motivo) y sigue con el detalle de lo agregado, lo no agregado y lo ampliado, con ubicación exacta.
- Si algo ya existe, se dice dónde está y no se duplica. Si es parcialmente nuevo, se avisa qué parte ya estaba y qué parte se agrega.
- Todo lo que el usuario dicte como regla entra a la documentación sin esperar confirmación.
- Si el usuario no responde preguntas, se toma la decisión más razonable, se deja escrita con nota de que puede ajustarse, y se sigue. Nada queda en el limbo. Si falta un dato, se decide lo razonable y se anota.
- Si una regla choca con otra, se avisa y se propone la resolución.
- Si una regla ya está cubierta por otra anterior, no se duplica, se referencia.
- Se espera siempre por condición real, nunca por tiempo fijo. Prohibido `sleep N` "por si acaso". Se espera con `curl --retry`, `until curl -sf`, `grep -q`, `gh pr checks --watch`, monitores de eventos o comandos en background. El `sleep` solo es el intervalo corto dentro de un sondeo con condición y tope. Topes por defecto: 5 minutos general, 60 a 120 segundos local. Al llegar al tope o sin avance en 2 minutos, se diagnostica primero y, si no hay nada que arreglar, se pregunta al usuario. En modo autónomo decide el orquestador y registra la decisión. Una suite de tests o E2E no dura más de 5 minutos, corre en background, con `timeout 300` y log.

## 4. Prohibición de marcas, firmas y rastros de IA

Prohibición absoluta de cualquier marca, firma, sello, comentario o rastro que identifique a una IA como autora. Alcance: código fuente, comentarios, documentación, mensajes de commit, descripciones de PR, títulos de rama, respuestas en el chat, reportes, nombres de archivo, nombres de variable, nombres de función, identificadores, metadatos, imágenes, capturas y diagramas.

Formas prohibidas incluidas a modo de ejemplo: comentarios tipo "Generated by ChatGPT", "Claude suggestion", "AI-generated", firmas al final de archivos, emojis identificatorios de IA, frases tipo "como IA", "soy un modelo de lenguaje", "espero que te sirva", "aquí tienes tu código", mensajes de commit con corchetes de AI o bot, y cabeceras con fecha de generación o versión de modelo.

Verificación antes de entregar: antes de proponer `git add`, commit, push, PR o merge se revisa y se elimina cualquier rastro.

Si se detectan marcas preexistentes no relacionadas con la tarea, se reportan pero no se eliminan sin autorización. Si las introdujo el agente, las elimina y lo anota.

## 5. Reglas de conducta del agente

- Prohibición de scope creep: no se agregan funcionalidades, archivos, dependencias ni refactorizaciones no solicitadas. Se proponen, no se ejecutan.
- Preservación de código no relacionado: prohibido eliminar comentarios, funciones auxiliares o bloques no vinculados a la tarea.
- Respeto por las convenciones del repositorio: se imita el estilo de nomenclatura, la estructura de carpetas y los patrones de importación ya presentes.
- Prohibido modificar archivos de bloqueo (`pnpm-lock.yaml`, etc.) sin instalación autorizada.
- Prohibido cambiar versiones de dependencias sin autorización.
- Autocorrección previa a la entrega: si la propuesta viola alguna regla, se corrige antes de mostrar el código final.
- Cada vez que se toca una variable de entorno en el código, se actualiza el `.env.example` correspondiente en la misma tarea.
- Registro obligatorio en bitácora.
- Autorización para levantar infraestructura local de prueba, limitada a entornos locales, con datos de prueba y limpieza al cierre. Prohibido conectar a entornos compartidos, staging o producción.
- Autorización permanente para crear o modificar `.env.example`, con alcance limitado a nombres, comentarios y valores de ejemplo no reales.
- Autorización para escribir secretos por CLI o API, limitada al entorno dev y solo si el gestor está confirmado en este archivo o en `docs/docs-agents/stack-tecnico.md`.
- Instalar o actualizar herramientas del entorno (navegadores, runtimes globales) requiere autorización previa.
- Antes de ejecutar cualquier comando que toque ramas, entornos o despliegues, el agente confirma en qué rama está y a qué entorno apunta. Si el comando toca producción, frena y pide confirmación explícita, aunque el usuario haya dado permiso general para operar. El detalle vive en `docs/docs-agents/reglas-git.md`.
- Todos los comandos deben ser compatibles con bash de Linux en WSL. Si algo requiere permisos elevados, se usa `sudo` explícito.

## 6. Ubicación de los documentos (docs/docs-agents/)

Todos los documentos referenciados del agente viven en una sola carpeta dedicada en la raíz: `docs/docs-agents/`. No se dispersan por el repositorio. La carpeta se versiona con Git y no se excluye.

Documentos que viven en `docs/docs-agents/`:

- `docs/docs-agents/prompt-arranque.md`: el prompt de arranque del monorepo.
- `docs/docs-agents/stack-tecnico.md`: inventario y decisiones cerradas del stack.
- `docs/docs-agents/recomendaciones-stack.md`: catálogo de opciones por categoría con justificación y cuándo elegir cada una.
- `docs/docs-agents/deteccion-stack.md`: qué detectar y registrar antes de completar la documentación base.
- `docs/docs-agents/fases.md`: estado de las fases del proyecto y subfases.
- `docs/docs-agents/design.md`: decisiones visuales (temas, paletas, colores por dificultad, categoría y tips).
- `docs/docs-agents/reglas-frontend.md`: estándares de frontend.
- `docs/docs-agents/reglas-backend.md`: estándares de backend.
- `docs/docs-agents/reglas-seguridad.md`: reglas de seguridad.
- `docs/docs-agents/reglas-logs.md`: estándares de logs.
- `docs/docs-agents/reglas-git.md`: estándares de Git.
- `docs/docs-agents/reglas-ci.md`: estándares de CI.
- `docs/docs-agents/reglas-validacion.md`: validación al cierre con subagentes.
- `docs/docs-agents/reglas-i18n.md`: reglas de internacionalización.
- `docs/docs-agents/reglas-secretos.md`: secretos y `.env.example`.
- `docs/docs-agents/reglas-cookies.md`: cookies y consentimiento.
- `docs/docs-agents/reglas-legal.md`: legal y cumplimiento.
- `docs/docs-agents/reglas-seo.md`: SEO técnico.
- `docs/docs-agents/reglas-ia.md`: seguridad y uso de IA en el producto y en el desarrollo.
- `docs/docs-agents/checklist-lanzamiento.md`: checklist de lanzamiento con los 20 ítems.

Fuera de esa carpeta, en la raíz, se quedan:

- `AGENTS.md`: punto de entrada obligatorio; el agente lo busca en la raíz por convención.
- `README.md`.
- `BITACORA.md`: un solo archivo, sin fragmentar. No va dentro de `docs/docs-agents/` porque no es un documento de reglas, es un registro histórico de trabajo.

Los templates de PR e issues se quedan en `.github/`, que es donde GitHub los busca.

Reglas asociadas:

- AGENTS.md referencia cada documento con su ruta completa relativa a la raíz (por ejemplo `docs/docs-agents/reglas-frontend.md`).
- Si el repositorio es un monorepo con servicios que tienen reglas propias, cada servicio puede tener su propia subcarpeta de docs de agente dentro de su carpeta, y el AGENTS.md raíz las referencia.
- Si el usuario prefiere otra ubicación (por ejemplo `.agents/`, `documentacion-agente/`, `reglas/`), se respeta. Lo importante es que sea una sola carpeta y que AGENTS.md la referencie.
- Si el repositorio ya tiene una carpeta `docs/` con documentación de usuario o de producto, la carpeta de docs del agente va adentro de `docs/`, no compite con ella.

### Lectura obligatoria de los documentos referenciados

- Todos los archivos referenciados en `AGENTS.md` que viven en `docs/docs-agents/` son de lectura obligatoria para el agente.
- La lectura obligatoria aplica cuando la tarea toca el área temática del documento. Por ejemplo: si la tarea toca frontend, se lee `docs/docs-agents/reglas-frontend.md`; si toca secretos, se lee `docs/docs-agents/reglas-secretos.md`; si toca cookies, se lee `docs/docs-agents/reglas-cookies.md`.
- El agente no puede ejecutar una tarea sin haber leído los documentos referenciados que le aplican. Si no los leyó, no empieza.
- Al inicio de la tarea, el agente declara qué documentos referenciados va a leer y por qué. Si alguno aplica y no lo leyó, lo reporta como incumplimiento.
- Los documentos que no aplican a la tarea no se leen completos, pero el agente sabe que existen y dónde están porque están listados en `AGENTS.md`.

### Longitud de AGENTS.md y derivación de reglas nuevas

Antes de escribir contenido nuevo en `AGENTS.md`, se revisa si corresponde o si va a un documento referenciado:

- Criterio orientativo: si `AGENTS.md` supera las 300 o 400 líneas, o si la regla nueva es específica de un tema que ya tiene documento propio, no se escribe en `AGENTS.md`.
- Si el tema ya tiene un archivo en `docs/docs-agents/`, se edita ese archivo. Si la regla encaja en una sección existente, se agrega ahí; si requiere una sección nueva, se agrega la sección.
- Si el tema no tiene archivo en `docs/docs-agents/`, se crea uno nuevo con nombre descriptivo en el idioma del repositorio y se agrega la referencia en `AGENTS.md`.
- Lo único que se escribe directamente en `AGENTS.md` es: el índice maestro (visión general, resumen del stack, tabla de documentos referenciados), las reglas transversales que no tienen documento temático propio, las reglas de conducta del agente, las reglas de Git y automatización, el formato de reporte final de tarea y las reglas de la bitácora.
- Prohibido usar `AGENTS.md` como cajón de sastre. Si la regla tiene tema, va a su documento.
- Si hay duda entre `AGENTS.md` y un documento referenciado, la regla se escribe en el documento referenciado y se deja la referencia en `AGENTS.md`. Es más fácil mover después que saturar el índice.

### Documentos que crecen demasiado

- Si un documento referenciado supera las 500 o 600 líneas, se divide en subdocumentos por tema y se actualiza el índice en `AGENTS.md`.
- El nombre del subdocumento refleja su contenido (por ejemplo `reglas-frontend-formularios.md`, `reglas-frontend-accesibilidad.md`).
- La bitácora no se fragmenta en documentos referenciados. Si crece mucho, se divide por año o trimestre, pero cada división sigue siendo un archivo plano de bitácora.

## 7. Stack técnico resumido

El detalle cerrado está en `docs/docs-agents/stack-tecnico.md` y las opciones comparadas en `docs/docs-agents/recomendaciones-stack.md`.

Resumen de las decisiones por defecto:

- Monorepo: Turborepo + pnpm workspaces.
- Frontend: Next.js (App Router) + TypeScript estricto. Implementado en `apps/web` en la Fase 2 (Next 16, React 19, Tailwind v4 CSS-first + DaisyUI v5).
- Hosting web: Cloudflare Pages.
- Base de datos: Neon (PostgreSQL serverless).
- ORM y migraciones: Drizzle ORM + drizzle-kit.
- Almacenamiento de vídeos: Cloudflare R2.
- Cola y caché: Upstash Redis + Upstash QStash.
- Validación: Zod v4.
- i18n: next-intl (defaultLocale `es`).
- UI: Tailwind CSS + DaisyUI.
- Iconos: lucide-react.
- Estado del servidor: TanStack Query.
- Estado del cliente: Zustand + localStorage.
- Virtualización: TanStack Virtual.
- Formularios: react-hook-form + @hookform/resolvers.
- Toasts: sonner.
- Fechas: date-fns + date-fns-tz.
- Logging: Pino.
- Scraping Instagram: insta-fetcher.
- Scraping web general: cheerio.
- Semilla de trucos: @trickingapi/tricks-core-data + @trickingapi/tricking-ts.
- Testing: Vitest + Testing Library + Playwright.
- Autenticación: no aplica; el contenido es público y no requiere login. Si se activa el skill tree (sección 28.3), se reevalúa.
- CI/CD: GitHub Actions.
- Gestión de secretos: variables de entorno en GitHub Actions y Cloudflare.
- Correo: Resend. No aplica en Fase 0.
- Analítica: Umami. Condicional.
- Cookies y consentimiento: vanilla-cookieconsent. Condicional.

Dependencias aprobadas del monorepo: turbo, pnpm, typescript, eslint, `@typescript-eslint/*`, prettier, husky, lint-staged, `@commitlint/cli`, `@commitlint/config-conventional`.

Dependencias aprobadas del frontend: next, react, react-dom, tailwindcss, postcss, autoprefixer, daisyui, lucide-react, next-intl, zod, react-hook-form, `@hookform/resolvers`, sonner, zustand, `@tanstack/react-query`, `@tanstack/react-virtual`, date-fns, date-fns-tz.

Dependencias aprobadas del backend y datos: drizzle-orm, drizzle-kit, `@neondatabase/serverless`, pino, pino-pretty, insta-fetcher, `@trickingapi/tricks-core-data`, `@trickingapi/tricking-ts`, `@upstash/redis`, `@upstash/qstash`, `@aws-sdk/client-s3`, cheerio.

Dependencias aprobadas de testing: vitest, `@testing-library/react`, playwright, i18next-parser o i18next-lint.

Dependencias prohibidas sin autorización: Prisma (se usa Drizzle); Vercel y Supabase; shadcn/ui (reemplazado por DaisyUI); Infisical, Vault y Doppler (basta con variables de entorno simples); RabbitMQ, Kafka y BullMQ (Upstash cubre la cola); Docker y Kubernetes (despliegue serverless); LangChain, LlamaIndex y Vercel AI SDK (por ahora no hay IA en producto); Pinecone y Weaviate (no hay RAG por ahora); Twilio, Vonage y AWS SNS (no hay validación por teléfono); SendGrid y Mailgun (no hay envío de correos por ahora; Resend es la opción si se activa).

## 8. Estructura del monorepo

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

Nomenclatura de paquetes resuelta para el workspace (ver `docs/docs-agents/stack-tecnico.md`): `@tricking/web`, `@tricking/scraper`, `@tricking/db`, `@tricking/ui`, `@tricking/shared`, `@tricking/config`.

## 9. Reglas de fases

El estado de las fases vive en `docs/docs-agents/fases.md`. El detalle de las fases y subfases también.

- Se declara al inicio de cada tarea en qué fase y subfase se está trabajando.
- No se adelanta trabajo de fases posteriores sin autorización explícita.
- No se modifica trabajo de fases cerradas sin abrir una subfase de corrección.
- Al cerrar cada subfase se ejecutan los subagentes de validación.
- Al cerrar cada fase completa se actualiza `docs/docs-agents/stack-tecnico.md`, `BITACORA.md` y se genera un resumen en AGENTS.md.
- Prohibido marcar una subfase como cerrada sin build de producción verificado y subagentes pasados.
- Las fases de contenido (3 a 10, 13, 16) comparten plantilla. Si un componente se duplica entre dos fases, se refactoriza a `packages/ui` antes de cerrar la siguiente.
- Las fases que tocan la misma tabla documentan en `docs/docs-agents/fases.md` qué campos usan y cuáles quedan pendientes.
- El proyecto se organiza por secciones de contenido, no por capas técnicas. Cada sección de Loopkicks es una fase. Cada fase se cierra con build de producción verificado, subagentes de validación ejecutados y actualización de `docs/docs-agents/fases.md`.

## 10. Sistema de temas y modos

El detalle de paletas, colores y reglas visuales está en `docs/docs-agents/design.md`. Consultar `docs/docs-agents/design.md` siempre antes de tocar interfaz.

Resumen: dos temas, `tricking-light` (default) y `tricking-dark` (prefersdark). La resolución del tema es, en orden: preferencia manual en localStorage (`tricking:theme`), preferencia del sistema vía `prefers-color-scheme`, y default del proyecto (modo claro). El tema se aplica con `data-theme` en `<html>`, nunca con clases condicionales. Prohibido escribir colores sueltos con hex en los componentes; todo sale de las variables del tema. El script inline anti-flash vive en el `<head>` del layout raíz y es el único `dangerouslySetInnerHTML` permitido sin autorización expresa. El tema persistido usa la clave `tricking:theme` con TTL de 1 año. El cambio es instantáneo, sin recargar. El botón de toggle tiene `aria-label` descriptivo, `aria-pressed` y es operable por teclado.

## 11. Cacheo en cliente (localStorage)

Para reducir peticiones y ahorrar CPU time en Cloudflare Pages, se cachea en localStorage lo que no sea sensible. El wrapper vive en `packages/shared/src/storage.ts` y valida al leer con Zod.

Qué se cachea: catálogo de trucos, descripciones largas de Kojo, preferencia de idioma, última posición del scroll y filtros, URLs de vídeos R2 con TTL corto, resultados de búsqueda con TTL de 5 a 15 minutos, estado expandido del acordeón con TTL de 7 días, tema con TTL de 1 año, y tips de mirada con TTL de 30 días.

Qué no se cachea: tokens de sesión (usar cookie httpOnly), datos sensibles de usuario y estado del servidor en tiempo real.

Reglas:

- Toda lectura va envuelta en try/catch.
- Toda clave lleva prefijo `tricking:` por módulo.
- Toda entrada con TTL guarda `{ value, expiresAt }`.
- Prohibido guardar tokens, contraseñas o datos personales.
- Escrituras con debounce mínimo de 300 ms.
- Si el dato está fresco, no se dispara la petición. Si está vencido, se sirve el cacheado primero (stale-while-revalidate) y se actualiza en background.
- El estado del servidor se maneja con TanStack Query y el estado del cliente con Zustand; la persistencia pasa por el wrapper de cacheo. Prohibido acceder a localStorage, sessionStorage o IndexedDB directamente para estado de la aplicación; el wrapper de cacheo es la única puerta de entrada.
- Validar datos rehidratados contra esquema.
- No guardar secretos, tokens ni datos sensibles en almacenamiento del navegador.

## 12. Estándares de frontend

El detalle va en `docs/docs-agents/reglas-frontend.md` y las decisiones visuales en `docs/docs-agents/design.md`.

Resumen obligatorio:

- Toda petición tiene estado de carga. Los botones de escritura se deshabilitan y muestran loading.
- Los efectos secundarios se limpian en el desmontaje. Las peticiones con alta probabilidad de desmontaje usan AbortController.
- Cada componente que consuma datos resuelve tres estados: carga, error y éxito. El estado vacío reutiliza el componente global.
- Las eliminaciones usan modal de confirmación.
- Toast en cada try/catch. Prohibido `alert`, `confirm` y `prompt`.
- No se muestran errores internos al usuario.
- Variables de entorno con `process.env.NEXT_PUBLIC_` para valores públicos.
- Los campos de contraseña llevan toggle de ojo, `aria-label` y son operables por teclado.
- Navbar con secciones y subsecciones, máximo dos niveles. Estado activo con `aria-current="page"` y más de un atributo visual.
- Responsive mobile-first. Pruebas con viewport 390x600.
- Componentes DaisyUI interactivos (modal, dropdown, tabs, accordion, drawer, tooltip) requieren accesibilidad manual: `aria-expanded`, `aria-controls`, role, focus trap y teclado.
- Búsquedas con debounce de 300 a 500 ms.
- Listados de más de 100 ítems con virtualización.
- Prohibido `any` y `as` para silenciar al compilador.
- Todo texto visible en archivos de traducción por módulo. `common.json` para compartidos. Prohibido archivo monolítico. Códigos BCP 47. Fechas y números con utilidades nativas de i18n.
- Errores de validación debajo del input, con `aria-describedby`, `aria-invalid`, `role="alert"`, validación en `onBlur` y al enviar, y todos los errores a la vez.

Listados: todo listado es paginable, con búsqueda, filtros y ordenamiento; búsqueda, filtros y ordenamiento se envían al backend y se resuelven en la sentencia de la base de datos (prohibido traer colecciones completas a memoria para filtrar, ordenar o paginar en código de aplicación); el total de resultados se calcula en la base de datos; el estado va en la URL (query params) y al cambiar filtros se resetea la página a 1; hay indicador de filtros activos, total de resultados y rango visible; el estado vacío diferencia entre "no hay datos" y "sin resultados con esos filtros".

Imágenes y rendimiento visual: imágenes comprimidas en formatos modernos (WebP, AVIF); dimensiones correctas, lazy loading salvo above-the-fold, `srcset` responsive; velocidad de carga medida con Lighthouse, objetivo mínimo 90 en móvil.

Accesibilidad: navegación operable con teclado y foco visible; texto alternativo obligatorio en imágenes (decorativas con `alt` vacío, informativas con `alt` descriptivo); contraste WCAG AA (4.5:1 texto normal, 3:1 texto grande y componentes de UI); ARIA correcto, `aria-label` descriptivo en íconos sin texto; errores de validación accesibles.

UX y navegación de páginas: página 404 personalizada; enlaces rotos verificados antes del cierre; botón de WhatsApp visible solo si el proyecto lo usa; una sola llamada a la acción por pantalla.

## 13. Estándares de backend

El detalle va en `docs/docs-agents/reglas-backend.md`.

Resumen obligatorio:

- Validar body, params y query con Zod antes de tocar lógica o base de datos.
- try/catch en operaciones importantes. Códigos HTTP correctos. Middleware centralizado. No devolver errores internos crudos.
- Prohibida la concatenación de strings en consultas. Transacciones en operaciones multi-tabla. Carga anticipada para evitar N+1.
- Paginación, búsqueda, filtros y ordenamiento resueltos en la sentencia de la base de datos. Prohibido filtrar, ordenar o paginar en código de aplicación.
- Total de resultados calculado en la base de datos.
- Validación estricta de parámetros de listados, lista blanca de campos, índices en columnas usadas y plan de ejecución revisado en consultas críticas.
- Idempotencia y rate limiting en endpoints de escritura y autenticación. CORS con orígenes explícitos; prohibido el comodín en producción.
- Formularios protegidos contra spam: honeypot, validación de tiempo mínimo de llenado y captcha o Turnstile en formularios públicos. Captcha resuelto en servidor.
- Validar MIME real, tamaño y nombre sanitizado en uploads.
- Migraciones versionadas con avance y reversión. Fechas en UTC. Sin `float` para dinero.
- Soft delete por defecto en entidades con relaciones o auditoría. Hard delete solo para datos temporales.
- Credenciales solo por variables de entorno.
- Arquitectura asíncrona con async/await y try/catch.

## 14. Estándares de logs

El detalle va en `docs/docs-agents/reglas-logs.md`. Herramienta: Pino.

Los logs deben mostrar: parámetros de entrada, inicio de procesos, resultado de consultas, cantidad de registros, y errores controlados e inesperados con `trace_id`.

Los logs nunca deben mostrar: contraseñas, tokens, claves, credenciales, datos sensibles, datos personales ni códigos de verificación.

## 15. Estándares de Git

El detalle va en `docs/docs-agents/reglas-git.md`.

- El agente opera sobre la rama de trabajo del repositorio (`main` en este repositorio, ver `docs/docs-agents/stack-tecnico.md`). Puede hacer commit y push a la rama de trabajo con autorización del usuario. Las ramas de producción (`production`, `prod`, `release/*`) son zona prohibida.
- Detección de ramas y confirmación previa para operaciones que tocan producción: ver `docs/docs-agents/reglas-git.md`.
- pre-commit: typecheck, lint, shellcheck, prettier.
- pre-push: test, integridad de servicios.
- Conventional Commits: feat, fix, chore, docs, refactor, test, style, perf, ci, build, revert.
- Templates de PR e issues en español. Las palabras clave de GitHub (close, fixes, resolves, Co-authored-by, BREAKING CHANGE) nunca se traducen.
- Sección "Variables de entorno" en el body del PR cuando el PR agrega, renombra o elimina variables. Incluye nombre, propósito, dónde configurarla, y si es obligatoria u opcional.
- Aviso en el issue cuando el issue lo amerita: variable nueva, dónde configurarla y enlace a la mini-guía en la bitácora.
- Espera de checks del CI con `gh pr checks --watch` o equivalente, nunca con `sleep` fijo.

## 16. Estándares de CI

El detalle va en `docs/docs-agents/reglas-ci.md`.

- GitHub Actions con `.github/workflows/ci.yml` y `.github/workflows/migrate.yml`.
- Jobs típicos: Lint + Format + Build, ShellCheck, Unit Tests, Integration Tests, i18n Key Validation, y Migraciones Drizzle contra Neon.
- Acciones oficiales versionadas. Caché de dependencias habilitada.
- Workflow de migraciones: se dispara cuando cambian `packages/db/src/schema.ts` o `packages/db/drizzle/**`. Ejecuta `pnpm turbo db:migrate --filter=@tricking/db` con el secret `DATABASE_URL`.
- Base actual de CI: `ci.yml` y `migrate.yml` en `.github/workflows/`. `migrate.yml` se creó en la Fase 1.7 y aplica migraciones solo en `push` a `main` (nunca en PR) o por `workflow_dispatch`.

## 17. Validación al cierre (subagentes)

El detalle va en `docs/docs-agents/reglas-validacion.md`.

Al terminar cada ticket, cada fase y cada tarea, antes de dar el trabajo por cerrado, se ejecutan obligatoriamente los subagentes:

- reviewer: calidad, convenciones, malas prácticas, casos borde, regresiones, consistencia con AGENTS.md, `.env.example` sincronizado, bitácora del issue, lectura completa del contexto del issue, PR body con variables declaradas, mini-guía cuando aplica, meta títulos, datos estructurados, sitemap, `robots.txt`, favicon, aviso legal y política de privacidad cuando aplique, y sin `sleep` fijo en scripts.
- security: autenticación, permisos, exposición de secretos, validación de entradas, dependencias vulnerables, CORS, rate limiting, cabeceras, HTTPS forzado, protección contra spam, ausencia de secretos en localStorage, ausencia de escritura en entornos no-dev y pruebas con datos no reales.
- tester: verificación de lo solicitado, pruebas, casos borde, flujos críticos, validaciones alineadas frontend/backend, estados visuales, operaciones destructivas con confirmación, errores debajo del input, pruebas contra infraestructura real, limpieza al cierre, 404, enlaces no rotos, texto alternativo, contraste, compresión de imágenes y una sola CTA por pantalla.
- i18n-checker: paridad de claves, claves huérfanas, placeholders, formateo y textos hardcodeados.

Instalación de skills: `npx skills add <owner>/<repo>`, `npx autoskills`. Priorizar skills con más estrellas y fuentes oficiales.

Reglas generales: los subagentes se ejecutan al cierre, no son opcionales. Si alguno detecta un problema, el trabajo no se cierra hasta resolverlo o documentarlo como pendiente con justificación. El reporte final incluye el resultado de cada subagente.

## 18. Verificación de build de producción y capturas

Antes de entregar cualquier tarea, antes de proponer `git add`, commit, push, PR o merge:

- Si el repositorio tiene el build de producción en un gancho (pre-commit o pre-push), el agente NO lo ejecuta manualmente: confía en el gancho y lo deja anotado en el reporte.
- Si el repositorio no tiene el build en ningún gancho, el agente lo ejecuta manualmente antes de proponer `git add`, commit, push, PR o merge.
- Verificar que el build termine sin errores ni advertencias bloqueantes. Si falla, corregir antes de dar la tarea por cerrada.
- En ambos casos, si se generó una carpeta de build, borrarla para no dejarla cacheada ni ocupar espacio, y confirmar que está en `.gitignore`.
- Reporte: "Build de producción verificado (por el gancho o manualmente) y carpeta de build eliminada" o el detalle del fallo.

Capturas con Playwright:

- Capturar todo lo inspeccionado: pantallas, componentes, estados y flujos.
- Ubicación: carpeta temporal fuera del repositorio o ignorada por Git.
- Limpieza al cierre.
- Viewport móvil: 390x600. Prohibido 390x844. Página completa con `fullPage: true`.

Pruebas de infraestructura y servicios antes del cierre:

- Autorización para levantar contenedores, bases de datos, servicios, colas y caché con datos de prueba.
- Prohibido conectar a entornos compartidos, staging o producción.
- Prohibido usar credenciales o datos reales.
- Limpieza al cierre. Si no se pudo probar, declararlo como limitación.

## 19. Bitácora (reglas de uso)

Estas reglas describen cómo se usa la bitácora. No se escriben dentro de `BITACORA.md`; viven aquí, en la sección de cierre de tarea del AGENTS.md.

- El archivo de bitácora es `BITACORA.md`, único, en la raíz del monorepo, versionado. No se fragmenta en documentos referenciados. No se crea un archivo por issue.
- Dentro de `BITACORA.md` solo van las entradas de trabajo de issues o tasks. Nada de reglas, instrucciones, explicaciones de formato ni comportamiento del agente.
- El archivo se rellena a medida que se trabaja en issues. Si todavía no hay entradas, queda con el título y una línea indicando que se rellena a medida que se trabaja en issues.
- Verificación previa obligatoria antes de escribir: revisar si el monorepo ya tiene bitácora, changelog o registro. Si existe, escribir ahí. Si hay más de uno, reportar ambigüedad.
- Todas las entradas van al mismo archivo, en orden cronológico, separadas por encabezados con número de issue y fecha.
- Campos mínimos del encabezado de cada entrada: número de issue, título, qué pedía el issue, fecha de inicio (ISO 8601), estado actual y autor del registro.
- Contenido de cada entrada: acciones, decisiones, archivos tocados, comandos relevantes, pruebas, bloqueos, pendientes, riesgos y referencias.
- Se documentan hitos y decisiones, no cada línea de código.
- Sin secretos, sin datos personales, sin valores reales.
- Sin emojis, sin marcas de IA, en el idioma del repositorio.
- El agente no cierra el issue: documenta, deja el comentario resumen con enlace a la bitácora, y el cierre queda al usuario.
- Si el archivo crece mucho con el tiempo, se puede dividir por año o trimestre, pero cada división sigue siendo un archivo plano de bitácora, no una estructura de referenciados.
- Lectura completa del contexto de un issue: prohibido truncar comentarios. Se leen completos, incluidos PRs cerrados o mergeados, referencias cruzadas, issues relacionados e historial de estado. Si la herramienta trunca automáticamente, el agente lo declara y pide autorización para continuar con información parcial.

## 20. Secretos y .env.example

El detalle va en `docs/docs-agents/reglas-secretos.md`. Aplica a frontend y backend.

- Ninguna credencial en código. Todo por variables de entorno.
- `.env.example` versionado. `.env` y variantes con valores reales en `.gitignore`.
- Cada vez que se agrega, renombra o elimina una variable de entorno en el código, se refleja el cambio en el `.env.example` correspondiente en la misma tarea.
- Cada variable lleva nombre, valor de ejemplo no real o vacío, y comentario breve.
- Nunca se escribe el valor real de un secreto. Placeholders tipo `your-secret-here` o `change-me`.
- Si el repo no tiene `.env.example`, se crea al agregar la primera variable.
- El cambio del `.env.example` va en la misma rama del issue.
- Variables del frontend (`NEXT_PUBLIC_*`) sujetas a las mismas reglas.
- Gestión con gestores externos (Infisical, Vault, AWS Secrets Manager, GCP, Azure, Doppler, 1Password, Bitwarden, SOPS, sealed-secrets): inyección en runtime, nunca hardcodeo ni `.env` versionado; autenticación no interactiva con Universal Auth o Machine Identity; CI/CD con OIDC preferido o Universal Auth con secretos en GitHub Secrets; producción con Machine Identities de permisos mínimos y solo lectura; organización con `--path`, `--recursive`, `--project-config-dir` en monorepos; el archivo de configuración del gestor no contiene secretos y se puede commitear; rotación: cambiar, redesplegar y verificar. Nunca inventar comandos; consultar documentación oficial si hay duda.
- Autorización para escribir secretos por CLI o API: condición previa, solo si AGENTS.md o `docs/docs-agents/stack-tecnico.md` confirman el gestor; alcance, únicamente entorno dev (prohibido staging, prod, qa, uat); nunca imprimir el valor real en chat, logs, bitácora ni PR (solo nombre y propósito); reflejar la variable en el `.env.example`; dejar constancia en bitácora y en el body del PR; si no hay credenciales de escritura, reportar y dejar la mini-guía.
- Mini-guía obligatoria cuando se agrega una variable: nombre, para qué sirve, si es obligatoria u opcional, valor por defecto, y cómo configurarla en cada entorno.
- El subagente reviewer verifica esta sincronización al cierre.

## 21. Cookies y consentimiento

El detalle va en `docs/docs-agents/reglas-cookies.md`.

- Activación condicional: solo si el monorepo usa cookies o tecnologías similares no esenciales.
- Clasificación: estrictamente necesarias (sin banner), preferencias, analítica y marketing (con banner).
- Banner antes de instalar cookies no esenciales.
- Granularidad por categoría, botones con el mismo peso, sin patrones oscuros, sin cookie wall salvo que la ley lo permita.
- Consentimiento registrado con fecha, hora, versión y categorías.
- Enlace para cambiar o retirar el consentimiento.
- Inventario de cookies en la documentación.
- El backend respeta la elección. Registro de consentimiento en servidor o servicio confiable.
- Textos traducidos con i18n si aplica.

Resumen de UI: banner de cookies con clasificación por categoría (estrictamente necesarias, preferencias, analítica, marketing); granularidad, botones con el mismo peso, sin patrones oscuros, sin cookie wall salvo que la ley lo permita; consentimiento registrado con fecha, hora, versión y categorías; enlace para cambiar o retirar consentimiento en pie de página o en Ajustes.

## 22. Legal y cumplimiento

El detalle va en `docs/docs-agents/reglas-legal.md`.

- Aviso legal: página accesible desde el pie de página con datos del titular.
- Política de privacidad: página accesible desde el pie de página, describiendo qué datos se recogen, para qué, base legal, retención, terceros y derechos.
- Enlace desde el formulario de registro y desde el banner de cookies.
- Registro de la versión de la política aceptada por el usuario.
- Se activan solo cuando el proyecto va a producción o es comercial. En desarrollo quedan pendientes de lanzamiento.

## 23. SEO técnico

El detalle va en `docs/docs-agents/reglas-seo.md`.

- Forzar HTTPS: redirección 301, HSTS, sin contenido mixto.
- Meta títulos y descripciones únicos por página.
- Datos estructurados JSON-LD, validados con Rich Results Test.
- Sitemap y `robots.txt`.
- Ficha de Google si aplica.
- Favicon en formatos modernos.
- URLs canónicas, Open Graph, Twitter Cards y `hreflang` si aplica i18n.

## 24. Checklist de lanzamiento

El detalle va en `docs/docs-agents/checklist-lanzamiento.md`, que contiene los 20 ítems, cada uno enlazando a su regla detallada: aviso legal; política de privacidad; aviso de cookies; forzar HTTPS; meta títulos y descripciones; datos estructurados; sitemap y `robots.txt`; ficha de Google; favicon; texto alternativo en las imágenes; imágenes comprimidas; velocidad de carga optimizada; contraste de colores; que se vea bien en el móvil; página 404 personalizada; enlaces rotos arreglados; formularios protegidos contra spam; botón de WhatsApp visible (condicional); analítica instalada (condicional); y una sola llamada a la acción.

Cada ítem lleva estado (pendiente, en progreso, listo, no aplica) y una nota breve. El agente no marca un ítem como listo sin verificarlo.

## 25. Herencia

Cualquier prompt que referencie AGENTS.md hereda automáticamente estas reglas. El agente debe:

- Detectar el stack, dependencias, infraestructura, uso de IA, skills, agentes, i18n e idioma del repositorio. El detalle de qué detectar y registrar está en `docs/docs-agents/deteccion-stack.md`.
- Leer AGENTS.md completo antes de tocar cualquier archivo.
- Leer los documentos referenciados que apliquen a la tarea. Los que viven en `docs/docs-agents/` son de lectura obligatoria cuando aplican, y al inicio de la tarea se declara cuáles se van a leer y por qué.
- Cargar las skills relevantes.
- Aplicar reglas condicionales activas y todas las transversales.
- Usar librerías ya presentes antes de proponer nuevas.
- Ejecutar subagentes de validación al cierre.
- Al agregar una regla nueva, revisar primero si `AGENTS.md` está demasiado largo o si el tema ya tiene documento propio en `docs/docs-agents/`. Si lo tiene, editar ese documento; si no, crear uno nuevo en esa carpeta y referenciarlo desde `AGENTS.md`. No usar `AGENTS.md` como cajón de sastre.

AGENTS.md es la fuente única de verdad del monorepo. Cualquier documento nuevo se referencia en él. Cualquier regla nueva se declara primero en su documento referenciado antes de usarse en un prompt.

## 26. Formato de reporte al terminar una tarea

Todo reporte de cierre incluye: qué se hizo; por qué se hizo; qué cambió en cada archivo; qué pruebas se hicieron; qué quedó pendiente; si hay riesgos o cosas que revisar; en qué fase y subfase se está; el resultado de cada subagente de validación; el estado del build de producción; y la entrada en bitácora.

## 27. Notas operativas del entorno

Estas son notas operativas del usuario, no forman parte del bloque de reglas que se hereda a otros prompts.

- Copiar `bin/lupe-start` desde buybolivia en todo repositorio.
- Usar ruflo y graphify si OpenCode lo permite.
- Playwright con navegador visible en ventana normal del escritorio (WSLg en WSL), sobre Chrome en Windows, no en WSL. El navegador no se cierra solo.
- Limitaciones de Playwright: no cubre Lighthouse ni trazas de performance. Maildrop puede pedir CAPTCHA.
- Usar correos de prueba con Maildrop (maildrop.cc). Parar cuando pida captcha, resolverlo manualmente y retomar.
- Tener en VS Code las extensiones justas y necesarias.
- Revisar el tema de cuando la IA intenta enviar más de 1500 cambios por API.
- Revisar de vez en cuando el repositorio buscando rastros de IA y limpiarlos.
- El entorno es WSL sobre Windows con Ubuntu/Debian. La terminal es bash. El repositorio vive en `~/dev/tricking-monorepo`, nunca en `/mnt/c/`. Los comandos deben ser compatibles con bash de Linux.

## 28. Pendientes y mejoras futuras

Esta sección no contiene reglas activas. Contiene lo que queda fuera del alcance inicial para que futuras iteraciones sepan qué viene y no dupliquen propuestas. Nadie implementa nada de esta sección sin autorización explícita del usuario. Si una tarea futura toca un pendiente de esta sección, se abre una nueva fase en `docs/docs-agents/fases.md` y se registra el cambio. Los pendientes se priorizan por valor para el usuario, no por facilidad técnica. Cada pendiente que se resuelva se mueve de esta sección a la fase correspondiente y se elimina de aquí. El agente puede proponer nuevas ideas en cualquier momento, pero se agregan a esta sección, no se ejecutan.

### 28.1 Integración de IA en el producto (chatbot de tricking)

- Chatbot conversacional que responda preguntas sobre trucos: cómo se hace un b-twist, qué aprender después de un 540 kick, diferencia entre aerial y b-kick, entre otras.
- También debería responder preguntas sobre tips de mirada, usando la sección de Tips de la Fase 16 como base de conocimiento.
- RAG sobre las descripciones de TrickingAPI, los captions de Kojo, las notas extraídas de Loopkicks y los tips de mirada.
- Vector store recomendado: pgvector dentro del propio Neon (aprovecha el free tier, evita proveedores externos como Pinecone o Weaviate).
- Embeddings sugeridos: OpenAI text-embedding-3-small o Voyage AI voyage-3-lite (bajo costo).
- Modelo de generación sugerido: GPT-4o mini, Claude Haiku o Gemini Flash (baja latencia, bajo costo).
- Librería de integración sugerida: Vercel AI SDK (funciona bien con Next.js App Router aunque el hosting no sea Vercel).
- Rate limiting estricto, límite de tokens por usuario y control de costos por petición.
- Sanitización de prompts, validación de respuestas con Zod y prohibido ejecutar código generado.
- Trazabilidad con `trace_id` por petición y logs sin contenido sensible.
- El proveedor y los modelos elegidos se declaran en `docs/docs-agents/stack-tecnico.md` antes de integrarse.
- Requiere autorización explícita del usuario antes de empezar a construir.

### 28.2 Expansión de la sección de Tips

- Más tipos de trucos: gainer, cork, full, double full, raiz con variantes, entre otros.
- Tips por nivel: principiante, intermedio y avanzado.
- Tips de respiración y preparación mental antes del truco.
- Tips de aterrizaje y absorción de impacto.
- Tips de calentamiento específico por tipo de truco.
- Vídeos cortos demostrando cada tip (subidos a R2).
- Diagramas visuales de hacia dónde mirar en cada fase del truco.
- Modo comparación: dos tipos de truco lado a lado mostrando diferencias de mirada.

### 28.3 Skill tree de trucos y generador de combos

Sección nueva que combina un árbol de habilidades visual con un generador de combos aleatorios y un editor de combos propios. Requiere autenticación previa para persistir el progreso del usuario.

Árbol de habilidades (skill tree):

- Representación visual de los trucos como nodos de un grafo, siguiendo los prereqs y next tricks de TrickingAPI.
- Los nodos se desbloquean a medida que el usuario marca trucos que ya sabe ejecutar.
- Estados de cada nodo: bloqueado (prereqs no cumplidos), disponible (prereqs cumplidos pero no aprendido), en progreso (marcado por el usuario como aprendiendo) y aprendido (marcado por el usuario como dominado).
- Colores por estado: bloqueado en gris piedra con ícono de candado, disponible en cian eléctrico con borde punteado, en progreso en ámbar advertencia con borde sólido, y aprendido en verde esmeralda con relleno completo.
- Filtros por categoría (kicks, flips, twists, transitions), dificultad (0 a 5) y estado.
- Vista de zoom y arrastre. Navegable con teclado (Tab, flechas, Enter para marcar).
- Posibilidad de marcar un nodo como "quiero aprender" para que aparezca destacado.
- Barra de progreso global: porcentaje de trucos aprendidos sobre el total.
- Barra de progreso por categoría: cuántos trucos de cada categoría domina el usuario.
- Logros desbloqueables al cumplir hitos: primer b-twist, 10 trucos aprendidos, categoría de kicks completa, entre otros.
- Los trucos de TrickingAPI sin prereqs son los nodos raíz del árbol.
- Los trucos sin next tricks son las hojas del árbol.
- El árbol se renderiza con una librería de grafos: react-flow, d3-force o cytoscape.js. La decisión se toma en la fase de implementación y requiere autorización.

Generador de combos aleatorios:

- Genera combos usando únicamente los trucos que el usuario ya marcó como aprendidos en el skill tree.
- Considera las transiciones entre trucos para que el combo sea fluido y no termine en un truco sin conexión al siguiente.
- Longitud configurable: corto (2 a 3 trucos), medio (4 a 5 trucos) y largo (6 o más).
- Filtros opcionales: solo de una categoría, solo de cierta dificultad máxima, excluir trucos específicos.
- Botón de regenerar hasta que el usuario encuentre uno que le guste.
- Muestra cada truco con su badge de categoría y dificultad.
- Muestra las transiciones intermedias si existen.
- Al hacer clic en un truco del combo, se abre su detalle.
- Opción de copiar el combo como texto plano para compartir por chat.
- Opción de guardar el combo directamente.

Editor y guardado de combos:

- El usuario puede guardar combos generados aleatoriamente o crear los suyos desde cero.
- Editor tipo nota: lista numerada de pasos, cada paso es un truco del catálogo.
- Autocompletado al escribir el nombre del truco, con debounce de 300 ms.
- Reordenar pasos con arrastrar y soltar.
- Agregar notas personales al combo completo o a pasos individuales.
- Título y descripción opcional del combo.
- Etiquetas opcionales: categoría principal, dificultad estimada, música sugerida, entre otras.
- Estados: borrador, practicando y dominado.
- Vista de listado de combos guardados con filtros por estado y etiqueta.
- Búsqueda dentro de los combos guardados.
- Exportar combo a texto plano, markdown o ICS (calendario) si se activa esa función.
- Compartir combo por enlace público o privado (opcional, requiere decisión).
- Eliminar combo con modal de confirmación y soft delete.

Modelado de datos (referencia, se define en la fase de implementación):

- Tabla `user_trick_progress`: `user_id`, `trick_id`, `status` (locked, available, in_progress, learned, want_to_learn), `updated_at`.
- Tabla `user_achievements`: `user_id`, `achievement_id`, `unlocked_at`.
- Tabla `combos`: `id`, `user_id`, `title`, `description`, `status`, `is_public`, `created_at`, `updated_at`, `deleted_at`.
- Tabla `combo_steps`: `combo_id`, `trick_id`, `order`, `note`.
- Tabla `combo_tags`: `combo_id`, `tag`.

Requisitos previos: autenticación con Auth.js (NextAuth) y adaptador de Drizzle sobre Neon; persistencia en base de datos, no en localStorage, porque es información personal del usuario; rate limiting en los endpoints de generación de combos para evitar abuso; y cache local del skill tree con TTL de 1 día, invalidado al marcar un truco como aprendido.

Fases sugeridas si se activa:

- Fase A: autenticación y tabla de progreso.
- Fase B: skill tree visual y marcado de trucos.
- Fase C: generador de combos aleatorios.
- Fase D: editor y guardado de combos.
- Fase E: logros, estadísticas y compartición.

Requiere autorización explícita del usuario antes de empezar a construir cualquiera de estas fases.

### 28.4 Funcionalidades pendientes sugeridas por el usuario

Las que el usuario agregue durante el desarrollo, registradas con fecha y motivo.

### 28.5 Recomendaciones adicionales sugeridas por el agente

Estas son propuestas, no compromisos. El usuario decide cuáles se activan.

El feedback de usuarios (formulario, mini dashboard y aviso por correo) dejó de ser un pendiente: se programó como Fase 18 en `docs/docs-agents/fases.md`. Las entradas de abajo que lo rozan quedan como referencia, no como pendientes duplicados.

- Autenticación de usuarios: Auth.js (NextAuth) con adaptador de Drizzle y Neon. Habilitaría favoritos, progreso personal y contribuciones. Es requisito para el skill tree y los combos.
- Sistema de progreso del usuario: marcar trucos como "quiero aprender", "en progreso" o "aprendido". Persistir en base de datos, no en localStorage. Es la base del skill tree.
- Favoritos y colecciones: agrupar trucos en listas personalizadas, exportables.
- Timeline de progresión: vista que muestra el camino prereq, truco y next tricks de forma visual.
- Comparación de trucos side by side: dos trucos en paralelo con sus vídeos y diferencias técnicas resaltadas.
- Modo entrenamiento o rutinas: generar sesiones de práctica según el nivel y los objetivos del usuario, incorporando tips de mirada relevantes.
- Contribuciones de usuarios: permitir subir clips propios de trucos, con moderación previa antes de publicarse.
- Notificaciones por correo: Resend o SendGrid. Su primera activación es el aviso de feedback nuevo de la Fase 18; otras notificaciones siguen condicionadas a la autenticación.
- Notificaciones push: Web Push API para recordatorios de práctica.
- PWA: manifest, service worker y funcionamiento offline básico con cache del catálogo y de los tips.
- Analítica: Umami (self-hosted o cloud free tier) o PostHog (free tier generoso). Sin cookies de terceros ni trackers invasivos.
- Búsqueda por timestamps en vídeos: marcar momentos clave dentro de cada vídeo tutorial y saltar a ellos.
- Internacionalización ampliada: agregar portugués, francés o japonés según demanda real.
- Modo presentación o kiosk: vista a pantalla completa para gimnasios o eventos.
- Exportar rutinas a calendario: formato ICS para integración con Google Calendar o similares.
- API pública para terceros: exponer endpoints de solo lectura con rate limiting y API keys.
- Comunidad ligera: comentarios por truco con moderación y antispam (Akismet o similar). La parte de feedback de usuarios se cubre en la Fase 18.
- Traducción automática de captions de Kojo: si el usuario decide soportar más idiomas en el contenido del scraper.
- Modo contraste para vídeos claros: overlay automático cuando el vídeo tiene fondo blanco y el modo del sitio es oscuro.

### 28.6 Cosas que explícitamente NO se hacen por ahora

- No hay SMS ni validación por teléfono.
- No hay pagos ni suscripciones.
- No hay app nativa móvil (solo web responsive y PWA si se activa).
- No hay integración con wearables.
- No hay marketplace ni venta de contenido.
- No hay multi-tenant ni equipos.
- No hay integración con calendarios de terceros (solo exportación ICS si se activa).

Reglas de esta sección: el agente no implementa nada de esta sección sin autorización explícita del usuario; si alguna tarea futura toca un pendiente, se abre una nueva fase en `docs/docs-agents/fases.md` y se registra el cambio; los pendientes se priorizan por valor para el usuario, no por facilidad técnica; cada pendiente resuelto se mueve de esta sección a la fase correspondiente y se elimina de aquí; y el agente puede proponer nuevas ideas en cualquier momento, pero se agregan a esta sección, no se ejecutan.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
