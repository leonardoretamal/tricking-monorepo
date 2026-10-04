import { sql, type SQL } from 'drizzle-orm';

import { getDb } from '../client';

// Busqueda global full-text (Fase 12). Resuelta en la base de datos con la columna
// generada `tricks.search_vector` (tsvector) y su indice GIN. Todo el filtrado, el
// orden, la paginacion y el total se resuelven en SQL; nunca sobre colecciones completas.

export const SEARCH_TYPES = ['trick', 'variation', 'transition', 'stance'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

export function isSearchType(value: string | undefined | null): value is SearchType {
  return (
    value !== undefined && value !== null && (SEARCH_TYPES as readonly string[]).includes(value)
  );
}

export const DEFAULT_SEARCH_PAGE_SIZE = 20;
export const MAX_SEARCH_PAGE_SIZE = 50;

export interface SearchParams {
  q: string;
  type?: SearchType;
  page?: number;
  pageSize?: number;
}

export interface SearchItem {
  id: string;
  type: SearchType;
  name: string;
  slug: string;
  description: string | null;
  descriptionEs: string | null;
  section: string | null;
  difficulty: number | null;
}

export interface PaginatedSearch {
  items: SearchItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Fila cruda que devuelve la union. Se expresa como alias de tipo (no interface) para
// que sea asignable a la restriccion Record<string, unknown> de db.execute.
type SearchRow = {
  type: string;
  id: string;
  slug: string;
  name: string;
  description: string | null;
  description_es: string | null;
  section: string | null;
  difficulty: number | null;
};

type CountRow = {
  total: number;
};

const SIMPLE_VECTOR = (column: SQL | string) => sql`to_tsvector('simple', ${column})`;

// Expresion de texto (nombre + descripcion en ingles y en espanol) para las tablas que
// no tienen columna generada. Se usa tanto para el match full-text como para el rank.
const SEARCHABLE_TEXT = (name: SQL, description: SQL, descriptionEs: SQL) =>
  sql`coalesce(${name}, '') || ' ' || coalesce(${description}, '') || ' ' || coalesce(${descriptionEs}, '')`;

// La union de los cuatro tipos con su rank. `websearch_to_tsquery` no falla con
// entradas raras (a diferencia de to_tsquery) y el ILIKE cubre las coincidencias
// parciales que el full-text no alcanza.
function buildMatchesCte(q: string, like: string): SQL {
  return sql`
    search_input AS (
      SELECT websearch_to_tsquery('simple', ${q}) AS query, ${like} AS like_pattern
    ),
    matches AS (
      SELECT
        'trick'::text AS type,
        t.id AS id,
        t.id AS slug,
        t.name AS name,
        t.description AS description,
        t.description_es AS description_es,
        t.section AS section,
        t.difficulty AS difficulty,
        ts_rank(t.search_vector, si.query) AS rank
      FROM tricks t, search_input si
      WHERE t.deleted_at IS NULL
        AND (t.search_vector @@ si.query OR t.name ILIKE si.like_pattern)

      UNION ALL

      SELECT
        'variation'::text,
        v.id::text,
        v.slug,
        v.name,
        v.description,
        v.description_es,
        NULL::text,
        NULL::smallint,
        ts_rank(${SIMPLE_VECTOR(SEARCHABLE_TEXT(sql`v.name`, sql`v.description`, sql`v.description_es`))}, si.query)
      FROM variations v, search_input si
      WHERE v.deleted_at IS NULL
        AND (
          ${SIMPLE_VECTOR(SEARCHABLE_TEXT(sql`v.name`, sql`v.description`, sql`v.description_es`))} @@ si.query
          OR v.name ILIKE si.like_pattern
          OR v.description ILIKE si.like_pattern
          OR v.description_es ILIKE si.like_pattern
        )

      UNION ALL

      SELECT
        'transition'::text,
        tr.id::text,
        tr.slug,
        tr.name,
        tr.description,
        tr.description_es,
        NULL::text,
        NULL::smallint,
        ts_rank(${SIMPLE_VECTOR(SEARCHABLE_TEXT(sql`tr.name`, sql`tr.description`, sql`tr.description_es`))}, si.query)
      FROM transitions tr, search_input si
      WHERE tr.deleted_at IS NULL
        AND (
          ${SIMPLE_VECTOR(SEARCHABLE_TEXT(sql`tr.name`, sql`tr.description`, sql`tr.description_es`))} @@ si.query
          OR tr.name ILIKE si.like_pattern
          OR tr.description ILIKE si.like_pattern
          OR tr.description_es ILIKE si.like_pattern
        )

      UNION ALL

      SELECT
        'stance'::text,
        s.id::text,
        s.slug,
        s.name,
        s.description,
        s.description_es,
        NULL::text,
        NULL::smallint,
        ts_rank(${SIMPLE_VECTOR(SEARCHABLE_TEXT(sql`s.name`, sql`s.description`, sql`s.description_es`))}, si.query)
      FROM stances s, search_input si
      WHERE (
        ${SIMPLE_VECTOR(SEARCHABLE_TEXT(sql`s.name`, sql`s.description`, sql`s.description_es`))} @@ si.query
        OR s.name ILIKE si.like_pattern
        OR s.description ILIKE si.like_pattern
        OR s.description_es ILIKE si.like_pattern
      )
    )
  `;
}

export async function searchAll(params: SearchParams): Promise<PaginatedSearch> {
  const q = params.q.trim();
  const like = `%${q}%`;
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_SEARCH_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_SEARCH_PAGE_SIZE),
  );

  const db = getDb();
  const ctes = buildMatchesCte(q, like);
  const typeFilter = params.type ? sql`AND type = ${params.type}` : sql``;

  const countResult = await db.execute<CountRow>(sql`
    WITH ${ctes}
    SELECT count(*)::int AS total
    FROM matches
    WHERE TRUE ${typeFilter}
  `);
  const total = countResult.rows[0]?.total ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const rowsResult = await db.execute<SearchRow>(sql`
    WITH ${ctes}
    SELECT type, id, slug, name, description, description_es, section, difficulty
    FROM matches
    WHERE TRUE ${typeFilter}
    ORDER BY rank DESC, name ASC, id ASC
    LIMIT ${pageSize}::int OFFSET ${offset}::int
  `);

  const items: SearchItem[] = [];
  for (const row of rowsResult.rows) {
    if (!isSearchType(row.type)) {
      continue;
    }
    items.push({
      id: row.id,
      type: row.type,
      name: row.name,
      slug: row.slug,
      description: row.description,
      descriptionEs: row.description_es,
      section: row.section,
      difficulty: row.difficulty,
    });
  }

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}
