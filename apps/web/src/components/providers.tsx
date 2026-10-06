'use client';

import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';
import { Toaster } from 'sonner';

import { queryPersister } from '@/lib/query-persister';

const MAX_AGE_MS = 24 * 60 * 60 * 1000;

// Version del contrato de las respuestas cacheadas. Se sube cuando cambia la forma de
// una respuesta cacheada para que la cache persistida vieja se descarte en vez de
// rehidratarse con una forma obsoleta (regla de validar datos rehidratados).
const CACHE_BUSTER = '2026-10-05-loopkicks-notes-es';

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
      persistOptions={{
        persister: queryPersister,
        maxAge: MAX_AGE_MS,
        buster: CACHE_BUSTER,
        // El panel de feedback no se persiste: su queryKey lleva el token de
        // administracion y su data lleva datos personales (nombre, correo, mensaje).
        // Guardarlos en localStorage violaria las reglas de secretos y de cacheo.
        // Solo se persisten queries con datos ya resueltos (success): una query que
        // quedaba en vuelo se guardaba como pendiente y al rehidratar rechazaba con
        // CancelledError.
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && query.queryKey[0] !== 'feedback-admin',
        },
      }}
    >
      {children}
      <Toaster position="top-center" richColors closeButton />
    </PersistQueryClientProvider>
  );
}
