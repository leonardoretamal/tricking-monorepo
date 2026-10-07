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
  provider: string | null;
  embedUrl: string | null;
  author: string | null;
  title: string | null;
  kind: string | null;
  aspect: string | null;
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
      provider: videos.provider,
      embedUrl: videos.embedUrl,
      author: videos.author,
      title: videos.title,
      kind: videos.kind,
      aspect: videos.aspect,
    })
    .from(videos)
    .where(and(eq(videos.trickId, trickId), isNull(videos.deletedAt)))
    .orderBy(asc(videos.id));
}
