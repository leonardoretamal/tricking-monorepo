import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import {
  STORAGE_DEBOUNCE_MS,
  STORAGE_PREFIX,
  clearAll,
  debouncedWrite,
  readEntry,
  removeEntry,
  writeEntry,
} from './storage';

interface MemoryStorage {
  readonly length: number;
  clear(): void;
  getItem(key: string): string | null;
  key(index: number): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

function createMemoryStorage(): MemoryStorage {
  const store = new Map<string, string>();
  return {
    get length(): number {
      return store.size;
    },
    clear(): void {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.has(key) ? (store.get(key) ?? null) : null;
    },
    key(index: number): string | null {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
  };
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = createMemoryStorage();
  vi.stubGlobal('window', { localStorage: storage });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('storage', () => {
  it('escribe y lee un valor simple validado con Zod', () => {
    writeEntry('lang', 'es');
    expect(storage.getItem(`${STORAGE_PREFIX}lang`)).not.toBeNull();
    expect(readEntry('lang', z.string())).toBe('es');
  });

  it('no duplica el prefijo si la clave ya viene completa', () => {
    writeEntry(`${STORAGE_PREFIX}lang`, 'en');
    expect(storage.getItem(`${STORAGE_PREFIX}lang`)).not.toBeNull();
    expect(storage.getItem(`${STORAGE_PREFIX}${STORAGE_PREFIX}lang`)).toBeNull();
    expect(readEntry(`${STORAGE_PREFIX}lang`, z.string())).toBe('en');
  });

  it('expira por TTL y borra la entrada vencida', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    writeEntry('cache', 'vigente', 1_000);
    expect(readEntry('cache', z.string())).toBe('vigente');
    vi.advanceTimersByTime(1_001);
    expect(readEntry('cache', z.string())).toBeNull();
    expect(storage.getItem(`${STORAGE_PREFIX}cache`)).toBeNull();
  });

  it('devuelve null y borra ante JSON corrupto', () => {
    storage.setItem(`${STORAGE_PREFIX}roto`, '{no-es-json');
    expect(readEntry('roto', z.string())).toBeNull();
    expect(storage.getItem(`${STORAGE_PREFIX}roto`)).toBeNull();
  });

  it('rechaza con Zod un valor que no cumple el esquema', () => {
    writeEntry('conteo', 123);
    expect(readEntry('conteo', z.string())).toBeNull();
    expect(storage.getItem(`${STORAGE_PREFIX}conteo`)).toBeNull();
  });

  it('removeEntry borra solo la clave indicada', () => {
    writeEntry('a', 'uno');
    writeEntry('b', 'dos');
    removeEntry('a');
    expect(readEntry('a', z.string())).toBeNull();
    expect(readEntry('b', z.string())).toBe('dos');
  });

  it('clearAll borra solo las claves con prefijo del proyecto', () => {
    storage.setItem('otra-app', 'intacta');
    writeEntry('a', 'uno');
    writeEntry('b', 'dos');
    clearAll();
    expect(storage.getItem(`${STORAGE_PREFIX}a`)).toBeNull();
    expect(storage.getItem(`${STORAGE_PREFIX}b`)).toBeNull();
    expect(storage.getItem('otra-app')).toBe('intacta');
  });

  it('agrupa las escrituras por clave con un debounce de 300 ms', () => {
    vi.useFakeTimers();
    debouncedWrite('scroll', 10);
    debouncedWrite('scroll', 20);
    vi.advanceTimersByTime(STORAGE_DEBOUNCE_MS - 1);
    expect(storage.getItem(`${STORAGE_PREFIX}scroll`)).toBeNull();
    vi.advanceTimersByTime(1);
    expect(readEntry('scroll', z.number())).toBe(20);
  });

  it('no lanza ni toca el almacenamiento cuando no hay window (SSR)', () => {
    vi.stubGlobal('window', undefined);
    expect(() => writeEntry('theme', 'tricking-dark')).not.toThrow();
    expect(() => debouncedWrite('theme', 'tricking-dark')).not.toThrow();
    expect(readEntry('theme', z.string())).toBeNull();
    expect(() => removeEntry('theme')).not.toThrow();
    expect(() => clearAll()).not.toThrow();
  });
});
