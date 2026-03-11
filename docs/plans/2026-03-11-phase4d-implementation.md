# Phase 4d: Deadline Risk Prediction — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add heuristic-based deadline risk scoring — computed on the fly, no AI, no storage.

**Architecture:** Pure domain function computes risk scores from deadline data. One use case wraps it. One API route exposes it. No new ports, repos, or migrations.

**Tech Stack:** Vitest

**Design doc:** `docs/plans/2026-03-11-phase4cd-design.md`

---

### Task 1: Add DeadlineRisk type and computeDeadlineRisks domain function

**Files:**
- Modify: `packages/domain/src/entities.ts`
- Create: `packages/domain/src/deadline-risk.ts`
- Modify: `packages/domain/src/index.ts`
- Create: `packages/domain/src/deadline-risk.test.ts`

**Step 1: Add type to entities.ts**

At the end of `packages/domain/src/entities.ts`, add:

```typescript
export interface DeadlineRisk {
  readonly deadlineId: DeadlineId;
  readonly score: number;
  readonly factors: readonly string[];
}
```

**Step 2: Create the pure domain function**

Create `packages/domain/src/deadline-risk.ts`:

```typescript
import type { Deadline, DeadlineRisk } from "./entities.js";

export function computeDeadlineRisks(deadlines: readonly Deadline[], now: Date = new Date()): readonly DeadlineRisk[] {
  return deadlines.map((d) => computeSingleRisk(d, deadlines, now));
}

function computeSingleRisk(deadline: Deadline, allDeadlines: readonly Deadline[], now: Date): DeadlineRisk {
  if (deadline.completed) {
    return { deadlineId: deadline.id, score: 0, factors: [] };
  }

  const factors: string[] = [];
  let score = 0;

  const msPerDay = 86_400_000;
  const daysUntilDue = (deadline.dueDate.getTime() - now.getTime()) / msPerDay;

  // Overdue
  if (daysUntilDue < 0) {
    score = 10;
    factors.push("Deadline is overdue");
    return { deadlineId: deadline.id, score, factors };
  }

  // Proximity
  if (daysUntilDue <= 7) {
    score = 8;
    factors.push("Due within 7 days");
  } else if (daysUntilDue <= 14) {
    score = 6;
    factors.push("Due within 14 days");
  } else if (daysUntilDue <= 30) {
    score = 4;
    factors.push("Due within 30 days");
  } else if (daysUntilDue <= 60) {
    score = 2;
    factors.push("Due within 60 days");
  } else {
    score = 1;
    factors.push("Due in more than 60 days");
  }

  // Concurrent deadlines (within 7-day window)
  const concurrent = allDeadlines.filter((other) => {
    if (other.id === deadline.id || other.completed) return false;
    const otherDays = (other.dueDate.getTime() - now.getTime()) / msPerDay;
    return Math.abs(otherDays - daysUntilDue) <= 7;
  });

  if (concurrent.length > 0) {
    score = Math.min(10, score + concurrent.length);
    factors.push(`${concurrent.length} concurrent deadline${concurrent.length > 1 ? "s" : ""} within 7-day window`);
  }

  return { deadlineId: deadline.id, score, factors };
}
```

**Step 3: Export from domain index.ts**

In `packages/domain/src/index.ts`, add:

```typescript
export type { DeadlineRisk } from "./entities.js";
export { computeDeadlineRisks } from "./deadline-risk.js";
```

**Step 4: Write tests**

Create `packages/domain/src/deadline-risk.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeDeadlineRisks } from "./deadline-risk.js";
import type { Deadline } from "./entities.js";
import type { AssetId, DeadlineId, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "660e8400-e29b-41d4-a716-446655440000" as AssetId;

function makeDeadline(id: string, dueDate: Date, completed = false): Deadline {
  return {
    id: id as DeadlineId,
    assetId: ASSET_ID,
    type: "renewal",
    title: "Test Deadline",
    dueDate,
    completed,
    organizationId: ORG_ID,
  };
}

const NOW = new Date("2026-03-11T00:00:00Z");

describe("computeDeadlineRisks", () => {
  it("returns score 0 for completed deadlines", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-12"), true)];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(0);
    expect(risks[0].factors).toEqual([]);
  });

  it("returns score 10 for overdue deadlines", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-10"))];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(10);
    expect(risks[0].factors).toContain("Deadline is overdue");
  });

  it("returns score 8 for deadlines due within 7 days", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-15"))];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(8);
    expect(risks[0].factors).toContain("Due within 7 days");
  });

  it("returns score 6 for deadlines due within 14 days", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-22"))];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(6);
  });

  it("returns score 1 for deadlines due in more than 60 days", () => {
    const deadlines = [makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-06-01"))];
    const risks = computeDeadlineRisks(deadlines, NOW);
    expect(risks[0].score).toBe(1);
  });

  it("increases score for concurrent deadlines", () => {
    const deadlines = [
      makeDeadline("aae84000-e29b-41d4-a716-446655440001", new Date("2026-03-15")),
      makeDeadline("aae84000-e29b-41d4-a716-446655440002", new Date("2026-03-16")),
      makeDeadline("aae84000-e29b-41d4-a716-446655440003", new Date("2026-03-17")),
    ];
    const risks = computeDeadlineRisks(deadlines, NOW);
    // Base 8 (within 7 days) + 2 concurrent = 10 (capped)
    expect(risks[0].score).toBe(10);
    expect(risks[0].factors).toContain("2 concurrent deadlines within 7-day window");
  });
});
```

**Step 5: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/domain/
git commit -m "feat(domain): add deadline risk scoring with heuristics"
```

---

### Task 2: Add computeDeadlineRiskUseCase and API route

**Files:**
- Create: `packages/application/src/use-cases/deadline-risk.ts`
- Modify: `packages/application/src/index.ts`
- Create: `packages/infrastructure/src/deadline-risk-use-cases.test.ts`
- Modify: `apps/web/src/lib/server/use-cases.ts`
- Create: `apps/web/src/routes/api/deadline-risks/+server.ts`

**Step 1: Create use case**

Create `packages/application/src/use-cases/deadline-risk.ts`:

```typescript
import type { OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { DeadlineRisk } from "@ipms/domain";
import { computeDeadlineRisks } from "@ipms/domain";
import type { DeadlineRepository } from "../ports.js";

export function computeDeadlineRiskUseCase(deadlineRepo: DeadlineRepository) {
  return async (orgId: OrganizationId): Promise<Result<readonly DeadlineRisk[]>> => {
    const deadlines = await deadlineRepo.findAll(orgId);
    const risks = computeDeadlineRisks(deadlines);
    return ok(risks);
  };
}
```

**Step 2: Export from application index.ts**

In `packages/application/src/index.ts`, add:

```typescript
export { computeDeadlineRiskUseCase } from "./use-cases/deadline-risk.js";
```

**Step 3: Write test**

Create `packages/infrastructure/src/deadline-risk-use-cases.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeDeadlineRiskUseCase } from "@ipms/application";
import { createInMemoryDeadlineRepository } from "./in-memory-deadline-repository.js";
import type { DeadlineId, AssetId, OrganizationId } from "@ipms/shared";
import type { Deadline } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;

describe("computeDeadlineRiskUseCase", () => {
  it("computes risk scores for all deadlines in org", async () => {
    const repo = createInMemoryDeadlineRepository();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const deadline: Deadline = {
      id: "aae84000-e29b-41d4-a716-446655440001" as DeadlineId,
      assetId: "bbe84000-e29b-41d4-a716-446655440001" as AssetId,
      type: "renewal",
      title: "Patent Renewal",
      dueDate: tomorrow,
      completed: false,
      organizationId: ORG_ID,
    };
    await repo.save(deadline);

    const compute = computeDeadlineRiskUseCase(repo);
    const result = await compute(ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].score).toBeGreaterThan(0);
    }
  });
});
```

**Step 4: Wire use case and create API route**

In `apps/web/src/lib/server/use-cases.ts`, add import:

```typescript
computeDeadlineRiskUseCase,
```

Add wiring:

```typescript
export const computeDeadlineRisk = computeDeadlineRiskUseCase(deadlineRepo);
```

Create `apps/web/src/routes/api/deadline-risks/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { computeDeadlineRisk } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const result = await computeDeadlineRisk(auth.value.organizationId);
  return resultToResponse(result);
};
```

**Step 5: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/application/ packages/infrastructure/ apps/web/
git commit -m "feat: add deadline risk use case and API route"
```

---

### Task 3: Update roadmap

**Files:**
- Modify: `docs/roadmap.md`

**Step 1: Mark item complete**

In `docs/roadmap.md`, change:

```markdown
- [x] Deadline risk prediction (likelihood of missing based on workload)
```

**Step 2: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: mark Phase 4d deadline risk complete in roadmap"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | DeadlineRisk type + pure domain function + 6 tests | `packages/domain/src/deadline-risk.ts` |
| 2 | Use case + API route + 1 test | `packages/application/`, `apps/web/` |
| 3 | Roadmap update | `docs/roadmap.md` |
