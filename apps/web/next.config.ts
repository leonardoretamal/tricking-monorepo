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
};

export default withNextIntl(nextConfig);
