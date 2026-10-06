'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import type { VariationListItem } from '@/lib/semantic-schemas';
import { VariationTrickRef } from './variation-trick-ref';

interface VariationCardProps {
  variation: VariationListItem;
}

export function VariationCard({ variation }: VariationCardProps) {
  const t = useTranslations('variations');
  const locale = useLocale();
  const isFamily = variation.kind === 'family';
  const badgeClass = isFamily ? 'tb-cat-basics' : 'tb-cat-transitions';

  return (
    <article className="tb-surface tb-surface-hover flex h-full flex-col gap-3 p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-lg font-semibold text-base-content">
          <Link
            href={`/variations/${variation.slug}`}
            className="rounded transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {variation.name}
          </Link>
        </h2>
        <span className={`badge tb-badge ${badgeClass}`}>{t(`badges.${variation.kind}`)}</span>
      </div>

      <p className="text-sm text-base-content/70">
        {pickDescription(locale, variation.description, variation.descriptionEs) ??
          t('card.noDescription')}
      </p>

      {isFamily ? (
        <div className="mt-auto flex flex-col gap-1">
          <span className="tb-eyebrow text-base-content/60">{t('card.examples')}</span>
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
        <div className="mt-auto flex flex-col gap-1">
          <span className="tb-eyebrow text-base-content/60">{t('card.baseTrick')}</span>
          <VariationTrickRef trick={variation.baseTrick} />
        </div>
      ) : null}
    </article>
  );
}
