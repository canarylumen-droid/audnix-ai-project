ALTER TABLE "brand_embeddings" ADD COLUMN "version" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_embeddings" ADD COLUMN "document_id" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "business_logo" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "intelligence_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;