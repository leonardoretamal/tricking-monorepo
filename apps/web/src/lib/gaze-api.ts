import { THIRTY_DAYS_MS, readEntry, writeEntry } from '@tricking/shared';
import type { ZodType } from 'zod';

import {
  gazeSummariesResponseSchema,
  gazeTipTypeDetailSchema,
  paginatedGazeTipsSchema,
  type GazeSummariesResponse,
  type GazeTipTypeDetail,
  type PaginatedGazeTips,
} from './gaze-schemas';

// Clientes de la seccion de tips. Validan con Zod lo que reciben y lo que se rehidrata
// del cache. Los tips cambian poco: el cache propio tiene TTL de 30 dias y usa el
// wrapper de storage del monorepo (unica puerta de entrada a localStorage).

const GAZE_PAGE_SIZE = 200;
const CACHE_TTL_MS = THIRTY_DAYS_MS;

async function cachedFetch<T>(
  key: string,
  schema: ZodType<T>,
  url: string,
  signal?: AbortSignal,
): Promise<T> {
  const cached = readEntry(key, schema);
  if (cached !== null) {
    return cached;
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`gaze_request_failed_${response.status}`);
  }

  const parsed = schema.parse(await response.json());
  writeEntry(key, parsed, CACHE_TTL_MS);
  return parsed;
}

export function fetchGazeSummaries(
  locale: string,
  signal?: AbortSignal,
): Promise<GazeSummariesResponse> {
  return cachedFetch(
    `gaze-summaries:${locale}`,
    gazeSummariesResponseSchema,
    `/api/tips/summaries?locale=${encodeURIComponent(locale)}`,
    signal,
  );
}

export function fetchGazeTips(locale: string, signal?: AbortSignal): Promise<PaginatedGazeTips> {
  return cachedFetch(
    `gaze-tips:${locale}`,
    paginatedGazeTipsSchema,
    `/api/tips?locale=${encodeURIComponent(locale)}&pageSize=${GAZE_PAGE_SIZE}`,
    signal,
  );
}

export function fetchGazeTipType(
  trickType: string,
  locale: string,
  signal?: AbortSignal,
): Promise<GazeTipTypeDetail> {
  return cachedFetch(
    `gaze-type:${locale}:${trickType}`,
    gazeTipTypeDetailSchema,
    `/api/tips/${encodeURIComponent(trickType)}?locale=${encodeURIComponent(locale)}`,
    signal,
  );
}
