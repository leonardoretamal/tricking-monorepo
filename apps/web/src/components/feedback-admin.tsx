'use client';

import { useQuery } from '@tanstack/react-query';
import { formatDate, formatNumber } from '@tricking/shared';
import { EmptyState, ErrorState, LoadingState } from '@tricking/ui';
import { Archive, Check, CheckCheck, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { toast } from 'sonner';

import { usePathname, useRouter } from '@/i18n/navigation';
import {
  FeedbackApiError,
  deleteFeedback,
  fetchFeedback,
  updateFeedbackStatus,
} from '@/lib/feedback-api';
import {
  DEFAULT_FEEDBACK_PAGE_SIZE,
  FEEDBACK_STATUSES,
  FEEDBACK_TYPES,
  isFeedbackStatus,
  isFeedbackType,
  type FeedbackStatus,
  type FeedbackType,
  type PaginatedFeedbackResponse,
} from '@/lib/feedback-schemas';

const STATUS_BADGE: Record<string, string> = {
  nuevo: 'badge-info',
  leido: 'badge-ghost',
  respondido: 'badge-success',
  archivado: 'badge-neutral',
};

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function FeedbackAdmin() {
  const t = useTranslations('admin.feedback');
  const tFeedback = useTranslations('feedback');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [tokenInput, setTokenInput] = useState('');
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const statusParam = searchParams.get('status');
  const typeParam = searchParams.get('type');
  const status = statusParam !== null && isFeedbackStatus(statusParam) ? statusParam : undefined;
  const type = typeParam !== null && isFeedbackType(typeParam) ? typeParam : undefined;
  const page = parsePage(searchParams.get('page'));
  const hasActiveFilters = status !== undefined || type !== undefined;

  const query = useQuery({
    queryKey: ['feedback-admin', token, status ?? '', type ?? '', page],
    queryFn: ({ signal }) =>
      fetchFeedback({ status, type, page, pageSize: DEFAULT_FEEDBACK_PAGE_SIZE }, token, signal),
    enabled: token !== '',
    retry: false,
  });

  const unauthorized = query.error instanceof FeedbackApiError && query.error.status === 401;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) {
      return;
    }
    if (pendingDelete !== null && !dialog.open) {
      dialog.showModal();
    }
    if (pendingDelete === null && dialog.open) {
      dialog.close();
    }
  }, [pendingDelete]);

  const updateQuery = (patch: {
    status?: FeedbackStatus | null;
    type?: FeedbackType | null;
    page?: number;
  }): void => {
    const params = new URLSearchParams(searchParams.toString());
    if (patch.status !== undefined) {
      if (patch.status === null) {
        params.delete('status');
      } else {
        params.set('status', patch.status);
      }
      params.delete('page');
    }
    if (patch.type !== undefined) {
      if (patch.type === null) {
        params.delete('type');
      } else {
        params.set('type', patch.type);
      }
      params.delete('page');
    }
    if (patch.page !== undefined) {
      if (patch.page > 1) {
        params.set('page', String(patch.page));
      } else {
        params.delete('page');
      }
    }
    const queryString = params.toString();
    router.replace(queryString === '' ? pathname : `${pathname}?${queryString}`);
  };

  const applyToken = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const next = tokenInput.trim();
    if (next !== '') {
      setToken(next);
    }
  };

  const changeToken = (): void => {
    setToken('');
    setTokenInput('');
  };

  const handleStatusChange = async (id: number, next: FeedbackStatus): Promise<void> => {
    setBusyId(id);
    try {
      await updateFeedbackStatus(id, next, token);
      toast.success(t('toast.statusUpdated'));
      await query.refetch();
    } catch (error) {
      if (error instanceof FeedbackApiError && error.status === 401) {
        toast.error(t('toast.unauthorized'));
        changeToken();
      } else {
        toast.error(t('toast.error'));
      }
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async (): Promise<void> => {
    if (pendingDelete === null) {
      return;
    }
    const id = pendingDelete;
    setBusyId(id);
    try {
      await deleteFeedback(id, token);
      toast.success(t('toast.deleted'));
      setPendingDelete(null);
      await query.refetch();
    } catch (error) {
      if (error instanceof FeedbackApiError && error.status === 401) {
        toast.error(t('toast.unauthorized'));
        changeToken();
      } else {
        toast.error(t('toast.error'));
      }
    } finally {
      setBusyId(null);
    }
  };

  if (token === '') {
    return (
      <div className="tb-surface max-w-xl">
        <form onSubmit={applyToken} className="flex flex-col gap-4 p-6">
          <label className="flex flex-col gap-1 text-sm font-medium" htmlFor="feedback-admin-token">
            <span>{t('tokenLabel')}</span>
            <input
              id="feedback-admin-token"
              type="password"
              className="input input-bordered"
              value={tokenInput}
              onChange={(event) => setTokenInput(event.target.value)}
              placeholder={t('tokenPlaceholder')}
              autoComplete="off"
              aria-describedby="feedback-admin-token-hint"
            />
          </label>
          <p id="feedback-admin-token-hint" className="text-xs text-base-content/60">
            {t('tokenRequired')}
          </p>
          <div className="flex justify-start">
            <button type="submit" className="btn btn-primary" disabled={tokenInput.trim() === ''}>
              {t('tokenApply')}
            </button>
          </div>
        </form>
      </div>
    );
  }

  const data: PaginatedFeedbackResponse | undefined = query.data;
  const items = data?.items ?? [];
  const rangeStart = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const rangeEnd = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      {unauthorized ? (
        <ErrorState
          title={t('tokenInvalid')}
          action={
            <button type="button" className="btn btn-outline btn-sm" onClick={changeToken}>
              {t('tokenApply')}
            </button>
          }
        />
      ) : null}

      {!unauthorized ? (
        <>
          <div className="tb-surface flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex flex-col gap-1 text-sm font-medium">
              <span>{t('filters.statusLabel')}</span>
              <select
                className="select select-bordered"
                value={status ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  updateQuery({ status: isFeedbackStatus(value) ? value : null });
                }}
              >
                <option value="">{t('filters.allStatuses')}</option>
                {FEEDBACK_STATUSES.map((value) => (
                  <option key={value} value={value}>
                    {t(`status.${value}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1 text-sm font-medium">
              <span>{t('filters.typeLabel')}</span>
              <select
                className="select select-bordered"
                value={type ?? ''}
                onChange={(event) => {
                  const value = event.target.value;
                  updateQuery({ type: isFeedbackType(value) ? value : null });
                }}
              >
                <option value="">{t('filters.allTypes')}</option>
                {FEEDBACK_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {tFeedback(`types.${value}`)}
                  </option>
                ))}
              </select>
            </label>

            {hasActiveFilters ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => updateQuery({ status: null, type: null })}
              >
                {t('filters.clear')}
              </button>
            ) : null}
          </div>

          {hasActiveFilters ? (
            <p className="text-sm text-base-content/70" aria-live="polite">
              {t('filters.active')}
            </p>
          ) : null}

          {query.isPending ? <LoadingState label={t('states.loading')} /> : null}

          {query.isError && !unauthorized ? (
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

          {data ? (
            <p className="text-sm text-base-content/70" aria-live="polite">
              {t('results.range', { start: rangeStart, end: rangeEnd, total: data.total })}
            </p>
          ) : null}

          {data && items.length === 0 ? (
            <EmptyState
              title={hasActiveFilters ? t('states.noResultsTitle') : t('states.emptyTitle')}
              description={
                hasActiveFilters ? t('states.noResultsDescription') : t('states.emptyDescription')
              }
            />
          ) : null}

          {items.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {items.map((item) => (
                <li key={item.id} className="tb-surface">
                  <div className="flex flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`badge ${STATUS_BADGE[item.status] ?? 'badge-ghost'}`}>
                        {t(`status.${item.status}`)}
                      </span>
                      <span className="badge badge-outline">{tFeedback(`types.${item.type}`)}</span>
                      <span className="text-xs text-base-content/60">
                        {formatDate(item.createdAt, locale, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                      <span className="text-xs text-base-content/60">
                        {formatNumber(item.id, locale)}
                      </span>
                    </div>

                    <p className="whitespace-pre-wrap text-sm text-base-content/90">
                      {item.message}
                    </p>

                    <dl className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-base-content/70">
                      <div className="flex gap-1">
                        <dt className="font-semibold">{t('fields.name')}:</dt>
                        <dd>{item.name ?? t('fields.anonymous')}</dd>
                      </div>
                      <div className="flex gap-1">
                        <dt className="font-semibold">{t('fields.email')}:</dt>
                        <dd>{item.email ?? t('fields.none')}</dd>
                      </div>
                      <div className="flex gap-1">
                        <dt className="font-semibold">{t('fields.page')}:</dt>
                        <dd>{item.page ?? t('fields.none')}</dd>
                      </div>
                      <div className="flex gap-1">
                        <dt className="font-semibold">{t('fields.locale')}:</dt>
                        <dd>{item.locale ?? t('fields.none')}</dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap justify-start gap-2">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={busyId === item.id || item.status === 'leido'}
                        onClick={() => handleStatusChange(item.id, 'leido')}
                      >
                        <Check aria-hidden="true" className="size-4" />
                        {t('actions.markRead')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={busyId === item.id || item.status === 'respondido'}
                        onClick={() => handleStatusChange(item.id, 'respondido')}
                      >
                        <CheckCheck aria-hidden="true" className="size-4" />
                        {t('actions.markReplied')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        disabled={busyId === item.id || item.status === 'archivado'}
                        onClick={() => handleStatusChange(item.id, 'archivado')}
                      >
                        <Archive aria-hidden="true" className="size-4" />
                        {t('actions.archive')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-error btn-outline btn-sm"
                        disabled={busyId === item.id}
                        onClick={() => setPendingDelete(item.id)}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                        {t('actions.delete')}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
                onClick={() => updateQuery({ page: data.page - 1 })}
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
                onClick={() => updateQuery({ page: data.page + 1 })}
              >
                {t('pagination.next')}
              </button>
            </nav>
          ) : null}
        </>
      ) : null}

      <dialog
        ref={dialogRef}
        className="modal"
        aria-labelledby="feedback-delete-title"
        aria-describedby="feedback-delete-description"
        onClose={() => setPendingDelete(null)}
      >
        <div className="modal-box">
          <h2 id="feedback-delete-title" className="tb-display text-2xl text-base-content">
            {t('delete.title')}
          </h2>
          <p id="feedback-delete-description" className="py-4 text-sm text-base-content/80">
            {t('delete.description')}
          </p>
          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={() => setPendingDelete(null)}>
              {t('delete.cancel')}
            </button>
            <button
              type="button"
              className="btn btn-error"
              disabled={busyId !== null}
              onClick={confirmDelete}
            >
              {t('delete.confirm')}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
