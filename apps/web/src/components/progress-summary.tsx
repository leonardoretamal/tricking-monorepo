'use client';

import { formatNumber } from '@tricking/shared';
import { Bookmark, Check, TrendingUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useProgressStore } from '@/lib/progress-store';
import type { ProgressTricks, TrickProgressStatus } from '@/lib/progress-schemas';

export interface ProgressSectionSummary {
  id: string;
  label: string;
  trickIds: string[];
}

export interface ProgressSummaryProps {
  total: number;
  sections?: ProgressSectionSummary[];
}

interface ProgressBarProps {
  value: number;
  max: number;
  label: string;
  percent: number;
}

function ProgressBar({ value, max, label, percent }: ProgressBarProps) {
  const safeMax = max > 0 ? max : 1;
  const safeValue = Math.min(Math.max(value, 0), safeMax);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium text-base-content">{label}</span>
        <span className="text-base-content/70">{percent}%</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={safeValue}
        aria-valuetext={`${percent}%`}
        className="h-2 w-full overflow-hidden rounded-full bg-base-300"
      >
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function countStatus(tricks: ProgressTricks, status: TrickProgressStatus): number {
  let total = 0;
  for (const value of Object.values(tricks)) {
    if (value === status) {
      total += 1;
    }
  }
  return total;
}

export function ProgressSummary({ total, sections = [] }: ProgressSummaryProps) {
  const t = useTranslations('progress');
  const locale = useLocale();
  const tricks = useProgressStore((state) => state.tricks);
  const hydrate = useProgressStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const learnedSet = new Set<string>();
  for (const [id, status] of Object.entries(tricks)) {
    if (status === 'learned') {
      learnedSet.add(id);
    }
  }

  const learned = learnedSet.size;
  const clampedLearned = total > 0 ? Math.min(learned, total) : learned;
  const globalPercent = total > 0 ? Math.round((clampedLearned / total) * 100) : 0;
  const inProgress = countStatus(tricks, 'in_progress');
  const want = countStatus(tricks, 'want');

  return (
    <section className="card border border-border bg-base-200/60">
      <div className="card-body gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold text-base-content">{t('summary.title')}</h2>
          <span className="text-sm text-base-content/80" aria-live="polite">
            {t('summary.counter', {
              learned: formatNumber(clampedLearned, locale),
              total: formatNumber(total, locale),
            })}
          </span>
        </div>

        <ProgressBar
          value={clampedLearned}
          max={total}
          label={t('summary.globalLabel')}
          percent={globalPercent}
        />

        <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-base-content/80">
          <div className="flex items-center gap-1">
            <dt className="flex items-center gap-1">
              <Check aria-hidden="true" className="size-4 text-success" />
              <span>{t('summary.learnedLabel')}</span>
            </dt>
            <dd className="font-medium text-base-content">
              {t('summary.count', { count: formatNumber(learned, locale) })}
            </dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="flex items-center gap-1">
              <TrendingUp aria-hidden="true" className="size-4 text-warning" />
              <span>{t('summary.inProgressLabel')}</span>
            </dt>
            <dd className="font-medium text-base-content">
              {t('summary.count', { count: formatNumber(inProgress, locale) })}
            </dd>
          </div>
          <div className="flex items-center gap-1">
            <dt className="flex items-center gap-1">
              <Bookmark aria-hidden="true" className="size-4 text-info" />
              <span>{t('summary.wantLabel')}</span>
            </dt>
            <dd className="font-medium text-base-content">
              {t('summary.count', { count: formatNumber(want, locale) })}
            </dd>
          </div>
        </dl>

        {learned === 0 ? (
          <p className="text-sm text-base-content/70">{t('summary.empty')}</p>
        ) : null}

        {sections.length > 0 ? (
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-base-content/60">
              {t('summary.sectionsTitle')}
            </h3>
            {sections.map((section) => {
              const sectionTotal = section.trickIds.length;
              const sectionLearned = section.trickIds.reduce(
                (acc, id) => acc + (learnedSet.has(id) ? 1 : 0),
                0,
              );
              const percent =
                sectionTotal > 0 ? Math.round((sectionLearned / sectionTotal) * 100) : 0;
              return (
                <ProgressBar
                  key={section.id}
                  value={sectionLearned}
                  max={sectionTotal}
                  label={section.label}
                  percent={percent}
                />
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
}
