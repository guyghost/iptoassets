# ADR-002: Functional Core / Imperative Shell

## Status

Accepted

## Context

IP asset management involves validation rules (status transitions, required fields, uniqueness constraints) and side effects (persistence, notifications). Mixing these makes functions hard to test and reason about.

## Decision

Adopt the Functional Core / Imperative Shell (FC/IS) pattern:

- **Functional Core** (`domain` package): Pure functions that take inputs and return `Result<T>`. No I/O, no mutations, no dependencies on external services.
- **Imperative Shell** (`application` use cases, `infrastructure` repos, API routes): Orchestrates I/O and calls into the functional core.

Domain functions like `createAsset`, `validateStatusTransition`, and `updateDocumentStatus` are pure. Use cases handle the async persistence layer.

Error handling uses the `Result<T, E>` discriminated union instead of thrown exceptions, making error paths explicit and composable.

## Consequences

**Positive:**
- Domain functions are trivially testable (no mocks needed)
- Business rules are explicit and inspectable -- just input/output
- Result type forces callers to handle errors, preventing silent failures
- Clear boundary between "what to decide" and "what to do"

**Negative:**
- Requires discipline to keep domain functions pure (no sneaking in side effects)
- Result type adds unwrapping boilerplate at call sites
- Some operations that feel natural as mutations (e.g., "complete this deadline") become "create a new deadline object with completed=true"
