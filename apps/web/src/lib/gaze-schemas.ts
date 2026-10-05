import { z } from 'zod';

// Esquemas y constantes de la seccion de tips de mirada. Es un modulo cliente-seguro:
// no importa @tricking/db para no arrastrar el driver de Neon al bundle del navegador.

export const gazePhases = ['inicio', 'durante', 'caida'] as const;
export type GazePhase = (typeof gazePhases)[number];

export const gazeSummaryKinds = ['idea_clave', 'regla_de_oro', 'resumen_corto'] as const;
export type GazeSummaryKind = (typeof gazeSummaryKinds)[number];

// Orden de presentacion de los tipos de truco (espeja GAZE_TYPES de @tricking/db).
export const gazeTypeOrder = [
  'vertical-kicks',
  'backward',
  'forward',
  'inside',
  'outside',
  'piso-transiciones',
] as const;

// Color de categoria por tipo (reutiliza las clases tb-cat-* de globals.css).
export const gazeTypeColors: Record<
  string,
  'kicks' | 'flips' | 'twists' | 'transitions' | 'basics'
> = {
  'vertical-kicks': 'kicks',
  backward: 'twists',
  forward: 'flips',
  inside: 'twists',
  outside: 'transitions',
  'piso-transiciones': 'basics',
};

export function gazeTypeRank(trickType: string): number {
  const index = (gazeTypeOrder as readonly string[]).indexOf(trickType);
  return index === -1 ? gazeTypeOrder.length : index;
}

export function gazeTypeColor(trickType: string): string {
  return `tb-cat-${gazeTypeColors[trickType] ?? 'basics'}`;
}

export const gazeTipItemSchema = z.object({
  id: z.number(),
  trickType: z.string(),
  phase: z.string(),
  label: z.string().nullable(),
  instruction: z.string(),
  warning: z.string().nullable(),
  order: z.number(),
});

export const gazeTipSummarySchema = z.object({
  id: z.number(),
  kind: z.string(),
  content: z.string(),
  order: z.number(),
});

export const gazeTipTypeItemSchema = z.object({
  trickType: z.string(),
  label: z.string(),
  tipCount: z.number(),
});

export const gazeTargetRefSchema = z.object({
  targetKind: z.string(),
  targetSlug: z.string(),
});

export const gazeTipPhaseGroupSchema = z.object({
  phase: z.string(),
  tips: z.array(gazeTipItemSchema),
});

export const paginatedGazeTipsSchema = z.object({
  items: z.array(gazeTipItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const gazeSummariesResponseSchema = z.object({
  items: z.array(gazeTipSummarySchema),
});

export const gazeTipTypeDetailSchema = z.object({
  trickType: z.string(),
  label: z.string(),
  phases: z.array(gazeTipPhaseGroupSchema),
  targets: z.array(gazeTargetRefSchema),
});

export type GazeTipItem = z.infer<typeof gazeTipItemSchema>;
export type GazeTipSummary = z.infer<typeof gazeTipSummarySchema>;
export type GazeTipTypeItem = z.infer<typeof gazeTipTypeItemSchema>;
export type GazeTargetRef = z.infer<typeof gazeTargetRefSchema>;
export type GazeTipPhaseGroup = z.infer<typeof gazeTipPhaseGroupSchema>;
export type PaginatedGazeTips = z.infer<typeof paginatedGazeTipsSchema>;
export type GazeSummariesResponse = z.infer<typeof gazeSummariesResponseSchema>;
export type GazeTipTypeDetail = z.infer<typeof gazeTipTypeDetailSchema>;
