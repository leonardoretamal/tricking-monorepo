'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import { fetchVariation } from '@/lib/semantic-api';
import type { VariationDetail } from '@/lib/semantic-schemas';
import { Reveal } from './reveal';
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
    <div className="flex flex-col gap-8">
      <Link
        href="/variations"
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
        <span className={`badge tb-badge w-fit ${badgeClass}`} aria-label={t('detail.type')}>
          {t(`badges.${data.kind}`)}
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

        <div className="grid gap-5 sm:grid-cols-2">
          {data.baseTrick ? (
            <section className="tb-surface flex flex-col gap-3 p-5">
              <h2 className="tb-eyebrow">{t('detail.baseTrick')}</h2>
              <div className="flex flex-wrap gap-2">
                <VariationTrickRef trick={data.baseTrick} />
              </div>
            </section>
          ) : null}

          {data.family ? (
            <section className="tb-surface flex flex-col gap-3 p-5">
              <h2 className="tb-eyebrow">{t('detail.family')}</h2>
              <Link
                href={`/variations/${data.family.slug}`}
                className="link link-hover w-fit rounded text-sm transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {data.family.name}
              </Link>
            </section>
          ) : null}
        </div>

        <section className="tb-surface flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="tb-eyebrow">{t('detail.examples')}</h2>
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

        <section className="tb-surface flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="tb-eyebrow">{t('detail.siblings')}</h2>
          {data.siblings.length === 0 ? (
            <p className="text-sm text-base-content/60">{t('detail.noSiblings')}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.siblings.map((sibling) => (
                <li key={sibling.id}>
                  <Link
                    href={`/variations/${sibling.slug}`}
                    className="link link-hover rounded text-sm transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    {sibling.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </Reveal>
    </div>
  );
}
