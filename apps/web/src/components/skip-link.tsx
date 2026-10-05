'use client';

import { useTranslations } from 'next-intl';

// Enlace de salto al contenido principal. Debe ser el primer elemento dentro de <body>
// y el <main> debe llevar id="main-content". Permanece oculto hasta recibir foco, con
// foco visible y contraste AA. Es cliente para tomar los mensajes del provider de next-intl.
export function SkipLink() {
  const t = useTranslations('a11y');

  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-field focus:bg-primary focus:px-4 focus:py-2 focus:font-medium focus:text-primary-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {t('skipToContent')}
    </a>
  );
}
