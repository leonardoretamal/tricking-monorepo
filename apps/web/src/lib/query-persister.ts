import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';
import { ONE_DAY_MS, readEntry, removeEntry, writeEntry } from '@tricking/shared';
import { z } from 'zod';

// Persister de TanStack Query sobre el wrapper de localStorage del monorepo.
// El wrapper es la unica puerta de entrada al almacenamiento. El cliente persistido
// es un dato opaco: se valida la forma minima y se descarta si no la cumple.

const CACHE_KEY = 'query-cache';
const CACHE_TTL_MS = ONE_DAY_MS;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPersistedClient(value: unknown): value is PersistedClient {
  return (
    isRecord(value) &&
    typeof value.timestamp === 'number' &&
    typeof value.buster === 'string' &&
    isRecord(value.clientState)
  );
}

export const queryPersister: Persister = {
  persistClient: async (client) => {
    writeEntry(CACHE_KEY, client, CACHE_TTL_MS);
  },
  restoreClient: async () => {
    const stored = readEntry(CACHE_KEY, z.unknown());
    return isPersistedClient(stored) ? stored : undefined;
  },
  removeClient: async () => {
    removeEntry(CACHE_KEY);
  },
};
