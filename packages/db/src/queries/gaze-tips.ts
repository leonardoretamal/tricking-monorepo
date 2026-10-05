import { and, asc, count, eq, sql, type SQL } from 'drizzle-orm';

import { getDb } from '../client';
import { gazeTipSections, gazeTipSummaries, gazeTips } from '../schema';

// Tips de mirada (Fase 16). El contenido es original del proyecto y esta curado a mano.
// `phase` es inicio, durante o caida; `label` distingue el subcaso cuando un tipo agrupa
// varios trucos (por ejemplo rueda, scoot, flic flac y coindrop dentro de
// piso-transiciones). Filtros, orden, paginacion y total se resuelven en la base.

export const GAZE_PHASES = ['inicio', 'durante', 'caida'] as const;
export type GazePhase = (typeof GAZE_PHASES)[number];

export const GAZE_SUMMARY_KINDS = ['idea_clave', 'regla_de_oro', 'resumen_corto'] as const;
export type GazeSummaryKind = (typeof GAZE_SUMMARY_KINDS)[number];

export const DEFAULT_GAZE_PAGE_SIZE = 50;
export const MAX_GAZE_PAGE_SIZE = 200;

// Tipos de truco curados de la seccion con su etiqueta por locale. El orden del arreglo
// es el orden de presentacion en el listado y en las tabs.
export const GAZE_TYPES = [
  { slug: 'vertical-kicks', labelEs: 'Patadas verticales', labelEn: 'Vertical kicks' },
  { slug: 'backward', labelEs: 'Hacia atrás', labelEn: 'Backward' },
  { slug: 'forward', labelEs: 'Hacia adelante', labelEn: 'Forward' },
  { slug: 'inside', labelEs: 'Interior', labelEn: 'Inside' },
  { slug: 'outside', labelEs: 'Exterior', labelEn: 'Outside' },
  {
    slug: 'piso-transiciones',
    labelEs: 'Piso y transiciones',
    labelEn: 'Floor and transitions',
  },
] as const;

export function gazeTypeLabel(trickType: string, locale: string): string {
  const entry = GAZE_TYPES.find((item) => item.slug === trickType);
  if (!entry) {
    return trickType;
  }
  return locale.startsWith('es') ? entry.labelEs : entry.labelEn;
}

export interface GazeTipItem {
  id: number;
  trickType: string;
  phase: string;
  label: string | null;
  instruction: string;
  warning: string | null;
  order: number;
}

export interface ListGazeTipsParams {
  trickType?: string;
  phase?: string;
  locale?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedGazeTips {
  items: GazeTipItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface GazeSummaryItem {
  id: number;
  kind: string;
  content: string;
  order: number;
}

export interface GazeTipTypeItem {
  trickType: string;
  label: string;
  tipCount: number;
}

export interface GazeTargetRef {
  targetKind: string;
  targetSlug: string;
}

export interface GazeTipPhaseGroup {
  phase: string;
  tips: GazeTipItem[];
}

export interface GazeTipTypeDetail {
  trickType: string;
  label: string;
  phases: GazeTipPhaseGroup[];
  targets: GazeTargetRef[];
}

// Orden de las fases: inicio, durante, caida y cualquier fase nueva al final.
const phaseRank = sql`case ${gazeTips.phase} when 'inicio' then 0 when 'durante' then 1 when 'caida' then 2 else 3 end`;

const tipColumns = {
  id: gazeTips.id,
  trickType: gazeTips.trickType,
  phase: gazeTips.phase,
  label: gazeTips.label,
  instruction: gazeTips.instruction,
  warning: gazeTips.warning,
  order: gazeTips.order,
};

export async function listGazeTips(params: ListGazeTipsParams): Promise<PaginatedGazeTips> {
  const db = getDb();
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(
    MAX_GAZE_PAGE_SIZE,
    Math.max(1, params.pageSize ?? DEFAULT_GAZE_PAGE_SIZE),
  );

  const conditions: SQL[] = [];
  const trickType = params.trickType?.trim();
  if (trickType !== undefined && trickType !== '') {
    conditions.push(eq(gazeTips.trickType, trickType));
  }
  const phase = params.phase?.trim();
  if (phase !== undefined && phase !== '') {
    conditions.push(eq(gazeTips.phase, phase));
  }
  const locale = params.locale?.trim();
  if (locale !== undefined && locale !== '') {
    conditions.push(eq(gazeTips.locale, locale));
  }
  const where = and(...conditions);

  const [countRow] = await db.select({ value: count() }).from(gazeTips).where(where);
  const total = countRow?.value ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const items = await db
    .select(tipColumns)
    .from(gazeTips)
    .where(where)
    .orderBy(asc(gazeTips.trickType), phaseRank, asc(gazeTips.order), asc(gazeTips.id))
    .limit(pageSize)
    .offset((currentPage - 1) * pageSize);

  return {
    items,
    total,
    page: currentPage,
    pageSize,
    totalPages,
  };
}

export async function listGazeTipSummaries(locale: string): Promise<GazeSummaryItem[]> {
  const db = getDb();
  return db
    .select({
      id: gazeTipSummaries.id,
      kind: gazeTipSummaries.kind,
      content: gazeTipSummaries.content,
      order: gazeTipSummaries.order,
    })
    .from(gazeTipSummaries)
    .where(eq(gazeTipSummaries.locale, locale))
    .orderBy(asc(gazeTipSummaries.order), asc(gazeTipSummaries.id));
}

export async function listGazeTipTypes(locale: string): Promise<GazeTipTypeItem[]> {
  const db = getDb();
  const rows = await db
    .select({ trickType: gazeTips.trickType, value: count() })
    .from(gazeTips)
    .where(eq(gazeTips.locale, locale))
    .groupBy(gazeTips.trickType);

  const typeOrder = new Map<string, number>(GAZE_TYPES.map((item, index) => [item.slug, index]));
  return rows
    .map((row) => ({
      trickType: row.trickType,
      label: gazeTypeLabel(row.trickType, locale),
      tipCount: row.value,
    }))
    .sort((a, b) => {
      const rank = (typeOrder.get(a.trickType) ?? 999) - (typeOrder.get(b.trickType) ?? 999);
      return rank !== 0 ? rank : a.trickType.localeCompare(b.trickType);
    });
}

export async function getGazeTipType(
  slug: string,
  locale: string,
): Promise<GazeTipTypeDetail | null> {
  const db = getDb();

  const rows = await db
    .select(tipColumns)
    .from(gazeTips)
    .where(and(eq(gazeTips.trickType, slug), eq(gazeTips.locale, locale)))
    .orderBy(phaseRank, asc(gazeTips.order), asc(gazeTips.id));

  if (rows.length === 0) {
    return null;
  }

  const phases: GazeTipPhaseGroup[] = [];
  for (const phase of GAZE_PHASES) {
    const tips = rows.filter((row) => row.phase === phase);
    if (tips.length > 0) {
      phases.push({ phase, tips });
    }
  }
  const knownPhases: readonly string[] = GAZE_PHASES;
  for (const row of rows) {
    if (knownPhases.includes(row.phase)) {
      continue;
    }
    const group = phases.find((item) => item.phase === row.phase);
    if (group !== undefined) {
      group.tips.push(row);
    } else {
      phases.push({ phase: row.phase, tips: [row] });
    }
  }

  const targets = await db
    .selectDistinct({
      targetKind: gazeTipSections.targetKind,
      targetSlug: gazeTipSections.targetSlug,
    })
    .from(gazeTipSections)
    .innerJoin(gazeTips, eq(gazeTipSections.gazeTipId, gazeTips.id))
    .where(and(eq(gazeTips.trickType, slug), eq(gazeTips.locale, locale)));

  return {
    trickType: slug,
    label: gazeTypeLabel(slug, locale),
    phases,
    targets,
  };
}
