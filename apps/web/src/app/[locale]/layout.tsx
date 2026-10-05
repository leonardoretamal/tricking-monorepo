import '../globals.css';

import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { FeedbackButton } from '@/components/feedback-button';
import { Footer } from '@/components/footer';
import { Navbar } from '@/components/navbar';
import { Providers } from '@/components/providers';
import { routing } from '@/i18n/routing';

// Aplica el tema persistido (o el del sistema) antes del primer paint para evitar el destello de tema incorrecto. Es la unica excepcion de dangerouslySetInnerHTML permitida por las reglas del repositorio.
const themeScript = `(function(){try{var k='tricking:theme';var raw=window.localStorage.getItem(k);var t=null;if(raw){var p=JSON.parse(raw);if(p&&typeof p.value==='string'&&(!p.expiresAt||p.expiresAt>Date.now())){t=p.value;}}if(t!=='tricking-light'&&t!=='tricking-dark'){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'tricking-dark':'tricking-light';}document.documentElement.setAttribute('data-theme',t);}catch(e){document.documentElement.setAttribute('data-theme','tricking-light');}})();`;

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-base-100 text-base-content">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            <Navbar />
            <Breadcrumbs />
            <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
            <Footer />
            <FeedbackButton />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
