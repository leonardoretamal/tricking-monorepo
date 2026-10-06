'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { debouncedWrite, formatDate, readEntry, SEVEN_DAYS_MS } from '@tricking/shared';
import { Accordion, type AccordionItem } from '@tricking/ui';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import { Link } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import type { TutorialListItem } from '@/lib/tutorial-schemas';

// Acordeon de tecnicas de Kojo (sin video). Por tecnica muestra el nivel, los tips
// PROPIOS del proyecto, los trucos del catalogo emparejados y el credito con enlace al
// tutorial original. El estado expandido se persiste 7 dias y se virtualiza si el listado
// es grande.

const EXPANDED_KEY = 'tutorials:expanded';
const expandedSchema = z.array(z.string());

interface TutorialAccordionProps {
  items: TutorialListItem[];
  locale: string;
  virtualize: boolean;
}

export function TutorialAccordion({ items, locale, virtualize }: TutorialAccordionProps) {
  const t = useTranslations('tutorials');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // El estado persistido se lee despues del montaje para no tocar localStorage en SSR.
  useEffect(() => {
    const stored = readEntry(EXPANDED_KEY, expandedSchema);
    if (stored && stored.length > 0) {
      setExpandedIds(stored);
    }
  }, []);

  const handleExpandedChange = (next: string[]) => {
    setExpandedIds(next);
    debouncedWrite(EXPANDED_KEY, next, SEVEN_DAYS_MS);
  };

  const toItem = (tutorial: TutorialListItem): AccordionItem => {
    const postedAt = tutorial.postedAt
      ? formatDate(tutorial.postedAt, locale, { dateStyle: 'medium' })
      : null;
    const tips = pickDescription(locale, tutorial.tips, tutorial.tipsEs);
    const level = tutorial.level ? t(`levels.${tutorial.level}`) : null;
    const tricks = tutorial.tricks ?? [];

    return {
      id: String(tutorial.id),
      header: (
        <span className="flex flex-wrap items-center gap-2">
          <span className="break-words">{tutorial.caption ?? t('untitled')}</span>
          {level ? (
            <span className="badge badge-sm tb-badge border border-border bg-base-300 text-base-content/80">
              {level}
            </span>
          ) : null}
        </span>
      ),
      content: (
        <div className="flex flex-col gap-3">
          {tips ? <p className="text-sm text-base-content/80">{tips}</p> : null}

          {tricks.length > 0 ? (
            <div className="flex flex-col gap-1">
              <span className="tb-eyebrow text-base-content/60">{t('relatedTricks')}</span>
              <ul className="flex flex-wrap gap-2">
                {tricks.map((trick) => (
                  <li key={trick.id}>
                    <Link
                      href={`/tricks/${trick.section ?? 'vertical-kicks'}/${trick.id}`}
                      className="link link-hover rounded text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {trick.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/60">
            {tutorial.author ? <span>{t('author', { name: tutorial.author })}</span> : null}
            {postedAt ? <span>{postedAt}</span> : null}
          </div>

          {tutorial.permalink ? (
            <a
              href={tutorial.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-1 rounded text-primary underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {t('openOnSite')}
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          ) : null}
        </div>
      ),
    };
  };

  const virtualizer = useVirtualizer({
    count: virtualize ? items.length : 0,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => 64,
    overscan: 6,
  });

  if (virtualize) {
    return (
      <div ref={scrollRef} className="tb-surface relative h-[70vh] overflow-auto px-2">
        <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const tutorial = items[virtualItem.index];
            if (!tutorial) {
              return null;
            }
            return (
              <div
                key={tutorial.id}
                ref={virtualizer.measureElement}
                data-index={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <Accordion
                  items={[toItem(tutorial)]}
                  expandedIds={expandedIds}
                  onExpandedChange={handleExpandedChange}
                  expandLabel={t('expand')}
                  collapseLabel={t('collapse')}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="tb-surface px-2">
      <Accordion
        items={items.map(toItem)}
        expandedIds={expandedIds}
        onExpandedChange={handleExpandedChange}
        expandLabel={t('expand')}
        collapseLabel={t('collapse')}
      />
    </div>
  );
}
