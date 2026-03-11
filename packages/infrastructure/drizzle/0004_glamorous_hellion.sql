CREATE TABLE "prior_art_results" (
	"id" uuid PRIMARY KEY NOT NULL,
	"asset_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"patent_number" text NOT NULL,
	"title" text NOT NULL,
	"abstract_text" text NOT NULL,
	"relevance_score" text NOT NULL,
	"relevance_reasoning" text NOT NULL,
	"source" text DEFAULT 'uspto' NOT NULL,
	"searched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "prior_art_results" ADD CONSTRAINT "prior_art_results_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "prior_art_results_asset_id_idx" ON "prior_art_results" USING btree ("asset_id","organization_id");