import { and, asc, count, desc, ilike, isNull, sql } from 'drizzle-orm';

import { getDb } from '../client';
import { tutorials } from '../schema';

// Tutoriales de Kojo (Fase 13). Listado paginado con busqueda y orden resueltos en la
// base de datos (regla de listados). La API valida los parametros con Zod antes de
// llegar aqui. El contenido viene en ingles y se sirve tal cual.

export const TUTORIAL_SORTS = ['date-desc', 'date-asc', 'title-asc', 'title-desc'] as const;
export type TutorialSort = (typeof TUTORIAL_SORTS)[number];

export const DEFAULT_TUTORIAL_PAGE_SIZE = 25;
export const MAX_TUTORIAL_PAGE_SIZE = 100;

export interface ListTutorialsParams {
  q?: string;
  sort?: TutorialSort;
  page?: number;
  pageSize?: number;
}

export interface TutorialListItem {
  id: number;
  externalId: string;
  caption: string | null;
  author: string | null;
  vimeoId: string | null;
  permalink: string | null;
  postedAt: Date | null;
}

export interface PaginatedTutorials {
  items: TutorialListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function orderBy(sort: TutorialSort) {
  switch (sort) {
    case 'date-asc':
      return [sql`${tutorials.postedAt} asc nulls last`, asc(tutorials.id)];
    case 'title-asc':
      return [asc(tutorials.caption), asc(tutorials.id)];
    case 'title-desc':
      return [desc(tutorials.caption), asc(tutorials.id)];
    case 'date-desc':
    default:
      return [sql`${tutorials.postedAt} desc nulls last`, asc(tutorials.id)];
  }
}

export async function listTutorials(params: ListTutorialsParams): Promise<PaginatedTutorials> {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_TUTORIAL_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_TUTORIAL_PAGE_SIZE),
  );

  const conditions = [isNull(tutorials.deletedAt)];
  if (params.q !== undefined && params.q.trim() !== '') {
    conditions.push(ilike(tutorials.caption, `%${params.q.trim()}%`));
  }

  const where = and(...conditions);

  const [countRow] = await db.select({ value: count() }).from(tutorials).where(where);
  const total = countRow?.value ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const items = await db
    .select({
      id: tutorials.id,
      externalId: tutorials.externalId,
      caption: tutorials.caption,
      author: tutorials.author,
      vimeoId: tutorials.vimeoId,
      permalink: tutorials.permalink,
      postedAt: tutorials.postedAt,
    })
    .from(tutorials)
    .where(where)
    .orderBy(...orderBy(params.sort ?? 'date-desc'))
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
