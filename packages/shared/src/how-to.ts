import { z } from 'zod';

// Contrato del "como se hace" detallado (HowToDetail v1). Es el contenido estructurado que
// vive en `tricks.how_to_data` y `tricks.how_to_data_es` (jsonb). Lo comparten la semilla
// (que valida antes de escribir) y el frontend (que valida antes de renderizar). El texto
// plano de `tricks.how_to`/`how_to_es` sigue siendo el resumen y el respaldo para SEO.

export const HOW_TO_DETAIL_VERSION = 1;

const requiredText = z.string().trim().min(1);

export const howToDetailSchema = z.object({
  version: z.literal(HOW_TO_DETAIL_VERSION),
  summary: requiredText,
  before: z.object({
    prerequisites: requiredText,
    space: requiredText,
  }),
  body: z.object({
    feet: requiredText,
    legs: requiredText,
    arms: requiredText,
    gaze: requiredText,
    torso: requiredText,
  }),
  steps: z
    .array(
      z.object({
        title: requiredText,
        body: requiredText,
      }),
    )
    .min(1),
  landing: requiredText,
  mistakes: z.array(requiredText).default([]),
  tips: z.array(requiredText).default([]),
  terms: z
    .array(
      z.object({
        term: requiredText,
        meaning: requiredText,
      }),
    )
    .default([]),
  // Notas por prerequisito. La clave debe ser el id de un prerequisito real del truco
  // (se valida contra `trick_relations` antes de escribir); las claves desconocidas se
  // descartan en la semilla.
  prereqNotes: z.record(z.string(), requiredText).default({}),
});

export type HowToDetail = z.infer<typeof howToDetailSchema>;
export type HowToDetailInput = z.input<typeof howToDetailSchema>;
