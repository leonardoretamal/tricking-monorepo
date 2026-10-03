import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { TrickBrowser } from '@/components/trick-browser';
import { isSection } from '@/lib/sections';
import { parseTrickFilters } from '@/lib/trick-params';

// La seccion se renderiza por peticion (filtros en la URL); no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

type SectionPageProps = {
  params: Promise<{ locale: string; section: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: SectionPageProps) {
  const { locale, section } = await params;
  if (!isSection(section)) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: 'tricks' });
  return {
    title: t(`sections.${section}.title`),
    description: t(`sections.${section}.description`),
  };
}

export default async function SectionPage({ params, searchParams }: SectionPageProps) {
  const { locale, section } = await params;

  if (!isSection(section)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations('tricks');
  const filters = parseTrickFilters(await searchParams);

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {t(`sections.${section}.title`)}
        </h1>
        <p className="max-w-2xl text-base text-base-content/70">
          {t(`sections.${section}.description`)}
        </p>
      </header>
      <TrickBrowser section={section} initial={filters} />
    </section>
  );
}
