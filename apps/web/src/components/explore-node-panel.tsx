'use client';

import { categoryBadgeColor, categoryColorClass } from '@tricking/ui';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { Link } from '@/i18n/navigation';
import type { GraphNodeItem } from '@/lib/graph-schemas';

interface ExploreNodePanelProps {
  node: GraphNodeItem | null;
  onClose: () => void;
}

function difficultyClass(level: number): string {
  const clamped = Math.min(5, Math.max(0, Math.round(level)));
  return `tb-difficulty-${clamped}`;
}

// Panel lateral con el resumen del nodo seleccionado. Se abre sin cambiar de ruta; el
// enlace al detalle es explicito y el cierre se hace con el boton o con Escape.
export function ExploreNodePanel({ node, onClose }: ExploreNodePanelProps) {
  const t = useTranslations('explore');
  const tTricks = useTranslations('tricks');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (node !== null) {
      closeRef.current?.focus();
    }
  }, [node]);

  if (node === null) {
    return null;
  }

  // Solo se muestran las categorias con color y etiqueta propia; las direccionales y de
  // conteo ya las representa la seccion o no aportan como badge (misma regla que el
  // detalle de truco).
  const badgeCategories = node.categories.filter((slug) => categoryBadgeColor(slug) !== null);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="explore-node-panel-title"
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 max-h-[60%] overflow-auto rounded-t-box border border-border bg-base-200 p-4 shadow-lg sm:inset-x-auto sm:inset-y-0 sm:right-0 sm:max-h-none sm:w-80 sm:rounded-none sm:rounded-l-box"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 id="explore-node-panel-title" className="text-lg font-semibold text-base-content">
          {node.name}
        </h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t('panel.close')}
          className="btn btn-ghost btn-xs"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      </div>

      <dl className="mt-4 flex flex-col gap-4 text-sm">
        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
            {t('panel.section')}
          </dt>
          <dd className="text-base-content">
            {node.section !== null
              ? tTricks(`sections.${node.section}.title`)
              : t('panel.unknownSection')}
          </dd>
        </div>

        {node.difficulty !== null ? (
          <div className="flex flex-col gap-1">
            <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
              {t('panel.difficulty')}
            </dt>
            <dd>
              <span
                className={`tb-badge inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${difficultyClass(node.difficulty)}`}
              >
                {tTricks(`difficulty.${Math.min(5, Math.max(0, Math.round(node.difficulty)))}`)}
              </span>
            </dd>
          </div>
        ) : null}

        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
            {t('panel.categories')}
          </dt>
          <dd className="flex flex-wrap gap-1">
            {badgeCategories.length === 0 ? (
              <span className="text-base-content/70">{t('panel.noCategories')}</span>
            ) : (
              badgeCategories.map((slug) => {
                const color = categoryBadgeColor(slug);
                return (
                  <span
                    key={slug}
                    className={`tb-badge inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${color ? categoryColorClass(color) : ''}`}
                  >
                    {tTricks(`categories.${slug}`)}
                  </span>
                );
              })
            )}
          </dd>
        </div>

        <div className="flex flex-col gap-1">
          <dt className="text-xs font-semibold uppercase tracking-wide text-base-content/60">
            {t('panel.stances')}
          </dt>
          <dd className="flex flex-wrap gap-1">
            {node.stances.length === 0 ? (
              <span className="text-base-content/70">{t('panel.noStances')}</span>
            ) : (
              node.stances.map((slug) => (
                <span
                  key={slug}
                  className="tb-badge inline-flex rounded-full border px-2 py-0.5 text-xs font-medium"
                >
                  {t(`stances.${slug}`)}
                </span>
              ))
            )}
          </dd>
        </div>
      </dl>

      {node.section !== null ? (
        <Link href={`/tricks/${node.section}/${node.id}`} className="btn btn-primary btn-sm mt-5">
          {t('panel.openDetail')}
        </Link>
      ) : null}
    </aside>
  );
}
