import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { inArray } from 'drizzle-orm';

import { getDb } from '../client';
import { trickRelations } from '../schema';
import { findTrickInText, normalizeKey } from './normalize';

// Corrige el bug de la Fase 3: la semilla de TrickingAPI guarda `prereqs`/`nextTricks`
// como NOMBRES, no como ids. Este script los resuelve a ids del catalogo y los deja en
// la tabla `trick_relations` para consultarlos en SQL (detalle de truco y grafo Explore).

const SEED_PACKAGE = '@trickingapi/tricks-core-data';
const TRICKS_FILE = 'data/tricks.json';

interface SeedTrick {
  id: string;
  name: string;
  aliases: string[];
  prereqs: string[];
  nextTricks: string[];
}

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

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim() !== '')
    : [];
}

function loadSeedTricks(): SeedTrick[] {
  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve(`${SEED_PACKAGE}/package.json`);
  const tricksPath = join(dirname(packageJsonPath), TRICKS_FILE);
  const parsed: unknown = JSON.parse(readFileSync(tricksPath, 'utf8'));
  if (!Array.isArray(parsed)) {
    throw new Error(`${TRICKS_FILE} no contiene un arreglo de trucos`);
  }
  return parsed.map((entry) => {
    const record = entry as Record<string, unknown>;
    return {
      id: String(record.id),
      name: String(record.name),
      aliases: toStringArray(record.aliases),
      prereqs: toStringArray(record.prereqs),
      nextTricks: toStringArray(record.nextTricks),
    };
  });
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function applyRelations(): Promise<void> {
  loadEnvFile(join(process.cwd(), '.env'));

  const db = getDb();
  const seedTricks = loadSeedTricks();

  const nameToId = new Map<string, string>();
  let unresolved = 0;

  for (const trick of seedTricks) {
    nameToId.set(normalizeKey(trick.name), trick.id);
    for (const alias of trick.aliases) {
      const key = normalizeKey(alias);
      if (key !== '' && !nameToId.has(key)) {
        nameToId.set(key, trick.id);
      }
    }
  }

  const namesByLength = [...nameToId.keys()].sort((a, b) => b.length - a.length);

  const resolve = (value: string): string | null => {
    const exact = nameToId.get(normalizeKey(value));
    if (exact !== undefined) {
      return exact;
    }
    return findTrickInText(value, nameToId, namesByLength);
  };

  const rows: { trickId: string; relatedId: string; kind: string }[] = [];
  for (const trick of seedTricks) {
    for (const prereq of trick.prereqs) {
      const relatedId = resolve(prereq);
      if (relatedId !== null && relatedId !== trick.id) {
        rows.push({ trickId: trick.id, relatedId, kind: 'prereq' });
      } else {
        unresolved += 1;
      }
    }
    for (const next of trick.nextTricks) {
      const relatedId = resolve(next);
      if (relatedId !== null && relatedId !== trick.id) {
        rows.push({ trickId: trick.id, relatedId, kind: 'next' });
      } else {
        unresolved += 1;
      }
    }
  }

  const trickIds = seedTricks.map((trick) => trick.id);
  for (const batch of chunk(trickIds, 500)) {
    await db.delete(trickRelations).where(inArray(trickRelations.trickId, batch));
  }

  const unique = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    unique.set(`${row.trickId}|${row.relatedId}|${row.kind}`, row);
  }

  for (const batch of chunk([...unique.values()], 500)) {
    await db.insert(trickRelations).values(batch).onConflictDoNothing();
  }

  const linked = new Set(rows.map((row) => row.trickId)).size;
  console.log(
    `Relaciones aplicadas: ${unique.size} filas, ${linked} trucos con relaciones, ${unresolved} referencias sin resolver (de ${seedTricks.length} trucos).`,
  );
}

applyRelations().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  console.error(`Fallo la semilla de relaciones: ${message}`);
  process.exitCode = 1;
});
