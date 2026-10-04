import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { and, inArray, isNotNull, isNull } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks, videos, type NewVideo } from '../schema';
import { loadEnvFile } from './load-env';

// Semilla de videos de trucos (Fase 14). Fuente: apps/scraper/data/loopkicks-videos.json
// (URLs reales extraidas por el scraper). Si existe un manifiesto de subidas a R2
// (apps/scraper/data/r2-videos-manifest.json, lo escribe upload-videos.ts), los trucos
// subidos se guardan con status 'ready' y la URL publica del bucket; el resto queda con
// status 'external' y la URL original de Loopkicks. Idempotente: se reemplazan las filas
// de los trucos sembrados en cada corrida. No inventa videos: sin JSON, no escribe nada.

interface ScrapedVideo {
  slug: string;
  name: string;
  section: string;
  url: string;
  mime: string | null;
}

interface ManifestEntry {
  slug: string;
  r2Key: string;
  mime: string | null;
  sizeBytes: number | null;
  durationSeconds: number | null;
}

const VIDEOS_JSON_URL = new URL(
  '../../../../apps/scraper/data/loopkicks-videos.json',
  import.meta.url,
);
const MANIFEST_JSON_URL = new URL(
  '../../../../apps/scraper/data/r2-videos-manifest.json',
  import.meta.url,
);

const INSERT_BATCH_SIZE = 200;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

async function readJson(path: URL): Promise<unknown | null> {
  try {
    return JSON.parse(await readFile(fileURLToPath(path), 'utf8')) as unknown;
  } catch {
    return null;
  }
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

function parseManifest(raw: unknown): ManifestEntry[] {
  let list: unknown = raw;
  if (isRecord(raw) && Array.isArray(raw.entries)) {
    list = raw.entries;
  }
  if (!Array.isArray(list)) {
    return [];
  }

  const result: ManifestEntry[] = [];
  for (const item of list) {
    if (!isRecord(item)) {
      continue;
    }
    const slug = asString(item.slug);
    const r2Key = asString(item.r2Key);
    if (slug === null || r2Key === null) {
      continue;
    }
    result.push({
      slug,
      r2Key,
      mime: asString(item.mime),
      sizeBytes: asNumber(item.sizeBytes),
      durationSeconds: asNumber(item.durationSeconds),
    });
  }

  return result;
}

function publicUrlFor(base: string | undefined, key: string): string | null {
  if (base === undefined || base.trim() === '') {
    return null;
  }
  return `${base.replace(/\/+$/, '')}/${key.replace(/^\/+/, '')}`;
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

  const scraped = parseScrapedVideos(await readJson(VIDEOS_JSON_URL));
  if (scraped.length === 0) {
    console.log('No hay videos en loopkicks-videos.json; no se escribe nada.');
    return;
  }

  const manifest = parseManifest(await readJson(MANIFEST_JSON_URL));
  const manifestBySlug = new Map(manifest.map((entry) => [entry.slug, entry]));
  const publicBase = process.env.R2_PUBLIC_URL;

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
  let ready = 0;
  let external = 0;
  let skipped = 0;

  for (const video of scraped) {
    const trickId = trickIdBySlug.get(video.slug);
    if (trickId === undefined) {
      skipped += 1;
      continue;
    }

    const uploaded = manifestBySlug.get(video.slug);
    const r2Url = uploaded !== undefined ? publicUrlFor(publicBase, uploaded.r2Key) : null;

    if (uploaded !== undefined && r2Url !== null) {
      rows.push({
        trickId,
        r2Key: uploaded.r2Key,
        url: r2Url,
        mime: uploaded.mime ?? video.mime,
        sizeBytes: uploaded.sizeBytes,
        durationSeconds: uploaded.durationSeconds,
        status: 'ready',
      });
      ready += 1;
    } else {
      rows.push({
        trickId,
        r2Key: null,
        url: video.url,
        mime: video.mime,
        sizeBytes: null,
        durationSeconds: null,
        status: 'external',
      });
      external += 1;
    }

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

  console.log(`Videos sembrados: ${rows.length} (${ready} en R2, ${external} externos)`);
  console.log(`Trucos con video: ${affectedTrickIds.length}`);
  if (skipped > 0) {
    console.log(`Videos sin truco mapeado (omitidos): ${skipped}`);
  }
  if (ready === 0) {
    console.log(
      'Aviso: no hay subidas a R2 en el manifiesto; todos los videos quedaron como externos.',
    );
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar videos: ${message}`);
  process.exitCode = 1;
});
