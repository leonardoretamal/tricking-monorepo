import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load, type CheerioAPI } from 'cheerio';

// Scraping de las tres secciones semanticas de Loopkicks (variations, transitions y
// stances). Son la fuente primaria de la clasificacion; TrickingAPI se usa como
// complemento en la semilla. El resultado se vuelca a JSON en apps/scraper/data.

interface VariationRecord {
  slug: string;
  name: string;
  description: string;
  examples: string[];
}

interface TransitionRecord {
  slug: string;
  name: string;
  group: string;
  description: string;
  examples: string[];
}

interface StanceRecord {
  slug: string;
  name: string;
  description: string;
  examples: string[];
}

interface SemanticSource {
  key: 'variations' | 'transitions' | 'stances';
  url: string;
}

const SOURCES: readonly SemanticSource[] = [
  {
    key: 'variations',
    url: 'https://www.loopkickstricking.com/tricktionary/variations',
  },
  {
    key: 'transitions',
    url: 'https://www.loopkickstricking.com/tricktionary/transitions',
  },
  {
    key: 'stances',
    url: 'https://www.loopkickstricking.com/tricktionary/stances',
  },
];

const USER_AGENT = 'TrickingMonorepoScraper/0.1 (+https://www.loopkickstricking.com)';
const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function delayBetweenSections(): Promise<void> {
  const milliseconds = 500 + Math.floor(Math.random() * 501);
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function cleanText(value: string): string {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\u200d/g, '')
    .trim();
}

// Extrae el texto de un parrafo conservando los <br> como saltos de linea, para no
// concatenar varios ejemplos en una sola cadena. Cada linea se normaliza por separado.
function paragraphText($: CheerioAPI, element: Parameters<CheerioAPI>[0]): string {
  const clone = $(element).clone();
  clone.find('br').replaceWith('\n');
  return clone
    .text()
    .split('\n')
    .map((line) =>
      line
        .replace(/\s+/g, ' ')
        .replace(/\u200d/g, '')
        .trim(),
    )
    .filter((line) => line.length > 0)
    .join('\n');
}

function splitExamples(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter((line) => line.length > 0);
}

function separateParagraphs(paragraphs: string[]): {
  description: string;
  examples: string[];
} {
  const descriptionParts: string[] = [];
  const examples: string[] = [];

  for (const paragraph of paragraphs) {
    const match = paragraph.match(/^Examples?\b[^:]*:\s*(.*)$/is);
    if (match) {
      examples.push(...splitExamples(match[1] ?? ''));
      continue;
    }
    descriptionParts.push(paragraph);
  }

  return {
    description: cleanText(descriptionParts.join(' ')),
    examples,
  };
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

function parseVariations($: CheerioAPI): VariationRecord[] {
  const records: VariationRecord[] = [];

  $('.other-section .w-dyn-item').each((_, element) => {
    const item = $(element);
    const name = cleanText(item.find('h2.tricktionary-sub-heading').first().text());
    if (name.length === 0) {
      return;
    }

    const paragraphs = item
      .find('.rich-text-block p')
      .map((__, p) => paragraphText($, p))
      .get()
      .filter((text) => text.length > 0);

    const { description, examples } = separateParagraphs(paragraphs);
    records.push({ slug: slugify(name), name, description, examples });
  });

  return records;
}

function parseTransitions($: CheerioAPI): TransitionRecord[] {
  const records: TransitionRecord[] = [];

  $('.tabs-2')
    .first()
    .children('.w-tab-content')
    .children('.tab-pane')
    .each((_, pane) => {
      const group = cleanText($(pane).children('h2.tab-heading').first().text());

      $(pane)
        .find('.tab-container')
        .each((__, container) => {
          const item = $(container);
          const name = cleanText(item.children('h2.tab-heading').first().text());
          if (name.length === 0) {
            return;
          }

          const paragraphs = item
            .children('p.tab-paragraph')
            .map((___, p) => paragraphText($, p))
            .get()
            .filter((text) => text.length > 0);

          const { description, examples } = separateParagraphs(paragraphs);
          records.push({
            slug: slugify(name),
            name,
            group: group.length > 0 ? group : 'unified',
            description,
            examples,
          });
        });
    });

  return records;
}

function parseStances($: CheerioAPI): StanceRecord[] {
  const records: StanceRecord[] = [];

  $('.tab-container.description').each((_, element) => {
    const item = $(element);
    const name = cleanText(item.children('h2.tricktionary-sub-heading').first().text());
    if (name.length === 0) {
      return;
    }

    const paragraphs = item
      .children('p.tab-paragraph')
      .map((__, p) => paragraphText($, p))
      .get()
      .filter((text) => text.length > 0);

    const { description, examples } = separateParagraphs(paragraphs);
    records.push({ slug: slugify(name), name, description, examples });
  });

  return records;
}

async function writeJson(fileName: string, data: unknown): Promise<void> {
  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(join(OUTPUT_DIR, fileName), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

async function main(): Promise<void> {
  console.log('Inicio de scraping semantico de Loopkicks');

  for (let index = 0; index < SOURCES.length; index += 1) {
    const source = SOURCES[index];
    if (source === undefined) {
      continue;
    }

    const html = await fetchHtml(source.url);
    const $ = load(html);

    if (source.key === 'variations') {
      const variations = parseVariations($);
      await writeJson('loopkicks-variations.json', variations);
      console.log(`Variations: ${variations.length} escritas`);
    } else if (source.key === 'transitions') {
      const transitions = parseTransitions($);
      await writeJson('loopkicks-transitions.json', transitions);
      console.log(`Transitions: ${transitions.length} escritas`);
    } else {
      const stances = parseStances($);
      await writeJson('loopkicks-stances.json', stances);
      console.log(`Stances: ${stances.length} escritas`);
    }

    if (index < SOURCES.length - 1) {
      await delayBetweenSections();
    }
  }
}

main().catch((error: unknown) => {
  console.error(`Error fatal: ${describeError(error)}`);
  process.exitCode = 1;
});
