import { relations } from 'drizzle-orm';
import {
  bigint,
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

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  source: text('source').notNull().default('trickingapi'),
  ...timestamps,
});

export const tutorials = pgTable('tutorials', {
  id: serial('id').primaryKey(),
  source: text('source').notNull().default('instagram'),
  externalId: text('external_id').notNull().unique(),
  caption: text('caption'),
  locale: text('locale').notNull().default('es'),
  permalink: text('permalink'),
  postedAt: timestamp('posted_at', { withTimezone: true }),
  ...timestamps,
});

export const tricks = pgTable(
  'tricks',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    difficulty: smallint('difficulty'),
    loopkicksSlug: text('loopkicks_slug').unique(),
    prereqs: text('prereqs').array().notNull().default([]),
    nextTricks: text('next_tricks').array().notNull().default([]),
    source: text('source').notNull().default('trickingapi'),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index('tricks_name_idx').on(table.name)],
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

export const stances = pgTable('stances', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  ...timestamps,
});

export const variations = pgTable('variations', {
  id: serial('id').primaryKey(),
  baseTrickId: text('base_trick_id').references(() => tricks.id),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  loopkicksSlug: text('loopkicks_slug').unique(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  ...timestamps,
});

export const transitions = pgTable('transitions', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  originTrickId: text('origin_trick_id').references(() => tricks.id),
  destinationTrickId: text('destination_trick_id').references(() => tricks.id),
  loopkicksSlug: text('loopkicks_slug').unique(),
  ...timestamps,
});

export const videos = pgTable('videos', {
  id: serial('id').primaryKey(),
  trickId: text('trick_id').references(() => tricks.id),
  tutorialId: integer('tutorial_id').references(() => tutorials.id),
  r2Key: text('r2_key'),
  url: text('url'),
  mime: text('mime'),
  sizeBytes: bigint('size_bytes', { mode: 'number' }),
  durationSeconds: integer('duration_seconds'),
  status: text('status').notNull().default('pending'),
  ...timestamps,
});

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
  variations: many(variations),
  videos: many(videos),
  transitionsAsOrigin: many(transitions, { relationName: 'transitions_origin' }),
  transitionsAsDestination: many(transitions, { relationName: 'transitions_destination' }),
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

export const variationsRelations = relations(variations, ({ one }) => ({
  baseTrick: one(tricks, {
    fields: [variations.baseTrickId],
    references: [tricks.id],
  }),
}));

export const transitionsRelations = relations(transitions, ({ one }) => ({
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
export type Stance = typeof stances.$inferSelect;
export type NewStance = typeof stances.$inferInsert;
export type Variation = typeof variations.$inferSelect;
export type NewVariation = typeof variations.$inferInsert;
export type Transition = typeof transitions.$inferSelect;
export type NewTransition = typeof transitions.$inferInsert;
export type Video = typeof videos.$inferSelect;
export type NewVideo = typeof videos.$inferInsert;
export type Tutorial = typeof tutorials.$inferSelect;
export type NewTutorial = typeof tutorials.$inferInsert;
export type GazeTip = typeof gazeTips.$inferSelect;
export type NewGazeTip = typeof gazeTips.$inferInsert;
