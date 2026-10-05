// @vitest-environment jsdom
import { clearAll, readEntry } from '@tricking/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { getKnownTrickIds, useProgressStore } from './progress-store';
import { PROGRESS_STORAGE_KEY, progressStateSchema } from './progress-schemas';

beforeEach(() => {
  vi.useFakeTimers();
  clearAll();
  useProgressStore.setState({ hydrated: false, tricks: {} });
});

afterEach(() => {
  vi.useRealTimers();
  clearAll();
});

describe('progressStore', () => {
  it('hidrata vacio cuando no hay nada guardado', () => {
    useProgressStore.getState().hydrate();
    expect(useProgressStore.getState().hydrated).toBe(true);
    expect(useProgressStore.getState().tricks).toEqual({});
  });

  it('marca un truco y lo persiste tras el debounce', () => {
    useProgressStore.getState().setStatus('aerial', 'learned');
    expect(useProgressStore.getState().tricks.aerial).toBe('learned');

    vi.advanceTimersByTime(400);

    const stored = readEntry(PROGRESS_STORAGE_KEY, progressStateSchema);
    expect(stored?.tricks.aerial).toBe('learned');
  });

  it('quita la marca con null', () => {
    useProgressStore.getState().setStatus('aerial', 'learned');
    useProgressStore.getState().setStatus('aerial', null);
    expect(useProgressStore.getState().tricks.aerial).toBeUndefined();
  });

  it('reemplaza todo el progreso', () => {
    useProgressStore.getState().replaceAll({ btwist: 'want', raiz: 'in_progress' });
    expect(useProgressStore.getState().tricks).toEqual({ btwist: 'want', raiz: 'in_progress' });
  });

  it('limpia el progreso y el storage', () => {
    useProgressStore.getState().setStatus('aerial', 'learned');
    vi.advanceTimersByTime(400);
    useProgressStore.getState().clear();
    expect(useProgressStore.getState().tricks).toEqual({});
    expect(readEntry(PROGRESS_STORAGE_KEY, progressStateSchema)).toBeNull();
  });

  it('expone los ids marcados', () => {
    useProgressStore.getState().setStatus('aerial', 'learned');
    useProgressStore.getState().setStatus('btwist', 'want');
    expect(getKnownTrickIds().sort()).toEqual(['aerial', 'btwist']);
  });
});
