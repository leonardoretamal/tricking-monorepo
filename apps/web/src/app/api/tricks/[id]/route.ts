import { getTrickById } from '@tricking/db';
import { NextResponse } from 'next/server';

import { trickIdSchema } from '@/lib/api-schemas';
import { logger, newTraceId } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const traceId = newTraceId();

  try {
    const { id } = await context.params;
    const parsedId = trickIdSchema.safeParse(id);
    if (!parsedId.success) {
      return NextResponse.json({ error: 'invalid_id', traceId }, { status: 400 });
    }

    const trick = await getTrickById(parsedId.data);

    if (!trick) {
      return NextResponse.json({ error: 'not_found', traceId }, { status: 404 });
    }

    return NextResponse.json(trick);
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el detalle de truco',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
