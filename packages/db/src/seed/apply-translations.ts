import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { eq } from 'drizzle-orm';

import { getDb } from '../client';
import { stances, transitions, tricks, variations } from '../schema';
import { loadEnvFile } from './load-env';

// Aplica las traducciones al espanol (description_es) desde los archivos curados en
// src/seed/translations/. Idempotente: reescribe el valor y no toca el resto. Las
// variaciones concretas copian la traduccion de su truco (mismo texto de origen).

const TRANSLATIONS_DIR = new URL('./translations/', import.meta.url);

async function loadJson(name: string): Promise<Record<string, string>> {
  try {
    const raw = await readFile(fileURLToPath(new URL(name, TRANSLATIONS_DIR)), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, string>;
    }
  } catch {
    return {};
  }
  return {};
}

// Los trucos se reparten en varios archivos (es-tricks*.json) por seccion.
async function loadTrickTranslations(): Promise<Record<string, string>> {
  const dir = fileURLToPath(TRANSLATIONS_DIR);
  const files = (await readdir(dir)).filter(
    (name) => name.startsWith('es-tricks') && name.endsWith('.json'),
  );
  const merged: Record<string, string> = {};
  for (const file of files.sort()) {
    Object.assign(merged, await loadJson(file));
  }
  return merged;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const db = getDb();

  const trickMap = await loadTrickTranslations();
  let tricksApplied = 0;
  const tricksMissing: string[] = [];
  for (const [id, value] of Object.entries(trickMap)) {
    const result = await db
      .update(tricks)
      .set({ descriptionEs: value, updatedAt: new Date() })
      .where(eq(tricks.id, id))
      .returning({ id: tricks.id });
    if (result.length === 0) {
      tricksMissing.push(id);
      continue;
    }
    tricksApplied += 1;
  }

  const variationMap = await loadJson('es-variations.json');
  let variationsApplied = 0;
  const variationsMissing: string[] = [];
  for (const [slug, value] of Object.entries(variationMap)) {
    const result = await db
      .update(variations)
      .set({ descriptionEs: value, updatedAt: new Date() })
      .where(eq(variations.slug, slug))
      .returning({ id: variations.id });
    if (result.length === 0) {
      variationsMissing.push(slug);
      continue;
    }
    variationsApplied += 1;
  }

  const transitionMap = await loadJson('es-transitions.json');
  let transitionsApplied = 0;
  const transitionsMissing: string[] = [];
  for (const [slug, value] of Object.entries(transitionMap)) {
    const result = await db
      .update(transitions)
      .set({ descriptionEs: value, updatedAt: new Date() })
      .where(eq(transitions.slug, slug))
      .returning({ id: transitions.id });
    if (result.length === 0) {
      transitionsMissing.push(slug);
      continue;
    }
    transitionsApplied += 1;
  }

  const stanceMap = await loadJson('es-stances.json');
  let stancesApplied = 0;
  const stancesMissing: string[] = [];
  for (const [slug, value] of Object.entries(stanceMap)) {
    const result = await db
      .update(stances)
      .set({ descriptionEs: value, updatedAt: new Date() })
      .where(eq(stances.slug, slug))
      .returning({ id: stances.id });
    if (result.length === 0) {
      stancesMissing.push(slug);
      continue;
    }
    stancesApplied += 1;
  }

  // Variaciones concretas: heredan la traduccion de su truco.
  const concreteRows = await db
    .select({ id: variations.id, trickId: variations.trickId })
    .from(variations)
    .where(eq(variations.kind, 'concrete'));
  let concreteApplied = 0;
  for (const row of concreteRows) {
    if (!row.trickId) {
      continue;
    }
    const [trick] = await db
      .select({ es: tricks.descriptionEs })
      .from(tricks)
      .where(eq(tricks.id, row.trickId))
      .limit(1);
    if (trick?.es) {
      await db
        .update(variations)
        .set({ descriptionEs: trick.es, updatedAt: new Date() })
        .where(eq(variations.id, row.id));
      concreteApplied += 1;
    }
  }

  console.log(
    `Traducciones aplicadas: trucos ${tricksApplied}, familias de variaciones ${variationsApplied}, variaciones concretas ${concreteApplied}, transiciones ${transitionsApplied}, stances ${stancesApplied}`,
  );
  const missing = [
    ...tricksMissing.map((id) => `trick:${id}`),
    ...variationsMissing.map((slug) => `variation:${slug}`),
    ...transitionsMissing.map((slug) => `transition:${slug}`),
    ...stancesMissing.map((slug) => `stance:${slug}`),
  ];
  if (missing.length > 0) {
    console.log(`Claves sin fila en la base (${missing.length}):`);
    for (const item of missing.slice(0, 20)) {
      console.log(`- ${item}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al aplicar traducciones: ${message}`);
  process.exitCode = 1;
});
