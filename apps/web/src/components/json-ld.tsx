import type { ReactElement } from 'react';

import { pickDescription } from '@/lib/description';
import { absoluteUrl, getSiteUrl } from '@/lib/site';

export type JsonLdData = Record<string, unknown>;

// Entrada de un BreadcrumbList: el nombre visible y la ruta del sitio, que puede
// incluir el locale (por ejemplo `/es/tricks`). El helper la vuelve absoluta.
export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface TrickJsonLdParams {
  name: string;
  description: string | null;
  descriptionEs: string | null;
  howTo: string | null;
  howToEs: string | null;
  path: string;
  locale: string;
  siteName: string;
}

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
// pagina de busqueda en espanol (idioma base del proyecto). El nombre de la app llega
// localizado desde la pagina.
export function websiteJsonLd(name: string): JsonLdData {
  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
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

// Migas de pan para el detalle de una pagina. Cada item apunta a su URL absoluta
// (con locale incluido) y la posicion se numera en el orden del arreglo.
export function breadcrumbJsonLd(items: BreadcrumbItem[]): JsonLdData {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

// Ficha por truco con schema.org LearningResource (subtipo de CreativeWork). La
// descripcion y el "como se hace" se eligen por locale con el helper existente; el
// segundo se expone como `teaches`. El truco es parte del WebSite del proyecto.
export function trickJsonLd(params: TrickJsonLdParams): JsonLdData {
  const description = pickDescription(params.locale, params.description, params.descriptionEs);
  const howTo = pickDescription(params.locale, params.howTo, params.howToEs);
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: params.name,
    ...(description ? { description } : {}),
    ...(howTo ? { teaches: howTo } : {}),
    url: absoluteUrl(params.path),
    inLanguage: params.locale,
    isPartOf: {
      '@type': 'WebSite',
      name: params.siteName,
      url: getSiteUrl(),
    },
  };
}
