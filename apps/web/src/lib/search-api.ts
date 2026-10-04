import { paginatedSearchSchema, type PaginatedSearch, type SearchFilters } from './search-schemas';

// Cliente del endpoint de busqueda global. Valida con Zod la respuesta del backend
// (y lo rehidratado desde el cache persistido) en vez de confiar en un cast.

export async function fetchSearch(
  filters: SearchFilters,
  signal?: AbortSignal,
): Promise<PaginatedSearch> {
  const params = new URLSearchParams();
  params.set('q', filters.q);
  if (filters.type !== undefined) {
    params.set('type', filters.type);
  }
  if (filters.page > 1) {
    params.set('page', String(filters.page));
  }
  params.set('pageSize', String(filters.pageSize));

  const response = await fetch(`/api/search?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`search_request_failed_${response.status}`);
  }

  return paginatedSearchSchema.parse(await response.json());
}
