import { TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';

import type { GazeTipItem } from '@/lib/gaze-schemas';

// Tarjeta de un tip de mirada: instruccion y, si existe, advertencia destacada con el
// color de enfasis. El label distingue el subcaso dentro de un tipo (Fase 16.16).

export function GazeTipCard({ tip }: { tip: GazeTipItem }) {
  const t = useTranslations('tips');

  return (
    <article className="flex h-full flex-col gap-2 rounded-box border border-border bg-base-100 p-4">
      {tip.label ? <span className="badge badge-outline w-fit text-xs">{tip.label}</span> : null}
      <p className="text-sm text-base-content/90">{tip.instruction}</p>
      {tip.warning ? (
        <p className="mt-auto flex items-start gap-2 rounded-md bg-warning/10 p-2 text-sm text-warning">
          <TriangleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <span>
            <span className="sr-only">{t('warningLabel')}: </span>
            {tip.warning}
          </span>
        </p>
      ) : null}
    </article>
  );
}
