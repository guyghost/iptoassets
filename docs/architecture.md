# IPMS -- Architecture

## Overview

IPMS follows **Clean Architecture** with a **Functional Core / Imperative Shell** (FC/IS) pattern, implemented as a pnpm monorepo. Dependencies point inward: infrastructure and UI depend on application and domain, never the reverse.

## Clean Architecture Layers

```
+------------------------------------------------------+
|                    apps/web (SvelteKit)               |
|           UI  +  API Routes (Imperative Shell)        |
+------------------------------------------------------+
         |              |               |
         v              v               v
+----------------+ +-------------+ +------------------+
|  packages/ui   | | packages/   | | packages/        |
|  (Svelte 5)    | | state-      | | infrastructure   |
|                | | machines    | | (In-Memory Repos) |
+----------------+ +-------------+ +------------------+
         |              |               |
         v              v               v
+------------------------------------------------------+
|              packages/application                     |
|          Use Cases  +  Port Interfaces                |
+------------------------------------------------------+
                        |
                        v
+------------------------------------------------------+
|                packages/domain                        |
|  Pure Entities + Domain Functions + analytics/          |
+------------------------------------------------------+
                        |
                        v
+------------------------------------------------------+
|                packages/shared                        |
|       Branded Types, Result, Value Objects             |
+------------------------------------------------------+
```

### Dependency Rule

Each layer may only depend on layers below it:

- `shared` -- no internal dependencies (leaf package)
- `domain` -- depends on `shared`
- `application` -- depends on `domain` and `shared`
- `infrastructure` -- depends on `application`, `domain`, and `shared`
- `state-machines` -- depends on `domain` and `shared`
- `ui` -- depends on `shared` (for types)
- `apps/web` -- depends on all packages

## Functional Core / Imperative Shell

The domain and application layers form the **functional core**. All domain functions are pure: they take input, return `Result<T>`, and have no side effects.

The domain layer includes an `analytics/` subfolder containing pure metric computation functions: `computePortfolioMetrics` (asset counts by status, type, and jurisdiction) and `computeDeadlineMetrics` (overdue, upcoming, and completed rates). The `filterAssets` function is another pure domain function that applies an `AssetFilter` to a list of assets without side effects.

### Functional Core Example

```typescript
// packages/domain/src/asset.ts -- pure function, no I/O
export function createAsset(input: CreateAssetInput): Result<IPAsset> {
  if (!input.title.trim()) return err("Asset title cannot be empty");
  // ... validation ...
  return ok({ ...fields, status: "draft", createdAt: now, updatedAt: now });
}
```

### Imperative Shell Example

```typescript
// packages/application/src/use-cases/asset.ts -- orchestrates I/O
export function createAssetUseCase(repo: AssetRepository) {
  return async (input: CreateAssetInput): Promise<Result<IPAsset>> => {
    const result = createAsset(input);    // pure domain call
    if (!result.ok) return result;
    await repo.save(result.value);        // side effect at the boundary
    return result;
  };
}
```

Use cases receive repository interfaces (ports) via function arguments -- a form of dependency injection without classes.

## Package Dependency Diagram

```
apps/web
  +-- @ipms/ui
  +-- @ipms/state-machines
  +-- @ipms/infrastructure
  +-- @ipms/application
  +-- @ipms/domain
  +-- @ipms/shared
  +-- @ipms/design-system

@ipms/infrastructure --> @ipms/application --> @ipms/domain --> @ipms/shared
@ipms/state-machines --> @ipms/domain --> @ipms/shared
@ipms/ui --> @ipms/shared
@ipms/design-system (standalone CSS, no TS deps)
```

## Data Flow

A request flows through these layers:

```
Browser
  |  HTTP request
  v
SvelteKit API Route (+server.ts)          -- Imperative Shell
  |  Parse request, validate IDs
  v
Use Case function (application)           -- Orchestration
  |  Call domain function
  v
Domain function (domain)                  -- Functional Core (pure)
  |  Return Result<T>
  v
Use Case (continued)
  |  If ok, persist via repository port
  v
Repository implementation (infrastructure) -- Imperative Shell
  |  In-memory Map (currently)
  v
Use Case returns Result<T>
  |
  v
API Route serializes to JSON response
  |
  v
Browser
```

## State Machines

XState 5 machines model complex, multi-step workflows that go beyond simple status fields:

| Machine | Purpose | States |
|---------|---------|--------|
| `assetLifecycleMachine` | IP asset status transitions with guard validation | draft, filed, published, granted, expired, abandoned |
| `filingWorkflowMachine` | Filing review/approval process | draft, review, approved, rejected, submitted |
| `documentApprovalMachine` | Document review workflow | uploaded, under_review, approved, rejected |

State machines reference domain validation functions as guards, ensuring the machine and domain logic stay in sync. For example, `assetLifecycleMachine` uses `validateStatusTransition` from the domain layer as its guard conditions.

## Design System and Atomic Design

### Design System (`packages/design-system`)

CSS custom properties (design tokens) for colors, spacing, typography, borders, and shadows. Consumed by the UI package and the SvelteKit app via Tailwind 4.

### Atomic Design (`packages/ui`)

Svelte 5 components organized by complexity:

| Level | Components | Description |
|-------|-----------|-------------|
| **Atoms** | Button, Input, Card, Badge | Primitive UI elements |
| **Molecules** | AssetCard, FormField, StatusBadge | Composed atoms with domain meaning |
| **Organisms** | AssetList | Full feature sections |

## Persistent Storage (PostgreSQL)

The infrastructure package includes a PostgreSQL layer alongside the original in-memory repositories.

- **Drizzle ORM** defines the database schema in TypeScript (`packages/infrastructure/src/postgres/schema.ts`), keeping column types aligned with domain branded types.
- **Connection** is managed via a `DATABASE_URL` environment variable. When set, the app creates a Drizzle client and wires PostgreSQL repository implementations; when absent, the in-memory repositories are used instead.
- **Migrations** are generated and applied with Drizzle Kit (`drizzle-kit generate` / `drizzle-kit migrate`).
- **Docker Compose** (`docker-compose.yml`) provides a local PostgreSQL instance for development. Running `pnpm dev` starts both the database and the SvelteKit dev server.

This approach preserves the ports-and-adapters boundary: use cases depend on repository interfaces defined in the application layer, and the concrete implementation (in-memory or PostgreSQL) is selected at startup.
