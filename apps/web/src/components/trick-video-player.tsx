'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@tricking/ui';
import { FIVE_MINUTES_MS } from '@tricking/shared';
import { Video } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { fetchTrickVideos } from '@/lib/video-api';
import type { Video as VideoItem } from '@/lib/video-schemas';

// Reproductor del detalle de truco (Fase 14). Consume /api/videos y usa la cache
// persistida de TanStack Query con TTL corto (5 minutos): las URLs se renuevan pronto y
// no se guarda nada sensible. Los videos de terceros se sirven desde su URL original de
// Loopkicks (enlace, sin re-hospedar); R2 solo se usaria para videos propios o con licencia.

interface TrickVideoPlayerProps {
  trickId: string;
  trickName: string;
  sourceUrl?: string | null;
}

function pickPlayable(videos: VideoItem[]): VideoItem | null {
  const fromR2 = videos.find((video) => video.source === 'r2');
  if (fromR2 !== undefined) {
    return fromR2;
  }
  return videos[0] ?? null;
}

function PlayerHeading({ children }: { children: string }) {
  return (
    <h2 className="tb-eyebrow flex items-center gap-2">
      <Video aria-hidden="true" className="size-4" />
      {children}
    </h2>
  );
}

export function TrickVideoPlayer({ trickId, trickName, sourceUrl }: TrickVideoPlayerProps) {
  const t = useTranslations('tricks');

  const query = useQuery({
    queryKey: ['videos', trickId],
    queryFn: ({ signal }) => fetchTrickVideos(trickId, signal),
    staleTime: FIVE_MINUTES_MS,
    gcTime: FIVE_MINUTES_MS,
  });

  if (query.isLoading) {
    return (
      <section className="tb-surface flex flex-col gap-3 p-4 sm:p-5" aria-busy="true">
        <PlayerHeading>{t('detail.video.heading')}</PlayerHeading>
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
      <section className="tb-surface flex flex-col gap-3 p-4 sm:p-5">
        <PlayerHeading>{t('detail.video.heading')}</PlayerHeading>
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
      <section className="tb-surface flex flex-col gap-3 p-4 sm:p-5">
        <PlayerHeading>{t('detail.video.heading')}</PlayerHeading>
        <EmptyState
          title={t('detail.video.emptyTitle')}
          description={t('detail.video.emptyDescription')}
        />
      </section>
    );
  }

  return (
    <section className="tb-surface flex flex-col gap-3 p-4 sm:p-5">
      <PlayerHeading>{t('detail.video.heading')}</PlayerHeading>
      <div className="overflow-hidden rounded-box border border-border bg-base-300">
        <video
          className="aspect-video w-full"
          controls
          playsInline
          preload="metadata"
          aria-label={t('detail.video.label', { name: trickName })}
        >
          <source src={video.url} type={video.mime ?? undefined} />
          {t('detail.video.fallback')}
        </video>
      </div>
      {sourceUrl ? (
        <p className="text-xs text-base-content/60">
          {t('detail.video.source')}{' '}
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Loopkicks
          </a>
        </p>
      ) : null}
    </section>
  );
}
