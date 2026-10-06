'use client';

import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ONE_YEAR_MS, THEME_KEY, writeEntry } from '@tricking/shared';

type ThemeName = 'tricking-light' | 'tricking-dark';

const LIGHT_THEME: ThemeName = 'tricking-light';
const DARK_THEME: ThemeName = 'tricking-dark';

export function ThemeToggle() {
  const t = useTranslations('actions');
  const [theme, setTheme] = useState<ThemeName>(LIGHT_THEME);

  useEffect(() => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    setTheme(currentTheme === DARK_THEME ? DARK_THEME : LIGHT_THEME);
  }, []);

  const isDark = theme === DARK_THEME;

  const handleToggle = () => {
    const nextTheme = isDark ? LIGHT_THEME : DARK_THEME;
    document.documentElement.setAttribute('data-theme', nextTheme);
    writeEntry(THEME_KEY, nextTheme, ONE_YEAR_MS);
    setTheme(nextTheme);
  };

  return (
    <button
      type="button"
      aria-label={t('toggleTheme')}
      aria-pressed={isDark}
      onClick={handleToggle}
      className="btn btn-ghost btn-square btn-sm text-base-content/80 transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {isDark ? (
        <Sun aria-hidden="true" className="size-5" />
      ) : (
        <Moon aria-hidden="true" className="size-5" />
      )}
    </button>
  );
}
