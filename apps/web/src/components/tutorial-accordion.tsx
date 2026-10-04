'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { debouncedWrite, formatDate, readEntry, SEVEN_DAYS_MS } from '@tricking/shared';
import { Accordion, type AccordionItem } from '@tricking/ui';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

import type { TutorialListItem } from '@/lib/tutorial-schemas';

// Acordeon del listado de tutoriales. Persiste el estado expandido en localStorage con
// TTL de 7 dias a traves del wrapper de storage (validado con Zod al leer) y virtualiza
// cuando el listado es grande. El contenido de Kojo se muestra tal cual (viene en ingles).

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

    return {
      id: String(tutorial.id),
      header: <span className="break-words">{tutorial.caption ?? t('untitled')}</span>,
      content: (
        <div className="flex flex-col gap-3">
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
    estimateSize: () => 56,
    overscan: 6,
  });

  if (virtualize) {
    return (
      <div
        ref={scrollRef}
        className="relative h-[70vh] overflow-auto rounded-box border border-border bg-base-200 px-2"
      >
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
    <div className="rounded-box border border-border bg-base-200 px-2">
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
