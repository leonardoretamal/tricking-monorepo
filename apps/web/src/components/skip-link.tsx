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
      className="tb-glow sr-only rounded-full focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-primary focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-primary-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {t('skipToContent')}
    </a>
  );
}
