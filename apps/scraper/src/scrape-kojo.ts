import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, type CheerioAPI } from 'cheerio';

// Scraping de los tutoriales de Kojo's Trick Lab (Fase 13). El sitio es una SPA de Vue:
// el HTML inicial solo trae el contenedor vacio y el bundle de JavaScript, por eso la
// fuente primaria es la API publica del propio dominio (misma que consume el sitio) y
// cheerio queda como respaldo para una version server-rendered y para inspeccionar la
// estructura. El resultado se vuelca a JSON en apps/scraper/data.
//
// Instagram con insta-fetcher y Upstash (QStash/Redis) es un respaldo opcional: no se
// ejecuta aqui porque requiere credenciales. Si el sitio no entrega datos usables, se
// escribe un JSON vacio y se reporta; nunca se inventa contenido.

interface KojoTutorialRecord {
  externalId: string;
  title: string;
  permalink: string;
  postedAt: string | null;
  vimeoId: string | null;
  author: string | null;
  categories: string[];
}

const SITE_ORIGIN = 'https://kojostricklab.com';
const USER_AGENT = 'TrickingMonorepoScraper/0.1 (+https://kojostricklab.com)';
const OUTPUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'kojo-tutorials.json',
);

// Categoria "Trick Tutorials" del sitio y sus hijas (Beginner, Intermediate, Advanced,
// Elite). Es el conjunto que corresponde a los tutoriales de trucos; el resto de las
// categorias (Mindset, Nutrition, Documentaries, etc.) queda fuera de esta fase.
const TRICK_TUTORIAL_CATEGORY_IDS = new Set([6, 7, 8, 9, 10]);

const RECENT_VIDEOS_ENDPOINT = `${SITE_ORIGIN}/api/user/get-more-recent-videos`;
const PAGE_LIMIT = 500;
const MAX_PAGES = 50;
const MIN_TIMESTAMP = Date.UTC(2000, 0, 1) / 1000;
const MAX_TIMESTAMP = Date.UTC(2100, 0, 1) / 1000;

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delayBetweenRequests(): Promise<void> {
  const milliseconds = 400 + Math.floor(Math.random() * 401);
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al descargar ${url}`);
  }
  return await response.text();
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al pedir ${url}`);
  }
  return (await response.json()) as unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(source: Record<string, unknown>, key: string): string | null {
  const value = source[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function readNumber(source: Record<string, unknown>, key: string): number | null {
  const value = source[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

// El nombre del archivo de miniatura termina en la marca de tiempo de subida del video
// (por ejemplo "295_1563117370"). Es la unica senal de fecha que expone la API publica;
// se usa como fecha de publicacion aproximada y se valida contra un rango razonable.
function postedAtFromThumbnail(thumbnails: Record<string, unknown> | null): string | null {
  if (thumbnails === null) {
    return null;
  }
  const small = readString(thumbnails, 'small') ?? readString(thumbnails, 'big');
  if (small === null) {
    return null;
  }
  const match = small.match(/(\d{9,11})$/);
  if (!match) {
    return null;
  }
  const seconds = Number.parseInt(match[1] ?? '', 10);
  if (!Number.isFinite(seconds) || seconds < MIN_TIMESTAMP || seconds > MAX_TIMESTAMP) {
    return null;
  }
  return new Date(seconds * 1000).toISOString();
}

function readCategories(source: Record<string, unknown>): { ids: number[]; names: string[] } {
  const ids: number[] = [];
  const names: string[] = [];
  const raw = source['categories'];
  if (!Array.isArray(raw)) {
    return { ids, names };
  }
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }
    const id = readNumber(entry, 'id');
    const name = readString(entry, 'name');
    if (id !== null) {
      ids.push(id);
    }
    if (name !== null) {
      names.push(name);
    }
  }
  return { ids, names };
}

function toRecord(video: Record<string, unknown>): KojoTutorialRecord | null {
  const id = readNumber(video, 'id');
  const title = readString(video, 'title');
  if (id === null || title === null) {
    return null;
  }

  const { ids, names } = readCategories(video);
  if (!ids.some((categoryId) => TRICK_TUTORIAL_CATEGORY_IDS.has(categoryId))) {
    return null;
  }

  const routeString = readString(video, 'route_string') ?? String(id);
  const thumbnails = isRecord(video['thumbnails']) ? video['thumbnails'] : null;

  return {
    externalId: `kojo-video-${id}`,
    title,
    permalink: `${SITE_ORIGIN}/video/${encodeURIComponent(routeString)}`,
    postedAt: postedAtFromThumbnail(thumbnails),
    vimeoId: readString(video, 'vimeo_id'),
    author: readString(video, 'authors'),
    categories: names,
  };
}

// Respaldo para una version server-rendered: si el HTML trae enlaces directos a los
// videos, se extraen con cheerio. Hoy la SPA no los trae y esta funcion devuelve [].
function extractTutorialsFromHtml($: CheerioAPI): KojoTutorialRecord[] {
  const records: KojoTutorialRecord[] = [];
  const seen = new Set<string>();

  $('a[href*="/video/"]').each((_, element) => {
    const href = $(element).attr('href');
    if (href === undefined) {
      return;
    }
    const slug = href.split('/video/')[1]?.split(/[/?#]/)[0];
    const title = $(element).text().replace(/\s+/g, ' ').trim();
    if (!slug || title.length === 0 || seen.has(slug)) {
      return;
    }
    seen.add(slug);
    records.push({
      externalId: `kojo-video-${slug}`,
      title,
      permalink: `${SITE_ORIGIN}/video/${slug}`,
      postedAt: null,
      vimeoId: null,
      author: null,
      categories: [],
    });
  });

  return records;
}

function parseVideoPage(payload: unknown): { videos: unknown[]; lastBatch: boolean } {
  if (!isRecord(payload)) {
    return { videos: [], lastBatch: true };
  }
  const videos = Array.isArray(payload['videos']) ? payload['videos'] : [];
  const lastBatch = payload['lastBatch'] === true;
  return { videos, lastBatch };
}

async function fetchTutorialsFromApi(): Promise<KojoTutorialRecord[]> {
  const byExternalId = new Map<string, KojoTutorialRecord>();

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const skip = page * PAGE_LIMIT;
    const payload = await fetchJson(`${RECENT_VIDEOS_ENDPOINT}?skip=${skip}&limit=${PAGE_LIMIT}`);
    const { videos, lastBatch } = parseVideoPage(payload);

    let added = 0;
    for (const entry of videos) {
      if (!isRecord(entry)) {
        continue;
      }
      const data = entry['data'];
      if (!isRecord(data)) {
        continue;
      }
      const record = toRecord(data);
      if (record && !byExternalId.has(record.externalId)) {
        byExternalId.set(record.externalId, record);
        added += 1;
      }
    }

    console.log(`API pagina ${page + 1}: ${videos.length} videos, ${added} tutoriales nuevos`);

    if (lastBatch || videos.length === 0) {
      break;
    }
    await delayBetweenRequests();
  }

  return [...byExternalId.values()];
}

function sortRecords(records: KojoTutorialRecord[]): KojoTutorialRecord[] {
  return [...records].sort((a, b) => {
    const dateA = a.postedAt ?? '';
    const dateB = b.postedAt ?? '';
    if (dateA !== dateB) {
      return dateB.localeCompare(dateA);
    }
    return a.title.localeCompare(b.title, 'en');
  });
}

async function main(): Promise<void> {
  console.log("Inicio de scraping de Kojo's Trick Lab");

  let apiRecords: KojoTutorialRecord[] = [];
  try {
    apiRecords = await fetchTutorialsFromApi();
  } catch (error) {
    console.warn(`No se pudo leer la API publica del sitio: ${describeError(error)}`);
  }

  let htmlRecords: KojoTutorialRecord[] = [];
  try {
    const shellHtml = await fetchText(`${SITE_ORIGIN}/`);
    htmlRecords = extractTutorialsFromHtml(load(shellHtml));
    console.log(`Enlaces de tutoriales en el HTML inicial: ${htmlRecords.length}`);
  } catch (error) {
    console.warn(`No se pudo descargar el HTML del sitio: ${describeError(error)}`);
  }

  const records = sortRecords(apiRecords.length > 0 ? apiRecords : htmlRecords);

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(records, null, 2)}\n`, 'utf8');

  if (records.length === 0) {
    console.warn('No se extrajeron tutoriales usables; se escribio un JSON vacio.');
  }
  console.log(`Total: ${records.length} tutoriales escritos en ${OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  console.error(`Error fatal: ${describeError(error)}`);
  process.exitCode = 1;
});
