import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { sql } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks } from '../schema';
import { loadEnvFile } from './load-env';

// Aplica los subfiltros de seccion (`tricks.subcategory`) desde la clasificacion curada
// en `subcategories/loopkicks.json`. El mapa sale del nombre de los trucos de Loopkicks y
// de los trucos manuales, y conserva null para los que no caen en ningun subfiltro.
//
// Idempotente y sin transacciones (el driver neon-http no las soporta): cada corrida
// escribe solo las filas cuyo valor cambia, con un UPDATE por lote.

const SEED_FILE = new URL('./subcategories/loopkicks.json', import.meta.url);

const SUBCATEGORY_SECTION = {
  pop: 'vertical-kicks',
  cheat: 'vertical-kicks',
  swing: 'vertical-kicks',
  backflip: 'backward',
  gainer: 'backward',
  full: 'backward',
  corkscrew: 'backward',
  frontflip: 'forward',
  webster: 'forward',
  janitor: 'forward',
  butterfly: 'inside',
  aerial: 'inside',
  masterswing: 'inside',
  wrap: 'inside',
  tak: 'inside',
  raiz: 'outside',
  doubleleg: 'outside',
  spyder: 'outside',
  lotus: 'outside',
  sideflip: 'outside',
} as const;

const VALID_SUBCATEGORIES = new Set<string>(Object.keys(SUBCATEGORY_SECTION));

interface SubcategorySeed {
  loopkicks: Record<string, string | null>;
  manual: Record<string, string | null>;
}

// Alias de tipo (no interface) para que las filas crudas sean asignables a la
// restriccion Record<string, unknown> de db.execute.
type CountRow = {
  subcategory: string | null;
  total: number;
};

type TrickRow = {
  id: string;
  name: string;
  section: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseMap(value: unknown, label: string): Record<string, string | null> {
  if (!isRecord(value)) {
    throw new Error(`El archivo de subcategorias no tiene un mapa ${label} valido.`);
  }

  const map: Record<string, string | null> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (entry === null) {
      map[key] = null;
      continue;
    }
    if (typeof entry !== 'string' || !VALID_SUBCATEGORIES.has(entry)) {
      throw new Error(`Subcategoria desconocida para ${label} ${key}: ${String(entry)}`);
    }
    map[key] = entry;
  }
  return map;
}

async function readSeed(): Promise<SubcategorySeed> {
  const raw = await readFile(fileURLToPath(SEED_FILE), 'utf8');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error('subcategories/loopkicks.json no es JSON valido.');
  }
  if (!isRecord(parsed)) {
    throw new Error('subcategories/loopkicks.json no contiene un objeto.');
  }
  return {
    loopkicks: parseMap(parsed.loopkicks, 'loopkicks'),
    manual: parseMap(parsed.manual, 'manual'),
  };
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const seed = await readSeed();
  const loopkicksEntries = Object.entries(seed.loopkicks);
  const manualEntries = Object.entries(seed.manual);

  if (loopkicksEntries.length === 0 && manualEntries.length === 0) {
    console.log('No hay subcategorias para aplicar.');
    return;
  }

  const db = getDb();

  let loopkicksUpdated = 0;
  if (loopkicksEntries.length > 0) {
    const values = sql.join(
      loopkicksEntries.map(([slug, subcategory]) => sql`(${slug}::text, ${subcategory}::text)`),
      sql`, `,
    );
    const result = await db.execute(sql`
      UPDATE ${tricks}
      SET subcategory = data.subcategory, updated_at = now()
      FROM (VALUES ${values}) AS data(loopkicks_slug, subcategory)
      WHERE ${tricks.loopkicksSlug} = data.loopkicks_slug
        AND ${tricks.subcategory} IS DISTINCT FROM data.subcategory
    `);
    loopkicksUpdated = result.rowCount ?? 0;
  }

  let manualUpdated = 0;
  if (manualEntries.length > 0) {
    const values = sql.join(
      manualEntries.map(([id, subcategory]) => sql`(${id}::text, ${subcategory}::text)`),
      sql`, `,
    );
    const result = await db.execute(sql`
      UPDATE ${tricks}
      SET subcategory = data.subcategory, updated_at = now()
      FROM (VALUES ${values}) AS data(id, subcategory)
      WHERE ${tricks.id} = data.id
        AND ${tricks.subcategory} IS DISTINCT FROM data.subcategory
    `);
    manualUpdated = result.rowCount ?? 0;
  }

  const totals = await db.execute<{ total: number; classified: number; pending: number }>(sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE subcategory IS NOT NULL)::int AS classified,
      count(*) FILTER (WHERE subcategory IS NULL)::int AS pending
    FROM ${tricks}
    WHERE deleted_at IS NULL
  `);
  const total = totals.rows[0] ?? { total: 0, classified: 0, pending: 0 };

  const counts = await db.execute<CountRow>(sql`
    SELECT subcategory, count(*)::int AS total
    FROM ${tricks}
    WHERE deleted_at IS NULL AND subcategory IS NOT NULL
    GROUP BY subcategory
    ORDER BY total DESC, subcategory ASC
  `);

  const missing = await db.execute<TrickRow>(sql`
    SELECT id, name, section
    FROM ${tricks}
    WHERE deleted_at IS NULL AND subcategory IS NULL
    ORDER BY section ASC NULLS LAST, name ASC
  `);

  console.log(
    `Entradas del mapa: ${loopkicksEntries.length} de Loopkicks y ${manualEntries.length} manuales.`,
  );
  console.log(`Filas actualizadas: ${loopkicksUpdated} de Loopkicks y ${manualUpdated} manuales.`);
  console.log(
    `Trucos vigentes: ${total.total} (${total.classified} con subcategoria, ${total.pending} sin match).`,
  );
  console.log('Conteo por subcategoria:');
  for (const row of counts.rows) {
    console.log(`- ${row.subcategory}: ${row.total}`);
  }
  console.log(`Trucos sin subcategoria (${missing.rows.length}):`);
  for (const row of missing.rows) {
    console.log(`- ${row.id} | ${row.name} | ${row.section ?? 'sin seccion'}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al aplicar las subcategorias: ${message}`);
  process.exitCode = 1;
});
