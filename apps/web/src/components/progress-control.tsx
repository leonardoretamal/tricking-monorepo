'use client';

import { Bookmark, Check, TrendingUp, X, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';

import { useProgressStore } from '@/lib/progress-store';
import { TRICK_PROGRESS_STATUSES, type TrickProgressStatus } from '@/lib/progress-schemas';

// Control para marcar el progreso de un truco (Fase 21). Los tres estados se
// persisten en el store de Zustand (localStorage via el wrapper compartido). El
// color vive en las variables del tema y nunca es el unico indicador: se suma
// `aria-pressed`, el icono y el relleno del boton activo.

interface StatusMeta {
  icon: LucideIcon;
  // Color del icono y borde/relleno del estado activo (tokens del tema).
  textClass: string;
  activeClass: string;
}

const STATUS_META: Record<TrickProgressStatus, StatusMeta> = {
  learned: { icon: Check, textClass: 'text-success', activeClass: 'border-success bg-success/15' },
  in_progress: {
    icon: TrendingUp,
    textClass: 'text-warning',
    activeClass: 'border-warning bg-warning/15',
  },
  want: { icon: Bookmark, textClass: 'text-info', activeClass: 'border-info bg-info/15' },
};

const STATUS_LABEL_KEY: Record<TrickProgressStatus, string> = {
  learned: 'learned',
  in_progress: 'inProgress',
  want: 'want',
};

const FOCUS_CLASS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export interface ProgressControlProps {
  trickId: string;
  compact?: boolean;
}

export function ProgressControl({ trickId, compact = false }: ProgressControlProps) {
  const t = useTranslations('progress');
  const current = useProgressStore((state) => state.tricks[trickId] ?? null);
  const setStatus = useProgressStore((state) => state.setStatus);
  const hydrate = useProgressStore((state) => state.hydrate);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const currentMeta = current !== null ? STATUS_META[current] : null;
  const CurrentIcon = currentMeta?.icon ?? null;

  return (
    <div
      role="group"
      aria-label={t('control.groupLabel')}
      className="flex flex-wrap items-center gap-2"
    >
      {current !== null && currentMeta !== null && CurrentIcon !== null && !compact ? (
        <span className={`badge gap-1 border text-base-content ${currentMeta.activeClass}`}>
          <CurrentIcon aria-hidden="true" className={`size-3 ${currentMeta.textClass}`} />
          {t(`statuses.${STATUS_LABEL_KEY[current]}`)}
        </span>
      ) : null}

      {TRICK_PROGRESS_STATUSES.map((status) => {
        const meta = STATUS_META[status];
        const Icon = meta.icon;
        const active = current === status;
        const label = t(`control.${STATUS_LABEL_KEY[status]}`);
        const classes = [
          'btn text-base-content',
          compact ? 'btn-xs btn-square' : 'btn-sm',
          active ? `border ${meta.activeClass}` : 'btn-outline text-base-content/80',
          FOCUS_CLASS,
        ].join(' ');

        return (
          <button
            key={status}
            type="button"
            className={classes}
            aria-pressed={active}
            aria-label={compact ? label : undefined}
            title={compact ? label : undefined}
            onClick={() => setStatus(trickId, status)}
          >
            <Icon
              aria-hidden="true"
              className={`size-4 ${active ? meta.textClass : 'text-base-content/60'}`}
            />
            {compact ? null : <span>{label}</span>}
          </button>
        );
      })}

      {current !== null ? (
        <button
          type="button"
          className={[
            'btn btn-outline text-base-content/80',
            compact ? 'btn-xs btn-square' : 'btn-sm',
            FOCUS_CLASS,
          ].join(' ')}
          aria-label={t('control.clear')}
          title={t('control.clear')}
          onClick={() => setStatus(trickId, null)}
        >
          <X aria-hidden="true" className="size-4" />
          {compact ? null : <span>{t('control.clear')}</span>}
        </button>
      ) : null}
    </div>
  );
}
