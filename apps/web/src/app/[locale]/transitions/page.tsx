import { getTranslations, setRequestLocale } from 'next-intl/server';

import { TransitionBrowser } from '@/components/transition-browser';
import { parseTransitionFilters } from '@/lib/transition-params';

// El listado se renderiza por peticion (filtros en la URL); no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

type TransitionsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: TransitionsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'transitions' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TransitionsPage({ params, searchParams }: TransitionsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('transitions');
  const tApp = await getTranslations('app');
  const filters = parseTransitionFilters(await searchParams);

  return (
    <section className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-3">
        <p className="tb-eyebrow">{tApp('name')}</p>
        <h1 className="tb-display tb-gradient-text text-4xl sm:text-5xl">{t('title')}</h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
      </header>
      <TransitionBrowser initial={filters} />
    </section>
  );
}
