import { boolean, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const sessions = pgTable("sessions", {
  tokenHash: text("token_hash").primaryKey(), subject: text("subject").notNull(), wallet: text("wallet"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const nonces = pgTable("nonces", {
  nonceHash: text("nonce_hash").primaryKey(), wallet: text("wallet"), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const drafts = pgTable("drafts", {
  id: uuid("id").defaultRandom().primaryKey(), ownerSubject: text("owner_subject").notNull(), kind: text("kind").notNull(),
  payload: jsonb("payload").notNull(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("drafts_owner_updated_idx").on(table.ownerSubject, table.updatedAt)]);
export const operations = pgTable("operations", {
  id: text("id").primaryKey(), ownerSubject: text("owner_subject").notNull(), wallet: text("wallet").notNull(), kind: text("kind").notNull(),
  state: text("state").notNull(), payloadDigest: text("payload_digest").notNull(), transactionHash: text("transaction_hash"),
  recordId: text("record_id"),
  lastError: text("last_error"), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("operations_intent_uidx").on(table.kind, table.wallet, table.payloadDigest)]);
export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(), contributionId: text("contribution_id").notNull(), issuerSubject: text("issuer_subject").notNull(),
  recipientHash: text("recipient_hash").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), acceptedAt: timestamp("accepted_at", { withTimezone: true }),
}, (table) => [uniqueIndex("invitations_once_uidx").on(table.contributionId, table.recipientHash)]);
export const disputes = pgTable("disputes", {
  id: uuid("id").defaultRandom().primaryKey(), contributionId: text("contribution_id").notNull(), attestationId: text("attestation_id"),
  authorSubject: text("author_subject").notNull(), reason: text("reason").notNull(), evidenceUri: text("evidence_uri"),
  resolved: boolean("resolved").notNull().default(false), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const artifacts = pgTable("artifacts", {
  id: uuid("id").defaultRandom().primaryKey(), ownerSubject: text("owner_subject").notNull(), cid: text("cid").notNull(), uri: text("uri").notNull(),
  sha256: text("sha256").notNull(), fileName: text("file_name").notNull(), mediaType: text("media_type").notNull(), size: text("size").notNull(),
  retrievalStatus: text("retrieval_status").notNull(), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("artifacts_owner_created_idx").on(table.ownerSubject, table.createdAt), index("artifacts_cid_idx").on(table.cid)]);

export const workspaces = pgTable("workspaces", {
  id: uuid("id").defaultRandom().primaryKey(), slug: text("slug").notNull(), name: text("name").notNull(), description: text("description"),
  ownerSubject: text("owner_subject").notNull(), status: text("status").notNull().default("active"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("workspaces_slug_uidx").on(table.slug)]);

export const workspaceMemberships = pgTable("workspace_memberships", {
  id: uuid("id").defaultRandom().primaryKey(), workspaceId: uuid("workspace_id").notNull(), subject: text("subject").notNull(), role: text("role").notNull(),
  status: text("status").notNull().default("active"), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("workspace_memberships_once_uidx").on(table.workspaceId, table.subject), index("workspace_memberships_subject_idx").on(table.subject)]);

export const privateEvidence = pgTable("private_evidence", {
  id: uuid("id").defaultRandom().primaryKey(), workspaceId: uuid("workspace_id").notNull(), ownerSubject: text("owner_subject").notNull(), contributionId: text("contribution_id"),
  classification: text("classification").notNull(), state: text("state").notNull().default("quarantine_pending"), storageKeyCiphertext: text("storage_key_ciphertext").notNull(),
  scanVersion: text("scan_version"), scanResult: text("scan_result"), deleteAfter: timestamp("delete_after", { withTimezone: true }), deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("private_evidence_workspace_created_idx").on(table.workspaceId, table.createdAt), index("private_evidence_owner_idx").on(table.ownerSubject)]);

export const privateEvidenceGrants = pgTable("private_evidence_grants", {
  id: uuid("id").defaultRandom().primaryKey(), evidenceId: uuid("evidence_id").notNull(), subject: text("subject").notNull(), permission: text("permission").notNull(),
  status: text("status").notNull().default("active"), grantedBySubject: text("granted_by_subject").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }), revokedAt: timestamp("revoked_at", { withTimezone: true }), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("private_evidence_grants_once_uidx").on(table.evidenceId, table.subject, table.permission), index("private_evidence_grants_subject_idx").on(table.subject)]);

export const workspaceAuditEvents = pgTable("workspace_audit_events", {
  id: uuid("id").defaultRandom().primaryKey(), workspaceId: uuid("workspace_id").notNull(), actorSubject: text("actor_subject").notNull(), action: text("action").notNull(),
  targetType: text("target_type").notNull(), targetId: text("target_id"), detail: jsonb("detail").notNull().default({}), createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("workspace_audit_workspace_created_idx").on(table.workspaceId, table.createdAt)]);
