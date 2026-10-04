import { and, asc, count, eq, inArray } from 'drizzle-orm';

import { getDb } from '../client';
import { stances, trickStances, tricks } from '../schema';
import type { TrickRef } from './variations';

// Consultas de stances (Fase 10). Un stance es la posicion de aterrizaje o despegue.
// El detalle lista los trucos que aterrizan en el stance (kind='landing').

export const DEFAULT_STANCE_PAGE_SIZE = 24;
export const MAX_STANCE_PAGE_SIZE = 100;

export interface StanceListItem {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  landingTrickCount: number;
}

export interface StanceDetail extends StanceListItem {
  landingTricks: TrickRef[];
}

export interface ListStancesParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedStances {
  items: StanceListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function landingCounts(stanceIds: number[]): Promise<Map<number, number>> {
  const map = new Map<number, number>();
  if (stanceIds.length === 0) {
    return map;
  }
  const rows = await getDb()
    .select({ stanceId: trickStances.stanceId, value: count() })
    .from(trickStances)
    .where(and(inArray(trickStances.stanceId, stanceIds), eq(trickStances.kind, 'landing')))
    .groupBy(trickStances.stanceId);
  for (const row of rows) {
    map.set(row.stanceId, row.value);
  }
  return map;
}

export async function listStances(params: ListStancesParams): Promise<PaginatedStances> {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_STANCE_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_STANCE_PAGE_SIZE),
  );

  const [countRow] = await db.select({ value: count() }).from(stances);
  const total = countRow?.value ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const rows = await db
    .select({
      id: stances.id,
      slug: stances.slug,
      name: stances.name,
      description: stances.description,
    })
    .from(stances)
    .orderBy(asc(stances.name))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  const counts = await landingCounts(rows.map((row) => row.id));
  const items: StanceListItem[] = rows.map((row) => ({
    ...row,
    landingTrickCount: counts.get(row.id) ?? 0,
  }));

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export async function getStanceBySlug(slug: string): Promise<StanceDetail | null> {
  const db = getDb();

  const [row] = await db
    .select({
      id: stances.id,
      slug: stances.slug,
      name: stances.name,
      description: stances.description,
    })
    .from(stances)
    .where(eq(stances.slug, slug))
    .limit(1);

  if (!row) {
    return null;
  }

  const [countRow] = await db
    .select({ value: count() })
    .from(trickStances)
    .where(and(eq(trickStances.stanceId, row.id), eq(trickStances.kind, 'landing')));
  const landingTrickCount = countRow?.value ?? 0;

  const landingTricks = await db
    .select({ id: tricks.id, name: tricks.name, section: tricks.section })
    .from(trickStances)
    .innerJoin(tricks, eq(trickStances.trickId, tricks.id))
    .where(and(eq(trickStances.stanceId, row.id), eq(trickStances.kind, 'landing')))
    .orderBy(asc(tricks.name))
    .limit(100);

  return {
    ...row,
    landingTrickCount,
    landingTricks,
  };
}
