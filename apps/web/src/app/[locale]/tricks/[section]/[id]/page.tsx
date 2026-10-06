import { getTrickById } from '@tricking/db';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { breadcrumbJsonLd, JsonLd, trickJsonLd } from '@/components/json-ld';
import { TrickDetailView } from '@/components/trick-detail-view';
import { pickDescription } from '@/lib/description';
import { isSection } from '@/lib/sections';

// El detalle lee la base de datos en cada peticion; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

// generateMetadata y la pagina piden el mismo truco en una peticion; se memoiza para
// no repetir las consultas de relaciones.
const getTrickCached = cache(getTrickById);

type TrickDetailPageProps = {
  params: Promise<{ locale: string; section: string; id: string }>;
};

export async function generateMetadata({ params }: TrickDetailPageProps) {
  const { locale, id } = await params;
  const trick = await getTrickCached(id);
  if (!trick) {
    return {};
  }
  return {
    title: trick.name,
    description: pickDescription(locale, trick.description, trick.descriptionEs) ?? undefined,
  };
}

export default async function TrickDetailPage({ params }: TrickDetailPageProps) {
  const { locale, section, id } = await params;

  if (!isSection(section)) {
    notFound();
  }

  setRequestLocale(locale);

  const trick = await getTrickCached(id);
  if (!trick) {
    notFound();
  }
  if (trick.section !== null && trick.section !== section) {
    notFound();
  }

  const t = await getTranslations('tricks');
  const tNav = await getTranslations('nav');
  const tApp = await getTranslations('app');
  const sectionTitle = t(`sections.${section}.title`);
  const path = `/${locale}/tricks/${section}/${trick.id}`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: tNav('home'), path: `/${locale}` },
          { name: tNav('tricks'), path: `/${locale}/tricks` },
          { name: sectionTitle, path: `/${locale}/tricks/${section}` },
          { name: trick.name, path },
        ])}
      />
      <JsonLd
        data={trickJsonLd({
          name: trick.name,
          description: trick.description,
          descriptionEs: trick.descriptionEs,
          howTo: trick.howTo,
          howToEs: trick.howToEs,
          path,
          locale,
          siteName: tApp('name'),
        })}
      />
      <article className="flex flex-col gap-6 py-6">
        <TrickDetailView trick={trick} section={section} sectionTitle={sectionTitle} />
      </article>
    </>
  );
}
