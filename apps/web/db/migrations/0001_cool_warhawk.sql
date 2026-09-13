CREATE TABLE "artifacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_subject" text NOT NULL,
	"cid" text NOT NULL,
	"uri" text NOT NULL,
	"sha256" text NOT NULL,
	"file_name" text NOT NULL,
	"media_type" text NOT NULL,
	"size" text NOT NULL,
	"retrieval_status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "artifacts_owner_created_idx" ON "artifacts" USING btree ("owner_subject","created_at");--> statement-breakpoint
CREATE INDEX "artifacts_cid_idx" ON "artifacts" USING btree ("cid");