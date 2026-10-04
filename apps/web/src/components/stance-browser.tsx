'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { EmptyState, ErrorState, TrickCard, TrickListSkeleton } from '@tricking/ui';
import { useTranslations } from 'next-intl';

import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { fetchStances } from '@/lib/semantic-api';

const PAGE_SIZE = 24;

interface StanceBrowserProps {
  initialPage: number;
}

export function StanceBrowser({ initialPage }: StanceBrowserProps) {
  const t = useTranslations('stances');
  const router = useRouter();
  const pathname = usePathname();

  const query = useQuery({
    queryKey: ['stances', { page: initialPage, pageSize: PAGE_SIZE }],
    queryFn: ({ signal }) => fetchStances({ page: initialPage, pageSize: PAGE_SIZE }, signal),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const items = data?.items ?? [];

  const goToPage = (next: number) => {
    const params = new URLSearchParams();
    if (next > 1) {
      params.set('page', String(next));
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname);
  };

  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      {data ? (
        <p className="text-sm text-base-content/70" aria-live="polite">
          {t('results.range', { start: rangeStart, end: rangeEnd, total: data.total })}
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
        <EmptyState title={t('states.emptyTitle')} description={t('states.emptyDescription')} />
      ) : null}

      {data && items.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/stances/${item.slug}`}
              className="block rounded-box focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <TrickCard
                name={item.name}
                description={item.description ?? undefined}
                categories={[{ label: t('landingCount', { count: item.landingTrickCount }) }]}
              />
            </Link>
          ))}
        </div>
      ) : null}

      {data && data.totalPages > 1 ? (
        <nav className="flex items-center justify-center gap-3" aria-label={t('pagination.label')}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={data.page <= 1}
            onClick={() => goToPage(data.page - 1)}
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
            onClick={() => goToPage(data.page + 1)}
          >
            {t('pagination.next')}
          </button>
        </nav>
      ) : null}
    </div>
  );
}
