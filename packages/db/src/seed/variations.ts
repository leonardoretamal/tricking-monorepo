import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { and, eq, inArray, isNull, notInArray } from 'drizzle-orm';

import { getDb } from '../client';
import { categories, trickCategories, tricks, variationExamples, variations } from '../schema';
import { loadEnvFile } from './load-env';
import { findTrickInText, normalizeKey } from './normalize';

// Semilla de la Fase 8. Dos ejes: familias conceptuales de Loopkicks (kind='family',
// con trucos de ejemplo) y variaciones concretas de TrickingAPI (kind='concrete', los
// trucos con categoria VARIATION, ligados a su truco base). Idempotente y sin
// transacciones porque el driver neon-http no las soporta.

interface LoopkicksVariation {
  slug: string;
  name: string;
  description: string;
  examples: string[];
}

const VARIATIONS_FILE = new URL(
  '../../../../apps/scraper/data/loopkicks-variations.json',
  import.meta.url,
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseVariations(raw: unknown): LoopkicksVariation[] {
  if (!Array.isArray(raw)) {
    throw new Error('El JSON de variaciones no es un arreglo');
  }

  const result: LoopkicksVariation[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }
    const { slug, name, description, examples } = entry;
    if (typeof slug !== 'string' || typeof name !== 'string') {
      continue;
    }
    result.push({
      slug,
      name,
      description: typeof description === 'string' ? description : '',
      examples: Array.isArray(examples)
        ? examples.filter((item): item is string => typeof item === 'string')
        : [],
    });
  }
  return result;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const rawJson = await readFile(fileURLToPath(VARIATIONS_FILE), 'utf8');
  const loopkicksVariations = parseVariations(JSON.parse(rawJson) as unknown);

  const db = getDb();

  const trickRows = await db
    .select({ id: tricks.id, name: tricks.name, prereqs: tricks.prereqs })
    .from(tricks);

  const tricksByName = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const trick of trickRows) {
    const key = normalizeKey(trick.name);
    if (tricksByName.has(key)) {
      ambiguous.add(key);
    } else {
      tricksByName.set(key, trick.id);
    }
  }
  for (const key of ambiguous) {
    tricksByName.delete(key);
  }
  const namesByLength = [...tricksByName.keys()].sort((a, b) => b.length - a.length);

  let families = 0;
  let exampleLinks = 0;
  const unresolvedExamples: string[] = [];
  const familyAliases: { key: string; familyId: number }[] = [];

  for (const variation of loopkicksVariations) {
    const [row] = await db
      .insert(variations)
      .values({
        kind: 'family',
        slug: variation.slug,
        name: variation.name,
        description: variation.description,
        loopkicksSlug: variation.slug,
      })
      .onConflictDoUpdate({
        target: variations.slug,
        set: {
          kind: 'family',
          name: variation.name,
          description: variation.description,
          loopkicksSlug: variation.slug,
          deletedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning({ id: variations.id });

    if (!row) {
      continue;
    }
    families += 1;

    // Alias de la familia para mapear variaciones concretas: se parte el nombre por "/"
    // (por ejemplo "Hook / Hyperhook") y se guarda cada parte normalizada.
    for (const part of variation.name.split('/')) {
      const key = normalizeKey(part);
      if (key.length >= 3) {
        familyAliases.push({ key, familyId: row.id });
      }
    }

    await db.delete(variationExamples).where(eq(variationExamples.variationId, row.id));

    const trickIds = new Set<string>();
    for (const example of variation.examples) {
      const trickId = findTrickInText(example, tricksByName, namesByLength);
      if (trickId === null) {
        unresolvedExamples.push(`${variation.slug}: ${example}`);
        continue;
      }
      trickIds.add(trickId);
    }

    if (trickIds.size > 0) {
      await db
        .insert(variationExamples)
        .values([...trickIds].map((trickId) => ({ variationId: row.id, trickId })))
        .onConflictDoNothing();
      exampleLinks += trickIds.size;
    }
  }

  const concreteRows = await db
    .select({
      id: tricks.id,
      name: tricks.name,
      description: tricks.description,
      prereqs: tricks.prereqs,
    })
    .from(tricks)
    .where(
      inArray(
        tricks.id,
        db
          .select({ id: trickCategories.trickId })
          .from(trickCategories)
          .innerJoin(categories, eq(trickCategories.categoryId, categories.id))
          .where(eq(categories.slug, 'VARIATION')),
      ),
    );

  familyAliases.sort((a, b) => b.key.length - a.key.length);

  let concrete = 0;
  for (const trick of concreteRows) {
    const baseTrickId = trick.prereqs
      .map((name) => tricksByName.get(normalizeKey(name)))
      .find((value): value is string => value !== undefined);

    const normalizedName = normalizeKey(trick.name);
    const familyId =
      familyAliases.find((alias) => normalizedName.includes(alias.key))?.familyId ?? null;

    await db
      .insert(variations)
      .values({
        kind: 'concrete',
        slug: trick.id,
        name: trick.name,
        description: trick.description,
        trickId: trick.id,
        baseTrickId: baseTrickId ?? null,
        familyId,
      })
      .onConflictDoUpdate({
        target: variations.slug,
        set: {
          kind: 'concrete',
          name: trick.name,
          description: trick.description,
          trickId: trick.id,
          baseTrickId: baseTrickId ?? null,
          familyId,
          deletedAt: null,
          updatedAt: new Date(),
        },
      });
    concrete += 1;
  }

  // Limpieza acotada: familias que ya no esten en el JSON quedan con soft delete.
  const familySlugs = loopkicksVariations.map((variation) => variation.slug);
  if (familySlugs.length > 0) {
    await db
      .update(variations)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(variations.kind, 'family'),
          isNull(variations.deletedAt),
          notInArray(variations.slug, familySlugs),
        ),
      );
  }

  console.log(
    `Variaciones: ${families} familias, ${concrete} concretas, ${exampleLinks} enlaces de ejemplo`,
  );
  if (unresolvedExamples.length > 0) {
    console.log(`Ejemplos sin truco resuelto (${unresolvedExamples.length}):`);
    for (const item of unresolvedExamples.slice(0, 20)) {
      console.log(`- ${item}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar variaciones: ${message}`);
  process.exitCode = 1;
});
