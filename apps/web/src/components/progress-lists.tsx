'use client';

import { EmptyState, ErrorState, LoadingState } from '@tricking/ui';
import { useQuery } from '@tanstack/react-query';
import { Bookmark, Check, TrendingUp, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';

import { Link } from '@/i18n/navigation';
import { useProgressStore } from '@/lib/progress-store';
import type { TrickProgressStatus } from '@/lib/progress-schemas';
import { DEFAULT_SECTION } from '@/lib/sections';
import type { TrickByIdItem } from '@/lib/trick-schemas';
import { fetchTricksByIds } from '@/lib/tricks-by-ids-api';

// Listado de trucos marcados por estado (Fase 41). Los ids viven en el progreso local; se
// resuelven a nombre, seccion y dificultad con /api/tricks/by-ids y TanStack Query. El
// estado de cada truco lo conoce el cliente, asi que las tres listas salen del mismo
// conjunto de ids en una sola peticion.

interface StatusMeta {
  icon: LucideIcon;
  textClass: string;
}

const STATUS_META: Record<TrickProgressStatus, StatusMeta> = {
  learned: { icon: Check, textClass: 'text-success' },
  in_progress: { icon: TrendingUp, textClass: 'text-warning' },
  want: { icon: Bookmark, textClass: 'text-info' },
};

const STATUS_ORDER: TrickProgressStatus[] = ['learned', 'in_progress', 'want'];

const TITLE_KEY: Record<TrickProgressStatus, string> = {
  learned: 'learnedTitle',
  in_progress: 'inProgressTitle',
  want: 'wantTitle',
};

const EMPTY_KEY: Record<TrickProgressStatus, string> = {
  learned: 'learnedEmpty',
  in_progress: 'inProgressEmpty',
  want: 'wantEmpty',
};

const LINK_CLASS =
  'link link-hover font-medium transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const FOCUS_CLASS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

// Tope de items visibles por lista antes de "Mostrar mas". Evita pintar cientos de filas
// de una sola vez sin introducir virtualizacion (el usuario suele marcar pocos trucos).
const PAGE_SIZE = 50;

export function ProgressLists() {
  const t = useTranslations('progress');
  const tricks = useProgressStore((state) => state.tricks);
  const hydrate = useProgressStore((state) => state.hydrate);

  const [visible, setVisible] = useState<Record<TrickProgressStatus, number>>({
    learned: PAGE_SIZE,
    in_progress: PAGE_SIZE,
    want: PAGE_SIZE,
  });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const groups = useMemo(() => {
    const byStatus: Record<TrickProgressStatus, string[]> = {
      learned: [],
      in_progress: [],
      want: [],
    };
    for (const [id, status] of Object.entries(tricks)) {
      byStatus[status].push(id);
    }
    return byStatus;
  }, [tricks]);

  const allIds = useMemo(() => {
    const set = new Set<string>();
    for (const status of STATUS_ORDER) {
      for (const id of groups[status]) {
        set.add(id);
      }
    }
    return [...set].sort();
  }, [groups]);

  const idsKey = allIds.join(',');

  const query = useQuery({
    queryKey: ['tricks-by-ids', idsKey],
    queryFn: ({ signal }) => fetchTricksByIds(allIds, signal),
    enabled: allIds.length > 0,
  });

  const itemById = useMemo(() => {
    const map = new Map<string, TrickByIdItem>();
    for (const item of query.data?.items ?? []) {
      map.set(item.id, item);
    }
    return map;
  }, [query.data]);

  return (
    <section className="tb-surface">
      <div className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex flex-col gap-1">
          <h2 className="tb-display text-2xl text-base-content">{t('lists.title')}</h2>
          <p className="max-w-2xl text-sm text-base-content/70">{t('lists.description')}</p>
        </div>

        {allIds.length === 0 ? (
          <EmptyState
            title={t('lists.allEmptyTitle')}
            description={t('lists.allEmptyDescription')}
          />
        ) : null}

        {allIds.length > 0 && query.isLoading ? <LoadingState label={t('lists.loading')} /> : null}

        {allIds.length > 0 && query.isError ? (
          <ErrorState
            title={t('lists.errorTitle')}
            description={t('lists.errorDescription')}
            action={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void query.refetch()}
              >
                {t('lists.retry')}
              </button>
            }
          />
        ) : null}

        {allIds.length > 0 && query.isSuccess ? (
          <div className="flex flex-col gap-6">
            {STATUS_ORDER.map((status) => {
              const meta = STATUS_META[status];
              const Icon = meta.icon;
              const ids = groups[status].filter((id) => itemById.has(id));
              const shown = ids.slice(0, visible[status]);
              return (
                <div key={status} className="flex flex-col gap-2">
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-base-content">
                    <Icon aria-hidden="true" className={`size-4 ${meta.textClass}`} />
                    <span>{t(`lists.${TITLE_KEY[status]}`)}</span>
                    <span className="text-base-content/60">({ids.length})</span>
                  </h3>
                  {ids.length === 0 ? (
                    <p className="text-sm text-base-content/60">
                      {t(`lists.${EMPTY_KEY[status]}`)}
                    </p>
                  ) : (
                    <>
                      <ul className="flex flex-col gap-1">
                        {shown.map((id) => {
                          const item = itemById.get(id);
                          if (item === undefined) {
                            return null;
                          }
                          const href = `/tricks/${item.section ?? DEFAULT_SECTION}/${item.id}`;
                          return (
                            <li key={id} className="flex flex-wrap items-center gap-2">
                              <Link href={href} className={LINK_CLASS}>
                                {item.name}
                              </Link>
                              {item.difficulty !== null ? (
                                <span
                                  className={`badge tb-badge tb-difficulty-${item.difficulty}`}
                                  aria-label={t('lists.difficultyLabel', {
                                    value: item.difficulty,
                                  })}
                                  title={t('lists.difficultyLabel', { value: item.difficulty })}
                                >
                                  {item.difficulty}
                                </span>
                              ) : null}
                            </li>
                          );
                        })}
                      </ul>
                      {ids.length > shown.length ? (
                        <button
                          type="button"
                          className={`btn btn-ghost btn-xs self-start text-base-content/80 ${FOCUS_CLASS}`}
                          onClick={() =>
                            setVisible((current) => ({
                              ...current,
                              [status]: current[status] + PAGE_SIZE,
                            }))
                          }
                        >
                          {t('lists.showMore')}
                        </button>
                      ) : null}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
