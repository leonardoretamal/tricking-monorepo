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

// Se mantiene el convenio legacy middleware.ts a proposito: el middleware de Next 16
// corre siempre en runtime Node y OpenNext para Cloudflare lo re-bundlea de forma
// experimental (se cuelga en workerd). Con el nombre legacy y runtime experimental-edge
// el middleware se compila como Edge, que es la via estable en Cloudflare.
export const config = {
  runtime: 'experimental-edge',
  matcher: ['/((?!api|_next|_vercel|apple-icon|.*\\..*).*)'],
};
