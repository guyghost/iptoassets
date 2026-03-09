# IPMS -- Contributing Guide

## Prerequisites

- Node.js >= 20
- pnpm >= 9

## Setup

```bash
git clone <repo-url>
cd iptoassets
pnpm install
```

## Running

```bash
# Development server (SvelteKit)
pnpm dev

# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Format code
pnpm format

# Check formatting
pnpm lint
```

## Package Overview

| Package | Path | Description | Key Dependencies |
|---------|------|-------------|-----------------|
| `@ipms/shared` | `packages/shared` | Branded types (`AssetId`, etc.), `Result<T>`, value objects, validation | None |
| `@ipms/domain` | `packages/domain` | Pure entity interfaces, domain functions (`createAsset`, `validateStatusTransition`, etc.) | `@ipms/shared` |
| `@ipms/application` | `packages/application` | Use case functions, port interfaces (repository contracts) | `@ipms/domain`, `@ipms/shared` |
| `@ipms/infrastructure` | `packages/infrastructure` | In-memory repository implementations | `@ipms/application`, `@ipms/domain`, `@ipms/shared` |
| `@ipms/state-machines` | `packages/state-machines` | XState 5 machines for asset lifecycle, filing workflow, document approval | `@ipms/domain`, `@ipms/shared` |
| `@ipms/design-system` | `packages/design-system` | CSS custom property tokens (colors, spacing, typography) | None |
| `@ipms/ui` | `packages/ui` | Svelte 5 components (Atomic Design: atoms, molecules, organisms) | `@ipms/shared` |
| `@ipms/web` | `apps/web` | SvelteKit app with Tailwind 4, API routes, page components | All packages |

## Testing

Tests use Vitest and live alongside source files (`*.test.ts`). The workspace root `vitest.config.ts` handles all packages.

```bash
# All tests
pnpm test

# Specific package (from root)
pnpm vitest run packages/domain

# Single file
pnpm vitest run packages/domain/src/asset.test.ts
```

## Architecture Rules for Contributors

### 1. Dependency direction is strictly inward

`shared` <- `domain` <- `application` <- `infrastructure` / `state-machines` / `ui` / `apps/web`

Never import from an outer layer. The domain must not import from application or infrastructure. Application must not import from infrastructure.

### 2. Domain functions are pure

Functions in `packages/domain` must:
- Take explicit inputs and return `Result<T>`
- Have no side effects (no I/O, no Date.now() except in factory functions, no randomness)
- Not depend on any repository or external service

### 3. Use cases orchestrate, domain functions decide

Use cases in `packages/application` wire together domain logic and persistence. They receive repository ports as arguments (function-based DI). Domain functions handle validation and business rules.

### 4. Repositories are interfaces (ports)

`packages/application/src/ports.ts` defines repository interfaces. `packages/infrastructure` provides concrete implementations. To swap storage, implement the port interface -- application and domain code remains unchanged.

### 5. All entities are immutable

Entity interfaces use `readonly` fields. Mutations produce new objects via spread syntax. Never mutate an entity in place.

### 6. IDs are branded types

Use the branded types from `@ipms/shared` (`AssetId`, `DeadlineId`, etc.). Parse raw strings through the validation functions (`parseAssetId`, etc.) before use.

### 7. Errors are values, not exceptions

Use `Result<T, E>` for domain and application errors. Exceptions are reserved for truly exceptional cases (network failures, bugs). Check `.ok` before accessing `.value` or `.error`.

### 8. UI follows Atomic Design

Components go in `packages/ui/src/`:
- `atoms/` -- standalone primitives (Button, Input, Card, Badge)
- `molecules/` -- composed atoms with meaning (AssetCard, FormField, StatusBadge)
- `organisms/` -- full feature sections (AssetList)

### 9. State machines model workflows

Multi-step processes with defined transitions belong in `packages/state-machines`. Machines should reference domain validation functions as guards where applicable.
