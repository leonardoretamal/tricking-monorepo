import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

// Descarga y subida de los videos de Loopkicks a Cloudflare R2 (Fase 14).
//
// - Entrada: apps/scraper/data/loopkicks-videos.json (URLs reales del scraper).
// - Salida:  apps/scraper/data/r2-videos-manifest.json (manifiesto que consume la semilla).
// - Credenciales SOLO por variables de entorno (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
//   R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL). Nunca se imprimen.
// - Si falta cualquiera de las credenciales, el script falla con un mensaje claro y no
//   sube nada.
// - Si `ffmpeg` esta disponible, transcodifica a 720p H.264 para acotar el peso (meta de
//   no pasar el free tier de 10 GB). Si no esta, sube el original con un aviso y sin
//   fallar.
// - Idempotente: fusiona el manifiesto previo para no resubir lo ya cargado.

interface ScrapedVideo {
  slug: string;
  name: string;
  section: string;
  url: string;
  mime: string | null;
}

interface ManifestEntry {
  slug: string;
  r2Key: string;
  mime: string;
  sizeBytes: number;
  durationSeconds: number | null;
  uploadedAt: string;
}

interface Manifest {
  generatedAt: string;
  entries: ManifestEntry[];
}

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const VIDEOS_PATH = join(DATA_DIR, 'loopkicks-videos.json');
const MANIFEST_PATH = join(DATA_DIR, 'r2-videos-manifest.json');

const KEY_PREFIX = 'videos/loopkicks';
const DOWNLOAD_TIMEOUT_MS = 120_000;
const REQUIRED_ENV = [
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
] as const;

function describeError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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

// Carga el .env del monorepo desde las ubicaciones tipicas segun desde donde se invoque el
// script (raiz, apps/scraper o el directorio actual). No pisa variables ya definidas.
function loadEnv(): void {
  const candidates = [
    join(process.cwd(), '.env'),
    join(process.cwd(), '..', '.env'),
    join(process.cwd(), '..', '..', '.env'),
  ];
  for (const candidate of candidates) {
    loadEnvFile(candidate);
  }
}

function parseOption(name: string): string | null {
  const prefix = `--${name}=`;
  const fromArgv = process.argv.find((arg) => arg.startsWith(prefix));
  if (fromArgv !== undefined) {
    return fromArgv.slice(prefix.length);
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseVideos(raw: unknown): ScrapedVideo[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  const result: ScrapedVideo[] = [];
  for (const item of raw) {
    if (!isRecord(item)) {
      continue;
    }
    const { slug, name, section, url, mime } = item;
    if (typeof slug !== 'string' || typeof url !== 'string') {
      continue;
    }
    result.push({
      slug,
      name: typeof name === 'string' ? name : slug,
      section: typeof section === 'string' ? section : '',
      url,
      mime: typeof mime === 'string' ? mime : null,
    });
  }

  return result;
}

async function readManifest(): Promise<ManifestEntry[]> {
  try {
    const raw: unknown = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
    if (!isRecord(raw) || !Array.isArray(raw.entries)) {
      return [];
    }
    return raw.entries.flatMap((entry): ManifestEntry[] => {
      if (!isRecord(entry)) {
        return [];
      }
      const { slug, r2Key, mime, sizeBytes, durationSeconds, uploadedAt } = entry;
      if (typeof slug !== 'string' || typeof r2Key !== 'string') {
        return [];
      }
      return [
        {
          slug,
          r2Key,
          mime: typeof mime === 'string' ? mime : 'video/mp4',
          sizeBytes: typeof sizeBytes === 'number' ? sizeBytes : 0,
          durationSeconds: typeof durationSeconds === 'number' ? durationSeconds : null,
          uploadedAt: typeof uploadedAt === 'string' ? uploadedAt : new Date().toISOString(),
        },
      ];
    });
  } catch {
    return [];
  }
}

function sanitizeSegment(value: string): string {
  const cleaned = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned === '' ? 'video' : cleaned;
}

function r2KeyFor(video: ScrapedVideo): string {
  const folder = sanitizeSegment(video.section === '' ? 'misc' : video.section);
  return `${KEY_PREFIX}/${folder}/${sanitizeSegment(video.slug)}.mp4`;
}

function ffmpegBinary(): string {
  const configured = process.env.FFMPEG_PATH;
  return configured !== undefined && configured.trim() !== '' ? configured.trim() : 'ffmpeg';
}

function hasFfmpeg(binary: string): boolean {
  const result = spawnSync(binary, ['-version'], { encoding: 'utf8' });
  return result.status === 0;
}

function transcode(
  binary: string,
  input: string,
  output: string,
): { ok: boolean; error: string | null } {
  const result = spawnSync(
    binary,
    [
      '-y',
      '-i',
      input,
      '-vf',
      'scale=-2:720',
      '-c:v',
      'libx264',
      '-preset',
      'veryfast',
      '-crf',
      '28',
      '-movflags',
      '+faststart',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      output,
    ],
    { encoding: 'utf8' },
  );

  if (result.status === 0) {
    return { ok: true, error: null };
  }
  return { ok: false, error: describeError(result.stderr ?? 'ffmpeg fallo') };
}

async function download(url: string, destination: string): Promise<void> {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'TrickingMonorepoScraper/0.1' },
    signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(destination, bytes);
}

async function main(): Promise<void> {
  loadEnv();
  const missing = REQUIRED_ENV.filter((name) => {
    const value = process.env[name];
    return value === undefined || value.trim() === '';
  });
  if (missing.length > 0) {
    console.error(
      `Faltan credenciales de R2 (${missing.join(', ')}). No se sube nada. ` +
        'Configuralas en el entorno o en el .env de la raiz; consulta .env.example.',
    );
    process.exitCode = 1;
    return;
  }

  const accountId = process.env.R2_ACCOUNT_ID ?? '';
  const bucket = process.env.R2_BUCKET ?? '';

  let rawVideos: unknown;
  try {
    rawVideos = JSON.parse(await readFile(VIDEOS_PATH, 'utf8'));
  } catch (error) {
    console.error(`No se pudo leer ${VIDEOS_PATH}: ${describeError(error)}`);
    process.exitCode = 1;
    return;
  }

  let videos = parseVideos(rawVideos);
  if (videos.length === 0) {
    console.log('No hay videos para subir.');
    return;
  }

  const limitRaw = parseOption('limit');
  if (limitRaw !== null) {
    const limit = Number.parseInt(limitRaw, 10);
    if (Number.isFinite(limit) && limit > 0) {
      videos = videos.slice(0, limit);
    }
  }
  const onlySlug = parseOption('slug');
  if (onlySlug !== null) {
    videos = videos.filter((video) => video.slug === onlySlug);
  }
  if (videos.length === 0) {
    console.log('No hay videos que coincidan con el filtro.');
    return;
  }

  const previousEntries = await readManifest();
  const manifestBySlug = new Map(previousEntries.map((entry) => [entry.slug, entry]));

  const binary = ffmpegBinary();
  const ffmpegAvailable = hasFfmpeg(binary);
  if (ffmpegAvailable) {
    console.log(`ffmpeg disponible (${binary}); se transcodifica a 720p H.264.`);
  } else {
    console.log(
      `Aviso: ffmpeg no esta disponible (${binary}); se sube el video original sin transcode.`,
    );
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? '',
    },
  });

  const workDir = await mkdtemp(join(tmpdir(), 'tricking-videos-'));
  let uploaded = 0;
  let failed = 0;
  let skipped = 0;

  try {
    for (const video of videos) {
      if (manifestBySlug.has(video.slug)) {
        skipped += 1;
        continue;
      }

      const originalPath = join(workDir, `${sanitizeSegment(video.slug)}-original`);
      const outputPath = join(workDir, `${sanitizeSegment(video.slug)}.mp4`);
      const r2Key = r2KeyFor(video);

      try {
        await download(video.url, originalPath);

        let uploadPath = originalPath;
        let mime = video.mime ?? 'video/mp4';

        if (ffmpegAvailable) {
          const result = transcode(binary, originalPath, outputPath);
          if (result.ok) {
            uploadPath = outputPath;
            mime = 'video/mp4';
          } else {
            console.warn(
              `Aviso: fallo el transcode de ${video.slug}; se sube el original. ${result.error}`,
            );
          }
        }

        const body = await readFile(uploadPath);
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: r2Key,
            Body: body,
            ContentType: mime,
            CacheControl: 'public, max-age=31536000, immutable',
          }),
        );

        const entry: ManifestEntry = {
          slug: video.slug,
          r2Key,
          mime,
          sizeBytes: body.byteLength,
          durationSeconds: null,
          uploadedAt: new Date().toISOString(),
        };
        manifestBySlug.set(video.slug, entry);
        uploaded += 1;
        console.log(`Subido: ${video.slug} (${r2Key})`);
      } catch (error) {
        failed += 1;
        console.error(`Error al subir ${video.slug}: ${describeError(error)}`);
      }
    }
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }

  const entries = [...manifestBySlug.values()].sort((a, b) => a.slug.localeCompare(b.slug, 'en'));
  const manifest: Manifest = { generatedAt: new Date().toISOString(), entries };
  await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log(`Subidos: ${uploaded}. Omitidos (ya subidos): ${skipped}. Fallidos: ${failed}.`);
  console.log(`Manifiesto actualizado en ${MANIFEST_PATH}`);
}

main().catch((error: unknown) => {
  console.error(`Error fatal: ${describeError(error)}`);
  process.exitCode = 1;
});
