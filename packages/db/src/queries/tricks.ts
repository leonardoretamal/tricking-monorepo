import { and, asc, count, desc, eq, ilike, inArray, isNull, or, sql } from 'drizzle-orm';

import { getDb } from '../client';
import { categories, trickCategories, trickRelations, tricks } from '../schema';

// Consultas de trucos con paginacion, filtros, busqueda y orden resueltos en la base de
// datos (regla de listados). La API valida los parametros con Zod antes de llegar aqui.

export const TRICK_SECTIONS = [
  'vertical-kicks',
  'backward',
  'forward',
  'inside',
  'outside',
] as const;
export type TrickSection = (typeof TRICK_SECTIONS)[number];

export const TRICK_SORTS = ['name-asc', 'name-desc', 'difficulty-asc', 'difficulty-desc'] as const;
export type TrickSort = (typeof TRICK_SORTS)[number];

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;

export interface ListTricksParams {
  section?: TrickSection;
  category?: string;
  difficulty?: number;
  q?: string;
  sort?: TrickSort;
  page?: number;
  pageSize?: number;
}

export interface TrickListItem {
  id: string;
  name: string;
  description: string | null;
  descriptionEs: string | null;
  difficulty: number | null;
  section: string | null;
  loopkicksSlug: string | null;
  categories: string[];
}

export interface PaginatedTricks {
  items: TrickListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TrickRelated {
  id: string;
  name: string;
  difficulty: number | null;
  section: string | null;
}

export interface TrickDetail extends TrickListItem {
  prereqs: TrickRelated[];
  nextTricks: TrickRelated[];
}

function orderBy(sort: TrickSort) {
  switch (sort) {
    case 'name-desc':
      return desc(tricks.name);
    case 'difficulty-asc':
      return sql`${tricks.difficulty} asc nulls last`;
    case 'difficulty-desc':
      return sql`${tricks.difficulty} desc nulls last`;
    case 'name-asc':
    default:
      return asc(tricks.name);
  }
}

async function categoryMapFor(trickIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (trickIds.length === 0) {
    return map;
  }

  const db = getDb();
  const rows = await db
    .select({ trickId: trickCategories.trickId, slug: categories.slug })
    .from(trickCategories)
    .innerJoin(categories, eq(trickCategories.categoryId, categories.id))
    .where(inArray(trickCategories.trickId, trickIds));

  for (const row of rows) {
    const bucket = map.get(row.trickId);
    if (bucket) {
      bucket.push(row.slug);
    } else {
      map.set(row.trickId, [row.slug]);
    }
  }
  return map;
}

export async function listTricks(params: ListTricksParams): Promise<PaginatedTricks> {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, params.pageSize ?? DEFAULT_PAGE_SIZE));

  const conditions = [isNull(tricks.deletedAt)];
  if (params.section !== undefined) {
    conditions.push(eq(tricks.section, params.section));
  }
  if (params.difficulty !== undefined) {
    conditions.push(eq(tricks.difficulty, params.difficulty));
  }
  if (params.q !== undefined && params.q.trim() !== '') {
    const term = `%${params.q.trim()}%`;
    const search = or(ilike(tricks.name, term), ilike(tricks.description, term));
    if (search) {
      conditions.push(search);
    }
  }
  if (params.category !== undefined && params.category !== '') {
    conditions.push(
      inArray(
        tricks.id,
        db
          .select({ id: trickCategories.trickId })
          .from(trickCategories)
          .innerJoin(categories, eq(trickCategories.categoryId, categories.id))
          .where(eq(categories.slug, params.category)),
      ),
    );
  }

  const where = and(...conditions);

  const [countRow] = await db.select({ value: count() }).from(tricks).where(where);
  const total = countRow?.value ?? 0;

  const rows = await db
    .select({
      id: tricks.id,
      name: tricks.name,
      description: tricks.description,
      descriptionEs: tricks.descriptionEs,
      difficulty: tricks.difficulty,
      section: tricks.section,
      loopkicksSlug: tricks.loopkicksSlug,
    })
    .from(tricks)
    .where(where)
    .orderBy(orderBy(params.sort ?? 'name-asc'))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const map = await categoryMapFor(rows.map((row) => row.id));
  const items: TrickListItem[] = rows.map((row) => ({
    ...row,
    categories: map.get(row.id) ?? [],
  }));

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
  };
}

export async function getTrickById(id: string): Promise<TrickDetail | null> {
  const db = getDb();

  const [trick] = await db
    .select({
      id: tricks.id,
      name: tricks.name,
      description: tricks.description,
      descriptionEs: tricks.descriptionEs,
      difficulty: tricks.difficulty,
      section: tricks.section,
      loopkicksSlug: tricks.loopkicksSlug,
    })
    .from(tricks)
    .where(and(eq(tricks.id, id), isNull(tricks.deletedAt)))
    .limit(1);

  if (!trick) {
    return null;
  }

  // Los prereqs y siguientes se resuelven desde `trick_relations` (nombres ya resueltos
  // a ids en el seed de relaciones), no desde las columnas de texto de la semilla.
  const relatedRows = await db
    .select({
      id: tricks.id,
      name: tricks.name,
      difficulty: tricks.difficulty,
      section: tricks.section,
      kind: trickRelations.kind,
    })
    .from(trickRelations)
    .innerJoin(tricks, eq(trickRelations.relatedId, tricks.id))
    .where(eq(trickRelations.trickId, trick.id))
    .orderBy(asc(tricks.name));

  const prereqs: TrickRelated[] = [];
  const nextTricks: TrickRelated[] = [];
  for (const row of relatedRows) {
    const item: TrickRelated = {
      id: row.id,
      name: row.name,
      difficulty: row.difficulty,
      section: row.section,
    };
    if (row.kind === 'next') {
      nextTricks.push(item);
    } else {
      prereqs.push(item);
    }
  }

  const map = await categoryMapFor([trick.id]);

  return {
    id: trick.id,
    name: trick.name,
    description: trick.description,
    descriptionEs: trick.descriptionEs,
    difficulty: trick.difficulty,
    section: trick.section,
    loopkicksSlug: trick.loopkicksSlug,
    categories: map.get(trick.id) ?? [],
    prereqs,
    nextTricks,
  };
}
