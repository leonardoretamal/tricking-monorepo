import { getTranslations, setRequestLocale } from 'next-intl/server';

import { TrickBrowser } from '@/components/trick-browser';
import { parseTrickFilters } from '@/lib/trick-params';

// Lista comun de todos los trucos (sin secciones). Filtros y seccion viven en la URL;
// la pagina se renderiza por peticion.
export const dynamic = 'force-dynamic';

type TricksIndexProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: TricksIndexProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tricks' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TricksIndex({ params, searchParams }: TricksIndexProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('tricks');
  const filters = parseTrickFilters(await searchParams);

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
      </header>
      <TrickBrowser initial={filters} />
    </section>
  );
}
