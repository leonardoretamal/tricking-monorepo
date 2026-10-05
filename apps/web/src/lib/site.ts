// URL publica del sitio. Se usa para construir URLs canonicas, sitemap, Open Graph,
// Twitter Cards y hreflang. La variable es publica (NEXT_PUBLIC_) y vive en el entorno;
// si falta, se asume el servidor de desarrollo local.
const FALLBACK_SITE_URL = 'http://localhost:3000';

// Devuelve la URL base sin barra final. Un valor vacio o solo con barras cae al
// default. Si el valor no trae esquema se asume https, para que `new URL` no falle.
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL ?? '').trim();
  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  if (withoutTrailingSlash === '') {
    return FALLBACK_SITE_URL;
  }
  return /^https?:\/\//i.test(withoutTrailingSlash)
    ? withoutTrailingSlash
    : `https://${withoutTrailingSlash}`;
}

// Convierte una ruta relativa en una URL absoluta del sitio.
export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (path === '' || path === '/') {
    return base;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
