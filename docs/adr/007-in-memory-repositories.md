# ADR-007: In-Memory Repositories

## Status

Accepted

## Context

The project is in its foundation phase (Phase 1). The domain model, use cases, and API routes need to be developed and validated before committing to a specific database. Adding a real database early would slow down iteration and introduce operational complexity.

## Decision

Implement all repositories as in-memory `Map`-based stores in `packages/infrastructure`:

- `createInMemoryAssetRepository()`
- `createInMemoryDeadlineRepository()`
- `createInMemoryDocumentRepository()`
- `createInMemoryPortfolioRepository()`

Each repository is a factory function returning an object that satisfies the port interface defined in `packages/application/src/ports.ts`. Data is stored in a `Map` keyed by `${orgId}:${entityId}`.

## Consequences

**Positive:**
- Zero external dependencies -- no database to install, configure, or migrate
- Fast test execution -- no I/O latency
- Forces clean port/adapter separation -- the application layer has no idea storage is in-memory
- Validates the repository interface design before committing to a database schema
- Swapping to PostgreSQL (Phase 2) requires only implementing the same port interfaces

**Negative:**
- Data is lost on server restart -- not suitable for production use
- No query capabilities beyond what the interface exposes (no ad-hoc SQL)
- Concurrency behavior differs from a real database (no transactions, no locking)
- In-memory stores can mask performance issues that would appear with real I/O
