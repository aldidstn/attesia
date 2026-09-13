CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" text NOT NULL,
	"attestation_id" text,
	"author_subject" text NOT NULL,
	"reason" text NOT NULL,
	"evidence_uri" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drafts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_subject" text NOT NULL,
	"kind" text NOT NULL,
	"payload" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_id" text NOT NULL,
	"issuer_subject" text NOT NULL,
	"recipient_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nonces" (
	"nonce_hash" text PRIMARY KEY NOT NULL,
	"wallet" text,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operations" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_subject" text NOT NULL,
	"wallet" text NOT NULL,
	"kind" text NOT NULL,
	"state" text NOT NULL,
	"payload_digest" text NOT NULL,
	"transaction_hash" text,
	"record_id" text,
	"last_error" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"subject" text NOT NULL,
	"wallet" text,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "drafts_owner_updated_idx" ON "drafts" USING btree ("owner_subject","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_once_uidx" ON "invitations" USING btree ("contribution_id","recipient_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "operations_intent_uidx" ON "operations" USING btree ("kind","wallet","payload_digest");