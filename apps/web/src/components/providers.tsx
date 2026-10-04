'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';

import { queryPersister } from '@/lib/query-persister';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Version del contrato de las respuestas cacheadas. Se sube cuando cambia la forma de
// una respuesta cacheada para que la cache persistida vieja se descarte en vez de
// rehidratarse con una forma obsoleta (regla de validar datos rehidratados).
const CACHE_BUSTER = '2026-10-04-fase-11-14';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            gcTime: MAX_AGE_MS,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister, maxAge: MAX_AGE_MS, buster: CACHE_BUSTER }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
