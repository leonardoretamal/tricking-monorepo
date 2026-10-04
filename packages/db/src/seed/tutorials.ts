import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { inArray } from 'drizzle-orm';

import { getDb } from '../client';
import { contentBlocks, tricks, tutorialTricks, tutorials } from '../schema';
import { loadEnvFile } from './load-env';
import { normalizeKey } from './normalize';

// Semilla de las tecnicas de Kojo (Fase 13, rediseno). De Kojo NO se toman los videos:
// se guarda el indice de tecnicas (titulo, autor, nivel, fecha, permalink) y se le suman
// tips PROPIOS (contenido original del proyecto, en kojo/tips.json). Cada tecnica se
// empareja con los trucos del catalogo (kojo/matches.json como override curado sobre el
// emparejamiento automatico por nombre) en la tabla tutorial_tricks. El resumen "General"
// vive en content_blocks.
//
// Idempotente: se reemplazan los emparejamientos y se hace upsert de tutoriales y bloques.
// El driver neon-http no soporta transacciones, por eso se escribe fila por fila.

interface ScrapedTutorial {
  externalId: string;
  title: string;
  author: string | null;
  vimeoId: string | null;
  permalink: string | null;
  postedAt: Date | null;
  level: string | null;
}

const TUTORIALS_FILE = new URL(
  '../../../../apps/scraper/data/kojo-tutorials.json',
  import.meta.url,
);
const TIPS_FILE = new URL('./kojo/tips.json', import.meta.url);
const MATCHES_FILE = new URL('./kojo/matches.json', import.meta.url);
const GENERAL_FILE = new URL('./kojo/general.json', import.meta.url);

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Elite'] as const;
const MIN_MATCH_LENGTH = 4;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePostedAt(value: unknown): Date | null {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function pickLevel(categories: unknown): string | null {
  if (!Array.isArray(categories)) {
    return null;
  }
  for (const category of categories) {
    if (typeof category === 'string' && (LEVELS as readonly string[]).includes(category)) {
      return category;
    }
  }
  return null;
}

function parseTutorials(raw: unknown): ScrapedTutorial[] {
  if (!Array.isArray(raw)) {
    throw new Error('El JSON de tutoriales no es un arreglo');
  }

  const result: ScrapedTutorial[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }
    const { externalId, title, permalink, postedAt, author, vimeoId, categories } = entry;
    if (typeof externalId !== 'string' || externalId.trim() === '') {
      continue;
    }
    if (typeof title !== 'string' || title.trim() === '') {
      continue;
    }
    result.push({
      externalId,
      title,
      author: typeof author === 'string' && author.trim() !== '' ? author : null,
      vimeoId: typeof vimeoId === 'string' && vimeoId.trim() !== '' ? vimeoId : null,
      permalink: typeof permalink === 'string' && permalink.trim() !== '' ? permalink : null,
      postedAt: parsePostedAt(postedAt),
      level: pickLevel(categories),
    });
  }
  return result;
}

async function readJson(path: URL): Promise<unknown> {
  try {
    return JSON.parse(await readFile(fileURLToPath(path), 'utf8')) as unknown;
  } catch {
    return null;
  }
}

function parseTips(raw: unknown): Map<string, { es: string | null; en: string | null }> {
  const map = new Map<string, { es: string | null; en: string | null }>();
  if (!isRecord(raw)) {
    return map;
  }
  for (const [externalId, value] of Object.entries(raw)) {
    if (!isRecord(value)) {
      continue;
    }
    map.set(externalId, {
      es: typeof value.es === 'string' && value.es.trim() !== '' ? value.es : null,
      en: typeof value.en === 'string' && value.en.trim() !== '' ? value.en : null,
    });
  }
  return map;
}

function parseMatches(raw: unknown): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (!isRecord(raw)) {
    return map;
  }
  for (const [externalId, value] of Object.entries(raw)) {
    if (Array.isArray(value)) {
      const ids = value.filter((item): item is string => typeof item === 'string');
      if (ids.length > 0) {
        map.set(externalId, ids);
      }
    }
  }
  return map;
}

// Empareja un titulo con los trucos del catalogo cuyo nombre normalizado aparece como
// subcadena. Se prueban los nombres mas largos primero para no matchear un nombre que ya
// forma parte de uno mas largo.
function matchTricks(
  title: string,
  tricksByName: Map<string, string>,
  namesByLength: string[],
): string[] {
  const normalized = normalizeKey(title);
  const matchedNames: string[] = [];
  for (const name of namesByLength) {
    if (name.length < MIN_MATCH_LENGTH) {
      continue;
    }
    if (normalized.includes(name) && !matchedNames.some((longer) => longer.includes(name))) {
      matchedNames.push(name);
    }
  }
  const ids = new Set<string>();
  for (const name of matchedNames) {
    const id = tricksByName.get(name);
    if (id !== undefined) {
      ids.add(id);
    }
  }
  return [...ids];
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const scraped = parseTutorials(await readJson(TUTORIALS_FILE));
  if (scraped.length === 0) {
    console.warn('El JSON de tutoriales esta vacio: no hay nada que sembrar.');
    return;
  }

  const tips = parseTips(await readJson(TIPS_FILE));
  const overrides = parseMatches(await readJson(MATCHES_FILE));
  const general = await readJson(GENERAL_FILE);

  const db = getDb();

  const tutorialIdByExternalId = new Map<string, number>();
  for (const tutorial of scraped) {
    const tip = tips.get(tutorial.externalId);
    const [row] = await db
      .insert(tutorials)
      .values({
        source: 'kojostricklab',
        externalId: tutorial.externalId,
        caption: tutorial.title,
        author: tutorial.author,
        vimeoId: tutorial.vimeoId,
        level: tutorial.level,
        tips: tip?.en ?? null,
        tipsEs: tip?.es ?? null,
        locale: 'en',
        permalink: tutorial.permalink,
        postedAt: tutorial.postedAt,
      })
      .onConflictDoUpdate({
        target: tutorials.externalId,
        set: {
          caption: tutorial.title,
          author: tutorial.author,
          vimeoId: tutorial.vimeoId,
          level: tutorial.level,
          tips: tip?.en ?? null,
          tipsEs: tip?.es ?? null,
          permalink: tutorial.permalink,
          postedAt: tutorial.postedAt,
          deletedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning({ id: tutorials.id });
    if (row !== undefined) {
      tutorialIdByExternalId.set(tutorial.externalId, row.id);
    }
  }

  // Emparejamiento tecnica -> truco.
  const trickRows = await db.select({ id: tricks.id, name: tricks.name }).from(tricks);
  const tricksByName = new Map<string, string>();
  for (const row of trickRows) {
    tricksByName.set(normalizeKey(row.name), row.id);
  }
  const namesByLength = [...tricksByName.keys()].sort((a, b) => b.length - a.length);

  const links: { tutorialId: number; trickId: string }[] = [];
  for (const tutorial of scraped) {
    const tutorialId = tutorialIdByExternalId.get(tutorial.externalId);
    if (tutorialId === undefined) {
      continue;
    }
    const matched =
      overrides.get(tutorial.externalId) ??
      matchTricks(tutorial.title, tricksByName, namesByLength);
    for (const trickId of new Set(matched)) {
      links.push({ tutorialId, trickId });
    }
  }

  const tutorialIds = [...tutorialIdByExternalId.values()];
  for (let index = 0; index < tutorialIds.length; index += 500) {
    const batch = tutorialIds.slice(index, index + 500);
    if (batch.length > 0) {
      await db.delete(tutorialTricks).where(inArray(tutorialTricks.tutorialId, batch));
    }
  }
  for (let index = 0; index < links.length; index += 500) {
    const batch = links.slice(index, index + 500);
    if (batch.length > 0) {
      await db.insert(tutorialTricks).values(batch).onConflictDoNothing();
    }
  }

  // Bloque general.
  if (isRecord(general)) {
    for (const locale of ['es', 'en'] as const) {
      const content = general[locale];
      if (typeof content === 'string' && content.trim() !== '') {
        await db
          .insert(contentBlocks)
          .values({ key: 'techniques_general', locale, content })
          .onConflictDoUpdate({
            target: [contentBlocks.key, contentBlocks.locale],
            set: { content, updatedAt: new Date() },
          });
      }
    }
  }

  const linkedTutorials = new Set(links.map((link) => link.tutorialId)).size;
  console.log(
    `Tecnicas: ${tutorialIdByExternalId.size} sembradas, ${links.length} enlaces tecnica-truco (${linkedTutorials} tecnicas con truco).`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar tutoriales: ${message}`);
  process.exitCode = 1;
});
