# Phase 2b: PostgreSQL, Bulk Operations & Export — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add PostgreSQL persistence (with Drizzle ORM), bulk asset operations, and CSV/PDF export to IPMS.

**Architecture:** PostgreSQL repos implement the same port interfaces as in-memory repos. `DATABASE_URL` env var switches between them at startup. Bulk operations and export use pure domain functions tested in isolation, orchestrated by use cases. Docker Compose provides the local database.

**Tech Stack:** Drizzle ORM, pg (node-postgres), PostgreSQL 17, Docker Compose, pdfkit, TypeScript, Vitest

---

### Task 1: Install Drizzle dependencies

**Files:**
- Modify: `packages/infrastructure/package.json`

**Step 1: Install Drizzle ORM and pg**

Run:
```bash
cd packages/infrastructure && pnpm add drizzle-orm pg && pnpm add -D drizzle-kit @types/pg
```

**Step 2: Verify install**

Run: `pnpm vitest run`
Expected: All 104 tests pass (no code changes, just deps).

**Step 3: Commit**

```bash
git add packages/infrastructure/package.json pnpm-lock.yaml
git commit -m "chore(infrastructure): add drizzle-orm, pg, and drizzle-kit dependencies"
```

---

### Task 2: Create Drizzle schema

**Files:**
- Create: `packages/infrastructure/src/postgres/schema.ts`

**Step 1: Create the schema file**

Create `packages/infrastructure/src/postgres/schema.ts`:

```typescript
import { pgTable, uuid, text, timestamp, boolean, primaryKey, index } from "drizzle-orm/pg-core";

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
```

**Step 2: Verify**

Run: `pnpm vitest run`
Expected: All 104 tests pass.

**Step 3: Commit**

```bash
git add packages/infrastructure/src/postgres/schema.ts
git commit -m "feat(infrastructure): add Drizzle PostgreSQL schema"
```

---

### Task 3: Create database connection module

**Files:**
- Create: `packages/infrastructure/src/postgres/connection.ts`

**Step 1: Create the connection module**

Create `packages/infrastructure/src/postgres/connection.ts`:

```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString });
  return drizzle(pool, { schema });
}
```

**Step 2: Commit**

```bash
git add packages/infrastructure/src/postgres/connection.ts
git commit -m "feat(infrastructure): add PostgreSQL connection module"
```

---

### Task 4: Create PostgreSQL asset repository

**Files:**
- Create: `packages/infrastructure/src/postgres/pg-asset-repository.ts`

**Step 1: Create the repository**

Create `packages/infrastructure/src/postgres/pg-asset-repository.ts`:

```typescript
import { eq, and } from "drizzle-orm";
import type { AssetId, OrganizationId, AssetStatus, IPType } from "@ipms/shared";
import type { IPAsset } from "@ipms/domain";
import type { AssetRepository } from "@ipms/application";
import { assets } from "./schema.js";
import type { Database } from "./connection.js";

type AssetRow = typeof assets.$inferSelect;

function toEntity(row: AssetRow): IPAsset {
  return {
    id: row.id as AssetId,
    title: row.title,
    type: row.type as IPType,
    jurisdiction: { code: row.jurisdictionCode, name: row.jurisdictionName },
    status: row.status as AssetStatus,
    filingDate: row.filingDate,
    expirationDate: row.expirationDate,
    owner: row.owner,
    organizationId: row.organizationId as OrganizationId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createPgAssetRepository(db: Database): AssetRepository {
  return {
    async findById(id, orgId) {
      const rows = await db.select().from(assets)
        .where(and(eq(assets.id, id), eq(assets.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findAll(orgId) {
      const rows = await db.select().from(assets)
        .where(eq(assets.organizationId, orgId));
      return rows.map(toEntity);
    },

    async save(asset) {
      await db.insert(assets).values({
        id: asset.id,
        title: asset.title,
        type: asset.type,
        jurisdictionCode: asset.jurisdiction.code,
        jurisdictionName: asset.jurisdiction.name,
        status: asset.status,
        filingDate: asset.filingDate,
        expirationDate: asset.expirationDate,
        owner: asset.owner,
        organizationId: asset.organizationId,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      }).onConflictDoUpdate({
        target: assets.id,
        set: {
          title: asset.title,
          type: asset.type,
          jurisdictionCode: asset.jurisdiction.code,
          jurisdictionName: asset.jurisdiction.name,
          status: asset.status,
          filingDate: asset.filingDate,
          expirationDate: asset.expirationDate,
          owner: asset.owner,
          updatedAt: asset.updatedAt,
        },
      });
    },

    async delete(id, orgId) {
      const result = await db.delete(assets)
        .where(and(eq(assets.id, id), eq(assets.organizationId, orgId)));
      return (result.rowCount ?? 0) > 0;
    },
  };
}
```

**Step 2: Commit**

```bash
git add packages/infrastructure/src/postgres/pg-asset-repository.ts
git commit -m "feat(infrastructure): add PostgreSQL asset repository"
```

---

### Task 5: Create remaining PostgreSQL repositories

**Files:**
- Create: `packages/infrastructure/src/postgres/pg-deadline-repository.ts`
- Create: `packages/infrastructure/src/postgres/pg-document-repository.ts`
- Create: `packages/infrastructure/src/postgres/pg-portfolio-repository.ts`
- Create: `packages/infrastructure/src/postgres/pg-status-change-event-repository.ts`

**Step 1: Create deadline repository**

Create `packages/infrastructure/src/postgres/pg-deadline-repository.ts` following the same pattern as the asset repo. Maps `Deadline` entity ↔ `deadlines` table. Uses `eq(deadlines.assetId, assetId)` for `findByAssetId`.

**Step 2: Create document repository**

Create `packages/infrastructure/src/postgres/pg-document-repository.ts`. Same pattern. Maps `Document` entity ↔ `documents` table. Has `findByAssetId`.

**Step 3: Create portfolio repository**

Create `packages/infrastructure/src/postgres/pg-portfolio-repository.ts`. This is the complex one:
- `findById`: SELECT from `portfolios` + SELECT from `portfolio_assets` WHERE `portfolioId` matches, reconstruct `assetIds[]`
- `findAll`: SELECT all portfolios for org, then batch-fetch portfolio_assets
- `save`: upsert into `portfolios`, then DELETE existing `portfolio_assets` for this portfolio, INSERT new rows
- `delete`: DELETE from `portfolio_assets` first (FK), then DELETE from `portfolios`

**Step 4: Create status change event repository**

Create `packages/infrastructure/src/postgres/pg-status-change-event-repository.ts`. Simple — maps `StatusChangeEvent` entity. `findByAssetId` orders by `changedAt ASC`.

**Step 5: Commit**

```bash
git add packages/infrastructure/src/postgres/pg-deadline-repository.ts packages/infrastructure/src/postgres/pg-document-repository.ts packages/infrastructure/src/postgres/pg-portfolio-repository.ts packages/infrastructure/src/postgres/pg-status-change-event-repository.ts
git commit -m "feat(infrastructure): add PostgreSQL deadline, document, portfolio, and status change event repositories"
```

---

### Task 6: Create postgres barrel export and update infrastructure index

**Files:**
- Create: `packages/infrastructure/src/postgres/index.ts`
- Modify: `packages/infrastructure/src/index.ts`
- Modify: `packages/infrastructure/package.json` (add subpath export)

**Step 1: Create postgres barrel**

Create `packages/infrastructure/src/postgres/index.ts`:

```typescript
export { createDatabase } from "./connection.js";
export type { Database } from "./connection.js";
export { createPgAssetRepository } from "./pg-asset-repository.js";
export { createPgDeadlineRepository } from "./pg-deadline-repository.js";
export { createPgDocumentRepository } from "./pg-document-repository.js";
export { createPgPortfolioRepository } from "./pg-portfolio-repository.js";
export { createPgStatusChangeEventRepository } from "./pg-status-change-event-repository.js";
```

**Step 2: Add subpath export to package.json**

In `packages/infrastructure/package.json`, update `exports`:

```json
{
  "exports": {
    ".": "./src/index.ts",
    "./postgres": "./src/postgres/index.ts"
  }
}
```

**Step 3: Verify**

Run: `pnpm vitest run`
Expected: All 104 tests pass.

**Step 4: Commit**

```bash
git add packages/infrastructure/src/postgres/index.ts packages/infrastructure/src/index.ts packages/infrastructure/package.json
git commit -m "feat(infrastructure): add postgres barrel export and subpath"
```

---

### Task 7: Add Docker Compose and Drizzle config

**Files:**
- Create: `docker-compose.yml` (project root)
- Create: `.env.example` (project root)
- Create: `packages/infrastructure/drizzle.config.ts`
- Modify: `packages/infrastructure/package.json` (add scripts)
- Modify: `.gitignore` (add .env)

**Step 1: Create docker-compose.yml**

Create `docker-compose.yml` at project root:

```yaml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: ipms
      POSTGRES_USER: ipms
      POSTGRES_PASSWORD: ipms
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Step 2: Create .env.example**

Create `.env.example`:

```
DATABASE_URL=postgresql://ipms:ipms@localhost:5432/ipms
```

**Step 3: Create drizzle.config.ts**

Create `packages/infrastructure/drizzle.config.ts`:

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/postgres/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Step 4: Add db scripts to infrastructure package.json**

Add to `packages/infrastructure/package.json` scripts:

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio"
  }
}
```

**Step 5: Add .env to .gitignore**

Append `.env` to the project `.gitignore` if not already there.

**Step 6: Commit**

```bash
git add docker-compose.yml .env.example packages/infrastructure/drizzle.config.ts packages/infrastructure/package.json .gitignore
git commit -m "chore: add Docker Compose, Drizzle config, and database scripts"
```

---

### Task 8: Add repository switching in web app

**Files:**
- Modify: `apps/web/src/lib/server/repositories.ts`

**Step 1: Rewrite repositories.ts to support DATABASE_URL switching**

Replace `apps/web/src/lib/server/repositories.ts`:

```typescript
import { env } from "$env/dynamic/private";
import type { AssetRepository, DeadlineRepository, DocumentRepository, PortfolioRepository, StatusChangeEventRepository } from "@ipms/application";

let assetRepo: AssetRepository;
let deadlineRepo: DeadlineRepository;
let documentRepo: DocumentRepository;
let portfolioRepo: PortfolioRepository;
let statusChangeEventRepo: StatusChangeEventRepository;

if (env.DATABASE_URL) {
  const { createDatabase, createPgAssetRepository, createPgDeadlineRepository, createPgDocumentRepository, createPgPortfolioRepository, createPgStatusChangeEventRepository } = await import("@ipms/infrastructure/postgres");
  const db = createDatabase(env.DATABASE_URL);
  assetRepo = createPgAssetRepository(db);
  deadlineRepo = createPgDeadlineRepository(db);
  documentRepo = createPgDocumentRepository(db);
  portfolioRepo = createPgPortfolioRepository(db);
  statusChangeEventRepo = createPgStatusChangeEventRepository(db);
} else {
  const { createInMemoryAssetRepository, createInMemoryDeadlineRepository, createInMemoryDocumentRepository, createInMemoryPortfolioRepository, createInMemoryStatusChangeEventRepository } = await import("@ipms/infrastructure");
  assetRepo = createInMemoryAssetRepository();
  deadlineRepo = createInMemoryDeadlineRepository();
  documentRepo = createInMemoryDocumentRepository();
  portfolioRepo = createInMemoryPortfolioRepository();
  statusChangeEventRepo = createInMemoryStatusChangeEventRepository();

  const { seedData } = await import("./seed.js");
  seedData();
}

export { assetRepo, deadlineRepo, documentRepo, portfolioRepo, statusChangeEventRepo };
```

**Step 2: Verify (no DATABASE_URL set = in-memory mode)**

Run: `pnpm vitest run`
Expected: All 104 tests pass.

**Step 3: Commit**

```bash
git add apps/web/src/lib/server/repositories.ts
git commit -m "feat(web): add DATABASE_URL-based repository switching"
```

---

### Task 9: Generate and verify initial migration

**Step 1: Start PostgreSQL**

Run: `docker compose up -d`
Expected: PostgreSQL container starts on port 5432.

**Step 2: Generate migration**

Run:
```bash
cd packages/infrastructure && DATABASE_URL=postgresql://ipms:ipms@localhost:5432/ipms pnpm db:generate
```
Expected: Migration SQL files generated in `packages/infrastructure/drizzle/`.

**Step 3: Apply migration**

Run:
```bash
cd packages/infrastructure && DATABASE_URL=postgresql://ipms:ipms@localhost:5432/ipms pnpm db:migrate
```
Expected: Tables created successfully.

**Step 4: Verify tables exist**

Run:
```bash
docker exec -it $(docker compose ps -q postgres) psql -U ipms -c '\dt'
```
Expected: Shows assets, deadlines, documents, portfolios, portfolio_assets, status_change_events tables.

**Step 5: Test web app with PostgreSQL**

Create `.env` at project root with `DATABASE_URL=postgresql://ipms:ipms@localhost:5432/ipms`, then:
Run: `cd apps/web && pnpm dev`
Expected: App starts. Dashboard shows empty data (no seed in PostgreSQL mode). API endpoints respond.

**Step 6: Commit**

```bash
git add packages/infrastructure/drizzle/
git commit -m "feat(infrastructure): add initial database migration"
```

---

### Task 10: Add dev script

**Files:**
- Create: `scripts/dev-db.sh`
- Modify: root `package.json` (add script)

**Step 1: Create dev-db.sh**

Create `scripts/dev-db.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Starting PostgreSQL..."
docker compose up -d

echo "Waiting for PostgreSQL..."
until docker compose exec -T postgres pg_isready -U ipms > /dev/null 2>&1; do
  sleep 1
done

echo "Running migrations..."
cd packages/infrastructure && DATABASE_URL=postgresql://ipms:ipms@localhost:5432/ipms pnpm db:migrate
cd ../..

echo "Starting dev server..."
DATABASE_URL=postgresql://ipms:ipms@localhost:5432/ipms pnpm dev
```

Run: `chmod +x scripts/dev-db.sh`

**Step 2: Add script to root package.json**

Add to root `package.json` scripts:

```json
"dev:db": "bash scripts/dev-db.sh"
```

**Step 3: Commit**

```bash
git add scripts/dev-db.sh package.json
git commit -m "chore: add dev-db script for PostgreSQL development"
```

---

### Task 11: Add BulkOperationResult type and bulkValidateStatusTransition

**Files:**
- Modify: `packages/domain/src/entities.ts` (add BulkOperationResult)
- Modify: `packages/domain/src/asset.ts` (add bulkValidateStatusTransition)
- Modify: `packages/domain/src/asset.test.ts` (add tests)
- Modify: `packages/domain/src/index.ts` (add exports)

**Step 1: Add BulkOperationResult to entities**

In `packages/domain/src/entities.ts`, add:

```typescript
export interface BulkOperationResult {
  readonly succeeded: number;
  readonly failed: number;
  readonly errors: readonly { readonly id: string; readonly reason: string }[];
}
```

**Step 2: Write failing tests**

Append to `packages/domain/src/asset.test.ts`:

```typescript
import { bulkValidateStatusTransition } from "./asset.js";

describe("bulkValidateStatusTransition", () => {
  it("returns all assets as valid when transition is allowed", () => {
    const assets = [
      makeAsset({ id: "a0000000-0000-0000-0000-000000000001" as AssetId, status: "draft" }),
      makeAsset({ id: "a0000000-0000-0000-0000-000000000002" as AssetId, status: "draft" }),
    ];
    const result = bulkValidateStatusTransition(assets, "filed");
    expect(result.valid).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
  });

  it("separates valid and invalid transitions", () => {
    const assets = [
      makeAsset({ id: "a0000000-0000-0000-0000-000000000001" as AssetId, status: "draft" }),
      makeAsset({ id: "a0000000-0000-0000-0000-000000000002" as AssetId, status: "granted" }),
      makeAsset({ id: "a0000000-0000-0000-0000-000000000003" as AssetId, status: "expired" }),
    ];
    const result = bulkValidateStatusTransition(assets, "filed");
    expect(result.valid).toHaveLength(1);
    expect(result.errors).toHaveLength(2);
    expect(result.errors[0]!.reason).toContain("Invalid status transition");
  });

  it("handles empty array", () => {
    const result = bulkValidateStatusTransition([], "filed");
    expect(result.valid).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});
```

**Step 3: Run test to verify it fails**

Run: `pnpm vitest run packages/domain/src/asset.test.ts`
Expected: FAIL — `bulkValidateStatusTransition` not found.

**Step 4: Implement**

Append to `packages/domain/src/asset.ts`:

```typescript
export function bulkValidateStatusTransition(
  assets: readonly IPAsset[],
  newStatus: AssetStatus,
): { valid: IPAsset[]; errors: { asset: IPAsset; reason: string }[] } {
  const valid: IPAsset[] = [];
  const errors: { asset: IPAsset; reason: string }[] = [];

  for (const asset of assets) {
    const result = validateStatusTransition(asset.status, newStatus);
    if (result.ok) {
      valid.push(asset);
    } else {
      errors.push({ asset, reason: result.error });
    }
  }

  return { valid, errors };
}
```

**Step 5: Export from domain index**

In `packages/domain/src/index.ts`, update asset exports:

```typescript
export { createAsset, updateAssetStatus, validateStatusTransition, filterAssets, bulkValidateStatusTransition } from "./asset.js";
```

Add `BulkOperationResult` to entity type exports:

```typescript
export type { IPAsset, Deadline, Document, Portfolio, StatusChangeEvent, BulkOperationResult } from "./entities.js";
```

**Step 6: Run tests**

Run: `pnpm vitest run`
Expected: All tests pass (107 total).

**Step 7: Commit**

```bash
git add packages/domain/src/entities.ts packages/domain/src/asset.ts packages/domain/src/asset.test.ts packages/domain/src/index.ts
git commit -m "feat(domain): add BulkOperationResult and bulkValidateStatusTransition"
```

---

### Task 12: Add bulk use cases

**Files:**
- Create: `packages/application/src/use-cases/bulk.ts`
- Modify: `packages/application/src/index.ts`

**Step 1: Create bulk use cases**

Create `packages/application/src/use-cases/bulk.ts`:

```typescript
import type { AssetId, AssetStatus, OrganizationId, StatusChangeEventId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { BulkOperationResult } from "@ipms/domain";
import { bulkValidateStatusTransition, updateAssetStatus, createStatusChangeEvent, addAssetToPortfolio } from "@ipms/domain";
import type { AssetRepository, StatusChangeEventRepository, PortfolioRepository } from "../ports.js";
import type { PortfolioId } from "@ipms/shared";

export function bulkUpdateAssetStatusUseCase(repo: AssetRepository, eventRepo: StatusChangeEventRepository) {
  return async (
    ids: readonly AssetId[],
    orgId: OrganizationId,
    newStatus: AssetStatus,
    changedBy: string,
  ): Promise<Result<BulkOperationResult>> => {
    const assets = await Promise.all(ids.map((id) => repo.findById(id, orgId)));
    const found = assets.filter((a): a is NonNullable<typeof a> => a !== null);
    const notFoundCount = ids.length - found.length;

    const { valid, errors: validationErrors } = bulkValidateStatusTransition(found, newStatus);

    const errors: { id: string; reason: string }[] = [];

    // Add not-found errors
    for (const id of ids) {
      if (!found.some((a) => a.id === id)) {
        errors.push({ id, reason: "Asset not found" });
      }
    }

    // Add validation errors
    for (const { asset, reason } of validationErrors) {
      errors.push({ id: asset.id, reason });
    }

    // Apply valid transitions
    for (const asset of valid) {
      const result = updateAssetStatus(asset, newStatus);
      if (result.ok) {
        await repo.save(result.value);
        const eventResult = createStatusChangeEvent({
          id: crypto.randomUUID() as StatusChangeEventId,
          assetId: asset.id,
          fromStatus: asset.status,
          toStatus: newStatus,
          changedBy,
          organizationId: orgId,
        });
        if (eventResult.ok) {
          await eventRepo.save(eventResult.value);
        }
      }
    }

    return ok({
      succeeded: valid.length,
      failed: errors.length,
      errors,
    });
  };
}

export function bulkAddAssetsToPortfolioUseCase(portfolioRepo: PortfolioRepository) {
  return async (
    portfolioId: PortfolioId,
    assetIds: readonly AssetId[],
    orgId: OrganizationId,
  ): Promise<Result<BulkOperationResult>> => {
    const portfolio = await portfolioRepo.findById(portfolioId, orgId);
    if (!portfolio) return err("Portfolio not found");

    const errors: { id: string; reason: string }[] = [];
    let current = portfolio;
    let succeeded = 0;

    for (const assetId of assetIds) {
      const result = addAssetToPortfolio(current, assetId);
      if (result.ok) {
        current = result.value;
        succeeded++;
      } else {
        errors.push({ id: assetId, reason: result.error });
      }
    }

    await portfolioRepo.save(current);

    return ok({
      succeeded,
      failed: errors.length,
      errors,
    });
  };
}
```

**Step 2: Export from application index**

In `packages/application/src/index.ts`, add:

```typescript
export {
  bulkUpdateAssetStatusUseCase,
  bulkAddAssetsToPortfolioUseCase,
} from "./use-cases/bulk.js";
```

**Step 3: Run tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add packages/application/src/use-cases/bulk.ts packages/application/src/index.ts
git commit -m "feat(application): add bulk status update and portfolio assignment use cases"
```

---

### Task 13: Add bulk use case tests

**Files:**
- Create: `packages/infrastructure/src/bulk-use-cases.test.ts`

**Step 1: Write the tests**

Create `packages/infrastructure/src/bulk-use-cases.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createAssetUseCase, bulkUpdateAssetStatusUseCase, bulkAddAssetsToPortfolioUseCase, createPortfolioUseCase } from "@ipms/application";
import { createInMemoryAssetRepository } from "./in-memory-asset-repository.js";
import { createInMemoryStatusChangeEventRepository } from "./in-memory-status-change-event-repository.js";
import { createInMemoryPortfolioRepository } from "./in-memory-portfolio-repository.js";
import type { AssetId, OrganizationId, PortfolioId } from "@ipms/shared";
import type { CreateAssetInput, CreatePortfolioInput } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_1 = "a0000000-0000-0000-0000-000000000001" as AssetId;
const ASSET_2 = "a0000000-0000-0000-0000-000000000002" as AssetId;
const ASSET_3 = "a0000000-0000-0000-0000-000000000003" as AssetId;
const PORTFOLIO_ID = "b0000000-0000-0000-0000-000000000001" as PortfolioId;

const makeInput = (id: AssetId): CreateAssetInput => ({
  id,
  title: `Asset ${id.slice(-1)}`,
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  owner: "Owner",
  organizationId: ORG_ID,
});

describe("bulkUpdateAssetStatusUseCase", () => {
  let assetRepo: ReturnType<typeof createInMemoryAssetRepository>;
  let eventRepo: ReturnType<typeof createInMemoryStatusChangeEventRepository>;

  beforeEach(async () => {
    assetRepo = createInMemoryAssetRepository();
    eventRepo = createInMemoryStatusChangeEventRepository();
    const create = createAssetUseCase(assetRepo);
    await create(makeInput(ASSET_1));
    await create(makeInput(ASSET_2));
    await create(makeInput(ASSET_3));
  });

  it("updates all valid assets", async () => {
    const bulkUpdate = bulkUpdateAssetStatusUseCase(assetRepo, eventRepo);
    const result = await bulkUpdate([ASSET_1, ASSET_2, ASSET_3], ORG_ID, "filed", "Alex");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.succeeded).toBe(3);
      expect(result.value.failed).toBe(0);
    }
  });

  it("reports errors for invalid transitions", async () => {
    // First move ASSET_1 to filed, then try to move all to "filed" again
    const { updateAssetStatusUseCase } = await import("@ipms/application");
    const update = updateAssetStatusUseCase(assetRepo, eventRepo);
    await update(ASSET_1, ORG_ID, "filed", "Alex");

    const bulkUpdate = bulkUpdateAssetStatusUseCase(assetRepo, eventRepo);
    const result = await bulkUpdate([ASSET_1, ASSET_2, ASSET_3], ORG_ID, "filed", "Alex");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.succeeded).toBe(2);
      expect(result.value.failed).toBe(1);
      expect(result.value.errors[0]!.id).toBe(ASSET_1);
    }
  });

  it("creates status change events for successful updates", async () => {
    const bulkUpdate = bulkUpdateAssetStatusUseCase(assetRepo, eventRepo);
    await bulkUpdate([ASSET_1, ASSET_2], ORG_ID, "filed", "Alex");

    const events1 = await eventRepo.findByAssetId(ASSET_1, ORG_ID);
    const events2 = await eventRepo.findByAssetId(ASSET_2, ORG_ID);
    expect(events1).toHaveLength(1);
    expect(events2).toHaveLength(1);
  });
});

describe("bulkAddAssetsToPortfolioUseCase", () => {
  let assetRepo: ReturnType<typeof createInMemoryAssetRepository>;
  let portfolioRepo: ReturnType<typeof createInMemoryPortfolioRepository>;

  beforeEach(async () => {
    assetRepo = createInMemoryAssetRepository();
    portfolioRepo = createInMemoryPortfolioRepository();
    const create = createAssetUseCase(assetRepo);
    await create(makeInput(ASSET_1));
    await create(makeInput(ASSET_2));

    const createPort = createPortfolioUseCase(portfolioRepo);
    await createPort({
      id: PORTFOLIO_ID,
      name: "Test Portfolio",
      description: "Test",
      owner: "Owner",
      organizationId: ORG_ID,
    });
  });

  it("adds multiple assets to portfolio", async () => {
    const bulkAdd = bulkAddAssetsToPortfolioUseCase(portfolioRepo);
    const result = await bulkAdd(PORTFOLIO_ID, [ASSET_1, ASSET_2], ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.succeeded).toBe(2);
      expect(result.value.failed).toBe(0);
    }
  });

  it("reports errors for duplicate assets", async () => {
    const bulkAdd = bulkAddAssetsToPortfolioUseCase(portfolioRepo);
    await bulkAdd(PORTFOLIO_ID, [ASSET_1], ORG_ID);
    const result = await bulkAdd(PORTFOLIO_ID, [ASSET_1, ASSET_2], ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.succeeded).toBe(1);
      expect(result.value.failed).toBe(1);
    }
  });
});
```

**Step 2: Run tests**

Run: `pnpm vitest run`
Expected: All tests pass (~112 total).

**Step 3: Commit**

```bash
git add packages/infrastructure/src/bulk-use-cases.test.ts
git commit -m "test(infrastructure): add bulk use case integration tests"
```

---

### Task 14: Wire bulk use cases and add API routes

**Files:**
- Modify: `apps/web/src/lib/server/use-cases.ts`
- Create: `apps/web/src/routes/api/assets/bulk/status/+server.ts`
- Create: `apps/web/src/routes/api/assets/bulk/portfolio/+server.ts`

**Step 1: Wire use cases**

In `apps/web/src/lib/server/use-cases.ts`, add imports and wiring:

```typescript
import { bulkUpdateAssetStatusUseCase, bulkAddAssetsToPortfolioUseCase } from "@ipms/application";

export const bulkUpdateAssetStatus = bulkUpdateAssetStatusUseCase(assetRepo, statusChangeEventRepo);
export const bulkAddAssetsToPortfolio = bulkAddAssetsToPortfolioUseCase(portfolioRepo);
```

**Step 2: Create bulk status API route**

Create `apps/web/src/routes/api/assets/bulk/status/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { bulkUpdateAssetStatus } from "$lib/server/use-cases";
import { DEFAULT_ORG_ID } from "$lib/server/api-utils";
import type { AssetId } from "@ipms/shared";

export const PUT: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const ids = (body.ids as string[]).map((id) => id as AssetId);
  const result = await bulkUpdateAssetStatus(ids, DEFAULT_ORG_ID, body.status, body.changedBy ?? "system");
  if (!result.ok) return json({ error: result.error }, { status: 400 });
  return json(result.value);
};
```

**Step 3: Create bulk portfolio API route**

Create `apps/web/src/routes/api/assets/bulk/portfolio/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { bulkAddAssetsToPortfolio } from "$lib/server/use-cases";
import { DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parsePortfolioId } from "@ipms/shared";
import type { AssetId } from "@ipms/shared";

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();
  const portfolioIdResult = parsePortfolioId(body.portfolioId);
  if (!portfolioIdResult.ok) return json({ error: portfolioIdResult.error }, { status: 400 });

  const assetIds = (body.ids as string[]).map((id) => id as AssetId);
  const result = await bulkAddAssetsToPortfolio(portfolioIdResult.value, assetIds, DEFAULT_ORG_ID);
  if (!result.ok) return json({ error: result.error }, { status: 400 });
  return json(result.value);
};
```

**Step 4: Run tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 5: Commit**

```bash
git add apps/web/src/lib/server/use-cases.ts apps/web/src/routes/api/assets/bulk/
git commit -m "feat(web): add bulk status update and portfolio assignment API routes"
```

---

### Task 15: Add bulk selection UI to assets page

**Files:**
- Modify: `apps/web/src/routes/assets/+page.svelte`

**Step 1: Read the current page and enhance it**

Read `apps/web/src/routes/assets/+page.svelte` first, then add:

- A `$state` `Set<string>` for selected asset IDs
- Checkboxes in each table row and a "select all" checkbox in the header
- A floating action bar at the bottom of the page when `selectedIds.size > 0`, showing:
  - Selected count
  - "Change Status" dropdown (select target status, submit)
  - "Add to Portfolio" dropdown (fetch portfolios, select one, submit)
  - "Clear selection" button
- API calls to `/api/assets/bulk/status` and `/api/assets/bulk/portfolio`
- After bulk action, re-fetch assets and clear selection
- Show success/error toast or inline message with `BulkOperationResult` counts

Keep existing filter/sort/search functionality intact. The checkboxes should be the first column.

**Step 2: Verify manually**

Run: `cd apps/web && pnpm dev`
Expected: Checkboxes visible, action bar appears on selection, bulk actions work.

**Step 3: Commit**

```bash
git add apps/web/src/routes/assets/+page.svelte
git commit -m "feat(web): add bulk selection and action bar to assets page"
```

---

### Task 16: Add CSV export domain function

**Files:**
- Create: `packages/domain/src/export/assets-csv.ts`
- Create: `packages/domain/src/export/assets-csv.test.ts`
- Create: `packages/domain/src/export/index.ts`
- Modify: `packages/domain/src/index.ts`

**Step 1: Write failing test**

Create `packages/domain/src/export/assets-csv.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { assetsToCSVRows } from "./assets-csv.js";
import type { IPAsset } from "../entities.js";
import type { AssetId, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;

const makeAsset = (overrides: Partial<IPAsset>): IPAsset => ({
  id: "a0000000-0000-0000-0000-000000000001" as AssetId,
  title: "Test Patent",
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  status: "draft",
  filingDate: null,
  expirationDate: null,
  owner: "Owner",
  organizationId: ORG_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

describe("assetsToCSVRows", () => {
  it("returns header row for empty array", () => {
    const rows = assetsToCSVRows([]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(["ID", "Title", "Type", "Jurisdiction", "Status", "Owner", "Filing Date", "Expiration Date"]);
  });

  it("converts assets to CSV rows", () => {
    const assets = [
      makeAsset({ title: "My Patent", type: "patent", status: "filed", filingDate: new Date("2026-01-15") }),
    ];
    const rows = assetsToCSVRows(assets);
    expect(rows).toHaveLength(2);
    expect(rows[1]![1]).toBe("My Patent");
    expect(rows[1]![2]).toBe("patent");
    expect(rows[1]![4]).toBe("filed");
  });

  it("handles null dates", () => {
    const rows = assetsToCSVRows([makeAsset({})]);
    expect(rows[1]![6]).toBe("");
    expect(rows[1]![7]).toBe("");
  });
});
```

**Step 2: Implement**

Create `packages/domain/src/export/assets-csv.ts`:

```typescript
import type { IPAsset } from "../entities.js";

const HEADER = ["ID", "Title", "Type", "Jurisdiction", "Status", "Owner", "Filing Date", "Expiration Date"];

function formatDate(date: Date | null): string {
  if (!date) return "";
  return date.toISOString().split("T")[0]!;
}

export function assetsToCSVRows(assets: readonly IPAsset[]): string[][] {
  const rows: string[][] = [HEADER];
  for (const asset of assets) {
    rows.push([
      asset.id,
      asset.title,
      asset.type,
      `${asset.jurisdiction.code} - ${asset.jurisdiction.name}`,
      asset.status,
      asset.owner,
      formatDate(asset.filingDate),
      formatDate(asset.expirationDate),
    ]);
  }
  return rows;
}

export function csvRowsToString(rows: readonly (readonly string[])[]): string {
  return rows
    .map((row) => row.map((cell) => {
      if (cell.includes(",") || cell.includes('"') || cell.includes("\n")) {
        return `"${cell.replace(/"/g, '""')}"`;
      }
      return cell;
    }).join(","))
    .join("\n");
}
```

Create `packages/domain/src/export/index.ts`:

```typescript
export { assetsToCSVRows, csvRowsToString } from "./assets-csv.js";
```

Update `packages/domain/src/index.ts`:

```typescript
export { assetsToCSVRows, csvRowsToString } from "./export/index.js";
```

**Step 3: Run tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 4: Commit**

```bash
git add packages/domain/src/export/ packages/domain/src/index.ts
git commit -m "feat(domain): add CSV export functions for assets"
```

---

### Task 17: Add export use cases and API routes

**Files:**
- Create: `packages/application/src/use-cases/export.ts`
- Modify: `packages/application/src/index.ts`
- Create: `apps/web/src/routes/api/export/assets.csv/+server.ts`

**Step 1: Create export use case**

Create `packages/application/src/use-cases/export.ts`:

```typescript
import type { OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import { type AssetFilter, filterAssets, assetsToCSVRows, csvRowsToString } from "@ipms/domain";
import type { AssetRepository } from "../ports.js";

export function exportAssetsCSVUseCase(repo: AssetRepository) {
  return async (orgId: OrganizationId, filter?: AssetFilter): Promise<Result<string>> => {
    const allAssets = await repo.findAll(orgId);
    const assets = filter ? filterAssets(allAssets, filter) : allAssets;
    const rows = assetsToCSVRows(assets);
    return ok(csvRowsToString(rows));
  };
}
```

**Step 2: Export from application index**

In `packages/application/src/index.ts`, add:

```typescript
export { exportAssetsCSVUseCase } from "./use-cases/export.js";
```

**Step 3: Wire in web app**

In `apps/web/src/lib/server/use-cases.ts`, add:

```typescript
import { exportAssetsCSVUseCase } from "@ipms/application";
export const exportAssetsCSV = exportAssetsCSVUseCase(assetRepo);
```

**Step 4: Create CSV export API route**

Create `apps/web/src/routes/api/export/assets.csv/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { exportAssetsCSV } from "$lib/server/use-cases";
import { DEFAULT_ORG_ID } from "$lib/server/api-utils";
import type { AssetFilter } from "@ipms/domain";
import type { AssetStatus, IPType } from "@ipms/shared";

export const GET: RequestHandler = async ({ url }) => {
  const filter: AssetFilter = {};
  const status = url.searchParams.getAll("status");
  const type = url.searchParams.getAll("type");
  const jurisdiction = url.searchParams.get("jurisdiction");
  const owner = url.searchParams.get("owner");

  const assetFilter: AssetFilter = {
    ...(status.length > 0 ? { status: status as AssetStatus[] } : {}),
    ...(type.length > 0 ? { type: type as IPType[] } : {}),
    ...(jurisdiction ? { jurisdiction } : {}),
    ...(owner ? { owner } : {}),
  };

  const result = await exportAssetsCSV(DEFAULT_ORG_ID, assetFilter);
  if (!result.ok) return new Response(result.error, { status: 400 });

  return new Response(result.value, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="assets.csv"',
    },
  });
};
```

**Step 5: Run tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add packages/application/src/use-cases/export.ts packages/application/src/index.ts apps/web/src/lib/server/use-cases.ts apps/web/src/routes/api/export/
git commit -m "feat: add CSV export use case and API route"
```

---

### Task 18: Add export buttons to assets page

**Files:**
- Modify: `apps/web/src/routes/assets/+page.svelte`

**Step 1: Add export buttons**

Read the current page, then add "Export CSV" button near the page header. When clicked, it constructs the download URL with current filter params and triggers a download via `window.location.href` or an `<a>` tag with `download` attribute.

Build the URL from active filter state: `/api/export/assets.csv?status=filed&type=patent&...`

**Step 2: Verify manually**

Run: `cd apps/web && pnpm dev`
Navigate to `/assets`, apply some filters, click "Export CSV".
Expected: CSV file downloads with filtered assets.

**Step 3: Commit**

```bash
git add apps/web/src/routes/assets/+page.svelte
git commit -m "feat(web): add CSV export button to assets page"
```

---

### Task 19: Add ADR for Drizzle and update documentation

**Files:**
- Create: `docs/adr/008-drizzle-postgresql.md`
- Modify: `docs/architecture.md`
- Modify: `docs/roadmap.md`

**Step 1: Create ADR**

Create `docs/adr/008-drizzle-postgresql.md`:

```markdown
# ADR-008: Drizzle ORM with PostgreSQL

## Status

Accepted

## Context

IPMS Phase 1 and 2a used in-memory repositories. For production use, we need persistent storage. The architecture uses ports and adapters, making the storage layer swappable.

## Decision

Use Drizzle ORM with PostgreSQL for persistent storage.

- Schema defined in TypeScript (`packages/infrastructure/src/postgres/schema.ts`)
- Migrations managed by Drizzle Kit
- Docker Compose for local development
- `DATABASE_URL` environment variable switches between in-memory (no DB) and PostgreSQL

## Consequences

- Type-safe database queries matching domain types
- In-memory repositories remain for fast unit tests
- Development can proceed without Docker (in-memory mode)
- Schema changes require migration generation and application
```

**Step 2: Update architecture.md**

Add a section about the PostgreSQL layer and the environment-based switching.

**Step 3: Update roadmap.md**

Mark completed:
- [x] Bulk asset operations (status update, portfolio assignment)
- [x] Export to CSV/PDF
- [x] Persistent storage (PostgreSQL via repository port swap)
- [x] Database migrations

**Step 4: Commit**

```bash
git add docs/
git commit -m "docs: add Drizzle ADR and update architecture and roadmap for Phase 2b"
```

---

### Task 20: Final verification

**Step 1: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass (~115+ total).

**Step 2: Build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 3: Test in-memory mode**

Run: `pnpm dev` (no DATABASE_URL)
Expected: App works with seed data, bulk actions work, CSV export works.

**Step 4: Test PostgreSQL mode (if Docker available)**

Run: `pnpm dev:db`
Expected: App starts with PostgreSQL, all API routes work.

---

## Task Dependency Summary

```
Task 1 (deps) → Task 2 (schema) → Task 3 (connection) → Task 4 (asset repo)
                                                           → Task 5 (remaining repos)
                                                              → Task 6 (barrel + subpath)
                                                                 → Task 7 (docker + drizzle config)
                                                                    → Task 8 (repo switching)
                                                                       → Task 9 (migration)
                                                                          → Task 10 (dev script)

Task 11 (bulk domain) ─── independent, can start after Task 1
  → Task 12 (bulk use cases)
     → Task 13 (bulk tests)
        → Task 14 (bulk API routes)
           → Task 15 (bulk UI)

Task 16 (CSV domain) ─── independent, can start after Task 1
  → Task 17 (export use case + API)
     → Task 18 (export UI)

Task 19 (docs) ─── after all code tasks
Task 20 (verification) ─── after everything
```
