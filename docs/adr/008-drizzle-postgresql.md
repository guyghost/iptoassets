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
