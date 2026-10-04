import { z } from 'zod';

// Esquemas de las respuestas de /api/variations, /api/transitions y /api/stances. El
// cliente valida con Zod lo que recibe (y lo rehidratado desde el cache persistido).

export const trickRefSchema = z.object({
  id: z.string(),
  name: z.string(),
  section: z.string().nullable(),
});

export const variationListItemSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  kind: z.string(),
  baseTrick: trickRefSchema.nullable(),
  examples: z.array(trickRefSchema),
});

export const variationSiblingSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
});

export const paginatedVariationsSchema = z.object({
  items: z.array(variationListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const variationDetailSchema = variationListItemSchema.extend({
  family: variationSiblingSchema.nullable(),
  siblings: z.array(variationSiblingSchema),
});

export const transitionListItemSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  group: z.string().nullable(),
});

export const transitionExampleSchema = z.object({
  label: z.string(),
  trick: trickRefSchema.nullable(),
});

export const paginatedTransitionsSchema = z.object({
  items: z.array(transitionListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const transitionDetailSchema = transitionListItemSchema.extend({
  examples: z.array(transitionExampleSchema),
});

export const stanceListItemSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  landingTrickCount: z.number(),
});

export const paginatedStancesSchema = z.object({
  items: z.array(stanceListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

export const stanceDetailSchema = stanceListItemSchema.extend({
  landingTricks: z.array(trickRefSchema),
});

export type TrickRef = z.infer<typeof trickRefSchema>;
export type VariationListItem = z.infer<typeof variationListItemSchema>;
export type VariationSibling = z.infer<typeof variationSiblingSchema>;
export type VariationDetail = z.infer<typeof variationDetailSchema>;
export type PaginatedVariations = z.infer<typeof paginatedVariationsSchema>;
export type TransitionListItem = z.infer<typeof transitionListItemSchema>;
export type TransitionExampleItem = z.infer<typeof transitionExampleSchema>;
export type TransitionDetail = z.infer<typeof transitionDetailSchema>;
export type PaginatedTransitions = z.infer<typeof paginatedTransitionsSchema>;
export type StanceListItem = z.infer<typeof stanceListItemSchema>;
export type StanceDetail = z.infer<typeof stanceDetailSchema>;
export type PaginatedStances = z.infer<typeof paginatedStancesSchema>;
