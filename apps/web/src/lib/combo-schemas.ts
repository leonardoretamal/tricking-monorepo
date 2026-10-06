import { z } from 'zod';

import { SECTIONS } from './sections';

// Contratos del asistente de IA y del generador de combinaciones (Fase 22) y modelo local
// de combinaciones guardadas (Fase 28). Modulo cliente-seguro: no importa @tricking/db
// para no arrastrar el driver de Neon al bundle del navegador.

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

export const comboLocales = ['es', 'en'] as const;
export type ComboLocale = (typeof comboLocales)[number];

export const comboRequestSchema = z.object({
  knownTrickIds: z.array(z.string().trim().min(1).max(120)).min(1).max(COMBO_MAX_KNOWN_IDS),
  length: z.enum(COMBO_LENGTHS),
  // El idioma de la interfaz. Obliga a que el refinamiento con IA use el prompt correcto.
  locale: z.enum(comboLocales),
  // Multi-seccion (Fase 41): el cliente puede pedir varias secciones a la vez. Ausente
  // significa "todas"; un arreglo vacio no deja pasar ningun truco.
  sections: z.array(z.enum(SECTIONS)).max(SECTIONS.length).optional(),
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
  // Nombre del proveedor de IA que refino el orden, o null si fue determinista.
  provider: z.string().nullable().optional(),
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

// Modelo local de combinaciones guardadas (Fase 28). Vive solo en el navegador, con
// Zustand y el wrapper de storage. Nunca guarda datos personales: solo ids y nombres de
// trucos del catalogo, notas propias y el estado de practica.
export const COMBOS_STORAGE_KEY = 'combos';
export const COMBOS_VERSION = 1 as const;

// Tope duro de combinaciones guardadas por navegador: al llegar a 5 se prohibe agregar.
export const COMBO_MAX_SAVED = 5;

export const COMBO_STATUSES = ['draft', 'practicing', 'mastered'] as const;
export type ComboStatus = (typeof COMBO_STATUSES)[number];

export const COMBO_STATUS_LABEL_KEY: Record<ComboStatus, string> = {
  draft: 'draft',
  practicing: 'practicing',
  mastered: 'mastered',
};

export const savedComboStepSchema = z.object({
  trickId: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  section: z.string().nullable().optional(),
  difficulty: z.number().int().min(0).max(5).nullable().optional(),
  note: z.string().max(500).optional(),
});

export const savedComboSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(120),
  description: z.string().max(500).optional(),
  status: z.enum(COMBO_STATUSES),
  steps: z.array(savedComboStepSchema).min(COMBO_MIN_TRICKS).max(12),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const combosStateSchema = z.object({
  version: z.literal(COMBOS_VERSION),
  updatedAt: z.string(),
  combos: z.array(savedComboSchema).max(COMBO_MAX_SAVED),
});

export type SavedComboStep = z.infer<typeof savedComboStepSchema>;
export type SavedCombo = z.infer<typeof savedComboSchema>;
export type CombosState = z.infer<typeof combosStateSchema>;
