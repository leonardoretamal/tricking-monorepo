import {
  DEFAULT_TUTORIAL_PAGE_SIZE,
  MAX_TUTORIAL_PAGE_SIZE,
  TUTORIAL_SORTS,
  listTutorials,
} from '@tricking/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logger, newTraceId } from '@/lib/logger';

// Listado de tutoriales de Kojo. Validacion estricta de parametros con Zod, paginacion y
// busqueda resueltas en la base de datos. La pagina no se prerrenderiza.
export const dynamic = 'force-dynamic';

const tutorialsQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(TUTORIAL_SORTS).default('date-desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_TUTORIAL_PAGE_SIZE)
    .default(DEFAULT_TUTORIAL_PAGE_SIZE),
});

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = tutorialsQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const { q, sort, page, pageSize } = parsed.data;
    const result = await listTutorials({ q, sort, page, pageSize });

    logger.info({ traceId, total: result.total, page }, 'listado de tutoriales');

    return NextResponse.json({ ...result, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el listado de tutoriales',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
