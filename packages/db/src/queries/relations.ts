import { and, asc, eq, isNull, or } from 'drizzle-orm';

import { getDb } from '../client';
import { stances, transitionExamples, transitions, trickStances, variations } from '../schema';

// Relaciones cruzadas del catalogo (Fase 15). Cada conjunto se resuelve en una sola
// consulta por lote (sin N+1): variaciones ligadas al truco por `baseTrickId` o
// `trickId`, transiciones con un ejemplo del truco y stances enlazados por
// `trick_stances`. El detalle del truco las incluye en su respuesta y se cachean con
// el resto del detalle (TTL de 1 dia via TanStack Query).

export interface RelatedVariation {
  slug: string;
  name: string;
  kind: string;
}

export interface RelatedTransition {
  slug: string;
  name: string;
}

export interface RelatedStance {
  slug: string;
  name: string;
  kind: string;
}

export interface TrickRelations {
  variations: RelatedVariation[];
  transitions: RelatedTransition[];
  stances: RelatedStance[];
}

export async function getTrickRelations(trickId: string): Promise<TrickRelations> {
  const db = getDb();

  const variationRows = await db
    .select({ slug: variations.slug, name: variations.name, kind: variations.kind })
    .from(variations)
    .where(
      and(
        isNull(variations.deletedAt),
        or(eq(variations.baseTrickId, trickId), eq(variations.trickId, trickId)),
      ),
    )
    .orderBy(asc(variations.name));

  const transitionRows = await db
    .select({ slug: transitions.slug, name: transitions.name })
    .from(transitionExamples)
    .innerJoin(transitions, eq(transitionExamples.transitionId, transitions.id))
    .where(and(eq(transitionExamples.trickId, trickId), isNull(transitions.deletedAt)))
    .groupBy(transitions.id, transitions.slug, transitions.name)
    .orderBy(asc(transitions.name));

  const stanceRows = await db
    .select({ slug: stances.slug, name: stances.name, kind: trickStances.kind })
    .from(trickStances)
    .innerJoin(stances, eq(trickStances.stanceId, stances.id))
    .where(eq(trickStances.trickId, trickId))
    .groupBy(stances.id, stances.slug, stances.name, trickStances.kind)
    .orderBy(asc(stances.name));

  return {
    variations: variationRows,
    transitions: transitionRows,
    stances: stanceRows,
  };
}
