import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';

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
    SELECT tr.slug, tr.name, tr.description_es
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
