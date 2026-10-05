import { listTricks } from '@tricking/db';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ComboGenerator } from '@/components/combo-generator';
import { ProgressExport } from '@/components/progress-export';
import { ProgressSummary, type ProgressSectionSummary } from '@/components/progress-summary';
import { SECTIONS, type Section } from '@/lib/sections';

// La pagina arma el catalogo por seccion en cada peticion; no se prerrenderiza.
export const dynamic = 'force-dynamic';

type ProgressPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ProgressPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'progress' });
  return {
    title: t('page.title'),
    description: t('page.description'),
  };
}

// Devuelve los ids de todos los trucos de una seccion paginando la consulta
// existente (tope de 100 por pagina). Sirve para calcular el progreso por seccion.
async function listSectionIds(section: Section): Promise<string[]> {
  const ids: string[] = [];
  let page = 1;
  for (;;) {
    const result = await listTricks({ section, page, pageSize: 100 });
    ids.push(...result.items.map((item) => item.id));
    if (page >= result.totalPages) {
      break;
    }
    page += 1;
  }
  return ids;
}

export default async function ProgressPage({ params }: ProgressPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('progress');
  const tTricks = await getTranslations('tricks');

  const [catalog, sectionIds] = await Promise.all([
    listTricks({ page: 1, pageSize: 1 }),
    Promise.all(SECTIONS.map((section) => listSectionIds(section))),
  ]);

  const sections: ProgressSectionSummary[] = SECTIONS.map((section, index) => ({
    id: section,
    label: tTricks(`sections.${section}.title`),
    trickIds: sectionIds[index] ?? [],
  }));

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {t('page.title')}
        </h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('page.description')}</p>
      </header>

      <ProgressSummary total={catalog.total} sections={sections} />
      <ProgressExport />
      <ComboGenerator />
    </section>
  );
}
