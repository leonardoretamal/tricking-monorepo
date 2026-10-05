import { z } from 'zod';

import { SECTIONS } from './sections';

// Contratos del asistente de IA y del generador de combinaciones (Fase 22). Modulo
// cliente-seguro: no importa @tricking/db para no arrastrar el driver de Neon al bundle
// del navegador.

export const COMBO_LENGTHS = ['short', 'medium', 'long'] as const;
export type ComboLength = (typeof COMBO_LENGTHS)[number];

export const COMBO_MIN_TRICKS = 2;
export const COMBO_MAX_KNOWN_IDS = 600;

// Rangos por longitud: corta 2-3, media 4-5, larga 6 a 8 (con tope superior para no
// generar combinaciones inmanejables aunque el usuario conozca muchos trucos).
export function comboLengthRange(length: ComboLength): { min: number; max: number } {
  switch (length) {
    case 'short':
      return { min: 2, max: 3 };
    case 'medium':
      return { min: 4, max: 5 };
    case 'long':
    default:
      return { min: 6, max: 8 };
  }
}

export const comboRequestSchema = z.object({
  knownTrickIds: z.array(z.string().trim().min(1).max(120)).min(1).max(COMBO_MAX_KNOWN_IDS),
  length: z.enum(COMBO_LENGTHS),
  section: z.enum(SECTIONS).optional(),
  maxDifficulty: z.number().int().min(0).max(5).optional(),
  exclude: z.array(z.string().trim().min(1).max(120)).max(COMBO_MAX_KNOWN_IDS).optional(),
});

export type ComboRequest = z.infer<typeof comboRequestSchema>;

export const comboStepSchema = z.object({
  trickId: z.string(),
  name: z.string(),
  section: z.string().nullable(),
  difficulty: z.number().nullable(),
});

export const comboTransitionSchema = z.object({
  from: z.string(),
  to: z.string(),
});

export const comboResponseSchema = z.object({
  steps: z.array(comboStepSchema),
  transitions: z.array(comboTransitionSchema).optional(),
  source: z.enum(['deterministic', 'ai']).optional(),
  traceId: z.string().optional(),
});

export type ComboStep = z.infer<typeof comboStepSchema>;
export type ComboTransition = z.infer<typeof comboTransitionSchema>;
export type ComboResponse = z.infer<typeof comboResponseSchema>;

export const comboErrorSchema = z.object({
  error: z.string().optional(),
  traceId: z.string().optional(),
});

export function isComboLength(value: string): value is ComboLength {
  return (COMBO_LENGTHS as readonly string[]).includes(value);
}
