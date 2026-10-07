import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export default function middleware(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');

  if (forwardedProto === 'http' && !LOCAL_HOSTS.has(request.nextUrl.hostname)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  return handleI18nRouting(request);
}

// El nombre legacy middleware.ts (no proxy.ts) es lo que saca al middleware del bundle Node
// experimental de OpenNext y evita el cuelgue en workerd. El runtime experimental-edge
// explicita la intencion y evita un cambio de default a 'edge' (E1015).
export const config = {
  runtime: 'experimental-edge',
  matcher: ['/((?!api|_next|_vercel|apple-icon|.*\\..*).*)'],
};
