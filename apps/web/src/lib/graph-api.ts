import { graphResponseSchema, type GraphFilters, type GraphResponse } from './graph-schemas';

// Cliente de /api/graph. Valida con Zod la respuesta del backend y reutiliza el patron
// de los demas clientes de listados del frontend.

export interface GraphQueryParams extends GraphFilters {
  maxNodes?: number;
}

function toParams(query: GraphQueryParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  }
  return params.toString();
}

export async function fetchGraph(
  query: GraphQueryParams,
  signal?: AbortSignal,
): Promise<GraphResponse> {
  const response = await fetch(`/api/graph?${toParams(query)}`, { signal });
  if (!response.ok) {
    throw new Error(`graph_request_failed_${response.status}`);
  }
  return graphResponseSchema.parse(await response.json());
}
