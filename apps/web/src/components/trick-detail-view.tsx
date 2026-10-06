'use client';

import { useQuery } from '@tanstack/react-query';
import { Accordion, categoryBadgeColor, RelatedItems, type AccordionItem } from '@tricking/ui';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { ProgressControl } from '@/components/progress-control';
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
  const tTechniques = useTranslations('tutorials');
  const tVariations = useTranslations('variations');
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
  const description = pickDescription(locale, data.description, data.descriptionEs);
  // La nota de Loopkicks es texto de ellos; la traduccion al espanol es una cortesia.
  // En espanol se usa la traduccion con fallback al original; en ingles, el original.
  const loopkicksNotes = pickDescription(locale, data.loopkicksNotes, data.loopkicksNotesEs);
  const kojoTechniques = data.kojoTechniques ?? [];
  const sourceUrl =
    data.loopkicksSlug !== null
      ? `https://www.loopkickstricking.com/tricks/${data.loopkicksSlug}`
      : null;

  // Enlaces cruzados (Fase 15). Los href se arman con el locale actual porque el
  // componente RelatedItems vive en packages/ui y no conoce next-intl.
  const related = data.related ?? { variations: [], transitions: [], stances: [] };
  const variationItems = related.variations.map((item) => ({
    href: `/${locale}/variations/${item.slug}`,
    label: item.name,
    badge: tVariations(`badges.${item.kind}`),
  }));
  const transitionItems = related.transitions.map((item) => ({
    href: `/${locale}/transitions/${item.slug}`,
    label: item.name,
  }));
  const stanceItems = related.stances.map((item) => ({
    href: `/${locale}/stances/${item.slug}`,
    label: item.name,
    badge: t(`detail.stanceKind.${item.kind}`),
  }));
  const hasRelated = variationItems.length + transitionItems.length + stanceItems.length > 0;

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

  const loopkicksContent = (
    <div className="flex flex-col gap-2">
      <p>{loopkicksNotes ?? t('detail.loopkicksEmpty')}</p>
      {sourceUrl ? (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex w-fit items-center gap-1 rounded text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {t('detail.sourceLoopkicks')}
          <ExternalLink aria-hidden="true" className="size-4" />
        </a>
      ) : null}
    </div>
  );

  const kojoContent =
    kojoTechniques.length > 0 ? (
      <ul className="flex flex-col gap-4">
        {kojoTechniques.map((technique) => {
          const tips = pickDescription(locale, technique.tips, technique.tipsEs);
          const level = technique.level ? tTechniques(`levels.${technique.level}`) : null;
          return (
            <li key={technique.id} className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium text-base-content">{technique.title}</span>
                {level ? (
                  <span className="badge badge-sm tb-badge border border-border bg-base-300 text-base-content/80">
                    {level}
                  </span>
                ) : null}
              </div>
              <p>{tips ?? t('detail.kojoEmptyTips')}</p>
              {technique.permalink ? (
                <a
                  href={technique.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-fit items-center gap-1 rounded text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {t('detail.sourceKojo')}
                  <ExternalLink aria-hidden="true" className="size-4" />
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    ) : (
      <p>{t('detail.kojoEmpty')}</p>
    );

  const versions: AccordionItem[] = [
    { id: 'loopkicks', header: t('detail.loopkicks'), content: loopkicksContent },
    { id: 'kojo', header: t('detail.kojo'), content: kojoContent },
  ];

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
        <ProgressControl trickId={data.id} />
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <TrickVideoPlayer trickId={data.id} trickName={data.name} sourceUrl={sourceUrl} />

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-base-content">{t('detail.howTo')}</h2>
          <p className="text-base text-base-content/80">{howTo ?? t('detail.noHowTo')}</p>
          {description ? (
            <div className="mt-2 flex flex-col gap-1">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
                {t('detail.description')}
              </h3>
              <p className="text-sm text-base-content/70">{description}</p>
            </div>
          ) : null}
        </section>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-base-content">{t('detail.versionsTitle')}</h2>
        <Accordion
          items={versions}
          expandLabel={t('detail.expand')}
          collapseLabel={t('detail.collapse')}
          className="rounded-box border border-border bg-base-200 px-2"
        />
      </section>

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

      {hasRelated ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-base-content">{t('detail.related')}</h2>
          {variationItems.length > 0 ? (
            <RelatedItems
              title={t('detail.relatedVariations')}
              items={variationItems}
              emptyLabel={t('detail.relatedEmpty')}
            />
          ) : null}
          {transitionItems.length > 0 ? (
            <RelatedItems
              title={t('detail.relatedTransitions')}
              items={transitionItems}
              emptyLabel={t('detail.relatedEmpty')}
            />
          ) : null}
          {stanceItems.length > 0 ? (
            <RelatedItems
              title={t('detail.relatedStances')}
              items={stanceItems}
              emptyLabel={t('detail.relatedEmpty')}
            />
          ) : null}
        </section>
      ) : (
        <RelatedItems
          title={t('detail.related')}
          items={[]}
          emptyLabel={t('detail.relatedEmpty')}
        />
      )}
    </div>
  );
}
