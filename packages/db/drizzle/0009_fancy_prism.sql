CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'sugerencia' NOT NULL,
	"name" text,
	"email" text,
	"message" text NOT NULL,
	"page" text,
	"locale" text,
	"user_agent" text,
	"status" text DEFAULT 'nuevo' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gaze_tip_sections" (
	"gaze_tip_id" integer NOT NULL,
	"target_kind" text NOT NULL,
	"target_slug" text NOT NULL,
	CONSTRAINT "gaze_tip_sections_gaze_tip_id_target_kind_target_slug_pk" PRIMARY KEY("gaze_tip_id","target_kind","target_slug")
);
--> statement-breakpoint
CREATE TABLE "gaze_tip_summaries" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"content" text NOT NULL,
	"locale" text DEFAULT 'es' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gaze_tips" ADD COLUMN "label" text;--> statement-breakpoint
ALTER TABLE "gaze_tip_sections" ADD CONSTRAINT "gaze_tip_sections_gaze_tip_id_gaze_tips_id_fk" FOREIGN KEY ("gaze_tip_id") REFERENCES "public"."gaze_tips"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "feedback_status_idx" ON "feedback" USING btree ("status");--> statement-breakpoint
CREATE INDEX "feedback_type_idx" ON "feedback" USING btree ("type");--> statement-breakpoint
CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "gaze_tip_sections_target_idx" ON "gaze_tip_sections" USING btree ("target_kind","target_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "gaze_tip_summaries_kind_locale_idx" ON "gaze_tip_summaries" USING btree ("kind","locale");