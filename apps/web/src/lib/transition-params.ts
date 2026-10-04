import type { TransitionFilters } from '@/components/transition-browser';

const SORTS = ['name-asc', 'name-desc'] as const;
const GROUPS = ['unified', 'singular', 'sequential'] as const;
const PAGE_SIZES = [12, 24, 48];
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
export function parseTransitionFilters(
  searchParams: Record<string, string | string[] | undefined>,
): TransitionFilters {
  const qRaw = first(searchParams.q)?.trim();
  const groupRaw = first(searchParams.group);
  const sortRaw = first(searchParams.sort);
  const pageSizeRaw = parseIntInRange(first(searchParams.pageSize), 1, 100, DEFAULT_PAGE_SIZE);

  return {
    q: qRaw && qRaw !== '' ? qRaw : undefined,
    group: GROUPS.find((candidate) => candidate === groupRaw),
    sort: SORTS.find((candidate) => candidate === sortRaw) ?? 'name-asc',
    page: parseIntInRange(first(searchParams.page), 1, 100000, 1),
    pageSize: PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : DEFAULT_PAGE_SIZE,
  };
}
