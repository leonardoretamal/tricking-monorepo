import { listTransitions } from '@tricking/db';
import { NextResponse } from 'next/server';

import { transitionsQuerySchema } from '@/lib/api-schemas';
import { logger, newTraceId } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = transitionsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const { group, q, sort, page, pageSize } = parsed.data;
    const result = await listTransitions({ group, q, sort, page, pageSize });

    logger.info({ traceId, group, total: result.total, page }, 'listado de transiciones');

    return NextResponse.json({ ...result, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el listado de transiciones',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
