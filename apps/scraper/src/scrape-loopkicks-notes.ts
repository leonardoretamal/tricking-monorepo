import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

// Scraper de las descripciones tecnicas publicas de Loopkicks (Fase 14). Por cada truco
// de loopkicks-tricks.json descarga su ficha /tricks/<slug> y extrae la descripcion
// (p.paragraph-5), el nombre alternativo y el tricker. Volca a loopkicks-notes.json, que
// consume la semilla. Es texto de Loopkicks: se muestra citado con credito y enlace.

interface TrickRef {
  slug: string;
  name: string;
  section: string;
}

interface NoteRecord {
  slug: string;
  name: string;
  section: string;
  description: string | null;
  otherNames: string | null;
  tricker: string | null;
}

const SITE_ORIGIN = 'https://www.loopkickstricking.com';
const USER_AGENT = 'TrickingMonorepoScraper/0.1 (+https://www.loopkickstricking.com)';
const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const TRICKS_PATH = join(DATA_DIR, 'loopkicks-tricks.json');
const OUTPUT_PATH = join(DATA_DIR, 'loopkicks-notes.json');
const CONCURRENCY = 3;
const REQUEST_TIMEOUT_MS = 20_000;

function clean(value: string | undefined): string | null {
  if (value === undefined) {
    return null;
  }
  const text = value.replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
}

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'en' },
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } finally {
    clearTimeout(timer);
  }
}

async function scrapeNote(trick: TrickRef): Promise<NoteRecord> {
  const url = `${SITE_ORIGIN}/tricks/${trick.slug}`;
  let html: string | null = null;
  try {
    html = await fetchHtml(url);
  } catch {
    try {
      html = await fetchHtml(url);
    } catch {
      html = null;
    }
  }

  const base: NoteRecord = {
    slug: trick.slug,
    name: trick.name,
    section: trick.section,
    description: null,
    otherNames: null,
    tricker: null,
  };

  if (html === null) {
    return base;
  }

  const $ = load(html);
  const container = $('.tricking-page---main---description');

  const description = clean(container.find('p.paragraph-5').first().text());
  const otherNames = clean(container.find('.nickname-wrapper .nickname').last().text());
  const tricker = clean(
    container.find('.prereq-wrapper .nickname.title.tricker').next('.nickname').text(),
  );

  return {
    ...base,
    description,
    otherNames: otherNames === '' ? null : otherNames,
    tricker,
  };
}

async function main(): Promise<void> {
  const raw = JSON.parse(await readFile(TRICKS_PATH, 'utf8')) as TrickRef[];
  console.log(`Scrapeando descripciones de ${raw.length} trucos de Loopkicks`);

  const results: NoteRecord[] = [];
  let index = 0;
  let done = 0;

  async function worker(): Promise<void> {
    while (index < raw.length) {
      const current = raw[index];
      index += 1;
      if (current === undefined) {
        continue;
      }
      const record = await scrapeNote(current);
      results.push(record);
      done += 1;
      if (done % 50 === 0) {
        console.log(`  ${done}/${raw.length}`);
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  results.sort((a, b) => a.slug.localeCompare(b.slug, 'en'));
  const withText = results.filter((record) => record.description !== null).length;

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(results, null, 2)}\n`, 'utf8');
  console.log(
    `Total: ${results.length} trucos, ${withText} con descripcion. Escrito en ${OUTPUT_PATH}`,
  );
}

main().catch((error: unknown) => {
  console.error(`Error fatal: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
