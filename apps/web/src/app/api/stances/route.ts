import { listStances } from '@tricking/db';
import { NextResponse } from 'next/server';

import { stancesQuerySchema } from '@/lib/api-schemas';
import { logger, newTraceId } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = stancesQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const { page, pageSize } = parsed.data;
    const result = await listStances({ page, pageSize });

    logger.info({ traceId, total: result.total, page }, 'listado de stances');

    return NextResponse.json({ ...result, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el listado de stances',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
