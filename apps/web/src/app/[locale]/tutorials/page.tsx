import { getTranslations, setRequestLocale } from 'next-intl/server';

import { TutorialBrowser } from '@/components/tutorial-browser';
import { parseTutorialFilters } from '@/lib/tutorial-schemas';

// La pagina depende de los filtros en la URL; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

type TutorialsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: TutorialsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tutorials' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TutorialsPage({ params, searchParams }: TutorialsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('tutorials');
  const filters = parseTutorialFilters(await searchParams);

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
        <p className="max-w-2xl text-sm text-base-content/60">{t('contentNote')}</p>
      </header>
      <TutorialBrowser initial={filters} />
    </section>
  );
}
