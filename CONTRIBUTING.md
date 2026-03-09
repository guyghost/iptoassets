# Contributing to IPMS

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/melvin-corp/iptoassets.git
cd iptoassets
pnpm install
pnpm dev          # Start dev server
pnpm test         # Run tests
pnpm check        # Full verification (lint + typecheck + test)
```

## Project Structure

| Package | Purpose |
|---------|---------|
| `packages/shared` | Branded types, Result\<T,E\>, value objects |
| `packages/domain` | Pure entities + business logic (no side effects) |
| `packages/application` | Use cases + port interfaces |
| `packages/infrastructure` | Repository implementations |
| `packages/state-machines` | XState 5 workflow actors |
| `packages/design-system` | CSS design tokens |
| `packages/ui` | Svelte 5 Atomic Design components |
| `apps/web` | SvelteKit application |

## Architecture Rules

1. **Dependency direction** - Dependencies only point downward: UI -> Application -> Domain -> Shared
2. **Pure domain** - No side effects, no I/O, no framework imports in `packages/domain`
3. **Ports and adapters** - Application defines interfaces (ports), infrastructure implements them
4. **Result types** - Domain functions return `Result<T, E>`, never throw exceptions

## Coding Standards

- **TypeScript** - Strict mode, no `any` types
- **Pure functions** - Business logic must be pure and testable
- **Conventional Commits** - Use `feat:`, `fix:`, `chore:`, `docs:` prefixes
- **Tests required** - New domain/application logic must include unit tests

## How to Contribute

### Reporting Issues

- Search existing issues before creating a new one
- Include reproduction steps, expected behavior, and actual behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch from `main`: `git checkout -b feat/my-feature`
3. Make your changes following the coding standards
4. Run `pnpm check` to verify everything passes
5. Commit using Conventional Commits
6. Open a PR against `main`

### PR Checklist

- [ ] Tests pass (`pnpm test`)
- [ ] Linting passes (`pnpm lint`)
- [ ] Types check (`pnpm typecheck`)
- [ ] Follows architecture rules (no upward dependencies)
- [ ] New domain logic includes tests
- [ ] Commit messages follow Conventional Commits
