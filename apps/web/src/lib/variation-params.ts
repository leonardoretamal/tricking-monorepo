// Filtros del listado de variaciones. El estado vive en la URL (query params) y se
// normaliza antes de consultar el backend.

export type VariationKind = 'family' | 'concrete';
export type VariationSort = 'name-asc' | 'name-desc';

export interface VariationFilters {
  kind: VariationKind;
  q?: string;
  sort: VariationSort;
  page: number;
  pageSize: number;
}

export const VARIATION_PAGE_SIZES = [12, 24, 48, 100] as const;
export const DEFAULT_VARIATION_PAGE_SIZE = 24;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseVariationFilters(
  searchParams: Record<string, string | string[] | undefined>,
): VariationFilters {
  const kindRaw = first(searchParams.kind);
  const kind: VariationKind = kindRaw === 'concrete' ? 'concrete' : 'family';

  const qRaw = first(searchParams.q)?.trim();
  const q = qRaw ? qRaw : undefined;

  const sortRaw = first(searchParams.sort);
  const sort: VariationSort = sortRaw === 'name-desc' ? 'name-desc' : 'name-asc';

  const pageRaw = Number.parseInt(first(searchParams.page) ?? '', 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const pageSizeRaw = Number.parseInt(first(searchParams.pageSize) ?? '', 10);
  const pageSize = (VARIATION_PAGE_SIZES as readonly number[]).includes(pageSizeRaw)
    ? pageSizeRaw
    : DEFAULT_VARIATION_PAGE_SIZE;

  return { kind, q, sort, page, pageSize };
}
