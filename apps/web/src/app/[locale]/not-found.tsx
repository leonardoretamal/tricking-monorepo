import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function LocaleNotFound() {
  const t = await getTranslations('notFound');

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 px-4 py-16 sm:px-6 lg:px-8">
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
