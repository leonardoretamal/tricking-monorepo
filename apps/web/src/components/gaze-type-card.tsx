import { ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { gazeTypeColor, type GazeTipTypeItem } from '@/lib/gaze-schemas';

// Tarjeta de un tipo de truco en el listado de tips. Lleva al detalle con las fases.

export function GazeTypeCard({ type }: { type: GazeTipTypeItem }) {
  const t = useTranslations('tips');

  return (
    <Link
      href={`/tips/${type.trickType}`}
      className="group block h-full rounded-box border border-border bg-base-100 p-5 shadow-sm transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <article className="flex h-full flex-col gap-2">
        <h3 className={`text-lg font-semibold ${gazeTypeColor(type.trickType)}`}>{type.label}</h3>
        <p className="text-sm text-base-content/70">{t('tipCount', { count: type.tipCount })}</p>
        <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primary">
          {t('viewTips')}
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover:translate-x-0.5"
          />
        </span>
      </article>
    </Link>
  );
}
