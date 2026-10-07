import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { and, inArray, isNotNull } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks, videos, type NewVideo } from '../schema';
import { loadEnvFile } from './load-env';

// Semilla de videos de fuentes externas (Fase 44). Cubre los trucos que quedaron sin video
// (los manuales de la Fase 25 y los dos de la Fase 38). Politica de contenido: no se
// re-hospeda nada; cada truco guarda la URL original del creador con su credito. Los de
// YouTube/Vimeo/Dailymotion se presentan con fachada al clic ('iframe') o como tarjeta
// ('link'); los de Loopkicks siguen viniendo de `videos.ts` ('file').
//
// Fuente: todos los *.json de `seed/video-sources/`. Cada entrada:
//   { trickId, provider, url, embedUrl, author, title, kind, aspect }
// Idempotente: reemplaza solo los videos de terceros de los trucos del JSON; no toca las
// filas de Loopkicks (provider 'loopkicks') ni los videos de tutoriales.
//
// Regla dura (reglas-legal.md): prohibido admitir videos que involucren a menores. Esta
// semilla no lo valida sola; lo valida una persona al aprobar cada candidato.

interface SourceVideo {
  trickId: string;
  provider: string;
  url: string;
  embedUrl: string | null;
  author: string | null;
  title: string | null;
  kind: string;
  aspect: string;
}

const SOURCES_DIR = new URL('./video-sources/', import.meta.url);
const PROVIDERS = new Set(['youtube', 'vimeo', 'dailymotion']);
const KINDS = new Set(['file', 'iframe', 'link']);
const ASPECTS = new Set(['16:9', '9:16']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

function parseEntries(raw: unknown, file: string): SourceVideo[] {
  if (!Array.isArray(raw)) {
    console.log(`  ${file}: no es un arreglo, se omite.`);
    return [];
  }
  const result: SourceVideo[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const trickId = asString(item.trickId);
    const provider = asString(item.provider);
    const url = asString(item.url);
    const kind = asString(item.kind);
    const aspect = asString(item.aspect);
    if (
      trickId === null ||
      provider === null ||
      !PROVIDERS.has(provider) ||
      url === null ||
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
    console.log('No existe seed/video-sources/; no se escribe nada.');
    return;
  }

  const entries: SourceVideo[] = [];
  for (const file of files) {
    const raw = JSON.parse(
      await readFile(fileURLToPath(new URL(file, SOURCES_DIR)), 'utf8'),
    ) as unknown;
    entries.push(...parseEntries(raw, file));
  }

  if (entries.length === 0) {
    console.log('No hay videos externos para sembrar; no se escribe nada.');
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
    });
    affected.push(entry.trickId);
  }

  if (rows.length === 0) {
    console.log('Ninguna entrada coincide con un truco; no se escribe nada.');
    return;
  }

  // Borrado acotado a los videos de terceros de los trucos del JSON (nunca los de Loopkicks
  // ni los de tutoriales). El driver neon-http no soporta transacciones: borrado e insercion
  // van secuenciales e idempotentes.
  await db
    .delete(videos)
    .where(
      and(
        inArray(videos.trickId, affected),
        isNotNull(videos.provider),
        inArray(videos.provider, ['youtube', 'vimeo', 'dailymotion']),
      ),
    );

  await db.insert(videos).values(rows).onConflictDoNothing();

  console.log(`Videos externos sembrados: ${rows.length}`);
  console.log(`Trucos cubiertos: ${new Set(affected).size}`);
  if (skipped > 0) {
    console.log(`Entradas omitidas: ${skipped}`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar videos externos: ${message}`);
  process.exitCode = 1;
});
