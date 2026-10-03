CREATE TABLE "categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"source" text DEFAULT 'trickingapi' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "gaze_tips" (
	"id" serial PRIMARY KEY NOT NULL,
	"trick_type" text NOT NULL,
	"phase" text NOT NULL,
	"instruction" text NOT NULL,
	"warning" text,
	"order" integer DEFAULT 0 NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stances" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stances_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "transitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"origin_trick_id" text,
	"destination_trick_id" text,
	"loopkicks_slug" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transitions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "transitions_loopkicks_slug_unique" UNIQUE("loopkicks_slug")
);
--> statement-breakpoint
CREATE TABLE "trick_categories" (
	"trick_id" text NOT NULL,
	"category_id" integer NOT NULL,
	CONSTRAINT "trick_categories_trick_id_category_id_pk" PRIMARY KEY("trick_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "tricks" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"difficulty" smallint,
	"loopkicks_slug" text,
	"prereqs" text[] DEFAULT '{}' NOT NULL,
	"next_tricks" text[] DEFAULT '{}' NOT NULL,
	"source" text DEFAULT 'trickingapi' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tricks_loopkicks_slug_unique" UNIQUE("loopkicks_slug")
);
--> statement-breakpoint
CREATE TABLE "tutorials" (
	"id" serial PRIMARY KEY NOT NULL,
	"source" text DEFAULT 'instagram' NOT NULL,
	"external_id" text NOT NULL,
	"caption" text,
	"locale" text DEFAULT 'es' NOT NULL,
	"permalink" text,
	"posted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tutorials_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "variations" (
	"id" serial PRIMARY KEY NOT NULL,
	"base_trick_id" text,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"loopkicks_slug" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "variations_slug_unique" UNIQUE("slug"),
	CONSTRAINT "variations_loopkicks_slug_unique" UNIQUE("loopkicks_slug")
);
--> statement-breakpoint
CREATE TABLE "videos" (
	"id" serial PRIMARY KEY NOT NULL,
	"trick_id" text,
	"tutorial_id" integer,
	"r2_key" text,
	"url" text,
	"mime" text,
	"size_bytes" bigint,
	"duration_seconds" integer,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transitions" ADD CONSTRAINT "transitions_origin_trick_id_tricks_id_fk" FOREIGN KEY ("origin_trick_id") REFERENCES "public"."tricks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transitions" ADD CONSTRAINT "transitions_destination_trick_id_tricks_id_fk" FOREIGN KEY ("destination_trick_id") REFERENCES "public"."tricks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trick_categories" ADD CONSTRAINT "trick_categories_trick_id_tricks_id_fk" FOREIGN KEY ("trick_id") REFERENCES "public"."tricks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trick_categories" ADD CONSTRAINT "trick_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variations" ADD CONSTRAINT "variations_base_trick_id_tricks_id_fk" FOREIGN KEY ("base_trick_id") REFERENCES "public"."tricks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_trick_id_tricks_id_fk" FOREIGN KEY ("trick_id") REFERENCES "public"."tricks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "videos" ADD CONSTRAINT "videos_tutorial_id_tutorials_id_fk" FOREIGN KEY ("tutorial_id") REFERENCES "public"."tutorials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trick_categories_category_id_idx" ON "trick_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "tricks_name_idx" ON "tricks" USING btree ("name");