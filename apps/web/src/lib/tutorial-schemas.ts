import { z } from 'zod';

// Esquemas y filtros del listado de tutoriales de Kojo (Fase 13). El cliente valida con
// Zod lo que recibe de /api/tutorials (y lo rehidratado desde el cache persistido). No
// importa @tricking/db para no arrastrar la base de datos al bundle del navegador.

export const TUTORIAL_SORTS = ['date-desc', 'date-asc', 'title-asc', 'title-desc'] as const;
export type TutorialSort = (typeof TUTORIAL_SORTS)[number];

export const TUTORIAL_PAGE_SIZES = [25, 50, 100] as const;
export const DEFAULT_TUTORIAL_PAGE_SIZE = 25;

export const tutorialListItemSchema = z.object({
  id: z.number(),
  externalId: z.string(),
  caption: z.string().nullable(),
  author: z.string().nullable(),
  vimeoId: z.string().nullable(),
  permalink: z.string().nullable(),
  postedAt: z.string().nullable(),
});

export const paginatedTutorialsSchema = z.object({
  items: z.array(tutorialListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type TutorialListItem = z.infer<typeof tutorialListItemSchema>;
export type PaginatedTutorials = z.infer<typeof paginatedTutorialsSchema>;

export interface TutorialFilters {
  q?: string;
  sort: TutorialSort;
  page: number;
  pageSize: number;
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function isTutorialSort(value: string | undefined): value is TutorialSort {
  return value !== undefined && TUTORIAL_SORTS.some((sort) => sort === value);
}

function isTutorialPageSize(value: number): boolean {
  return TUTORIAL_PAGE_SIZES.some((size) => size === value);
}

export function parseTutorialFilters(
  searchParams: Record<string, string | string[] | undefined>,
): TutorialFilters {
  const qRaw = first(searchParams.q)?.trim();
  const q = qRaw ? qRaw : undefined;

  const sortRaw = first(searchParams.sort);
  const sort: TutorialSort = isTutorialSort(sortRaw) ? sortRaw : 'date-desc';

  const pageRaw = Number.parseInt(first(searchParams.page) ?? '', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const pageSizeRaw = Number.parseInt(first(searchParams.pageSize) ?? '', 10);
  const pageSize =
    Number.isFinite(pageSizeRaw) && isTutorialPageSize(pageSizeRaw)
      ? pageSizeRaw
      : DEFAULT_TUTORIAL_PAGE_SIZE;

  return { q, sort, page, pageSize };
}
