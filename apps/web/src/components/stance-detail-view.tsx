'use client';

import { useQuery } from '@tanstack/react-query';
import { EmptyState } from '@tricking/ui';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { fetchStance } from '@/lib/semantic-api';
import type { StanceDetail } from '@/lib/semantic-schemas';

interface StanceDetailViewProps {
  stance: StanceDetail;
}

export function StanceDetailView({ stance }: StanceDetailViewProps) {
  const t = useTranslations('stances');

  const query = useQuery({
    queryKey: ['stance', stance.slug],
    queryFn: ({ signal }) => fetchStance(stance.slug, signal),
    initialData: stance,
  });

  const data = query.data;

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/stances"
        className="inline-flex w-fit items-center gap-1 text-sm text-base-content/70 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('detail.back')}
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {data.name}
        </h1>
        <span className="badge badge-outline w-fit">
          {t('landingCount', { count: data.landingTrickCount })}
        </span>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.description')}</h2>
        <p className="text-base text-base-content/80">
          {data.description ?? t('detail.noDescription')}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.landingTitle')}</h2>
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
                    className="link link-hover rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
    </div>
  );
}
