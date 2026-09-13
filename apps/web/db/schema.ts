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
