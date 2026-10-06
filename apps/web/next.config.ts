import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

// En desarrollo las variables viven en el .env de la raiz del monorepo, no en
// apps/web. Este cargador las expone al proceso del servidor sin duplicar el archivo.
// En produccion (Cloudflare) las variables llegan por el entorno y el archivo no existe:
// el cargador es un no-op. Las variables no publicas nunca llegan al bundle del cliente.
function loadRootEnv(): void {
  const rootEnvPath = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');
  let content: string;
  try {
    content = readFileSync(rootEnvPath, 'utf8');
  } catch {
    return;
  }

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }
    const separator = line.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key !== '' && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadRootEnv();

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@tricking/ui', '@tricking/shared', '@tricking/db'],
  // Cabeceras de seguridad para todas las rutas. La redireccion 301 de HTTP a HTTPS
  // vive en el middleware (apps/web/src/proxy.ts), que lee x-forwarded-proto porque
  // la app no conoce el esquema original. HSTS solo lo aplica el navegador cuando la
  // respuesta viaja por HTTPS.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains',
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
