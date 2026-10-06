import { and, asc, eq, inArray, isNull, notInArray, sql } from 'drizzle-orm';

import { getDb } from '../client';
import { trickRelations, tricks } from '../schema';

// Recuperacion de contexto para el asistente de IA y carga de candidatos para el
// generador de combinaciones (Fase 22). Toda la recuperacion se resuelve en la base de
// datos y queda parametrizada con topes: el asistente nunca trae el catalogo completo.
//
// La busqueda full-text de trucos usa la columna generada `tricks.search_vector`
// (nombre + descripcion es/en) y ademas arma un vector al vuelo que incluye `how_to`,
// `how_to_es` y la seccion, porque la columna generada no cubre esos campos.

export const MAX_ASSISTANT_CONTEXT_ITEMS = 12;
export const DEFAULT_ASSISTANT_CONTEXT_ITEMS = 8;
export const MAX_ASSISTANT_GAZE_TIPS = 4;
export const MAX_ASSISTANT_TRANSITIONS = 4;
export const MAX_ASSISTANT_KNOWN_TRICKS = 600;

export interface AssistantTrickContext {
  id: string;
  name: string;
  description: string | null;
  descriptionEs: string | null;
  howTo: string | null;
  howToEs: string | null;
  section: string | null;
  difficulty: number | null;
}

export interface AssistantGazeTipContext {
  trickType: string;
  phase: string;
  instruction: string;
  warning: string | null;
}

export interface AssistantTransitionContext {
  slug: string;
  name: string;
  description: string | null;
  descriptionEs: string | null;
}

export interface AssistantContext {
  tricks: AssistantTrickContext[];
  gazeTips: AssistantGazeTipContext[];
  transitions: AssistantTransitionContext[];
}

export interface ComboTrickRow {
  id: string;
  name: string;
  section: string | null;
  difficulty: number | null;
}

export interface ComboRelationRow {
  trickId: string;
  relatedId: string;
}

// Alias de tipo (no interface) para que la fila cruda sea asignable a la restriccion
// Record<string, unknown> de db.execute, igual que en la busqueda global.
type TrickContextRow = {
  id: string;
  name: string;
  description: string | null;
  description_es: string | null;
  how_to: string | null;
  how_to_es: string | null;
  section: string | null;
  difficulty: number | null;
};

type GazeTipContextRow = {
  trick_type: string;
  phase: string;
  instruction: string;
  warning: string | null;
};

type TransitionContextRow = {
  slug: string;
  name: string;
  description: string | null;
  description_es: string | null;
};

const TRICK_SEARCH_TEXT = sql`coalesce(t.name, '') || ' ' || coalesce(t.description, '') || ' ' || coalesce(t.description_es, '') || ' ' || coalesce(t.how_to, '') || ' ' || coalesce(t.how_to_es, '') || ' ' || coalesce(t.section, '')`;

const GAZE_SEARCH_TEXT = sql`coalesce(gt.instruction, '') || ' ' || coalesce(gt.warning, '')`;

const TRANSITION_SEARCH_TEXT = sql`coalesce(tr.name, '') || ' ' || coalesce(tr.description, '') || ' ' || coalesce(tr.description_es, '')`;

export async function searchContextForAssistant(
  query: string,
  limit: number,
  locale = 'es',
): Promise<AssistantContext> {
  const empty: AssistantContext = { tricks: [], gazeTips: [], transitions: [] };
  const q = query.trim();
  if (q === '') {
    return empty;
  }

  const db = getDb();
  const safeLimit = Math.min(MAX_ASSISTANT_CONTEXT_ITEMS, Math.max(1, Math.trunc(limit)));
  const tipLimit = Math.min(MAX_ASSISTANT_GAZE_TIPS, safeLimit);
  const transitionLimit = Math.min(MAX_ASSISTANT_TRANSITIONS, safeLimit);
  const like = `%${q}%`;

  const trickRows = await db.execute<TrickContextRow>(sql`
    SELECT
      t.id,
      t.name,
      t.description,
      t.description_es,
      t.how_to,
      t.how_to_es,
      t.section,
      t.difficulty
    FROM tricks t
    WHERE t.deleted_at IS NULL
      AND (
        t.search_vector @@ websearch_to_tsquery('simple', ${q})
        OR to_tsvector('simple', ${TRICK_SEARCH_TEXT}) @@ websearch_to_tsquery('simple', ${q})
        OR t.name ILIKE ${like}
        OR t.how_to ILIKE ${like}
        OR t.how_to_es ILIKE ${like}
      )
    ORDER BY
      GREATEST(
        ts_rank(t.search_vector, websearch_to_tsquery('simple', ${q})),
        ts_rank(to_tsvector('simple', ${TRICK_SEARCH_TEXT}), websearch_to_tsquery('simple', ${q}))
      ) DESC,
      t.name ASC
    LIMIT ${safeLimit}::int
  `);

  const gazeRows = await db.execute<GazeTipContextRow>(sql`
    SELECT gt.trick_type, gt.phase, gt.instruction, gt.warning
    FROM gaze_tips gt
    WHERE gt.locale = ${locale}
      AND (
        to_tsvector('simple', ${GAZE_SEARCH_TEXT}) @@ websearch_to_tsquery('simple', ${q})
        OR gt.instruction ILIKE ${like}
        OR gt.warning ILIKE ${like}
      )
    ORDER BY
      ts_rank(to_tsvector('simple', ${GAZE_SEARCH_TEXT}), websearch_to_tsquery('simple', ${q})) DESC,
      gt.order ASC
    LIMIT ${tipLimit}::int
  `);

  const transitionRows = await db.execute<TransitionContextRow>(sql`
    SELECT tr.slug, tr.name, tr.description, tr.description_es
    FROM transitions tr
    WHERE tr.deleted_at IS NULL
      AND (
        to_tsvector('simple', ${TRANSITION_SEARCH_TEXT}) @@ websearch_to_tsquery('simple', ${q})
        OR tr.name ILIKE ${like}
        OR tr.description_es ILIKE ${like}
      )
    ORDER BY
      ts_rank(to_tsvector('simple', ${TRANSITION_SEARCH_TEXT}), websearch_to_tsquery('simple', ${q})) DESC,
      tr.name ASC
    LIMIT ${transitionLimit}::int
  `);

  return {
    tricks: trickRows.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      descriptionEs: row.description_es,
      howTo: row.how_to,
      howToEs: row.how_to_es,
      section: row.section,
      difficulty: row.difficulty,
    })),
    gazeTips: gazeRows.rows.map((row) => ({
      trickType: row.trick_type,
      phase: row.phase,
      instruction: row.instruction,
      warning: row.warning,
    })),
    transitions: transitionRows.rows.map((row) => ({
      slug: row.slug,
      name: row.name,
      description: row.description,
      descriptionEs: row.description_es,
    })),
  };
}

// Carga acotada de los trucos conocidos por el usuario. Devuelve solo las columnas que
// necesita el generador; los ids inexistentes o borrados se descartan.
export async function loadComboTricks(trickIds: string[]): Promise<ComboTrickRow[]> {
  const unique = [...new Set(trickIds)].slice(0, MAX_ASSISTANT_KNOWN_TRICKS);
  if (unique.length === 0) {
    return [];
  }
  const db = getDb();
  return db
    .select({
      id: tricks.id,
      name: tricks.name,
      section: tricks.section,
      difficulty: tricks.difficulty,
    })
    .from(tricks)
    .where(and(isNull(tricks.deletedAt), inArray(tricks.id, unique)))
    .orderBy(asc(tricks.name));
}

// Relaciones truco-truco de avance (`kind = 'next'`) acotadas al conjunto conocido. El
// generador las usa para encadenar trucos con una progresion real del catalogo.
export async function loadComboRelations(trickIds: string[]): Promise<ComboRelationRow[]> {
  const unique = [...new Set(trickIds)].slice(0, MAX_ASSISTANT_KNOWN_TRICKS);
  if (unique.length === 0) {
    return [];
  }
  const db = getDb();
  return db
    .select({
      trickId: trickRelations.trickId,
      relatedId: trickRelations.relatedId,
    })
    .from(trickRelations)
    .where(
      and(
        eq(trickRelations.kind, 'next'),
        inArray(trickRelations.trickId, unique),
        inArray(trickRelations.relatedId, unique),
      ),
    );
}

export interface NextTrickSuggestion {
  id: string;
  name: string;
  section: string | null;
  difficulty: number | null;
}

// Sugerencias REALES del catalogo para el asistente: continuaciones (`kind = 'next'`) de
// los trucos que el usuario ya tiene, excluyendo los que ya conoce. Ancla las
// recomendaciones al catalogo: el asistente solo deberia recomendar nombres de esta lista
// (o del contexto), nunca inventados.
export async function loadNextTrickSuggestions(
  trickIds: string[],
  limit = 20,
): Promise<NextTrickSuggestion[]> {
  const unique = [...new Set(trickIds)].slice(0, MAX_ASSISTANT_KNOWN_TRICKS);
  if (unique.length === 0) {
    return [];
  }
  const db = getDb();
  const safeLimit = Math.min(40, Math.max(1, Math.trunc(limit)));
  const rows = await db
    .select({
      id: tricks.id,
      name: tricks.name,
      section: tricks.section,
      difficulty: tricks.difficulty,
    })
    .from(trickRelations)
    .innerJoin(tricks, eq(tricks.id, trickRelations.relatedId))
    .where(
      and(
        eq(trickRelations.kind, 'next'),
        inArray(trickRelations.trickId, unique),
        isNull(tricks.deletedAt),
        notInArray(tricks.id, unique),
      ),
    )
    .orderBy(asc(tricks.name))
    .limit(safeLimit);

  const seen = new Set<string>();
  const suggestions: NextTrickSuggestion[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) {
      continue;
    }
    seen.add(row.id);
    suggestions.push(row);
  }
  return suggestions;
}

// Muestra aleatoria del catalogo para que el asistente arme una "combinacion libre" con
// trucos reales (no solo los que el usuario ya conoce). Acotada para no inflar el prompt.
export async function loadCatalogSample(limit = 40): Promise<NextTrickSuggestion[]> {
  const db = getDb();
  const safeLimit = Math.min(80, Math.max(1, Math.trunc(limit)));
  return db
    .select({
      id: tricks.id,
      name: tricks.name,
      section: tricks.section,
      difficulty: tricks.difficulty,
    })
    .from(tricks)
    .where(isNull(tricks.deletedAt))
    .orderBy(sql`random()`)
    .limit(safeLimit);
}

// Elige al azar un truco que tenga continuaciones (`next`) en el catalogo. Sirve como
// punto de partida de una combinacion coherente.
export async function pickRandomChainStart(): Promise<string | null> {
  const db = getDb();
  const rows = await db.execute<{ trick_id: string }>(sql`
    SELECT r.trick_id
    FROM trick_relations r
    JOIN tricks t ON t.id = r.trick_id AND t.deleted_at IS NULL
    WHERE r.kind = 'next'
    ORDER BY random()
    LIMIT 1
  `);
  return rows.rows[0]?.trick_id ?? null;
}

// Arma una cadena COHERENTE siguiendo las relaciones `next` del catalogo a partir de un
// truco, con un CTE recursivo. Garantiza que cada truco sea continuacion real del
// anterior (nada de saltos al azar). Corta si no hay mas continuaciones.
export async function buildRelationChain(
  startId: string,
  maxLen: number,
): Promise<NextTrickSuggestion[]> {
  const db = getDb();
  const safeLen = Math.min(12, Math.max(2, Math.trunc(maxLen)));
  const rows = await db.execute<{
    id: string;
    name: string;
    section: string | null;
    difficulty: number | null;
  }>(sql`
    WITH RECURSIVE chain AS (
      SELECT t.id, t.name, t.section, t.difficulty, 1 AS depth, ARRAY[t.id]::text[] AS path
      FROM tricks t
      WHERE t.id = ${startId} AND t.deleted_at IS NULL
      UNION ALL
      SELECT t.id, t.name, t.section, t.difficulty, c.depth + 1, c.path || t.id
      FROM chain c
      JOIN trick_relations r ON r.trick_id = c.id AND r.kind = 'next'
      JOIN tricks t ON t.id = r.related_id AND t.deleted_at IS NULL
      WHERE c.depth < ${safeLen} AND NOT (t.id = ANY(c.path))
    )
    SELECT id, name, section, difficulty
    FROM chain
    ORDER BY depth
    LIMIT ${safeLen}
  `);
  return rows.rows.map((row) => ({
    id: row.id,
    name: row.name,
    section: row.section,
    difficulty: row.difficulty,
  }));
}
