import { getTranslations, setRequestLocale } from 'next-intl/server';

type PrivacyPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'legal.privacy' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('legal.privacy');

  const dataItems = [
    { id: 'feedback', title: t('feedbackTitle'), body: t('feedbackBody') },
    { id: 'progress', title: t('progressTitle'), body: t('progressBody') },
    { id: 'logs', title: t('logsTitle'), body: t('logsBody') },
  ];

  const thirdParties = [
    t('thirdPartyNeon'),
    t('thirdPartyCloudflare'),
    t('thirdPartyResend'),
    t('thirdPartyUpstash'),
    t('thirdPartyAi'),
  ];

  const sections = [
    { id: 'cookies', title: t('cookiesTitle'), body: t('cookiesBody') },
    { id: 'legalBasis', title: t('legalBasisTitle'), body: t('legalBasisBody') },
    { id: 'retention', title: t('retentionTitle'), body: t('retentionBody') },
    { id: 'rights', title: t('rightsTitle'), body: t('rightsBody') },
    { id: 'contact', title: t('contactTitle'), body: t('contactBody') },
    { id: 'changes', title: t('changesTitle'), body: t('changesBody') },
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
        aria-labelledby="privacy-controller"
        className="flex flex-col gap-2 rounded-box border border-base-300 bg-base-200 p-5"
      >
        <h2 id="privacy-controller" className="text-lg font-semibold text-base-content">
          {t('controllerTitle')}
        </h2>
        <p className="text-base font-medium text-base-content">{t('controllerPlaceholder')}</p>
        <p className="text-sm text-base-content/70">{t('controllerNote')}</p>
      </section>

      <section aria-labelledby="privacy-data" className="flex flex-col gap-4">
        <h2 id="privacy-data" className="text-xl font-semibold text-base-content">
          {t('dataTitle')}
        </h2>
        <p className="max-w-3xl text-base text-base-content/80">{t('dataIntro')}</p>
        <dl className="flex flex-col gap-4">
          {dataItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-1">
              <dt className="text-base font-semibold text-base-content">{item.title}</dt>
              <dd className="max-w-3xl text-base text-base-content/80">{item.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="privacy-third-parties" className="flex flex-col gap-4">
        <h2 id="privacy-third-parties" className="text-xl font-semibold text-base-content">
          {t('thirdPartiesTitle')}
        </h2>
        <p className="max-w-3xl text-base text-base-content/80">{t('thirdPartiesIntro')}</p>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-base text-base-content/80">
          {thirdParties.map((party) => (
            <li key={party}>{party}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-6">
        {sections.map((section) => (
          <section
            key={section.id}
            aria-labelledby={`privacy-${section.id}`}
            className="flex flex-col gap-2"
          >
            <h2 id={`privacy-${section.id}`} className="text-xl font-semibold text-base-content">
              {section.title}
            </h2>
            <p className="max-w-3xl text-base text-base-content/80">{section.body}</p>
          </section>
        ))}
      </div>
    </article>
  );
}
