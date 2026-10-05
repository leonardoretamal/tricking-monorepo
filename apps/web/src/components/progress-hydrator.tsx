'use client';

import { useEffect } from 'react';

import { useProgressStore } from '@/lib/progress-store';

// Hidrata el progreso una sola vez al montar. Se monta globalmente (layout o
// providers) para que el store este listo antes de que los controles y el resumen
// lo consulten. La hidratacion es idempotente: el store ignora llamadas repetidas.
export function ProgressHydrator() {
  const hydrate = useProgressStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return null;
}
