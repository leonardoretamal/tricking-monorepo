import { tricksByIdsResponseSchema, type TricksByIdsResponse } from './trick-schemas';

// Cliente HTTP del endpoint /api/tricks/by-ids (Fase 41). Resuelve los ids locales del
// progreso a la referencia minima del catalogo. Valida con Zod lo que devuelve el backend.

export async function fetchTricksByIds(
  ids: string[],
  signal?: AbortSignal,
): Promise<TricksByIdsResponse> {
  const params = new URLSearchParams({ ids: ids.join(',') });
  const response = await fetch(`/api/tricks/by-ids?${params.toString()}`, { signal });

  if (!response.ok) {
    throw new Error('tricks_by_ids_failed');
  }

  return tricksByIdsResponseSchema.parse(await response.json());
}
