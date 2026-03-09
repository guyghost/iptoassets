# ADR-005: Svelte 5 and SvelteKit

## Status

Accepted

## Context

The application needs a modern web framework for both the UI and server-side API routes. Key requirements: strong TypeScript support, server-side rendering capability, file-based routing, and a component model that works well with a monorepo component library.

## Decision

Use Svelte 5 for components and SvelteKit as the full-stack framework:

- **Svelte 5** provides runes-based reactivity, better TypeScript support, and improved component composition
- **SvelteKit** provides file-based routing, API route handlers (`+server.ts`), and SSR
- **Tailwind CSS 4** via `@tailwindcss/vite` for utility-first styling alongside design system tokens
- API routes in `apps/web/src/routes/api/` serve as the imperative shell, calling use cases and returning JSON

## Consequences

**Positive:**
- Svelte 5 runes offer fine-grained reactivity without virtual DOM overhead
- SvelteKit API routes eliminate the need for a separate backend server
- File-based routing keeps the route structure visible in the filesystem
- Tailwind 4 integrates well with CSS custom property tokens from the design system

**Negative:**
- Svelte 5 is newer, with a smaller ecosystem than React or Vue
- Runes syntax is a departure from Svelte 4, reducing the pool of existing examples
- SvelteKit API routes couple the backend to the frontend deployment
