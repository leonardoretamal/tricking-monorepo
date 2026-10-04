'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@tricking/ui';
import { FIVE_MINUTES_MS } from '@tricking/shared';
import { useTranslations } from 'next-intl';

import { fetchTrickVideos } from '@/lib/video-api';
import type { Video } from '@/lib/video-schemas';

// Reproductor del detalle de truco (Fase 14). Consume /api/videos y usa la cache
// persistida de TanStack Query con TTL corto (5 minutos): las URLs se renuevan pronto y
// no se guarda nada sensible. Prefiere la copia en R2 sobre la URL externa.

interface TrickVideoPlayerProps {
  trickId: string;
  trickName: string;
}

function pickPlayable(videos: Video[]): Video | null {
  const fromR2 = videos.find((video) => video.source === 'r2');
  if (fromR2 !== undefined) {
    return fromR2;
  }
  return videos[0] ?? null;
}

export function TrickVideoPlayer({ trickId, trickName }: TrickVideoPlayerProps) {
  const t = useTranslations('tricks');

  const query = useQuery({
    queryKey: ['videos', trickId],
    queryFn: ({ signal }) => fetchTrickVideos(trickId, signal),
    staleTime: FIVE_MINUTES_MS,
    gcTime: FIVE_MINUTES_MS,
  });

  if (query.isLoading) {
    return (
      <section className="flex flex-col gap-2" aria-busy="true">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.video.heading')}</h2>
        <div
          role="status"
          aria-label={t('detail.video.loading')}
          className="skeleton aspect-video w-full rounded-box"
        />
      </section>
    );
  }

  if (query.isError) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.video.heading')}</h2>
        <div
          role="alert"
          className="flex flex-col items-start gap-2 rounded-box border border-error/30 bg-error/10 px-4 py-3 text-sm"
        >
          <p className="text-base-content">{t('detail.video.error')}</p>
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={() => {
              void query.refetch();
            }}
          >
            {t('detail.video.retry')}
          </button>
        </div>
      </section>
    );
  }

  const video = pickPlayable(query.data?.items ?? []);
  if (video === null) {
    return (
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.video.heading')}</h2>
        <EmptyState
          title={t('detail.video.emptyTitle')}
          description={t('detail.video.emptyDescription')}
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-base-content">{t('detail.video.heading')}</h2>
      <video
        className="aspect-video w-full rounded-box border border-border bg-base-300"
        controls
        playsInline
        preload="metadata"
        aria-label={t('detail.video.label', { name: trickName })}
      >
        <source src={video.url} type={video.mime ?? undefined} />
        {t('detail.video.fallback')}
      </video>
    </section>
  );
}
