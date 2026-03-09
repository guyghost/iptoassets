# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-03-09

### Added

- pnpm monorepo with 7 workspace packages + SvelteKit app
- **@ipms/shared**: branded types (AssetId, etc.), Result<T,E>, value objects, UUID validation
- **@ipms/domain**: pure functional entities and business logic for assets, deadlines, documents, portfolios
- **@ipms/application**: 15 use cases with port interfaces (repository pattern)
- **@ipms/infrastructure**: in-memory repository implementations
- **@ipms/state-machines**: XState 5 actors (asset lifecycle, filing workflow, document approval)
- **@ipms/design-system**: CSS custom property design tokens
- **@ipms/ui**: Svelte 5 Atomic Design components (atoms, molecules, organisms, templates)
- **@ipms/web**: SvelteKit app with Tailwind CSS 4
  - Deel-inspired dashboard layout with navigation, search, stats
  - REST API routes for assets, deadlines, documents, portfolios
  - Feature pages: assets (list + detail), portfolios (list + detail), deadlines, documents
  - Feature modules with extracted data and helpers
- 59 Vitest tests across domain, application, infrastructure, and state machines
- ESLint 9 + Prettier configuration
- Playwright e2e test setup
- Documentation: PRD, architecture, domain model, roadmap, 7 ADRs
- OSS governance: README, LICENSE (MIT), CONTRIBUTING, CHANGELOG
