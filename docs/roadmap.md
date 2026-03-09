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

- [ ] Portfolio dashboard with asset counts by status, type, and jurisdiction
- [ ] Deadline compliance tracking (overdue, upcoming, completed rates)
- [ ] Asset timeline view (status change history)
- [ ] Bulk asset operations (status update, portfolio assignment)
- [ ] Advanced filtering and search across assets
- [ ] Export to CSV/PDF
- [ ] Persistent storage (PostgreSQL via repository port swap)
- [ ] Database migrations

## Phase 3: SaaS

Multi-user, multi-tenant platform.

- [ ] Authentication (OAuth 2.0 / OIDC)
- [ ] User management and profiles
- [ ] Role-based access control (Admin, Manager, Attorney, Viewer)
- [ ] Organization/tenant management
- [ ] Per-tenant data isolation at the database level
- [ ] Audit logging (who changed what, when)
- [ ] Email notifications for deadlines and review requests
- [ ] In-app notification center

## Phase 4: AI Intelligence

AI-powered features for IP professionals.

- [ ] Automated prior art search
- [ ] Patent claim analysis and strength scoring
- [ ] Patentability assessment from invention disclosures
- [ ] Deadline risk prediction (likelihood of missing based on workload)
- [ ] Document classification and auto-tagging
- [ ] Natural language search across portfolio
- [ ] Integration with patent office APIs (USPTO, EPO, WIPO)
