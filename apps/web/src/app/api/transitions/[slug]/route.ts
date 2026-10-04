import { getTransitionBySlug } from '@tricking/db';
import { NextResponse } from 'next/server';

import { slugSchema } from '@/lib/api-schemas';
import { logger, newTraceId } from '@/lib/logger';

export const dynamic = 'force-dynamic';

interface RouteContext {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const traceId = newTraceId();

  try {
    const { slug } = await context.params;
    const parsed = slugSchema.safeParse(slug);
    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_slug', traceId }, { status: 400 });
    }

    const transition = await getTransitionBySlug(parsed.data);

    if (!transition) {
      return NextResponse.json({ error: 'not_found', traceId }, { status: 404 });
    }

    return NextResponse.json(transition);
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el detalle de transicion',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
