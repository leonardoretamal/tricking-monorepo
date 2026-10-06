import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { asc, isNotNull } from 'drizzle-orm';

import { getDb } from '../client';
import { tricks } from '../schema';
import { loadEnvFile } from './load-env';

// Traduce al espanol las descripciones tecnicas que Loopkicks publica en su ficha de
// truco (`tricks.loopkicks_notes`). Es contenido de Loopkicks: la traduccion es una
// cortesia del proyecto y mantiene la atribucion y el enlace que ya muestra la app. El
// resultado se guarda versionado en `translations/loopkicks-notes-es.json` con la forma
// `{ "<trickId>": "texto en espanol" }` y se aplica con `db:loopkicks-notes-es`.
//
// El script es idempotente: si una clave ya existe con valor no vacio, la salta; asi se
// puede reanudar sin volver a traducir lo hecho. Traduce por lotes llamando a un endpoint
// compatible con OpenAI por HTTP (sin SDK). Proveedor principal: Groq. Respaldo: NVIDIA
// NIM. Si una tanda falla tras los reintentos, esas notas quedan fuera del JSON y se
// reporta cuantas. La clave de API nunca se imprime.

const OUTPUT_FILE = new URL('./translations/loopkicks-notes-es.json', import.meta.url);

const BATCH_SIZE = 12;
const MAX_ATTEMPTS = 3;
const RETRY_BASE_MS = 2000;
const REQUEST_GAP_MS = 1200;

interface Provider {
  name: string;
  url: string;
  apiKey: string;
  model: string;
  jsonMode: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function providerFromEnv(): Provider | null {
  const groqKey = process.env.AI_GROQ_API_KEY?.trim() ?? '';
  if (groqKey !== '') {
    return {
      name: 'Groq',
      url: 'https://api.groq.com/openai/v1/chat/completions',
      apiKey: groqKey,
      model: process.env.AI_GROQ_MODEL?.trim() || 'openai/gpt-oss-120b',
      jsonMode: true,
    };
  }
  return providerFromFallbackEnv();
}

function providerFromFallbackEnv(): Provider | null {
  const nvidiaKey = process.env.AI_NVIDIA_API_KEY?.trim() ?? '';
  if (nvidiaKey !== '') {
    return {
      name: 'NVIDIA NIM',
      url: 'https://integrate.api.nvidia.com/v1/chat/completions',
      apiKey: nvidiaKey,
      model: process.env.AI_NVIDIA_MODEL?.trim() || 'nvidia/nemotron-3-super-120b-a12b',
      jsonMode: false,
    };
  }
  return null;
}

async function loadExisting(): Promise<Record<string, string>> {
  try {
    const raw = await readFile(fileURLToPath(OUTPUT_FILE), 'utf8');
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const result: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
        if (typeof value === 'string' && value.trim() !== '') {
          result[key] = value;
        }
      }
      return result;
    }
  } catch {
    return {};
  }
  return {};
}

async function loadNotes(): Promise<Array<{ id: string; note: string }>> {
  const db = getDb();
  const rows = await db
    .select({ id: tricks.id, note: tricks.loopkicksNotes })
    .from(tricks)
    .where(isNotNull(tricks.loopkicksNotes))
    .orderBy(asc(tricks.id));

  return rows
    .filter((row): row is { id: string; note: string } => (row.note ?? '').trim() !== '')
    .map((row) => ({ id: row.id, note: row.note.trim() }));
}

// El repo prohibe el em dash (U+2014) y el en dash (U+2013). El modelo los introduce a
// veces como inciso; se normalizan a coma para respetar la regla.
function normalizeDashes(text: string): string {
  return text
    .replace(/\s*[\u2014\u2013]\s*/g, ', ')
    .replace(/,\s*,/g, ',')
    .trim();
}

function extractJson(text: string): Record<string, unknown> {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('La respuesta no contiene un objeto JSON.');
  }
  return JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>;
}

async function callProvider(provider: Provider, batch: Array<{ id: string; note: string }>) {
  const system =
    'Eres un traductor tecnico especializado en tricking (acrobacias marciales). ' +
    'Traduce cada texto del ingles al espanol neutro latinoamericano. Reglas: ' +
    'manten sin traducir los nombres de trucos y terminos estandar del deporte ' +
    '(por ejemplo b-twist, aerial, raiz, cheat kick, roundoff, backflip, punch); ' +
    'conserva el sentido tecnico; no agregues explicaciones ni comentarios. ' +
    'Devuelve EXCLUSIVAMENTE un objeto JSON valido cuyas claves son los mismos ids ' +
    'recibidos y cuyos valores son la traduccion. No incluyas texto fuera del JSON.';

  const entries: Record<string, string> = {};
  for (const item of batch) {
    entries[item.id] = item.note;
  }

  const body: Record<string, unknown> = {
    model: provider.model,
    temperature: 0.2,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: `Traduce estos textos y devuelve un JSON con las mismas claves:\n${JSON.stringify(entries)}`,
      },
    ],
  };
  if (provider.jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(provider.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`HTTP ${response.status}${detail ? `: ${detail.slice(0, 200)}` : ''}`);
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? '';
    if (content.trim() === '') {
      throw new Error('Respuesta vacia del proveedor.');
    }
    const parsed = extractJson(content);

    const result: Record<string, string> = {};
    for (const item of batch) {
      const value = parsed[item.id];
      if (typeof value === 'string' && value.trim() !== '') {
        result[item.id] = normalizeDashes(value);
      }
    }
    if (Object.keys(result).length === 0) {
      throw new Error('El JSON devuelto no tiene traducciones utiles.');
    }
    return result;
  } finally {
    clearTimeout(timer);
  }
}

async function translateBatch(
  providers: Provider[],
  batch: Array<{ id: string; note: string }>,
): Promise<Record<string, string>> {
  let lastError = '';
  for (const provider of providers) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
      try {
        return await callProvider(provider, batch);
      } catch (error: unknown) {
        lastError = error instanceof Error ? error.message : String(error);
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_BASE_MS * attempt);
        }
      }
    }
  }
  throw new Error(lastError || 'Todos los proveedores fallaron.');
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const primary = providerFromEnv();
  const fallback = providerFromFallbackEnv();
  const providers = [primary, fallback].filter(
    (provider): provider is Provider => provider !== null,
  );
  if (providers.length === 0) {
    console.log('No hay proveedor de IA configurado (AI_GROQ_API_KEY o AI_NVIDIA_API_KEY).');
    process.exitCode = 1;
    return;
  }
  if (primary && fallback) {
    console.log(`Proveedor principal: ${primary.name}. Respaldo: ${fallback.name}.`);
  } else if (providers[0]) {
    console.log(`Proveedor: ${providers[0].name}.`);
  }

  const notes = await loadNotes();
  const existing = await loadExisting();
  const pending = notes.filter((item) => !(item.id in existing));

  console.log(`Notas en la base: ${notes.length}. Ya traducidas: ${Object.keys(existing).length}.`);
  console.log(`Pendientes: ${pending.length}.`);
  if (pending.length === 0) {
    console.log('No hay nada por traducir; el JSON queda igual.');
    return;
  }

  const merged: Record<string, string> = { ...existing };
  let translated = 0;
  let failed = 0;

  for (let offset = 0; offset < pending.length; offset += BATCH_SIZE) {
    const batch = pending.slice(offset, offset + BATCH_SIZE);
    const batchNumber = Math.floor(offset / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pending.length / BATCH_SIZE);
    try {
      const result = await translateBatch(providers, batch);
      for (const [id, value] of Object.entries(result)) {
        merged[id] = value;
      }
      translated += Object.keys(result).length;
      console.log(
        `Tanda ${batchNumber}/${totalBatches}: ${Object.keys(result).length} traducciones (acumulado ${translated}).`,
      );
    } catch (error: unknown) {
      failed += batch.length;
      const message = error instanceof Error ? error.message : String(error);
      console.log(
        `Tanda ${batchNumber}/${totalBatches} fallida (${batch.length} sin traducir): ${message}`,
      );
    }

    const ordered = Object.fromEntries(
      Object.keys(merged)
        .sort()
        .map((key) => [key, merged[key]]),
    );
    await writeFile(fileURLToPath(OUTPUT_FILE), `${JSON.stringify(ordered, null, 2)}\n`, 'utf8');

    if (offset + BATCH_SIZE < pending.length) {
      await sleep(REQUEST_GAP_MS);
    }
  }

  console.log(
    `Total en el JSON: ${Object.keys(merged).length}. Traducidas en esta corrida: ${translated}. Sin traducir en esta corrida: ${failed}.`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al traducir notas de Loopkicks: ${message}`);
  process.exitCode = 1;
});
