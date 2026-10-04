import { listVariations } from '@tricking/db';
import { NextResponse } from 'next/server';

import { variationsQuerySchema } from '@/lib/api-schemas';
import { logger, newTraceId } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = variationsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const { kind, q, sort, page, pageSize } = parsed.data;
    const result = await listVariations({ kind, q, sort, page, pageSize });

    logger.info({ traceId, kind, total: result.total, page }, 'listado de variaciones');

    return NextResponse.json({ ...result, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el listado de variaciones',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
