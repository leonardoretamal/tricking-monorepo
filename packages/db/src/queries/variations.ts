import { and, asc, count, desc, eq, ilike, inArray, isNull, ne, or } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks, variationExamples, variations } from '../schema';

// Consultas de variaciones (Fase 8). Dos ejes: familias conceptuales de Loopkicks
// (kind='family') y variaciones concretas de TrickingAPI (kind='concrete'). Listado,
// busqueda, orden y total resueltos en la base de datos.

export const VARIATION_KINDS = ['family', 'concrete'] as const;
export type VariationKind = (typeof VARIATION_KINDS)[number];

export const VARIATION_SORTS = ['name-asc', 'name-desc'] as const;
export type VariationSort = (typeof VARIATION_SORTS)[number];

export const DEFAULT_VARIATION_PAGE_SIZE = 24;
export const MAX_VARIATION_PAGE_SIZE = 100;

export interface TrickRef {
  id: string;
  name: string;
  section: string | null;
}

export interface VariationListItem {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  kind: string;
  baseTrick: TrickRef | null;
  examples: TrickRef[];
}

export interface VariationSibling {
  id: number;
  slug: string;
  name: string;
}

export interface VariationDetail extends VariationListItem {
  family: VariationSibling | null;
  siblings: VariationSibling[];
}

export interface ListVariationsParams {
  kind?: VariationKind;
  q?: string;
  sort?: VariationSort;
  page?: number;
  pageSize?: number;
}

export interface PaginatedVariations {
  items: VariationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function orderBy(sort: VariationSort) {
  return sort === 'name-desc' ? desc(variations.name) : asc(variations.name);
}

async function baseTrickMap(ids: string[]): Promise<Map<string, TrickRef>> {
  const map = new Map<string, TrickRef>();
  const unique = [...new Set(ids)];
  if (unique.length === 0) {
    return map;
  }
  const rows = await getDb()
    .select({ id: tricks.id, name: tricks.name, section: tricks.section })
    .from(tricks)
    .where(inArray(tricks.id, unique));
  for (const row of rows) {
    map.set(row.id, row);
  }
  return map;
}

export async function listVariations(params: ListVariationsParams): Promise<PaginatedVariations> {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_VARIATION_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_VARIATION_PAGE_SIZE),
  );

  const conditions = [isNull(variations.deletedAt)];
  if (params.kind !== undefined) {
    conditions.push(eq(variations.kind, params.kind));
  }
  if (params.q !== undefined && params.q.trim() !== '') {
    const term = `%${params.q.trim()}%`;
    const search = or(ilike(variations.name, term), ilike(variations.description, term));
    if (search) {
      conditions.push(search);
    }
  }

  const where = and(...conditions);

  const [countRow] = await db.select({ value: count() }).from(variations).where(where);
  const total = countRow?.value ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const rows = await db
    .select({
      id: variations.id,
      slug: variations.slug,
      name: variations.name,
      description: variations.description,
      kind: variations.kind,
      baseTrickId: variations.baseTrickId,
    })
    .from(variations)
    .where(where)
    .orderBy(orderBy(params.sort ?? 'name-asc'))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  const baseMap = await baseTrickMap(
    rows.map((row) => row.baseTrickId).filter((id): id is string => id !== null),
  );
  const examplesMap = await examplesFor(rows.map((row) => row.id));

  const items: VariationListItem[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    kind: row.kind,
    baseTrick: row.baseTrickId ? (baseMap.get(row.baseTrickId) ?? null) : null,
    examples: examplesMap.get(row.id) ?? [],
  }));

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

async function examplesFor(variationIds: number[]): Promise<Map<number, TrickRef[]>> {
  const map = new Map<number, TrickRef[]>();
  if (variationIds.length === 0) {
    return map;
  }
  const rows = await getDb()
    .select({
      variationId: variationExamples.variationId,
      id: tricks.id,
      name: tricks.name,
      section: tricks.section,
    })
    .from(variationExamples)
    .innerJoin(tricks, eq(variationExamples.trickId, tricks.id))
    .where(inArray(variationExamples.variationId, variationIds));

  for (const row of rows) {
    const bucket = map.get(row.variationId);
    const ref: TrickRef = { id: row.id, name: row.name, section: row.section };
    if (bucket) {
      bucket.push(ref);
    } else {
      map.set(row.variationId, [ref]);
    }
  }
  return map;
}

export async function getVariationBySlug(slug: string): Promise<VariationDetail | null> {
  const db = getDb();

  const [row] = await db
    .select({
      id: variations.id,
      slug: variations.slug,
      name: variations.name,
      description: variations.description,
      kind: variations.kind,
      baseTrickId: variations.baseTrickId,
      familyId: variations.familyId,
    })
    .from(variations)
    .where(and(eq(variations.slug, slug), isNull(variations.deletedAt)))
    .limit(1);

  if (!row) {
    return null;
  }

  const baseMap = await baseTrickMap(row.baseTrickId ? [row.baseTrickId] : []);
  const examplesMap = await examplesFor([row.id]);

  let family: VariationSibling | null = null;
  if (row.familyId !== null) {
    const [familyRow] = await db
      .select({ id: variations.id, slug: variations.slug, name: variations.name })
      .from(variations)
      .where(eq(variations.id, row.familyId))
      .limit(1);
    family = familyRow ?? null;
  }

  let siblings: VariationSibling[] = [];
  if (row.baseTrickId) {
    siblings = await db
      .select({ id: variations.id, slug: variations.slug, name: variations.name })
      .from(variations)
      .where(
        and(
          eq(variations.baseTrickId, row.baseTrickId),
          eq(variations.kind, 'concrete'),
          ne(variations.id, row.id),
          isNull(variations.deletedAt),
        ),
      )
      .orderBy(asc(variations.name))
      .limit(24);
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    kind: row.kind,
    baseTrick: row.baseTrickId ? (baseMap.get(row.baseTrickId) ?? null) : null,
    family,
    examples: examplesMap.get(row.id) ?? [],
    siblings,
  };
}
