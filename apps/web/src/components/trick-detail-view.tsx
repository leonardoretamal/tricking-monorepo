'use client';

import { useQuery } from '@tanstack/react-query';
import { Accordion, categoryBadgeColor, RelatedItems, type AccordionItem } from '@tricking/ui';
import type { HowToDetail } from '@tricking/shared';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { ProgressControl } from '@/components/progress-control';
import { TrickHowTo } from '@/components/trick-how-to';
import { TrickLearningPath } from '@/components/trick-learning-path';
import { TrickVideoPlayer } from '@/components/trick-video-player';
import { Link } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import { fetchTrick } from '@/lib/trick-api';
import type { TrickDetail } from '@/lib/trick-schemas';
import type { Section } from '@/lib/sections';

// Elige el detalle estructurado segun el locale (el espanol vive en `...Es`); si falta uno,
// cae al otro y, si no hay ninguno, devuelve null y la vista usa el texto plano.
function pickHowToDetail(
  locale: string,
  detail: HowToDetail | null | undefined,
  detailEs: HowToDetail | null | undefined,
): HowToDetail | null {
  if (locale.startsWith('es')) {
    return detailEs ?? detail ?? null;
  }
  return detail ?? null;
}

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
  const howToDetail = pickHowToDetail(locale, data.howToData, data.howToDataEs);
  // El resumen que va arriba junto al video: el detalle estructurado si existe y, si no, el
  // resumen de texto plano de siempre.
  const summary = howToDetail?.summary ?? howTo ?? t('detail.noHowTo');
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

  const loopkicksContent = (
    <div className="flex flex-col gap-3">
      <p className="leading-relaxed">{loopkicksNotes ?? t('detail.loopkicksEmpty')}</p>
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

  // Solo se muestran las tecnicas que traen tips propios. Si ninguna los tiene, el bloque
  // Kojo se oculta por completo para no dejar un hueco con el mensaje de "sin tips".
  const kojoWithTips = kojoTechniques.flatMap((technique) => {
    const tips = pickDescription(locale, technique.tips, technique.tipsEs);
    return tips !== null && tips.trim() !== '' ? [{ technique, tips }] : [];
  });

  const kojoContent = (
    <ul className="flex flex-col gap-4">
      {kojoWithTips.map(({ technique, tips }) => {
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
            <p className="leading-relaxed">{tips}</p>
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
  );

  const versions: AccordionItem[] = [
    { id: 'loopkicks', header: t('detail.loopkicks'), content: loopkicksContent },
    ...(kojoWithTips.length > 0
      ? [{ id: 'kojo', header: t('detail.kojo'), content: kojoContent }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={`/tricks/${section}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-base-content/70 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {sectionTitle}
      </Link>

      <header className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="tb-eyebrow">{sectionTitle}</span>
          <h1 className="tb-display text-4xl break-words text-base-content sm:text-5xl">
            {data.name}
          </h1>
        </div>
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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <TrickVideoPlayer trickId={data.id} trickName={data.name} sourceUrl={sourceUrl} />

        <section className="tb-surface flex flex-col gap-3 p-5">
          <h2 className="tb-display text-xl text-base-content">{t('detail.howTo')}</h2>
          <p className="text-base leading-relaxed text-base-content/80">{summary}</p>
          {description ? (
            <div className="mt-1 flex flex-col gap-1 border-t border-border pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
                {t('detail.description')}
              </h3>
              <p className="text-sm leading-relaxed text-base-content/70">{description}</p>
            </div>
          ) : null}
        </section>
      </div>

      {howToDetail ? (
        <section className="tb-surface flex flex-col gap-4 p-5 sm:p-6">
          <h2 className="tb-display text-xl text-base-content">{t('detail.howToDetailed')}</h2>
          <TrickHowTo detail={howToDetail} fallback={howTo} omit={['summary']} />
        </section>
      ) : null}

      <TrickLearningPath
        currentName={data.name}
        prereqs={data.prereqs}
        nextTricks={data.nextTricks}
        prereqNotes={howToDetail?.prereqNotes ?? {}}
        fallbackSection={section}
      />

      <section className="flex flex-col gap-3">
        <h2 className="tb-display text-xl text-base-content">{t('detail.versionsTitle')}</h2>
        <Accordion
          items={versions}
          expandLabel={t('detail.expand')}
          collapseLabel={t('detail.collapse')}
          className="tb-surface px-2"
        />
      </section>

      {hasRelated ? (
        <section className="tb-surface flex flex-col gap-4 p-5">
          <h2 className="tb-display text-xl text-base-content">{t('detail.related')}</h2>
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
        <section className="tb-surface p-5">
          <RelatedItems
            title={t('detail.related')}
            items={[]}
            emptyLabel={t('detail.relatedEmpty')}
          />
        </section>
      )}
    </div>
  );
}
