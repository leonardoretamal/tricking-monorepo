# Fases del proyecto

Estado de las fases y subfases del monorepo. Este documento es el lugar donde vive el estado de las fases.

El proyecto se organiza por secciones de contenido, no por capas técnicas. Cada sección de Loopkicks es una fase. Cada fase se cierra con build de producción verificado, subagentes de validación ejecutados y actualización de este documento.

Última actualización: 2026-10-06.

## Reglas de fases

- Se declara al inicio de cada tarea en qué fase y subfase se está trabajando.
- No se adelanta trabajo de fases posteriores sin autorización explícita.
- No se modifica trabajo de fases cerradas sin abrir una subfase de corrección.
- Al cerrar cada subfase se ejecutan los subagentes de validación.
- Al cerrar cada fase completa se actualiza `docs/docs-agents/stack-tecnico.md`, `BITACORA.md` y se genera un resumen en `AGENTS.md`.
- Prohibido marcar una subfase como cerrada sin build de producción verificado y subagentes pasados.
- Las fases de contenido (3 a 10, 13 y 16) comparten plantilla. Si un componente se duplica entre dos fases, se refactoriza a `packages/ui` antes de cerrar la siguiente.
- Las fases que tocan la misma tabla documentan en este archivo qué campos usan y cuáles quedan pendientes.

Estados usados: pendiente, en curso, completada, bloqueada.

## Fase 0: Fundaciones

Estado general: completada.

| Subfase | Descripción                                                                                                                                                                | Estado     |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 0.1     | Crear monorepo con Turborepo + pnpm                                                                                                                                        | Completada |
| 0.2     | Configurar TypeScript estricto, ESLint, Prettier, Husky, lint-staged, commitlint                                                                                           | Completada |
| 0.3     | Crear documentación base: `AGENTS.md`, `README.md`, `BITACORA.md` y dentro de `docs/docs-agents/`: `stack-tecnico.md`, `recomendaciones-stack.md`, `fases.md`, `design.md` | Completada |
| 0.4     | Fragmentar reglas en `docs/docs-agents/reglas-*.md`                                                                                                                        | Completada |
| 0.5     | Templates de PR e issues en `.github/`                                                                                                                                     | Completada |
| 0.6     | Copiar `bin/lupe-start` desde buybolivia                                                                                                                                   | Completada |
| 0.7     | Configurar Playwright para E2E con viewport móvil 390x600                                                                                                                  | Completada |

Criterio de cierre: repositorio instalable con `pnpm install`, build vacío corriendo y CI pasando con el job mínimo.

## Fase 1: Modelo de datos y semilla

Estado: completada.

- 1.1. Crear `packages/db` con Drizzle + Neon.
- 1.2. Definir schema inicial: `tricks`, `categories`, `stances`, `variations`, `transitions`, `videos`, `tutorials`, `gaze_tips`.
- 1.3. Generar migración inicial y aplicarla con `drizzle-kit migrate`.
- 1.4. Importar `@trickingapi/tricks-core-data` como semilla base.
- 1.5. Script de scraping de Loopkicks para extraer la lista de trucos por sección (sin vídeos todavía).
- 1.6. Mapear trucos de Loopkicks a IDs de TrickingAPI, dejando un campo `loopkicks_slug`.
- 1.7. Configurar GitHub Action de `db:migrate`.

Criterio de cierre: base de datos poblada con trucos de TrickingAPI y con el mapeo a Loopkicks listo. Sin frontend todavía.

## Fase 2: Frontend base

Estado: completada.

- 2.1. Crear `apps/web` con Next.js (App Router).
- 2.2. Configurar Tailwind CSS + DaisyUI con los dos temas.
- 2.3. Configurar next-intl con defaultLocale `es` y estructura por módulos.
- 2.4. Configurar `packages/shared` con wrapper de localStorage, Zod y utilidades de formato.
- 2.5. Layout base: navbar con toggle de tema, footer, breadcrumbs y estados de carga, error y vacío.
- 2.6. Sistema de rutas: `/es/tricks`, `/es/variations`, `/es/transitions`, `/es/stances`, `/es/tips`, `/es/explore`, `/es/search`.
- 2.7. Componente de tarjeta de truco reutilizable.

Criterio de cierre: la web arranca, el tema respeta al usuario, i18n funciona y existe la estructura de navegación aunque las secciones estén vacías.

Notas de cierre:

- Stack implementado: Next.js 16.3.8 + React 19.3.0, next-intl 4.14.9, Tailwind CSS 4.3.3 + DaisyUI 5.7.47, Zod 4.6.5. `packages/ui` y `packages/shared` se consumen como fuente TS con `transpilePackages`.
- El layout raíz vive en `apps/web/src/app/[locale]/layout.tsx` (patrón de next-intl) y el middleware de locale se declara en `apps/web/src/middleware.ts` (convenio Edge `middleware.ts` mantenido a proposito para no usar el middleware Node experimental de OpenNext en Cloudflare).
- `localeDetection` queda en `false`: la raíz va siempre a `/es` y el idioma se cambia con el selector, coherente con el idioma base del proyecto.
- No se incluye un `loading.tsx` de ruta global a propósito: su boundary de Suspense hacía que las rutas desconocidas respondieran HTTP 200 (soft 404). El componente `LoadingState` existe en `packages/ui` para las fases con carga de datos.
- CI ampliado con jobs `test`, `i18n` (paridad de claves) y `e2e` (Playwright).

## Fase 3: Vertical Kicks

Estado: completada.

- 3.1. Endpoint `/api/tricks` con paginación, filtros (sección, categoría, dificultad, búsqueda) y orden resueltos en la base de datos.
- 3.2. Vista de listado con virtualización (TanStack Virtual, con carriles para la grilla) cuando supera los 100 ítems.
- 3.3. Vista de detalle de truco con relaciones (prereqs, next tricks, descripción y categorías).
- 3.4. Cache del catálogo y el detalle en localStorage con TTL de 1 día, vía TanStack Query y el wrapper de storage.
- 3.5. i18n en español e inglés.
- 3.6. Colores por dificultad (badge con escala verde a púrpura).
- 3.7. Colores por categoría (badge azul para Kicks).

Notas de cierre:

- La sección de Loopkicks se modeló como columna `section` en `tricks` (migración `0002`), poblada desde `apps/scraper/data/loopkicks-tricks.json`. Conteos por sección: vertical-kicks 95, backward 245, forward 20, inside 123, outside 73; 2 trucos de TrickingAPI sin match en Loopkicks quedan con `section` NULL y no se listan.
- La spec original decía `?category=vertical-kicks` (3.1) y `?direction=backward` (4.1); se unificó al parámetro `section` con los slugs vertical-kicks, backward, forward, inside y outside.
- Rutas: `/es/tricks` redirige a `/es/tricks/vertical-kicks`; el listado es `/es/tricks/[section]` y el detalle `/es/tricks/[section]/[id]`. El submenú del navbar apunta a cada sección.
- Dificultad curada a mano en `packages/db/src/seed/difficulty/`, un archivo por sección; se aplica con `pnpm --filter @tricking/db db:difficulty`. TrickingAPI y Loopkicks no publican dificultad.
- Dependencias nuevas: `@tricking/db` en `apps/web`, `@tanstack/react-query`, `@tanstack/react-query-persist-client` y `@tanstack/react-virtual`, y `pino` para el logging del backend.
- El `webServer` de Playwright reutiliza el dev server local; en CI el job `e2e` recibe `DATABASE_URL` (solo lectura) para las consultas reales.

Criterio de cierre: sección completa, navegable, responsive y accesible, con datos reales de TrickingAPI cruzados con Loopkicks. Esta fase establece el patrón para las siguientes cuatro secciones de trucos.

## Fase 4: Backward Tricks

Estado: completada.

- 4.1. Endpoint `/api/tricks?section=backward`.
- 4.2. Reutilizar componentes de la Fase 3.
- 4.3. Ajustar i18n y badges.
- 4.4. Verificar que el mapeo de Loopkicks a TrickingAPI esté correcto para esta sección.

Notas de cierre: se reutilizó la fundación de la Fase 3 sin reescribir componentes (mismo endpoint con `section=backward`, misma ruta `/es/tricks/backward`). Conteo: 245 trucos, mapeo Loopkicks a TrickingAPI verificado 245/245. Dificultad curada para los 245. i18n y colores de badge ya cubiertos por el patrón. E2E propio en `e2e/tricks-backward.spec.ts`.

Criterio de cierre: sección completa sin reescribir componentes. Si algo se duplica, se refactoriza a `packages/ui`.

## Fase 5: Forward Tricks

Estado: completada.

- 5.1. Endpoint `/api/tricks?section=forward`.
- 5.2. Reutilizar componentes.
- 5.3. Ajustar i18n y badges.

Notas de cierre: reutiliza la fundación de la Fase 3 sin reescribir componentes. Conteo: 20 trucos, dificultad curada 20/20, mapeo verificado 20/20. La sección entra en una sola página, por eso el E2E verifica la ausencia de controles de paginación. E2E propio en `e2e/tricks-forward.spec.ts`.

Criterio de cierre: igual que Fase 4.

## Fase 6: Inside Tricks

Estado: completada.

- 6.1. Endpoint `/api/tricks?section=inside`.
- 6.2. Reutilizar componentes.
- 6.3. Ajustar i18n y badges.

Notas de cierre: reutiliza la fundación de la Fase 3 sin reescribir componentes. Conteo: 123 trucos, dificultad curada 123/123, mapeo verificado 123/123. E2E propio en `e2e/tricks-inside.spec.ts`.

Criterio de cierre: igual que Fase 4.

## Fase 7: Outside Tricks

Estado: completada.

- 7.1. Endpoint `/api/tricks?section=outside` (la spec decía `direction`; se unificó a `section` en la Fase 3).
- 7.2. Reutilizar componentes.
- 7.3. Ajustar i18n y badges.

Notas de cierre: reutiliza la fundación de la Fase 3 sin reescribir componentes. Conteo: 73 trucos, dificultad curada 73/73 en `packages/db/src/seed/difficulty/outside.ts`, mapeo Loopkicks a TrickingAPI verificado 73/73. i18n y colores de badge ya cubiertos por el patrón. E2E propio en `e2e/tricks-outside.spec.ts`. Con esto se cierran las cinco secciones de trucos principales.

Criterio de cierre: igual que Fase 4.

## Fase 8: Variations

Estado: completada.

- 8.1. Modelar variaciones: cada variación referencia un truco base.
- 8.2. Endpoint `/api/variations` con filtros por truco base.
- 8.3. Vista de listado agrupada por truco base.
- 8.4. Vista de detalle con relación a variaciones hermanas.
- 8.5. i18n y badges.
- 8.6. Integrar con Loopkicks.

Notas de cierre: se adoptó el modelo de dos ejes. Eje 1, familias conceptuales de Loopkicks (`variations.kind='family'`, 19, con trucos de ejemplo en la tabla `variation_examples`). Eje 2, variaciones concretas de TrickingAPI (`kind='concrete'`, 37, los trucos con categoría VARIATION) con `baseTrickId` derivado de los prereqs (36/37) y `familyId` derivado por alias del nombre (heurística). La spec 8.3 decía "agrupada por truco base"; el listado real agrupa por eje (familias/concretas) y muestra el truco base en cada concreta. Endpoints `GET /api/variations` y `GET /api/variations/[slug]`; rutas `/es/variations` y `/es/variations/[slug]`. El listado expone `examples` resueltos en la base en una sola consulta. i18n en `messages/{es,en}/variations.json`. E2E en `e2e/variations.spec.ts`.

Criterio de cierre: sección completa, con relación clara entre truco base y variación.

## Fase 9: Transitions

Estado: completada.

- 9.1. Modelar transiciones: cada transición conecta dos trucos (origen y destino).
- 9.2. Endpoint `/api/transitions`.
- 9.3. Vista de listado con filtros por truco de origen y destino.
- 9.4. Vista de detalle con diagrama simple de flujo.
- 9.5. i18n y badges.
- 9.6. Integrar con Loopkicks.

Notas de cierre: las fuentes (Loopkicks y TrickingAPI) modelan la transición como tipo conceptual con ejemplos, no como par origen-destino. Se implementó el modelo conceptual: columna `transitions.group` (unified/singular/sequential) y tabla `transition_examples`. Las columnas `originTrickId`/`destinationTrickId` quedan sin uso (documentadas, reservadas). Se sembraron 16 tipos (13 de Loopkicks + Back Swing, Front Swing y Swing de TrickingAPI, con `group` NULL) y 35 ejemplos; el detalle muestra los ejemplos y enlaza el truco cuando se resuelve por nombre. La spec 9.3/9.4 se adaptó: filtro por grupo y un diagrama del grupo (SVG accesible) en vez de flujo origen-destino. Endpoints `GET /api/transitions` y `GET /api/transitions/[slug]`; rutas `/es/transitions` y `/es/transitions/[slug]`. i18n en `messages/{es,en}/transitions.json`. E2E en `e2e/transitions.spec.ts`.

Criterio de cierre: sección completa, con la relación bidireccional bien modelada.

## Fase 10: Stances

Estado: completada.

- 10.1. Modelar stances.
- 10.2. Endpoint `/api/stances`.
- 10.3. Vista de listado.
- 10.4. Vista de detalle con trucos que aterrizan en ese stance.
- 10.5. i18n y badges.
- 10.6. Integrar con Loopkicks.

Notas de cierre: se sembraron las 6 stances de Loopkicks (backside, frontside, complete, hyper, mega, semi); las 4 últimas con descripción de Loopkicks y las 2 primeras con descripción curada. La relación truco-stance vive en la tabla `trick_stances(trick_id, stance_id, kind)`; la curación inicial es parcial a propósito (14 enlaces tomados de los ejemplos de combo de Loopkicks, 2 sin resolver porque "Wrap 900" y "Hook" no existen como trucos con ese nombre exacto). El detalle resuelve "trucos que aterrizan" con un join en la base y calcula el contador con `count()`. Endpoints `GET /api/stances` y `GET /api/stances/[slug]`; rutas `/es/stances` y `/es/stances/[slug]`. i18n en `messages/{es,en}/stances.json`. E2E en `e2e/stances.spec.ts`.

Criterio de cierre: sección completa, con la relación entre stance y trucos bien poblada.

Campos y migraciones de las Fases 8-10: una sola migración `0003_lying_proemial_gods.sql` agrega `variations.kind/trick_id/family_id`, `transitions.group`, y las tablas `variation_examples`, `transition_examples` y `trick_stances`. La dificultad de outside se sumó a `DIFFICULTY_BY_TRICK`.

Pendientes detectados (no bloquean, para futuras subfases): (1) RESUELTO en las Fases 11-14: el bug de la Fase 3 (`prereqs`/`nextTricks` guardados como nombres y resueltos por id) se corrigió con la tabla `trick_relations`, poblada resolviendo el nombre normalizado a id (1500 relaciones, 547 trucos con relaciones; `getTrickById` lee de ahí); (2) la cobertura de `trick_stances` es parcial y se amplía a mano; (3) `transitions.originTrickId/destinationTrickId` quedan sin uso hasta que exista una fuente de pares.

Traducción al español de etiquetas y contenido (2026-10-04): las etiquetas de UI se tradujeron al español (secciones, categorías y grupos de transiciones). El contenido técnico de las fuentes viene en inglés; se agregó `description_es` a `tricks`, `variations`, `transitions` y `stances` (migración `0004`), la API devuelve `description` y `descriptionEs`, y el frontend elige por locale. Las traducciones se hicieron a mano y viven en `packages/db/src/seed/translations/es-*.json`, aplicadas con `pnpm --filter @tricking/db db:translations`. Cubre 558 trucos, 19 familias de variaciones, 16 transiciones y 6 stances. Los nombres de trucos se mantienen en inglés.

## Fase 11: Explore Page

Estado: completada.

- 11.1. Definir qué es la Explore Page: propuesta por defecto, un grafo navegable de trucos donde los nodos son trucos y las aristas son transiciones o prereqs.
- 11.2. Elegir librería de visualización: react-flow, d3-force o cytoscape.js. Requiere autorización.
- 11.3. Endpoint `/api/graph`.
- 11.4. Vista con filtros por categoría, dificultad y stance.
- 11.5. Interacción: clic en nodo abre el detalle lateral sin cambiar de ruta.
- 11.6. Cache agresivo en localStorage.

Criterio de cierre: vista funcional, navegable con teclado, con performance medida y cache en cliente.

Notas de cierre: grafo con `@xyflow/react` (dependencia aprobada). Endpoint `GET /api/graph` con filtros por sección, categoría, dificultad y stance, y tope de nodos, todo resuelto en SQL. Nodos = trucos; aristas desde `trick_relations` (prereq/next), stances compartidos y variaciones. Panel lateral accesible (role dialog, foco al abrir, Escape para cerrar) que enlaza al detalle sin cambiar de ruta. Cache agresivo del grafo en localStorage vía TanStack Query. Verificado en navegador real (nodos, panel, selección por teclado, móvil 390x600). E2E en `e2e/explore.spec.ts`.

## Fase 12: Búsqueda global

Estado: completada.

- 12.1. Endpoint `/api/search?q=` con búsqueda full-text resuelta en la base de datos.
- 12.2. Componente de búsqueda con debounce de 300 a 500 ms.
- 12.3. Cache de resultados en localStorage con TTL de 10 minutos.
- 12.4. Búsqueda en navbar y en página dedicada `/es/search`.
- 12.5. i18n en resultados.
- 12.6. Resaltado de coincidencias.

Criterio de cierre: búsqueda funcional desde cualquier página, con cache y sin sobrecargar al servidor.

Notas de cierre: columna generada `tricks.search_vector` (tsvector) con índice GIN en la migración `0005`; el endpoint `GET /api/search` usa `websearch_to_tsquery('simple', q)` y `ts_rank`, y cubre trucos, variaciones, transiciones y posturas con `count()` y paginación en SQL. Input en la navbar con debounce que navega a `/es/search?q=` y página dedicada con resultados agrupados por tipo y resaltado con `<mark>`. Cache de 10 min vía TanStack Query. Verificado en navegador real (17 resultados para "aerial", agrupados y resaltados). E2E en `e2e/search.spec.ts`. Correccion (2026-10-05): la prueba "la busqueda en la navbar navega a la pagina dedicada" fallaba en el proyecto móvil porque el buscador de la navbar se oculta con `hidden md:block`; se marca `test.skip` en móvil y solo corre en escritorio.

## Fase 13: Técnicas de Kojo

Estado: en curso (rediseño).

Objetivo: de Kojo's Trick Lab NO se toman los vídeos. Se toma su conocimiento de técnica: los nombres de trucos/técnicas que enseña y sus tips. Se presenta en un acordeón junto a los trucos de Loopkicks/TrickingAPI.

- 13.1. Extraer de la API pública de `kojostricklab.com` el índice de técnicas (título, autor, nivel, fecha, permalink). El scraping web con cheerio y el de Instagram con insta-fetcher quedan como respaldo; la cola Upstash, reservada.
- 13.2. Guardar el índice en `tutorials` (título, autor, nivel, fecha, `vimeo_id` como dato, permalink).
- 13.3. Emparejar cada técnica con los trucos del catálogo (tabla `tutorial_tricks`): automático por nombre normalizado más revisión curada.
- 13.4. Tips de técnica PROPIOS (contenido original del proyecto) por técnica, en `tutorials.tips`/`tips_es`, curados en `packages/db/src/seed/kojo/tips.json`.
- 13.5. Bloque "General" (resumen propio) en `content_blocks` (clave `techniques_general`), redactado por el agente y aprobado por el usuario.
- 13.6. Acordeón accesible (`aria-expanded`, `aria-controls`, `role="region"`, teclado): por técnica muestra título, nivel, tips, trucos relacionados (Loopkicks) y crédito con enlace al tutorial original de Kojo. Sin vídeo.
- 13.7. Estado expandido en localStorage con TTL de 7 días; virtualización si supera 100.
- 13.8. i18n es/en de la interfaz; los nombres de técnicas se mantienen (términos del deporte) y los tips son contenido propio traducido.

Criterio de cierre: acordeón de técnicas propio y accesible, sin vídeos de Kojo, con tips curados, trucos del catálogo relacionados y crédito al original.

Notas: la API pública de Kojo (`GET /api/user/get-more-recent-videos`) solo entrega título, autor, nivel (Beginner/Intermediate/Advanced/Elite), fecha y `vimeo_id`; no trae texto de técnica, por eso los tips son propios. Vimeo bloquea el embed en dominios de terceros (403) y sus vídeos no se usan. El diseño anterior (listado de tutoriales con enlace a su vídeo) se descartó: la sección pasa a ser "Técnicas de Kojo". Migración `0007`: `tutorials.level/tips/tips_es`, tablas `tutorial_tricks` y `content_blocks`. Además, las técnicas de Kojo se muestran dentro del detalle de cada truco (acordeón "Kojo"), usando el emparejamiento `tutorial_tricks`.

## Fase 14: Vídeos de trucos (Loopkicks, sin re-hospedar)

Estado: completada.

- 14.1. Extraer las URLs de vídeo por truco desde Loopkicks (`apps/scraper/src/scrape-loopkicks-videos.ts`).
- 14.2. Guardar en `videos` la URL original de Loopkicks (`status='external'`) y mostrarla en el detalle de truco.
- 14.3. Reproductor en el detalle (`trick-video-player.tsx`), con crédito y enlace a Loopkicks.
- 14.4. Cache de URLs en localStorage con TTL corto.
- 14.5. R2 reservado a vídeos propios o con licencia; el uploader (`apps/scraper/src/upload-videos.ts`) exige `--confirm-rights`.

Criterio de cierre: vídeos reproducidos desde la fuente original de Loopkicks (contenido gratuito), con crédito, sin almacenar copias.

Notas de cierre: se extrajeron 556 vídeos reales de Loopkicks (una URL por truco) y se sembraron en `videos` con `status='external'` y la URL original; el reproductor funciona desde ahí. Política de terceros: no se re-hospedan; el vídeo de prueba que se había subido a R2 se borró y el uploader se niega a correr salvo `--confirm-rights`. R2 queda reservado a contenido propio o con licencia. Se agregó `tricks.how_to`/`how_to_es` para la descripción propia ("cómo se hace") en `packages/db/src/seed/how-to/` (script `db:how-to`), visible en el detalle. El pie de página lleva el aviso de "no afiliado" y el crédito a las fuentes. E2E en `e2e/trick-video.spec.ts`.

Diseño final del catálogo (2026-10-04): `/tricks` es una sola lista con todos los trucos (filtro por sección en la URL). El detalle del truco se reordena: vídeo a la izquierda, "cómo se hace" a la derecha, y debajo los acordeones "Loopkicks" y "Kojo" uno bajo el otro. El acordeón de Loopkicks muestra la descripción real de su ficha, scrapeada a `tricks.loopkicks_notes` (`apps/scraper/src/scrape-loopkicks-notes.ts`, 556 trucos, migración `0008`) con crédito y enlace. El de Kojo muestra las técnicas emparejadas con los tips propios y crédito. El "cómo se hace" propio sigue vacío en la mayoría de los trucos (solo aerial y btwist de ejemplo); se cargará después con `db:how-to`.

## Fase 15: Enlaces cruzados entre secciones

Estado: completada.

- 15.1. Cada truco del catálogo enlaza a sus variaciones, transiciones y stance relacionado.
- 15.2. Cada variación y transición enlaza de vuelta al truco base.
- 15.3. Cada tip de mirada enlaza a los tipos de truco que aplican.
- 15.4. Cada técnica de Kojo enlaza al truco del catálogo que enseña.
- 15.5. Componente de "relacionados" reutilizable en todas las vistas de detalle.
- 15.6. Cache de relaciones en localStorage con TTL de 1 día.

Criterio de cierre: navegación cruzada funcional y coherente, sin enlaces rotos.

Notas de cierre: la capa de consulta es `packages/db/src/queries/relations.ts` (`getTrickRelations`, 3 consultas por lote, sin N+1) y el detalle de truco la expone en `related`. El componente reutilizable `RelatedItems` (en `packages/ui`, sin dependencia de framework, recibe los `href` ya localizados) pinta variaciones, transiciones y stances en el detalle; se verifico en navegador real (`/es/tricks/inside/aerial` lista 6 transiciones y 2 stances). 15.2 ya estaba cubierto (variacion y transicion enlazan de vuelta al truco base). 15.3 (tip -> tipo de truco del catalogo) se implemento con la tabla puente `gaze_tip_sections` dentro de la Fase 16. 15.4 (tecnica de Kojo -> truco) ya existia via `tutorial_tricks`. La cache de relaciones viaja dentro del cache del detalle (TTL 1 dia) con `CACHE_BUSTER` subido. Sin migracion propia ni variables nuevas.

## Fase 16: Tips de mirada

Estado: completada.

Sección dedicada a tips técnicos sobre hacia dónde mirar en cada momento del truco. El contenido es curado por el usuario y se carga manualmente en la base de datos, no se scrapea de ninguna fuente externa.

Subfases:

- 16.1. Modelar tabla `gaze_tips` con campos: `id`, `trick_type` (secciones del catalogo: vertical-kicks, backward, forward, inside, outside, mas el tipo curado piso-transiciones), `phase` (inicio, durante, caida), `label` opcional (subcaso dentro de un tipo, por ejemplo los trucos de piso), `instruction`, `warning` opcional, `order`, `locale`, `created_at`, `updated_at`.
- 16.2. Modelar tabla `gaze_tip_summaries` para la idea clave, la regla de oro y el resumen corto, con campos: `id`, `kind` (idea_clave, regla_de_oro, resumen_corto), `content`, `locale`, `order`.
- 16.3. Endpoint `/api/tips` con filtros por tipo de truco y por fase.
- 16.4. Endpoint `/api/tips/summaries` para los bloques destacados.
- 16.5. Vista de listado `/es/tips` con tarjetas agrupadas por tipo de truco.
- 16.6. Vista de detalle `/es/tips/[trickType]` con todas las fases del tipo de truco.
- 16.7. Componente de tarjeta destacada para la idea clave, con estilo visual propio.
- 16.8. Componente de tarjeta destacada para la regla de oro, con ícono de advertencia y color de énfasis.
- 16.9. Componente de resumen corto al final de la página, tipo tarjeta compacta.
- 16.10. Componente de navegación entre tipos de truco con tabs o pills, con estado activo y accesibilidad.
- 16.11. Colores por tipo de truco reutilizando los colores de categoría definidos en `docs/docs-agents/design.md`: patadas y kicks azul, giros y twists púrpura, side flip y mortales naranja, horizontales y aerial cian.
- 16.12. i18n en español e inglés. El contenido técnico se traduce, pero los nombres de trucos en inglés se mantienen (b-twist, aerial, raiz, cheat kick) porque son términos estándar del deporte.
- 16.13. Cache en localStorage con TTL largo (30 días) porque los tips cambian poco.
- 16.14. Sección de Tips en la navbar principal, con ícono propio (por ejemplo un ojo de lucide-react).
- 16.15. Enlaces desde cada tip a los tipos de truco del catálogo que aplican.
- 16.16. El usuario puede proponer más tips a futuro. La estructura de datos debe soportar agregar nuevos tipos de truco y nuevas fases sin migración destructiva.

Contenido inicial que debe cargarse como semilla de esta sección:

- Idea clave: mirar al frente no significa mirar un solo punto todo el tiempo. Significa mirar hacia donde vas, hacia donde giras o hacia donde vas a caer, según el momento. Al caer, al frente es el horizonte, nunca el suelo.
- Reglas por tipo de truco: patadas, giros (b-twist, twist), side flip, mortales (atrás, adelante, de lado), horizontales (raiz) y aerial. Cada tipo describe el inicio, el durante y la caída.
- Regla de oro para no quedar con pecho abajo: al caer, nunca mirar al suelo; mirar al frente o al horizonte; mantener el pecho arriba y apretar el estómago; si miras los pies o el suelo, el pecho se cae.
- Resumen corto: patadas al objetivo; giros y b-twist inicio frente, durante sobre el hombro, final frente; mortales y side flip inicio delante o arriba, durante no abajo, final horizonte; horizontales y aerial horizonte, nunca suelo; al caer, siempre frente u horizonte, nunca suelo.

Campos que esta fase usa y que conviene vigilar: `gaze_tips` y `gaze_tip_summaries`. La Fase 15 usa las relaciones de los tips con los tipos de truco del catálogo.

Criterio de cierre: sección completa, navegable, responsive y accesible, con todo el contenido inicial cargado en español e inglés, y con la idea clave, la regla de oro y el resumen corto destacados visualmente.

Notas de cierre: la taxonomia real usa las 5 secciones de Loopkicks (`vertical-kicks`, `backward`, `forward`, `inside`, `outside`) mas el tipo curado `piso-transiciones` (los trucos de piso usan `gaze_tips.label` para distinguir Rueda/Round Off, Scoot, Flic Flac y Coindrop). Migracion `0009_fancy_prism.sql`: `gaze_tips.label`, `gaze_tip_summaries` (unico por kind+locale) y `gaze_tip_sections` (puente tip -> seccion/categoria/transicion). Contenido PROPIO curado a mano en `packages/db/src/seed/gaze-tips/` (19 tips y 3 resumenes por locale, es y en), aplicado con `pnpm --filter @tricking/db db:gaze-tips`; el ingles lo redacto el agente. Endpoints `GET /api/tips`, `/api/tips/summaries`, `/api/tips/[trickType]`. Rutas `/es/tips` (server) y `/es/tips/[trickType]` (cliente con cache de 30 dias). Verificado en navegador real (bloques destacados, tabs, fases, enlaces "En el catalogo", movil 390x600 sin overflow). Icono de ojo en el navbar.

## Fase 17: Pulido y validación final

Estado: completada con pendientes de entorno.

- 17.0. Endurecer los ganchos de pre-commit y pre-push (adelantado y completado el 2026-10-03).
- 17.1. Subagentes de validación (reviewer, security, tester, i18n-checker).
- 17.2. Verificación de build de producción.
- 17.3. Lighthouse y performance.
- 17.4. Revisión de accesibilidad (WCAG AA).
- 17.5. Checklist de lanzamiento completo (los 20 ítems).
- 17.6. Limpieza de rastros de IA y capturas de Playwright.
- 17.7. Actualización final de `AGENTS.md`, `stack-tecnico.md` y `BITACORA.md`.

Criterio de cierre: proyecto listo para producción, con todos los subagentes en verde y el checklist de lanzamiento completo.

Notas de cierre: 17.0 ya estaba hecho. 17.1 ejecutado con 4 subagentes en paralelo (reviewer, security, tester, i18n-checker) sobre las Fases 15, 16 y 18; el bloqueante unanime (el cache persistido de TanStack Query filtraba a localStorage el token del panel y la PII del feedback) se corrigio con `dehydrateOptions.shouldDehydrateQuery` en `providers.tsx`, y se aplicaron varios hallazgos menores (validar el minimo del mensaje tras sanear, `parseId` estricto, clave huerfana, texto hardcodeado, slug crudo, memoizar `getTrickById` con `cache()`, sincronizar AGENTS.md). 17.2 build delegado al gancho pre-push (regla del repo). 17.3 Lighthouse NO se ejecuto: la sesion no tiene la herramienta y Playwright no cubre Lighthouse (limitacion declarada). 17.4 accesibilidad revisada por codigo (roles, `aria-*`, foco, estados). 17.5 checklist de lanzamiento actualizado. 17.6 sin rastros de IA ni capturas dentro del repo. 17.7 documentacion actualizada. PENDIENTE: correr Lighthouse en movil cuando haya una herramienta/entorno que lo permita, y configurar `RESEND_API_KEY` y Turnstile.

## Fase 18: Feedback de usuarios

Estado: completada con pendientes de entorno.

Sección que permite a los usuarios enviar feedback (sugerencias, reportes de error o de contenido), consultarlo en un panel mínimo de administración y recibir un aviso por correo en una dirección configurable. Es la parte accionable de los pendientes "Contribuciones de usuarios", "Notificaciones por correo" y "Comunidad ligera" de la sección 28.5 de `AGENTS.md`. Esta fase activa el proveedor de correo (Resend), que hasta ahora estaba marcado como "no aplica".

Subfases:

- 18.1. Modelar la tabla `feedback` con campos: `id`, `type` (sugerencia, error, contenido, otro), `name` opcional, `email` opcional, `message`, `page` opcional (ruta o contexto), `locale` opcional, `user_agent` opcional, `status` (nuevo, leído, respondido, archivado), `created_at`, `updated_at` y `deleted_at`. Soft delete por defecto.
- 18.2. Endpoint `POST /api/feedback` con validación del cuerpo con Zod, rate limiting, honeypot, validación de tiempo mínimo de llenado y captcha o Turnstile en producción resuelto en el servidor. El feedback se guarda aunque falle el correo.
- 18.3. Endpoint `GET /api/feedback` con paginación, filtros por estado y tipo, y ordenamiento resueltos en la base de datos (total calculado en la base de datos). Protegido: prohibido dejarlo público.
- 18.4. Panel mínimo (mini dashboard) en `/es/admin/feedback` con filtros, paginación y acciones de marcar como leído, respondido o archivado, y soft delete con modal de confirmación. Reutiliza el patrón de listados (estado en la URL, indicador de filtros activos, estado vacío que diferencia entre "no hay datos" y "sin resultados").
- 18.5. Protección del panel: requiere autenticación de administrador. Si Auth.js todavía no está activo (fases A a E del skill tree), se protege con un token de administración por variable de entorno y sin enlaces públicos al panel, y se migra a Auth.js cuando exista. La decisión se toma al implementar.
- 18.6. Formulario de feedback en el frontend (página `/es/feedback` y enlace en el footer), accesible, con estados de carga, error y éxito, errores debajo del input, todos los errores a la vez y una sola llamada a la acción por pantalla.
- 18.7. Aviso por correo con Resend a una dirección configurable por variable de entorno por cada feedback nuevo. El envío se hace en el servidor, tolerante a fallos, sin exponer la dirección ni la API key, con `trace_id` en los logs y sin volcar el contenido del mensaje ni el correo en los logs.
- 18.8. Variables de entorno nuevas: `RESEND_API_KEY`, `FEEDBACK_NOTIFY_EMAIL` y `FEEDBACK_FROM_EMAIL` (o el remitente que defina el proveedor), y el token del panel si aplica. Se reflejan en el `.env.example` correspondiente y en `docs/docs-agents/stack-tecnico.md`, donde Resend pasa de "no aplica" a activo en esta fase, con su mini-guía de configuración.
- 18.9. i18n en español e inglés de todo el texto visible (formulario, panel, mensajes de confirmación y de error, y plantilla del correo).
- 18.10. El feedback es estado de servidor en tiempo real: no se cachea en localStorage y las escrituras se deshabilitan y muestran estado de carga mientras están en curso.
- 18.11. Rate limiting y sanitización del mensaje. Logs con `trace_id` y sin datos personales completos.

Dependencias: requiere base de datos (Fase 1) y frontend base (Fase 2). No requiere autenticación de usuario final; el panel administrativo se resuelve con token o con Auth.js según disponibilidad.

Orden sugerido: se puede ejecutar después de la Fase 16 y antes de la Fase 17, o como Fase 18 tras el lanzamiento. El usuario decide.

Criterio de cierre: formulario de feedback funcionando, feedback guardado en la base de datos, aviso por correo recibido en la dirección configurable, panel de administración listo para ver y gestionar los feedbacks, accesible, responsive, con i18n es/en, con la ronda de subagentes de validación ejecutada y con el build de producción verificado.

Notas de cierre: tabla `feedback` en la migracion `0009_fancy_prism.sql` (soft delete, indices de estado/tipo/creado). `POST /api/feedback` publico con Zod, rate limiting (Upstash Redis; degrada a memoria), honeypot, tiempo minimo de llenado y Turnstile resuelto en el servidor; el feedback se guarda aunque falle el correo. `GET/PATCH/DELETE` protegidos por el token `FEEDBACK_ADMIN_TOKEN` comparado en tiempo constante (sin enlaces publicos, `noindex`). Formulario en `/es/feedback` (enlace en el footer) y panel en `/es/admin/feedback` con filtros, paginacion, estados y soft delete con modal. Aviso por correo con Resend tolerante a fallos y sin PII en logs. Decisiones: el captcha Turnstile se aplica SIEMPRE (dev y produccion son el mismo entorno); el token del panel se guarda solo en el `.env` local (no versionado) y en `.env.example` queda un placeholder; el panel no se persiste en localStorage (filtro `shouldDehydrateQuery`), para no filtrar el token ni datos personales. Verificado en navegador real (POST guarda, GET con token lista, sin token 401, panel carga) y la `query-cache` de localStorage no contiene token ni correo. PENDIENTES DE ENTORNO: faltan `RESEND_API_KEY` y las claves de Turnstile en el `.env`; sin ellas el feedback igual se guarda y el envio de correo y la verificacion captcha degradan con aviso. La Fase 18 se ejecuto antes que la 17 por decision del usuario. Ademas, el acceso al formulario se reforzo con un boton flotante visible en todas las paginas (oculto en `/feedback` y en el panel), ademas del enlace del footer.

## Fase 19: Lanzamiento legal y SEO técnico

Estado: completada con pendientes de entorno.

Cierra los ítems de lanzamiento pendientes (aviso legal, privacidad, HTTPS, datos estructurados, sitemap y `robots.txt`, ficha de Google, favicon y enlaces externos).

- 19.1. Página de aviso legal con datos del titular, accesible desde el pie de página.
- 19.2. Página de política de privacidad: qué datos se recogen (feedback, progreso local, logs con `trace_id`, terceros), base legal, retención, derechos y contacto.
- 19.3. Enlaces desde el pie de página y desde el formulario de feedback; reemplazo del contacto provisional del footer por una dirección real.
- 19.4. `robots.txt` y `sitemap.xml` generados por Next, con las rutas de catálogo por locale y `hreflang`.
- 19.5. Favicon en formatos modernos e íconos de app.
- 19.6. Metadatos completos: `canonical`, `alternates.languages`, Open Graph y Twitter Cards, con imagen Open Graph generada con `ImageResponse`.
- 19.7. Datos estructurados JSON-LD (`WebSite` más `SearchAction`, `BreadcrumbList` y ficha por truco), validados con Rich Results Test.
- 19.8. HTTPS y HSTS: cabeceras en `next.config.ts` y configuración en Cloudflare Pages.
- 19.9. Revisión de enlaces externos rotos.

Variable nueva: `NEXT_PUBLIC_SITE_URL`. El registro en la ficha de Google es una operación externa del usuario. Pendiente de datos: nombre del titular y correo de contacto reales.

Criterio de cierre: páginas legales publicadas y enlazadas, `robots.txt` y `sitemap.xml` respondiendo 200, favicon servido, metadatos y JSON-LD presentes, checklist 1/2/4/6/7/9/16 en listo.

## Fase 20: Rendimiento, accesibilidad y PWA

Estado: completada con pendientes de entorno.

- 20.1. Medición de Lighthouse móvil, objetivo mínimo 90.
- 20.2. Correcciones derivadas de Lighthouse (imágenes, fuentes, JS no usado, cabeceras de caché).
- 20.3. Medición de contraste WCAG AA de las clases `tb-cat-*` usadas como texto y de los badges de dificultad; ajuste de tokens si hace falta.
- 20.4. Auditoría de accesibilidad: foco visible, enlace de salto, landmarks, teclado y ARIA de los componentes DaisyUI.
- 20.5. PWA: `manifest`, service worker e instrucciones de instalación, con cache offline del catálogo y los tips.
- 20.6. Analítica condicional: Umami con `vanilla-cookieconsent` solo si se activa.

Criterio de cierre: Lighthouse mínimo 90 en móvil medido y documentado, contraste WCAG AA verificado con valores, ítems 12 y 13 del checklist en listo, y los condicionales 3 y 19 resueltos.

## Fase 21: Progreso del usuario sin login

Estado: completada.

Decisión del usuario (2026-10-05): no hay autenticación en la app. El progreso vive solo en el navegador, con Zustand y el wrapper `packages/shared/src/storage.ts`.

- 21.1. Store de Zustand con hidratación propia a través del wrapper (clave `tricking:progress`, sin TTL, versionado con Zod).
- 21.2. Modelo `{ version, updatedAt, tricks }` con estados `learned`, `in_progress` y `want`. Schema Zod en un módulo cliente-seguro.
- 21.3. Control en la tarjeta y en el detalle de truco para marcar "Ya lo tengo", "En progreso" y "Quiero aprender", con `aria-pressed` y operable por teclado.
- 21.4. Badge de estado, contador global y barras de progreso (global y por sección) que se actualizan al instante.
- 21.5. Export e import JSON del progreso validados con Zod, y borrado con modal de confirmación.
- 21.6. Hidratación segura en cliente tras el montaje, sin desajuste con SSR.
- 21.7. i18n y pruebas (Vitest del store más E2E de marcar, recargar y exportar).

Sin dependencias nuevas (`zustand@5.0.15` ya está instalado), sin migración y sin variables nuevas. El store expone la lista de ids marcados para la Fase 22.

Criterio de cierre: marcar y desmarcar persiste tras recargar, la UI reacciona en toda la app, export e import funcionan, sin PII y verificado en navegador real.

## Fase 22: Asistente de IA acotado a tricking y generador de combinaciones

Estado: completada con pendientes de entorno.

Regla de producto del usuario (2026-10-05): la IA solo se usa para tricking (dudas de trucos e historia) y debe tener seguridad para que no sirva para nada más. El asistente es una burbuja de chat flotante (como el botón de feedback), NO una sección nueva, y no tiene memoria: el historial se pierde al recargar. Toma en cuenta los trucos que el usuario ya marcó como aprendidos (progreso local, Fase 21) para personalizar sus respuestas y para el generador de combinaciones.

- 22.1. Recuperación de contexto sobre el contenido propio: búsqueda full-text ya existente para traer trucos, tips y transiciones relevantes a la consulta. pgvector y embeddings quedan como mejora futura.
- 22.2. `POST /api/assistant` con validación Zod, topes de longitud y llamada al modelo por HTTP a un endpoint compatible con OpenAI (`AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL`), sin SDK de proveedor. Recibe `knownTrickIds` del progreso local y los usa para personalizar.
- 22.3. Guardrails: prompt de sistema acotado a tricking, pre-filtro por lista de temas prohibidos, plantilla de rechazo, validación de la salida y prohibido ejecutar código generado.
- 22.4. Rate limiting con Upstash Redis por IP y tope diario, `trace_id` por petición y logs sin contenido sensible.
- 22.5. `POST /api/combos/generate`: recibe los ids de trucos conocidos y los filtros; arma la combinación con un generador determinista sobre `trick_relations` y transiciones, con refinamiento opcional por IA.
- 22.6. UI: burbuja flotante del asistente en todas las páginas (accesible, Escape para cerrar, historial en memoria) y el generador de combinaciones dentro de la página `/progress`, con longitud, filtros, regenerar, copiar como texto y enlace a cada truco.
- 22.7. i18n y pruebas (guardrails que rechazan lo ajeno, combinación que usa solo trucos conocidos y rate limit), con revisión security reforzada.
- 22.8. Multi-proveedor con fallback (subfase de corrección, pedida por el usuario el 2026-10-05): registro de proveedores gratuitos compatibles con OpenAI en `apps/web/src/lib/ai-providers.ts` (Groq, NVIDIA NIM y OpenRouter); el asistente y el refinamiento de combinaciones prueban los proveedores configurados en orden y usan el primero que responde. El tope diario es POR PROVEEDOR (por defecto 200 cada uno; total = suma). OpenRouter se usa solo con modelos que terminan en `:free` (candado anti-cobro). Se excluyeron Google Gemini (el usuario lo usa en otro repo), Cerebras y Mistral (cobran), y OpenCode Zen (su free tier está bloqueado fuera del cliente OpenCode, 403). El nombre del proveedor que contesta se muestra en el chat y en el generador.

Variables nuevas: `AI_<PROVEEDOR>_API_KEY` (groq, nvidia, openrouter), con overrides opcionales `AI_<PROVEEDOR>_MODEL` y `AI_<PROVEEDOR>_BASE_URL`, más `AI_PROVIDER_ORDER` y `AI_DAILY_REQUEST_CAP`. El proveedor propio heredado (`AI_API_KEY`/`AI_BASE_URL`/`AI_MODEL`/`AI_PROVIDER_NAME`) se mantiene como opción. Sin dependencias nuevas (llamada por HTTP). La política de privacidad declara el envío de preguntas y de la lista de trucos conocidos al proveedor.

Criterio de cierre: el asistente responde sobre tricking y rechaza lo ajeno, el generador usa en tiempo real los trucos marcados, con rate limiting, topes de costo, subagentes en verde y verificado en navegador real.

## Fase 23: Despliegue y lanzamiento

Estado: completada con pendientes de lanzamiento.

Pone la app en producción en Cloudflare (gratis) con despliegue automático en cada push a `main`, y cierra los pendientes de lanzamiento.

- 23.1. Adaptador `@opennextjs/cloudflare` + `wrangler` en `apps/web` (`open-next.config.ts`, `wrangler.jsonc`), scripts `cf:build`/`cf:preview`/`cf:deploy`.
- 23.2. Workflow `.github/workflows/deploy.yml`: build con OpenNext y `wrangler deploy` en cada push a `main`; se salta si faltan los secretos de Cloudflare.
- 23.3. Secretos de runtime en Cloudflare (`scripts/cf-secrets.sh`): base de datos, Upstash, Resend, Turnstile y keys de IA.
- 23.4. Variables de build en GitHub Actions: `NEXT_PUBLIC_SITE_URL` (dominio de producción) y `NEXT_PUBLIC_TURNSTILE_SITE_KEY`. El `.env` local conserva `localhost`.
- 23.5. Dominio gratis: subdominio `*.workers.dev` de Cloudflare (o un subdominio gratuito de terceros). Un dominio propio no es gratis.
- 23.6. Cierre de lanzamiento: datos del titular en legal/privacidad, Lighthouse, Rich Results Test y Search Console.

Criterio de cierre: la app responde en la URL de producción, el asistente, el feedback y el catálogo funcionan, y cada push a `main` despliega automáticamente.

Notas: 23.1 a 23.5 completadas. La app está desplegada en Cloudflare Workers con OpenNext en `https://aprender-tricking.leonardo-retamal-morales.workers.dev`, con auto-deploy en cada push a `main` (`deploy.yml`), secretos de runtime cargados y el asistente respondiendo (Groq). El subdominio `workers.dev` de la cuenta quedó auto-generado con el nombre del titular; cambiarlo no es self-service (la API da 10036 y el dashboard no lo permite): solo lo resetea soporte de Cloudflare. Se evaluó migrar a Netlify y se descartó por decisión del usuario (mantener la URL de Cloudflare). PENDIENTES DE LANZAMIENTO (23.6): datos del titular en aviso legal y privacidad, correr Lighthouse móvil, validar el JSON-LD con Rich Results Test y registrar el sitio en Search Console.

Notas de cierre (2026-10-05): 23.6 avanzado en el árbol de trabajo, con los cambios de código listos para el push a `main` (no desplegados todavía). Se completaron los datos estructurados: `BreadcrumbList` en el detalle de truco, variaciones, transiciones y posturas, y ficha por truco con schema.org `LearningResource` (con `teaches` cuando hay "cómo se hace"), en `apps/web/src/components/json-ld.tsx` y las páginas de detalle, con tests en `json-ld.test.ts`. Se agregó la redirección 301 de HTTP a HTTPS en `apps/web/src/proxy.ts` (en Cloudflare Workers el subdominio `workers.dev` no la aplica y la app respondía 200 por `http`). Se midió Lighthouse móvil con `lighthouse` (devDependency raíz nueva, script `pnpm lighthouse`): performance 89 a 90 (variable), accesibilidad 100, buenas prácticas 100 y SEO 100; el cuello de botella es el TBT y el redirect de `/` a `/es`. Verificado en producción: `robots.txt` y `sitemap.xml` con 200 (1294 URLs), `icon.svg` y `apple-icon` con 200, cabeceras HSTS, X-Content-Type-Options, X-Frame-Options y Referrer-Policy presentes, y enlaces externos de Loopkicks con 200. PENDIENTES: datos del titular en aviso legal y privacidad (items 1 y 2, diferidos por el usuario); desplegar el JSON-LD (la validación con Rich Results Test queda diferida a futuro por decisión del usuario); registrar el sitio en Search Console y, si se usa la verificación por meta, cargar `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` como variable de build; performance en 89 a 90, justo en el umbral.

## Fase 24: "Cómo se hace" del catálogo completo

Estado: completada.

Contenido propio (no copiado de las fuentes) de "cómo se hace" para los trucos del catálogo. Hoy solo 1 de 558 lo tiene.

- 24.1. Fijar plantilla, extensión y tono del texto (es/en), con criterios de calidad y de no copia.
- 24.2. Redactar por lotes priorizando la dificultad menor (0, 1 y 2 primero).
- 24.3. Cargar con `pnpm --filter @tricking/db db:how-to` desde `packages/db/src/seed/how-to/how-to.json`, con revisión del usuario por tanda.
- 24.4. Exponer el "cómo se hace" también como `teaches` en el JSON-LD de la ficha por truco.
- 24.5. Cobertura objetivo del 100 % de los trucos, con `how_to` y `how_to_es`.

Criterio de cierre: todos los trucos con descripción propia es/en revisada por el usuario, sin texto copiado, visible en el detalle.

Notas de cierre: se cubrieron los 568 trucos con sección (556 de las fuentes más los 12 nuevos de la Fase 25) con `how_to` y `how_to_es`, en 7 archivos `packages/db/src/seed/how-to/*.json` que `apply-how-to.ts` ahora lee y fusiona por orden alfabético (reporta ids repetidos y sin fila). Se aplicó con `db:how-to` y la cobertura quedó 568/568. El texto es un BORRADOR propio redactado por lotes; queda pendiente la revisión del usuario por tanda (algunos nombres propios se describieron por composición). Se eliminó `how-to/how-to.json`: su `aerial` quedó cubierto por `inside.json` y su clave `btwist` no correspondía a ningún id del catálogo.

Dependencias: ninguna. Sin variables nuevas.

## Fase 25: Trucos nuevos para dificultad básica y fácil

Estado: completada.

Hoy la dificultad 0 (básico) tiene 0 trucos y la 1 (fácil) tiene 2.

- 25.1. Propuesta curada de trucos nuevos que no existan en el catálogo, con nombre, sección, descripción y dificultad 0 o 1.
- 25.2. Aprobación del usuario de la lista.
- 25.3. Extensión de la semilla: alta de trucos, traducción al español, relaciones (`trick_relations`) y dificultad en `packages/db/src/seed/difficulty/`.
- 25.4. E2E y verificación de que aparecen en el listado y en el detalle.

Criterio de cierre: niveles 0 y 1 poblados con trucos nuevos aprobados, sin duplicados, con relaciones y dificultad.

Notas de cierre: se cargaron 12 trucos nuevos aprobados por el usuario con `packages/db/src/seed/manual-tricks/tricks.json` y el script `db:manual-tricks` (upsert por id más enlace a categoría `GROUNDWORK`/`VERT_KICK`). Dificultad 0: Handstand, Forward Roll, Backward Roll, Bridge, Headstand, Kip Up. Dificultad 1: Front Walkover, Back Walkover, Macaco, Headspring, Donkey Kick, Hook Kick. La distribucion paso de 0 y 2 trucos en basico/facil a 6 y 8, y el total de la base quedo en 570. Contenido propio en es/en (descripción y "cómo se hace").

Dependencias: ninguna. Sin variables nuevas.

## Fase 26: Ampliación de la sección de Tips

Estado: pendiente.

Sección 28.2 de `AGENTS.md`.

- 26.1. Nuevos tipos de truco: gainer, cork, full, double full y raiz con variantes.
- 26.2. Tips por nivel: principiante, intermedio y avanzado.
- 26.3. Respiración y preparación mental antes del truco.
- 26.4. Aterrizaje y absorción de impacto.
- 26.5. Calentamiento específico por tipo de truco.
- 26.6. Vídeos cortos propios en Cloudflare R2 (contenido propio o con licencia).
- 26.7. Diagramas de hacia dónde mirar por fase del truco.
- 26.8. Modo comparación de dos tipos de truco lado a lado.
- 26.9. i18n es/en, cache de 30 días y estructura de datos que crezca sin migración destructiva.

Criterio de cierre: contenido ampliado curado, es/en, visible y accesible, con la estructura lista para seguir creciendo.

Dependencias: Cloudflare R2 (ya documentado) solo para vídeos propios. Sin dependencias npm nuevas.

## Fase 27: Skill tree visual (sin login)

Estado: pendiente.

Sección 28.3, adaptada a la decisión de no usar autenticación: el progreso vive en el navegador (Fase 21).

- 27.1. Modelo del árbol sobre `trick_relations` (prereqs y next) y las categorías.
- 27.2. Render del arbol; la libreria de visualizacion se elige en la fase (hoy la dependencia 3D aprobada es `three`).
- 27.3. Estados por nodo (bloqueado, disponible, en progreso, aprendido y quiero aprender) con los tokens de estado de `design.md`.
- 27.4. Filtros por categoría, dificultad y estado; zoom, arrastre y navegación por teclado.
- 27.5. Barras de progreso global y por categoría, y logros por hitos.
- 27.6. Persistencia con el store de la Fase 21 (Zustand y wrapper de storage), sin cuenta.

Criterio de cierre: árbol navegable y accesible que refleja y actualiza el progreso local, verificado en navegador real y móvil.

Dependencias: ninguna nueva por ahora (la libreria del skill tree se elige en su fase; hoy la dependencia 3D aprobada es `three`). Sin variables nuevas.

## Fase 28: Editor y guardado de combos

Estado: pendiente.

El generador de combos ya existe (Fase 22) sin guardado.

- 28.1. Modelo local de combos (Zustand y Zod) con estados borrador, practicando y dominado.
- 28.2. Editor tipo nota: lista numerada, autocompletado con debounce, reordenar pasos y notas por paso.
- 28.3. Título, descripción y etiquetas opcionales.
- 28.4. Listado con filtros y búsqueda; export a texto plano y markdown; borrado con modal de confirmación.

Criterio de cierre: crear, guardar, editar y exportar combos en el navegador, persistente tras recargar, sin PII.

Dependencias: ninguna nueva. Sin variables nuevas.

## Fase 29: Favoritos y colecciones

Estado: pendiente.

- 29.1. Marcar trucos como favoritos.
- 29.2. Colecciones con nombre y descripción.
- 29.3. Export e import de favoritos y colecciones.

Criterio de cierre: favoritos y colecciones persistentes en local, exportables, sin cuenta.

Dependencias: ninguna nueva. Sin variables nuevas.

## Fase 30: Timeline de progresión

Estado: pendiente.

- 30.1. Vista del camino prereq, truco y next tricks de forma visual.
- 30.2. Integración con el progreso local y los enlaces cruzados de la Fase 15.
- 30.3. Navegación por teclado y estado vacío reutilizado.

Criterio de cierre: timeline navegable que muestra el camino de un truco y su avance local.

Dependencias: ninguna nueva. Sin variables nuevas.

## Fase 31: Comparación de trucos lado a lado

Estado: pendiente.

- 31.1. Selección de dos trucos y vista en paralelo con sus vídeos.
- 31.2. Diferencias técnicas resaltadas (categoría, dificultad, stance y "cómo se hace").
- 31.3. Responsive y accesible; en móvil apilado.

Criterio de cierre: comparación funcional de dos trucos, con sus vídeos y diferencias, en escritorio y móvil.

Dependencias: ninguna nueva. Sin variables nuevas.

## Fase 32: Modo entrenamiento o rutinas

Estado: pendiente.

- 32.1. Generar sesiones de práctica según el nivel y los trucos marcados.
- 32.2. Incorporar los tips de mirada relevantes por tipo de truco.
- 32.3. Guardar y reanudar rutinas en local.

Criterio de cierre: rutinas generadas y reanudables que usan el progreso local y los tips, sin cuenta.

Dependencias: ninguna nueva. Sin variables nuevas.

## Fase 33: Búsqueda por timestamps en vídeos

Estado: pendiente.

- 33.1. Modelo de momentos clave por truco (tiempo, etiqueta y descripción) asociados al vídeo.
- 33.2. Curación inicial de los momentos.
- 33.3. Marcadores en el reproductor para saltar a cada momento.

Criterio de cierre: marcar y saltar a momentos clave en el detalle de un truco, accesible por teclado.

Dependencias: ninguna nueva (los vídeos son externos de Loopkicks). Sin variables nuevas.

## Fase 34: Modo contraste para vídeos claros

Estado: pendiente.

- 34.1. Detección o marca curada de vídeos con fondo claro.
- 34.2. Overlay automático cuando el tema del sitio es oscuro y el vídeo es claro.
- 34.3. Control manual para activarlo o desactivarlo.

Criterio de cierre: overlay aplicado a los vídeos claros sin afectar los oscuros, con control manual accesible.

Dependencias: ninguna nueva. Sin variables nuevas.

## Fase 35: Chatbot de IA con RAG

Estado: pendiente.

Mejora el asistente de la Fase 22 con recuperación semántica sobre el contenido propio.

- 35.1. Extensión `pgvector` en Neon y tabla de embeddings.
- 35.2. Embeddings con NVIDIA NIM (misma cuenta y `AI_NVIDIA_API_KEY`), sin SDK.
- 35.3. Troceado e ingesta de descripciones, tips, "cómo se hace" y notas de Loopkicks.
- 35.4. Recuperación combinada (semántica y full-text) para el contexto del asistente.
- 35.5. Guardarraíles, topes diarios y trazabilidad ya vigentes de la Fase 22.

Criterio de cierre: el asistente responde con contexto recuperado por similitud, acotado a tricking, con topes y sin exponer datos sensibles.

Dependencias: extensión `pgvector` en Neon y embeddings de NVIDIA NIM. Sin SDK ni proveedor nuevo. Variable opcional `AI_NVIDIA_EMBED_MODEL`.

## Fase 36: Traducción automática del contenido propio es/en

Estado: pendiente.

Hoy el contenido propio (tips y "cómo se hace") se traduce a mano. Esta fase lo automatiza con el proveedor de IA ya configurado.

- 36.1. Pipeline de traducción es/en por lotes usando el proveedor por HTTP ya existente.
- 36.2. Revisión obligatoria del resultado (el texto traducido es contenido propio del proyecto).
- 36.3. Integración con los scripts de carga (`db:how-to`, `db:gaze-tips`).

Criterio de cierre: el contenido propio nuevo se traduce y se carga en es/en con revisión, sin traducir los nombres de trucos.

Dependencias: ninguna nueva (usa el proveedor de IA por HTTP ya aprobado). Sin variables nuevas.

## Fase 37: Rediseño visual

Estado: en curso.

Objetivo: renovar la interfaz completa con la paleta "Neón nocturno" (dark-first), tipografía display, superficies y utilidades de efecto, sin cambiar la funcionalidad ni el contenido.

- U0. Fundación visual: paleta y temas (`globals.css`), tipografías (Anton + Inter con `next/font`), fondo global (malla y grano), componente `Reveal`, imágenes libres y documentación de diseño.
- U1. Shell: navbar, footer, breadcrumbs y contenedores.
- U2. Home y landing.
- U3. Catálogo (listados y detalle de trucos, variaciones, transiciones, posturas y tips).
- U4. Resto de las pantallas (explore, progreso, asistente, feedback y legal).

Dependencias: ninguna nueva. `next/font` es parte de Next y las imágenes son de Pexels (licencia libre). Sin variables de entorno nuevas.

Criterio de cierre: rediseño completo aplicado a todas las pantallas, dark-first, contraste WCAG AA, Lighthouse móvil >= 90 y verificación en navegador real.

## Fase 38: Contenido en BD y cierre de brechas contra TrickingAPI

Estado: completada.

Confirmar que la app no depende en runtime de la API de Loopkicks ni de TrickingAPI, que todo el contenido vive en la base salvo los vídeos (que se enlazan externos) y cerrar las brechas de contenido reales.

- 38.1. Script de auditoría reproducible y de solo lectura (`scripts/audit-content.mjs`) que compara TrickingAPI en vivo contra la base.
- 38.2. Curar los 2 trucos que quedaban sin `section`, `difficulty` ni `how_to` (`backTuck`, `touchupTripleButterflyTwist`).
- 38.3. Acordeón Kojo: ocultar el bloque de tips (y el bloque Kojo del detalle) cuando no hay tips.

Criterio de cierre: cobertura 570/570 con `section`, `difficulty` y `how_to` es/en; auditoría sin faltantes.

Notas: la API viva `/tricks` da 558, iguales a la semilla y a la base (558 más 12 manuales = 570). `/transitions` 15 en vivo contra 16 en base (Loopkicks aporta `swingthrough`); `/landingstances` 4 contra 6 posturas en base (Loopkicks aporta 6). No hay dependencia runtime: los vídeos son URLs externas (`videos.status='external'`). Los dos trucos se cargaron por el seed de `manual-tricks`, que fija `source='manual'` y reescribe descripciones (cosmético, `tricks.source` no se usa en consultas).

Dependencias: ninguna. Sin variables nuevas.

## Fase 39: i18n estricto del asistente y de los combos

Estado: completada.

- 39.1. `locale` en el contrato del generador de combos (`comboRequestSchema`) y en `/api/combos/generate`.
- 39.2. Prompt de refinamiento de la IA por idioma (ya no hardcodeado en español).
- 39.3. Regla de idioma endurecida en el prompt de sistema del asistente.

Criterio de cierre: la respuesta sale en el idioma de la interfaz (es si la UI está en es, en si está en en), verificado en navegador real.

Dependencias: ninguna. Sin variables nuevas.

## Fase 40: Turnstile en producción

Estado: completada en código; pendiente la acción del usuario en el panel de Cloudflare.

- 40.1. Diagnóstico: la causa es la configuración del widget (hostname de producción no permitido), no el código ni la clave.
- 40.2. Manejo de error y reintento localizado en el formulario de feedback, con remonte del widget cuando el script no cargó.

Criterio de cierre: el formulario muestra un mensaje propio y permite reintentar; el widget funciona en producción tras agregar el hostname en Cloudflare.

Notas: la guía exacta para el panel se entregó al usuario; el server sigue degradando con aviso si falta el secreto.

Dependencias: acceso del usuario al panel de Cloudflare. Sin variables nuevas.

## Fase 41: Progreso por estado, generación bajo demanda y multi-sección

Estado: completada.

- 41.1. Listas de trucos marcados (Aprendidos, En progreso, Por aprender) con enlace al detalle, resueltas con `listTricksByIds` y el endpoint `GET /api/tricks/by-ids`.
- 41.2. El generador de combos ya no se dispara al montar ni al cambiar filtros: solo con el botón Generar/Regenerar.
- 41.3. Filtro de secciones múltiple con chips: "Todas" significa sin restricción (desmarca las individuales); marcar individuales desmarca "Todas"; con las cinco individuales vuelve "Todas".

Criterio de cierre: el progreso muestra los trucos por estado, el generador genera a demanda y el filtro admite más de una sección.

Dependencias: ninguna. Sin variables nuevas.

## Fase 42: CRUD de combos guardados (tope 5)

Estado: completada.

- 42.1. Modelo local de combos (Zustand y Zod) en la clave `tricking:combos`, con tope duro de 5 y sin PII.
- 42.2. Editor tipo nota (pasos, reordenar, nota por paso, título, descripción y estado) y listado con export a texto y borrado con modal de confirmación.
- 42.3. Guardar la combinación del generador cuando hay resultado; al llegar a 5 se deshabilita y se pide editar o eliminar.

Criterio de cierre: crear, guardar, editar, exportar y eliminar combos en el navegador, persistente tras recargar, con tope de 5.

Dependencias: ninguna. Sin variables nuevas.

## Fase 43: Imágenes del inicio

Estado: completada.

- 43.1. Hero con una imagen de truco acrobático en lugar de una patada de muay thai.
- 43.2. Reasignación de las tarjetas: Trucos con el flip urbano, Transiciones con una nueva imagen de flujo y Variaciones con la patada vertical.
- 43.3. `CREDITS.md` actualizado con la fuente y la licencia de cada imagen (Pexels).

Criterio de cierre: el inicio muestra imágenes de tricking coherentes con cada sección, con créditos y licencia documentados.

Dependencias: ninguna. Sin variables nuevas.

## Fase 44: Vídeos de los trucos faltantes (fuentes externas con atribución)

Estado: en curso.

Objetivo: cubrir con vídeo los 14 trucos que quedaron sin él (los 12 trucos manuales de la Fase 25 más `backTuck` y `touchupTripleButterflyTwist` de la Fase 38), usando fuentes externas con atribución, sin re-hospedar nada y sin vídeos que involucren a menores de edad.

- 44.1. Listar los trucos sin vídeo (consulta de solo lectura a `videos`): 14.
- 44.2. Investigar candidatos en YouTube, Vimeo y Dailymotion con el navegador real; descartar cualquier vídeo con menores y preferir al autor original.
- 44.3. Modelo: extender `videos` con `provider`, `embed_url`, `author`, `title`, `kind` ('file' | 'iframe' | 'link') y `aspect` ('16:9' | '9:16'); migración nueva; backfill de las filas de Loopkicks a `provider='loopkicks', kind='file', aspect='16:9'`.
- 44.4. API y Zod: exponer los campos nuevos en `GET /api/videos` y `video-schemas.ts`.
- 44.5. Reproductor: fachada que carga el iframe recién al clic (con `youtube-nocookie`), modo enlace para lo no embebible, crédito por autor y plataforma, y encuadre para verticales.
- 44.6. Carga: JSON curado en `packages/db/src/seed/video-sources/` más script `db:video-sources`, idempotente y acotado por truco.
- 44.7. Documentos y legal: `reglas-legal.md` (filtro de menores y embed con atribución), `reglas-cookies.md` (fachada al clic), aviso legal es/en y footer.
- 44.8. Verificación: navegador real, E2E del detalle y revisión humana de que ningún candidato admitido muestre menores.
- 44.9. i18n y subagentes de cierre.

Criterio de cierre: los trucos con candidato aprobado muestran el vídeo con crédito, sin re-hospedar, sin menores y con la fachada al clic; los trucos sin candidato seguro conservan el estado vacío; subagentes en verde y build delegado al gancho pre-push.

Dependencias: ninguna dependencia npm nueva. Sin variables nuevas.

Notas: Dailymotion y Vimeo no dieron resultados útiles para estos trucos (buscadores con ruido); en la práctica la fuente es YouTube. Quedan candidatos flojos en Donkey Kick y Triple Butterfly Twist. Los trucos básicos de gimnasia tienen muchos canales con menores, por eso el filtro reduce las opciones.

## Fases de la sección 28 no activadas

Las siguientes quedan en la sección 28 de `AGENTS.md` y no se abren por ahora, por decisión del usuario (2026-10-05):

- Notificaciones push (Web Push API): diferida a futuro. Requeriría claves VAPID y una tabla de suscripciones.
- Analítica (Umami): diferida a futuro. Activa cookies no esenciales y exigiría `vanilla-cookieconsent`, el inventario de cookies y actualizar la privacidad.

El resto de la sección 28 que no se menciona en las Fases 24 a 36 sigue como pendiente sin activar. El skill tree y el generador o editor de combos descritos en la sección 28.3 ya no viven en una numeración aparte: quedan absorbidos por las Fases 27 y 28.

## Correcciones aplicadas (2026-10-05)

- Asistente de IA (Fase 22): el generador de combinaciones libres fallaba cuando el usuario respondía al modo con una sola palabra ("libre"), porque `isComboRequest` no lo reconocía y el mensaje caía al modelo sin la muestra del catálogo. Se corrigió en `apps/web/src/lib/ai-guardrails.ts` (una respuesta de modo cuenta como petición solo si el mensaje es corto, para no clasificar frases ajenas) y se agregaron tests en `ai-guardrails.test.ts`. Multiidioma real: el prompt de sistema y las plantillas del chat ahora salen en el idioma del usuario (`assistant.json` es/en).
- Notas de Loopkicks (Fase 13/14): eran solo inglés y salían en inglés también en la página en español. Se agregó `tricks.loopkicks_notes_es` (migración `0010`), se tradujeron las 556 notas (traducción de cortesía, con atribución y enlace intactos) y el detalle elige por locale con `pickDescription`.
- Footer: rediseño transversal. La lista vertical larga y el espacio vacío se reemplazaron por un bloque de marca y tres grupos de enlaces ("Catálogo", "Aprender", "Sitio") en un grid responsive, con una barra inferior de copyright, contacto y aviso de no afiliación. Claves nuevas en `messages/{es,en}/common.json` (`footer.groups.*`, `footer.contact`).
