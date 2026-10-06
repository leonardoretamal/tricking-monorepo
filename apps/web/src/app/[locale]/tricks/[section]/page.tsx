import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';

import { TrickBrowser } from '@/components/trick-browser';
import { isSection, type Section } from '@/lib/sections';
import { parseTrickFilters } from '@/lib/trick-params';

// La seccion se renderiza por peticion (filtros en la URL); no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

// Imagen decorativa de cabecera por seccion. Son fotos libres de apps/web/public/img;
// el texto va sobre un degradado del tema para mantener el contraste.
const SECTION_IMAGES: Record<Section, string> = {
  'vertical-kicks': '/img/section-vertical-kick.webp',
  backward: '/img/section-backflip.webp',
  forward: '/img/section-street-flip.webp',
  inside: '/img/section-silhouette.webp',
  outside: '/img/section-padwork.webp',
};

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
      <header className="relative overflow-hidden rounded-box border border-border">
        <img
          src={SECTION_IMAGES[section]}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-base-100 via-base-100/85 to-base-100/30"
        />
        <div className="relative flex flex-col gap-2 p-6 sm:p-8">
          <span className="tb-eyebrow">{t('title')}</span>
          <h1 className="tb-display text-4xl text-base-content sm:text-5xl">
            {t(`sections.${section}.title`)}
          </h1>
          <p className="max-w-2xl text-base text-base-content/80">
            {t(`sections.${section}.description`)}
          </p>
        </div>
      </header>
      <TrickBrowser section={section} initial={filters} />
    </section>
  );
}
