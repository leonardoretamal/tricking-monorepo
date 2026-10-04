'use client';

import { useQuery } from '@tanstack/react-query';
import { categoryBadgeColor } from '@tricking/ui';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { TrickVideoPlayer } from '@/components/trick-video-player';
import { Link } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import { fetchTrick } from '@/lib/trick-api';
import type { TrickDetail, TrickRelated } from '@/lib/trick-schemas';
import type { Section } from '@/lib/sections';

interface TrickDetailViewProps {
  trick: TrickDetail;
  section: Section;
  sectionTitle: string;
}

export function TrickDetailView({ trick, section, sectionTitle }: TrickDetailViewProps) {
  const t = useTranslations('tricks');
  const locale = useLocale();

  const query = useQuery({
    queryKey: ['trick', trick.id],
    queryFn: ({ signal }) => fetchTrick(trick.id, signal),
    initialData: trick,
  });

  const data = query.data;
  const categories = data.categories.flatMap((slug) => {
    const color = categoryBadgeColor(slug);
    return color ? [{ label: t(`categories.${slug}`), color }] : [];
  });

  const howTo = pickDescription(locale, data.howTo, data.howToEs);
  const sourceUrl =
    data.loopkicksSlug !== null
      ? `https://www.loopkickstricking.com/tricks/${data.loopkicksSlug}`
      : null;

  const renderRelated = (items: TrickRelated[]) => (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/tricks/${item.section ?? section}/${item.id}`}
            className="link link-hover rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {item.name}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={`/tricks/${section}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-base-content/70 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {sectionTitle}
      </Link>

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {data.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          {data.difficulty !== null ? (
            <span
              className={`badge tb-badge tb-difficulty-${data.difficulty}`}
              aria-label={t('detail.difficultyLabel')}
            >
              {t(`difficulty.${data.difficulty}`)}
            </span>
          ) : null}
          {categories.map((category) => (
            <span key={category.label} className={`badge tb-badge tb-cat-${category.color}`}>
              {category.label}
            </span>
          ))}
        </div>
      </header>

      <TrickVideoPlayer trickId={data.id} trickName={data.name} sourceUrl={sourceUrl} />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.description')}</h2>
        <p className="text-base text-base-content/80">
          {pickDescription(locale, data.description, data.descriptionEs) ??
            t('detail.noDescription')}
        </p>
      </section>

      {howTo ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-base-content">{t('detail.howTo')}</h2>
          <p className="text-base text-base-content/80">{howTo}</p>
        </section>
      ) : null}

      {data.prereqs.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-base-content">{t('detail.prereqs')}</h2>
          {renderRelated(data.prereqs)}
        </section>
      ) : null}

      {data.nextTricks.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-base-content">{t('detail.nextTricks')}</h2>
          {renderRelated(data.nextTricks)}
        </section>
      ) : null}
    </div>
  );
}
