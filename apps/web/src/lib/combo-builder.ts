import { loadComboRelations, loadComboTricks } from '@tricking/db';
import { z } from 'zod';

import { callChatCompletionWithFallback, type ChatMessage } from './ai-client';
import type { AiProviderConfig } from './ai-providers';
import {
  COMBO_MAX_KNOWN_IDS,
  COMBO_MIN_TRICKS,
  comboLengthRange,
  type ComboLength,
  type ComboRequest,
  type ComboStep,
  type ComboTransition,
} from './combo-schemas';

// Generador DETERMINISTA de combinaciones (Fase 22). Es la respuesta garantizada: arma
// una cadena usando SOLO trucos conocidos por el usuario (los que envia el cliente) y,
// cuando existen, encadena siguiendo las relaciones `next` del catalogo. La IA es un
// refinamiento opcional del orden; si falla o no cumple, se devuelve este resultado.

export interface ComboBuildResult {
  steps: ComboStep[];
  transitions: ComboTransition[];
}

export interface ComboPool {
  order: string[];
  byId: Map<string, ComboStep>;
  next: Map<string, string[]>;
}

function dedupe(ids: string[]): string[] {
  return [...new Set(ids)].slice(0, COMBO_MAX_KNOWN_IDS);
}

// Carga el conjunto conocido desde la base de datos y lo filtra por seccion y dificultad.
// El orden de entrada (que el cliente rota al regenerar) se conserva para que el
// generador sea determinista pero pueda producir combinaciones distintas.
export async function loadComboPool(request: ComboRequest): Promise<ComboPool> {
  const requested = dedupe(request.knownTrickIds);
  const rows = await loadComboTricks(requested);
  const excluded = new Set(request.exclude ?? []);

  const byId = new Map<string, ComboStep>();
  for (const row of rows) {
    if (excluded.has(row.id)) {
      continue;
    }
    if (request.section !== undefined && row.section !== request.section) {
      continue;
    }
    if (
      request.maxDifficulty !== undefined &&
      (row.difficulty === null || row.difficulty > request.maxDifficulty)
    ) {
      continue;
    }
    byId.set(row.id, {
      trickId: row.id,
      name: row.name,
      section: row.section,
      difficulty: row.difficulty,
    });
  }

  const order = requested.filter((id) => byId.has(id));
  const allowed = new Set(order);

  const relations = await loadComboRelations(order);
  const next = new Map<string, string[]>();
  for (const relation of relations) {
    if (!allowed.has(relation.trickId) || !allowed.has(relation.relatedId)) {
      continue;
    }
    const bucket = next.get(relation.trickId);
    if (bucket === undefined) {
      next.set(relation.trickId, [relation.relatedId]);
    } else if (!bucket.includes(relation.relatedId)) {
      bucket.push(relation.relatedId);
    }
  }

  // Ordena los sucesores segun el orden de entrada para mantener el determinismo.
  for (const [key, values] of next) {
    values.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    next.set(key, values);
  }

  return { order, byId, next };
}

function stepsToResult(pool: ComboPool, ids: string[]): ComboBuildResult {
  const steps: ComboStep[] = [];
  for (const id of ids) {
    const step = pool.byId.get(id);
    if (step !== undefined) {
      steps.push(step);
    }
  }

  const transitions: ComboTransition[] = [];
  for (let index = 0; index < steps.length - 1; index += 1) {
    const from = steps[index]?.trickId;
    const to = steps[index + 1]?.trickId;
    if (from === undefined || to === undefined) {
      continue;
    }
    if ((pool.next.get(from) ?? []).includes(to)) {
      transitions.push({ from, to });
    }
  }

  return { steps, transitions };
}

// Cadena determinista: arranca en el primer truco del orden, prefiere un sucesor con
// relacion `next` y, si no lo hay, toma el siguiente truco sin usar del orden.
export function buildComboFromPool(pool: ComboPool, length: ComboLength): ComboBuildResult {
  const total = pool.order.length;
  if (total < COMBO_MIN_TRICKS) {
    return { steps: [], transitions: [] };
  }

  const { max } = comboLengthRange(length);
  const target = Math.min(max, total);

  const used = new Set<string>();
  const chain: string[] = [];
  let current: string | undefined = pool.order[0];

  while (chain.length < target && current !== undefined) {
    chain.push(current);
    used.add(current);

    const successor = (pool.next.get(current) ?? []).find((id) => !used.has(id));
    if (successor !== undefined) {
      current = successor;
      continue;
    }
    current = pool.order.find((id) => !used.has(id));
  }

  return stepsToResult(pool, chain);
}

// Reconstruye un resultado a partir de ids ya validados (por ejemplo, el orden que
// propone la IA). Recalcula las transiciones reales entre pasos consecutivos.
export function buildComboFromIds(pool: ComboPool, ids: string[]): ComboBuildResult {
  const unique = dedupe(ids).filter((id) => pool.byId.has(id));
  return stepsToResult(pool, unique);
}

const comboOrderSchema = z.object({
  order: z.array(z.string()).max(12),
});

function extractJsonObject(content: string): unknown {
  const start = content.indexOf('{');
  const end = content.lastIndexOf('}');
  if (start === -1 || end <= start) {
    return null;
  }
  try {
    return JSON.parse(content.slice(start, end + 1));
  } catch {
    return null;
  }
}

// Refinamiento opcional con IA: pide reordenar (o recortar) SOLO los trucos que ya
// forman la combinacion determinista y valida que la respuesta sea un subconjunto sin
// repetidos y dentro del rango de longitud. Prueba los proveedores en orden (fallback).
// Si algo no cumple, devuelve null y el llamador conserva el resultado determinista.
export async function refineComboOrderWithAi(
  providers: AiProviderConfig[],
  deterministic: ComboBuildResult,
  length: ComboLength,
  traceId: string,
): Promise<{ order: string[]; provider: string } | null> {
  if (deterministic.steps.length < COMBO_MIN_TRICKS) {
    return null;
  }

  const { min, max } = comboLengthRange(length);
  const available = deterministic.steps.map((step) => ({
    trickId: step.trickId,
    name: step.name,
  }));

  const messages: ChatMessage[] = [
    {
      role: 'system',
      content:
        'Eres un entrenador de tricking. Recibes una lista de trucos que el alumno ya domina. Devuelve un orden fluido para encadenarlos, usando UNICAMENTE los trickId de la lista, sin repetirlos. Responde solo con JSON valido con la forma {"order": ["id1", "id2"]}.',
    },
    {
      role: 'user',
      content: JSON.stringify({ trucos: available }),
    },
  ];

  const result = await callChatCompletionWithFallback(providers, messages, traceId, 300);
  if (result === null) {
    return null;
  }

  const parsed = comboOrderSchema.safeParse(extractJsonObject(result.answer));
  if (!parsed.success) {
    return null;
  }

  const allowed = new Set(deterministic.steps.map((step) => step.trickId));
  const seen = new Set<string>();
  const order: string[] = [];
  for (const id of parsed.data.order) {
    if (!allowed.has(id) || seen.has(id)) {
      return null;
    }
    seen.add(id);
    order.push(id);
  }

  if (order.length < min || order.length > max || order.length < COMBO_MIN_TRICKS) {
    return null;
  }

  return { order, provider: result.provider.name };
}
