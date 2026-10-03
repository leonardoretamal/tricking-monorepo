import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['es', 'en'],
  defaultLocale: 'es',
  localePrefix: 'always',
  // El sitio es de idioma base espanol: la raiz va siempre a /es y el idioma se
  // cambia con el selector. No se detecta el Accept-Language del navegador.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];
