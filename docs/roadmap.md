# IPMS -- Roadmap

## Phase 1: Foundation (Current)

Core domain model and basic application infrastructure.

- [x] Clean Architecture monorepo structure (shared, domain, application, infrastructure)
- [x] Branded types and Result pattern
- [x] Asset CRUD with lifecycle status transitions
- [x] Deadline creation and completion
- [x] Document management with approval workflow
- [x] Portfolio creation and asset grouping
- [x] XState 5 state machines (asset lifecycle, filing workflow, document approval)
- [x] In-memory repository implementations
- [x] SvelteKit API routes for all entities
- [x] Design system tokens (CSS custom properties)
- [x] Svelte 5 UI component library (Atomic Design)
- [x] Basic page views (assets, deadlines, documents, portfolios)
- [x] 59 passing Vitest tests

## Phase 2: Portfolio and Analytics

Richer portfolio features and operational visibility.

- [x] Portfolio dashboard with asset counts by status, type, and jurisdiction
- [x] Deadline compliance tracking (overdue, upcoming, completed rates)
- [x] Asset timeline view (status change history)
- [x] Bulk asset operations (status update, portfolio assignment)
- [x] Advanced filtering and search across assets
- [x] Export to CSV/PDF
- [x] Persistent storage (PostgreSQL via repository port swap)
- [x] Database migrations

## Phase 3: SaaS

Multi-user, multi-tenant platform.

- [x] Authentication (OAuth 2.0 / OIDC)
- [x] User management and profiles
- [x] Role-based access control (Admin, Manager, Attorney, Viewer)
- [x] Organization/tenant management
- [x] Per-tenant data isolation at the database level
- [x] Audit logging (who changed what, when)
- [x] Email notifications for deadlines and review requests
- [x] In-app notification center

## Phase 4: AI Intelligence

AI-powered features for IP professionals.

- [ ] Automated prior art search
- [ ] Patent claim analysis and strength scoring
- [ ] Patentability assessment from invention disclosures
- [ ] Deadline risk prediction (likelihood of missing based on workload)
- [ ] Document classification and auto-tagging
- [ ] Natural language search across portfolio
- [ ] Integration with patent office APIs (USPTO, EPO, WIPO)
