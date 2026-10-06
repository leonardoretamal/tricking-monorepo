'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

import { TransitionBadge } from '@/components/transition-badge';
import { TransitionGroupDiagram } from '@/components/transition-group-diagram';
import { Link } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import { fetchTransition } from '@/lib/semantic-api';
import type { TransitionDetail } from '@/lib/semantic-schemas';
import { normalizeTransitionGroup } from '@/lib/transition-groups';
import { Reveal } from './reveal';

interface TransitionDetailViewProps {
  transition: TransitionDetail;
}

export function TransitionDetailView({ transition }: TransitionDetailViewProps) {
  const t = useTranslations('transitions');
  const locale = useLocale();
  const query = useQuery({
    queryKey: ['transition', transition.slug],
    queryFn: ({ signal }) => fetchTransition(transition.slug, signal),
    initialData: transition,
  });

  const data = query.data;
  const bucket = normalizeTransitionGroup(data.group);

  return (
    <div className="flex flex-col gap-8">
      <Link
        href="/transitions"
        className="inline-flex w-fit items-center gap-1 text-sm text-base-content/70 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('title')}
      </Link>

      <header className="flex flex-col gap-3">
        <p className="tb-eyebrow">{t('title')}</p>
        <h1 className="tb-display text-4xl break-words text-base-content sm:text-5xl">
          {data.name}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <TransitionBadge group={data.group} />
        </div>
      </header>

      <Reveal className="flex flex-col gap-8">
        <section className="tb-surface flex flex-col gap-2 p-5 sm:p-6">
          <h2 className="tb-eyebrow">{t('detail.description')}</h2>
          <p className="text-base text-base-content/80">
            {pickDescription(locale, data.description, data.descriptionEs) ??
              t('detail.noDescription')}
          </p>
        </section>

        <TransitionGroupDiagram
          group={data.group}
          label={t('detail.diagramAria', { group: t(`groups.${bucket}`) })}
          caption={t(`detail.diagram.${bucket}`)}
        />

        <section className="tb-surface flex flex-col gap-3 p-5 sm:p-6">
          <h2 className="tb-eyebrow">{t('detail.examples')}</h2>
          {data.examples.length > 0 ? (
            <ul className="flex flex-col gap-2">
              {data.examples.map((example, index) => (
                <li
                  key={`${example.label}-${index}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-field border border-border bg-base-300/40 px-3 py-2 text-sm"
                >
                  <span className="text-base-content/80">{example.label}</span>
                  {example.trick?.section ? (
                    <Link
                      href={`/tricks/${example.trick.section}/${example.trick.id}`}
                      className="link link-hover text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                      aria-label={t('detail.openTrick', { name: example.trick.name })}
                    >
                      {example.trick.name}
                    </Link>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-base-content/70">{t('detail.noExamples')}</p>
          )}
        </section>
      </Reveal>
    </div>
  );
}
