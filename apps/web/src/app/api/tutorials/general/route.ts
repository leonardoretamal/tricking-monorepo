import { getContentBlock } from '@tricking/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { logger, newTraceId } from '@/lib/logger';

// Bloque "General" de tecnicas (contenido propio). No se prerrenderiza.
export const dynamic = 'force-dynamic';

const generalQuerySchema = z.object({
  locale: z.enum(['es', 'en']).default('es'),
});

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = generalQuerySchema.safeParse(Object.fromEntries(url.searchParams));
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const content = await getContentBlock('techniques_general', parsed.data.locale);
    return NextResponse.json({ key: 'techniques_general', locale: parsed.data.locale, content });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el bloque general de tecnicas',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
