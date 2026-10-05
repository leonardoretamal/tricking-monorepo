import { getTranslations, setRequestLocale } from 'next-intl/server';

import { FeedbackForm } from '@/components/feedback-form';

export const dynamic = 'force-dynamic';

type FeedbackPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: FeedbackPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'feedback' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('feedback');

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
      </header>
      <FeedbackForm />
    </section>
  );
}
