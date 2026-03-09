# IPMS - Intellectual Property Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests](https://img.shields.io/badge/tests-59%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)]()

A modern, open-source platform for managing intellectual property portfolios. Built for companies, legal departments, patent attorneys, and innovation teams.

## Features

- **Asset Management** - Track patents, trademarks, copyrights, and design rights through their full lifecycle
- **Deadline Tracking** - Never miss a renewal, filing, or response deadline
- **Document Management** - Store and manage filings, certificates, correspondence with approval workflows
- **Portfolio Analytics** - Group assets into portfolios and analyze portfolio health
- **Workflow Automation** - XState-powered state machines for asset lifecycle, filing, and document approval

## Quick Start

**Prerequisites:** Node.js 20+, pnpm 9+

```bash
git clone https://github.com/melvin-corp/iptoassets.git
cd iptoassets
pnpm install
pnpm dev        # Start development server at http://localhost:5173
pnpm test       # Run test suite (59 tests)
pnpm check      # Run lint + typecheck + tests
```

## Architecture

IPMS follows **Clean Architecture** with **Functional Core / Imperative Shell** in a pnpm monorepo.

```
apps/web (SvelteKit)          <- Imperative Shell (UI + API routes)
  |
  +-- packages/ui             <- Svelte 5 Atomic Design components
  +-- packages/state-machines <- XState 5 workflow actors
  +-- packages/application    <- Use cases + port interfaces
  +-- packages/infrastructure <- Repository implementations
  |     |
  |     v
  +-- packages/domain         <- Pure functional core (entities, rules)
        |
        v
      packages/shared         <- Branded types, Result<T,E>, value objects
```

**Dependency rule:** arrows only point downward. Domain depends on nothing. Application defines ports. Infrastructure implements them.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Svelte 5, SvelteKit |
| Styling | TailwindCSS 4, CSS custom properties |
| State | XState 5 actors |
| Language | TypeScript (strict) |
| Testing | Vitest, Playwright |
| Tooling | pnpm, ESLint 9, Prettier |

## Project Structure

```
iptoassets/
  apps/
    web/                    # SvelteKit application
      src/
        features/           # Feature modules (assets, deadlines, etc.)
        routes/             # SvelteKit pages + API routes
        lib/server/         # Server-side DI wiring
  packages/
    shared/                 # Branded types, Result, value objects
    domain/                 # Pure entities + business logic
    application/            # Use cases + port interfaces
    infrastructure/         # In-memory repository implementations
    state-machines/         # XState 5 workflow machines
    design-system/          # CSS design tokens
    ui/                     # Svelte 5 Atomic Design components
  docs/
    adr/                    # Architecture Decision Records
    plans/                  # Design plans
  scripts/                  # Build & check utilities
```

## Documentation

- [Product Requirements](docs/prd.md)
- [Architecture](docs/architecture.md)
- [Domain Model](docs/domain-model.md)
- [Roadmap](docs/roadmap.md)
- [Contributing](CONTRIBUTING.md)

## Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) before submitting a PR.

## License

[MIT](LICENSE) - Melvin Corp, 2026
