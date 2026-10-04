import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

// Scraping de las URLs de video por truco de Loopkicks (Fase 14). Cada pagina de truco
// vive en /tricks/<slug> y embebe un <video> de Webflow cuyo <source> apunta al archivo
// real en el bucket S3 de Loopkicks. Este script NO inventa URLs: si una pagina no trae
// video, el truco se omite del JSON.
//
// Entrada: apps/scraper/data/loopkicks-tricks.json (slug + seccion).
// Salida:  apps/scraper/data/loopkicks-videos.json (slug + url real + mime).

interface TrickRecord {
  slug: string;
  name: string;
  section: string;
}

interface VideoRecord {
  slug: string;
  name: string;
  section: string;
  url: string;
  mime: string | null;
}

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const TRICKS_PATH = join(DATA_DIR, 'loopkicks-tricks.json');
const OUTPUT_PATH = join(DATA_DIR, 'loopkicks-videos.json');

const TRICK_PAGE_BASE = 'https://www.loopkickstricking.com/tricks/';
const USER_AGENT = 'TrickingMonorepoScraper/0.1 (+https://www.loopkickstricking.com)';

// Concurrencia baja para no castigar al origen; el sitio es pequeno.
const CONCURRENCY = 3;
const DELAY_BETWEEN_BATCHES_MS = 150;
const REQUEST_TIMEOUT_MS = 20_000;
const MAX_LIMIT_REPORTED = 20;

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function parseLimit(): number | null {
  const fromArgv = process.argv.find((arg) => arg.startsWith('--limit='));
  const raw = fromArgv?.slice('--limit='.length) ?? process.env.VIDEO_SCRAPE_LIMIT;
  if (raw === undefined || raw === '') {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseTricks(raw: unknown): TrickRecord[] {
  if (!Array.isArray(raw)) {
    throw new Error('loopkicks-tricks.json no es un arreglo');
  }

  const result: TrickRecord[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const { slug, name, section } = item;
    if (typeof slug !== 'string' || typeof name !== 'string') {
      continue;
    }
    result.push({ slug, name, section: typeof section === 'string' ? section : '' });
  }

  return result;
}

function mimeFromUrl(url: string): string | null {
  const withoutQuery = url.split(/[?#]/)[0] ?? '';
  const dot = withoutQuery.lastIndexOf('.');
  if (dot === -1) {
    return null;
  }
  switch (withoutQuery.slice(dot + 1).toLowerCase()) {
    case 'mp4':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'm4v':
      return 'video/x-m4v';
    default:
      return null;
  }
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return null;
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

function extractVideoUrl(html: string): string | null {
  const $ = load(html);

  const sourceUrl = normalizeUrl($('video source[src]').first().attr('src') ?? '');
  if (sourceUrl !== null) {
    return sourceUrl;
  }

  const videoUrl = normalizeUrl($('video[src]').first().attr('src') ?? '');
  if (videoUrl !== null) {
    return videoUrl;
  }

  return null;
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en',
    },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return await response.text();
}

async function fetchHtmlWithRetry(url: string): Promise<string> {
  try {
    return await fetchHtml(url);
  } catch {
    return await fetchHtml(url);
  }
}

interface ScrapeResult {
  video: VideoRecord | null;
  error: string | null;
}

async function scrapeTrick(trick: TrickRecord): Promise<ScrapeResult> {
  const pageUrl = `${TRICK_PAGE_BASE}${encodeURIComponent(trick.slug)}`;

  let html: string;
  try {
    html = await fetchHtmlWithRetry(pageUrl);
  } catch (error) {
    return { video: null, error: `${trick.slug}: ${describeError(error)}` };
  }

  const url = extractVideoUrl(html);
  if (url === null) {
    return { video: null, error: null };
  }

  return {
    video: {
      slug: trick.slug,
      name: trick.name,
      section: trick.section,
      url,
      mime: mimeFromUrl(url),
    },
    error: null,
  };
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function main(): Promise<void> {
  console.log('Inicio de scraping de videos de Loopkicks');

  const rawJson = await readFile(TRICKS_PATH, 'utf8');
  let tricks = parseTricks(JSON.parse(rawJson) as unknown);

  const limit = parseLimit();
  if (limit !== null) {
    tricks = tricks.slice(0, limit);
    console.log(`Limite aplicado: ${limit} trucos`);
  }

  const videos: VideoRecord[] = [];
  const errors: string[] = [];
  const withoutVideo: string[] = [];

  const batches = chunk(tricks, CONCURRENCY);
  for (let index = 0; index < batches.length; index += 1) {
    const batch = batches[index];
    if (batch === undefined) {
      continue;
    }

    const results = await Promise.all(batch.map((trick) => scrapeTrick(trick)));
    for (const result of results) {
      if (result.video !== null) {
        videos.push(result.video);
      }
      if (result.error !== null) {
        errors.push(result.error);
      }
    }

    if (index < batches.length - 1) {
      await delay(DELAY_BETWEEN_BATCHES_MS);
    }
  }

  for (const trick of tricks) {
    if (!videos.some((video) => video.slug === trick.slug)) {
      withoutVideo.push(trick.slug);
    }
  }

  videos.sort((a, b) => {
    const bySection = a.section.localeCompare(b.section, 'en');
    if (bySection !== 0) {
      return bySection;
    }
    return a.slug.localeCompare(b.slug, 'en');
  });

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(videos, null, 2)}\n`, 'utf8');

  console.log(`Trucos procesados: ${tricks.length}`);
  console.log(`Videos encontrados: ${videos.length}`);
  console.log(`Trucos sin video: ${withoutVideo.length}`);
  console.log(`Errores de red: ${errors.length}`);
  if (errors.length > 0) {
    console.log(`Errores (maximo ${MAX_LIMIT_REPORTED}):`);
    for (const error of errors.slice(0, MAX_LIMIT_REPORTED)) {
      console.log(`- ${error}`);
    }
  }
  console.log(`Escrito en ${OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  console.error(`Error fatal: ${describeError(error)}`);
  process.exitCode = 1;
});
