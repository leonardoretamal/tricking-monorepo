ALTER TABLE "videos" ADD COLUMN "provider" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "embed_url" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "author" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "aspect" text;--> statement-breakpoint
UPDATE "videos" SET "provider" = 'loopkicks', "kind" = 'file', "aspect" = '16:9' WHERE "status" = 'external';