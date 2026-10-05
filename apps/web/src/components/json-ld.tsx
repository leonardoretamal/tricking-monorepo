import type { ReactElement } from 'react';

import { getSiteUrl } from '@/lib/site';

export type JsonLdData = Record<string, unknown>;

interface JsonLdProps {
  data: JsonLdData;
}

// React escapa el texto de los nodos <script> durante el render en servidor y eso
// corrompe el JSON que leen los buscadores (los caracteres escapados no se
// decodifican dentro de <script>). Por eso se serializa con JSON.stringify y se
// escapa el caracter < como secuencia unicode, la unica forma segura de servir
// JSON-LD sin permitir inyeccion. Es la excepcion autorizada a la regla que
// reserva dangerouslySetInnerHTML para el script anti-flash del tema.
export function JsonLd({ data }: JsonLdProps): ReactElement {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

// Datos estructurados del sitio: WebSite con la accion de busqueda que apunta a la
// pagina de busqueda en espanol (idioma base del proyecto).
export function websiteJsonLd(): JsonLdData {
  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tricking',
    url: base,
    inLanguage: ['es', 'en'],
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${base}/es/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}
