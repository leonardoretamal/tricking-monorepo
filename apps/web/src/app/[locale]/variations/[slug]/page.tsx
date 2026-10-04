import { getVariationBySlug } from '@tricking/db';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { VariationDetailView } from '@/components/variation-detail-view';

// El detalle lee la base de datos en cada peticion; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

// Memoiza la consulta dentro del mismo request: generateMetadata y la pagina comparten
// una sola lectura de la base.
const getVariation = cache(getVariationBySlug);

type VariationDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: VariationDetailPageProps) {
  const { locale, slug } = await params;
  const variation = await getVariation(slug);
  if (!variation) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: 'variations' });
  return {
    title: variation.name,
    description: variation.description ?? t('description'),
  };
}

export default async function VariationDetailPage({ params }: VariationDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const variation = await getVariation(slug);
  if (!variation) {
    notFound();
  }

  return (
    <article className="flex flex-col gap-6 py-6">
      <VariationDetailView variation={variation} />
    </article>
  );
}
