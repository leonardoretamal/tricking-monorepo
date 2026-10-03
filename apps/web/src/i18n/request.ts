import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing';

const modules = [
  'common',
  'home',
  'tricks',
  'variations',
  'transitions',
  'stances',
  'tips',
  'explore',
  'search',
] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const loaded = await Promise.all(
    modules.map((name) => import(`../../messages/${locale}/${name}.json`)),
  );
  const messages = Object.assign({}, ...loaded.map((mod) => mod.default));

  return { locale, messages };
});
