# ADR-001: Clean Architecture

## Status

Accepted

## Context

IPMS manages intellectual property assets with complex lifecycle rules, multiple workflow types, and future requirements for persistent storage, multi-tenancy, and external integrations. We need an architecture that isolates business logic from infrastructure concerns and supports swapping implementations without rewriting core code.

## Decision

Adopt Clean Architecture with concentric dependency layers:

1. **shared** -- Branded types, Result type, value objects (innermost, no dependencies)
2. **domain** -- Pure entity definitions and domain functions
3. **application** -- Use cases and port interfaces (repository contracts)
4. **infrastructure** -- Concrete implementations of ports
5. **apps/web** -- UI and API routes (outermost)

Dependencies point strictly inward. The domain never imports from application or infrastructure.

## Consequences

**Positive:**
- Domain logic is fully testable without any infrastructure
- Repository implementations can be swapped (in-memory to PostgreSQL) by implementing the port interface
- Clear separation of concerns makes the codebase navigable
- Each layer can evolve independently

**Negative:**
- More packages and files than a flat structure
- Indirection through port interfaces adds boilerplate
- New contributors must understand the layer boundaries before making changes
