import { Compass } from 'lucide-react';

import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';

export default async function LocaleNotFound() {
  const t = await getTranslations('notFound');
  const tApp = await getTranslations('app');

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col items-center gap-5 px-4 py-20 text-center sm:px-6 lg:px-8">
      <span
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full border border-border bg-base-200 text-primary tb-glow"
      >
        <Compass className="size-8" />
      </span>
      <p className="tb-eyebrow">{tApp('name')}</p>
      <h1 className="tb-display tb-gradient-text text-4xl sm:text-5xl">{t('title')}</h1>
      <p className="max-w-md text-base text-base-content/70">{t('description')}</p>
      <Link href="/" className="btn btn-primary mt-2">
        {t('backHome')}
      </Link>
    </section>
  );
}
