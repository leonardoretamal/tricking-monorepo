import { listTricksByIds } from '@tricking/db';
import { NextResponse } from 'next/server';

import { tricksByIdsQuerySchema } from '@/lib/api-schemas';
import { logger, newTraceId } from '@/lib/logger';

// Resuelve una lista de ids locales (progreso del navegador) a la referencia minima del
// catalogo (nombre, seccion y dificultad). El listado por estado de /progress usa este
// endpoint porque los ids viven en localStorage y el servidor no los conoce.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = tricksByIdsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const items = await listTricksByIds(parsed.data.ids);

    logger.info(
      { traceId, requested: parsed.data.ids.length, found: items.length },
      'trucos por id',
    );

    return NextResponse.json({ items, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo la resolucion de trucos por id',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
