'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EmptyState, ErrorState } from '@tricking/ui';
import { Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { fetchTechniqueGeneral, fetchTutorials } from '@/lib/tutorial-api';
import {
  DEFAULT_TUTORIAL_PAGE_SIZE,
  TUTORIAL_PAGE_SIZES,
  type TutorialFilters,
} from '@/lib/tutorial-schemas';
import { TutorialAccordion } from './tutorial-accordion';

const VIRTUALIZE_THRESHOLD = 100;

interface TutorialBrowserProps {
  initial: TutorialFilters;
}

function TutorialListSkeleton() {
  return (
    <div className="tb-surface flex flex-col gap-2 px-2 py-2" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="skeleton h-5 w-2/3" />
          <div className="skeleton size-5 shrink-0 rounded" />
        </div>
      ))}
    </div>
  );
}

export function TutorialBrowser({ initial }: TutorialBrowserProps) {
  const t = useTranslations('tutorials');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [qInput, setQInput] = useState(initial.q ?? '');

  const filters = initial;

  const applyFilter = (patch: Partial<TutorialFilters>) => {
    const next: TutorialFilters = { ...filters, ...patch };
    if (patch.page === undefined) {
      next.page = 1;
    }
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.sort !== 'date-desc') params.set('sort', next.sort);
    if (next.page > 1) params.set('page', String(next.page));
    if (next.pageSize !== DEFAULT_TUTORIAL_PAGE_SIZE) {
      params.set('pageSize', String(next.pageSize));
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      const current = initial.q ?? '';
      if (current !== qInput) {
        applyFilter({ q: qInput || undefined });
      }
    }, 350);
    return () => clearTimeout(handle);
    // applyFilter e initial.q cambian con la navegacion; el guard evita bucles.
  }, [qInput, initial.q]);

  const query = useQuery({
    queryKey: ['tutorials', filters],
    queryFn: ({ signal }) => fetchTutorials(filters, signal),
    placeholderData: keepPreviousData,
  });

  const generalQuery = useQuery({
    queryKey: ['techniques', 'general', locale],
    queryFn: ({ signal }) => fetchTechniqueGeneral(locale, signal),
  });

  const data = query.data;
  const items = data?.items ?? [];
  const shouldVirtualize = (data?.total ?? 0) > VIRTUALIZE_THRESHOLD;

  const hasActiveFilters = Boolean(filters.q) || filters.sort !== 'date-desc';

  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      {generalQuery.data?.content ? (
        <section className="rounded-box border border-info/30 bg-info/10 px-4 py-4">
          <h2 className="tb-eyebrow text-info">{t('generalHeading')}</h2>
          <p className="mt-1 text-sm text-base-content/85">{generalQuery.data.content}</p>
        </section>
      ) : null}

      <div className="tb-surface flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
        <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
          <span>{t('filters.searchLabel')}</span>
          <span className="relative block">
            <Search
              aria-hidden="true"
              className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
            />
            <input
              type="search"
              value={qInput}
              onChange={(event) => setQInput(event.target.value)}
              placeholder={t('filters.searchPlaceholder')}
              className="input input-bordered w-full pl-9"
            />
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          <span>{t('filters.sortLabel')}</span>
          <select
            className="select select-bordered"
            value={filters.sort}
            onChange={(event) => {
              const value = event.target.value;
              if (value === 'date-asc' || value === 'title-asc' || value === 'title-desc') {
                applyFilter({ sort: value });
              } else {
                applyFilter({ sort: 'date-desc' });
              }
            }}
          >
            <option value="date-desc">{t('sort.dateDesc')}</option>
            <option value="date-asc">{t('sort.dateAsc')}</option>
            <option value="title-asc">{t('sort.titleAsc')}</option>
            <option value="title-desc">{t('sort.titleDesc')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          <span>{t('filters.pageSizeLabel')}</span>
          <select
            className="select select-bordered"
            value={filters.pageSize}
            onChange={(event) => applyFilter({ pageSize: Number(event.target.value) })}
          >
            {TUTORIAL_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {t('filters.pageSizeOption', { count: size })}
              </option>
            ))}
          </select>
        </label>
      </div>

      {data ? (
        <p className="text-sm text-base-content/70" aria-live="polite">
          {data.total === 0
            ? t('results.none')
            : t('results.range', { start: rangeStart, end: rangeEnd, total: data.total })}
          {hasActiveFilters ? ` ${t('results.filtered')}` : ''}
        </p>
      ) : null}

      {query.isPending ? <TutorialListSkeleton /> : null}

      {query.isError ? (
        <ErrorState
          title={t('states.errorTitle')}
          description={t('states.errorDescription')}
          action={
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => query.refetch()}
            >
              {t('states.retry')}
            </button>
          }
        />
      ) : null}

      {data && items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? t('states.emptyFilteredTitle') : t('states.emptyTitle')}
          description={
            hasActiveFilters ? t('states.emptyFilteredDescription') : t('states.emptyDescription')
          }
        />
      ) : null}

      {data && items.length > 0 ? (
        <TutorialAccordion items={items} locale={locale} virtualize={shouldVirtualize} />
      ) : null}

      {data && data.totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3" aria-label={t('pagination.label')}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={data.page <= 1}
            onClick={() => applyFilter({ page: data.page - 1 })}
          >
            {t('pagination.previous')}
          </button>
          <span className="text-sm text-base-content/70">
            {t('pagination.status', { page: data.page, totalPages: data.totalPages })}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={data.page >= data.totalPages}
            onClick={() => applyFilter({ page: data.page + 1 })}
          >
            {t('pagination.next')}
          </button>
        </nav>
      ) : null}
    </div>
  );
}
