import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { eq } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks } from '../schema';
import { loadEnvFile } from './load-env';

// Aplica las traducciones al espanol de las notas de Loopkicks desde el archivo curado
// `translations/loopkicks-notes-es.json` (clave: id de truco). Idempotente: reescribe el
// valor por id y no toca el resto. El texto original de Loopkicks queda intacto en
// `loopkicks_notes`; esto solo puebla `loopkicks_notes_es`.

const TRANSLATIONS_FILE = new URL('./translations/loopkicks-notes-es.json', import.meta.url);

async function loadTranslations(): Promise<Record<string, string> | null> {
  try {
    const raw = await readFile(fileURLToPath(TRANSLATIONS_FILE), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
    return null;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const translations = await loadTranslations();
  if (translations === null) {
    console.log('No hay loopkicks-notes-es.json valido; no se escribe nada.');
    return;
  }

  const entries = Object.entries(translations).filter(
    ([, value]) => typeof value === 'string' && value.trim() !== '',
  );
  if (entries.length === 0) {
    console.log('El JSON de traducciones esta vacio; no se escribe nada.');
    return;
  }

  const db = getDb();
  let applied = 0;
  const missing: string[] = [];
  for (const [id, value] of entries) {
    const result = await db
      .update(tricks)
      .set({ loopkicksNotesEs: value, updatedAt: new Date() })
      .where(eq(tricks.id, id))
      .returning({ id: tricks.id });
    if (result.length === 0) {
      missing.push(id);
      continue;
    }
    applied += 1;
  }

  console.log(`Traducciones de notas de Loopkicks aplicadas: ${applied}`);
  if (missing.length > 0) {
    console.log(`Claves sin fila en la base (${missing.length}):`);
    for (const item of missing.slice(0, 20)) {
      console.log(`- ${item}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al aplicar traducciones de notas de Loopkicks: ${message}`);
  process.exitCode = 1;
});
