import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { and, eq, inArray } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks, videos, type NewVideo } from '../schema';
import { loadEnvFile } from './load-env';

// Semilla de tutoriales externos de trucos (Fase 45). Cada truco puede tener, ademas de su
// video de ejecucion ('demo'), uno o varios tutoriales de terceros ('tutorial') que explican
// el truco. Politica de contenido (reglas-legal.md): no se re-hospeda nada; se guarda la URL
// original con credito y el reproductor la carga recien al clic. Prohibido admitir videos
// con menores visibles: esta semilla no lo valida sola, lo valida una persona que aprueba
// cada candidato.
//
// Fuente: todos los *.json de `seed/tutorial-sources/`. Cada entrada:
//   { trickId, provider, url, embedUrl, author, title, language, kind, aspect }
// Idempotente: reemplaza solo los tutoriales de los trucos del JSON; no toca los videos demo
// (Loopkicks ni los de `video-sources.ts`) ni la fila del tutorial en si.

interface SourceTutorial {
  trickId: string;
  provider: string;
  url: string;
  embedUrl: string | null;
  author: string | null;
  title: string | null;
  language: string;
  kind: string;
  aspect: string;
}

const SOURCES_DIR = new URL('./tutorial-sources/', import.meta.url);
const PROVIDERS = new Set(['youtube', 'vimeo', 'dailymotion', 'tiktok']);
const LANGUAGES = new Set(['es', 'en']);
const KINDS = new Set(['file', 'iframe', 'link']);
const ASPECTS = new Set(['16:9', '9:16']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function parseEntries(raw: unknown, file: string): SourceTutorial[] {
  if (!Array.isArray(raw)) {
    console.log(`  ${file}: no es un arreglo, se omite.`);
    return [];
  }
  const result: SourceTutorial[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const trickId = asString(item.trickId);
    const provider = asString(item.provider);
    const url = asString(item.url);
    const language = asString(item.language);
    const kind = asString(item.kind);
    const aspect = asString(item.aspect);
    if (
      trickId === null ||
      provider === null ||
      !PROVIDERS.has(provider) ||
      url === null ||
      language === null ||
      !LANGUAGES.has(language) ||
      kind === null ||
      !KINDS.has(kind) ||
      aspect === null ||
      !ASPECTS.has(aspect)
    ) {
      console.log(`  ${file}: entrada invalida (${String(item.trickId ?? '?')}), se omite.`);
      continue;
    }
    result.push({
      trickId,
      provider,
      url,
      embedUrl: asString(item.embedUrl),
      author: asString(item.author),
      title: asString(item.title),
      language,
      kind,
      aspect,
    });
  }
  return result;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  let files: string[];
  try {
    files = (await readdir(SOURCES_DIR)).filter((name) => name.endsWith('.json')).sort();
  } catch {
    console.log('No existe seed/tutorial-sources/; no se escribe nada.');
    return;
  }

  const entries: SourceTutorial[] = [];
  for (const file of files) {
    const raw = JSON.parse(
      await readFile(fileURLToPath(new URL(file, SOURCES_DIR)), 'utf8'),
    ) as unknown;
    entries.push(...parseEntries(raw, file));
  }

  if (entries.length === 0) {
    console.log('No hay tutoriales externos para sembrar; no se escribe nada.');
    return;
  }

  const db = getDb();
  const knownIds = new Set(
    (
      await db
        .select({ id: tricks.id })
        .from(tricks)
        .where(
          inArray(
            tricks.id,
            entries.map((entry) => entry.trickId),
          ),
        )
    ).map((row) => row.id),
  );

  const rows: NewVideo[] = [];
  const affected: string[] = [];
  let skipped = 0;

  for (const entry of entries) {
    if (!knownIds.has(entry.trickId)) {
      console.log(`  truco desconocido, se omite: ${entry.trickId}`);
      skipped += 1;
      continue;
    }
    rows.push({
      trickId: entry.trickId,
      r2Key: null,
      url: entry.url,
      mime: null,
      sizeBytes: null,
      durationSeconds: null,
      status: 'external',
      provider: entry.provider,
      embedUrl: entry.embedUrl,
      author: entry.author,
      title: entry.title,
      kind: entry.kind,
      aspect: entry.aspect,
      role: 'tutorial',
      language: entry.language,
    });
    affected.push(entry.trickId);
  }

  if (rows.length === 0) {
    console.log('Ninguna entrada coincide con un truco; no se escribe nada.');
    return;
  }

  // Borrado acotado a los tutoriales de los trucos del JSON; no toca los videos demo.
  // El driver neon-http no soporta transacciones: borrado e insercion van secuenciales e
  // idempotentes.
  await db
    .delete(videos)
    .where(and(inArray(videos.trickId, affected), eq(videos.role, 'tutorial')));

  await db.insert(videos).values(rows).onConflictDoNothing();

  console.log(`Tutoriales externos sembrados: ${rows.length}`);
  console.log(`Trucos cubiertos: ${new Set(affected).size}`);
  if (skipped > 0) {
    console.log(`Entradas omitidas: ${skipped}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar tutoriales externos: ${message}`);
  process.exitCode = 1;
});
