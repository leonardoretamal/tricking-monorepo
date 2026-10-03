import { EmptyState } from '@tricking/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';

type TipsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TipsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tips' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TipsPage({ params }: TipsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('tips');
  const tStates = await getTranslations('states');

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
      </header>
      <EmptyState title={tStates('emptyTitle')} description={tStates('emptyDescription')} />
    </section>
  );
}
