import { getTranslations, setRequestLocale } from 'next-intl/server';

type LegalPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: LegalPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('legal');

  const sections = [
    { id: 'object', title: t('object.title'), body: t('object.body') },
    { id: 'use', title: t('use.title'), body: t('use.body') },
    {
      id: 'intellectualProperty',
      title: t('intellectualProperty.title'),
      body: t('intellectualProperty.body'),
    },
    { id: 'thirdParty', title: t('thirdParty.title'), body: t('thirdParty.body') },
    { id: 'removal', title: t('removal.title'), body: t('removal.body') },
    { id: 'links', title: t('links.title'), body: t('links.body') },
    { id: 'liability', title: t('liability.title'), body: t('liability.body') },
    { id: 'law', title: t('law.title'), body: t('law.body') },
  ];

  return (
    <article className="flex flex-col gap-8 py-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-base-content sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-sm text-base-content/60">
          {t('updatedLabel')} {t('updated')}
        </p>
      </header>

      <p className="max-w-3xl text-base text-base-content/80">{t('intro')}</p>

      <section
        aria-labelledby="legal-holder"
        className="flex flex-col gap-2 rounded-box border border-base-300 bg-base-200 p-5"
      >
        <h2 id="legal-holder" className="text-lg font-semibold text-base-content">
          {t('holder.title')}
        </h2>
        <p className="text-base font-medium text-base-content">{t('holder.placeholder')}</p>
        <p className="text-sm text-base-content/70">{t('holder.note')}</p>
      </section>

      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <section
            key={section.id}
            aria-labelledby={`legal-${section.id}`}
            className="flex flex-col gap-2"
          >
            <h2 id={`legal-${section.id}`} className="text-xl font-semibold text-base-content">
              {section.title}
            </h2>
            <p className="max-w-3xl text-base text-base-content/80">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
