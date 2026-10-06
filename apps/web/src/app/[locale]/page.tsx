import { Link } from '@/i18n/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';

import { JsonLd, websiteJsonLd } from '@/components/json-ld';
import { Reveal } from '@/components/reveal';

type HomePageProps = {
  params: Promise<{ locale: string }>;
};

type SectionCard = {
  href: string;
  title: string;
  description: string;
  image: string | null;
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
  const tApp = await getTranslations('app');
  const tTricks = await getTranslations('tricks');
  const tVariations = await getTranslations('variations');
  const tTransitions = await getTranslations('transitions');
  const tStances = await getTranslations('stances');
  const tTips = await getTranslations('tips');
  const tExplore = await getTranslations('explore');
  const tSearch = await getTranslations('search');

  const sections: SectionCard[] = [
    {
      href: '/tricks',
      title: tTricks('title'),
      description: tTricks('description'),
      image: '/img/section-street-flip.webp',
    },
    {
      href: '/variations',
      title: tVariations('title'),
      description: tVariations('description'),
      image: '/img/section-vertical-kick.webp',
    },
    {
      href: '/transitions',
      title: tTransitions('title'),
      description: tTransitions('description'),
      image: '/img/section-parkour-flow.webp',
    },
    {
      href: '/stances',
      title: tStances('title'),
      description: tStances('description'),
      image: '/img/section-silhouette.webp',
    },
    {
      href: '/tips',
      title: tTips('title'),
      description: tTips('description'),
      image: '/img/section-backflip.webp',
    },
    {
      href: '/explore',
      title: tExplore('title'),
      description: tExplore('description'),
      image: null,
    },
    {
      href: '/search',
      title: tSearch('title'),
      description: tSearch('description'),
      image: null,
    },
  ];

  const stats = [
    { value: t('stats.sectionsValue'), label: t('stats.sectionsLabel') },
    { value: t('stats.stancesValue'), label: t('stats.stancesLabel') },
    { value: t('stats.openValue'), label: t('stats.openLabel') },
  ];

  return (
    <>
      <JsonLd data={websiteJsonLd(tApp('name'))} />

      {/* Hero a sangre completa. El truco left-1/2 w-screen -translate-x-1/2 saca la
          seccion del ancho maximo del main y la centra en la ventana sin desbordarla. */}
      <section className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden">
        <img
          src="/img/hero-trick.webp"
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-linear-to-t from-base-100 via-base-100/80 to-base-100/50"
        />
        <div className="relative mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <p className="tb-eyebrow">{t('hero.eyebrow')}</p>
          <h1 className="tb-display max-w-3xl text-4xl text-base-content sm:text-5xl lg:text-6xl">
            {t('hero.headline')}
          </h1>
          <p className="max-w-2xl text-base text-base-content/85 sm:text-lg">{t('intro')}</p>
          <Link
            href="/tricks"
            className="btn btn-primary btn-lg mt-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {t('hero.cta')}
          </Link>
        </div>
      </section>

      {/* Cifras del contenido: secciones y posturas del catalogo, sin metricas inventadas. */}
      <section className="py-12 sm:py-16">
        <dl className="grid grid-cols-3 gap-3 sm:gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="tb-surface flex flex-col gap-1 p-4 sm:p-6">
              <dt className="order-2 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-muted sm:text-xs">
                {stat.label}
              </dt>
              <dd className="tb-display order-1 text-3xl text-base-content sm:text-4xl">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Secciones destacadas del catalogo. */}
      <section className="flex flex-col gap-8 pb-8">
        <header className="flex flex-col gap-2">
          <p className="tb-eyebrow">{t('featured.eyebrow')}</p>
          <h2 className="tb-display text-3xl text-base-content sm:text-4xl">
            {t('featured.heading')}
          </h2>
        </header>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section, index) => (
            <li key={section.href} className="flex">
              <Reveal className="h-full w-full" delay={index * 60}>
                <Link
                  href={section.href}
                  className="tb-surface tb-surface-hover group relative flex h-full min-h-60 w-full flex-col justify-end overflow-hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {section.image ? (
                    <img
                      src={section.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-linear-to-br from-primary/25 via-base-300 to-accent/30"
                    />
                  )}
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-linear-to-t from-base-100 via-base-100/70 to-base-100/10"
                  />
                  <div className="relative flex flex-col gap-1.5 p-5">
                    <span className="tb-display text-xl text-base-content">{section.title}</span>
                    <span className="text-sm text-base-content/85">{section.description}</span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
