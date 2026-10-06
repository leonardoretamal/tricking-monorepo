import createMiddleware from 'next-intl/middleware';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export default function proxy(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto');

  if (forwardedProto === 'http' && !LOCAL_HOSTS.has(request.nextUrl.hostname)) {
    const url = request.nextUrl.clone();
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301);
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|apple-icon|.*\\..*).*)'],
};
