import { getTranslations, setRequestLocale } from 'next-intl/server';

import { SearchResults } from '@/components/search-results';
import { parseSearchParams } from '@/lib/search-schemas';

type SearchPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: SearchPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'search' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('search');
  const initial = parseSearchParams(await searchParams);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {t('title')}
        </h1>
        <p className="max-w-2xl text-base text-base-content/70">{t('description')}</p>
      </header>
      <SearchResults initial={initial} />
    </section>
  );
}
