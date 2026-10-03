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
      case 'tips':
        return t('tips');
      case 'explore':
        return t('explore');
      case 'search':
        return t('search');
      default:
        return null;
    }
  };

  const crumbs: Crumb[] = [
    { href: '/', label: t('home'), current: false },
    ...segments.map((segment, index) => {
      const translated = translateSegment(segment);
      return {
        href: `/${segments.slice(0, index + 1).join('/')}`,
        label: translated ?? segment,
        current: index === segments.length - 1,
      };
    }),
  ];

  return (
    <nav className="breadcrumbs mx-auto w-full max-w-6xl px-4 py-2 text-sm text-muted">
      <ul>
        {crumbs.map((crumb) => (
          <li key={crumb.href}>
            {crumb.current ? (
              <span aria-current="page" className="font-semibold text-base-content">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="hover:text-primary">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
