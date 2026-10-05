import { softDeleteFeedback, updateFeedbackStatus } from '@tricking/db';
import { NextResponse } from 'next/server';

import { isFeedbackAdmin } from '@/lib/feedback-auth';
import { feedbackStatusSchema } from '@/lib/feedback-schemas';
import { logger, newTraceId } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type FeedbackRouteContext = {
  params: Promise<{ id: string }>;
};

function parseId(value: string): number | null {
  // Solo enteros positivos exactos: rechaza "12abc" o "1.9" en vez de truncarlos.
  if (!/^[1-9][0-9]*$/.test(value)) {
    return null;
  }
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

export async function PATCH(request: Request, { params }: FeedbackRouteContext) {
  const traceId = newTraceId();

  if (!isFeedbackAdmin(request, traceId)) {
    return NextResponse.json({ error: 'unauthorized', traceId }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: 'invalid_id', traceId }, { status: 400 });
  }

  try {
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid_body', traceId }, { status: 400 });
    }

    const parsed = feedbackStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_body', traceId }, { status: 400 });
    }

    const updated = await updateFeedbackStatus(id, parsed.data.status);
    if (!updated) {
      return NextResponse.json({ error: 'not_found', traceId }, { status: 404 });
    }

    logger.info(
      { traceId, feedbackId: id, status: parsed.data.status },
      'estado de feedback actualizado',
    );
    return NextResponse.json({ ok: true, traceId });
  } catch (error) {
    logger.error(
      { traceId, feedbackId: id, error: error instanceof Error ? error.message : 'unknown' },
      'fallo al actualizar el estado del feedback',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: FeedbackRouteContext) {
  const traceId = newTraceId();

  if (!isFeedbackAdmin(request, traceId)) {
    return NextResponse.json({ error: 'unauthorized', traceId }, { status: 401 });
  }

  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (id === null) {
    return NextResponse.json({ error: 'invalid_id', traceId }, { status: 400 });
  }

  try {
    const deleted = await softDeleteFeedback(id);
    if (!deleted) {
      return NextResponse.json({ error: 'not_found', traceId }, { status: 404 });
    }

    logger.info({ traceId, feedbackId: id }, 'feedback eliminado (soft delete)');
    return NextResponse.json({ ok: true, traceId });
  } catch (error) {
    logger.error(
      { traceId, feedbackId: id, error: error instanceof Error ? error.message : 'unknown' },
      'fallo al eliminar el feedback',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
