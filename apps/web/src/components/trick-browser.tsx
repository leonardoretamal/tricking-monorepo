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
import { useEffect, useRef, useState } from 'react';

import { TrickCard } from '@/components/trick-card';
import { TrickSubcategoryFilter } from '@/components/trick-subcategory-filter';
import { usePathname, useRouter } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import { columnsForWidth, shouldVirtualize } from '@/lib/trick-grid';
import { fetchTricks } from '@/lib/trick-api';
import type { TrickListItem } from '@/lib/trick-schemas';
import { DEFAULT_SECTION, SECTIONS, type Section } from '@/lib/sections';
import { useTricksViewState } from '@/lib/use-tricks-view-state';

const PAGE_SIZES = [24, 48, 100];
const DEFAULT_PAGE_SIZE = 24;
// Altura estimada de la tarjeta rediseñada mas el pie del control de progreso (Fase 21).
// Solo se usa en la rama virtualizada (salvaguarda para conteos mucho mayores a 200).
// Si queda corta, las tarjetas se solapan.
const CARD_ESTIMATE_SIZE = 250;

export interface TrickFilters {
  q?: string;
  section?: Section;
  sub?: string;
  difficulty?: number;
  sort: string;
  page: number;
  pageSize: number;
}

interface TrickBrowserProps {
  section?: Section;
  initial: TrickFilters;
}

export function TrickBrowser({ section, initial }: TrickBrowserProps) {
  const t = useTranslations('tricks');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [qInput, setQInput] = useState(initial.q ?? '');
  const qInputDirtyRef = useRef(false);

  // Al volver del detalle, la busqueda restaurada llega por la URL y actualiza initial.q.
  // Sin esto el input se quedaria con el valor del primer render.
  useEffect(() => {
    setQInput(initial.q ?? '');
  }, [initial.q]);

  const filters: TrickFilters = {
    q: initial.q,
    section: initial.section ?? section,
    sub: initial.sub,
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
    if (next.sub) params.set('sub', next.sub);
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
      sub: undefined,
      difficulty: undefined,
      sort: 'name-asc',
      pageSize: DEFAULT_PAGE_SIZE,
      // En las paginas de seccion la seccion es fija (viene de la ruta); en el listado
      // general tambien se limpia.
      ...(section === undefined ? { section: undefined } : {}),
    });
  };

  useEffect(() => {
    if (!qInputDirtyRef.current) {
      return;
    }
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
    queryKey: ['tricks', activeSection ?? 'all', filters.sub ?? 'all', filters],
    // La URL usa `sub`, pero la API recibe el nombre completo `subcategory`.
    queryFn: ({ signal }) =>
      fetchTricks(
        {
          section: filters.section,
          subcategory: filters.sub,
          q: filters.q,
          difficulty: filters.difficulty,
          sort: filters.sort,
          page: filters.page,
          pageSize: filters.pageSize,
        },
        signal,
      ),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const items = data?.items ?? [];
  const virtualizeItems = shouldVirtualize(items.length);

  const gridRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(1);

  // El contenedor de la grilla se monta recien cuando llegan los datos. Por eso el
  // efecto depende de items.length y de virtualizeItems: medir solo al montar dejaba
  // columns en 1 y la rama virtualizada pintaba las tarjetas a todo el ancho.
  useEffect(() => {
    if (!virtualizeItems || items.length === 0) {
      return;
    }
    const element = gridRef.current;
    if (!element) {
      return;
    }
    const update = () => setColumns(columnsForWidth(element.clientWidth));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [items.length, virtualizeItems]);

  const virtualizer = useVirtualizer({
    count: virtualizeItems ? items.length : 0,
    getScrollElement: () => gridRef.current,
    estimateSize: () => CARD_ESTIMATE_SIZE,
    lanes: columns,
    overscan: 4,
  });

  useTricksViewState({
    pathname,
    filters,
    applyFilter,
    queryReady: Boolean(data) && !query.isFetching,
    scrollElement: gridRef,
  });

  const hasActiveFilters =
    Boolean(filters.q) ||
    Boolean(filters.sub) ||
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
                onChange={(event) => {
                  qInputDirtyRef.current = true;
                  setQInput(event.target.value);
                }}
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
                    sub: undefined,
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

          {activeSection !== undefined ? (
            <TrickSubcategoryFilter
              section={activeSection}
              value={filters.sub}
              onChange={(sub) => applyFilter({ sub })}
            />
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
        virtualizeItems ? (
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
