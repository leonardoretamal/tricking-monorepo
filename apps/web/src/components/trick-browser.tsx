'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  EmptyState,
  ErrorState,
  TrickListSkeleton,
  categoryBadgeColor,
  type TrickCardCategory,
} from '@tricking/ui';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { TrickCard } from '@/components/trick-card';
import { usePathname, useRouter } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import { fetchTricks } from '@/lib/trick-api';
import type { TrickListItem } from '@/lib/trick-schemas';
import { DEFAULT_SECTION, SECTIONS, type Section } from '@/lib/sections';

const PAGE_SIZES = [24, 48, 100];
const DEFAULT_PAGE_SIZE = 24;
const VIRTUALIZE_THRESHOLD = 60;
// Altura estimada de la tarjeta rediseñada mas el pie del control de progreso (Fase 21).
// Se usa para las filas del listado virtualizado; si queda corta, las tarjetas se solapan.
const CARD_ESTIMATE_SIZE = 250;

export interface TrickFilters {
  q?: string;
  section?: Section;
  difficulty?: number;
  sort: string;
  page: number;
  pageSize: number;
}

interface TrickBrowserProps {
  section?: Section;
  initial: TrickFilters;
}

function useGridColumns(ref: RefObject<HTMLDivElement | null>): number {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }
    const update = () => {
      const width = element.clientWidth;
      setColumns(width >= 1024 ? 3 : width >= 640 ? 2 : 1);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return columns;
}

export function TrickBrowser({ section, initial }: TrickBrowserProps) {
  const t = useTranslations('tricks');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [qInput, setQInput] = useState(initial.q ?? '');

  const filters: TrickFilters = {
    q: initial.q,
    section: initial.section ?? section,
    difficulty: initial.difficulty,
    sort: initial.sort,
    page: initial.page,
    pageSize: initial.pageSize,
  };

  const activeSection = filters.section;

  const applyFilter = (patch: Partial<TrickFilters>) => {
    const next: TrickFilters = { ...filters, ...patch };
    if (patch.page === undefined) {
      next.page = 1;
    }
    const params = new URLSearchParams();
    if (next.q) params.set('q', next.q);
    if (next.section) params.set('section', next.section);
    if (next.difficulty !== undefined) params.set('difficulty', String(next.difficulty));
    if (next.sort && next.sort !== 'name-asc') params.set('sort', next.sort);
    if (next.page > 1) params.set('page', String(next.page));
    if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(next.pageSize));
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const clearFilters = () => {
    setQInput('');
    applyFilter({
      q: undefined,
      difficulty: undefined,
      sort: 'name-asc',
      pageSize: DEFAULT_PAGE_SIZE,
      // En las paginas de seccion la seccion es fija (viene de la ruta); en el listado
      // general tambien se limpia.
      ...(section === undefined ? { section: undefined } : {}),
    });
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
    queryKey: ['tricks', activeSection ?? 'all', filters],
    queryFn: ({ signal }) => fetchTricks(filters, signal),
    placeholderData: keepPreviousData,
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const columns = useGridColumns(gridRef);
  const data = query.data;
  const items = data?.items ?? [];
  const shouldVirtualize = items.length > VIRTUALIZE_THRESHOLD;

  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? items.length : 0,
    getScrollElement: () => gridRef.current,
    estimateSize: () => CARD_ESTIMATE_SIZE,
    lanes: columns,
    overscan: 4,
  });

  const hasActiveFilters =
    Boolean(filters.q) ||
    initial.section !== undefined ||
    filters.difficulty !== undefined ||
    filters.sort !== 'name-asc';

  const tDifficulty = (level: number) => t(`difficulty.${level}`);

  const toCardCategories = (item: TrickListItem): TrickCardCategory[] =>
    item.categories.flatMap((slug) => {
      const color = categoryBadgeColor(slug);
      return color ? [{ label: t(`categories.${slug}`), color }] : [];
    });

  const renderCard = (item: TrickListItem) => (
    <TrickCard
      trickId={item.id}
      href={`/tricks/${item.section ?? activeSection ?? DEFAULT_SECTION}/${item.id}`}
      name={item.name}
      description={pickDescription(locale, item.description, item.descriptionEs) ?? undefined}
      difficulty={item.difficulty ?? undefined}
      difficultyLabel={item.difficulty !== null ? tDifficulty(item.difficulty) : undefined}
      categories={toCardCategories(item)}
    />
  );

  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="tb-surface flex flex-col gap-5 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="tb-eyebrow flex items-center gap-2">
            <SlidersHorizontal aria-hidden="true" className="size-4" />
            {t('filters.panelTitle')}
          </span>
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="btn btn-ghost btn-xs gap-1 text-base-content/70 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X aria-hidden="true" className="size-3.5" />
              {t('filters.clear')}
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex min-w-[12rem] flex-1 flex-col gap-1.5 text-sm font-medium text-base-content/80">
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
                className="input input-bordered w-full bg-base-100 pl-9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              />
            </span>
          </label>

          {section === undefined ? (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-base-content/80">
              <span>{t('filters.sectionLabel')}</span>
              <select
                className="select select-bordered bg-base-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                value={filters.section ?? ''}
                onChange={(event) =>
                  applyFilter({
                    section:
                      event.target.value === '' ? undefined : (event.target.value as Section),
                  })
                }
              >
                <option value="">{t('filters.allSections')}</option>
                {SECTIONS.map((candidate) => (
                  <option key={candidate} value={candidate}>
                    {t(`sections.${candidate}.title`)}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-base-content/80">
            <span>{t('filters.difficultyLabel')}</span>
            <select
              className="select select-bordered bg-base-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              value={filters.difficulty ?? ''}
              onChange={(event) =>
                applyFilter({
                  difficulty: event.target.value === '' ? undefined : Number(event.target.value),
                })
              }
            >
              <option value="">{t('filters.allDifficulties')}</option>
              {[0, 1, 2, 3, 4, 5].map((level) => (
                <option key={level} value={level}>
                  {tDifficulty(level)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-base-content/80">
            <span>{t('filters.sortLabel')}</span>
            <select
              className="select select-bordered bg-base-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              value={filters.sort}
              onChange={(event) => applyFilter({ sort: event.target.value })}
            >
              <option value="name-asc">{t('sort.nameAsc')}</option>
              <option value="name-desc">{t('sort.nameDesc')}</option>
              <option value="difficulty-asc">{t('sort.difficultyAsc')}</option>
              <option value="difficulty-desc">{t('sort.difficultyDesc')}</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-base-content/80">
            <span>{t('filters.pageSizeLabel')}</span>
            <select
              className="select select-bordered bg-base-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
      </div>

      {data ? (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-base-content/70" aria-live="polite">
            {data.total === 0
              ? t('results.none')
              : t('results.range', { start: rangeStart, end: rangeEnd, total: data.total })}
          </p>
          {hasActiveFilters ? (
            <span className="badge tb-badge tb-cat-transitions">{t('results.filtered')}</span>
          ) : null}
        </div>
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
        shouldVirtualize ? (
          <div ref={gridRef} className="relative h-[70vh] overflow-auto">
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualItem) => {
                const item = items[virtualItem.index];
                if (!item) {
                  return null;
                }
                return (
                  <div
                    key={item.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: `${((virtualItem.lane ?? 0) / columns) * 100}%`,
                      width: `${100 / columns}%`,
                      height: `${virtualItem.size}px`,
                      transform: `translateY(${virtualItem.start}px)`,
                      padding: '0 0.5rem 1rem',
                    }}
                  >
                    {renderCard(item)}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <div key={item.id}>{renderCard(item)}</div>
            ))}
          </div>
        )
      ) : null}

      {data && data.totalPages > 1 ? (
        <nav
          className="flex flex-wrap items-center justify-center gap-2"
          aria-label={t('pagination.label')}
        >
          <button
            type="button"
            className="btn btn-outline btn-sm gap-1"
            disabled={data.page <= 1}
            onClick={() => applyFilter({ page: data.page - 1 })}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            {t('pagination.previous')}
          </button>
          <span className="rounded-box border border-border bg-base-200 px-4 py-1.5 text-sm font-medium text-base-content">
            {t('pagination.status', { page: data.page, totalPages: data.totalPages })}
          </span>
          <button
            type="button"
            className="btn btn-outline btn-sm gap-1"
            disabled={data.page >= data.totalPages}
            onClick={() => applyFilter({ page: data.page + 1 })}
          >
            {t('pagination.next')}
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </nav>
      ) : null}
    </div>
  );
}
