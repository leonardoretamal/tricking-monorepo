import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { inArray } from 'drizzle-orm';

import { getDb } from '../client';
import { gazeTipSections, gazeTipSummaries, gazeTips, transitions } from '../schema';
import { loadEnvFile } from './load-env';

// Semilla de la Fase 16 (tips de mirada). El contenido es original del proyecto, curado
// a mano y traducido al ingles (mismo orden y estructura). `trick_type` agrupa por
// seccion del catalogo y por el tipo curado `piso-transiciones`; `label` distingue el
// subcaso dentro de un tipo (rueda, scoot, flic flac, coindrop).
//
// Idempotente y sin transacciones (el driver neon-http no las soporta): los resumenes se
// hacen upsert por (kind, locale), los tips se reemplazan de forma acotada (se borran los
// tips de los locales sembrados, lo que arrastra el puente por cascada, y se insertan de
// nuevo) y el puente gaze_tip_sections se vuelve a construir.

interface GazeTipSeed {
  trickType: string;
  phase: string;
  label: string | null;
  instruction: string;
  warning: string | null;
  order: number;
}

interface GazeSummarySeed {
  kind: string;
  content: string;
  order: number;
}

interface GazeSectionSeed {
  gazeTipId: number;
  targetKind: string;
  targetSlug: string;
}

const TIPS_FILES = {
  es: new URL('./gaze-tips/tips-es.json', import.meta.url),
  en: new URL('./gaze-tips/tips-en.json', import.meta.url),
} as const;
const SUMMARIES_FILES = {
  es: new URL('./gaze-tips/summaries-es.json', import.meta.url),
  en: new URL('./gaze-tips/summaries-en.json', import.meta.url),
} as const;

const LOCALES = ['es', 'en'] as const;
const GAZE_PHASES = ['inicio', 'durante', 'caida'];
const GAZE_KINDS = ['idea_clave', 'regla_de_oro', 'resumen_corto'];

// Puente tipo de truco -> seccion del catalogo.
const TYPE_SECTIONS: Record<string, string> = {
  'vertical-kicks': 'vertical-kicks',
  backward: 'backward',
  forward: 'forward',
  inside: 'inside',
  outside: 'outside',
};

const PISO_TYPE = 'piso-transiciones';

// piso-transiciones: candidatos de transiciones reales por `order` (el mismo order en es
// y en). Solo se enlaza el candidato cuyo slug exista en la tabla `transitions`; si
// ninguno existe, el tip queda sin enlace de transicion.
const PISO_TRANSITION_CANDIDATES: Record<number, string[]> = {
  10: ['roundoff', 'punch'],
  20: ['scoot', 'pop'],
  30: ['flic-flac', 'backflip'],
  31: ['flic-flac', 'backflip'],
  32: ['flic-flac', 'backflip'],
  40: ['coindrop', 'drop'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function parseTips(raw: unknown, locale: string): GazeTipSeed[] {
  if (!Array.isArray(raw)) {
    throw new Error(`El JSON de tips (${locale}) no es un arreglo`);
  }
  const result: GazeTipSeed[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }
    const trickType = readString(entry, 'trickType');
    const phase = readString(entry, 'phase');
    const instruction = readString(entry, 'instruction');
    const order = entry.order;
    if (trickType === null || phase === null || instruction === null) {
      continue;
    }
    if (!GAZE_PHASES.includes(phase)) {
      throw new Error(`Fase desconocida en tips (${locale}): ${phase}`);
    }
    if (typeof order !== 'number' || !Number.isInteger(order)) {
      throw new Error(`Falta un order entero en tips (${locale}): ${instruction}`);
    }
    result.push({
      trickType,
      phase,
      label: readString(entry, 'label'),
      instruction,
      warning: readString(entry, 'warning'),
      order,
    });
  }
  return result;
}

function parseSummaries(raw: unknown, locale: string): GazeSummarySeed[] {
  if (!Array.isArray(raw)) {
    throw new Error(`El JSON de resumenes (${locale}) no es un arreglo`);
  }
  const result: GazeSummarySeed[] = [];
  for (const entry of raw) {
    if (!isRecord(entry)) {
      continue;
    }
    const kind = readString(entry, 'kind');
    const content = readString(entry, 'content');
    const order = entry.order;
    if (kind === null || content === null) {
      continue;
    }
    if (!GAZE_KINDS.includes(kind)) {
      throw new Error(`Kind desconocido en resumenes (${locale}): ${kind}`);
    }
    result.push({
      kind,
      content,
      order: typeof order === 'number' && Number.isInteger(order) ? order : 0,
    });
  }
  return result;
}

async function readJson(path: URL): Promise<unknown> {
  return JSON.parse(await readFile(fileURLToPath(path), 'utf8')) as unknown;
}

async function main(): Promise<void> {
  loadEnvFile('./.env');
  loadEnvFile(fileURLToPath(new URL('../../.env', import.meta.url)));

  const tipsByLocale = new Map<string, GazeTipSeed[]>();
  const summariesByLocale = new Map<string, GazeSummarySeed[]>();
  for (const locale of LOCALES) {
    tipsByLocale.set(locale, parseTips(await readJson(TIPS_FILES[locale]), locale));
    summariesByLocale.set(locale, parseSummaries(await readJson(SUMMARIES_FILES[locale]), locale));
  }

  const db = getDb();

  // Resumenes destacados: upsert por (kind, locale).
  let summaryCount = 0;
  for (const locale of LOCALES) {
    for (const summary of summariesByLocale.get(locale) ?? []) {
      await db
        .insert(gazeTipSummaries)
        .values({
          kind: summary.kind,
          content: summary.content,
          order: summary.order,
          locale,
        })
        .onConflictDoUpdate({
          target: [gazeTipSummaries.kind, gazeTipSummaries.locale],
          set: { content: summary.content, order: summary.order, updatedAt: new Date() },
        });
      summaryCount += 1;
    }
  }

  // Slugs de transiciones reales para decidir el puente de piso-transiciones.
  const transitionRows = await db.select({ slug: transitions.slug }).from(transitions);
  const existingTransitions = new Set(transitionRows.map((row) => row.slug));

  // Reemplazo acotado: se borran los tips de los locales sembrados. La FK del puente
  // tiene ON DELETE CASCADE, por eso se limpia gaze_tip_sections sola.
  await db.delete(gazeTips).where(inArray(gazeTips.locale, [...LOCALES]));

  const links: GazeSectionSeed[] = [];
  let tipCount = 0;
  for (const locale of LOCALES) {
    for (const tip of tipsByLocale.get(locale) ?? []) {
      const [row] = await db
        .insert(gazeTips)
        .values({
          trickType: tip.trickType,
          phase: tip.phase,
          label: tip.label,
          instruction: tip.instruction,
          warning: tip.warning,
          order: tip.order,
          locale,
        })
        .returning({ id: gazeTips.id });
      if (row === undefined) {
        continue;
      }
      tipCount += 1;

      const sectionSlug = TYPE_SECTIONS[tip.trickType];
      if (sectionSlug !== undefined) {
        links.push({ gazeTipId: row.id, targetKind: 'section', targetSlug: sectionSlug });
      }
      if (tip.trickType === PISO_TYPE) {
        for (const candidate of PISO_TRANSITION_CANDIDATES[tip.order] ?? []) {
          if (existingTransitions.has(candidate)) {
            links.push({ gazeTipId: row.id, targetKind: 'transition', targetSlug: candidate });
          }
        }
      }
    }
  }

  if (links.length > 0) {
    await db.insert(gazeTipSections).values(links).onConflictDoNothing();
  }

  console.log(
    `Tips de mirada: ${summaryCount} resumenes, ${tipCount} tips, ${links.length} enlaces al catalogo.`,
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error al sembrar tips de mirada: ${message}`);
  process.exitCode = 1;
});
