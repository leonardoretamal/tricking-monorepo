import type { MetadataRoute } from 'next';

import { absoluteUrl, getSiteUrl } from '@/lib/site';

// robots.txt generado por Next. Permite el rastreo general, bloquea el panel de
// administracion (con y sin prefijo de idioma) y declara el sitemap absoluto.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/es/admin', '/en/admin'],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: getSiteUrl(),
  };
}
