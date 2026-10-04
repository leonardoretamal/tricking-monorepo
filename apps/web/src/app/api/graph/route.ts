import { getGraph } from '@tricking/db';
import { NextResponse } from 'next/server';

import { graphQuerySchema } from '@/lib/graph-schemas';
import { logger, newTraceId } from '@/lib/logger';

// El grafo depende de la base de datos y de los filtros de la URL; no se prerrenderiza.
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = graphQuerySchema.safeParse(Object.fromEntries(url.searchParams));

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const result = await getGraph(parsed.data);

    logger.info(
      {
        traceId,
        section: parsed.data.section,
        category: parsed.data.category,
        difficulty: parsed.data.difficulty,
        stance: parsed.data.stance,
        nodes: result.nodes.length,
        edges: result.edges.length,
        total: result.total,
      },
      'grafo de exploracion',
    );

    return NextResponse.json({ ...result, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el grafo de exploracion',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
