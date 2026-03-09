# ADR-004: Atomic Design for UI Components

## Status

Accepted

## Context

The UI needs a consistent component library that scales from simple buttons to complex asset management views. Without a structural methodology, component organization tends to become flat and inconsistent.

## Decision

Adopt Atomic Design for the `packages/ui` component library:

- **Atoms** (`atoms/`): Fundamental building blocks -- Button, Input, Card, Badge. No domain knowledge. Styled with design system tokens.
- **Molecules** (`molecules/`): Compositions of atoms with domain meaning -- AssetCard, FormField, StatusBadge. Accept domain-typed props.
- **Organisms** (`organisms/`): Complete feature sections -- AssetList. Compose molecules into functional UI regions.

Page-level composition happens in `apps/web` route components, which assemble organisms into full views.

## Consequences

**Positive:**
- Clear hierarchy makes it obvious where a new component belongs
- Atoms are highly reusable across different domain contexts
- Molecules encapsulate domain-specific presentation logic
- Consistent structure aids onboarding

**Negative:**
- Classification can be subjective (is StatusBadge an atom or molecule?)
- Small components may feel over-abstracted early on
- Templates and pages from Atomic Design are handled by SvelteKit routes rather than the UI package, so the pattern is partially applied
