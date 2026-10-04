import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { eq } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks } from '../schema';
import { loadEnvFile } from './load-env';

// Semilla de las descripciones tecnicas de Loopkicks (Fase 14). Lee
// apps/scraper/data/loopkicks-notes.json y actualiza `tricks.loopkicks_notes` por
// loopkicksSlug. Es texto de Loopkicks: se muestra citado, con credito y enlace.

interface NoteRecord {
  slug: string;
  description: string | null;
}

const NOTES_FILE = new URL('../../../../apps/scraper/data/loopkicks-notes.json', import.meta.url);

function parseNotes(raw: unknown): NoteRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const result: NoteRecord[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const record = item as Record<string, unknown>;
    const slug = typeof record.slug === 'string' ? record.slug : null;
    if (slug === null) {
      continue;
    }
    result.push({
      slug,
      description:
        typeof record.description === 'string' && record.description.trim() !== ''
          ? record.description
          : null,
    });
  }
  return result;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(fileURLToPath(NOTES_FILE), 'utf8')) as unknown;
  } catch {
    console.log('No hay loopkicks-notes.json; no se escribe nada.');
    return;
  }

  const notes = parseNotes(raw);
  if (notes.length === 0) {
    console.log('El JSON de notas esta vacio; no se escribe nada.');
    return;
  }

  const db = getDb();
  let applied = 0;
  for (const note of notes) {
    await db
      .update(tricks)
      .set({ loopkicksNotes: note.description, updatedAt: new Date() })
      .where(eq(tricks.loopkicksSlug, note.slug));
    applied += 1;
  }

  console.log(`Notas de Loopkicks aplicadas: ${applied}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar notas de Loopkicks: ${message}`);
  process.exitCode = 1;
});
