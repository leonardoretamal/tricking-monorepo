import { THIRTY_DAYS_MS, readEntry, removeEntry, writeEntry } from '@tricking/shared';
import { z } from 'zod';

import type { Section } from '@/lib/sections';

// Estado de vista del listado de trucos: busqueda, filtros, paginacion y posicion del
// scroll. Es un modulo cliente-seguro: no importa @tricking/db para no arrastrar el
// driver de Neon al bundle del navegador. Solo guarda filtros y posicion; nunca tokens,
// credenciales ni datos personales.

export const TRICKS_VIEW_STORAGE_KEY = 'tricking:tricks-view';
export const TRICKS_VIEW_VERSION = 1 as const;
export const TRICKS_VIEW_TTL_MS = THIRTY_DAYS_MS;

export const tricksViewStateSchema = z.object({
  version: z.literal(TRICKS_VIEW_VERSION),
  pathname: z.string().min(1).max(300),
  q: z.string().max(300).optional(),
  section: z.string().min(1).max(64).optional(),
  sub: z.string().min(1).max(64).optional(),
  difficulty: z.number().int().min(0).max(5).optional(),
  sort: z.string().min(1).max(32),
  page: z.number().int().min(1).max(100_000),
  pageSize: z.number().int().min(1).max(100),
  scrollY: z.number().min(0),
  savedAt: z.number().int().nonnegative(),
});

export type TricksViewState = z.infer<typeof tricksViewStateSchema>;

// Forma minima de los filtros que el listado expone en la URL. `sub` queda como string
// porque algunas vistas anidadas lo usan; la seccion se valida contra SECTIONS al restaurar.
export interface TricksViewFilters {
  q?: string;
  section?: Section;
  sub?: string;
  difficulty?: number;
  sort: string;
  page: number;
  pageSize: number;
}

// Devuelve el estado guardado solo si pertenece a la misma ruta y sigue vigente. Toda
// lectura pasa por el wrapper de storage, que valida con Zod y aplica el TTL de 30 dias.
export function loadTricksViewState(pathname: string): TricksViewState | null {
  try {
    const state = readEntry(TRICKS_VIEW_STORAGE_KEY, tricksViewStateSchema);
    if (state === null) {
      return null;
    }
    if (state.version !== TRICKS_VIEW_VERSION) {
      return null;
    }
    if (state.pathname !== pathname) {
      return null;
    }
    return state;
  } catch {
    return null;
  }
}

// Normaliza con el esquema antes de escribir: los campos desconocidos se descartan y un
// estado invalido no llega al almacenamiento.
export function saveTricksViewState(state: TricksViewState): void {
  try {
    const parsed = tricksViewStateSchema.safeParse(state);
    if (!parsed.success) {
      return;
    }
    writeEntry(TRICKS_VIEW_STORAGE_KEY, parsed.data, TRICKS_VIEW_TTL_MS);
  } catch {
    // Degrada con gracia: si el almacenamiento falla, la vista sigue funcionando.
  }
}

export function clearTricksViewState(): void {
  try {
    removeEntry(TRICKS_VIEW_STORAGE_KEY);
  } catch {
    // Degrada con gracia: si no se puede borrar, se ignora.
  }
}
