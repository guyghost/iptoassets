# IPMS Bootstrap Design

**Date:** 2026-03-09
**Status:** Approved

## Overview

IPMS (Intellectual Property Management System) is a modern platform for managing intellectual property portfolios. Target users: companies, legal departments, patent attorneys, innovation teams. The system manages patents, trademarks, copyright, and design rights.

## Architecture

pnpm monorepo with unbundled TypeScript workspace packages following Clean Architecture with Functional Core / Imperative Shell.

```
                    +-----------------------------+
                    |       apps/web (SvelteKit)   |
                    |   UI + API Routes + Shell     |
                    +-------------+---------------+
                                  | imports
              +-------------------+-------------------+
              v                   v                    v
     +----------------+ +----------------+ +----------------+
     |  packages/ui   | | packages/      | | packages/      |
     |  (Svelte       | | state-         | | infra-         |
     |  components)   | | machines       | | structure      |
     +-------+--------+ +-------+--------+ +-------+--------+
             |                  |                    |
             v                  v                    v
     +----------------+ +----------------+           |
     | packages/      | | packages/      |<----------+
     | design-system  | | application    |
     +----------------+ +-------+--------+
                                |
                                v
                       +----------------+
                       |  packages/     |
                       |  domain        |  <-- Pure functional core
                       +-------+--------+
                                |
                                v
                       +----------------+
                       |  packages/     |
                       |  shared        |  <-- Types, utils, constants
                       +----------------+
```

Dependency rule: arrows only point downward. Domain depends on nothing (except shared). Application depends on domain. Infrastructure implements application ports. UI and state-machines depend on application. The app wires everything together.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Backend | SvelteKit API routes | Single framework, ports/adapters allow extraction later |
| Persistence | In-memory repositories | Architecture-first; swap via adapter interface |
| Components | Fully custom Atomic Design | Own every layer, demonstrate engineering quality |
| Internal packages | Unbundled .ts imports | Zero build step, Vite resolves natively |
| State management | XState 5 actors | Framework-agnostic workflow machines |
| Styling | TailwindCSS 4 | Utility-first, design tokens via CSS variables |

## Domain Model

### Bounded Contexts

1. **Assets** (core) — IP asset lifecycle management
2. **Deadlines** — Due date tracking and reminders
3. **Documents** — File management and approval workflows
4. **Portfolio** — Grouping and organizing assets
5. **Analytics** — Read models and portfolio insights (Phase 2)

### Entities

**IPAsset**
- id: AssetId (branded string)
- title: string
- type: IPType (patent | trademark | copyright | design-right)
- jurisdiction: Jurisdiction (value object)
- status: AssetStatus (draft | filed | published | granted | expired | abandoned)
- filingDate: Date | null
- expirationDate: Date | null
- owner: string
- organizationId: OrganizationId
- createdAt: Date
- updatedAt: Date

**Deadline**
- id: DeadlineId
- assetId: AssetId
- type: DeadlineType (renewal | response | filing | review | custom)
- title: string
- dueDate: Date
- completed: boolean
- organizationId: OrganizationId

**Document**
- id: DocumentId
- assetId: AssetId
- name: string
- type: DocumentType (filing | correspondence | certificate | evidence | other)
- url: string
- uploadedAt: Date
- status: DocumentStatus (uploaded | under-review | approved | rejected)
- organizationId: OrganizationId

**Portfolio**
- id: PortfolioId
- name: string
- description: string
- assetIds: AssetId[]
- owner: string
- organizationId: OrganizationId

### Value Objects

| Value Object | Shape | Validation |
|---|---|---|
| AssetId | Branded string | Non-empty, UUID format |
| IPType | Union literal | patent, trademark, copyright, design-right |
| Jurisdiction | { code, name } | ISO 3166-1 alpha-2 |
| AssetStatus | Union literal | 6 valid states |
| DeadlineType | Union literal | 5 valid types |
| DocumentType | Union literal | 5 valid types |
| DocumentStatus | Union literal | 4 valid states |
| OrganizationId | Branded string | Non-empty, UUID format |

### Functional Core Pattern

All domain logic is pure functions returning Result<T, E> discriminated unions. No thrown exceptions in the functional core.

- Domain: pure functions (createAsset, updateAssetStatus, validateStatusTransition)
- Application: use cases orchestrate via ports (createAssetUseCase(repo) => (input) => Promise<Result>)
- Port interfaces defined in application layer (AssetRepository, DeadlineRepository, etc.)
- Infrastructure: implements ports (InMemoryAssetRepository, etc.)

## State Machines (XState 5)

### Asset Lifecycle
States: draft, filed, published, granted, expired, abandoned
Events: FILE, PUBLISH, GRANT, EXPIRE, ABANDON
Guards: validateStatusTransition (pure domain function)

### Filing Workflow
States: draft, review, approved, submitted, rejected
Events: SUBMIT_FOR_REVIEW, APPROVE, REJECT, SUBMIT_FILING
Context: { assetId, reviewerId, comments }

### Document Approval
States: uploaded, under_review, approved, rejected
Events: START_REVIEW, APPROVE, REJECT
Context: { documentId, reviewerId }

## UI System

Atomic Design in packages/ui (atoms, molecules, organisms, templates).
Design tokens in packages/design-system (colors, spacing, typography as CSS custom properties).
Feature modules in apps/web/src/features (assets, deadlines, documents, portfolio, analytics).
SvelteKit file-based routing for pages.

## API Routes (SvelteKit)

- /api/assets — GET (list), POST (create)
- /api/assets/[id] — GET, PUT, DELETE
- /api/assets/[id]/deadlines — GET, POST
- /api/portfolios — GET, POST
- /api/portfolios/[id] — GET, PUT, DELETE
- /api/documents — GET, POST
- /api/documents/[id] — GET, PUT, DELETE

Thin handlers: deserialize input, call use case, serialize output.

## Multi-Tenant Foundation

All entities carry organizationId. Repository methods filter by organization.
Prepared types: Organization, User, Role (admin | legal | viewer).
Full RBAC enforcement is Phase 3.

## Testing Strategy

| Layer | Tool | What |
|---|---|---|
| Domain | Vitest | Pure function unit tests |
| Application | Vitest | Use case tests with in-memory repos |
| State machines | Vitest + @xstate/test | Model-based testing |
| UI atoms | Vitest + @testing-library/svelte | Component tests |
| E2E | Playwright | Critical user flows |

## Documentation

- docs/prd.md, architecture.md, domain-model.md, contributing.md, roadmap.md
- 7 ADRs (clean-architecture, fc-is, xstate, atomic-design, svelte5, pnpm-monorepo, in-memory-repos)
- OSS governance: README, LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, CHANGELOG

## Roadmap

| Phase | Scope |
|---|---|
| 1 — Foundation | Asset CRUD, deadlines, documents, basic UI |
| 2 — Portfolio | Portfolio management, analytics, advanced workflows |
| 3 — SaaS | Auth, RBAC, multi-tenant enforcement |
| 4 — Intelligence | AI patent analysis, similarity detection |
