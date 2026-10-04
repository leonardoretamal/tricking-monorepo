import { z } from 'zod';

import { SECTIONS, isSection, type Section } from './sections';

// Esquemas del grafo de la Explore Page (Fase 11). El cliente valida con Zod lo que
// recibe de /api/graph (y lo rehidratado desde el cache persistido). Este modulo es
// cliente-seguro: no importa @tricking/db para no arrastrar el driver a navegador;
// las secciones se comparten con @/lib/sections.

export const DEFAULT_GRAPH_NODES = 150;
export const MAX_GRAPH_NODES = 300;

// Categorias y stances que la interfaz ofrece como filtro. Las categorias son las que
// tienen color y etiqueta propia; los stances son los seis de Loopkicks.
export const GRAPH_CATEGORIES = ['VERT_KICK', 'TWIST', 'FLIP', 'GROUNDWORK', 'VARIATION'] as const;
export const GRAPH_STANCES = [
  'backside',
  'frontside',
  'complete',
  'hyper',
  'mega',
  'semi',
] as const;

export type GraphCategory = (typeof GRAPH_CATEGORIES)[number];
export type GraphStance = (typeof GRAPH_STANCES)[number];

export const graphQuerySchema = z.object({
  section: z.enum(SECTIONS).optional(),
  category: z.enum(GRAPH_CATEGORIES).optional(),
  difficulty: z.coerce.number().int().min(0).max(5).optional(),
  stance: z.enum(GRAPH_STANCES).optional(),
  maxNodes: z.coerce.number().int().min(1).max(MAX_GRAPH_NODES).default(DEFAULT_GRAPH_NODES),
});

export const graphNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  section: z.string().nullable(),
  difficulty: z.number().nullable(),
  categories: z.array(z.string()),
  stances: z.array(z.string()),
});

export const graphEdgeSchema = z.object({
  source: z.string(),
  target: z.string(),
  kind: z.enum(['prereq', 'next', 'stance', 'variation']),
});

export const graphResponseSchema = z.object({
  nodes: z.array(graphNodeSchema),
  edges: z.array(graphEdgeSchema),
  total: z.number(),
  maxNodes: z.number(),
  truncated: z.boolean(),
  traceId: z.string().optional(),
});

export type GraphQuery = z.infer<typeof graphQuerySchema>;
export type GraphNodeItem = z.infer<typeof graphNodeSchema>;
export type GraphEdgeItem = z.infer<typeof graphEdgeSchema>;
export type GraphResponse = z.infer<typeof graphResponseSchema>;

export interface GraphFilters {
  section?: Section;
  category?: GraphCategory;
  difficulty?: number;
  stance?: GraphStance;
}

export function isGraphCategory(value: string): value is GraphCategory {
  return (GRAPH_CATEGORIES as readonly string[]).includes(value);
}

export function isGraphStance(value: string): value is GraphStance {
  return (GRAPH_STANCES as readonly string[]).includes(value);
}

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

// Normaliza los filtros de la URL antes de consultar el backend. El estado vive en la
// URL (query params); al cambiar un filtro se vuelve a construir la query completa.
export function parseGraphFilters(
  searchParams: Record<string, string | string[] | undefined>,
): GraphFilters {
  const sectionRaw = first(searchParams.section);
  const section = sectionRaw !== undefined && isSection(sectionRaw) ? sectionRaw : undefined;

  const categoryRaw = first(searchParams.category);
  const category =
    categoryRaw !== undefined && isGraphCategory(categoryRaw) ? categoryRaw : undefined;

  const difficultyRaw = Number.parseInt(first(searchParams.difficulty) ?? '', 10);
  const difficulty =
    Number.isInteger(difficultyRaw) && difficultyRaw >= 0 && difficultyRaw <= 5
      ? difficultyRaw
      : undefined;

  const stanceRaw = first(searchParams.stance);
  const stance = stanceRaw !== undefined && isGraphStance(stanceRaw) ? stanceRaw : undefined;

  return { section, category, difficulty, stance };
}
