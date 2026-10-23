'use client';

import { useTranslations } from 'next-intl';

import { subcategoriesForSection, type Section } from '@/lib/sections';

interface TrickSubcategoryFilterProps {
  section: Section;
  value?: string;
  onChange: (value: string | undefined) => void;
}

// Subfiltro de la seccion activa (por ejemplo Pop, Cheat y Swing en vertical-kicks).
// El listado general no lo muestra: solo tiene sentido dentro de una seccion.
export function TrickSubcategoryFilter({ section, value, onChange }: TrickSubcategoryFilterProps) {
  const t = useTranslations('tricks');
  const options = subcategoriesForSection(section);

  if (options.length === 0) {
    return null;
  }

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-base-content/80">
      <span>{t('filters.subcategoryLabel')}</span>
      <select
        className="select select-bordered bg-base-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}
      >
        <option value="">{t('filters.allSubcategories')}</option>
        {options.map((slug) => (
          <option key={slug} value={slug}>
            {t(`subcategories.${slug}`)}
          </option>
        ))}
      </select>
    </label>
  );
}
