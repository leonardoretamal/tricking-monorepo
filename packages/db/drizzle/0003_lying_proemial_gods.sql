CREATE TABLE "transition_examples" (
	"id" serial PRIMARY KEY NOT NULL,
	"transition_id" integer NOT NULL,
	"label" text NOT NULL,
	"trick_id" text
);
--> statement-breakpoint
CREATE TABLE "trick_stances" (
	"trick_id" text NOT NULL,
	"stance_id" integer NOT NULL,
	"kind" text DEFAULT 'landing' NOT NULL,
	CONSTRAINT "trick_stances_trick_id_stance_id_kind_pk" PRIMARY KEY("trick_id","stance_id","kind")
);
--> statement-breakpoint
CREATE TABLE "variation_examples" (
	"variation_id" integer NOT NULL,
	"trick_id" text NOT NULL,
	CONSTRAINT "variation_examples_variation_id_trick_id_pk" PRIMARY KEY("variation_id","trick_id")
);
--> statement-breakpoint
ALTER TABLE "transitions" ADD COLUMN "group" text;--> statement-breakpoint
ALTER TABLE "variations" ADD COLUMN "kind" text DEFAULT 'family' NOT NULL;--> statement-breakpoint
ALTER TABLE "variations" ADD COLUMN "trick_id" text;--> statement-breakpoint
ALTER TABLE "variations" ADD COLUMN "family_id" integer;--> statement-breakpoint
ALTER TABLE "transition_examples" ADD CONSTRAINT "transition_examples_transition_id_transitions_id_fk" FOREIGN KEY ("transition_id") REFERENCES "public"."transitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transition_examples" ADD CONSTRAINT "transition_examples_trick_id_tricks_id_fk" FOREIGN KEY ("trick_id") REFERENCES "public"."tricks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trick_stances" ADD CONSTRAINT "trick_stances_trick_id_tricks_id_fk" FOREIGN KEY ("trick_id") REFERENCES "public"."tricks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trick_stances" ADD CONSTRAINT "trick_stances_stance_id_stances_id_fk" FOREIGN KEY ("stance_id") REFERENCES "public"."stances"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variation_examples" ADD CONSTRAINT "variation_examples_variation_id_variations_id_fk" FOREIGN KEY ("variation_id") REFERENCES "public"."variations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variation_examples" ADD CONSTRAINT "variation_examples_trick_id_tricks_id_fk" FOREIGN KEY ("trick_id") REFERENCES "public"."tricks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transition_examples_transition_id_idx" ON "transition_examples" USING btree ("transition_id");--> statement-breakpoint
CREATE INDEX "trick_stances_stance_id_idx" ON "trick_stances" USING btree ("stance_id");--> statement-breakpoint
CREATE INDEX "variation_examples_trick_id_idx" ON "variation_examples" USING btree ("trick_id");--> statement-breakpoint
ALTER TABLE "variations" ADD CONSTRAINT "variations_trick_id_tricks_id_fk" FOREIGN KEY ("trick_id") REFERENCES "public"."tricks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "variations" ADD CONSTRAINT "variations_family_id_variations_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."variations"("id") ON DELETE no action ON UPDATE no action;