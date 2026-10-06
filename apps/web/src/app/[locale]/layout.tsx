import '../globals.css';

import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server';
import { Anton, Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { AssistantBubble } from '@/components/assistant-bubble';
import { FeedbackButton } from '@/components/feedback-button';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { ProgressHydrator } from '@/components/progress-hydrator';
import { Providers } from '@/components/providers';
import { PwaRegister } from '@/components/pwa-register';
import { SiteBackground } from '@/components/site-background';
import { SkipLink } from '@/components/skip-link';
import { routing } from '@/i18n/routing';
import { absoluteUrl, getSiteUrl } from '@/lib/site';

// Inter para el cuerpo y Anton para los titulos display. next/font es parte de Next,
// no agrega dependencias npm.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
  display: 'swap',
});

// Aplica el tema persistido (o el del sistema) antes del primer paint para evitar el destello de tema incorrecto. El modo por defecto es oscuro (dark-first): solo se usa el tema claro si el sistema lo prefiere. Es la unica excepcion de dangerouslySetInnerHTML permitida por las reglas del repositorio.
const themeScript = `(function(){try{var k='tricking:theme';var raw=window.localStorage.getItem(k);var t=null;if(raw){var p=JSON.parse(raw);if(p&&typeof p.value==='string'&&(!p.expiresAt||p.expiresAt>Date.now())){t=p.value;}}if(t!=='tricking-light'&&t!=='tricking-dark'){var preferLight=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches;t=preferLight?'tricking-light':'tricking-dark';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','tricking-dark');}})();`;

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'app' });
  const name = t('name');
  const description = t('tagline');
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const hasGoogleVerification =
    googleVerification !== undefined &&
    googleVerification !== '' &&
    googleVerification !== 'change-me';

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: name,
      template: `%s | ${name}`,
    },
    description,
    ...(hasGoogleVerification ? { verification: { google: googleVerification } } : {}),
    alternates: {
      languages: {
        es: '/es',
        en: '/en',
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'es_ES',
      siteName: name,
      title: name,
      description,
      url: absoluteUrl(`/${locale}`),
      images: [
        {
          url: `/${locale}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description,
      images: [`/${locale}/opengraph-image`],
    },
    robots: {
      index: true,
      follow: true,
    },
    icons: {
      icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      apple: '/apple-icon',
    },
  };
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${anton.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans text-base-content">
        <SiteBackground />
        <div className="relative z-10">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <SkipLink />
            <Providers>
              <ProgressHydrator />
              <PwaRegister />
              <Navbar />
              <Breadcrumbs />
              <main id="main-content" className="mx-auto w-full max-w-6xl px-4 py-6">
                {children}
              </main>
              <Footer />
              <FeedbackButton />
              <AssistantBubble />
            </Providers>
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}
