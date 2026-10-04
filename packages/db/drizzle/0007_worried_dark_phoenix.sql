CREATE TABLE "content_blocks" (
	"key" text NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_blocks_key_locale_pk" PRIMARY KEY("key","locale")
);
--> statement-breakpoint
CREATE TABLE "tutorial_tricks" (
	"tutorial_id" integer NOT NULL,
	"trick_id" text NOT NULL,
	CONSTRAINT "tutorial_tricks_tutorial_id_trick_id_pk" PRIMARY KEY("tutorial_id","trick_id")
);
--> statement-breakpoint
ALTER TABLE "tutorials" ADD COLUMN "level" text;--> statement-breakpoint
ALTER TABLE "tutorials" ADD COLUMN "tips" text;--> statement-breakpoint
ALTER TABLE "tutorials" ADD COLUMN "tips_es" text;--> statement-breakpoint
ALTER TABLE "tutorial_tricks" ADD CONSTRAINT "tutorial_tricks_tutorial_id_tutorials_id_fk" FOREIGN KEY ("tutorial_id") REFERENCES "public"."tutorials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tutorial_tricks" ADD CONSTRAINT "tutorial_tricks_trick_id_tricks_id_fk" FOREIGN KEY ("trick_id") REFERENCES "public"."tricks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "tutorial_tricks_trick_id_idx" ON "tutorial_tricks" USING btree ("trick_id");