CREATE TABLE "private_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"owner_subject" text NOT NULL,
	"contribution_id" text,
	"classification" text NOT NULL,
	"state" text DEFAULT 'quarantine_pending' NOT NULL,
	"storage_key_ciphertext" text NOT NULL,
	"scan_version" text,
	"scan_result" text,
	"delete_after" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "private_evidence_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"evidence_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"permission" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"granted_by_subject" text NOT NULL,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_subject" text NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"detail" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspace_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_subject" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "private_evidence_workspace_created_idx" ON "private_evidence" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "private_evidence_owner_idx" ON "private_evidence" USING btree ("owner_subject");--> statement-breakpoint
CREATE UNIQUE INDEX "private_evidence_grants_once_uidx" ON "private_evidence_grants" USING btree ("evidence_id","subject","permission");--> statement-breakpoint
CREATE INDEX "private_evidence_grants_subject_idx" ON "private_evidence_grants" USING btree ("subject");--> statement-breakpoint
CREATE INDEX "workspace_audit_workspace_created_idx" ON "workspace_audit_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_memberships_once_uidx" ON "workspace_memberships" USING btree ("workspace_id","subject");--> statement-breakpoint
CREATE INDEX "workspace_memberships_subject_idx" ON "workspace_memberships" USING btree ("subject");--> statement-breakpoint
CREATE UNIQUE INDEX "workspaces_slug_uidx" ON "workspaces" USING btree ("slug");