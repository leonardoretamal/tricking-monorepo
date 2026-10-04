import { listVideosForTrick } from '@tricking/db';
import { NextResponse } from 'next/server';

import { logger, newTraceId } from '@/lib/logger';
import { videoQuerySchema } from '@/lib/video-schemas';

export const dynamic = 'force-dynamic';

// GET /api/videos?trickId=: devuelve los videos vigentes de un truco. La URL de
// reproduccion ya viene resuelta desde la base (R2 o fuente externa); aqui solo se
// normaliza la forma publica y se registra el trace_id.

export async function GET(request: Request) {
  const traceId = newTraceId();

  try {
    const url = new URL(request.url);
    const parsed = videoQuerySchema.safeParse({
      trickId: url.searchParams.get('trickId') ?? '',
    });

    if (!parsed.success) {
      return NextResponse.json({ error: 'invalid_query', traceId }, { status: 400 });
    }

    const rows = await listVideosForTrick(parsed.data.trickId);

    const items = rows.flatMap((row) => {
      if (row.url === null || row.url.trim() === '') {
        return [];
      }
      const source: 'r2' | 'external' =
        row.status === 'ready' && row.r2Key !== null ? 'r2' : 'external';
      return [
        {
          id: row.id,
          trickId: row.trickId,
          url: row.url,
          mime: row.mime,
          durationSeconds: row.durationSeconds,
          source,
        },
      ];
    });

    logger.info({ traceId, trickId: parsed.data.trickId, total: items.length }, 'videos de truco');

    return NextResponse.json({ items, traceId });
  } catch (error) {
    logger.error(
      { traceId, error: error instanceof Error ? error.message : 'unknown' },
      'fallo el listado de videos',
    );
    return NextResponse.json({ error: 'internal_error', traceId }, { status: 500 });
  }
}
