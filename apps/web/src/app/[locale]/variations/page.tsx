import { getTranslations, setRequestLocale } from 'next-intl/server';

import { VariationBrowser } from '@/components/variation-browser';
import { parseVariationFilters } from '@/lib/variation-params';

// La pagina depende de los filtros en la URL; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

type VariationsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: VariationsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'variations' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function VariationsPage({ params, searchParams }: VariationsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('variations');
  const tApp = await getTranslations('app');
  const filters = parseVariationFilters(await searchParams);

  return (
    <section className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-3">
        <p className="tb-eyebrow">{tApp('name')}</p>
        <h1 className="tb-display tb-gradient-text text-4xl sm:text-5xl">{t('title')}</h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
      </header>
      <VariationBrowser initial={filters} />
    </section>
  );
}
