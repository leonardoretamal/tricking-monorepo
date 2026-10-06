import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { formatNumber } from '@tricking/shared';

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const GROUP_TITLE_CLASS = 'tb-eyebrow mb-3';

const LINK_CLASS = `inline-flex min-h-9 items-center rounded text-sm text-base-content/75 transition-colors hover:text-primary ${FOCUS_RING}`;

const BRAND_CLASS = `tb-display inline-flex items-center rounded text-xl text-base-content transition-colors hover:text-primary ${FOCUS_RING}`;

const BOTTOM_LINK_CLASS = `rounded text-xs text-muted transition-colors hover:text-primary ${FOCUS_RING}`;

export async function Footer() {
  const t = await getTranslations('footer');
  const tApp = await getTranslations('app');
  const tNav = await getTranslations('nav');
  const locale = await getLocale();
  const year = formatNumber(new Date().getFullYear(), locale, { useGrouping: false });

  const groups = [
    {
      id: 'catalog',
      label: t('groups.catalog'),
      links: [
        { href: '/tricks', label: tNav('tricks') },
        { href: '/variations', label: tNav('variations') },
        { href: '/transitions', label: tNav('transitions') },
        { href: '/stances', label: tNav('stances') },
      ],
    },
    {
      id: 'learn',
      label: t('groups.learn'),
      links: [
        { href: '/tutorials', label: tNav('tutorials') },
        { href: '/tips', label: tNav('tips') },
        { href: '/explore', label: tNav('explore') },
        { href: '/search', label: tNav('search') },
      ],
    },
    {
      id: 'site',
      label: t('groups.site'),
      links: [
        { href: '/feedback', label: tNav('feedback') },
        { href: '/legal', label: t('legal') },
        { href: '/privacidad', label: t('privacy') },
      ],
    },
  ];

  return (
    <footer className="border-t border-border bg-base-200/70 text-base-content">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] lg:gap-8">
          <div className="space-y-3 sm:col-span-2 lg:col-span-1">
            <span aria-hidden="true" className="block h-1 w-12 rounded-full bg-primary" />
            <Link href="/" className={BRAND_CLASS}>
              {tApp('name')}
            </Link>
            <p className="max-w-sm text-sm text-muted">{tApp('tagline')}</p>
          </div>
          {groups.map((group) => (
            <nav key={group.id} aria-label={group.label}>
              <h2 className={GROUP_TITLE_CLASS}>{group.label}</h2>
              <ul className="space-y-0.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={LINK_CLASS}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 text-xs text-muted">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <p>
              {year} {t('rights')}
            </p>
            <Link href="/feedback" className={BOTTOM_LINK_CLASS}>
              {t('contact')}
            </Link>
          </div>
          <p className="max-w-4xl leading-relaxed">{t('disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
