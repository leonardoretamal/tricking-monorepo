'use client';

import { THIRTY_DAYS_MS } from '@tricking/shared';
import { useQuery } from '@tanstack/react-query';
import { EmptyState, ErrorState, LoadingState } from '@tricking/ui';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { GazeTipCard } from '@/components/gaze-tip-card';
import { GazeTypeTabs } from '@/components/gaze-type-tabs';
import { Link } from '@/i18n/navigation';
import { fetchGazeTipType } from '@/lib/gaze-api';
import type { GazeTipItem, GazeTipTypeItem } from '@/lib/gaze-schemas';

interface GazeTipTypeViewProps {
  trickType: string;
  locale: string;
  types: GazeTipTypeItem[];
}

interface TipGroup {
  label: string | null;
  tips: GazeTipItem[];
}

// Los tips llegan ordenados por fase y order; los subcasos con label quedan contiguos,
// por eso se agrupan en una sola pasada.
function groupByLabel(tips: GazeTipItem[]): TipGroup[] {
  const groups: TipGroup[] = [];
  for (const tip of tips) {
    const last = groups[groups.length - 1];
    if (last !== undefined && last.label === tip.label) {
      last.tips.push(tip);
    } else {
      groups.push({ label: tip.label, tips: [tip] });
    }
  }
  return groups;
}

function targetHref(targetKind: string, targetSlug: string): string {
  if (targetKind === 'section') {
    return `/tricks/${targetSlug}`;
  }
  if (targetKind === 'category') {
    return `/tricks?category=${targetSlug}`;
  }
  if (targetKind === 'transition') {
    return `/transitions/${targetSlug}`;
  }
  return '/tips';
}

// Los destinos de tipo seccion tienen su etiqueta traducida en el namespace `nav`;
// el resto se muestra con el slug legible en vez del identificador crudo.
const SECTION_LABEL_KEY: Record<string, string> = {
  'vertical-kicks': 'verticalKicks',
  backward: 'backward',
  forward: 'forward',
  inside: 'inside',
  outside: 'outside',
};

export function GazeTipTypeView({ trickType, locale, types }: GazeTipTypeViewProps) {
  const t = useTranslations('tips');
  const tNav = useTranslations('nav');

  const query = useQuery({
    queryKey: ['gaze-type', locale, trickType],
    queryFn: ({ signal }) => fetchGazeTipType(trickType, locale, signal),
    staleTime: THIRTY_DAYS_MS,
    gcTime: THIRTY_DAYS_MS,
  });

  const data = query.data;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/tips"
        className="inline-flex w-fit items-center gap-1 text-sm text-base-content/70 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('detail.back')}
      </Link>

      <GazeTypeTabs types={types} activeType={trickType} />

      {query.isPending ? <LoadingState label={t('states.loading')} /> : null}

      {query.isError ? (
        <ErrorState
          title={t('states.errorTitle')}
          description={t('states.errorDescription')}
          action={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => query.refetch()}
            >
              {t('states.retry')}
            </button>
          }
        />
      ) : null}

      {data ? (
        <>
          <header className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
              {data.label}
            </h1>
            <p className="max-w-2xl text-base text-base-content/70">{t('detail.intro')}</p>
          </header>

          {data.phases.length === 0 ? (
            <EmptyState title={t('states.emptyTitle')} description={t('states.emptyDescription')} />
          ) : null}

          {data.phases.map((phase) => (
            <section
              key={phase.phase}
              className="flex flex-col gap-3"
              aria-labelledby={`gaze-phase-${phase.phase}`}
            >
              <h2
                id={`gaze-phase-${phase.phase}`}
                className="text-xl font-semibold text-base-content"
              >
                {t(`phases.${phase.phase}`)}
              </h2>
              {groupByLabel(phase.tips).map((group, index) => (
                <div key={group.label ?? `sin-label-${index}`} className="flex flex-col gap-2">
                  {group.label ? (
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
                      {group.label}
                    </h3>
                  ) : null}
                  <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {group.tips.map((tip) => (
                      <li key={tip.id}>
                        <GazeTipCard tip={tip} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}

          {data.targets.length > 0 ? (
            <section className="flex flex-col gap-2" aria-labelledby="gaze-related-title">
              <h2 id="gaze-related-title" className="text-lg font-semibold text-base-content">
                {t('related.title')}
              </h2>
              <ul className="flex flex-wrap gap-2">
                {data.targets.map((target) => {
                  const sectionKey = SECTION_LABEL_KEY[target.targetSlug];
                  const name =
                    target.targetKind === 'section' && sectionKey !== undefined
                      ? tNav(sectionKey)
                      : target.targetSlug.replace(/-/g, ' ');
                  return (
                    <li key={`${target.targetKind}:${target.targetSlug}`}>
                      <Link
                        href={targetHref(target.targetKind, target.targetSlug)}
                        className="link link-hover rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      >
                        {t(`related.${target.targetKind}`)}: {name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
