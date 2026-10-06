'use client';

import { debouncedWrite, readEntry } from '@tricking/shared';
import { create } from 'zustand';

import {
  COMBOS_STORAGE_KEY,
  COMBOS_VERSION,
  COMBO_MAX_SAVED,
  combosStateSchema,
  savedComboSchema,
  type ComboStatus,
  type CombosState,
  type SavedCombo,
  type SavedComboStep,
} from '@/lib/combo-schemas';

// Combinaciones guardadas del usuario sin login (Fase 28). Viven solo en el navegador:
// Zustand en memoria para la reactividad y el wrapper de storage como unica puerta a
// localStorage. Persistencia debounced (300 ms), sin TTL y con tope duro de 5.

export interface SaveComboInput {
  title: string;
  description?: string;
  status?: ComboStatus;
  steps: SavedComboStep[];
}

export type ComboPatch = Partial<Pick<SavedCombo, 'title' | 'description' | 'status' | 'steps'>>;

type ComboStore = {
  hydrated: boolean;
  combos: SavedCombo[];
  hydrate: () => void;
  canAdd: () => boolean;
  addCombo: (input: SaveComboInput) => SavedCombo | null;
  updateCombo: (id: string, patch: ComboPatch) => boolean;
  removeCombo: (id: string) => void;
};

function persist(combos: SavedCombo[]): void {
  const state: CombosState = {
    version: COMBOS_VERSION,
    updatedAt: new Date().toISOString(),
    combos,
  };
  debouncedWrite(COMBOS_STORAGE_KEY, state);
}

function newComboId(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi !== undefined && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `combo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function cleanDescription(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export const useComboStore = create<ComboStore>((set, get) => ({
  hydrated: false,
  combos: [],
  hydrate: () => {
    if (get().hydrated) {
      return;
    }
    const stored = readEntry(COMBOS_STORAGE_KEY, combosStateSchema);
    set({ hydrated: true, combos: stored?.combos ?? [] });
  },
  canAdd: () => get().combos.length < COMBO_MAX_SAVED,
  addCombo: (input) => {
    const current = get().combos;
    if (current.length >= COMBO_MAX_SAVED) {
      return null;
    }
    const now = new Date().toISOString();
    const candidate = savedComboSchema.safeParse({
      id: newComboId(),
      title: input.title.trim(),
      description: cleanDescription(input.description),
      status: input.status ?? 'draft',
      steps: input.steps,
      createdAt: now,
      updatedAt: now,
    });
    if (!candidate.success) {
      return null;
    }
    const next = [...current, candidate.data];
    set({ combos: next });
    persist(next);
    return candidate.data;
  },
  updateCombo: (id, patch) => {
    const current = get().combos;
    const index = current.findIndex((combo) => combo.id === id);
    const existing = current[index];
    if (existing === undefined) {
      return false;
    }
    const merged: SavedCombo = {
      ...existing,
      ...patch,
      description:
        patch.description !== undefined
          ? cleanDescription(patch.description)
          : existing.description,
      updatedAt: new Date().toISOString(),
    };
    const candidate = savedComboSchema.safeParse(merged);
    if (!candidate.success) {
      return false;
    }
    const next = [...current];
    next[index] = candidate.data;
    set({ combos: next });
    persist(next);
    return true;
  },
  removeCombo: (id) => {
    const next = get().combos.filter((combo) => combo.id !== id);
    set({ combos: next });
    persist(next);
  },
}));
