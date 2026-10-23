// @vitest-environment jsdom
import { clearAll, writeEntry } from '@tricking/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  TRICKS_VIEW_STORAGE_KEY,
  TRICKS_VIEW_TTL_MS,
  TRICKS_VIEW_VERSION,
  clearTricksViewState,
  loadTricksViewState,
  saveTricksViewState,
  tricksViewStateSchema,
  type TricksViewState,
} from './tricks-view-state';

const NOW = new Date('2026-01-15T12:00:00.000Z').getTime();

function validState(overrides: Partial<TricksViewState> = {}): TricksViewState {
  return {
    version: TRICKS_VIEW_VERSION,
    pathname: '/tricks',
    q: 'twist',
    section: 'backward',
    difficulty: 3,
    sort: 'name-desc',
    page: 2,
    pageSize: 48,
    scrollY: 640,
    savedAt: NOW,
    ...overrides,
  };
}

function rawEntry(): string | null {
  return window.localStorage.getItem(TRICKS_VIEW_STORAGE_KEY);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
  clearAll();
});

afterEach(() => {
  vi.useRealTimers();
  clearAll();
});

describe('tricksViewStateSchema', () => {
  it('acepta un estado completo y descarta los campos fuera del esquema', () => {
    const parsed = tricksViewStateSchema.parse({
      ...validState(),
      token: 'no-deberia-quedar',
    });

    expect(parsed).toEqual(validState());
    expect(parsed).not.toHaveProperty('token');
  });

  it('rechaza dificultad, pagina, tamano y scroll fuera de rango', () => {
    expect(tricksViewStateSchema.safeParse(validState({ difficulty: 9 })).success).toBe(false);
    expect(tricksViewStateSchema.safeParse(validState({ page: 0 })).success).toBe(false);
    expect(tricksViewStateSchema.safeParse(validState({ pageSize: 500 })).success).toBe(false);
    expect(tricksViewStateSchema.safeParse(validState({ scrollY: -12 })).success).toBe(false);
  });

  it('exige la version 1 y el sello de tiempo', () => {
    expect(tricksViewStateSchema.safeParse({ ...validState(), version: 2 }).success).toBe(false);

    const base = validState();
    const withoutSavedAt = {
      version: base.version,
      pathname: base.pathname,
      sort: base.sort,
      page: base.page,
      pageSize: base.pageSize,
      scrollY: base.scrollY,
    };
    expect(tricksViewStateSchema.safeParse(withoutSavedAt).success).toBe(false);
  });
});

describe('loadTricksViewState', () => {
  it('devuelve el estado guardado para la misma ruta', () => {
    saveTricksViewState(validState());

    expect(loadTricksViewState('/tricks')).toEqual(validState());
  });

  it('ignora el estado de otra ruta', () => {
    saveTricksViewState(validState({ pathname: '/tricks/backward' }));

    expect(loadTricksViewState('/tricks')).toBeNull();
  });

  it('devuelve null cuando no hay nada guardado', () => {
    expect(loadTricksViewState('/tricks')).toBeNull();
  });

  it('devuelve null ante un json corrupto', () => {
    window.localStorage.setItem(TRICKS_VIEW_STORAGE_KEY, '{"value":');

    expect(loadTricksViewState('/tricks')).toBeNull();
  });

  it('devuelve null ante un valor que no cumple el esquema', () => {
    writeEntry(TRICKS_VIEW_STORAGE_KEY, { foo: 'bar' });

    expect(loadTricksViewState('/tricks')).toBeNull();
  });

  it('devuelve null cuando la version guardada no es la actual', () => {
    writeEntry(TRICKS_VIEW_STORAGE_KEY, { ...validState(), version: 2 });

    expect(loadTricksViewState('/tricks')).toBeNull();
  });
});

describe('saveTricksViewState', () => {
  it('guarda solo los campos del esquema', () => {
    const withExtra: TricksViewState & { token: string } = {
      ...validState(),
      token: 'no-deberia-quedar',
    };

    saveTricksViewState(withExtra);

    expect(rawEntry()).not.toBeNull();
    expect(rawEntry() ?? '').not.toContain('token');
    expect(loadTricksViewState('/tricks')).not.toHaveProperty('token');
  });

  it('no escribe un estado invalido', () => {
    saveTricksViewState(validState({ pageSize: 500 }));

    expect(rawEntry()).toBeNull();
  });

  it('aplica el TTL de 30 dias', () => {
    saveTricksViewState(validState());

    vi.setSystemTime(NOW + TRICKS_VIEW_TTL_MS - 1_000);
    expect(loadTricksViewState('/tricks')).not.toBeNull();

    vi.setSystemTime(NOW + TRICKS_VIEW_TTL_MS + 1_000);
    expect(loadTricksViewState('/tricks')).toBeNull();
  });
});

describe('clearTricksViewState', () => {
  it('borra el estado guardado', () => {
    saveTricksViewState(validState());

    clearTricksViewState();

    expect(rawEntry()).toBeNull();
    expect(loadTricksViewState('/tricks')).toBeNull();
  });
});
