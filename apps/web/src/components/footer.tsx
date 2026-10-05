import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatNumber } from '@tricking/shared';

export async function Footer() {
  const t = await getTranslations('footer');
  const tApp = await getTranslations('app');
  const tNav = await getTranslations('nav');
  const locale = await getLocale();
  const year = formatNumber(new Date().getFullYear(), locale, { useGrouping: false });

  const links = [
    { href: '/', label: tNav('home') },
    { href: '/tricks', label: tNav('tricks') },
    { href: '/variations', label: tNav('variations') },
    { href: '/transitions', label: tNav('transitions') },
    { href: '/stances', label: tNav('stances') },
    { href: '/tutorials', label: tNav('tutorials') },
    { href: '/tips', label: tNav('tips') },
    { href: '/explore', label: tNav('explore') },
    { href: '/feedback', label: tNav('feedback') },
  ];

  return (
    <footer className="border-t border-border bg-base-200 text-base-content">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-lg font-bold">{tApp('name')}</p>
          <p className="max-w-sm text-sm text-muted">{tApp('tagline')}</p>
        </div>
        <nav aria-label={t('navigation')}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
            {t('navigation')}
          </h2>
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-base-content/80 hover:text-primary">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted">
          <p>
            {year} {t('rights')}
          </p>
          <p>{t('disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
