import { WifiOff } from 'lucide-react';

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { Link } from '@/i18n/navigation';

type OfflinePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: OfflinePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'offline' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

// Pagina de respaldo del service worker cuando no hay red. Es util para el usuario y
// no se enlaza desde la navegacion principal.
export default async function OfflinePage({ params }: OfflinePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('offline');
  const tApp = await getTranslations('app');

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 py-20 text-center sm:px-6 lg:px-8">
      <span
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full border border-border bg-base-200 text-secondary tb-glow"
      >
        <WifiOff className="size-8" />
      </span>
      <p className="tb-eyebrow">{tApp('name')}</p>
      <h1 className="tb-display text-4xl text-base-content sm:text-5xl">{t('title')}</h1>
      <p className="max-w-md text-base text-base-content/70">{t('description')}</p>
      <Link href="/" className="btn btn-primary mt-2">
        {t('backHome')}
      </Link>
    </section>
  );
}
