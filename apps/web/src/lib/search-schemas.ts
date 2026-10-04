import { z } from 'zod';

// Esquemas de la busqueda global (Fase 12): validacion de la query del endpoint,
// contrato de la respuesta y normalizacion de los filtros que viven en la URL.
//
// Las constantes se declaran aqui (y no se importan de @tricking/db) para que este modulo
// sea cliente-seguro: el paquete db reexporta el cliente de Neon y arrastraria el driver al
// bundle del navegador. Deben coincidir con las de packages/db/src/queries/search.ts.
export const SEARCH_TYPES = ['trick', 'variation', 'transition', 'stance'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];
export const DEFAULT_SEARCH_PAGE_SIZE = 20;
export const MAX_SEARCH_PAGE_SIZE = 50;

export function isSearchType(value: string | undefined): value is SearchType {
  return value !== undefined && (SEARCH_TYPES as readonly string[]).includes(value);
}

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2, 'minimo dos caracteres').max(100),
  type: z.enum(SEARCH_TYPES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_SEARCH_PAGE_SIZE)
    .default(DEFAULT_SEARCH_PAGE_SIZE),
});

export const searchItemSchema = z.object({
  id: z.string(),
  type: z.enum(SEARCH_TYPES),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  descriptionEs: z.string().nullable(),
  section: z.string().nullable(),
  difficulty: z.number().nullable(),
});

export const paginatedSearchSchema = z.object({
  items: z.array(searchItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type SearchItem = z.infer<typeof searchItemSchema>;
export type PaginatedSearch = z.infer<typeof paginatedSearchSchema>;

// Filtros de la pagina /search. El estado vive en la URL (query params) y se normaliza
// antes de consultar; un valor invalido cae al valor por defecto en vez de romper la vista.
export interface SearchFilters {
  q: string;
  type?: SearchType;
  page: number;
  pageSize: number;
}

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
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    return fallback;
  }
  return parsed;
}

export function parseSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): SearchFilters {
  const qRaw = first(searchParams.q)?.trim() ?? '';
  const typeRaw = first(searchParams.type);

  return {
    q: qRaw,
    type: isSearchType(typeRaw) ? typeRaw : undefined,
    page: parseIntInRange(first(searchParams.page), 1, 1_000_000, 1),
    pageSize: parseIntInRange(
      first(searchParams.pageSize),
      1,
      MAX_SEARCH_PAGE_SIZE,
      DEFAULT_SEARCH_PAGE_SIZE,
    ),
  };
}
