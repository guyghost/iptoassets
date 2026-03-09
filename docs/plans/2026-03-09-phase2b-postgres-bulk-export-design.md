# Phase 2b: PostgreSQL, Bulk Operations & Export — Design

## Decisions

- Drizzle ORM for type-safe PostgreSQL access
- Docker Compose for local development database (postgres:17)
- Schema lives in `packages/infrastructure/src/postgres/`
- `DATABASE_URL` env var switches between in-memory and PostgreSQL repos
- Bulk operations as pure domain validation + use cases
- Export CSV via string generation, PDF via pdfkit
- Migrations via Drizzle Kit

## PostgreSQL Schema

All tables in `packages/infrastructure/src/postgres/schema.ts`.

### assets

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| title | text | NOT NULL |
| type | text | NOT NULL |
| jurisdiction_code | text | NOT NULL |
| jurisdiction_name | text | NOT NULL |
| status | text | NOT NULL |
| filing_date | timestamp | nullable |
| expiration_date | timestamp | nullable |
| owner | text | NOT NULL |
| organization_id | uuid | NOT NULL, indexed |
| created_at | timestamp | NOT NULL, default now() |
| updated_at | timestamp | NOT NULL, default now() |

### deadlines

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| asset_id | uuid | NOT NULL, FK → assets.id |
| type | text | NOT NULL |
| title | text | NOT NULL |
| due_date | timestamp | NOT NULL |
| completed | boolean | NOT NULL, default false |
| organization_id | uuid | NOT NULL, indexed |

### documents

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| asset_id | uuid | NOT NULL, FK → assets.id |
| name | text | NOT NULL |
| type | text | NOT NULL |
| url | text | NOT NULL |
| uploaded_at | timestamp | NOT NULL, default now() |
| status | text | NOT NULL, default 'uploaded' |
| organization_id | uuid | NOT NULL, indexed |

### portfolios

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| name | text | NOT NULL |
| description | text | NOT NULL, default '' |
| owner | text | NOT NULL |
| organization_id | uuid | NOT NULL, indexed |

### portfolio_assets (join table)

| Column | Type | Constraints |
|--------|------|-------------|
| portfolio_id | uuid | FK → portfolios.id, composite PK |
| asset_id | uuid | FK → assets.id, composite PK |

### status_change_events

| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | PK |
| asset_id | uuid | NOT NULL, FK → assets.id |
| from_status | text | nullable |
| to_status | text | NOT NULL |
| changed_at | timestamp | NOT NULL, default now() |
| changed_by | text | NOT NULL |
| organization_id | uuid | NOT NULL, indexed |

Indexes on `organization_id` for all tables. Index on `asset_id` for deadlines, documents, status_change_events.

## PostgreSQL Repository Implementations

```
packages/infrastructure/src/postgres/
  schema.ts                              — Drizzle schema
  connection.ts                          — pg Pool + drizzle instance
  pg-asset-repository.ts                 — AssetRepository impl
  pg-deadline-repository.ts              — DeadlineRepository impl
  pg-document-repository.ts              — DocumentRepository impl
  pg-portfolio-repository.ts             — PortfolioRepository impl (join table)
  pg-status-change-event-repository.ts
  index.ts                               — barrel exports
```

Each repo takes a `db` instance (dependency injection), has private `toEntity(row)` and `toRow(entity)` mapping functions. `Jurisdiction` is flattened to two columns. Portfolio repo does join on `portfolio_assets` to reconstruct `assetIds[]`.

## In-Memory / PostgreSQL Switch

`apps/web/src/lib/server/repositories.ts` checks `DATABASE_URL`:
- Present → create pg pool, instantiate PostgreSQL repos
- Absent → in-memory repos + seed data (existing behavior)

Tests are unaffected (they use in-memory repos directly).

## Docker Compose

`docker-compose.yml` at project root:
- postgres:17 service
- Port 5432
- DB: ipms, user: ipms, password: ipms
- Named volume for data persistence

`.env.example` with `DATABASE_URL=postgresql://ipms:ipms@localhost:5432/ipms`

## Migrations

- `drizzle.config.ts` in `packages/infrastructure`
- Generated migrations in `packages/infrastructure/drizzle/`
- Scripts: `db:generate`, `db:migrate`, `db:studio`
- `scripts/dev.sh`: docker compose up → db:migrate → pnpm dev

## Bulk Operations

### Domain

```typescript
// packages/domain/src/asset.ts
function bulkValidateStatusTransition(
  assets: readonly IPAsset[],
  newStatus: AssetStatus
): { valid: IPAsset[]; errors: { asset: IPAsset; reason: string }[] }

// packages/domain/src/entities.ts or shared
interface BulkOperationResult {
  readonly succeeded: number;
  readonly failed: number;
  readonly errors: readonly { readonly id: string; readonly reason: string }[];
}
```

### Use Cases

```typescript
bulkUpdateAssetStatusUseCase(repo, eventRepo)
  → (ids: AssetId[], orgId, newStatus, changedBy) → Result<BulkOperationResult>

bulkAddAssetsToPortfolioUseCase(portfolioRepo)
  → (portfolioId, assetIds: AssetId[], orgId) → Result<BulkOperationResult>
```

### API Routes

```
PUT  /api/assets/bulk/status     — { ids, status, changedBy }
POST /api/assets/bulk/portfolio  — { ids, portfolioId }
```

### UI

Assets page: checkboxes per row, floating action bar when >= 1 selected. Actions: "Change status", "Add to portfolio".

## Export

### Domain

```typescript
// packages/domain/src/export/
function assetsToCSVRows(assets: readonly IPAsset[]): string[][]
function deadlinesToCSVRows(deadlines: readonly Deadline[]): string[][]
```

### Use Cases

```typescript
exportAssetsCSVUseCase(assetRepo)
  → (orgId, filter?: AssetFilter) → Result<string>

exportAssetsPDFUseCase(assetRepo)
  → (orgId, filter?: AssetFilter) → Result<Uint8Array>
```

PDF generated with pdfkit (server-side).

### API Routes

```
GET /api/export/assets.csv?status=granted&type=patent
GET /api/export/assets.pdf?status=granted&type=patent
```

Query params match AssetFilter fields. Reuses `filterAssets` pure function.

### UI

"Export CSV" and "Export PDF" buttons on assets page, applying current active filters.

## Testing Strategy

- Domain: unit tests for `bulkValidateStatusTransition`, `assetsToCSVRows`, `deadlinesToCSVRows`
- Application: use case tests with in-memory repos for bulk ops and export
- Infrastructure: PostgreSQL repo integration tests (optional, require Docker)
- E2E: bulk selection workflow, export download

## What We're NOT Doing

- No data migration (no production data)
- No advanced connection pooling (PgBouncer)
- No DB integration tests in CI
- No replication or backup
