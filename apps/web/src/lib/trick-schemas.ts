import { z } from 'zod';

// Esquemas de las respuestas de /api/tricks. El cliente valida con Zod lo que recibe
// (y lo que se rehidrata desde el cache persistido) en vez de confiar en un cast.

export const trickListItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  descriptionEs: z.string().nullable(),
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

export const kojoTechniqueSchema = z.object({
  id: z.number(),
  title: z.string().nullable(),
  level: z.string().nullable(),
  tips: z.string().nullable(),
  tipsEs: z.string().nullable(),
  permalink: z.string().nullable(),
  author: z.string().nullable(),
});

export const relatedVariationSchema = z.object({
  slug: z.string(),
  name: z.string(),
  kind: z.string(),
});

export const relatedTransitionSchema = z.object({
  slug: z.string(),
  name: z.string(),
});

export const relatedStanceSchema = z.object({
  slug: z.string(),
  name: z.string(),
  kind: z.string(),
});

export const trickRelationsSchema = z.object({
  variations: z.array(relatedVariationSchema),
  transitions: z.array(relatedTransitionSchema),
  stances: z.array(relatedStanceSchema),
});

export const trickDetailSchema = trickListItemSchema.extend({
  howTo: z.string().nullable(),
  howToEs: z.string().nullable(),
  loopkicksNotes: z.string().nullable(),
  loopkicksNotesEs: z.string().nullable(),
  kojoTechniques: z.array(kojoTechniqueSchema),
  prereqs: z.array(trickRelatedSchema),
  nextTricks: z.array(trickRelatedSchema),
  related: trickRelationsSchema.optional(),
});

export type KojoTechnique = z.infer<typeof kojoTechniqueSchema>;
export type RelatedVariation = z.infer<typeof relatedVariationSchema>;
export type RelatedTransition = z.infer<typeof relatedTransitionSchema>;
export type RelatedStance = z.infer<typeof relatedStanceSchema>;
export type TrickRelations = z.infer<typeof trickRelationsSchema>;

export type TrickListItem = z.infer<typeof trickListItemSchema>;
export type TrickRelated = z.infer<typeof trickRelatedSchema>;
export type TrickDetail = z.infer<typeof trickDetailSchema>;
export type PaginatedTricks = z.infer<typeof paginatedTricksSchema>;
