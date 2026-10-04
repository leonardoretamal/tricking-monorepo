import { searchAll } from '@tricking/db';
import { NextResponse } from 'next/server';

import { logger, newTraceId } from '@/lib/logger';
import { searchQuerySchema } from '@/lib/search-schemas';

// La busqueda consulta la base de datos en cada peticion; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = searchQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const { q, type, page, pageSize } = parsed.data;
    const result = await searchAll({ q, type, page, pageSize });

    logger.info({ traceId, q, type, total: result.total, page }, 'busqueda global');

    return NextResponse.json({ ...result, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo la busqueda global',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
