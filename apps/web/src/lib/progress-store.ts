'use client';

import { create } from 'zustand';
import { debouncedWrite, readEntry, removeEntry } from '@tricking/shared';
import {
  PROGRESS_STORAGE_KEY,
  PROGRESS_VERSION,
  progressStateSchema,
  type ProgressState,
  type ProgressTricks,
  type TrickProgressStatus,
} from '@/lib/progress-schemas';

// Estado del progreso del usuario sin login (Fase 21). Vive solo en el navegador:
// Zustand en memoria para la reactividad y el wrapper de storage como unica puerta
// a localStorage. La persistencia es debounced (300 ms) y sin TTL.

type ProgressStore = {
  hydrated: boolean;
  tricks: ProgressTricks;
  hydrate: () => void;
  setStatus: (trickId: string, status: TrickProgressStatus | null) => void;
  clear: () => void;
  replaceAll: (tricks: ProgressTricks) => void;
};

function persist(tricks: ProgressTricks): void {
  const state: ProgressState = {
    version: PROGRESS_VERSION,
    updatedAt: new Date().toISOString(),
    tricks,
  };
  debouncedWrite(PROGRESS_STORAGE_KEY, state);
}

export const useProgressStore = create<ProgressStore>((set, get) => ({
  hydrated: false,
  tricks: {},
  hydrate: () => {
    if (get().hydrated) {
      return;
    }
    const stored = readEntry(PROGRESS_STORAGE_KEY, progressStateSchema);
    set({ hydrated: true, tricks: stored?.tricks ?? {} });
  },
  setStatus: (trickId, status) => {
    const next: ProgressTricks = { ...get().tricks };
    if (status === null) {
      delete next[trickId];
    } else {
      next[trickId] = status;
    }
    set({ tricks: next });
    persist(next);
  },
  clear: () => {
    set({ tricks: {} });
    removeEntry(PROGRESS_STORAGE_KEY);
  },
  replaceAll: (tricks) => {
    set({ tricks });
    persist(tricks);
  },
}));

export function getKnownTrickIds(): string[] {
  return Object.keys(useProgressStore.getState().tricks);
}
