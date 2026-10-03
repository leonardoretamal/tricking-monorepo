import { z } from 'zod';

// Unica puerta de entrada a localStorage del monorepo. Nunca guardar tokens,
// contrasenas ni datos personales: esos viven en cookies httpOnly o en el backend.
// Toda lectura valida con Zod y toda operacion degrada con gracia (modo privado,
// cuota superada, iframes) sin lanzar. Guarda SSR: sin window no se toca el almacen.

export const STORAGE_PREFIX = 'tricking:';
export const THEME_KEY = 'theme';

export const MINUTE_MS = 60_000;
export const FIVE_MINUTES_MS = 5 * MINUTE_MS;
export const TEN_MINUTES_MS = 10 * MINUTE_MS;
export const ONE_DAY_MS = 24 * 60 * MINUTE_MS;
export const SEVEN_DAYS_MS = 7 * 24 * 60 * MINUTE_MS;
export const THIRTY_DAYS_MS = 30 * 24 * 60 * MINUTE_MS;
export const ONE_YEAR_MS = 365 * 24 * 60 * MINUTE_MS;

export const STORAGE_DEBOUNCE_MS = 300;

export type StoredEntry<T> = {
  value: T;
  expiresAt: number | null;
};

const storedEntrySchema = z.object({
  value: z.unknown(),
  expiresAt: z.number().nullable(),
});

const pendingWrites = new Map<string, ReturnType<typeof setTimeout>>();

function withPrefix(key: string): string {
  return key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`;
}

function getStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function safeRemove(storage: Storage, fullKey: string): void {
  try {
    storage.removeItem(fullKey);
  } catch {
    // Degrada con gracia: si no se puede borrar, se ignora.
  }
}

export function readEntry<T>(key: string, schema: z.ZodType<T>): T | null {
  const storage = getStorage();
  if (storage === null) {
    return null;
  }
  const fullKey = withPrefix(key);
  try {
    const raw = storage.getItem(fullKey);
    if (raw === null) {
      return null;
    }
    const parsed: unknown = JSON.parse(raw);
    const envelope = storedEntrySchema.safeParse(parsed);
    if (!envelope.success) {
      safeRemove(storage, fullKey);
      return null;
    }
    if (envelope.data.expiresAt !== null && envelope.data.expiresAt <= Date.now()) {
      safeRemove(storage, fullKey);
      return null;
    }
    const validated = schema.safeParse(envelope.data.value);
    if (!validated.success) {
      safeRemove(storage, fullKey);
      return null;
    }
    return validated.data;
  } catch {
    safeRemove(storage, fullKey);
    return null;
  }
}

export function writeEntry<T>(key: string, value: T, ttlMs?: number): void {
  const storage = getStorage();
  if (storage === null) {
    return;
  }
  const fullKey = withPrefix(key);
  const hasTtl = typeof ttlMs === 'number' && ttlMs > 0;
  const entry: StoredEntry<T> = {
    value,
    expiresAt: hasTtl ? Date.now() + ttlMs : null,
  };
  try {
    storage.setItem(fullKey, JSON.stringify(entry));
  } catch {
    // Degrada con gracia: cuota superada o almacenamiento no disponible.
  }
}

export function removeEntry(key: string): void {
  const storage = getStorage();
  if (storage === null) {
    return;
  }
  safeRemove(storage, withPrefix(key));
}

export function clearAll(): void {
  const storage = getStorage();
  if (storage === null) {
    return;
  }
  try {
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key !== null && key.startsWith(STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      storage.removeItem(key);
    }
  } catch {
    // Degrada con gracia: si falla el recorrido, no se propaga.
  }
}

export function debouncedWrite<T>(key: string, value: T, ttlMs?: number): void {
  if (getStorage() === null) {
    return;
  }
  const fullKey = withPrefix(key);
  const existing = pendingWrites.get(fullKey);
  if (existing !== undefined) {
    clearTimeout(existing);
  }
  const timer = setTimeout(() => {
    pendingWrites.delete(fullKey);
    writeEntry(fullKey, value, ttlMs);
  }, STORAGE_DEBOUNCE_MS);
  pendingWrites.set(fullKey, timer);
}
