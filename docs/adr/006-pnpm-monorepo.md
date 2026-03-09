# ADR-006: pnpm Monorepo

## Status

Accepted

## Context

The architecture calls for multiple packages (shared, domain, application, infrastructure, state-machines, design-system, ui) plus the web application. These packages have explicit dependency relationships and must be developed and tested together.

## Decision

Use a pnpm workspace monorepo with the following structure:

```
packages/
  shared/
  domain/
  application/
  infrastructure/
  state-machines/
  design-system/
  ui/
apps/
  web/
```

Packages reference each other via `workspace:*` protocol in `package.json`. A root `vitest.config.ts` runs tests across all packages. A root `tsconfig.json` provides shared TypeScript configuration.

## Consequences

**Positive:**
- Single repository for all code -- atomic commits across packages
- `workspace:*` protocol ensures packages always use the local version
- Shared tooling configuration (Vitest, TypeScript, Prettier) from the root
- pnpm's content-addressable store is fast and disk-efficient
- Dependency relationships between packages are explicit and enforced

**Negative:**
- All packages share the same CI pipeline (a change in `shared` triggers tests for everything)
- pnpm workspace protocol requires pnpm -- contributors cannot use npm or yarn
- Root-level config can become complex as the number of packages grows
