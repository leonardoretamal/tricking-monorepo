ALTER TABLE "tricks" ADD COLUMN "subcategory" text;--> statement-breakpoint
CREATE INDEX "tricks_subcategory_idx" ON "tricks" USING btree ("subcategory");