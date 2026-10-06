import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { eq } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks } from '../schema';
import { loadEnvFile } from './load-env';

// Descripciones PROPIAS de "como se hace" (contenido original del proyecto, no de las
// fuentes). Viven en `how-to/` como uno o varios archivos JSON indexados por id de truco
// (asi el contenido entra por lotes). Se leen en orden alfabetico y se fusionan: si el
// mismo id aparece en dos archivos, gana el ultimo. Se aplican de forma idempotente con
// `pnpm --filter @tricking/db db:how-to`.

const HOW_TO_DIR = new URL('./how-to/', import.meta.url);

interface HowToEntry {
  es?: unknown;
  en?: unknown;
}

async function loadMergedEntries(): Promise<{
  merged: Record<string, HowToEntry>;
  duplicates: string[];
}> {
  const dir = fileURLToPath(HOW_TO_DIR);
  let files: string[];
  try {
    files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort();
  } catch {
    return { merged: {}, duplicates: [] };
  }
  const merged: Record<string, HowToEntry> = {};
  const duplicates: string[] = [];
  for (const file of files) {
    const raw = await readFile(join(dir, file), 'utf8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      throw new Error(`El archivo ${file} no es JSON valido.`);
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(`El archivo ${file} no es un objeto indexado por id de truco.`);
    }
    for (const key of Object.keys(parsed as Record<string, HowToEntry>)) {
      if (key in merged) {
        duplicates.push(key);
      }
    }
    Object.assign(merged, parsed as Record<string, HowToEntry>);
  }
  return { merged, duplicates };
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  let merged: Record<string, HowToEntry>;
  let duplicates: string[];
  try {
    const loaded = await loadMergedEntries();
    merged = loaded.merged;
    duplicates = loaded.duplicates;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
    return;
  }

  const entries = Object.entries(merged);
  if (entries.length === 0) {
    console.log('No hay archivos de how-to; no se escribe nada.');
    return;
  }

  const db = getDb();

  let applied = 0;
  const missing: string[] = [];
  for (const [trickId, value] of entries) {
    const es = typeof value.es === 'string' && value.es.trim() !== '' ? value.es : null;
    const en = typeof value.en === 'string' && value.en.trim() !== '' ? value.en : null;
    if (es === null && en === null) {
      continue;
    }
    const result = await db
      .update(tricks)
      .set({ howToEs: es, howTo: en, updatedAt: new Date() })
      .where(eq(tricks.id, trickId))
      .returning({ id: tricks.id });
    if (result.length === 0) {
      missing.push(trickId);
      continue;
    }
    applied += 1;
  }

  console.log(`Descripciones propias aplicadas: ${applied}`);
  if (duplicates.length > 0) {
    console.log(`Ids repetidos entre archivos (gano el ultimo): ${duplicates.join(', ')}`);
  }
  if (missing.length > 0) {
    console.log(`Ids sin truco en la base (${missing.length}):`);
    for (const id of missing.slice(0, 20)) {
      console.log(`- ${id}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al aplicar descripciones propias: ${message}`);
  process.exitCode = 1;
});
