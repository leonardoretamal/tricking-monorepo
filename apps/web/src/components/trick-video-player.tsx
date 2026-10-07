'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@tricking/ui';
import { FIVE_MINUTES_MS } from '@tricking/shared';
import { Play, Video } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { fetchTrickVideos } from '@/lib/video-api';
import type { Video as VideoItem, VideoProvider } from '@/lib/video-schemas';

// Reproductor del detalle de truco (Fase 14, ampliado en la Fase 44). Consume /api/videos y
// usa la cache persistida de TanStack Query con TTL corto (5 minutos). Los videos de terceros
// (Loopkicks, YouTube, Vimeo, Dailymotion) se muestran desde su fuente original, con credito:
// nada se re-hospeda. Los que no permiten un archivo directo usan una fachada que carga el
// iframe recien al clic, de modo que no se contacta al tercero ni se instalan cookies antes.

interface TrickVideoPlayerProps {
  trickId: string;
  trickName: string;
  sourceUrl?: string | null;
}

const PROVIDER_LABEL: Record<VideoProvider, string> = {
  loopkicks: 'Loopkicks',
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  dailymotion: 'Dailymotion',
};

function pickPlayable(videos: VideoItem[]): VideoItem | null {
  const fromR2 = videos.find((video) => video.source === 'r2');
  if (fromR2 !== undefined) {
    return fromR2;
  }
  const file = videos.find((video) => video.kind === 'file');
  if (file !== undefined) {
    return file;
  }
  return videos[0] ?? null;
}

// Miniatura de YouTube derivada del id, para la portada de la fachada. No se guarda en la
// base: es una derivacion de la URL.
function youtubePoster(embedUrl: string | null, url: string): string | null {
  const source = embedUrl ?? url;
  const match = source.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{6,})/);
  return match?.[1] !== undefined ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function nocookieEmbed(video: VideoItem): string | null {
  if (video.embedUrl === null) {
    return null;
  }
  if (video.provider === 'youtube') {
    return video.embedUrl
      .replace('https://www.youtube.com/embed/', 'https://www.youtube-nocookie.com/embed/')
      .replace('https://youtube.com/embed/', 'https://www.youtube-nocookie.com/embed/');
  }
  return video.embedUrl;
}

function aspectClass(video: VideoItem): string {
  return video.aspect === '9:16' ? 'aspect-[9/16] mx-auto w-full max-w-sm' : 'aspect-video w-full';
}

function PlayerHeading({ children }: { children: string }) {
  return (
    <h2 className="tb-eyebrow flex items-center gap-2">
      <Video aria-hidden="true" className="size-4" />
      {children}
    </h2>
  );
}

interface EmbedFacadeProps {
  video: VideoItem;
  playLabel: string;
  hint: string;
}

function EmbedFacade({ video, playLabel, hint }: EmbedFacadeProps) {
  const [loaded, setLoaded] = useState(false);
  const embed = nocookieEmbed(video);
  const poster = video.provider === 'youtube' ? youtubePoster(video.embedUrl, video.url) : null;

  if (embed === null) {
    return null;
  }

  if (loaded) {
    return (
      <div
        className={`overflow-hidden rounded-box border border-border bg-base-300 ${aspectClass(video)}`}
      >
        <iframe
          src={embed}
          title={video.title ?? playLabel}
          className="size-full"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setLoaded(true);
      }}
      className={`group relative flex items-center justify-center overflow-hidden rounded-box border border-border bg-base-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${aspectClass(video)}`}
      style={
        poster !== null
          ? {
              backgroundImage: `url(${poster})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
      aria-label={playLabel}
    >
      <span className="absolute inset-0 bg-base-300/50 transition-colors group-hover:bg-base-300/30" />
      <span className="relative flex flex-col items-center gap-2 text-base-content">
        <span className="flex size-14 items-center justify-center rounded-full bg-primary text-primary-content">
          <Play aria-hidden="true" className="size-6" />
        </span>
        <span className="text-xs text-base-content/80">{hint}</span>
      </span>
    </button>
  );
}

function LinkCard({ video, watchLabel }: { video: VideoItem; watchLabel: string }) {
  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-1 rounded-box border border-border bg-base-300/60 px-4 py-3 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="font-medium text-base-content">{video.title ?? watchLabel}</span>
      <span className="text-sm text-primary underline-offset-2 hover:underline">{watchLabel}</span>
    </a>
  );
}

// Video de archivo directo (Loopkicks). Si la fuente ya no responde (por ejemplo si
// Loopkicks deja de existir), el evento error degrada al estado vacio en vez de dejar un
// reproductor en negro.
function FileVideo({ video, trickName }: { video: VideoItem; trickName: string }) {
  const t = useTranslations('tricks');
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <EmptyState
        title={t('detail.video.unavailableTitle')}
        description={t('detail.video.unavailableDescription')}
      />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-box border border-border bg-base-300 ${aspectClass(video)}`}
    >
      <video
        className="size-full"
        controls
        playsInline
        preload="metadata"
        src={video.url}
        aria-label={t('detail.video.label', { name: trickName })}
        onError={() => {
          setFailed(true);
        }}
      >
        {t('detail.video.fallback')}
      </video>
    </div>
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

  const providerName = video.provider !== null ? PROVIDER_LABEL[video.provider] : null;
  const creditHref = sourceUrl ?? video.url;
  const creditLabel =
    video.author !== null
      ? t('detail.video.creditBy', { author: video.author, provider: providerName ?? '' })
      : providerName !== null
        ? t('detail.video.creditGeneric', { provider: providerName })
        : null;
  const watchLabel =
    providerName !== null
      ? t('detail.video.watch', { provider: providerName })
      : (video.title ?? '');
  const facadeHint =
    providerName !== null
      ? t('detail.video.facadeHint', { provider: providerName })
      : t('detail.video.play');

  return (
    <section className="tb-surface flex flex-col gap-3 p-4 sm:p-5">
      <PlayerHeading>{t('detail.video.heading')}</PlayerHeading>
      {video.kind === 'file' ? (
        <FileVideo video={video} trickName={trickName} />
      ) : video.kind === 'iframe' ? (
        <EmbedFacade video={video} playLabel={t('detail.video.play')} hint={facadeHint} />
      ) : (
        <LinkCard video={video} watchLabel={watchLabel} />
      )}
      {creditLabel !== null ? (
        <p className="text-xs text-base-content/60">
          {creditLabel}{' '}
          <a
            href={creditHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t('detail.video.source')}
          </a>
        </p>
      ) : null}
    </section>
  );
}
