import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { and, inArray, isNotNull, isNull } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks, videos, type NewVideo } from '../schema';
import { loadEnvFile } from './load-env';

// Semilla de videos de trucos (Fase 14). Fuente: apps/scraper/data/loopkicks-videos.json
// (URLs reales extraidas por el scraper).
//
// Politica de contenido de terceros: los videos de Loopkicks NO se re-hospedan. Cada truco
// guarda la URL ORIGINAL de Loopkicks (status 'external') y el reproductor la usa como
// enlace/hotlink al original. El bucket de R2 queda reservado para videos propios o con
// licencia, que en el futuro entraran con su propio r2Key. Por eso esta semilla nunca
// escribe en R2 ni lee manifiestos de subida.
//
// Idempotente: se reemplazan las filas de video de truco (tutorial_id nulo) de los trucos
// sembrados en cada corrida. No inventa videos: sin JSON, no escribe nada.

interface ScrapedVideo {
  slug: string;
  name: string;
  section: string;
  url: string;
  mime: string | null;
}

const VIDEOS_JSON_URL = new URL(
  '../../../../apps/scraper/data/loopkicks-videos.json',
  import.meta.url,
);

const INSERT_BATCH_SIZE = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function parseScrapedVideos(raw: unknown): ScrapedVideo[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const result: ScrapedVideo[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const slug = asString(item.slug);
    const url = asString(item.url);
    if (slug === null || url === null) {
      continue;
    }
    result.push({
      slug,
      name: asString(item.name) ?? slug,
      section: asString(item.section) ?? '',
      url,
      mime: asString(item.mime),
    });
  }

  return result;
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(fileURLToPath(VIDEOS_JSON_URL), 'utf8')) as unknown;
  } catch {
    console.log('No hay videos en loopkicks-videos.json; no se escribe nada.');
    return;
  }

  const scraped = parseScrapedVideos(raw);
  if (scraped.length === 0) {
    console.log('El JSON de videos esta vacio; no se escribe nada.');
    return;
  }

  const db = getDb();
  const trickRows = await db
    .select({ id: tricks.id, loopkicksSlug: tricks.loopkicksSlug })
    .from(tricks)
    .where(isNotNull(tricks.loopkicksSlug));

  const trickIdBySlug = new Map<string, string>();
  for (const row of trickRows) {
    if (row.loopkicksSlug !== null) {
      trickIdBySlug.set(row.loopkicksSlug, row.id);
    }
  }

  const rows: NewVideo[] = [];
  const videoTrickIds = new Set<string>();
  let skipped = 0;

  for (const video of scraped) {
    const trickId = trickIdBySlug.get(video.slug);
    if (trickId === undefined) {
      skipped += 1;
      continue;
    }

    rows.push({
      trickId,
      r2Key: null,
      url: video.url,
      mime: video.mime,
      sizeBytes: null,
      durationSeconds: null,
      status: 'external',
    });
    videoTrickIds.add(trickId);
  }

  const affectedTrickIds = [...videoTrickIds];
  if (affectedTrickIds.length === 0) {
    console.log('Ningun video coincide con un truco mapeado; no se escribe nada.');
    return;
  }

  // Reemplazo acotado a los videos de truco (tutorial_id nulo) de los trucos sembrados,
  // para que correr la semilla dos veces no duplique filas ni borre videos de tutoriales.
  // El driver neon-http no soporta transacciones, asi que el borrado y la insercion van
  // secuenciales e idempotentes.
  for (const batch of chunk(affectedTrickIds, 500)) {
    await db.delete(videos).where(and(inArray(videos.trickId, batch), isNull(videos.tutorialId)));
  }

  for (const batch of chunk(rows, INSERT_BATCH_SIZE)) {
    await db.insert(videos).values(batch).onConflictDoNothing();
  }

  console.log(`Videos sembrados: ${rows.length} (todos externos, enlazando al original)`);
  console.log(`Trucos con video: ${affectedTrickIds.length}`);
  if (skipped > 0) {
    console.log(`Videos sin truco mapeado (omitidos): ${skipped}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar videos: ${message}`);
  process.exitCode = 1;
});
