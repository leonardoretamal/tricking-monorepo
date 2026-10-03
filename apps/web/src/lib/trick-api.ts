import {
  paginatedTricksSchema,
  trickDetailSchema,
  type PaginatedTricks,
  type TrickDetail,
} from './trick-schemas';

export interface TricksQuery {
  section: string;
  q?: string;
  category?: string;
  difficulty?: number;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchTricks(
  query: TricksQuery,
  signal?: AbortSignal,
): Promise<PaginatedTricks> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }

  const response = await fetch(`/api/tricks?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`tricks_request_failed_${response.status}`);
  }

  return paginatedTricksSchema.parse(await response.json());
}

export async function fetchTrick(id: string, signal?: AbortSignal): Promise<TrickDetail> {
  const response = await fetch(`/api/tricks/${encodeURIComponent(id)}`, { signal });
  if (!response.ok) {
    throw new Error(`trick_request_failed_${response.status}`);
  }

  return trickDetailSchema.parse(await response.json());
}
