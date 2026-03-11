import { pgTable, uuid, text, timestamp, boolean, primaryKey, index, uniqueIndex, customType } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const vector = customType<{ data: string }>({
  dataType() {
    return "vector(1024)";
  },
});

export const assets = pgTable("assets", {
  id: uuid("id").primaryKey(),
  title: text("title").notNull(),
  type: text("type").notNull(),
  jurisdictionCode: text("jurisdiction_code").notNull(),
  jurisdictionName: text("jurisdiction_name").notNull(),
  status: text("status").notNull(),
  filingDate: timestamp("filing_date"),
  expirationDate: timestamp("expiration_date"),
  owner: text("owner").notNull(),
  organizationId: uuid("organization_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("assets_organization_id_idx").on(table.organizationId),
]);

export const deadlines = pgTable("deadlines", {
  id: uuid("id").primaryKey(),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  dueDate: timestamp("due_date").notNull(),
  completed: boolean("completed").notNull().default(false),
  organizationId: uuid("organization_id").notNull(),
}, (table) => [
  index("deadlines_organization_id_idx").on(table.organizationId),
  index("deadlines_asset_id_idx").on(table.assetId),
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey(),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  status: text("status").notNull().default("uploaded"),
  organizationId: uuid("organization_id").notNull(),
  tags: text("tags").array().notNull().default(sql`'{}'`),
}, (table) => [
  index("documents_organization_id_idx").on(table.organizationId),
  index("documents_asset_id_idx").on(table.assetId),
]);

export const portfolios = pgTable("portfolios", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  owner: text("owner").notNull(),
  organizationId: uuid("organization_id").notNull(),
}, (table) => [
  index("portfolios_organization_id_idx").on(table.organizationId),
]);

export const portfolioAssets = pgTable("portfolio_assets", {
  portfolioId: uuid("portfolio_id").notNull().references(() => portfolios.id),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
}, (table) => [
  primaryKey({ columns: [table.portfolioId, table.assetId] }),
]);

export const statusChangeEvents = pgTable("status_change_events", {
  id: uuid("id").primaryKey(),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedAt: timestamp("changed_at").notNull().defaultNow(),
  changedBy: text("changed_by").notNull(),
  organizationId: uuid("organization_id").notNull(),
}, (table) => [
  index("status_change_events_organization_id_idx").on(table.organizationId),
  index("status_change_events_asset_id_idx").on(table.assetId),
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  authProviderId: text("auth_provider_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email),
  uniqueIndex("users_auth_provider_id_idx").on(table.authProviderId),
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  role: text("role").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("memberships_user_org_idx").on(table.userId, table.organizationId),
  index("memberships_user_id_idx").on(table.userId),
  index("memberships_organization_id_idx").on(table.organizationId),
]);

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  actorId: uuid("actor_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: text("metadata"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("audit_events_organization_id_idx").on(table.organizationId),
  index("audit_events_entity_type_idx").on(table.organizationId, table.entityType),
  index("audit_events_actor_id_idx").on(table.actorId),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  recipientId: uuid("recipient_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("notifications_recipient_id_idx").on(table.recipientId, table.organizationId),
]);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  invitedByUserId: uuid("invited_by_user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
  index("invitations_email_idx").on(table.email),
  index("invitations_organization_id_idx").on(table.organizationId),
]);

export const assetEmbeddings = pgTable("asset_embeddings", {
  assetId: uuid("asset_id").primaryKey().references(() => assets.id),
  organizationId: uuid("organization_id").notNull(),
  embedding: vector("embedding").notNull(),
}, (table) => [
  index("asset_embeddings_organization_id_idx").on(table.organizationId),
]);

export const priorArtResults = pgTable("prior_art_results", {
  id: uuid("id").primaryKey(),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  organizationId: uuid("organization_id").notNull(),
  patentNumber: text("patent_number").notNull(),
  title: text("title").notNull(),
  abstractText: text("abstract_text").notNull(),
  relevanceScore: text("relevance_score").notNull(),
  relevanceReasoning: text("relevance_reasoning").notNull(),
  source: text("source").notNull().default("uspto"),
  searchedAt: timestamp("searched_at").notNull().defaultNow(),
}, (table) => [
  index("prior_art_results_asset_id_idx").on(table.assetId, table.organizationId),
]);
