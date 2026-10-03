'use client';

import type { ChangeEvent } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LOCALES = routing.locales;

export function LocaleSwitcher() {
  const t = useTranslations('actions');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextLocale = event.target.value === 'en' ? 'en' : 'es';
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <select
      value={locale}
      onChange={handleChange}
      aria-label={t('switchLanguage')}
      className="select select-bordered select-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {LOCALES.map((code) => (
        <option key={code} value={code}>
          {code.toUpperCase()}
        </option>
      ))}
    </select>
  );
}
