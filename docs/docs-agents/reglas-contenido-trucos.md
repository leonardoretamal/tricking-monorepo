# Reglas del contenido de trucos

Propósito: definir cómo se escribe, estructura y carga el contenido propio de cada truco (el "cómo se hace") y cómo se buscan, validan, cargan y presentan los vídeos y tutoriales externos. Aplica a todo truco nuevo del catálogo y a la revisión del contenido existente.

El contenido propio es original del proyecto. No se copia ni se parafrasea de cerca el texto de las fuentes (Loopkicks, TrickingAPI, Kojo's Trick Lab); la política de terceros vive en `docs/docs-agents/reglas-legal.md`.

## Modelo del "cómo se hace"

El "cómo se hace" tiene dos niveles sobre la tabla `tricks`:

- `how_to` y `how_to_es` (texto): resumen corto, plano, en español e inglés. Se mantiene como fallback, para SEO y para cuando todavía no existe el detalle estructurado.
- `how_to_data` y `how_to_data_es` (jsonb): detalle estructurado con el contrato HowToDetail v1, uno por idioma. Es el que renderiza el detalle del truco; si falta, la interfaz cae al resumen de texto plano.

El contrato se valida con Zod en `packages/shared/src/how-to.ts` (exportado desde `packages/shared/src/index.ts`); el backend y el frontend comparten el mismo esquema.

### Contrato HowToDetail v1

```json
{
  "version": 1,
  "summary": "string",
  "before": { "prerequisites": "string", "space": "string" },
  "body": {
    "feet": "string",
    "legs": "string",
    "arms": "string",
    "gaze": "string",
    "torso": "string"
  },
  "steps": [{ "title": "string", "body": "string" }],
  "landing": "string",
  "mistakes": ["string"],
  "tips": ["string"],
  "terms": [{ "term": "string", "meaning": "string" }],
  "prereqNotes": { "idDeTruco": "string" }
}
```

Reglas del contrato:

- `version` siempre es `1`. Un cambio incompatible sube la versión y se documenta aquí.
- `summary`, `before`, `body`, `steps` y `landing` son obligatorios; `mistakes`, `tips`, `terms` y `prereqNotes` son opcionales.
- `prereqNotes` solo admite claves que sean prerequisito real del truco en `trick_relations` (kind `prereq`). Una clave que no sea prerequisito real se descarta al validar.
- Los dos idiomas llevan el mismo nivel de detalle: si existe `how_to_data`, existe `how_to_data_es`, y al revés. Si un idioma falta, no se publica el detalle incompleto.

## Guía de estilo

Público: alguien que recién empieza. El texto se entiende sin haber visto antes el truco.

- Sin jerga sin definir. La primera vez que aparece un término técnico (por ejemplo, "roundoff", "punch", "reversal"), se explica en `terms` con `term` y `meaning`.
- Los nombres de trucos se mantienen en inglés (términos estándar del deporte, ver `docs/docs-agents/reglas-i18n.md`); el resto del texto va en español neutro latinoamericano, o en inglés en la versión en.
- Se describe el movimiento por ejes del cuerpo: `feet` (pies y apoyo), `legs` (piernas), `arms` (brazos), `gaze` (mirada) y `torso` (tronco).
- `steps`: de 3 a 6 pasos, en orden de ejecución; cada uno con `title` corto y `body` de una o dos frases.
- `before.prerequisites`: qué tiene que saber hacer la persona antes de intentarlo. `before.space`: qué espacio y superficie hacen falta.
- `landing`: cómo aterrizar y absorber el impacto.
- `mistakes`: de 2 a 4 errores comunes, redactados como lo que suele pasar, no como una lista de prohibiciones.
- `tips`: de 2 a 4 tips accionables que ayuden a corregir lo más difícil.
- Tono instructivo y directo, en segunda persona. Sin promesas de resultado y sin lenguaje de marketing.
- Prohibido el em dash (U+2014) y el en dash (U+2013); para incisos se usan paréntesis o comas. Sin emojis.

## Prerrequisitos y prereqNotes

- Los prerequisitos de un truco viven en `trick_relations` (kind `prereq`). `prereqNotes` agrega una nota por prerequisito, no crea relaciones nuevas.
- Toda clave de `prereqNotes` tiene que ser un prerequisito real del truco; el resto se descarta al validar con Zod y contra `trick_relations`.
- Si no hay nada que aclarar sobre los prerequisitos, `prereqNotes` se omite. No se rellena con texto genérico.
- La "ruta de aprendizaje" del detalle (prerequisitos, truco actual y siguientes) se arma con `trick_relations`; `prereqNotes` solo aporta la aclaración de cada prerequisito.

## Tutoriales externos

### Búsqueda priorizada

- Consulta base: `<nombre del truco> tricking tutorial`, con el nombre exacto del truco tal como figura en el catálogo.
- Orden: primero español, después inglés. En español se prueban variantes como `tutorial <nombre> tricking`.
- Variantes por sitio cuando haga falta: YouTube, Vimeo, Dailymotion y TikTok.
- La búsqueda es best-effort: si no aparece un candidato seguro, el truco queda sin tutorial. Es preferible no tener tutorial antes que uno de dudoso origen.

### Validación de metadata (oEmbed)

- La metadata del candidato se valida con el endpoint oEmbed público de la plataforma, sin API key: YouTube, Vimeo, Dailymotion y TikTok.
- De oEmbed se toman `title`, `author_name` y el identificador; la URL canónica y el `embedUrl` se arman con el identificador validado.
- No se acepta un video cuya metadata real no coincida con lo que la búsqueda prometía (título o autor distintos).

### Criterios de admisión

- Canal oficial o reconocido dentro del tricking; se prefiere al autor original del truco.
- El video tiene que enseñar el truco, no solo mostrarlo de fondo.
- PROHIBIDO admitir videos que involucren a menores de edad, como protagonistas o en segundo plano. Ante duda razonable se excluye, aunque sea el único candidato o el canal sea oficial.
- La revisión de menores la hace una persona al aprobar cada candidato; no la valida un script. El usuario puede revisar una muestra y retirar cualquiera.
- Si hay duda, el candidato no se incluye.

### Presentación: embed o enlace

- Se prefiere el embed cuando la plataforma lo permite; cuando esté disponible, se usa el dominio de privacidad (`youtube-nocookie`).
- Si la plataforma bloquea el embed en dominios de terceros, el tutorial se muestra como enlace a la página original.
- Siempre con crédito al autor y enlace al original. No se descarga ni se re-hospeda nada.
- La fachada carga el iframe recién al clic del usuario; no se pide la portada ni ningún recurso de terceros antes del clic (ver `docs/docs-agents/reglas-frontend.md` y `docs/docs-agents/reglas-cookies.md`).

## Formato de semillas y scripts

- Tutoriales externos: `packages/db/src/seed/tutorial-sources/*.json`, un archivo por lote, con entradas de `trickId`, `provider`, `url`, `embedUrl`, `author`, `title`, `language`, `kind` y `aspect`.
- Demos de Loopkicks y otros videos de role `demo`: `packages/db/src/seed/video-sources/*.json`.
- El "cómo se hace" estructurado se carga desde `packages/db/src/seed/how-to/*.json` con `detailEs` y `detailEn` por truco.
- Scripts idempotentes: `db:how-to` (detalle y resumen), `db:tutorial-videos` (tutoriales externos) y `db:video-sources` (demos). Cada script borra solo los videos del truco afectado y del rol que le corresponde, y nunca toca el rol del otro.
- Un script que no valide con Zod no escribe nada y falla con el detalle del campo inválido.
- Los IDs de truco de las semillas tienen que existir en el catálogo; un ID desconocido se reporta y se omite.

## Checklist para agregar un truco nuevo

- [ ] El truco existe en el catálogo con id estable, sección y dificultad.
- [ ] Tiene `how_to` y `how_to_es` (resumen) en español e inglés.
- [ ] Tiene `how_to_data` y `how_to_data_es` (contrato HowToDetail v1) validados con Zod, o una nota de que el detalle queda pendiente.
- [ ] Las claves de `prereqNotes` son prerequisitos reales en `trick_relations`.
- [ ] Tiene sus relaciones (`trick_relations`) y, si aplica, variaciones, transiciones y stances.
- [ ] Tiene al menos un video demo (`role='demo'`) o una nota de por qué no.
- [ ] Se buscaron tutoriales externos con la consulta priorizada y, si hay candidato seguro, quedó cargado con `role='tutorial'` y `language`.
- [ ] Si no hay tutorial seguro, se anotó en `docs/docs-agents/tutoriales-faltantes.md` con la consulta intentada.
- [ ] El contenido está en es y en, sin copiar de las fuentes, sin em dash, sin en dash y sin emojis.

## Pendientes de tutoriales

`docs/docs-agents/tutoriales-faltantes.md` es la lista de trabajo de los trucos sin tutorial o con candidatos no encontrados. Cada entrada lleva el id del truco, la consulta intentada y una nota; el usuario puede pasar los enlaces más adelante y una tarea de contenido los carga. En la interfaz, un truco sin tutorial muestra "Sin tutorial todavía" en la pestaña de tutoriales, sin dejar un espacio vacío.

## Reglas transversales relacionadas

- Legal y contenido de terceros: docs/docs-agents/reglas-legal.md.
- Internacionalización: docs/docs-agents/reglas-i18n.md.
- Frontend (pestañas y fachada): docs/docs-agents/reglas-frontend.md.
- Decisiones visuales (layout del detalle): docs/docs-agents/design.md.
- Stack y columnas nuevas: docs/docs-agents/stack-tecnico.md.
