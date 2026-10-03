import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { inArray, sql } from 'drizzle-orm';
import { getDb } from '../client';
import { categories, trickCategories, tricks } from '../schema';

// El paquete @trickingapi/tricks-core-data publica solo fuentes .ts y data/tricks.json.
// Su campo main (index.js) no existe, por eso no se importa como modulo normal y en su
// lugar se resuelve la ruta del paquete y se lee el JSON en runtime.
const SEED_PACKAGE = '@trickingapi/tricks-core-data';
const TRICKS_FILE = 'data/tricks.json';

interface SeedTrick {
  id: string;
  name: string;
  aliases: string[];
  categories: string[];
  prereqs: string[];
  nextTricks: string[];
  description: string | null;
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && item.trim() !== '');
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return [value];
  }
  return [];
}

function normalizeTrick(entry: unknown, index: number): SeedTrick {
  if (!isRecord(entry)) {
    throw new Error(`Registro invalido en la posicion ${index} de la semilla`);
  }

  const { id, name, description, categories: rawCategories, prereqs, nextTricks, aliases } = entry;

  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error(`El registro en la posicion ${index} no tiene un id valido`);
  }
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error(`El truco ${id} no tiene un name valido`);
  }

  return {
    id,
    name,
    aliases: toStringArray(aliases),
    categories: toStringArray(rawCategories),
    prereqs: toStringArray(prereqs),
    nextTricks: toStringArray(nextTricks),
    description: typeof description === 'string' && description.trim() !== '' ? description : null,
  };
}

function loadSeedTricks(): SeedTrick[] {
  const require = createRequire(import.meta.url);
  const packageJsonPath = require.resolve(`${SEED_PACKAGE}/package.json`);
  const tricksPath = join(dirname(packageJsonPath), TRICKS_FILE);
  const parsed: unknown = JSON.parse(readFileSync(tricksPath, 'utf8'));

  if (!Array.isArray(parsed)) {
    throw new Error(`${TRICKS_FILE} no contiene un arreglo de trucos`);
  }

  return parsed.map((entry, index) => normalizeTrick(entry, index));
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
}

async function seed(): Promise<void> {
  loadEnvFile(join(process.cwd(), '.env'));

  const db = getDb();
  const seedTricks = loadSeedTricks();

  const categorySlugs = [...new Set(seedTricks.flatMap((trick) => trick.categories))].sort();
  const categoryIdBySlug = new Map<string, number>();

  if (categorySlugs.length > 0) {
    const upsertedCategories = await db
      .insert(categories)
      .values(categorySlugs.map((slug) => ({ slug, name: slug })))
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: sql`excluded.name`, updatedAt: new Date() },
      })
      .returning({ id: categories.id, slug: categories.slug });

    for (const row of upsertedCategories) {
      categoryIdBySlug.set(row.slug, row.id);
    }
  }

  const trickRows = seedTricks.map((trick) => ({
    id: trick.id,
    name: trick.name,
    description: trick.description,
    prereqs: trick.prereqs,
    nextTricks: trick.nextTricks,
  }));

  for (const batch of chunk(trickRows, 200)) {
    await db
      .insert(tricks)
      .values(batch)
      .onConflictDoUpdate({
        target: tricks.id,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          prereqs: sql`excluded.prereqs`,
          nextTricks: sql`excluded.next_tricks`,
          updatedAt: new Date(),
        },
      });
  }

  const links: { trickId: string; categoryId: number }[] = [];
  for (const trick of seedTricks) {
    for (const slug of trick.categories) {
      const categoryId = categoryIdBySlug.get(slug);
      if (categoryId === undefined) {
        throw new Error(`No se encontro la categoria ${slug} para el truco ${trick.id}`);
      }
      links.push({ trickId: trick.id, categoryId });
    }
  }

  const trickIds = seedTricks.map((trick) => trick.id);

  // Se limpian las relaciones previas de los trucos sembrados y se vuelven a insertar para
  // que correr la semilla dos veces no duplique filas y no deje relaciones obsoletas.
  for (const batch of chunk(trickIds, 500)) {
    await db.delete(trickCategories).where(inArray(trickCategories.trickId, batch));
  }

  for (const batch of chunk(links, 500)) {
    await db.insert(trickCategories).values(batch).onConflictDoNothing();
  }

  console.log(
    `Semilla aplicada: ${seedTricks.length} trucos, ${categorySlugs.length} categorias, ${links.length} relaciones truco-categoria`,
  );
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Error desconocido';
  console.error(`Fallo la semilla: ${message}`);
  process.exitCode = 1;
});
