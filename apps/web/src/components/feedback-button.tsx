'use client';

import { MessageSquarePlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Link, usePathname } from '@/i18n/navigation';

// Acceso flotante y visible al formulario de feedback desde cualquier pagina. Se oculta
// en el propio formulario y en el panel de administracion para no duplicar la accion.
export function FeedbackButton() {
  const t = useTranslations('feedback');
  const pathname = usePathname();

  if (
    pathname === '/feedback' ||
    pathname.startsWith('/feedback/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  ) {
    return null;
  }

  return (
    <Link
      href="/feedback"
      aria-label={t('fabLabel')}
      className="btn btn-primary btn-sm fixed bottom-5 right-5 z-40 gap-2 shadow-lg"
    >
      <MessageSquarePlus aria-hidden="true" className="size-4" />
      <span className="hidden sm:inline">{t('fabLabel')}</span>
    </Link>
  );
}
