# ADR-003: XState 5 for Workflow State Machines

## Status

Accepted

## Context

IP assets go through multi-step workflows: the asset lifecycle (draft through granted/expired), filing review processes, and document approval. These workflows have defined states, valid transitions, and guard conditions. Encoding them as ad-hoc if/else chains is error-prone and hard to visualize.

## Decision

Use XState 5 to model workflows as explicit state machines:

- `assetLifecycleMachine` -- 6 states modeling the full IP asset lifecycle, with guards that delegate to domain `validateStatusTransition`
- `filingWorkflowMachine` -- 5 states for the filing review/approval/submission process
- `documentApprovalMachine` -- 4 states for document review

Machines live in `packages/state-machines` and import domain validation functions as guards, keeping the domain as the single source of truth for transition rules.

## Consequences

**Positive:**
- Workflows are declarative and visualizable (XState has tooling for this)
- Invalid transitions are structurally impossible -- the machine rejects them
- Guards connect to domain logic, so the machine and domain stay in sync
- Adding new states or transitions is explicit and auditable

**Negative:**
- XState is an additional dependency with its own learning curve
- Some duplication between the domain transition map and the machine definition (both encode valid transitions)
- State machines add complexity for simple status fields that could be a plain enum check
