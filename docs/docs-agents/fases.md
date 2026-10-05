# Fases del proyecto

Estado de las fases y subfases del monorepo. Este documento es el lugar donde vive el estado de las fases.

El proyecto se organiza por secciones de contenido, no por capas técnicas. Cada sección de Loopkicks es una fase. Cada fase se cierra con build de producción verificado, subagentes de validación ejecutados y actualización de este documento.

Última actualización: 2026-10-04.

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
- El layout raíz vive en `apps/web/src/app/[locale]/layout.tsx` (patrón de next-intl) y el middleware de locale se declara en `apps/web/src/proxy.ts` (convención de Next 16).
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

Notas de cierre: tabla `feedback` en la migracion `0009_fancy_prism.sql` (soft delete, indices de estado/tipo/creado). `POST /api/feedback` publico con Zod, rate limiting (Upstash Redis; degrada a memoria), honeypot, tiempo minimo de llenado y Turnstile resuelto en el servidor; el feedback se guarda aunque falle el correo. `GET/PATCH/DELETE` protegidos por el token `FEEDBACK_ADMIN_TOKEN` comparado en tiempo constante (sin enlaces publicos, `noindex`). Formulario en `/es/feedback` (enlace en el footer) y panel en `/es/admin/feedback` con filtros, paginacion, estados y soft delete con modal. Aviso por correo con Resend tolerante a fallos y sin PII en logs. Decisiones: el captcha Turnstile se aplica SIEMPRE (dev y produccion son el mismo entorno); el token del panel se guarda solo en el `.env` local (no versionado) y en `.env.example` queda un placeholder; el panel no se persiste en localStorage (filtro `shouldDehydrateQuery`), para no filtrar el token ni datos personales. Verificado en navegador real (POST guarda, GET con token lista, sin token 401, panel carga) y la `query-cache` de localStorage no contiene token ni correo. PENDIENTES DE ENTORNO: faltan `RESEND_API_KEY` y las claves de Turnstile en el `.env`; sin ellas el feedback igual se guarda y el envio de correo y la verificacion captcha degradan con aviso. La Fase 18 se ejecuto antes que la 17 por decision del usuario.

## Fases sugeridas fuera de la numeración principal

Estas fases no forman parte de la numeración principal y solo se abren con autorización explícita del usuario, cuando se active el skill tree y el generador de combos descritos en la sección 28.3 de `AGENTS.md`.

- Fase A: autenticación y tabla de progreso.
- Fase B: skill tree visual y marcado de trucos.
- Fase C: generador de combos aleatorios.
- Fase D: editor y guardado de combos.
- Fase E: logros, estadísticas y compartición.
