/* global self, caches, fetch, Response, Request, URL */
// Service worker propio, sin dependencias ni importScripts (Fase 20.5).
//
// Estrategias:
// - Precache minimo del shell: '/' y '/offline'. Como localePrefix es 'always', la
//   pagina offline real vive en /es/offline y /en/offline; se precachean ambas para que
//   el respaldo funcione sin red aunque el redirect de /offline no se pueda guardar.
// - Navegacion: network-first, con la pagina offline como respaldo si no hay red.
// - Resto de GET del mismo origen (salvo /api/): stale-while-revalidate.
// - No se tocan metodos distintos de GET ni peticiones a otros origenes.
// - /api/ se deja pasar sin cache para no guardar respuestas con datos sensibles
//   (por ejemplo el panel de feedback protegido por token).

const CACHE_NAME = 'tricking-v1';
const OFFLINE_URL = '/offline';
const PRECACHE_URLS = ['/', OFFLINE_URL, '/es/offline', '/en/offline'];
const LOCALE_PREFIX = /^\/(es|en)(?=\/|$)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const response = await fetch(new Request(url, { redirect: 'follow' }));
            if (response && response.ok) {
              await cache.put(url, response);
            }
          } catch {
            // El precache es best-effort: un fallo no debe impedir la instalacion.
          }
        }),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(CACHE_NAME);
      try {
        await cache.put(request, response.clone());
      } catch {
        // La respuesta se sirve igual aunque no se pueda guardar.
      }
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) {
      return cached;
    }
    const offline = await offlineFallback(request.url);
    if (offline) {
      return offline;
    }
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function offlineFallback(requestUrl) {
  const match = new URL(requestUrl).pathname.match(LOCALE_PREFIX);
  const locale = match ? match[1] : 'es';

  return (
    (await caches.match(`/${locale}/offline`)) ??
    (await caches.match(OFFLINE_URL)) ??
    (await caches.match('/es/offline'))
  );
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then(async (response) => {
      if (response && response.ok) {
        try {
          await cache.put(request, response.clone());
        } catch {
          // Si no se puede guardar, se devuelve la respuesta de red igual.
        }
      }
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    // Se sirve el cacheado de inmediato y la red actualiza en segundo plano.
    return cached;
  }

  const response = await network;
  if (response) {
    return response;
  }

  return new Response('', { status: 503, statusText: 'Offline' });
}
