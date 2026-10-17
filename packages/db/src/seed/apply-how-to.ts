import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { howToDetailSchema, type HowToDetail } from '@tricking/shared/how-to';
import { and, eq, inArray } from 'drizzle-orm';

import { getDb } from '../client';
import { trickRelations, tricks } from '../schema';
import { loadEnvFile } from './load-env';

// Descripciones PROPIAS de "como se hace" (contenido original del proyecto, no de las
// fuentes). Viven en `how-to/` como uno o varios archivos JSON indexados por id de truco
// (asi el contenido entra por lotes). Se leen en orden alfabetico y se fusionan: si el
// mismo id aparece en dos archivos, gana el ultimo. Se aplican de forma idempotente con
// `pnpm --filter @tricking/db db:how-to`.
//
// Cada entrada acepta:
//   - `es` / `en`: resumen en texto plano (respaldo y SEO), como antes.
//   - `detailEs` / `detailEn`: detalle estructurado (HowToDetail v1) que va a las columnas
//     jsonb `how_to_data_es` / `how_to_data`. Se valida con Zod; si falta, la columna queda
//     null y el truco no rompe. Las claves de `prereqNotes` que no sean prerequisito real
//     del truco (segun `trick_relations`) se descartan.

const HOW_TO_DIR = new URL('./how-to/', import.meta.url);

interface HowToEntry {
  es?: unknown;
  en?: unknown;
  detailEs?: unknown;
  detailEn?: unknown;
}

async function loadMergedEntries(): Promise<{
  merged: Record<string, HowToEntry>;
  duplicates: string[];
}> {
  const dir = fileURLToPath(HOW_TO_DIR);
  let files: string[];
  try {
    files = (await readdir(dir)).filter((file) => file.endsWith('.json')).sort();
  } catch {
    return { merged: {}, duplicates: [] };
  }
  const merged: Record<string, HowToEntry> = {};
  const duplicates: string[] = [];
  for (const file of files) {
    const raw = await readFile(join(dir, file), 'utf8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      throw new Error(`El archivo ${file} no es JSON valido.`);
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error(`El archivo ${file} no es un objeto indexado por id de truco.`);
    }
    for (const key of Object.keys(parsed as Record<string, HowToEntry>)) {
      if (key in merged) {
        duplicates.push(key);
      }
    }
    Object.assign(merged, parsed as Record<string, HowToEntry>);
  }
  return { merged, duplicates };
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

// Valida el detalle estructurado y descarta las notas de prerequisito que no correspondan a
// un prerequisito real del truco. Devuelve null (sin romper) cuando el detalle no valida.
function parseDetail(
  value: unknown,
  trickId: string,
  label: string,
  allowedPrereqs: Set<string>,
  warnings: string[],
): HowToDetail | null {
  if (value === undefined || value === null) {
    return null;
  }
  const result = howToDetailSchema.safeParse(value);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue ? firstIssue.path.join('.') : 'desconocido';
    warnings.push(`${trickId}: detail${label} invalido (campo ${path}), se deja null.`);
    return null;
  }
  const notes = result.data.prereqNotes;
  const keptNotes: Record<string, string> = {};
  for (const [key, note] of Object.entries(notes)) {
    if (allowedPrereqs.has(key)) {
      keptNotes[key] = note;
    } else {
      warnings.push(`${trickId}: prereqNotes descarta ${key} (no es prerequisito real).`);
    }
  }
  return { ...result.data, prereqNotes: keptNotes };
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  let merged: Record<string, HowToEntry>;
  let duplicates: string[];
  try {
    const loaded = await loadMergedEntries();
    merged = loaded.merged;
    duplicates = loaded.duplicates;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
    return;
  }

  const entries = Object.entries(merged);
  if (entries.length === 0) {
    console.log('No hay archivos de how-to; no se escribe nada.');
    return;
  }

  const db = getDb();
  const trickIds = entries.map(([trickId]) => trickId);

  // Prerequisitos reales por truco (para validar `prereqNotes`). Una sola consulta.
  const prereqMap = new Map<string, Set<string>>();
  const prereqRows = await db
    .select({ trickId: trickRelations.trickId, relatedId: trickRelations.relatedId })
    .from(trickRelations)
    .where(and(inArray(trickRelations.trickId, trickIds), eq(trickRelations.kind, 'prereq')));
  for (const row of prereqRows) {
    const bucket = prereqMap.get(row.trickId);
    if (bucket) {
      bucket.add(row.relatedId);
    } else {
      prereqMap.set(row.trickId, new Set([row.relatedId]));
    }
  }

  let applied = 0;
  let withDetail = 0;
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const [trickId, value] of entries) {
    const es = asText(value.es);
    const en = asText(value.en);
    const allowedPrereqs = prereqMap.get(trickId) ?? new Set<string>();
    const detailEs = parseDetail(value.detailEs, trickId, 'Es', allowedPrereqs, warnings);
    const detailEn = parseDetail(value.detailEn, trickId, 'En', allowedPrereqs, warnings);

    if (es === null && en === null && detailEs === null && detailEn === null) {
      continue;
    }

    const result = await db
      .update(tricks)
      .set({
        howToEs: es,
        howTo: en,
        howToDataEs: detailEs,
        howToData: detailEn,
        updatedAt: new Date(),
      })
      .where(eq(tricks.id, trickId))
      .returning({ id: tricks.id });
    if (result.length === 0) {
      missing.push(trickId);
      continue;
    }
    applied += 1;
    if (detailEs !== null || detailEn !== null) {
      withDetail += 1;
    }
  }

  console.log(
    `Descripciones propias aplicadas: ${applied} (con detalle estructurado: ${withDetail})`,
  );
  if (duplicates.length > 0) {
    console.log(`Ids repetidos entre archivos (gano el ultimo): ${duplicates.join(', ')}`);
  }
  if (warnings.length > 0) {
    console.log(`Avisos de detalle (${warnings.length}):`);
    for (const warning of warnings.slice(0, 20)) {
      console.log(`- ${warning}`);
    }
  }
  if (missing.length > 0) {
    console.log(`Ids sin truco en la base (${missing.length}):`);
    for (const id of missing.slice(0, 20)) {
      console.log(`- ${id}`);
    }
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al aplicar descripciones propias: ${message}`);
  process.exitCode = 1;
});
