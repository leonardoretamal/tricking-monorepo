'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EmptyState, ErrorState, TrickListSkeleton } from '@tricking/ui';
import { TEN_MINUTES_MS } from '@tricking/shared';
import { Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState, type ChangeEvent, type KeyboardEvent, type ReactNode } from 'react';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { pickDescription } from '@/lib/description';
import { fetchSearch } from '@/lib/search-api';
import {
  DEFAULT_SEARCH_PAGE_SIZE,
  type SearchFilters,
  type SearchItem,
  type SearchType,
} from '@/lib/search-schemas';

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;
const SEARCH_INPUT_ID = 'search-page-input';
const GROUP_ORDER: SearchType[] = ['trick', 'variation', 'transition', 'stance'];

interface SearchResultsProps {
  initial: SearchFilters;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Resalta las coincidencias del termino con <mark>, sin inyectar HTML.
function highlightMatch(text: string, query: string): ReactNode {
  const term = query.trim();
  if (term.length < MIN_QUERY_LENGTH) {
    return text;
  }
  const regex = new RegExp(`(${escapeRegExp(term)})`, 'gi');
  const lower = term.toLowerCase();
  return text.split(regex).map((part, index) =>
    part.toLowerCase() === lower ? (
      <mark key={index} className="rounded bg-warning/40 px-0.5 text-base-content">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function hrefFor(item: SearchItem): string {
  switch (item.type) {
    case 'trick':
      return `/tricks/${item.section ?? 'vertical-kicks'}/${item.id}`;
    case 'variation':
      return `/variations/${item.slug}`;
    case 'transition':
      return `/transitions/${item.slug}`;
    case 'stance':
      return `/stances/${item.slug}`;
  }
}

function groupByType(items: SearchItem[]): { type: SearchType; items: SearchItem[] }[] {
  const groups = new Map<SearchType, SearchItem[]>();
  for (const item of items) {
    const bucket = groups.get(item.type);
    if (bucket) {
      bucket.push(item);
    } else {
      groups.set(item.type, [item]);
    }
  }
  return GROUP_ORDER.flatMap((type) => {
    const grouped = groups.get(type);
    return grouped && grouped.length > 0 ? [{ type, items: grouped }] : [];
  });
}

export function SearchResults({ initial }: SearchResultsProps) {
  const t = useTranslations('search');
  const tTricks = useTranslations('tricks');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [qInput, setQInput] = useState(initial.q);

  useEffect(() => {
    setQInput(initial.q);
  }, [initial.q]);

  const buildHref = (patch: Partial<SearchFilters>): string => {
    const next: SearchFilters = { ...initial, ...patch };
    const params = new URLSearchParams();
    const trimmed = next.q.trim();
    if (trimmed) params.set('q', trimmed);
    if (next.type) params.set('type', next.type);
    if (next.page > 1) params.set('page', String(next.page));
    if (next.pageSize !== DEFAULT_SEARCH_PAGE_SIZE) {
      params.set('pageSize', String(next.pageSize));
    }
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      if (initial.q.trim() !== qInput.trim()) {
        // Al cambiar la busqueda se resetea la pagina a 1.
        router.replace(buildHref({ q: qInput, page: 1 }));
      }
    }, DEBOUNCE_MS);
    return () => clearTimeout(handle);
    // buildHref depende de initial y pathname; el guard evita bucles de navegacion.
  }, [qInput, initial.q]);

  const active = initial.q.trim().length >= MIN_QUERY_LENGTH;

  const query = useQuery({
    queryKey: ['search', initial.q, initial.type ?? null, initial.page, initial.pageSize],
    queryFn: ({ signal }) => fetchSearch(initial, signal),
    enabled: active,
    placeholderData: keepPreviousData,
    staleTime: TEN_MINUTES_MS,
    gcTime: TEN_MINUTES_MS,
  });

  const data = query.data;
  const items = data?.items ?? [];
  const groups = groupByType(items);
  const queryTerm = initial.q.trim();

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQInput(event.target.value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (qInput.trim().length >= MIN_QUERY_LENGTH) {
        router.replace(buildHref({ q: qInput, page: 1 }));
      }
    }
    if (event.key === 'Escape') {
      setQInput('');
      router.replace(buildHref({ q: '', page: 1 }));
    }
  };

  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      <form role="search" aria-label={t('title')} className="flex w-full max-w-xl flex-col gap-1">
        <label htmlFor={SEARCH_INPUT_ID} className="sr-only">
          {t('inputLabel')}
        </label>
        <span className="relative block">
          <Search
            aria-hidden="true"
            className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50"
          />
          <input
            id={SEARCH_INPUT_ID}
            type="search"
            value={qInput}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={t('inputPlaceholder')}
            className="input input-bordered w-full pl-9"
          />
        </span>
      </form>

      {data && active ? (
        <p className="text-sm text-base-content/70" aria-live="polite">
          {data.total === 0
            ? t('results.none')
            : t('results.range', { start: rangeStart, end: rangeEnd, total: data.total })}
        </p>
      ) : null}

      {query.isPending && active ? <TrickListSkeleton /> : null}

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

      {!active ? (
        <EmptyState
          title={t('states.emptyQueryTitle')}
          description={t('states.emptyQueryDescription')}
        />
      ) : null}

      {active && data && data.total === 0 ? (
        <EmptyState
          title={t('states.emptyFilteredTitle', { query: queryTerm })}
          description={t('states.emptyFilteredDescription')}
        />
      ) : null}

      {groups.map((group) => (
        <section
          key={group.type}
          className="flex flex-col gap-3"
          aria-labelledby={`search-group-${group.type}`}
        >
          <div className="flex items-baseline gap-2">
            <h2
              id={`search-group-${group.type}`}
              className="text-xl font-semibold text-base-content"
            >
              {t(`groups.${group.type}`)}
            </h2>
            <span className="text-sm text-base-content/60">{group.items.length}</span>
          </div>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((item) => {
              const description = pickDescription(locale, item.description, item.descriptionEs);
              return (
                <li key={`${item.type}-${item.id}`}>
                  <Link
                    href={hrefFor(item)}
                    className="block h-full rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  >
                    <article className="card h-full border border-base-300 bg-base-100 shadow-sm">
                      <div className="card-body gap-2">
                        <h3 className="text-lg font-semibold text-base-content">
                          {highlightMatch(item.name, queryTerm)}
                        </h3>
                        {description ? (
                          <p className="line-clamp-3 text-sm text-base-content/70">
                            {highlightMatch(description, queryTerm)}
                          </p>
                        ) : null}
                        {item.type === 'trick' && item.difficulty !== null ? (
                          <div className="card-actions">
                            <span className={`badge tb-badge tb-difficulty-${item.difficulty}`}>
                              {tTricks(`difficulty.${item.difficulty}`)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </article>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {active && data && data.totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3" aria-label={t('pagination.label')}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={data.page <= 1}
            onClick={() => router.replace(buildHref({ page: data.page - 1 }))}
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
            onClick={() => router.replace(buildHref({ page: data.page + 1 }))}
          >
            {t('pagination.next')}
          </button>
        </nav>
      ) : null}
    </div>
  );
}
