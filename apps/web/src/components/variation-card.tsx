'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { VariationListItem } from '@/lib/semantic-schemas';
import { VariationTrickRef } from './variation-trick-ref';

interface VariationCardProps {
  variation: VariationListItem;
}

export function VariationCard({ variation }: VariationCardProps) {
  const t = useTranslations('variations');
  const isFamily = variation.kind === 'family';
  const badgeClass = isFamily ? 'tb-cat-basics' : 'tb-cat-transitions';

  return (
    <article className="card h-full border border-base-300 bg-base-100">
      <div className="card-body gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="text-lg font-semibold text-base-content">
            <Link
              href={`/variations/${variation.slug}`}
              className="link link-hover rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {variation.name}
            </Link>
          </h2>
          <span className={`badge tb-badge ${badgeClass}`}>{t(`badges.${variation.kind}`)}</span>
        </div>

        <p className="text-sm text-base-content/70">
          {variation.description ?? t('card.noDescription')}
        </p>

        {isFamily ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
              {t('card.examples')}
            </span>
            {(variation.examples ?? []).length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {(variation.examples ?? []).map((trick) => (
                  <li key={trick.id}>
                    <VariationTrickRef trick={trick} />
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-sm text-base-content/60">{t('card.noExamples')}</span>
            )}
          </div>
        ) : variation.baseTrick ? (
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
              {t('card.baseTrick')}
            </span>
            <VariationTrickRef trick={variation.baseTrick} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
