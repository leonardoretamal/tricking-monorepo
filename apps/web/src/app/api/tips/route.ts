import { listGazeTips } from '@tricking/db';
import { NextResponse } from 'next/server';

import { gazeTipsQuerySchema } from '@/lib/api-schemas';
import { logger, newTraceId } from '@/lib/logger';

// Tips de mirada (Fase 16). Validacion estricta de parametros con Zod, filtros, orden,
// paginacion y total resueltos en la base de datos. La pagina no se prerrenderiza.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = gazeTipsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const { trickType, phase, locale, page, pageSize } = parsed.data;
    const result = await listGazeTips({ trickType, phase, locale, page, pageSize });

    logger.info(
      { traceId, trickType, phase, locale, total: result.total, page },
      'listado de tips de mirada',
    );

    return NextResponse.json({ ...result, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el listado de tips de mirada',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
