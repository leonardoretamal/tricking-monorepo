import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { eq } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks } from '../schema';
import { loadEnvFile } from './load-env';

// Descripciones PROPIAS de "como se hace" (contenido original del proyecto, no de las
// fuentes). Viven en how-to.json indexadas por id de truco. Se aplican de forma
// idempotente con `pnpm --filter @tricking/db db:how-to`. El contenido nuevo que entre
// en ingles se agrega aqui en espanol (y opcionalmente en ingles).

const HOW_TO_FILE = new URL('./how-to/how-to.json', import.meta.url);

interface HowToEntry {
  es?: unknown;
  en?: unknown;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  let parsed: unknown;
  try {
    parsed = JSON.parse(await readFile(fileURLToPath(HOW_TO_FILE), 'utf8')) as unknown;
  } catch {
    console.log('No hay how-to.json; no se escribe nada.');
    return;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    console.error('how-to.json no es un objeto indexado por id de truco.');
    process.exitCode = 1;
    return;
  }

  const entries = Object.entries(parsed as Record<string, HowToEntry>);
  const db = getDb();

  let applied = 0;
  for (const [trickId, value] of entries) {
    const es = typeof value.es === 'string' && value.es.trim() !== '' ? value.es : null;
    const en = typeof value.en === 'string' && value.en.trim() !== '' ? value.en : null;
    if (es === null && en === null) {
      continue;
    }
    await db
      .update(tricks)
      .set({ howToEs: es, howTo: en, updatedAt: new Date() })
      .where(eq(tricks.id, trickId));
    applied += 1;
  }

  console.log(`Descripciones propias aplicadas: ${applied}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al aplicar descripciones propias: ${message}`);
  process.exitCode = 1;
});
