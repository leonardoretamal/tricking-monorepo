import { listGazeTipSummaries, listGazeTipTypes } from '@tricking/db';
import { EmptyState } from '@tricking/ui';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { GazeSummaryCard } from '@/components/gaze-summary-card';
import { GazeTypeCard } from '@/components/gaze-type-card';
import { GazeTypeTabs } from '@/components/gaze-type-tabs';

// El listado agrupa por tipo de truco y muestra los bloques destacados. Lee la base de
// datos en cada peticion; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

type TipsPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: TipsPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'tips' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TipsPage({ params }: TipsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('tips');
  const tApp = await getTranslations('app');
  const [summaries, types] = await Promise.all([
    listGazeTipSummaries(locale),
    listGazeTipTypes(locale),
  ]);
  // La idea clave y la regla de oro van destacadas arriba; el resumen corto cierra la
  // pagina como tarjeta compacta (Fase 16.7 a 16.9).
  const featured = summaries.filter((summary) => summary.kind !== 'resumen_corto');
  const shortSummary = summaries.find((summary) => summary.kind === 'resumen_corto');

  return (
    <section className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-3">
        <p className="tb-eyebrow">{tApp('name')}</p>
        <h1 className="tb-display tb-gradient-text text-4xl sm:text-5xl">{t('title')}</h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
      </header>

      {featured.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {featured.map((summary) => (
            <li key={summary.id}>
              <GazeSummaryCard kind={summary.kind} content={summary.content} />
            </li>
          ))}
        </ul>
      ) : null}

      {types.length === 0 ? (
        <EmptyState title={t('states.emptyTitle')} description={t('states.emptyDescription')} />
      ) : (
        <section className="flex flex-col gap-4" aria-labelledby="gaze-types-title">
          <h2 id="gaze-types-title" className="tb-display text-2xl text-base-content">
            {t('typesHeading')}
          </h2>
          <GazeTypeTabs types={types} />
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((type) => (
              <li key={type.trickType}>
                <GazeTypeCard type={type} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {shortSummary ? (
        <GazeSummaryCard kind={shortSummary.kind} content={shortSummary.content} />
      ) : null}
    </section>
  );
}
