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

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 py-16 sm:px-6 lg:px-8">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-8 text-base-content/60"
      >
        <path d="M12 20h.01" />
        <path d="M2 8.82a15 15 0 0 1 4.17-2.65" />
        <path d="M5 12.86a10 10 0 0 1 5.17-2.69" />
        <path d="M8.5 16.43a5 5 0 0 1 7 0" />
        <path d="M19 12.86a10 10 0 0 0-2.01-1.52" />
        <path d="M22 8.82a15 15 0 0 0-11.29-3.76" />
        <path d="m2 2 20 20" />
      </svg>
      <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
        {t('title')}
      </h1>
      <p className="text-base text-base-content/70">{t('description')}</p>
      <Link
        href="/"
        className="rounded-field bg-primary px-4 py-2 font-medium text-primary-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {t('backHome')}
      </Link>
    </section>
  );
}
