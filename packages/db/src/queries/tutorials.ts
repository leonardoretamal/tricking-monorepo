import { and, asc, count, desc, eq, ilike, inArray, isNull, sql } from 'drizzle-orm';

import { getDb } from '../client';
import { contentBlocks, tricks, tutorialTricks, tutorials } from '../schema';

// Tecnicas de Kojo (Fase 13, rediseno). Listado paginado con busqueda y orden resueltos
// en la base de datos (regla de listados). Cada tecnica trae sus tips propios y los
// trucos del catalogo con los que se emparejo. El bloque general vive en content_blocks.

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

export interface TutorialTrickRef {
  id: string;
  name: string;
  section: string | null;
}

export interface TutorialListItem {
  id: number;
  externalId: string;
  caption: string | null;
  author: string | null;
  vimeoId: string | null;
  level: string | null;
  tips: string | null;
  tipsEs: string | null;
  permalink: string | null;
  postedAt: Date | null;
  tricks: TutorialTrickRef[];
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

async function tricksFor(tutorialIds: number[]): Promise<Map<number, TutorialTrickRef[]>> {
  const map = new Map<number, TutorialTrickRef[]>();
  if (tutorialIds.length === 0) {
    return map;
  }
  const db = getDb();
  const rows = await db
    .select({
      tutorialId: tutorialTricks.tutorialId,
      id: tricks.id,
      name: tricks.name,
      section: tricks.section,
    })
    .from(tutorialTricks)
    .innerJoin(tricks, eq(tutorialTricks.trickId, tricks.id))
    .where(inArray(tutorialTricks.tutorialId, tutorialIds))
    .orderBy(asc(tricks.name));

  for (const row of rows) {
    const item: TutorialTrickRef = { id: row.id, name: row.name, section: row.section };
    const bucket = map.get(row.tutorialId);
    if (bucket) {
      bucket.push(item);
    } else {
      map.set(row.tutorialId, [item]);
    }
  }
  return map;
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

  const rows = await db
    .select({
      id: tutorials.id,
      externalId: tutorials.externalId,
      caption: tutorials.caption,
      author: tutorials.author,
      vimeoId: tutorials.vimeoId,
      level: tutorials.level,
      tips: tutorials.tips,
      tipsEs: tutorials.tipsEs,
      permalink: tutorials.permalink,
      postedAt: tutorials.postedAt,
    })
    .from(tutorials)
    .where(where)
    .orderBy(...orderBy(params.sort ?? 'date-desc'))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  const tricksMap = await tricksFor(rows.map((row) => row.id));
  const items: TutorialListItem[] = rows.map((row) => ({
    ...row,
    tricks: tricksMap.get(row.id) ?? [],
  }));

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export async function getContentBlock(key: string, locale: string): Promise<string | null> {
  const db = getDb();
  const [row] = await db
    .select({ content: contentBlocks.content })
    .from(contentBlocks)
    .where(and(eq(contentBlocks.key, key), eq(contentBlocks.locale, locale)))
    .limit(1);
  return row?.content ?? null;
}
