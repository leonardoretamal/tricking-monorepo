import { and, asc, count, desc, eq, ilike, isNull, or } from 'drizzle-orm';

import { getDb } from '../client';
import { transitionExamples, transitions, tricks } from '../schema';
import type { TrickRef } from './variations';

// Consultas de transiciones (Fase 9). Las transiciones son tipos conceptuales con grupo
// (unified/singular/sequential) y ejemplos; no pares origen-destino.

export const TRANSITION_GROUPS = ['unified', 'singular', 'sequential'] as const;
export type TransitionGroup = (typeof TRANSITION_GROUPS)[number];

export const TRANSITION_SORTS = ['name-asc', 'name-desc'] as const;
export type TransitionSort = (typeof TRANSITION_SORTS)[number];

export const DEFAULT_TRANSITION_PAGE_SIZE = 24;
export const MAX_TRANSITION_PAGE_SIZE = 100;

export interface TransitionListItem {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  descriptionEs: string | null;
  group: string | null;
}

export interface TransitionExampleItem {
  label: string;
  trick: TrickRef | null;
}

export interface TransitionDetail extends TransitionListItem {
  examples: TransitionExampleItem[];
}

export interface ListTransitionsParams {
  group?: TransitionGroup;
  q?: string;
  sort?: TransitionSort;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTransitions {
  items: TransitionListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function orderBy(sort: TransitionSort) {
  return sort === 'name-desc' ? desc(transitions.name) : asc(transitions.name);
}

export async function listTransitions(
  params: ListTransitionsParams,
): Promise<PaginatedTransitions> {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_TRANSITION_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_TRANSITION_PAGE_SIZE),
  );

  const conditions = [isNull(transitions.deletedAt)];
  if (params.group !== undefined) {
    conditions.push(eq(transitions.group, params.group));
  }
  if (params.q !== undefined && params.q.trim() !== '') {
    const term = `%${params.q.trim()}%`;
    const search = or(ilike(transitions.name, term), ilike(transitions.description, term));
    if (search) {
      conditions.push(search);
    }
  }

  const where = and(...conditions);

  const [countRow] = await db.select({ value: count() }).from(transitions).where(where);
  const total = countRow?.value ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const items = await db
    .select({
      id: transitions.id,
      slug: transitions.slug,
      name: transitions.name,
      description: transitions.description,
      descriptionEs: transitions.descriptionEs,
      group: transitions.group,
    })
    .from(transitions)
    .where(where)
    .orderBy(orderBy(params.sort ?? 'name-asc'))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export async function getTransitionBySlug(slug: string): Promise<TransitionDetail | null> {
  const db = getDb();

  const [row] = await db
    .select({
      id: transitions.id,
      slug: transitions.slug,
      name: transitions.name,
      description: transitions.description,
      descriptionEs: transitions.descriptionEs,
      group: transitions.group,
    })
    .from(transitions)
    .where(and(eq(transitions.slug, slug), isNull(transitions.deletedAt)))
    .limit(1);

  if (!row) {
    return null;
  }

  const rows = await db
    .select({
      label: transitionExamples.label,
      trickId: tricks.id,
      trickName: tricks.name,
      trickSection: tricks.section,
    })
    .from(transitionExamples)
    .leftJoin(tricks, eq(transitionExamples.trickId, tricks.id))
    .where(eq(transitionExamples.transitionId, row.id))
    .orderBy(asc(transitionExamples.label));

  const examples: TransitionExampleItem[] = rows.map((example) => ({
    label: example.label,
    trick:
      example.trickId !== null
        ? { id: example.trickId, name: example.trickName ?? '', section: example.trickSection }
        : null,
  }));

  return { ...row, examples };
}
