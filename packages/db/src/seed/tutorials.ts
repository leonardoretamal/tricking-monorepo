import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { getDb } from '../client';
import { tutorials } from '../schema';
import { loadEnvFile } from './load-env';

// Semilla de la Fase 13. Lee los tutoriales de Kojo's Trick Lab extraidos del sitio
// (apps/scraper/data/kojo-tutorials.json) y hace upsert idempotente por externalId.
// El driver neon-http no soporta transacciones, por eso se escriben fila por fila.
//
// El contenido de Kojo viene en ingles: se guarda tal cual (regla 13.8, no se traduce)
// y se marca locale 'en' para reflejar el idioma real del contenido.

interface ScrapedTutorial {
  externalId: string;
  title: string;
  author: string | null;
  vimeoId: string | null;
  permalink: string | null;
  postedAt: Date | null;
}

const TUTORIALS_FILE = new URL(
  '../../../../apps/scraper/data/kojo-tutorials.json',
  import.meta.url,
);

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

function parseTutorials(raw: unknown): ScrapedTutorial[] {
  if (!Array.isArray(raw)) {
    throw new Error('El JSON de tutoriales no es un arreglo');
  }

  const result: ScrapedTutorial[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }
    const { externalId, title, permalink, postedAt, author, vimeoId } = entry;
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
    });
  }
  return result;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const rawJson = await readFile(fileURLToPath(TUTORIALS_FILE), 'utf8');
  const scraped = parseTutorials(JSON.parse(rawJson) as unknown);

  if (scraped.length === 0) {
    console.warn('El JSON de tutoriales esta vacio: no hay nada que sembrar.');
    return;
  }

  const db = getDb();

  let count = 0;
  for (const tutorial of scraped) {
    await db
      .insert(tutorials)
      .values({
        source: 'kojostricklab',
        externalId: tutorial.externalId,
        caption: tutorial.title,
        author: tutorial.author,
        vimeoId: tutorial.vimeoId,
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
          permalink: tutorial.permalink,
          postedAt: tutorial.postedAt,
          deletedAt: null,
          updatedAt: new Date(),
        },
      });
    count += 1;
  }

  console.log(`Tutoriales: ${count} sembrados`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar tutoriales: ${message}`);
  process.exitCode = 1;
});
