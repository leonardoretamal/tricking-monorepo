import { paginatedTutorialsSchema, type PaginatedTutorials } from './tutorial-schemas';

// Cliente del listado de tutoriales. Valida con Zod la respuesta del backend.

export interface TutorialsQuery {
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchTutorials(
  query: TutorialsQuery,
  signal?: AbortSignal,
): Promise<PaginatedTutorials> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const response = await fetch(`/api/tutorials?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`tutorials_request_failed_${response.status}`);
  }

  return paginatedTutorialsSchema.parse(await response.json());
}
