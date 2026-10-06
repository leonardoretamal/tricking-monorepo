'use client';

import { useEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent } from 'react';
import { ChevronDown, Eye, ListChecks, Menu, X, type LucideIcon } from 'lucide-react';
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

const FOCUS_RING =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';

const LINK_BASE = `relative inline-flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${FOCUS_RING}`;
const LINK_INACTIVE = 'text-base-content/75 hover:bg-base-200/70 hover:text-base-content';
const LINK_ACTIVE =
  "bg-primary/10 font-semibold text-primary after:absolute after:inset-x-2 after:bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:content-['']";

const MOBILE_LINK_BASE = `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${FOCUS_RING}`;
const MOBILE_LINK_INACTIVE = 'text-base-content/80 hover:bg-base-200/70 hover:text-base-content';
const MOBILE_LINK_ACTIVE = 'border-l-2 border-primary bg-primary/10 font-semibold text-primary';

const SUBLINK_CLASS = `block rounded-md px-3 py-2 text-sm text-base-content/75 transition-colors hover:bg-base-300/60 hover:text-primary ${FOCUS_RING}`;

const ICON_BUTTON = `btn btn-ghost btn-square btn-sm text-base-content/80 transition-colors hover:text-primary ${FOCUS_RING}`;

const BRAND_CLASS = `tb-display rounded text-lg leading-none text-base-content transition-colors hover:text-primary ${FOCUS_RING}`;

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
  const [scrolled, setScrolled] = useState(false);
  const [motionOk, setMotionOk] = useState(true);
  const submenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setMotionOk(!media.matches);

    const handleScroll = () => setScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    { href: '/progress', label: t('progress'), icon: ListChecks },
  ];

  const linkClass = (href: string) =>
    `${LINK_BASE} ${isPathActive(pathname, href) ? LINK_ACTIVE : LINK_INACTIVE}`;

  const mobileLinkClass = (href: string) =>
    `${MOBILE_LINK_BASE} ${isPathActive(pathname, href) ? MOBILE_LINK_ACTIVE : MOBILE_LINK_INACTIVE}`;

  const handleTricksKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === 'Escape' && tricksOpen) {
      setTricksOpen(false);
      submenuButtonRef.current?.focus();
    }
  };

  const handleTricksBlur = (event: FocusEvent<HTMLLIElement>) => {
    const next = event.relatedTarget;
    if (!(next instanceof Node) || !event.currentTarget.contains(next)) {
      setTricksOpen(false);
    }
  };

  const headerClass = [
    'sticky top-0 z-40 border-b',
    scrolled
      ? 'border-border bg-base-100/80 shadow-sm backdrop-blur-md'
      : 'border-transparent bg-transparent',
    motionOk ? 'transition-colors duration-300' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <header className={headerClass}>
      <nav
        aria-label={t('primary')}
        className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-3 sm:px-4"
      >
        <div className="flex min-w-fit items-center">
          <Link href="/" className={BRAND_CLASS}>
            {tApp('name')}
          </Link>
        </div>

        <div className="hidden xl:flex">
          <ul className="flex items-center gap-1">
            {links.map((item) => {
              const submenu = item.submenu;
              const Icon = item.icon;
              const active = isPathActive(pathname, item.href);
              if (submenu) {
                return (
                  <li
                    key={item.href}
                    className="relative"
                    onKeyDown={handleTricksKeyDown}
                    onBlur={handleTricksBlur}
                  >
                    <button
                      ref={submenuButtonRef}
                      type="button"
                      className={linkClass(item.href)}
                      aria-current={active ? 'page' : undefined}
                      aria-expanded={tricksOpen}
                      aria-controls="nav-tricks-submenu"
                      aria-haspopup="true"
                      onClick={() => setTricksOpen((value) => !value)}
                    >
                      {item.label}
                      <ChevronDown
                        aria-hidden="true"
                        className={`size-4 transition-transform ${tricksOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <ul
                      id="nav-tricks-submenu"
                      className={`tb-surface absolute left-0 top-full z-50 mt-3 w-56 space-y-0.5 p-1.5 shadow-xl ${
                        tricksOpen ? 'block' : 'hidden'
                      }`}
                    >
                      {submenu.map((subItem) => (
                        <li key={subItem.href}>
                          <Link
                            href={subItem.href}
                            aria-current={isPathActive(pathname, subItem.href) ? 'page' : undefined}
                            className={SUBLINK_CLASS}
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
                    aria-current={active ? 'page' : undefined}
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

        <div className="flex items-center gap-1">
          <NavSearch />
          <ThemeToggle />
          <LocaleSwitcher />
          <button
            type="button"
            className={`${ICON_BUTTON} xl:hidden`}
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

      <nav
        id="mobile-navigation"
        aria-label={t('mobile')}
        className={`max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-border bg-base-100/95 backdrop-blur-md xl:hidden ${
          mobileOpen ? 'block' : 'hidden'
        }`}
      >
        <ul className="flex w-full flex-col gap-1 px-2 py-2">
          {links.map((item) => {
            const submenu = item.submenu;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isPathActive(pathname, item.href) ? 'page' : undefined}
                  className={mobileLinkClass(item.href)}
                  onClick={() => setMobileOpen(false)}
                >
                  {Icon ? <Icon aria-hidden="true" className="size-4" /> : null}
                  {item.label}
                </Link>
                {submenu ? (
                  <ul className="mt-1 flex flex-col gap-0.5 pl-4">
                    {submenu.map((subItem) => (
                      <li key={subItem.href}>
                        <Link
                          href={subItem.href}
                          aria-current={isPathActive(pathname, subItem.href) ? 'page' : undefined}
                          className="flex items-center rounded-md px-3 py-1.5 text-sm text-base-content/70 transition-colors hover:bg-base-200/70 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
      </nav>
    </header>
  );
}
