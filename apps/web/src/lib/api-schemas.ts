import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, TRICK_SECTIONS, TRICK_SORTS } from '@tricking/db';
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

export type TricksQuery = z.infer<typeof tricksQuerySchema>;
