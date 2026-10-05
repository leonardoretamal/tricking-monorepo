import { Link } from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { JsonLd, websiteJsonLd } from '@/components/json-ld';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'home' });

  return {
    // El titulo del inicio es la marca; se usa absoluto para no repetirla con el
    // template del layout ("Tricking | Tricking").
    title: { absolute: t('title') },
    description: t('subtitle'),
  };
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('home');
  const tTricks = await getTranslations('tricks');
  const tVariations = await getTranslations('variations');
  const tTransitions = await getTranslations('transitions');
  const tStances = await getTranslations('stances');
  const tTips = await getTranslations('tips');
  const tExplore = await getTranslations('explore');
  const tSearch = await getTranslations('search');

  const sections = [
    { href: '/tricks', title: tTricks('title'), description: tTricks('description') },
    { href: '/variations', title: tVariations('title'), description: tVariations('description') },
    {
      href: '/transitions',
      title: tTransitions('title'),
      description: tTransitions('description'),
    },
    { href: '/stances', title: tStances('title'), description: tStances('description') },
    { href: '/tips', title: tTips('title'), description: tTips('description') },
    { href: '/explore', title: tExplore('title'), description: tExplore('description') },
    { href: '/search', title: tSearch('title'), description: tSearch('description') },
  ];

  return (
    <>
      <JsonLd data={websiteJsonLd()} />
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight text-base-content sm:text-5xl">
            {t('title')}
          </h1>
          <p className="text-lg text-base-content/80">{t('subtitle')}</p>
          <p className="max-w-3xl text-base text-base-content/70">{t('intro')}</p>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <li key={section.href}>
              <Link
                href={section.href}
                className="flex h-full flex-col gap-2 rounded-box border border-base-300 bg-base-200 p-5 transition-colors hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <span className="text-lg font-semibold text-base-content">{section.title}</span>
                <span className="text-sm text-base-content/70">{section.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
