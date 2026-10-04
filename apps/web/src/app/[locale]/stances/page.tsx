import { getTranslations, setRequestLocale } from 'next-intl/server';

import { StanceBrowser } from '@/components/stance-browser';

// La pagina depende del parametro de pagina en la URL; no se prerrenderiza en el build.
export const dynamic = 'force-dynamic';

type StancesPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: StancesPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'stances' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export default async function StancesPage({ params, searchParams }: StancesPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('stances');
  const initialPage = parsePage((await searchParams).page);

  return (
    <section className="flex flex-col gap-6 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
      </header>
      <StanceBrowser initialPage={initialPage} />
    </section>
  );
}
