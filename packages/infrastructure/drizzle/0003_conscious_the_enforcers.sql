CREATE EXTENSION IF NOT EXISTS vector;
--> statement-breakpoint
CREATE TABLE "asset_embeddings" (
	"asset_id" uuid PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"embedding" vector(1024) NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "tags" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "asset_embeddings" ADD CONSTRAINT "asset_embeddings_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "asset_embeddings_organization_id_idx" ON "asset_embeddings" USING btree ("organization_id");