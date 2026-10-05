import {
  DEFAULT_GAZE_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_STANCE_PAGE_SIZE,
  DEFAULT_TRANSITION_PAGE_SIZE,
  DEFAULT_VARIATION_PAGE_SIZE,
  GAZE_PHASES,
  MAX_GAZE_PAGE_SIZE,
  MAX_PAGE_SIZE,
  MAX_STANCE_PAGE_SIZE,
  MAX_TRANSITION_PAGE_SIZE,
  MAX_VARIATION_PAGE_SIZE,
  TRICK_SECTIONS,
  TRICK_SORTS,
  TRANSITION_GROUPS,
  TRANSITION_SORTS,
  VARIATION_KINDS,
  VARIATION_SORTS,
} from '@tricking/db';
import { z } from 'zod';

// Validacion estricta de los parametros de listado antes de tocar la base de datos.
export const tricksQuerySchema = z.object({
  section: z.enum(TRICK_SECTIONS).optional(),
  category: z.string().trim().min(1).max(64).optional(),
  difficulty: z.coerce.number().int().min(0).max(5).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(TRICK_SORTS).default('name-asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const variationsQuerySchema = z.object({
  kind: z.enum(VARIATION_KINDS).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(VARIATION_SORTS).default('name-asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_VARIATION_PAGE_SIZE)
    .default(DEFAULT_VARIATION_PAGE_SIZE),
});

export const transitionsQuerySchema = z.object({
  group: z.enum(TRANSITION_GROUPS).optional(),
  q: z.string().trim().min(1).max(100).optional(),
  sort: z.enum(TRANSITION_SORTS).default('name-asc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_TRANSITION_PAGE_SIZE)
    .default(DEFAULT_TRANSITION_PAGE_SIZE),
});

export const stancesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_STANCE_PAGE_SIZE)
    .default(DEFAULT_STANCE_PAGE_SIZE),
});

export const gazeTipsQuerySchema = z.object({
  trickType: z.string().trim().min(1).max(64).optional(),
  phase: z.enum(GAZE_PHASES).optional(),
  locale: z.enum(['es', 'en']).default('es'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_GAZE_PAGE_SIZE).default(DEFAULT_GAZE_PAGE_SIZE),
});

export const gazeLocaleQuerySchema = z.object({
  locale: z.enum(['es', 'en']).default('es'),
});

export const trickIdSchema = z.string().trim().min(1).max(120);
export const slugSchema = z.string().trim().min(1).max(120);

export type TricksQuery = z.infer<typeof tricksQuerySchema>;
export type GazeTipsQuery = z.infer<typeof gazeTipsQuerySchema>;
export type VariationsQuery = z.infer<typeof variationsQuerySchema>;
export type TransitionsQuery = z.infer<typeof transitionsQuerySchema>;
export type StancesQuery = z.infer<typeof stancesQuerySchema>;
