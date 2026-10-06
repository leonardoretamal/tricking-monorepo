import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ExploreGraph } from '@/components/explore-graph';
import { parseGraphFilters } from '@/lib/graph-schemas';

// La pagina depende de los filtros de la URL y del grafo que arma el cliente; no se
// prerrenderiza en el build.
export const dynamic = 'force-dynamic';

type ExplorePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: ExplorePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explore' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ExplorePage({ params, searchParams }: ExplorePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('explore');
  const tApp = await getTranslations('app');
  const filters = parseGraphFilters(await searchParams);

  return (
    <section className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-3">
        <p className="tb-eyebrow">{tApp('name')}</p>
        <h1 className="tb-display tb-gradient-text text-4xl sm:text-5xl">{t('title')}</h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
      </header>
      <ExploreGraph initial={filters} />
    </section>
  );
}
