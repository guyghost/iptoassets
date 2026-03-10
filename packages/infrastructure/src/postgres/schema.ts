import { pgTable, uuid, text, timestamp, boolean, primaryKey, index, uniqueIndex } from "drizzle-orm/pg-core";

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
