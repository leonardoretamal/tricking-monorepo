import { getStanceBySlug } from '@tricking/db';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { breadcrumbJsonLd, JsonLd } from '@/components/json-ld';
import { StanceDetailView } from '@/components/stance-detail-view';
import { pickDescription } from '@/lib/description';

// El detalle lee la base de datos en cada peticion; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

// Memoiza la consulta dentro del mismo request (generateMetadata y pagina).
const getStance = cache(getStanceBySlug);

type StanceDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: StanceDetailPageProps) {
  const { locale, slug } = await params;
  const stance = await getStance(slug);
  if (!stance) {
    return {};
  }
  return {
    title: stance.name,
    description: pickDescription(locale, stance.description, stance.descriptionEs) ?? undefined,
  };
}

export default async function StanceDetailPage({ params }: StanceDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const stance = await getStance(slug);
  if (!stance) {
    notFound();
  }

  const tNav = await getTranslations('nav');

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: tNav('home'), path: `/${locale}` },
          { name: tNav('stances'), path: `/${locale}/stances` },
          { name: stance.name, path: `/${locale}/stances/${slug}` },
        ])}
      />
      <article className="flex flex-col gap-6 py-6">
        <StanceDetailView stance={stance} />
      </article>
    </>
  );
}
