ALTER TABLE "categories" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transitions" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tutorials" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "videos" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "videos_trick_id_idx" ON "videos" USING btree ("trick_id");--> statement-breakpoint
CREATE INDEX "videos_tutorial_id_idx" ON "videos" USING btree ("tutorial_id");