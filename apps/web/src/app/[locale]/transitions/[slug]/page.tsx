import { getTransitionBySlug } from '@tricking/db';
import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { TransitionDetailView } from '@/components/transition-detail-view';

// El detalle lee la base de datos en cada peticion; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

// Memoiza la consulta dentro del mismo request (generateMetadata y pagina).
const getTransition = cache(getTransitionBySlug);

type TransitionDetailPageProps = {
  params: Promise<{ locale: string; slug: string }>;
};

export async function generateMetadata({ params }: TransitionDetailPageProps) {
  const { slug } = await params;
  const transition = await getTransition(slug);
  if (!transition) {
    return {};
  }
  return {
    title: transition.name,
    description: transition.description ?? undefined,
  };
}

export default async function TransitionDetailPage({ params }: TransitionDetailPageProps) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const transition = await getTransition(slug);
  if (!transition) {
    notFound();
  }

  return (
    <article className="flex flex-col gap-6 py-6">
      <TransitionDetailView transition={transition} />
    </article>
  );
}
