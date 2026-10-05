import { listStances, listTransitions, listTricks, listVariations } from '@tricking/db';
import type { MetadataRoute } from 'next';

import { routing, type Locale } from '@/i18n/routing';
import { absoluteUrl } from '@/lib/site';

// sitemap.xml generado por Next. Incluye las rutas estaticas y el detalle del
// catalogo por locale, con alternates de idioma. Si la base de datos no responde
// (por ejemplo un build sin DATABASE_URL) cae a las rutas estaticas para no romper
// el build. Se acota la cantidad de URLs con un tope prudente.
const MAX_URLS = 2000;
const DB_PAGE_SIZE = 100;

const STATIC_PATHS: string[] = [
  '/',
  '/tricks',
  '/variations',
  '/transitions',
  '/stances',
  '/tutorials',
  '/tips',
  '/explore',
  '/search',
  '/feedback',
  '/progress',
  '/legal',
  '/privacidad',
];

const DETAIL_PREFIXES = ['/tricks/', '/variations/', '/transitions/', '/stances/'];

async function collectDetailPaths(): Promise<string[]> {
  const paths: string[] = [];

  let trickPage = 1;
  let trickTotalPages = 1;
  do {
    const result = await listTricks({ page: trickPage, pageSize: DB_PAGE_SIZE });
    for (const item of result.items) {
      if (item.section !== null) {
        paths.push(`/tricks/${item.section}/${item.id}`);
      }
    }
    trickTotalPages = result.totalPages;
    trickPage += 1;
  } while (trickPage <= trickTotalPages);

  let variationPage = 1;
  let variationTotalPages = 1;
  do {
    const result = await listVariations({ page: variationPage, pageSize: DB_PAGE_SIZE });
    for (const item of result.items) {
      paths.push(`/variations/${item.slug}`);
    }
    variationTotalPages = result.totalPages;
    variationPage += 1;
  } while (variationPage <= variationTotalPages);

  let transitionPage = 1;
  let transitionTotalPages = 1;
  do {
    const result = await listTransitions({ page: transitionPage, pageSize: DB_PAGE_SIZE });
    for (const item of result.items) {
      paths.push(`/transitions/${item.slug}`);
    }
    transitionTotalPages = result.totalPages;
    transitionPage += 1;
  } while (transitionPage <= transitionTotalPages);

  let stancePage = 1;
  let stanceTotalPages = 1;
  do {
    const result = await listStances({ page: stancePage, pageSize: DB_PAGE_SIZE });
    for (const item of result.items) {
      paths.push(`/stances/${item.slug}`);
    }
    stanceTotalPages = result.totalPages;
    stancePage += 1;
  } while (stancePage <= stanceTotalPages);

  return paths;
}

function priorityFor(path: string): number {
  if (path === '/') {
    return 1;
  }
  if (DETAIL_PREFIXES.some((prefix) => path.startsWith(prefix))) {
    return 0.6;
  }
  return 0.8;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let detailPaths: string[] = [];
  try {
    detailPaths = await collectDetailPaths();
  } catch {
    detailPaths = [];
  }

  const allPaths = [...new Set<string>([...STATIC_PATHS, ...detailPaths])].sort();
  const maxPaths = Math.floor(MAX_URLS / routing.locales.length);
  const selectedPaths = allPaths.slice(0, maxPaths);

  const entries: MetadataRoute.Sitemap = [];
  for (const path of selectedPaths) {
    const languages: Partial<Record<Locale, string>> = {};
    for (const locale of routing.locales) {
      languages[locale] = absoluteUrl(`/${locale}${path === '/' ? '' : path}`);
    }

    const isDetail = DETAIL_PREFIXES.some((prefix) => path.startsWith(prefix));
    const changeFrequency = isDetail || path === '/' ? 'weekly' : 'monthly';

    for (const locale of routing.locales) {
      entries.push({
        url: languages[locale] ?? absoluteUrl(`/${locale}`),
        changeFrequency,
        priority: priorityFor(path),
        alternates: { languages },
      });
    }
  }

  return entries;
}
