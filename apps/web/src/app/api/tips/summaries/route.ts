import { listGazeTipSummaries } from '@tricking/db';
import { NextResponse } from 'next/server';

import { gazeLocaleQuerySchema } from '@/lib/api-schemas';
import { logger, newTraceId } from '@/lib/logger';

// Bloques destacados de la seccion de tips (idea clave, regla de oro y resumen corto).
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = gazeLocaleQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const items = await listGazeTipSummaries(parsed.data.locale);

    logger.info({ traceId, locale: parsed.data.locale, total: items.length }, 'resumenes de tips');

    return NextResponse.json({ items, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el listado de resumenes de tips',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
