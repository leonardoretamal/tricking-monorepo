import { and, asc, count, eq, inArray, isNull, sql } from 'drizzle-orm';

import { getDb } from '../client';
import {
  categories,
  stances,
  trickCategories,
  trickRelations,
  trickStances,
  tricks,
  variationExamples,
} from '../schema';
import type { TrickSection } from './tricks';

// Grafo de la Explore Page (Fase 11). Los nodos son trucos y las aristas salen de las
// relaciones truco-truco (prereq/next), de los stances compartidos y de las variaciones
// compartidas. Todo el filtrado, el limite y el total se resuelven en SQL; nunca se trae
// el catalogo completo a memoria. Las aristas se construyen despues, acotadas a los ids
// ya seleccionados, con consultas por lote (sin N+1).

export const DEFAULT_GRAPH_NODES = 150;
export const MAX_GRAPH_NODES = 300;

// Tope de miembros por grupo al generar cliques de stances o variaciones compartidas.
// Evita explotar el numero de aristas si un grupo concentra muchos trucos.
const MAX_CLIQUE_MEMBERS = 8;

export interface GraphParams {
  section?: TrickSection;
  category?: string;
  difficulty?: number;
  stance?: string;
  maxNodes?: number;
}

export interface GraphNode {
  id: string;
  name: string;
  section: string | null;
  difficulty: number | null;
  categories: string[];
  stances: string[];
}

export type GraphEdgeKind = 'prereq' | 'next' | 'stance' | 'variation';

export interface GraphEdge {
  source: string;
  target: string;
  kind: GraphEdgeKind;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  total: number;
  maxNodes: number;
  truncated: boolean;
}

async function categoryMapFor(trickIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (trickIds.length === 0) {
    return map;
  }

  const db = getDb();
  const rows = await db
    .select({ trickId: trickCategories.trickId, slug: categories.slug })
    .from(trickCategories)
    .innerJoin(categories, eq(trickCategories.categoryId, categories.id))
    .where(inArray(trickCategories.trickId, trickIds));

  for (const row of rows) {
    const bucket = map.get(row.trickId);
    if (bucket) {
      bucket.push(row.slug);
    } else {
      map.set(row.trickId, [row.slug]);
    }
  }
  return map;
}

async function stanceMapFor(trickIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (trickIds.length === 0) {
    return map;
  }

  const db = getDb();
  const rows = await db
    .select({ trickId: trickStances.trickId, slug: stances.slug })
    .from(trickStances)
    .innerJoin(stances, eq(trickStances.stanceId, stances.id))
    .where(inArray(trickStances.trickId, trickIds));

  for (const row of rows) {
    const bucket = map.get(row.trickId);
    if (bucket) {
      bucket.push(row.slug);
    } else {
      map.set(row.trickId, [row.slug]);
    }
  }
  return map;
}

// Añade una arista no dirigida (clique) canonicalizando el par y evitando duplicar una
// relacion ya presente en cualquier direccion.
function addUndirectedEdge(
  edges: Map<string, GraphEdge>,
  left: string,
  right: string,
  kind: GraphEdgeKind,
): void {
  if (left === right) {
    return;
  }
  const [source, target] = left < right ? [left, right] : [right, left];
  const forward = `${source}|${target}`;
  const backward = `${target}|${source}`;
  if (edges.has(forward) || edges.has(backward)) {
    return;
  }
  edges.set(forward, { source, target, kind });
}

function addCliqueEdges(
  edges: Map<string, GraphEdge>,
  membersByGroup: Map<number, Set<string>>,
  kind: GraphEdgeKind,
): void {
  for (const members of membersByGroup.values()) {
    if (members.size < 2 || members.size > MAX_CLIQUE_MEMBERS) {
      continue;
    }
    const ids = [...members];
    for (let index = 0; index < ids.length; index += 1) {
      for (let other = index + 1; other < ids.length; other += 1) {
        const left = ids[index];
        const right = ids[other];
        if (left !== undefined && right !== undefined) {
          addUndirectedEdge(edges, left, right, kind);
        }
      }
    }
  }
}

async function buildEdges(ids: string[]): Promise<GraphEdge[]> {
  const db = getDb();
  const edges = new Map<string, GraphEdge>();

  // Relaciones truco-truco acotadas al conjunto de nodos. `next` va del truco al
  // siguiente; `prereq` va del prerrequisito al truco. Se normaliza la direccion para
  // que un par reciproco (next en un sentido, prereq en el otro) genere una sola arista.
  const relationRows = await db
    .select({
      trickId: trickRelations.trickId,
      relatedId: trickRelations.relatedId,
      kind: trickRelations.kind,
    })
    .from(trickRelations)
    .where(and(inArray(trickRelations.trickId, ids), inArray(trickRelations.relatedId, ids)));

  for (const row of relationRows) {
    const source = row.kind === 'next' ? row.trickId : row.relatedId;
    const target = row.kind === 'next' ? row.relatedId : row.trickId;
    if (source === target) {
      continue;
    }
    const key = `${source}|${target}`;
    if (!edges.has(key)) {
      edges.set(key, { source, target, kind: row.kind === 'next' ? 'next' : 'prereq' });
    }
  }

  const stanceRows = await db
    .select({ trickId: trickStances.trickId, stanceId: trickStances.stanceId })
    .from(trickStances)
    .where(inArray(trickStances.trickId, ids));

  const membersByStance = new Map<number, Set<string>>();
  for (const row of stanceRows) {
    const bucket = membersByStance.get(row.stanceId) ?? new Set<string>();
    bucket.add(row.trickId);
    membersByStance.set(row.stanceId, bucket);
  }
  addCliqueEdges(edges, membersByStance, 'stance');

  const variationRows = await db
    .select({ trickId: variationExamples.trickId, variationId: variationExamples.variationId })
    .from(variationExamples)
    .where(inArray(variationExamples.trickId, ids));

  const membersByVariation = new Map<number, Set<string>>();
  for (const row of variationRows) {
    const bucket = membersByVariation.get(row.variationId) ?? new Set<string>();
    bucket.add(row.trickId);
    membersByVariation.set(row.variationId, bucket);
  }
  addCliqueEdges(edges, membersByVariation, 'variation');

  return [...edges.values()];
}

export async function getGraph(params: GraphParams): Promise<GraphData> {
  const db = getDb();
  const maxNodes = Math.min(MAX_GRAPH_NODES, Math.max(1, params.maxNodes ?? DEFAULT_GRAPH_NODES));

  const conditions = [isNull(tricks.deletedAt)];
  if (params.section !== undefined) {
    conditions.push(eq(tricks.section, params.section));
  }
  if (params.difficulty !== undefined) {
    conditions.push(eq(tricks.difficulty, params.difficulty));
  }
  if (params.category !== undefined && params.category !== '') {
    conditions.push(
      inArray(
        tricks.id,
        db
          .select({ id: trickCategories.trickId })
          .from(trickCategories)
          .innerJoin(categories, eq(trickCategories.categoryId, categories.id))
          .where(eq(categories.slug, params.category)),
      ),
    );
  }
  if (params.stance !== undefined && params.stance !== '') {
    conditions.push(
      inArray(
        tricks.id,
        db
          .select({ id: trickStances.trickId })
          .from(trickStances)
          .innerJoin(stances, eq(trickStances.stanceId, stances.id))
          .where(eq(stances.slug, params.stance)),
      ),
    );
  }

  const where = and(...conditions);

  const [countRow] = await db.select({ value: count() }).from(tricks).where(where);
  const total = countRow?.value ?? 0;

  const rows = await db
    .select({
      id: tricks.id,
      name: tricks.name,
      section: tricks.section,
      difficulty: tricks.difficulty,
    })
    .from(tricks)
    .where(where)
    .orderBy(sql`${tricks.difficulty} asc nulls last`, asc(tricks.name))
    .limit(maxNodes);

  if (rows.length === 0) {
    return { nodes: [], edges: [], total, maxNodes, truncated: total > maxNodes };
  }

  const ids = rows.map((row) => row.id);
  const categoryMap = await categoryMapFor(ids);
  const stanceMap = await stanceMapFor(ids);

  const nodes: GraphNode[] = rows.map((row) => ({
    ...row,
    categories: categoryMap.get(row.id) ?? [],
    stances: stanceMap.get(row.id) ?? [],
  }));

  const edges = await buildEdges(ids);

  return { nodes, edges, total, maxNodes, truncated: total > maxNodes };
}
