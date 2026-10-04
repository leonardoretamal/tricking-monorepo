import {
  paginatedStancesSchema,
  paginatedTransitionsSchema,
  paginatedVariationsSchema,
  stanceDetailSchema,
  transitionDetailSchema,
  variationDetailSchema,
  type PaginatedStances,
  type PaginatedTransitions,
  type PaginatedVariations,
  type StanceDetail,
  type TransitionDetail,
  type VariationDetail,
} from './semantic-schemas';

// Clientes de las secciones semanticas. Validan con Zod la respuesta del backend.

export interface VariationsQuery {
  kind?: string;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface TransitionsQuery {
  group?: string;
  q?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface StancesQuery {
  page?: number;
  pageSize?: number;
}

function toParams(query: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

export async function fetchVariations(
  query: VariationsQuery,
  signal?: AbortSignal,
): Promise<PaginatedVariations> {
  const response = await fetch(`/api/variations?${toParams(query)}`, { signal });
  if (!response.ok) {
    throw new Error(`variations_request_failed_${response.status}`);
  }
  return paginatedVariationsSchema.parse(await response.json());
}

export async function fetchVariation(slug: string, signal?: AbortSignal): Promise<VariationDetail> {
  const response = await fetch(`/api/variations/${encodeURIComponent(slug)}`, { signal });
  if (!response.ok) {
    throw new Error(`variation_request_failed_${response.status}`);
  }
  return variationDetailSchema.parse(await response.json());
}

export async function fetchTransitions(
  query: TransitionsQuery,
  signal?: AbortSignal,
): Promise<PaginatedTransitions> {
  const response = await fetch(`/api/transitions?${toParams(query)}`, { signal });
  if (!response.ok) {
    throw new Error(`transitions_request_failed_${response.status}`);
  }
  return paginatedTransitionsSchema.parse(await response.json());
}

export async function fetchTransition(
  slug: string,
  signal?: AbortSignal,
): Promise<TransitionDetail> {
  const response = await fetch(`/api/transitions/${encodeURIComponent(slug)}`, { signal });
  if (!response.ok) {
    throw new Error(`transition_request_failed_${response.status}`);
  }
  return transitionDetailSchema.parse(await response.json());
}

export async function fetchStances(
  query: StancesQuery,
  signal?: AbortSignal,
): Promise<PaginatedStances> {
  const response = await fetch(`/api/stances?${toParams(query)}`, { signal });
  if (!response.ok) {
    throw new Error(`stances_request_failed_${response.status}`);
  }
  return paginatedStancesSchema.parse(await response.json());
}

export async function fetchStance(slug: string, signal?: AbortSignal): Promise<StanceDetail> {
  const response = await fetch(`/api/stances/${encodeURIComponent(slug)}`, { signal });
  if (!response.ok) {
    throw new Error(`stance_request_failed_${response.status}`);
  }
  return stanceDetailSchema.parse(await response.json());
}
