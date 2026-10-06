// @vitest-environment jsdom
import { clearAll, readEntry } from '@tricking/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { COMBO_MAX_SAVED, COMBOS_STORAGE_KEY, combosStateSchema } from './combo-schemas';
import type { SavedComboStep } from './combo-schemas';
import { useComboStore } from './combo-store';

const steps: SavedComboStep[] = [
  { trickId: 'aerial', name: 'Aerial' },
  { trickId: 'btwist', name: 'B-Twist' },
];

const singleStep: SavedComboStep[] = [{ trickId: 'aerial', name: 'Aerial' }];

beforeEach(() => {
  vi.useFakeTimers();
  clearAll();
  useComboStore.setState({ hydrated: false, combos: [] });
});

afterEach(() => {
  vi.useRealTimers();
  clearAll();
});

describe('comboStore', () => {
  it('agrega una combinacion y la persiste tras el debounce', () => {
    const created = useComboStore.getState().addCombo({ title: 'Combo 1', steps });
    expect(created?.title).toBe('Combo 1');
    expect(created?.status).toBe('draft');

    vi.advanceTimersByTime(400);

    const stored = readEntry(COMBOS_STORAGE_KEY, combosStateSchema);
    expect(stored?.combos).toHaveLength(1);
  });

  it('impone el tope duro de combinaciones guardadas', () => {
    for (let index = 0; index < COMBO_MAX_SAVED; index += 1) {
      expect(useComboStore.getState().addCombo({ title: `Combo ${index}`, steps })).not.toBeNull();
    }
    expect(useComboStore.getState().canAdd()).toBe(false);
    expect(useComboStore.getState().addCombo({ title: 'Extra', steps })).toBeNull();
    expect(useComboStore.getState().combos).toHaveLength(COMBO_MAX_SAVED);
  });

  it('actualiza y elimina una combinacion', () => {
    const created = useComboStore.getState().addCombo({ title: 'Combo', steps });
    const id = created?.id ?? '';
    const ok = useComboStore
      .getState()
      .updateCombo(id, { title: 'Renombrado', status: 'practicing' });
    expect(ok).toBe(true);
    expect(useComboStore.getState().combos[0]?.title).toBe('Renombrado');
    expect(useComboStore.getState().combos[0]?.status).toBe('practicing');

    useComboStore.getState().removeCombo(id);
    expect(useComboStore.getState().combos).toHaveLength(0);
  });

  it('rechaza un titulo vacio', () => {
    expect(useComboStore.getState().addCombo({ title: '   ', steps })).toBeNull();
  });

  it('rechaza menos de dos pasos', () => {
    expect(useComboStore.getState().addCombo({ title: 'Uno', steps: singleStep })).toBeNull();
  });
});
