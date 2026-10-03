import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { eq } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks } from '../schema';

const LOOPKICKS_JSON_URL = new URL(
  '../../../../apps/scraper/data/loopkicks-tricks.json',
  import.meta.url,
);

const MAX_UNMATCHED_REPORTED = 20;

interface LoopkicksTrick {
  slug: string;
  name: string;
  section: string;
}

interface TrickRow {
  id: string;
  name: string;
  loopkicksSlug: string | null;
  section: string | null;
}

// La seccion de Loopkicks es la clasificacion primaria del contenido. Se normaliza
// al slug canonico que usa la web (sin el sufijo "-tricks").
const LOOPKICKS_SECTION_MAP: Record<string, string> = {
  'vertical-kicks': 'vertical-kicks',
  'backward-tricks': 'backward',
  'forward-tricks': 'forward',
  'inside-tricks': 'inside',
  'outside-tricks': 'outside',
};

function normalizeSection(section: string): string | null {
  return LOOPKICKS_SECTION_MAP[section] ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseLoopkicksTricks(raw: unknown): LoopkicksTrick[] {
  if (!Array.isArray(raw)) {
    throw new Error('El JSON de Loopkicks no es un arreglo');
  }

  const result: LoopkicksTrick[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const { slug, name, section } = item;
    if (typeof slug !== 'string' || typeof name !== 'string') {
      continue;
    }
    result.push({
      slug,
      name,
      section: typeof section === 'string' ? section : '',
    });
  }

  return result;
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

function normalizeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function selectMatch(
  candidates: TrickRow[],
  loopkicksSlug: string,
  loopkicksName: string,
): TrickRow | null {
  if (candidates.length === 0) {
    return null;
  }

  // Determinista: cuando varios trucos normalizan a la misma clave, se elige siempre el
  // mismo por id ascendente. Asi la asignacion de un slug unico no cambia entre corridas.
  const key = normalizeKey(loopkicksSlug);
  const byId = candidates
    .filter((candidate) => normalizeKey(candidate.id) === key)
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));
  if (byId.length > 0) {
    return byId[0] ?? null;
  }

  if (candidates.length === 1) {
    return candidates[0] ?? null;
  }

  const normalizedName = normalizeKey(loopkicksName);
  const byName = candidates
    .filter((candidate) => normalizeKey(candidate.name) === normalizedName)
    .sort((a, b) => a.id.localeCompare(b.id, 'en'));
  if (byName.length === 1) {
    return byName[0] ?? null;
  }

  // Ambiguedad sin desempate claro: se reporta como sin match en vez de adivinar.
  return null;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const rawJson = await readFile(fileURLToPath(LOOPKICKS_JSON_URL), 'utf8');
  const loopkicksTricks = parseLoopkicksTricks(JSON.parse(rawJson) as unknown);

  const db = getDb();
  const trickRows: TrickRow[] = await db
    .select({
      id: tricks.id,
      name: tricks.name,
      loopkicksSlug: tricks.loopkicksSlug,
      section: tricks.section,
    })
    .from(tricks);

  const byKey = new Map<string, TrickRow[]>();
  for (const trick of trickRows) {
    const keys = new Set<string>([normalizeKey(trick.id), normalizeKey(trick.name)]);
    for (const key of keys) {
      if (key === '') {
        continue;
      }
      const bucket = byKey.get(key);
      if (bucket) {
        if (!bucket.some((candidate) => candidate.id === trick.id)) {
          bucket.push(trick);
        }
      } else {
        byKey.set(key, [trick]);
      }
    }
  }

  let mapped = 0;
  const unmatched: string[] = [];
  const assignedTrickIds = new Set<string>();

  for (const loopkicks of loopkicksTricks) {
    const key = normalizeKey(loopkicks.slug);
    const candidates = byKey.get(key) ?? [];
    const available = candidates.filter(
      (candidate) => candidate.loopkicksSlug === null || candidate.loopkicksSlug === loopkicks.slug,
    );
    const match = selectMatch(available, loopkicks.slug, loopkicks.name);

    if (!match || assignedTrickIds.has(match.id)) {
      unmatched.push(loopkicks.slug);
      continue;
    }

    assignedTrickIds.add(match.id);

    const section = normalizeSection(loopkicks.section);

    if (match.loopkicksSlug === loopkicks.slug && match.section === section) {
      mapped += 1;
      continue;
    }

    await db
      .update(tricks)
      .set({ loopkicksSlug: loopkicks.slug, section, updatedAt: new Date() })
      .where(eq(tricks.id, match.id));
    match.loopkicksSlug = loopkicks.slug;
    match.section = section;
    mapped += 1;
  }

  console.log(`Mapeados: ${mapped}`);
  console.log(`Sin match: ${unmatched.length}`);
  if (unmatched.length > 0) {
    console.log(`Slugs sin match (maximo ${MAX_UNMATCHED_REPORTED}):`);
    for (const slug of unmatched.slice(0, MAX_UNMATCHED_REPORTED)) {
      console.log(`- ${slug}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al mapear trucos de Loopkicks: ${message}`);
  process.exitCode = 1;
});
