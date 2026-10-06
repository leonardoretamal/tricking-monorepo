'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

type Crumb = {
  href: string;
  label: string;
  current: boolean;
};

export function Breadcrumbs() {
  const t = useTranslations('nav');
  const pathname = usePathname();

  const segments = pathname.split('/').filter((segment) => segment.length > 0);

  if (segments.length === 0) {
    return null;
  }

  const translateSegment = (segment: string): string | null => {
    switch (segment) {
      case 'tricks':
        return t('tricks');
      case 'vertical-kicks':
        return t('verticalKicks');
      case 'backward':
        return t('backward');
      case 'forward':
        return t('forward');
      case 'inside':
        return t('inside');
      case 'outside':
        return t('outside');
      case 'variations':
        return t('variations');
      case 'transitions':
        return t('transitions');
      case 'stances':
        return t('stances');
      case 'tutorials':
        return t('tutorials');
      case 'tips':
        return t('tips');
      case 'explore':
        return t('explore');
      case 'search':
        return t('search');
      case 'feedback':
        return t('feedback');
      case 'admin':
        return t('admin');
      default:
        return null;
    }
  };

  const crumbs: Crumb[] = [
    { href: '/', label: t('home'), current: false },
    ...segments.map((segment, index) => {
      const translated = translateSegment(segment);
      const path = `/${segments.slice(0, index + 1).join('/')}`;
      return {
        // `/admin` no tiene pagina propia; el panel vive en `/admin/feedback`.
        href: path === '/admin' ? '/admin/feedback' : path,
        label: translated ?? segment,
        current: index === segments.length - 1,
      };
    }),
  ];

  return (
    <nav
      aria-label={t('breadcrumbs')}
      className="mx-auto w-full max-w-6xl px-4 py-3 text-sm text-muted"
    >
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {crumbs.map((crumb, index) => (
          <li key={crumb.href} className="flex min-w-0 items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="text-base-content/40">
                /
              </span>
            ) : null}
            {crumb.current ? (
              <span
                aria-current="page"
                className="max-w-[16rem] truncate font-semibold text-base-content"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="max-w-[12rem] truncate rounded transition-colors hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
