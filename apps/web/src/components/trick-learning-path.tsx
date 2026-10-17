'use client';

import { ArrowRight, CornerDownRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import type { TrickRelated } from '@/lib/trick-schemas';
import type { Section } from '@/lib/sections';

// Ruta de aprendizaje del truco (Fase 45): prerequisitos (con su nota), el truco actual y
// los siguientes trucos, enlazados a su detalle. Reemplaza los chips sueltos de prereqs y
// siguientes que antes se repetian en dos bloques separados. Los href se arman con la
// seccion de cada truco y, si no la tiene, con la del truco actual.

interface TrickLearningPathProps {
  currentName: string;
  prereqs: TrickRelated[];
  nextTricks: TrickRelated[];
  prereqNotes: Record<string, string>;
  fallbackSection: Section;
}

function sectionHref(item: TrickRelated, fallback: Section): string {
  return `/tricks/${item.section ?? fallback}/${item.id}`;
}

function PrereqList({
  prereqs,
  prereqNotes,
  fallbackSection,
  emptyLabel,
}: {
  prereqs: TrickRelated[];
  prereqNotes: Record<string, string>;
  fallbackSection: Section;
  emptyLabel: string;
}) {
  if (prereqs.length === 0) {
    return <p className="text-sm text-base-content/60">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {prereqs.map((item) => {
        const note = prereqNotes[item.id];
        return (
          <li key={item.id} className="flex flex-col gap-1">
            <Link
              href={sectionHref(item, fallbackSection)}
              className="inline-flex w-fit items-center gap-1 font-medium text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <CornerDownRight aria-hidden="true" className="size-4" />
              {item.name}
            </Link>
            {note ? <p className="text-xs leading-relaxed text-base-content/70">{note}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}

function NextList({
  nextTricks,
  fallbackSection,
  emptyLabel,
}: {
  nextTricks: TrickRelated[];
  fallbackSection: Section;
  emptyLabel: string;
}) {
  if (nextTricks.length === 0) {
    return <p className="text-sm text-base-content/60">{emptyLabel}</p>;
  }

  return (
    <ul className="flex flex-wrap gap-2">
      {nextTricks.map((item) => (
        <li key={item.id}>
          <Link
            href={sectionHref(item, fallbackSection)}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-base-300/60 px-3 py-1 text-sm text-base-content transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {item.name}
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function TrickLearningPath({
  currentName,
  prereqs,
  nextTricks,
  prereqNotes,
  fallbackSection,
}: TrickLearningPathProps) {
  const t = useTranslations('tricks');

  return (
    <section className="tb-surface flex flex-col gap-5 p-5">
      <h2 className="tb-display text-xl text-base-content">{t('detail.learningPath')}</h2>
      <div className="grid gap-6 lg:grid-cols-3">
        <nav
          aria-label={t('detail.learningPrereqs')}
          className="flex flex-col gap-2 border-border lg:border-r lg:pr-5"
        >
          <h3 className="tb-eyebrow">{t('detail.learningPrereqs')}</h3>
          <PrereqList
            prereqs={prereqs}
            prereqNotes={prereqNotes}
            fallbackSection={fallbackSection}
            emptyLabel={t('detail.learningPrereqsEmpty')}
          />
        </nav>

        <div className="flex flex-col gap-2">
          <h3 className="tb-eyebrow">{t('detail.learningCurrent')}</h3>
          <p className="inline-flex w-fit items-center rounded-full border border-primary bg-primary/10 px-3 py-1 font-medium text-base-content">
            {currentName}
          </p>
        </div>

        <nav
          aria-label={t('detail.learningNext')}
          className="flex flex-col gap-2 border-border lg:border-l lg:pl-5"
        >
          <h3 className="tb-eyebrow">{t('detail.learningNext')}</h3>
          <NextList
            nextTricks={nextTricks}
            fallbackSection={fallbackSection}
            emptyLabel={t('detail.learningNextEmpty')}
          />
        </nav>
      </div>
    </section>
  );
}
