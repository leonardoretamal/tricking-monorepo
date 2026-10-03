ALTER TABLE "tricks" ADD COLUMN "section" text;--> statement-breakpoint
CREATE INDEX "tricks_section_idx" ON "tricks" USING btree ("section");