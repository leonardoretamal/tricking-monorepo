import { and, asc, eq, isNull } from 'drizzle-orm';

import { getDb } from '../client';
import { videos } from '../schema';

// Videos de un truco (Fase 14). Devuelve solo las filas vigentes (sin borrado logico)
// ordenadas por id. La API resuelve la URL de reproduccion y prefiere la copia en R2
// sobre la URL externa original de Loopkicks.

export interface VideoForTrick {
  id: number;
  trickId: string | null;
  url: string | null;
  r2Key: string | null;
  mime: string | null;
  durationSeconds: number | null;
  status: string;
}

export async function listVideosForTrick(trickId: string): Promise<VideoForTrick[]> {
  const db = getDb();

  return db
    .select({
      id: videos.id,
      trickId: videos.trickId,
      url: videos.url,
      r2Key: videos.r2Key,
      mime: videos.mime,
      durationSeconds: videos.durationSeconds,
      status: videos.status,
    })
    .from(videos)
    .where(and(eq(videos.trickId, trickId), isNull(videos.deletedAt)))
    .orderBy(asc(videos.id));
}
