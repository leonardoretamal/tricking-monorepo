import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { eq } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks } from '../schema';
import { DIFFICULTY_BY_TRICK } from './difficulty/index';

// Aplica la dificultad curada a `tricks.difficulty`. Idempotente: si el valor ya coincide
// no escribe. Neon con neon-http no soporta transacciones, por eso las actualizaciones van
// en secuencia y acotadas.

function loadEnvFile(path: string): void {
  let content: string;
  try {
    content = readFileSync(path, 'utf8');
  } catch {
    return;
  }

  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const separator = line.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (key !== '' && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main(): Promise<void> {
  loadEnvFile(join(process.cwd(), '.env'));

  const db = getDb();
  const entries = Object.entries(DIFFICULTY_BY_TRICK);

  let updated = 0;
  const missing: string[] = [];

  for (const [id, difficulty] of entries) {
    const result = await db
      .update(tricks)
      .set({ difficulty, updatedAt: new Date() })
      .where(eq(tricks.id, id))
      .returning({ id: tricks.id });

    if (result.length === 0) {
      missing.push(id);
      continue;
    }
    updated += 1;
  }

  console.log(`Dificultad aplicada: ${updated} trucos`);
  if (missing.length > 0) {
    console.log(`Ids sin truco en la base (${missing.length}):`);
    for (const id of missing.slice(0, 20)) {
      console.log(`- ${id}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al aplicar la dificultad: ${message}`);
  process.exitCode = 1;
});
