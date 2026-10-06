'use client';

import { useTranslations } from 'next-intl';

import {
  GRAPH_CATEGORIES,
  GRAPH_STANCES,
  isGraphCategory,
  isGraphStance,
  type GraphFilters,
} from '@/lib/graph-schemas';
import { SECTIONS, isSection } from '@/lib/sections';

interface ExploreFiltersProps {
  filters: GraphFilters;
  onChange: (patch: Partial<GraphFilters>) => void;
  onClear: () => void;
  hasActiveFilters: boolean;
}

// Filtros del grafo. El estado vive en la URL (query params); cada cambio se aplica al
// instante y el grafo se vuelve a consultar con los filtros resueltos en el backend.
export function ExploreFilters({
  filters,
  onChange,
  onClear,
  hasActiveFilters,
}: ExploreFiltersProps) {
  const t = useTranslations('explore');
  const tTricks = useTranslations('tricks');

  return (
    <div className="tb-surface flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <label className="flex flex-col gap-1 text-sm font-medium">
        <span>{t('filters.sectionLabel')}</span>
        <select
          className="select select-bordered"
          value={filters.section ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            onChange({ section: value !== '' && isSection(value) ? value : undefined });
          }}
        >
          <option value="">{t('filters.allSections')}</option>
          {SECTIONS.map((section) => (
            <option key={section} value={section}>
              {tTricks(`sections.${section}.title`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        <span>{t('filters.categoryLabel')}</span>
        <select
          className="select select-bordered"
          value={filters.category ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            onChange({ category: value !== '' && isGraphCategory(value) ? value : undefined });
          }}
        >
          <option value="">{t('filters.allCategories')}</option>
          {GRAPH_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {tTricks(`categories.${category}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        <span>{t('filters.difficultyLabel')}</span>
        <select
          className="select select-bordered"
          value={filters.difficulty ?? ''}
          onChange={(event) =>
            onChange({
              difficulty: event.target.value === '' ? undefined : Number(event.target.value),
            })
          }
        >
          <option value="">{t('filters.allDifficulties')}</option>
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <option key={level} value={level}>
              {tTricks(`difficulty.${level}`)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        <span>{t('filters.stanceLabel')}</span>
        <select
          className="select select-bordered"
          value={filters.stance ?? ''}
          onChange={(event) => {
            const value = event.target.value;
            onChange({ stance: value !== '' && isGraphStance(value) ? value : undefined });
          }}
        >
          <option value="">{t('filters.allStances')}</option>
          {GRAPH_STANCES.map((stance) => (
            <option key={stance} value={stance}>
              {t(`stances.${stance}`)}
            </option>
          ))}
        </select>
      </label>

      {hasActiveFilters ? (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
          {t('filters.clear')}
        </button>
      ) : null}
    </div>
  );
}
