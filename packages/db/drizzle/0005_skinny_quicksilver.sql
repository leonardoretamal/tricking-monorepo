CREATE TABLE "trick_relations" (
	"trick_id" text NOT NULL,
	"related_id" text NOT NULL,
	"kind" text NOT NULL,
	CONSTRAINT "trick_relations_trick_id_related_id_kind_pk" PRIMARY KEY("trick_id","related_id","kind")
);
--> statement-breakpoint
ALTER TABLE "tricks" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(description_es, ''))) STORED;--> statement-breakpoint
ALTER TABLE "trick_relations" ADD CONSTRAINT "trick_relations_trick_id_tricks_id_fk" FOREIGN KEY ("trick_id") REFERENCES "public"."tricks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trick_relations" ADD CONSTRAINT "trick_relations_related_id_tricks_id_fk" FOREIGN KEY ("related_id") REFERENCES "public"."tricks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "trick_relations_related_id_idx" ON "trick_relations" USING btree ("related_id");--> statement-breakpoint
CREATE INDEX "tricks_search_vector_idx" ON "tricks" USING gin ("search_vector");