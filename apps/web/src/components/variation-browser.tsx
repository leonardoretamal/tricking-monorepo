'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EmptyState, ErrorState, TrickListSkeleton } from '@tricking/ui';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, type KeyboardEvent } from 'react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { fetchVariations } from '@/lib/semantic-api';
import {
  DEFAULT_VARIATION_PAGE_SIZE,
  VARIATION_PAGE_SIZES,
  type VariationFilters,
  type VariationKind,
} from '@/lib/variation-params';
import { VariationCard } from './variation-card';

const KINDS: VariationKind[] = ['family', 'concrete'];

interface VariationBrowserProps {
  initial: VariationFilters;
}

export function VariationBrowser({ initial }: VariationBrowserProps) {
  const t = useTranslations('variations');
  const router = useRouter();
  const pathname = usePathname();
  const [qInput, setQInput] = useState(initial.q ?? '');

  const filters = initial;

  const applyFilter = (patch: Partial<VariationFilters>) => {
    const next: VariationFilters = { ...filters, ...patch };
    if (patch.page === undefined) {
      next.page = 1;
    }
    const params = new URLSearchParams();
    if (next.kind !== 'family') params.set('kind', next.kind);
    if (next.q) params.set('q', next.q);
    if (next.sort !== 'name-asc') params.set('sort', next.sort);
    if (next.page > 1) params.set('page', String(next.page));
    if (next.pageSize !== DEFAULT_VARIATION_PAGE_SIZE) {
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
    queryKey: ['variations', filters],
    queryFn: ({ signal }) => fetchVariations(filters, signal),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const items = data?.items ?? [];

  const hasActiveFilters = Boolean(filters.q) || filters.sort !== 'name-asc';

  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, kind: VariationKind) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') {
      return;
    }
    event.preventDefault();
    const nextKind: VariationKind = kind === 'family' ? 'concrete' : 'family';
    applyFilter({ kind: nextKind });
    requestAnimationFrame(() => {
      document.getElementById(`variation-tab-${nextKind}`)?.focus();
    });
  };

  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div
        role="tablist"
        aria-label={t('kindFilterLabel')}
        className="flex w-fit flex-wrap gap-1 rounded-box border border-border bg-base-300/40 p-1"
      >
        {KINDS.map((kind) => {
          const selected = filters.kind === kind;
          return (
            <button
              key={kind}
              type="button"
              role="tab"
              id={`variation-tab-${kind}`}
              aria-selected={selected}
              aria-controls="variation-panel"
              tabIndex={selected ? 0 : -1}
              onClick={() => applyFilter({ kind })}
              onKeyDown={(event) => handleTabKeyDown(event, kind)}
              className={`btn btn-sm rounded-box ${selected ? 'btn-primary' : 'btn-ghost'}`}
            >
              {t(`kinds.${kind}`)}
            </button>
          );
        })}
      </div>

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
          <span>{t('filters.sortLabel')}</span>
          <select
            className="select select-bordered"
            value={filters.sort}
            onChange={(event) =>
              applyFilter({ sort: event.target.value === 'name-desc' ? 'name-desc' : 'name-asc' })
            }
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
            {VARIATION_PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {t('filters.pageSizeOption', { count: size })}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div
        id="variation-panel"
        role="tabpanel"
        aria-labelledby={`variation-tab-${filters.kind}`}
        className="flex flex-col gap-6"
      >
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

        {data && items.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <VariationCard key={item.id} variation={item} />
            ))}
          </div>
        ) : null}

        {data && data.totalPages > 1 ? (
          <nav
            className="flex items-center justify-center gap-3"
            aria-label={t('pagination.label')}
          >
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
    </div>
  );
}
