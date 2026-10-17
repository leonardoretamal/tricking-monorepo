ALTER TABLE "tricks" ADD COLUMN "how_to_data" jsonb;--> statement-breakpoint
ALTER TABLE "tricks" ADD COLUMN "how_to_data_es" jsonb;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "role" text DEFAULT 'demo' NOT NULL;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "language" text;