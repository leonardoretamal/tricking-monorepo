import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { eq } from 'drizzle-orm';

import { getDb } from '../client';
import { transitionExamples, transitions, tricks } from '../schema';
import { loadEnvFile } from './load-env';
import { findTrickInText, normalizeKey } from './normalize';

// Semilla de la Fase 9. Loopkicks es la fuente de la taxonomia (Unified/Singular/
// Sequential) y TrickingAPI complementa con descripciones y transiciones que Loopkicks
// no lista (Backswing, Frontswing). Idempotente, sin transacciones.

interface LoopkicksTransition {
  slug: string;
  name: string;
  group: string;
  description: string;
  examples: string[];
}

interface TrickingApiTransition {
  id: string;
  name: string;
  description: string;
  examples: string[];
}

const TRANSITIONS_FILE = new URL(
  '../../../../apps/scraper/data/loopkicks-transitions.json',
  import.meta.url,
);
const TRICKINGAPI_TRANSITIONS_URL = 'https://api.trickingapi.dev/transitions';

const GROUP_MAP: Record<string, string> = {
  unified: 'unified',
  singular: 'singular',
  sequential: 'sequential',
};

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function parseLoopkicks(raw: unknown): LoopkicksTransition[] {
  if (!Array.isArray(raw)) {
    throw new Error('El JSON de transiciones no es un arreglo');
  }
  const result: LoopkicksTransition[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }
    const { slug, name, group, description, examples } = entry;
    if (typeof slug !== 'string' || typeof name !== 'string') {
      continue;
    }
    result.push({
      slug,
      name,
      group: typeof group === 'string' ? (GROUP_MAP[group.toLowerCase()] ?? '') : '',
      description: typeof description === 'string' ? description : '',
      examples: toStringArray(examples),
    });
  }
  return result;
}

async function fetchTrickingApi(): Promise<TrickingApiTransition[]> {
  const response = await fetch(TRICKINGAPI_TRANSITIONS_URL, {
    headers: { 'User-Agent': 'TrickingMonorepoSeed/0.1' },
  });
  if (!response.ok) {
    throw new Error(`TrickingAPI /transitions respondio ${response.status}`);
  }
  const parsed: unknown = await response.json();
  if (!Array.isArray(parsed)) {
    return [];
  }
  const result: TrickingApiTransition[] = [];
  for (const entry of parsed) {
    if (!isRecord(entry)) {
      continue;
    }
    const { id, name, description, examples } = entry;
    if (typeof id !== 'string' || typeof name !== 'string') {
      continue;
    }
    result.push({
      id,
      name,
      description: typeof description === 'string' ? description : '',
      examples: toStringArray(examples),
    });
  }
  return result;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const rawJson = await readFile(fileURLToPath(TRANSITIONS_FILE), 'utf8');
  const loopkicks = parseLoopkicks(JSON.parse(rawJson) as unknown);
  const apiTransitions = await fetchTrickingApi();

  const db = getDb();

  const trickRows = await db.select({ id: tricks.id, name: tricks.name }).from(tricks);
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

  const merged = new Map<
    string,
    {
      slug: string;
      name: string;
      group: string;
      description: string;
      examples: string[];
      fromLoopkicks: boolean;
    }
  >();

  for (const item of loopkicks) {
    merged.set(item.slug, { ...item, fromLoopkicks: true });
  }
  for (const item of apiTransitions) {
    const slug = slugify(item.id);
    const existing = merged.get(slug);
    if (existing) {
      merged.set(slug, {
        ...existing,
        name: existing.name || item.name,
        description: existing.description || item.description,
        examples: [...new Set([...existing.examples, ...item.examples])],
      });
    } else {
      merged.set(slug, {
        slug,
        name: item.name,
        group: '',
        description: item.description,
        examples: item.examples,
        fromLoopkicks: false,
      });
    }
  }

  let count = 0;
  let exampleCount = 0;
  const unresolved: string[] = [];

  for (const transition of merged.values()) {
    const [row] = await db
      .insert(transitions)
      .values({
        slug: transition.slug,
        name: transition.name,
        description: transition.description,
        group: transition.group === '' ? null : transition.group,
        loopkicksSlug: transition.fromLoopkicks ? transition.slug : null,
      })
      .onConflictDoUpdate({
        target: transitions.slug,
        set: {
          name: transition.name,
          description: transition.description,
          group: transition.group === '' ? null : transition.group,
          loopkicksSlug: transition.fromLoopkicks ? transition.slug : null,
          deletedAt: null,
          updatedAt: new Date(),
        },
      })
      .returning({ id: transitions.id });

    if (!row) {
      continue;
    }
    count += 1;

    await db.delete(transitionExamples).where(eq(transitionExamples.transitionId, row.id));

    const rows = transition.examples.map((label) => {
      const trickId = findTrickInText(label, tricksByName, namesByLength);
      if (trickId === null) {
        unresolved.push(`${transition.slug}: ${label}`);
      }
      return { transitionId: row.id, label, trickId };
    });

    if (rows.length > 0) {
      await db.insert(transitionExamples).values(rows);
      exampleCount += rows.length;
    }
  }

  console.log(`Transiciones: ${count} tipos, ${exampleCount} ejemplos`);
  if (unresolved.length > 0) {
    console.log(`Ejemplos sin truco resuelto (${unresolved.length}):`);
    for (const item of unresolved.slice(0, 20)) {
      console.log(`- ${item}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar transiciones: ${message}`);
  process.exitCode = 1;
});
