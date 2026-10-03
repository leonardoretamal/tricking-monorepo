import { z } from 'zod';

// Esquemas de las respuestas de /api/tricks. El cliente valida con Zod lo que recibe
// (y lo que se rehidrata desde el cache persistido) en vez de confiar en un cast.

export const trickListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  difficulty: z.number().nullable(),
  section: z.string().nullable(),
  loopkicksSlug: z.string().nullable(),
  categories: z.array(z.string()),
});

export const trickRelatedSchema = z.object({
  id: z.string(),
  name: z.string(),
  difficulty: z.number().nullable(),
  section: z.string().nullable(),
});

export const paginatedTricksSchema = z.object({
  items: z.array(trickListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const trickDetailSchema = trickListItemSchema.extend({
  prereqs: z.array(trickRelatedSchema),
  nextTricks: z.array(trickRelatedSchema),
});

export type TrickListItem = z.infer<typeof trickListItemSchema>;
export type TrickRelated = z.infer<typeof trickRelatedSchema>;
export type TrickDetail = z.infer<typeof trickDetailSchema>;
export type PaginatedTricks = z.infer<typeof paginatedTricksSchema>;
