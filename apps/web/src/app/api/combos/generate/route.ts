import { NextResponse } from 'next/server';

import { consumeAiDailyBudget, getClientIp } from '@/lib/ai-client';
import { getAiDailyCap, getAiProviders } from '@/lib/ai-providers';
import {
  buildComboFromIds,
  buildComboFromPool,
  loadComboPool,
  refineComboOrderWithAi,
} from '@/lib/combo-builder';
import { comboRequestSchema, type ComboResponse } from '@/lib/combo-schemas';
import { logger, newTraceId } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';

// Generador de combinaciones (Fase 22). Siempre construye de forma determinista con los
// trucos conocidos que envia el cliente; si hay IA configurada, intenta refinar el orden
// dentro de ese mismo conjunto y, si la respuesta no cumple, conserva el deterministico.
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const COMBO_RATE_LIMIT = 30;
const COMBO_RATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  const traceId = newTraceId();
  const startedAt = Date.now();

  try {
    const ip = getClientIp(request);
    const limit = await checkRateLimit(`combos:${ip}`, {
      limit: COMBO_RATE_LIMIT,
      windowMs: COMBO_RATE_WINDOW_MS,
    });
    if (!limit.success) {
      logger.warn({ traceId }, 'combinaciones: rate limit excedido');
      return NextResponse.json({ error: 'rate_limited', traceId }, { status: 429 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body', traceId }, { status: 400 });
    }

    const parsed = comboRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body', traceId }, { status: 400 });
    }

    const data = parsed.data;
    const pool = await loadComboPool(data);
    let result = buildComboFromPool(pool, data.length);
    let source: ComboResponse['source'] = 'deterministic';
    let provider: string | null = null;

    const aiProviders = getAiProviders();
    if (
      aiProviders.length > 0 &&
      result.steps.length >= 2 &&
      (await consumeAiDailyBudget(getAiDailyCap()))
    ) {
      const refined = await refineComboOrderWithAi(aiProviders, result, data.length, traceId);
      if (refined !== null) {
        const candidate = buildComboFromIds(pool, refined.order);
        if (candidate.steps.length >= 2) {
          result = candidate;
          source = 'ai';
          provider = refined.provider;
        }
      }
    }

    logger.info(
      {
        traceId,
        known: data.knownTrickIds.length,
        candidates: pool.order.length,
        length: data.length,
        steps: result.steps.length,
        source,
        provider,
        latencyMs: Date.now() - startedAt,
      },
      'combinaciones: resultado generado',
    );

    return NextResponse.json({
      steps: result.steps,
      transitions: result.transitions,
      source,
      provider,
      traceId,
    });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'combinaciones: fallo inesperado',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
