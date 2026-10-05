import { createFeedback, listFeedback } from '@tricking/db';
import { NextResponse } from 'next/server';

import { sendFeedbackNotification } from '@/lib/email';
import { isFeedbackAdmin } from '@/lib/feedback-auth';
import {
  feedbackQuerySchema,
  feedbackSubmitSchema,
  FEEDBACK_MIN_FILL_MS,
} from '@/lib/feedback-schemas';
import { logger, newTraceId } from '@/lib/logger';
import { checkRateLimit } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FEEDBACK_RATE_LIMIT = 5;
const FEEDBACK_RATE_WINDOW_MS = 60_000;

function getClientIp(request: Request): string {
  const cloudflare = request.headers.get('cf-connecting-ip');
  if (cloudflare !== null && cloudflare.trim() !== '') {
    return cloudflare.trim();
  }
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded !== null) {
    const first = forwarded.split(',')[0]?.trim();
    if (first !== undefined && first !== '') {
      return first;
    }
  }
  const realIp = request.headers.get('x-real-ip');
  return realIp !== null && realIp.trim() !== '' ? realIp.trim() : 'unknown';
}

function normalizeOptional(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export async function POST(request: Request) {
  const traceId = newTraceId();

  try {
    const ip = getClientIp(request);
    const limit = await checkRateLimit(`feedback:${ip}`, {
      limit: FEEDBACK_RATE_LIMIT,
      windowMs: FEEDBACK_RATE_WINDOW_MS,
    });
    if (!limit.success) {
      return NextResponse.json({ error: 'rate_limited', traceId }, { status: 429 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body', traceId }, { status: 400 });
    }

    const parsed = feedbackSubmitSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body', traceId }, { status: 400 });
    }

    const data = parsed.data;
    const elapsed = Date.now() - data.formStartedAt;
    // Un reloj de cliente adelantado da un tiempo negativo: se permite. Solo se rechaza
    // el llenado demasiado rapido (posible bot) dentro de una ventana no negativa.
    if (!Number.isFinite(elapsed) || (elapsed >= 0 && elapsed < FEEDBACK_MIN_FILL_MS)) {
      return NextResponse.json({ error: 'invalid_body', traceId }, { status: 400 });
    }

    const turnstile = await verifyTurnstile(data.turnstileToken, ip);
    if (turnstile.blocked) {
      return NextResponse.json({ error: 'captcha_failed', traceId }, { status: 400 });
    }

    const userAgent = request.headers.get('user-agent')?.slice(0, 500) ?? null;

    const created = await createFeedback({
      type: data.type,
      name: normalizeOptional(data.name),
      email: normalizeOptional(data.email),
      message: data.message,
      page: normalizeOptional(data.page),
      locale: data.locale ?? null,
      userAgent,
    });

    logger.info({ traceId, feedbackId: created.id, type: data.type }, 'feedback guardado');

    await sendFeedbackNotification(
      {
        id: created.id,
        type: data.type,
        name: normalizeOptional(data.name),
        email: normalizeOptional(data.email),
        message: data.message,
        page: normalizeOptional(data.page),
        locale: data.locale ?? null,
        createdAt: created.createdAt,
      },
      traceId,
    );

    return NextResponse.json({ ok: true, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo al guardar el feedback',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const traceId = newTraceId();

  if (!isFeedbackAdmin(request, traceId)) {
    return NextResponse.json({ error: 'unauthorized', traceId }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const parsed = feedbackQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const result = await listFeedback(parsed.data);
    logger.info(
      { traceId, total: result.total, page: result.page },
      'listado de feedback del panel',
    );

    return NextResponse.json({ ...result, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el listado de feedback',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
