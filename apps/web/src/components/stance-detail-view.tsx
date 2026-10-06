'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@tricking/ui';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import { fetchStance } from '@/lib/semantic-api';
import type { StanceDetail } from '@/lib/semantic-schemas';
import { Reveal } from './reveal';

interface StanceDetailViewProps {
  stance: StanceDetail;
}

export function StanceDetailView({ stance }: StanceDetailViewProps) {
  const t = useTranslations('stances');
  const locale = useLocale();

  const query = useQuery({
    queryKey: ['stance', stance.slug],
    queryFn: ({ signal }) => fetchStance(stance.slug, signal),
    initialData: stance,
  });

  const data = query.data;

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/stances"
        className="inline-flex w-fit items-center gap-1 text-sm text-base-content/70 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('detail.back')}
      </Link>

      <header className="flex flex-col gap-3">
        <p className="tb-eyebrow">{t('title')}</p>
        <h1 className="tb-display text-4xl break-words text-base-content sm:text-5xl">
          {data.name}
        </h1>
        <span className="badge tb-badge tb-cat-basics w-fit">
          {t('landingCount', { count: data.landingTrickCount })}
        </span>
      </header>

      <Reveal className="flex flex-col gap-8">
        <section className="tb-surface flex flex-col gap-2 p-5 sm:p-6">
          <h2 className="tb-eyebrow">{t('detail.description')}</h2>
          <p className="text-base text-base-content/80">
            {pickDescription(locale, data.description, data.descriptionEs) ??
              t('detail.noDescription')}
          </p>
        </section>

        <section className="tb-surface flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="tb-eyebrow">{t('detail.landingTitle')}</h2>
          {data.landingTricks.length === 0 ? (
            <EmptyState
              title={t('detail.landingEmptyTitle')}
              description={t('detail.landingEmptyDescription')}
            />
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.landingTricks.map((trick) => (
                <li key={trick.id}>
                  {trick.section ? (
                    <Link
                      href={`/tricks/${trick.section}/${trick.id}`}
                      className="link link-hover rounded text-sm text-base-content transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {trick.name}
                    </Link>
                  ) : (
                    <span className="text-sm text-base-content/80">{trick.name}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>
    </div>
  );
}
