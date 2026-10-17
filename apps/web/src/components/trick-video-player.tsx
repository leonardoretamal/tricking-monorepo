'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@tricking/ui';
import { FIVE_MINUTES_MS } from '@tricking/shared';
import { Play, Video } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

import { fetchTrickVideos } from '@/lib/video-api';
import type { Video as VideoItem, VideoProvider } from '@/lib/video-schemas';

// Reproductor del detalle de truco (Fase 14, ampliado en las Fases 44 y 45). Consume
// /api/videos y usa la cache persistida de TanStack Query con TTL corto (5 minutos). Los
// videos se agrupan por rol en pestanas accesibles: "Ejecucion" (demos de Loopkicks) y
// "Tutorial" (externos). Los de terceros se muestran desde su fuente original, con credito:
// nada se re-hospeda. Los que no permiten un archivo directo usan una fachada que carga el
// iframe recien al clic, de modo que no se contacta al proveedor ni se instalan cookies ni
// se descarga la portada antes.

interface TrickVideoPlayerProps {
  trickId: string;
  trickName: string;
  sourceUrl?: string | null;
}

type TabId = 'demo' | 'tutorial';

const PROVIDER_LABEL: Record<VideoProvider, string> = {
  loopkicks: 'Loopkicks',
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  dailymotion: 'Dailymotion',
  tiktok: 'TikTok',
};

// Demo a reproducir: la copia en R2 primero, luego un archivo directo, luego cualquiera.
function pickDemo(videos: VideoItem[]): VideoItem | null {
  const demos = videos.filter((video) => video.role === 'demo');
  const fromR2 = demos.find((video) => video.source === 'r2');
  if (fromR2 !== undefined) {
    return fromR2;
  }
  const file = demos.find((video) => video.kind === 'file');
  if (file !== undefined) {
    return file;
  }
  return demos[0] ?? null;
}

// Tutorial: se prefiere el espanol y se cae al ingles; si no hay idioma, el primero.
function pickTutorial(videos: VideoItem[]): VideoItem | null {
  const tutorials = videos.filter((video) => video.role === 'tutorial');
  if (tutorials.length === 0) {
    return null;
  }
  return (
    tutorials.find((video) => video.language === 'es') ??
    tutorials.find((video) => video.language === 'en') ??
    tutorials[0] ??
    null
  );
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

// Fachada sin recurso previo: hasta el clic no se contacta al proveedor ni se descarga su
// portada (fondo neutro del tema). Asi no se instalan cookies no esenciales ni se suma peso.
function EmbedFacade({ video, playLabel, hint }: EmbedFacadeProps) {
  const [loaded, setLoaded] = useState(false);
  const embed = nocookieEmbed(video);

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
  const [selectedTab, setSelectedTab] = useState<TabId | null>(null);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});

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

  const items = query.data?.items ?? [];
  const demoVideo = pickDemo(items);
  const tutorialVideo = pickTutorial(items);

  if (demoVideo === null && tutorialVideo === null) {
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

  const tabs: { id: TabId; label: string }[] = [];
  if (demoVideo !== null) {
    tabs.push({ id: 'demo', label: t('detail.video.tabDemo') });
  }
  if (tutorialVideo !== null) {
    tabs.push({ id: 'tutorial', label: t('detail.video.tabTutorial') });
  }

  const activeTab: TabId =
    selectedTab !== null && tabs.some((tab) => tab.id === selectedTab)
      ? selectedTab
      : (tabs[0]?.id ?? 'demo');
  const activeVideo = activeTab === 'tutorial' ? tutorialVideo : demoVideo;

  const selectTab = (id: TabId) => {
    setSelectedTab(id);
    tabRefs.current[id]?.focus();
  };

  const onTabKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const ids = tabs.map((tab) => tab.id);
    const currentIndex = ids.indexOf(activeTab);
    let nextIndex: number | null = null;

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % ids.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + ids.length) % ids.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = ids.length - 1;
    }

    if (nextIndex !== null) {
      event.preventDefault();
      const nextId = ids[nextIndex];
      if (nextId !== undefined) {
        selectTab(nextId);
      }
    }
  };

  const providerName =
    activeVideo !== null && activeVideo.provider !== null
      ? PROVIDER_LABEL[activeVideo.provider]
      : null;
  // El credito enlaza al original del video que se muestra: el tutorial externo va a su
  // propia pagina (YouTube, Vimeo, etc.) y la demo va a la ficha del truco cuando existe.
  const creditHref =
    activeVideo === null
      ? null
      : activeTab === 'demo'
        ? (sourceUrl ?? activeVideo.url)
        : activeVideo.url;
  const creditLabel =
    activeVideo === null
      ? null
      : activeVideo.author !== null
        ? t('detail.video.creditBy', {
            author: activeVideo.author,
            provider: providerName ?? '',
          })
        : providerName !== null
          ? t('detail.video.creditGeneric', { provider: providerName })
          : null;
  const watchLabel =
    providerName !== null
      ? t('detail.video.watch', { provider: providerName })
      : (activeVideo?.title ?? '');
  const facadeHint =
    providerName !== null
      ? t('detail.video.facadeHint', { provider: providerName })
      : t('detail.video.play');

  const renderActiveVideo = () => {
    if (activeVideo === null) {
      return null;
    }
    if (activeVideo.kind === 'file') {
      return <FileVideo video={activeVideo} trickName={trickName} />;
    }
    if (activeVideo.kind === 'iframe') {
      return (
        <EmbedFacade video={activeVideo} playLabel={t('detail.video.play')} hint={facadeHint} />
      );
    }
    return <LinkCard video={activeVideo} watchLabel={watchLabel} />;
  };

  return (
    <section className="tb-surface flex flex-col gap-3 p-4 sm:p-5">
      <PlayerHeading>{t('detail.video.heading')}</PlayerHeading>

      <div
        role="tablist"
        aria-label={t('detail.video.tabsLabel')}
        onKeyDown={onTabKeyDown}
        className="flex flex-wrap gap-1 border-b border-border"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              ref={(element) => {
                tabRefs.current[tab.id] = element;
              }}
              type="button"
              role="tab"
              id={`video-tab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`video-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => {
                setSelectedTab(tab.id);
              }}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-base-content/70 hover:text-base-content'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`video-panel-${activeTab}`}
        aria-labelledby={`video-tab-${activeTab}`}
        tabIndex={0}
        className="flex flex-col gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {renderActiveVideo()}
      </div>

      {tutorialVideo === null && demoVideo !== null ? (
        <p className="text-xs text-base-content/60">{t('detail.video.noTutorial')}</p>
      ) : null}

      {creditLabel !== null && creditHref !== null ? (
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
