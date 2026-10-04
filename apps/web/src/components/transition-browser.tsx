'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EmptyState, ErrorState, TrickListSkeleton } from '@tricking/ui';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { TransitionBadge } from '@/components/transition-badge';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { fetchTransitions } from '@/lib/semantic-api';
import {
  TRANSITION_GROUPS,
  TRANSITION_GROUP_BUCKETS,
  normalizeTransitionGroup,
} from '@/lib/transition-groups';

const PAGE_SIZES = [12, 24, 48];
const DEFAULT_PAGE_SIZE = 24;

export interface TransitionFilters {
  group?: string;
  q?: string;
  sort: string;
  page: number;
  pageSize: number;
}

interface TransitionBrowserProps {
  initial: TransitionFilters;
}

export function TransitionBrowser({ initial }: TransitionBrowserProps) {
  const t = useTranslations('transitions');
  const router = useRouter();
  const pathname = usePathname();
  const [qInput, setQInput] = useState(initial.q ?? '');

  const filters: TransitionFilters = {
    group: initial.group,
    q: initial.q,
    sort: initial.sort,
    page: initial.page,
    pageSize: initial.pageSize,
  };

  const applyFilter = (patch: Partial<TransitionFilters>) => {
    const next: TransitionFilters = { ...filters, ...patch };
    if (patch.page === undefined) {
      next.page = 1;
    }
    const params = new URLSearchParams();
    if (next.group) params.set('group', next.group);
    if (next.q) params.set('q', next.q);
    if (next.sort && next.sort !== 'name-asc') params.set('sort', next.sort);
    if (next.page > 1) params.set('page', String(next.page));
    if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(next.pageSize));
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
    queryKey: ['transitions', filters],
    queryFn: ({ signal }) => fetchTransitions(filters, signal),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const items = data?.items ?? [];

  const grouped = TRANSITION_GROUP_BUCKETS.map((bucket) => ({
    bucket,
    items: items.filter((item) => normalizeTransitionGroup(item.group) === bucket),
  })).filter((section) => section.items.length > 0);

  const hasActiveFilters =
    Boolean(filters.q) || filters.group !== undefined || filters.sort !== 'name-asc';

  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 rounded-box border border-border bg-base-300/40 p-4 sm:flex-row sm:flex-wrap sm:items-end">
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
          <span>{t('filters.groupLabel')}</span>
          <select
            className="select select-bordered"
            value={filters.group ?? ''}
            onChange={(event) =>
              applyFilter({ group: event.target.value === '' ? undefined : event.target.value })
            }
          >
            <option value="">{t('filters.allGroups')}</option>
            {TRANSITION_GROUPS.map((group) => (
              <option key={group} value={group}>
                {t(`groups.${group}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          <span>{t('filters.sortLabel')}</span>
          <select
            className="select select-bordered"
            value={filters.sort}
            onChange={(event) => applyFilter({ sort: event.target.value })}
          >
            <option value="name-asc">{t('sort.nameAsc')}</option>
            <option value="name-desc">{t('sort.nameDesc')}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          <span>{t('filters.pageSizeLabel')}</span>
          <select
            className="select select-bordered"
            value={filters.pageSize}
            onChange={(event) => applyFilter({ pageSize: Number(event.target.value) })}
          >
            {PAGE_SIZES.map((size) => (
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

      {query.isPending ? <TrickListSkeleton /> : null}

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

      {grouped.map((section) => (
        <section
          key={section.bucket}
          className="flex flex-col gap-3"
          aria-labelledby={`transition-group-${section.bucket}`}
        >
          <div className="flex items-baseline gap-2">
            <h2
              id={`transition-group-${section.bucket}`}
              className="text-xl font-semibold text-base-content"
            >
              {t(`groups.${section.bucket}`)}
            </h2>
            <span className="text-sm text-base-content/60">{section.items.length}</span>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/transitions/${item.slug}`}
                  className="block h-full rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <article className="card h-full border border-base-300 bg-base-100 shadow-sm">
                    <div className="card-body gap-3">
                      <h3 className="card-title">{item.name}</h3>
                      {item.description ? (
                        <p className="line-clamp-3 text-sm text-base-content/70">
                          {item.description}
                        </p>
                      ) : null}
                      <div className="card-actions">
                        <TransitionBadge group={item.group} />
                      </div>
                    </div>
                  </article>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}

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
