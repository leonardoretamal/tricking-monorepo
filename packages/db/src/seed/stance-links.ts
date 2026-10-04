import { fileURLToPath } from 'node:url';

import { and, eq, inArray } from 'drizzle-orm';

import { getDb } from '../client';
import { stances, trickStances, tricks } from '../schema';
import { loadEnvFile } from './load-env';
import { normalizeKey } from './normalize';

// Enlaces truco -> stance de aterrizaje (Fase 10, subfase 10.4). Curación inicial tomada
// de los ejemplos de combo de Loopkicks (anotaciones "[Stance]"). La cobertura es
// parcial por diseño: se amplía a mano. Idempotente por truco.

const LINKS: ReadonlyArray<readonly [string, string]> = [
  ['Aerial', 'mega'],
  ['Aerial', 'semi'],
  ['Butterfly Twist', 'mega'],
  ['Raiz', 'complete'],
  ['Cheat 900', 'hyper'],
  ['Wrap 900', 'complete'],
  ['Hook', 'hyper'],
  ['Touchdown Raiz', 'complete'],
  ['540', 'hyper'],
  ['540', 'complete'],
  ['540', 'mega'],
  ['540', 'semi'],
  ['Corkscrew', 'complete'],
  ['Corkscrew', 'hyper'],
  ['Corkscrew', 'mega'],
  ['Corkscrew', 'semi'],
];

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

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

  const stanceRows = await db.select({ id: stances.id, slug: stances.slug }).from(stances);
  const stanceIdBySlug = new Map(stanceRows.map((stance) => [stance.slug, stance.id]));

  const resolved: { trickId: string; stanceId: number }[] = [];
  const unresolved: string[] = [];

  for (const [trickName, stanceSlug] of LINKS) {
    const trickId = tricksByName.get(normalizeKey(trickName));
    const stanceId = stanceIdBySlug.get(stanceSlug);
    if (trickId === undefined || stanceId === undefined) {
      unresolved.push(`${trickName} -> ${stanceSlug}`);
      continue;
    }
    resolved.push({ trickId, stanceId });
  }

  const trickIds = [...new Set(resolved.map((link) => link.trickId))];
  if (trickIds.length > 0) {
    await db
      .delete(trickStances)
      .where(and(eq(trickStances.kind, 'landing'), inArray(trickStances.trickId, trickIds)));
    await db
      .insert(trickStances)
      .values(resolved.map((link) => ({ ...link, kind: 'landing' })))
      .onConflictDoNothing();
  }

  console.log(`Enlaces truco-stance: ${resolved.length} sembrados`);
  if (unresolved.length > 0) {
    console.log(`Enlaces sin resolver (${unresolved.length}):`);
    for (const item of unresolved) {
      console.log(`- ${item}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar enlaces truco-stance: ${message}`);
  process.exitCode = 1;
});
