import { getGazeTipType } from '@tricking/db';
import { NextResponse } from 'next/server';

import { gazeLocaleQuerySchema, slugSchema } from '@/lib/api-schemas';
import { logger, newTraceId } from '@/lib/logger';

// Detalle de un tipo de truco de la seccion de tips, agrupado por fase.
export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ trickType: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  const traceId = newTraceId();

  try {
    const { trickType } = await context.params;
    const parsedSlug = slugSchema.safeParse(trickType);
    if (!parsedSlug.success) {
      return NextResponse.json({ error: 'invalid_trick_type', traceId }, { status: 400 });
    }

    const parsedLocale = gazeLocaleQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    if (!parsedLocale.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const detail = await getGazeTipType(parsedSlug.data, parsedLocale.data.locale);

    if (!detail) {
      return NextResponse.json({ error: 'not_found', traceId }, { status: 404 });
    }

    return NextResponse.json({ ...detail, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el detalle de tips de mirada',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
