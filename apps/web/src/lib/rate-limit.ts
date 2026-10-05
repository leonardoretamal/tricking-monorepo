import { Redis } from '@upstash/redis';

import { logger } from './logger';

// Rate limiting de endpoints de escritura (Fase 18). Usa Upstash Redis en produccion.
// Si faltan las credenciales o el servicio falla, degrada a un limitador en memoria
// con aviso en logs (nunca se registran secretos). La clave no debe contener datos
// personales: solo el identificador del cubo.

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryBuckets = new Map<string, MemoryEntry>();

let redisClient: Redis | null = null;
let redisResolved = false;

function getRedis(): Redis | null {
  if (redisResolved) {
    return redisClient;
  }
  redisResolved = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url === undefined || token === undefined || url === '' || token === '') {
    logger.warn('rate limit: Upstash Redis no configurado, se usa el limitador en memoria');
    return null;
  }
  redisClient = new Redis({ url, token });
  return redisClient;
}

function pruneMemory(now: number): void {
  if (memoryBuckets.size < 1000) {
    return;
  }
  for (const [key, entry] of memoryBuckets) {
    if (entry.resetAt <= now) {
      memoryBuckets.delete(key);
    }
  }
}

function checkMemory(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  pruneMemory(now);

  const entry = memoryBuckets.get(key);
  if (entry === undefined || entry.resetAt <= now) {
    const resetAt = now + options.windowMs;
    memoryBuckets.set(key, { count: 1, resetAt });
    return { success: true, remaining: options.limit - 1, resetAt };
  }

  entry.count += 1;
  const remaining = Math.max(0, options.limit - entry.count);
  return { success: entry.count <= options.limit, remaining, resetAt: entry.resetAt };
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): Promise<RateLimitResult> {
  const redis = getRedis();
  if (redis === null) {
    return checkMemory(key, options);
  }

  const windowSeconds = Math.max(1, Math.ceil(options.windowMs / 1000));
  const redisKey = `ratelimit:${key}`;

  try {
    const current = await redis.incr(redisKey);
    if (current === 1) {
      await redis.expire(redisKey, windowSeconds);
    }
    const ttl = await redis.ttl(redisKey);
    const remaining = Math.max(0, options.limit - current);
    const resetAt = Date.now() + Math.max(0, ttl) * 1000;
    return { success: current <= options.limit, remaining, resetAt };
  } catch (error) {
    logger.warn(
      { error: error instanceof Error ? error.message : 'unknown' },
      'rate limit: fallo Upstash, se degrada al limitador en memoria',
    );
    return checkMemory(key, options);
  }
}
