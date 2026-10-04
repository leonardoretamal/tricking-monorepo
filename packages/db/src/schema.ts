import { relations, sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
  customType,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

// Tipo de Postgres para la busqueda full-text (Fase 12). La columna generada y su
// indice GIN viven en `tricks`.
const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  source: text('source').notNull().default('trickingapi'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
});

export const tutorials = pgTable('tutorials', {
  id: serial('id').primaryKey(),
  source: text('source').notNull().default('instagram'),
  externalId: text('external_id').notNull().unique(),
  caption: text('caption'),
  author: text('author'),
  vimeoId: text('vimeo_id'),
  // Nivel del tutorial de Kojo (Beginner / Intermediate / Advanced / Elite).
  level: text('level'),
  // Tips de tecnica PROPIOS (contenido original, no de Kojo) que acompanan a la tecnica.
  tips: text('tips'),
  tipsEs: text('tips_es'),
  locale: text('locale').notNull().default('es'),
  permalink: text('permalink'),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
});

// Relacion tecnica de Kojo -> truco del catalogo (Loopkicks/TrickingAPI). Se puebla por
// emparejamiento automatico de nombres mas revision curada.
export const tutorialTricks = pgTable(
  'tutorial_tricks',
  {
    tutorialId: integer('tutorial_id')
      .notNull()
      .references(() => tutorials.id, { onDelete: 'cascade' }),
    trickId: text('trick_id')
      .notNull()
      .references(() => tricks.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.tutorialId, table.trickId] }),
    index('tutorial_tricks_trick_id_idx').on(table.trickId),
  ],
);

// Bloques de contenido curados por clave y locale (por ejemplo el resumen general de
// tecnicas). El texto lo escribe el proyecto y se aprueba antes de publicarse.
export const contentBlocks = pgTable(
  'content_blocks',
  {
    key: text('key').notNull(),
    locale: text('locale').notNull().default('es'),
    content: text('content').notNull(),
    ...timestamps,
  },
  (table) => [primaryKey({ columns: [table.key, table.locale] })],
);

export const tricks = pgTable(
  'tricks',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    descriptionEs: text('description_es'),
    // Descripcion PROPIA (contenido original, no de las fuentes) de como se hace el truco.
    // La escribe el autor del proyecto; sirve en el detalle y en la ficha del tutorial.
    howTo: text('how_to'),
    howToEs: text('how_to_es'),
    difficulty: smallint('difficulty'),
    section: text('section'),
    loopkicksSlug: text('loopkicks_slug').unique(),
    // Descripcion tecnica publicada por Loopkicks en su ficha de truco (texto de ellos).
    // Se muestra citada, con credito y enlace a su ficha; no se traduce.
    loopkicksNotes: text('loopkicks_notes'),
    prereqs: text('prereqs').array().notNull().default([]),
    nextTricks: text('next_tricks').array().notNull().default([]),
    source: text('source').notNull().default('trickingapi'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    // Columna generada para la busqueda full-text (Fase 12). Se indexa con GIN mas abajo.
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(description_es, ''))`,
    ),
    ...timestamps,
  },
  (table) => [
    index('tricks_name_idx').on(table.name),
    index('tricks_section_idx').on(table.section),
    index('tricks_search_vector_idx').using('gin', table.searchVector),
  ],
);

export const trickCategories = pgTable(
  'trick_categories',
  {
    trickId: text('trick_id')
      .notNull()
      .references(() => tricks.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.trickId, table.categoryId] }),
    index('trick_categories_category_id_idx').on(table.categoryId),
  ],
);

// Relacion truco-truco que corrige el bug de la Fase 3: `prereqs`/`nextTricks` de la
// semilla vienen como nombres, no como ids. Esta tabla los resuelve a ids y los deja
// consultables en SQL; la usan el detalle de truco y el grafo de Explore (Fase 11).
// `kind` vale 'prereq' o 'next'.
export const trickRelations = pgTable(
  'trick_relations',
  {
    trickId: text('trick_id')
      .notNull()
      .references(() => tricks.id, { onDelete: 'cascade' }),
    relatedId: text('related_id')
      .notNull()
      .references(() => tricks.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.trickId, table.relatedId, table.kind] }),
    index('trick_relations_related_id_idx').on(table.relatedId),
  ],
);

export const stances = pgTable('stances', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  descriptionEs: text('description_es'),
  ...timestamps,
});

// Relacion truco-stance. `kind` distingue el aterrizaje del despegue; la Fase 10 usa
// 'landing' para "trucos que aterrizan en ese stance".
export const trickStances = pgTable(
  'trick_stances',
  {
    trickId: text('trick_id')
      .notNull()
      .references(() => tricks.id, { onDelete: 'cascade' }),
    stanceId: integer('stance_id')
      .notNull()
      .references(() => stances.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull().default('landing'),
  },
  (table) => [
    primaryKey({ columns: [table.trickId, table.stanceId, table.kind] }),
    index('trick_stances_stance_id_idx').on(table.stanceId),
  ],
);

// `kind` separa las familias conceptuales de Loopkicks ('family') de las variaciones
// concretas de TrickingAPI ('concrete'). En las concretas, `trickId` apunta al truco del
// catalogo que materializa la variacion y `familyId` a su familia conceptual.
export const variations = pgTable('variations', {
  id: serial('id').primaryKey(),
  kind: text('kind').notNull().default('family'),
  baseTrickId: text('base_trick_id').references(() => tricks.id),
  trickId: text('trick_id').references(() => tricks.id),
  familyId: integer('family_id').references((): AnyPgColumn => variations.id),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  descriptionEs: text('description_es'),
  loopkicksSlug: text('loopkicks_slug').unique(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
});

export const variationExamples = pgTable(
  'variation_examples',
  {
    variationId: integer('variation_id')
      .notNull()
      .references(() => variations.id, { onDelete: 'cascade' }),
    trickId: text('trick_id')
      .notNull()
      .references(() => tricks.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.variationId, table.trickId] }),
    index('variation_examples_trick_id_idx').on(table.trickId),
  ],
);

// `group` refleja la taxonomia de Loopkicks (unified / sequential). `originTrickId` y
// `destinationTrickId` quedan sin uso: las fuentes modelan la transicion como concepto
// con ejemplos, no como par de trucos (ver docs/docs-agents/fases.md, Fase 9).
export const transitions = pgTable('transitions', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  descriptionEs: text('description_es'),
  group: text('group'),
  originTrickId: text('origin_trick_id').references(() => tricks.id),
  destinationTrickId: text('destination_trick_id').references(() => tricks.id),
  loopkicksSlug: text('loopkicks_slug').unique(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
});

export const transitionExamples = pgTable(
  'transition_examples',
  {
    id: serial('id').primaryKey(),
    transitionId: integer('transition_id')
      .notNull()
      .references(() => transitions.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    trickId: text('trick_id').references(() => tricks.id),
  },
  (table) => [index('transition_examples_transition_id_idx').on(table.transitionId)],
);

export const videos = pgTable(
  'videos',
  {
    id: serial('id').primaryKey(),
    trickId: text('trick_id').references(() => tricks.id),
    tutorialId: integer('tutorial_id').references(() => tutorials.id),
    r2Key: text('r2_key'),
    url: text('url'),
    mime: text('mime'),
    sizeBytes: bigint('size_bytes', { mode: 'number' }),
    durationSeconds: integer('duration_seconds'),
    status: text('status').notNull().default('pending'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index('videos_trick_id_idx').on(table.trickId),
    index('videos_tutorial_id_idx').on(table.tutorialId),
  ],
);

export const gazeTips = pgTable('gaze_tips', {
  id: serial('id').primaryKey(),
  trickType: text('trick_type').notNull(),
  phase: text('phase').notNull(),
  instruction: text('instruction').notNull(),
  warning: text('warning'),
  order: integer('order').notNull().default(0),
  locale: text('locale').notNull().default('es'),
  ...timestamps,
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  trickCategories: many(trickCategories),
}));

export const tricksRelations = relations(tricks, ({ many }) => ({
  trickCategories: many(trickCategories),
  trickRelations: many(trickRelations),
  trickStances: many(trickStances),
  variationsAsBase: many(variations, { relationName: 'variations_base' }),
  variationsAsTrick: many(variations, { relationName: 'variations_trick' }),
  variationExamples: many(variationExamples),
  transitionExamples: many(transitionExamples),
  videos: many(videos),
  transitionsAsOrigin: many(transitions, { relationName: 'transitions_origin' }),
  transitionsAsDestination: many(transitions, { relationName: 'transitions_destination' }),
}));

export const stancesRelations = relations(stances, ({ many }) => ({
  trickStances: many(trickStances),
}));

export const trickStancesRelations = relations(trickStances, ({ one }) => ({
  trick: one(tricks, {
    fields: [trickStances.trickId],
    references: [tricks.id],
  }),
  stance: one(stances, {
    fields: [trickStances.stanceId],
    references: [stances.id],
  }),
}));

export const trickCategoriesRelations = relations(trickCategories, ({ one }) => ({
  trick: one(tricks, {
    fields: [trickCategories.trickId],
    references: [tricks.id],
  }),
  category: one(categories, {
    fields: [trickCategories.categoryId],
    references: [categories.id],
  }),
}));

export const variationsRelations = relations(variations, ({ one, many }) => ({
  baseTrick: one(tricks, {
    fields: [variations.baseTrickId],
    references: [tricks.id],
    relationName: 'variations_base',
  }),
  trick: one(tricks, {
    fields: [variations.trickId],
    references: [tricks.id],
    relationName: 'variations_trick',
  }),
  family: one(variations, {
    fields: [variations.familyId],
    references: [variations.id],
    relationName: 'variations_family',
  }),
  inFamily: many(variations, { relationName: 'variations_family' }),
  examples: many(variationExamples),
}));

export const variationExamplesRelations = relations(variationExamples, ({ one }) => ({
  variation: one(variations, {
    fields: [variationExamples.variationId],
    references: [variations.id],
  }),
  trick: one(tricks, {
    fields: [variationExamples.trickId],
    references: [tricks.id],
  }),
}));

export const transitionsRelations = relations(transitions, ({ one, many }) => ({
  originTrick: one(tricks, {
    fields: [transitions.originTrickId],
    references: [tricks.id],
    relationName: 'transitions_origin',
  }),
  destinationTrick: one(tricks, {
    fields: [transitions.destinationTrickId],
    references: [tricks.id],
    relationName: 'transitions_destination',
  }),
  examples: many(transitionExamples),
}));

export const transitionExamplesRelations = relations(transitionExamples, ({ one }) => ({
  transition: one(transitions, {
    fields: [transitionExamples.transitionId],
    references: [transitions.id],
  }),
  trick: one(tricks, {
    fields: [transitionExamples.trickId],
    references: [tricks.id],
  }),
}));

export const tutorialsRelations = relations(tutorials, ({ many }) => ({
  videos: many(videos),
}));

export const videosRelations = relations(videos, ({ one }) => ({
  trick: one(tricks, {
    fields: [videos.trickId],
    references: [tricks.id],
  }),
  tutorial: one(tutorials, {
    fields: [videos.tutorialId],
    references: [tutorials.id],
  }),
}));

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;
export type Trick = typeof tricks.$inferSelect;
export type NewTrick = typeof tricks.$inferInsert;
export type TrickCategory = typeof trickCategories.$inferSelect;
export type NewTrickCategory = typeof trickCategories.$inferInsert;
export type TrickRelation = typeof trickRelations.$inferSelect;
export type NewTrickRelation = typeof trickRelations.$inferInsert;
export type Stance = typeof stances.$inferSelect;
export type NewStance = typeof stances.$inferInsert;
export type Variation = typeof variations.$inferSelect;
export type NewVariation = typeof variations.$inferInsert;
export type VariationExample = typeof variationExamples.$inferSelect;
export type NewVariationExample = typeof variationExamples.$inferInsert;
export type Transition = typeof transitions.$inferSelect;
export type NewTransition = typeof transitions.$inferInsert;
export type TransitionExample = typeof transitionExamples.$inferSelect;
export type NewTransitionExample = typeof transitionExamples.$inferInsert;
export type TrickStance = typeof trickStances.$inferSelect;
export type NewTrickStance = typeof trickStances.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type Tutorial = typeof tutorials.$inferSelect;
export type NewTutorial = typeof tutorials.$inferInsert;
export type TutorialTrick = typeof tutorialTricks.$inferSelect;
export type NewTutorialTrick = typeof tutorialTricks.$inferInsert;
export type ContentBlock = typeof contentBlocks.$inferSelect;
export type NewContentBlock = typeof contentBlocks.$inferInsert;
export type GazeTip = typeof gazeTips.$inferSelect;
export type NewGazeTip = typeof gazeTips.$inferInsert;
