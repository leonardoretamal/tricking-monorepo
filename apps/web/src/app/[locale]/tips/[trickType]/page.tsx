import { getGazeTipType, listGazeTipTypes } from '@tricking/db';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { cache } from 'react';

import { GazeTipTypeView } from '@/components/gaze-tip-type-view';

// El detalle lee la base de datos en cada peticion; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

// Memoiza las consultas dentro del mismo request (generateMetadata y pagina).
const getGazeType = cache(getGazeTipType);
const getGazeTypes = cache(listGazeTipTypes);

type GazeTipTypePageProps = {
  params: Promise<{ locale: string; trickType: string }>;
};

export async function generateMetadata({ params }: GazeTipTypePageProps) {
  const { locale, trickType } = await params;
  const detail = await getGazeType(trickType, locale);
  if (!detail) {
    return {};
  }
  const t = await getTranslations({ locale, namespace: 'tips' });
  return {
    title: detail.label,
    description: t('detail.metaDescription', { type: detail.label }),
  };
}

export default async function GazeTipTypePage({ params }: GazeTipTypePageProps) {
  const { locale, trickType } = await params;
  setRequestLocale(locale);

  const detail = await getGazeType(trickType, locale);
  if (!detail) {
    notFound();
  }

  const types = await getGazeTypes(locale);

  return (
    <article className="flex flex-col gap-6 py-6">
      <GazeTipTypeView trickType={trickType} locale={locale} types={types} />
    </article>
  );
}
