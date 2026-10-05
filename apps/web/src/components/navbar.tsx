'use client';

import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { ChevronDown, Eye, Menu, X, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { NavSearch } from '@/components/nav-search';
import { ThemeToggle } from '@/components/theme-toggle';

type NavSubItem = {
  href: string;
  label: string;
};

type NavItem = {
  href: string;
  label: string;
  icon?: LucideIcon;
  submenu?: NavSubItem[];
};

const LINK_BASE =
  'inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const LINK_INACTIVE = 'text-base-content/70 hover:bg-base-200 hover:text-primary';
const LINK_ACTIVE = 'border-b-2 border-primary bg-primary/10 font-semibold text-primary';

function isPathActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const t = useTranslations('nav');
  const tApp = useTranslations('app');
  const tActions = useTranslations('actions');
  const pathname = usePathname();
  const [tricksOpen, setTricksOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const links: NavItem[] = [
    { href: '/', label: t('home') },
    {
      href: '/tricks',
      label: t('tricks'),
      submenu: [
        { href: '/tricks/vertical-kicks', label: t('verticalKicks') },
        { href: '/tricks/backward', label: t('backward') },
        { href: '/tricks/forward', label: t('forward') },
        { href: '/tricks/inside', label: t('inside') },
        { href: '/tricks/outside', label: t('outside') },
      ],
    },
    { href: '/variations', label: t('variations') },
    { href: '/transitions', label: t('transitions') },
    { href: '/stances', label: t('stances') },
    { href: '/tutorials', label: t('tutorials') },
    { href: '/tips', label: t('tips'), icon: Eye },
    { href: '/explore', label: t('explore') },
  ];

  const linkClass = (href: string) =>
    `${LINK_BASE} ${isPathActive(pathname, href) ? LINK_ACTIVE : LINK_INACTIVE}`;

  const handleTricksKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === 'Escape') {
      setTricksOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-base-100/95 backdrop-blur">
      <nav className="navbar mx-auto w-full max-w-6xl gap-2 px-2">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost px-2 text-lg font-bold text-base-content">
            {tApp('name')}
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <ul className="flex items-center gap-1">
            {links.map((item) => {
              const submenu = item.submenu;
              const Icon = item.icon;
              if (submenu) {
                return (
                  <li key={item.href} className="relative" onKeyDown={handleTricksKeyDown}>
                    <button
                      type="button"
                      className={linkClass(item.href)}
                      aria-current={isPathActive(pathname, item.href) ? 'page' : undefined}
                      aria-expanded={tricksOpen}
                      aria-controls="nav-tricks-submenu"
                      aria-haspopup="true"
                      onClick={() => setTricksOpen((value) => !value)}
                    >
                      {item.label}
                      <ChevronDown aria-hidden="true" className="size-4" />
                    </button>
                    <ul
                      id="nav-tricks-submenu"
                      className={`absolute left-0 top-full z-50 mt-2 w-52 rounded-md border border-border bg-base-100 p-1 shadow-lg ${
                        tricksOpen ? 'block' : 'hidden'
                      }`}
                    >
                      {submenu.map((subItem) => (
                        <li key={subItem.label}>
                          <Link
                            href={subItem.href}
                            className="block rounded-md px-3 py-2 text-sm text-base-content/80 hover:bg-base-200 hover:text-primary"
                            onClick={() => setTricksOpen(false)}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              }
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isPathActive(pathname, item.href) ? 'page' : undefined}
                    className={linkClass(item.href)}
                  >
                    {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="navbar-end gap-1">
          <NavSearch />
          <ThemeToggle />
          <LocaleSwitcher />
          <button
            type="button"
            className="btn btn-ghost btn-square btn-sm lg:hidden"
            aria-label={mobileOpen ? tActions('closeMenu') : tActions('openMenu')}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMobileOpen((value) => !value)}
          >
            {mobileOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </nav>

      <div
        id="mobile-navigation"
        className={`border-t border-border bg-base-100 lg:hidden ${
          mobileOpen ? 'block' : 'hidden'
        }`}
      >
        <ul className="menu w-full gap-1 px-2 py-2">
          {links.map((item) => {
            const submenu = item.submenu;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isPathActive(pathname, item.href) ? 'page' : undefined}
                  className={linkClass(item.href)}
                  onClick={() => setMobileOpen(false)}
                >
                  {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
                  {item.label}
                </Link>
                {submenu ? (
                  <ul className="gap-1">
                    {submenu.map((subItem) => (
                      <li key={subItem.label}>
                        <Link
                          href={subItem.href}
                          className="text-sm text-base-content/80"
                          onClick={() => setMobileOpen(false)}
                        >
                          {subItem.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}
