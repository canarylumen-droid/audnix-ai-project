CREATE TABLE "fathom_calls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"fathom_meeting_id" text NOT NULL,
	"title" text,
	"summary" text,
	"transcript" text,
	"video_url" text,
	"video_thumbnail" text,
	"occurred_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"analysis" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prospect_objections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"fathom_meeting_id" text,
	"category" text NOT NULL,
	"snippet" text NOT NULL,
	"is_resolved" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "bant" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "outreach_campaigns" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "fathom_calls" ADD CONSTRAINT "fathom_calls_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fathom_calls" ADD CONSTRAINT "fathom_calls_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_objections" ADD CONSTRAINT "prospect_objections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prospect_objections" ADD CONSTRAINT "prospect_objections_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "fathom_calls_lead_idx" ON "fathom_calls" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "fathom_calls_meeting_idx" ON "fathom_calls" USING btree ("fathom_meeting_id");--> statement-breakpoint
CREATE INDEX "objections_lead_idx" ON "prospect_objections" USING btree ("lead_id");--> statement-breakpoint
CREATE INDEX "audit_trail_user_id_idx" ON "audit_trail" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_trail_created_at_idx" ON "audit_trail" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_trail_action_idx" ON "audit_trail" USING btree ("action");--> statement-breakpoint
CREATE INDEX "integrations_user_id_idx" ON "integrations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "integrations_health_status_idx" ON "integrations" USING btree ("health_status");--> statement-breakpoint
CREATE INDEX "integrations_connected_idx" ON "integrations" USING btree ("connected");