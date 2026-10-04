'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import { fetchVariation } from '@/lib/semantic-api';
import type { VariationDetail } from '@/lib/semantic-schemas';
import { VariationTrickRef } from './variation-trick-ref';

interface VariationDetailViewProps {
  variation: VariationDetail;
}

export function VariationDetailView({ variation }: VariationDetailViewProps) {
  const t = useTranslations('variations');
  const locale = useLocale();

  const query = useQuery({
    queryKey: ['variation', variation.slug],
    queryFn: ({ signal }) => fetchVariation(variation.slug, signal),
    initialData: variation,
  });

  const data = query.data;
  const badgeClass = data.kind === 'family' ? 'tb-cat-basics' : 'tb-cat-transitions';

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/variations"
        className="inline-flex w-fit items-center gap-1 text-sm text-base-content/70 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('detail.back')}
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {data.name}
        </h1>
        <span className={`badge tb-badge w-fit ${badgeClass}`} aria-label={t('detail.type')}>
          {t(`badges.${data.kind}`)}
        </span>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.description')}</h2>
        <p className="text-base text-base-content/80">
          {pickDescription(locale, data.description, data.descriptionEs) ??
            t('detail.noDescription')}
        </p>
      </section>

      {data.baseTrick ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-base-content">{t('detail.baseTrick')}</h2>
          <VariationTrickRef trick={data.baseTrick} />
        </section>
      ) : null}

      {data.family ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-base-content">{t('detail.family')}</h2>
          <Link
            href={`/variations/${data.family.slug}`}
            className="link link-hover w-fit rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {data.family.name}
          </Link>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.examples')}</h2>
        {data.examples.length === 0 ? (
          <p className="text-sm text-base-content/60">{t('detail.noExamples')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.examples.map((trick) => (
              <li key={trick.id}>
                <VariationTrickRef trick={trick} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.siblings')}</h2>
        {data.siblings.length === 0 ? (
          <p className="text-sm text-base-content/60">{t('detail.noSiblings')}</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {data.siblings.map((sibling) => (
              <li key={sibling.id}>
                <Link
                  href={`/variations/${sibling.slug}`}
                  className="link link-hover rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {sibling.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
