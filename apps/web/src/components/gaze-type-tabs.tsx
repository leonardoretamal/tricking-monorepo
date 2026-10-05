import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { gazeTypeColor, type GazeTipTypeItem } from '@/lib/gaze-schemas';

// Navegacion entre tipos de truco (Fase 16.10). Son enlaces (no tabs de panel), por eso
// el estado activo se marca con aria-current="page" y no con aria-selected. Operables
// por teclado por ser enlaces nativos y con foco visible.

interface GazeTypeTabsProps {
  types: GazeTipTypeItem[];
  activeType?: string;
}

const PILL_BASE =
  'inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

export function GazeTypeTabs({ types, activeType }: GazeTypeTabsProps) {
  const t = useTranslations('tips');
  const allActive = activeType === undefined;

  return (
    <nav aria-label={t('typesLabel')}>
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href="/tips"
            aria-current={allActive ? 'page' : undefined}
            className={`${PILL_BASE} ${
              allActive
                ? 'border-primary bg-primary/10 font-semibold text-primary'
                : 'border-border text-base-content/70 hover:text-base-content'
            }`}
          >
            {t('allTypes')}
          </Link>
        </li>
        {types.map((type) => {
          const active = type.trickType === activeType;
          return (
            <li key={type.trickType}>
              <Link
                href={`/tips/${type.trickType}`}
                aria-current={active ? 'page' : undefined}
                className={`${PILL_BASE} tb-badge ${gazeTypeColor(type.trickType)} ${
                  active ? 'font-semibold' : 'opacity-80 hover:opacity-100'
                }`}
              >
                {type.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
