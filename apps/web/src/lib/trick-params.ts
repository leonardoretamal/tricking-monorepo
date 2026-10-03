import type { TrickFilters } from '@/components/trick-browser';

const SORTS = ['name-asc', 'name-desc', 'difficulty-asc', 'difficulty-desc'] as const;
const PAGE_SIZES = [24, 48, 100];
const DEFAULT_PAGE_SIZE = 24;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseIntInRange(
  value: string | undefined,
  min: number,
  max: number,
  fallback: number,
): number {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

// Normaliza los searchParams de la URL a filtros validos. Un valor invalido cae al
// valor por defecto en vez de romper la vista.
export function parseTrickFilters(
  searchParams: Record<string, string | string[] | undefined>,
): TrickFilters {
  const qRaw = first(searchParams.q)?.trim();
  const difficultyRaw = first(searchParams.difficulty);
  const sortRaw = first(searchParams.sort);
  const pageSizeRaw = parseIntInRange(first(searchParams.pageSize), 1, 100, DEFAULT_PAGE_SIZE);

  return {
    q: qRaw && qRaw !== '' ? qRaw : undefined,
    difficulty:
      difficultyRaw !== undefined && /^[0-5]$/.test(difficultyRaw)
        ? Number(difficultyRaw)
        : undefined,
    sort: SORTS.find((candidate) => candidate === sortRaw) ?? 'name-asc',
    page: parseIntInRange(first(searchParams.page), 1, 100000, 1),
    pageSize: PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : DEFAULT_PAGE_SIZE,
  };
}
