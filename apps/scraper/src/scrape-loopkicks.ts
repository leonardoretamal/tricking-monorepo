import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

interface TrickRecord {
  slug: string;
  name: string;
  section: string;
}

interface TrickSection {
  name: string;
  url: string;
}

const SECTIONS: readonly TrickSection[] = [
  {
    name: 'vertical-kicks',
    url: 'https://www.loopkickstricking.com/tricktionary/vertical-kicks',
  },
  {
    name: 'backward-tricks',
    url: 'https://www.loopkickstricking.com/tricktionary/backward-tricks',
  },
  {
    name: 'forward-tricks',
    url: 'https://www.loopkickstricking.com/tricktionary/forward-tricks',
  },
  {
    name: 'inside-tricks',
    url: 'https://www.loopkickstricking.com/tricktionary/inside-tricks',
  },
  {
    name: 'outside-tricks',
    url: 'https://www.loopkickstricking.com/tricktionary/outside-tricks',
  },
];

const USER_AGENT = 'TrickingMonorepoScraper/0.1 (+https://www.loopkickstricking.com)';
const TRICK_LINK_PREFIX = '/tricks/';
const OUTPUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'data',
  'loopkicks-tricks.json',
);

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delayBetweenSections(): Promise<void> {
  const milliseconds = 500 + Math.floor(Math.random() * 501);
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

async function fetchHtml(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept-Language': 'en',
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} al descargar ${url}`);
  }
  return await response.text();
}

async function fetchSectionHtml(section: TrickSection): Promise<string> {
  try {
    return await fetchHtml(section.url);
  } catch (error) {
    console.warn(`Reintento para ${section.name}: ${describeError(error)}`);
    return await fetchHtml(section.url);
  }
}

function extractTricks(html: string, section: string): TrickRecord[] {
  const $ = load(html);
  const records: TrickRecord[] = [];

  $(`a[href^="${TRICK_LINK_PREFIX}"]`).each((_, element) => {
    const href = $(element).attr('href');
    if (href === undefined) {
      return;
    }

    const rawSlug = href.slice(TRICK_LINK_PREFIX.length);
    const slug = rawSlug.split(/[/?#]/)[0] ?? '';
    if (slug.length === 0) {
      return;
    }

    const heading = $(element).find('h1.wrapped-header').first().text().trim();
    const name = heading.length > 0 ? heading : $(element).text().trim();
    if (name.length === 0) {
      return;
    }

    records.push({ slug, name, section });
  });

  return records;
}

async function main(): Promise<void> {
  console.log('Inicio de scraping de Loopkicks');

  const bySlug = new Map<string, TrickRecord>();

  for (let index = 0; index < SECTIONS.length; index += 1) {
    const section = SECTIONS[index];
    if (section === undefined) {
      continue;
    }

    const html = await fetchSectionHtml(section);
    const found = extractTricks(html, section.name);

    let added = 0;
    for (const trick of found) {
      if (!bySlug.has(trick.slug)) {
        bySlug.set(trick.slug, trick);
        added += 1;
      }
    }

    console.log(`Seccion ${section.name}: ${found.length} enlaces, ${added} trucos unicos`);

    if (index < SECTIONS.length - 1) {
      await delayBetweenSections();
    }
  }

  const tricks = [...bySlug.values()].sort((a, b) => {
    const bySection = a.section.localeCompare(b.section, 'en');
    if (bySection !== 0) {
      return bySection;
    }
    return a.name.localeCompare(b.name, 'en');
  });

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(tricks, null, 2)}\n`, 'utf8');
  console.log(`Total: ${tricks.length} trucos escritos en ${OUTPUT_PATH}`);
}

main().catch((error: unknown) => {
  console.error(`Error fatal: ${describeError(error)}`);
  process.exitCode = 1;
});
