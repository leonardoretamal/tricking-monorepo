import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { sql } from 'drizzle-orm';

import { getDb } from '../client';
import { categories, trickCategories, tricks } from '../schema';
import { loadEnvFile } from './load-env';

// Trucos nuevos de dificultad basica/facil (Fase 25) que no vienen de ninguna fuente. El
// contenido (descripcion y "como se hace") es ORIGINAL del proyecto, escrito a mano y con
// su version en espanol. Los datos viven en `manual-tricks/tricks.json`.
//
// Idempotente y sin transacciones (el driver neon-http no las soporta): los trucos y las
// categorias se hacen upsert por su clave natural y el enlace truco-categoria se inserta
// con onConflictDoNothing, todo en secuencia.

interface ManualTrickSeed {
  id: string;
  name: string;
  section: string;
  difficulty: number;
  category: string;
  description: string;
  descriptionEs: string;
  howTo: string;
  howToEs: string;
}

const TRICKS_FILE = new URL('./manual-tricks/tricks.json', import.meta.url);

const VALID_SECTIONS = ['vertical-kicks', 'backward', 'forward', 'inside', 'outside'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readRequiredString(record: Record<string, unknown>, key: string, index: number): string {
  const value = record[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`El truco en la posicion ${index} no tiene un ${key} valido.`);
  }
  return value.trim();
}

function parseTricks(raw: unknown): ManualTrickSeed[] {
  if (!Array.isArray(raw)) {
    throw new Error('manual-tricks/tricks.json no contiene un arreglo de trucos.');
  }

  return raw.map((entry, index) => {
    if (!isRecord(entry)) {
      throw new Error(`Registro invalido en la posicion ${index} de manual-tricks.`);
    }

    const id = readRequiredString(entry, 'id', index);
    const section = readRequiredString(entry, 'section', index);
    if (!(VALID_SECTIONS as readonly string[]).includes(section)) {
      throw new Error(`Seccion desconocida en el truco ${id}: ${section}`);
    }

    const difficulty = entry.difficulty;
    if (typeof difficulty !== 'number' || !Number.isInteger(difficulty) || difficulty < 0) {
      throw new Error(`Dificultad invalida en el truco ${id}.`);
    }

    return {
      id,
      name: readRequiredString(entry, 'name', index),
      section,
      difficulty,
      category: readRequiredString(entry, 'category', index),
      description: readRequiredString(entry, 'description', index),
      descriptionEs: readRequiredString(entry, 'descriptionEs', index),
      howTo: readRequiredString(entry, 'howTo', index),
      howToEs: readRequiredString(entry, 'howToEs', index),
    };
  });
}

async function readSeed(): Promise<ManualTrickSeed[]> {
  const raw = await readFile(fileURLToPath(TRICKS_FILE), 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('El archivo manual-tricks/tricks.json no es JSON valido.');
  }
  return parseTricks(parsed);
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const seedTricks = await readSeed();
  if (seedTricks.length === 0) {
    console.log('No hay trucos manuales para sembrar.');
    return;
  }

  const db = getDb();

  // Categorias por slug: se hace upsert de las que falten y se arma el mapa slug -> id.
  const categorySlugs = [...new Set(seedTricks.map((trick) => trick.category))].sort();
  const categoryIdBySlug = new Map<string, number>();
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

  // Trucos: upsert por id con el contenido propio.
  for (const trick of seedTricks) {
    await db
      .insert(tricks)
      .values({
        id: trick.id,
        name: trick.name,
        description: trick.description,
        descriptionEs: trick.descriptionEs,
        difficulty: trick.difficulty,
        section: trick.section,
        howTo: trick.howTo,
        howToEs: trick.howToEs,
        source: 'manual',
      })
      .onConflictDoUpdate({
        target: tricks.id,
        set: {
          name: sql`excluded.name`,
          description: sql`excluded.description`,
          descriptionEs: sql`excluded.description_es`,
          difficulty: sql`excluded.difficulty`,
          section: sql`excluded.section`,
          howTo: sql`excluded.how_to`,
          howToEs: sql`excluded.how_to_es`,
          source: 'manual',
          updatedAt: new Date(),
        },
      });
  }

  // Enlace truco-categoria. onConflictDoNothing hace la operacion idempotente.
  const links = seedTricks.map((trick) => {
    const categoryId = categoryIdBySlug.get(trick.category);
    if (categoryId === undefined) {
      throw new Error(`No se encontro la categoria ${trick.category} para el truco ${trick.id}.`);
    }
    return { trickId: trick.id, categoryId };
  });
  await db.insert(trickCategories).values(links).onConflictDoNothing();

  console.log(
    `Trucos manuales aplicados: ${seedTricks.length} trucos, ${categorySlugs.length} categorias, ${links.length} enlaces truco-categoria.`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar trucos manuales: ${message}`);
  process.exitCode = 1;
});
