import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { getDb } from '../client';
import { stances } from '../schema';
import { loadEnvFile } from './load-env';

// Semilla de la Fase 10. Loopkicks lista 6 stances; su pagina describe 4 (complete,
// hyper, mega, semi). backside y frontside se describen aqui de forma curada porque la
// pagina solo los menciona en la introduccion. Idempotente, sin transacciones.

interface ScrapedStance {
  slug: string;
  name: string;
  description: string;
}

const STANCES_FILE = new URL(
  '../../../../apps/scraper/data/loopkicks-stances.json',
  import.meta.url,
);

const STANCE_ORDER = ['backside', 'frontside', 'complete', 'hyper', 'mega', 'semi'] as const;

const STANCE_NAMES: Record<string, string> = {
  backside: 'Backside',
  frontside: 'Frontside',
  complete: 'Complete',
  hyper: 'Hyper',
  mega: 'Mega',
  semi: 'Semi',
};

const CURATED_DESCRIPTIONS: Record<string, string> = {
  backside:
    'Landing on the kicking leg with the body turned away from the direction of travel. It is the default takeoff for many backward and swing tricks and the source of a backswing.',
  frontside:
    'Landing on the kicking leg with the body facing the direction of travel. It is the source of a frontswing into the next trick.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseStances(raw: unknown): ScrapedStance[] {
  if (!Array.isArray(raw)) {
    throw new Error('El JSON de stances no es un arreglo');
  }
  const result: ScrapedStance[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }
    const { slug, name, description } = entry;
    if (typeof slug !== 'string' || typeof name !== 'string') {
      continue;
    }
    result.push({
      slug,
      name,
      description: typeof description === 'string' ? description : '',
    });
  }
  return result;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const rawJson = await readFile(fileURLToPath(STANCES_FILE), 'utf8');
  const scraped = parseStances(JSON.parse(rawJson) as unknown);
  const scrapedBySlug = new Map(scraped.map((stance) => [stance.slug, stance]));

  const db = getDb();

  let count = 0;
  for (const slug of STANCE_ORDER) {
    const scrapedStance = scrapedBySlug.get(slug);
    const description =
      scrapedStance && scrapedStance.description.length > 0
        ? scrapedStance.description
        : (CURATED_DESCRIPTIONS[slug] ?? '');
    const name = scrapedStance?.name ?? STANCE_NAMES[slug] ?? slug;

    await db
      .insert(stances)
      .values({ slug, name, description })
      .onConflictDoUpdate({
        target: stances.slug,
        set: { name, description, updatedAt: new Date() },
      });
    count += 1;
  }

  console.log(`Stances: ${count} sembradas`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar stances: ${message}`);
  process.exitCode = 1;
});
