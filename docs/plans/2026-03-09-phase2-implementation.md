# Phase 2: Portfolio Analytics & Advanced Filtering — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add portfolio analytics, deadline metrics, asset timeline tracking, and advanced filtering to IPMS.

**Architecture:** Pure analytics functions in the domain layer compute metrics from entity arrays. A new `StatusChangeEvent` entity tracks asset status history. Client-side filtering via a typed `AssetFilter` object. All new logic follows FC/IS — pure functions tested in isolation, use cases orchestrate I/O.

**Tech Stack:** TypeScript, Vitest, Svelte 5, SvelteKit, XState 5, TailwindCSS 4, pnpm monorepo.

---

### Task 1: Add StatusChangeEventId branded type to shared

**Files:**
- Modify: `packages/shared/src/brand.ts:9` (add new type after PortfolioId)
- Modify: `packages/shared/src/validation.ts:36-41` (add parser)
- Modify: `packages/shared/src/index.ts` (add exports)

**Step 1: Add the branded type**

In `packages/shared/src/brand.ts`, add after line 9:

```typescript
export type StatusChangeEventId = Brand<string, "StatusChangeEventId">;
```

**Step 2: Add the parser**

In `packages/shared/src/validation.ts`, add after `parseOrganizationId`:

```typescript
export function parseStatusChangeEventId(input: string): Result<StatusChangeEventId> {
  return UUID_RE.test(input)
    ? ok(input as StatusChangeEventId)
    : err("Invalid StatusChangeEventId: must be UUID format");
}
```

Import `StatusChangeEventId` from `./brand.js` at the top.

**Step 3: Export from index**

In `packages/shared/src/index.ts`:
- Add `StatusChangeEventId` to the type export from `./brand.js`
- Add `parseStatusChangeEventId` to the export from `./validation.js`

**Step 4: Run tests**

Run: `pnpm vitest run packages/shared`
Expected: All existing tests pass (7 tests).

**Step 5: Commit**

```bash
git add packages/shared/src/brand.ts packages/shared/src/validation.ts packages/shared/src/index.ts
git commit -m "feat(shared): add StatusChangeEventId branded type and parser"
```

---

### Task 2: Add StatusChangeEvent entity and create function

**Files:**
- Create: `packages/domain/src/status-change-event.ts`
- Create: `packages/domain/src/status-change-event.test.ts`
- Modify: `packages/domain/src/entities.ts` (add interface)
- Modify: `packages/domain/src/index.ts` (add exports)

**Step 1: Add the entity interface**

In `packages/domain/src/entities.ts`, add the import of `StatusChangeEventId` and the interface after `Portfolio`:

```typescript
import type {
  AssetId,
  DeadlineId,
  DocumentId,
  PortfolioId,
  OrganizationId,
  IPType,
  AssetStatus,
  DeadlineType,
  DocumentType,
  DocumentStatus,
  StatusChangeEventId,
} from "@ipms/shared";

// ... existing interfaces ...

export interface StatusChangeEvent {
  readonly id: StatusChangeEventId;
  readonly assetId: AssetId;
  readonly fromStatus: AssetStatus | null;
  readonly toStatus: AssetStatus;
  readonly changedAt: Date;
  readonly changedBy: string;
  readonly organizationId: OrganizationId;
}
```

**Step 2: Write the failing test**

Create `packages/domain/src/status-change-event.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createStatusChangeEvent } from "./status-change-event.js";
import type { CreateStatusChangeEventInput } from "./status-change-event.js";
import type { AssetId, OrganizationId, StatusChangeEventId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "660e8400-e29b-41d4-a716-446655440000" as AssetId;
const EVENT_ID = "770e8400-e29b-41d4-a716-446655440000" as StatusChangeEventId;

const validInput: CreateStatusChangeEventInput = {
  id: EVENT_ID,
  assetId: ASSET_ID,
  fromStatus: "draft",
  toStatus: "filed",
  changedBy: "Alex Chen",
  organizationId: ORG_ID,
};

describe("createStatusChangeEvent", () => {
  it("creates an event with valid input", () => {
    const result = createStatusChangeEvent(validInput);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.assetId).toBe(ASSET_ID);
      expect(result.value.fromStatus).toBe("draft");
      expect(result.value.toStatus).toBe("filed");
      expect(result.value.changedBy).toBe("Alex Chen");
      expect(result.value.changedAt).toBeInstanceOf(Date);
    }
  });

  it("allows null fromStatus for initial creation", () => {
    const result = createStatusChangeEvent({ ...validInput, fromStatus: null });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.fromStatus).toBeNull();
      expect(result.value.toStatus).toBe("filed");
    }
  });

  it("rejects empty changedBy", () => {
    const result = createStatusChangeEvent({ ...validInput, changedBy: "  " });
    expect(result).toEqual({ ok: false, error: "changedBy cannot be empty" });
  });
});
```

**Step 3: Run test to verify it fails**

Run: `pnpm vitest run packages/domain/src/status-change-event.test.ts`
Expected: FAIL — module not found.

**Step 4: Write the implementation**

Create `packages/domain/src/status-change-event.ts`:

```typescript
import type { AssetId, AssetStatus, OrganizationId, StatusChangeEventId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { StatusChangeEvent } from "./entities.js";

export interface CreateStatusChangeEventInput {
  readonly id: StatusChangeEventId;
  readonly assetId: AssetId;
  readonly fromStatus: AssetStatus | null;
  readonly toStatus: AssetStatus;
  readonly changedBy: string;
  readonly organizationId: OrganizationId;
}

export function createStatusChangeEvent(input: CreateStatusChangeEventInput): Result<StatusChangeEvent> {
  if (!input.changedBy.trim()) {
    return err("changedBy cannot be empty");
  }

  return ok({
    id: input.id,
    assetId: input.assetId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    changedAt: new Date(),
    changedBy: input.changedBy.trim(),
    organizationId: input.organizationId,
  });
}
```

**Step 5: Run test to verify it passes**

Run: `pnpm vitest run packages/domain/src/status-change-event.test.ts`
Expected: PASS (3 tests).

**Step 6: Export from domain index**

In `packages/domain/src/index.ts`, add:

```typescript
export type { StatusChangeEvent } from "./entities.js";

export { createStatusChangeEvent } from "./status-change-event.js";
export type { CreateStatusChangeEventInput } from "./status-change-event.js";
```

**Step 7: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass (83 total).

**Step 8: Commit**

```bash
git add packages/domain/src/entities.ts packages/domain/src/status-change-event.ts packages/domain/src/status-change-event.test.ts packages/domain/src/index.ts
git commit -m "feat(domain): add StatusChangeEvent entity and create function"
```

---

### Task 3: Add filterAssets pure function

**Files:**
- Modify: `packages/domain/src/asset.ts` (add AssetFilter type and filterAssets function)
- Modify: `packages/domain/src/asset.test.ts` (add filter tests)
- Modify: `packages/domain/src/index.ts` (add exports)

**Step 1: Write the failing tests**

Append to `packages/domain/src/asset.test.ts`:

```typescript
import { filterAssets } from "./asset.js";
import type { AssetFilter } from "./asset.js";
import type { IPAsset } from "./entities.js";

const makeAsset = (overrides: Partial<IPAsset>): IPAsset => ({
  id: "660e8400-e29b-41d4-a716-446655440000" as AssetId,
  title: "Test Patent",
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  status: "draft",
  filingDate: null,
  expirationDate: null,
  owner: "Acme Corp",
  organizationId: ORG_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

const testAssets: IPAsset[] = [
  makeAsset({ id: "a0000000-0000-0000-0000-000000000001" as AssetId, title: "Alpha Patent", type: "patent", status: "filed", jurisdiction: { code: "US", name: "United States" }, owner: "Alice" }),
  makeAsset({ id: "a0000000-0000-0000-0000-000000000002" as AssetId, title: "Beta Trademark", type: "trademark", status: "granted", jurisdiction: { code: "EU", name: "European Union" }, owner: "Bob" }),
  makeAsset({ id: "a0000000-0000-0000-0000-000000000003" as AssetId, title: "Gamma Copyright", type: "copyright", status: "draft", jurisdiction: { code: "US", name: "United States" }, owner: "Alice" }),
  makeAsset({ id: "a0000000-0000-0000-0000-000000000004" as AssetId, title: "Delta Design", type: "design-right", status: "expired", jurisdiction: { code: "JP", name: "Japan" }, owner: "Charlie", filingDate: new Date("2025-06-15") }),
];

describe("filterAssets", () => {
  it("returns all assets when filter is empty", () => {
    expect(filterAssets(testAssets, {})).toHaveLength(4);
  });

  it("filters by status", () => {
    const result = filterAssets(testAssets, { status: ["filed", "granted"] });
    expect(result).toHaveLength(2);
    expect(result.map((a) => a.title)).toEqual(["Alpha Patent", "Beta Trademark"]);
  });

  it("filters by type", () => {
    const result = filterAssets(testAssets, { type: ["patent", "copyright"] });
    expect(result).toHaveLength(2);
  });

  it("filters by jurisdiction code", () => {
    const result = filterAssets(testAssets, { jurisdiction: "US" });
    expect(result).toHaveLength(2);
  });

  it("filters by owner", () => {
    const result = filterAssets(testAssets, { owner: "Alice" });
    expect(result).toHaveLength(2);
  });

  it("searches by title (case-insensitive)", () => {
    const result = filterAssets(testAssets, { search: "beta" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Beta Trademark");
  });

  it("filters by date range using filingDate", () => {
    const result = filterAssets(testAssets, {
      dateFrom: new Date("2025-06-01"),
      dateTo: new Date("2025-07-01"),
    });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Delta Design");
  });

  it("combines multiple filters", () => {
    const result = filterAssets(testAssets, { status: ["draft"], owner: "Alice" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Gamma Copyright");
  });

  it("returns empty array when no matches", () => {
    const result = filterAssets(testAssets, { search: "nonexistent" });
    expect(result).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/domain/src/asset.test.ts`
Expected: FAIL — `filterAssets` not found.

**Step 3: Write the implementation**

Append to `packages/domain/src/asset.ts`:

```typescript
export interface AssetFilter {
  readonly status?: AssetStatus[];
  readonly type?: IPType[];
  readonly jurisdiction?: string;
  readonly owner?: string;
  readonly search?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}

export function filterAssets(assets: readonly IPAsset[], filter: AssetFilter): IPAsset[] {
  return assets.filter((asset) => {
    if (filter.status && filter.status.length > 0 && !filter.status.includes(asset.status)) {
      return false;
    }
    if (filter.type && filter.type.length > 0 && !filter.type.includes(asset.type)) {
      return false;
    }
    if (filter.jurisdiction && asset.jurisdiction.code !== filter.jurisdiction) {
      return false;
    }
    if (filter.owner && asset.owner !== filter.owner) {
      return false;
    }
    if (filter.search && !asset.title.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }
    if (filter.dateFrom || filter.dateTo) {
      const date = asset.filingDate;
      if (!date) return false;
      if (filter.dateFrom && date < filter.dateFrom) return false;
      if (filter.dateTo && date > filter.dateTo) return false;
    }
    return true;
  });
}
```

Note: the import of `IPType` needs to be added to the imports at the top of `asset.ts` (it already imports `AssetStatus` but not `IPType`).

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/domain/src/asset.test.ts`
Expected: PASS (all tests including new 9 filter tests).

**Step 5: Export from domain index**

In `packages/domain/src/index.ts`, add to the asset exports:

```typescript
export { createAsset, updateAssetStatus, validateStatusTransition, filterAssets } from "./asset.js";
export type { CreateAssetInput, AssetFilter } from "./asset.js";
```

**Step 6: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 7: Commit**

```bash
git add packages/domain/src/asset.ts packages/domain/src/asset.test.ts packages/domain/src/index.ts
git commit -m "feat(domain): add filterAssets pure function with AssetFilter type"
```

---

### Task 4: Add portfolio metrics pure function

**Files:**
- Create: `packages/domain/src/analytics/portfolio-metrics.ts`
- Create: `packages/domain/src/analytics/portfolio-metrics.test.ts`
- Create: `packages/domain/src/analytics/index.ts`
- Modify: `packages/domain/src/index.ts` (add exports)

**Step 1: Write the failing test**

Create `packages/domain/src/analytics/portfolio-metrics.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computePortfolioMetrics } from "./portfolio-metrics.js";
import type { IPAsset } from "../entities.js";
import type { AssetId, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;

const makeAsset = (overrides: Partial<IPAsset>): IPAsset => ({
  id: "a0000000-0000-0000-0000-000000000001" as AssetId,
  title: "Test",
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  status: "draft",
  filingDate: null,
  expirationDate: null,
  owner: "Owner",
  organizationId: ORG_ID,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ...overrides,
});

describe("computePortfolioMetrics", () => {
  it("returns zero counts for empty array", () => {
    const metrics = computePortfolioMetrics([], new Date("2026-03-09"));
    expect(metrics.totalAssets).toBe(0);
    expect(metrics.byStatus.draft).toBe(0);
    expect(metrics.byType.patent).toBe(0);
    expect(metrics.byJurisdiction).toEqual([]);
    expect(metrics.expiringWithin90Days).toBe(0);
  });

  it("counts assets by status", () => {
    const assets = [
      makeAsset({ status: "draft" }),
      makeAsset({ status: "draft" }),
      makeAsset({ status: "granted" }),
    ];
    const metrics = computePortfolioMetrics(assets, new Date("2026-03-09"));
    expect(metrics.totalAssets).toBe(3);
    expect(metrics.byStatus.draft).toBe(2);
    expect(metrics.byStatus.granted).toBe(1);
    expect(metrics.byStatus.filed).toBe(0);
  });

  it("counts assets by type", () => {
    const assets = [
      makeAsset({ type: "patent" }),
      makeAsset({ type: "patent" }),
      makeAsset({ type: "trademark" }),
    ];
    const metrics = computePortfolioMetrics(assets, new Date("2026-03-09"));
    expect(metrics.byType.patent).toBe(2);
    expect(metrics.byType.trademark).toBe(1);
    expect(metrics.byType.copyright).toBe(0);
  });

  it("groups assets by jurisdiction", () => {
    const assets = [
      makeAsset({ jurisdiction: { code: "US", name: "United States" } }),
      makeAsset({ jurisdiction: { code: "US", name: "United States" } }),
      makeAsset({ jurisdiction: { code: "EU", name: "European Union" } }),
    ];
    const metrics = computePortfolioMetrics(assets, new Date("2026-03-09"));
    expect(metrics.byJurisdiction).toEqual(
      expect.arrayContaining([
        { code: "US", name: "United States", count: 2 },
        { code: "EU", name: "European Union", count: 1 },
      ])
    );
  });

  it("counts assets expiring within 90 days", () => {
    const now = new Date("2026-03-09");
    const assets = [
      makeAsset({ expirationDate: new Date("2026-04-01"), status: "granted" }),  // within 90 days
      makeAsset({ expirationDate: new Date("2026-12-01"), status: "granted" }),  // outside 90 days
      makeAsset({ expirationDate: null, status: "draft" }),                       // no expiration
      makeAsset({ expirationDate: new Date("2026-03-01"), status: "expired" }),   // already past
    ];
    const metrics = computePortfolioMetrics(assets, now);
    expect(metrics.expiringWithin90Days).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/domain/src/analytics/portfolio-metrics.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `packages/domain/src/analytics/portfolio-metrics.ts`:

```typescript
import type { AssetStatus, IPType } from "@ipms/shared";
import { ASSET_STATUSES, IP_TYPES } from "@ipms/shared";
import type { IPAsset } from "../entities.js";

export interface PortfolioMetrics {
  readonly totalAssets: number;
  readonly byStatus: Record<AssetStatus, number>;
  readonly byType: Record<IPType, number>;
  readonly byJurisdiction: readonly { readonly code: string; readonly name: string; readonly count: number }[];
  readonly expiringWithin90Days: number;
}

const MS_PER_DAY = 86_400_000;

export function computePortfolioMetrics(assets: readonly IPAsset[], now: Date): PortfolioMetrics {
  const byStatus = Object.fromEntries(ASSET_STATUSES.map((s) => [s, 0])) as Record<AssetStatus, number>;
  const byType = Object.fromEntries(IP_TYPES.map((t) => [t, 0])) as Record<IPType, number>;
  const jurisdictionMap = new Map<string, { name: string; count: number }>();
  let expiringWithin90Days = 0;

  const ninetyDaysFromNow = new Date(now.getTime() + 90 * MS_PER_DAY);

  for (const asset of assets) {
    byStatus[asset.status]++;
    byType[asset.type]++;

    const existing = jurisdictionMap.get(asset.jurisdiction.code);
    if (existing) {
      existing.count++;
    } else {
      jurisdictionMap.set(asset.jurisdiction.code, { name: asset.jurisdiction.name, count: 1 });
    }

    if (
      asset.expirationDate &&
      asset.expirationDate > now &&
      asset.expirationDate <= ninetyDaysFromNow &&
      asset.status !== "expired" &&
      asset.status !== "abandoned"
    ) {
      expiringWithin90Days++;
    }
  }

  const byJurisdiction = [...jurisdictionMap.entries()].map(([code, { name, count }]) => ({
    code,
    name,
    count,
  }));

  return {
    totalAssets: assets.length,
    byStatus,
    byType,
    byJurisdiction,
    expiringWithin90Days,
  };
}
```

**Step 4: Create the analytics index**

Create `packages/domain/src/analytics/index.ts`:

```typescript
export { computePortfolioMetrics } from "./portfolio-metrics.js";
export type { PortfolioMetrics } from "./portfolio-metrics.js";
```

**Step 5: Run test to verify it passes**

Run: `pnpm vitest run packages/domain/src/analytics/portfolio-metrics.test.ts`
Expected: PASS (5 tests).

**Step 6: Export from domain index**

In `packages/domain/src/index.ts`, add:

```typescript
export { computePortfolioMetrics } from "./analytics/index.js";
export type { PortfolioMetrics } from "./analytics/index.js";
```

**Step 7: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 8: Commit**

```bash
git add packages/domain/src/analytics/ packages/domain/src/index.ts
git commit -m "feat(domain): add computePortfolioMetrics analytics function"
```

---

### Task 5: Add deadline metrics pure function

**Files:**
- Create: `packages/domain/src/analytics/deadline-metrics.ts`
- Create: `packages/domain/src/analytics/deadline-metrics.test.ts`
- Modify: `packages/domain/src/analytics/index.ts` (add exports)
- Modify: `packages/domain/src/index.ts` (add exports)

**Step 1: Write the failing test**

Create `packages/domain/src/analytics/deadline-metrics.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeDeadlineMetrics } from "./deadline-metrics.js";
import type { Deadline } from "../entities.js";
import type { AssetId, DeadlineId, OrganizationId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;

const makeDeadline = (overrides: Partial<Deadline>): Deadline => ({
  id: "d0000000-0000-0000-0000-000000000001" as DeadlineId,
  assetId: "a0000000-0000-0000-0000-000000000001" as AssetId,
  type: "renewal",
  title: "Test Deadline",
  dueDate: new Date("2026-03-15"),
  completed: false,
  organizationId: ORG_ID,
  ...overrides,
});

describe("computeDeadlineMetrics", () => {
  const now = new Date("2026-03-09");

  it("returns zero counts for empty array", () => {
    const metrics = computeDeadlineMetrics([], now);
    expect(metrics.total).toBe(0);
    expect(metrics.overdue).toBe(0);
    expect(metrics.upcoming).toBe(0);
    expect(metrics.completed).toBe(0);
    expect(metrics.completionRate).toBe(0);
  });

  it("counts overdue deadlines (past due, not completed)", () => {
    const deadlines = [
      makeDeadline({ dueDate: new Date("2026-03-01"), completed: false }),
      makeDeadline({ dueDate: new Date("2026-03-01"), completed: true }),
      makeDeadline({ dueDate: new Date("2026-03-15"), completed: false }),
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.overdue).toBe(1);
  });

  it("counts upcoming deadlines (due within 30 days, not completed)", () => {
    const deadlines = [
      makeDeadline({ dueDate: new Date("2026-03-15"), completed: false }),  // upcoming
      makeDeadline({ dueDate: new Date("2026-03-20"), completed: false }),  // upcoming
      makeDeadline({ dueDate: new Date("2026-05-01"), completed: false }),  // too far
      makeDeadline({ dueDate: new Date("2026-03-15"), completed: true }),   // completed
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.upcoming).toBe(2);
  });

  it("calculates completion rate", () => {
    const deadlines = [
      makeDeadline({ completed: true }),
      makeDeadline({ completed: true }),
      makeDeadline({ completed: false }),
      makeDeadline({ completed: false }),
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.completionRate).toBe(0.5);
  });

  it("counts overdue by type", () => {
    const deadlines = [
      makeDeadline({ type: "renewal", dueDate: new Date("2026-03-01"), completed: false }),
      makeDeadline({ type: "renewal", dueDate: new Date("2026-03-02"), completed: false }),
      makeDeadline({ type: "response", dueDate: new Date("2026-03-01"), completed: false }),
      makeDeadline({ type: "filing", dueDate: new Date("2026-03-15"), completed: false }),
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.overdueByType.renewal).toBe(2);
    expect(metrics.overdueByType.response).toBe(1);
    expect(metrics.overdueByType.filing).toBe(0);
  });

  it("treats deadline due exactly today as not overdue", () => {
    const deadlines = [
      makeDeadline({ dueDate: new Date("2026-03-09"), completed: false }),
    ];
    const metrics = computeDeadlineMetrics(deadlines, now);
    expect(metrics.overdue).toBe(0);
    expect(metrics.upcoming).toBe(1);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/domain/src/analytics/deadline-metrics.test.ts`
Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `packages/domain/src/analytics/deadline-metrics.ts`:

```typescript
import type { DeadlineType } from "@ipms/shared";
import { DEADLINE_TYPES } from "@ipms/shared";
import type { Deadline } from "../entities.js";

export interface DeadlineMetrics {
  readonly total: number;
  readonly overdue: number;
  readonly upcoming: number;
  readonly completed: number;
  readonly completionRate: number;
  readonly overdueByType: Record<DeadlineType, number>;
}

const MS_PER_DAY = 86_400_000;

export function computeDeadlineMetrics(deadlines: readonly Deadline[], now: Date): DeadlineMetrics {
  const overdueByType = Object.fromEntries(DEADLINE_TYPES.map((t) => [t, 0])) as Record<DeadlineType, number>;
  let overdue = 0;
  let upcoming = 0;
  let completed = 0;

  const thirtyDaysFromNow = new Date(now.getTime() + 30 * MS_PER_DAY);

  for (const deadline of deadlines) {
    if (deadline.completed) {
      completed++;
      continue;
    }

    if (deadline.dueDate < now) {
      overdue++;
      overdueByType[deadline.type]++;
    } else if (deadline.dueDate <= thirtyDaysFromNow) {
      upcoming++;
    }
  }

  return {
    total: deadlines.length,
    overdue,
    upcoming,
    completed,
    completionRate: deadlines.length > 0 ? completed / deadlines.length : 0,
    overdueByType,
  };
}
```

**Step 4: Export from analytics index**

In `packages/domain/src/analytics/index.ts`, add:

```typescript
export { computeDeadlineMetrics } from "./deadline-metrics.js";
export type { DeadlineMetrics } from "./deadline-metrics.js";
```

**Step 5: Run test to verify it passes**

Run: `pnpm vitest run packages/domain/src/analytics/deadline-metrics.test.ts`
Expected: PASS (6 tests).

**Step 6: Export from domain index**

In `packages/domain/src/index.ts`, add:

```typescript
export { computeDeadlineMetrics } from "./analytics/index.js";
export type { DeadlineMetrics } from "./analytics/index.js";
```

**Step 7: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 8: Commit**

```bash
git add packages/domain/src/analytics/deadline-metrics.ts packages/domain/src/analytics/deadline-metrics.test.ts packages/domain/src/analytics/index.ts packages/domain/src/index.ts
git commit -m "feat(domain): add computeDeadlineMetrics analytics function"
```

---

### Task 6: Add StatusChangeEventRepository port and in-memory implementation

**Files:**
- Modify: `packages/application/src/ports.ts` (add new port)
- Modify: `packages/application/src/index.ts` (export port)
- Create: `packages/infrastructure/src/in-memory-status-change-event-repository.ts`
- Modify: `packages/infrastructure/src/index.ts` (export)

**Step 1: Add the port interface**

In `packages/application/src/ports.ts`, add the import of `StatusChangeEventId` and the new interface:

```typescript
import type { AssetId, DeadlineId, DocumentId, PortfolioId, OrganizationId, StatusChangeEventId } from "@ipms/shared";
import type { IPAsset, Deadline, Document, Portfolio, StatusChangeEvent } from "@ipms/domain";

// ... existing interfaces ...

export interface StatusChangeEventRepository {
  findByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<readonly StatusChangeEvent[]>;
  findAll(orgId: OrganizationId): Promise<readonly StatusChangeEvent[]>;
  save(event: StatusChangeEvent): Promise<void>;
}
```

**Step 2: Export from application index**

In `packages/application/src/index.ts`, add `StatusChangeEventRepository` to the type exports:

```typescript
export type {
  AssetRepository,
  DeadlineRepository,
  DocumentRepository,
  PortfolioRepository,
  StatusChangeEventRepository,
} from "./ports.js";
```

**Step 3: Create the in-memory implementation**

Create `packages/infrastructure/src/in-memory-status-change-event-repository.ts`:

```typescript
import type { AssetId, OrganizationId } from "@ipms/shared";
import type { StatusChangeEvent } from "@ipms/domain";
import type { StatusChangeEventRepository } from "@ipms/application";

export function createInMemoryStatusChangeEventRepository(): StatusChangeEventRepository {
  const store = new Map<string, StatusChangeEvent>();

  return {
    async findByAssetId(assetId, orgId) {
      return [...store.values()]
        .filter((e) => e.assetId === assetId && e.organizationId === orgId)
        .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
    },

    async findAll(orgId) {
      return [...store.values()].filter((e) => e.organizationId === orgId);
    },

    async save(event) {
      store.set(`${event.organizationId}:${event.id}`, event);
    },
  };
}
```

**Step 4: Export from infrastructure index**

In `packages/infrastructure/src/index.ts`, add:

```typescript
export { createInMemoryStatusChangeEventRepository } from "./in-memory-status-change-event-repository.js";
```

**Step 5: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass (no new tests in this task, but existing tests must not break).

**Step 6: Commit**

```bash
git add packages/application/src/ports.ts packages/application/src/index.ts packages/infrastructure/src/in-memory-status-change-event-repository.ts packages/infrastructure/src/index.ts
git commit -m "feat(application,infrastructure): add StatusChangeEventRepository port and in-memory impl"
```

---

### Task 7: Add analytics and timeline use cases

**Files:**
- Create: `packages/application/src/use-cases/analytics.ts`
- Create: `packages/application/src/use-cases/timeline.ts`
- Modify: `packages/application/src/index.ts` (add exports)

**Step 1: Create analytics use cases**

Create `packages/application/src/use-cases/analytics.ts`:

```typescript
import type { OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import { type PortfolioMetrics, computePortfolioMetrics, type DeadlineMetrics, computeDeadlineMetrics } from "@ipms/domain";
import type { AssetRepository } from "../ports.js";
import type { DeadlineRepository } from "../ports.js";

export function computePortfolioMetricsUseCase(repo: AssetRepository) {
  return async (orgId: OrganizationId, now: Date): Promise<Result<PortfolioMetrics>> => {
    const assets = await repo.findAll(orgId);
    return ok(computePortfolioMetrics(assets, now));
  };
}

export function computeDeadlineMetricsUseCase(repo: DeadlineRepository) {
  return async (orgId: OrganizationId, now: Date): Promise<Result<DeadlineMetrics>> => {
    const deadlines = await repo.findAll(orgId);
    return ok(computeDeadlineMetrics(deadlines, now));
  };
}
```

**Step 2: Create timeline use case**

Create `packages/application/src/use-cases/timeline.ts`:

```typescript
import type { AssetId, OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { StatusChangeEvent } from "@ipms/domain";
import type { StatusChangeEventRepository } from "../ports.js";

export function getAssetTimelineUseCase(repo: StatusChangeEventRepository) {
  return async (
    assetId: AssetId,
    orgId: OrganizationId,
  ): Promise<Result<readonly StatusChangeEvent[]>> => {
    const events = await repo.findByAssetId(assetId, orgId);
    return ok(events);
  };
}
```

**Step 3: Add filtered listing use case**

In `packages/application/src/use-cases/asset.ts`, add the import and new function:

Add to imports at top:

```typescript
import { type IPAsset, type CreateAssetInput, createAsset, updateAssetStatus, type AssetFilter, filterAssets } from "@ipms/domain";
```

Add at the end of the file:

```typescript
export function listAssetsFilteredUseCase(repo: AssetRepository) {
  return async (
    orgId: OrganizationId,
    filter: AssetFilter,
  ): Promise<Result<readonly IPAsset[]>> => {
    const assets = await repo.findAll(orgId);
    return ok(filterAssets(assets, filter));
  };
}
```

**Step 4: Export from application index**

In `packages/application/src/index.ts`, add:

```typescript
export {
  computePortfolioMetricsUseCase,
  computeDeadlineMetricsUseCase,
} from "./use-cases/analytics.js";

export { getAssetTimelineUseCase } from "./use-cases/timeline.js";

// Update the asset exports to include listAssetsFilteredUseCase:
export {
  createAssetUseCase,
  getAssetUseCase,
  listAssetsUseCase,
  updateAssetStatusUseCase,
  deleteAssetUseCase,
  listAssetsFilteredUseCase,
} from "./use-cases/asset.js";
```

**Step 5: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add packages/application/src/use-cases/analytics.ts packages/application/src/use-cases/timeline.ts packages/application/src/use-cases/asset.ts packages/application/src/index.ts
git commit -m "feat(application): add analytics, timeline, and filtered listing use cases"
```

---

### Task 8: Modify updateAssetStatusUseCase to emit StatusChangeEvent

**Files:**
- Modify: `packages/application/src/use-cases/asset.ts` (update function signature)
- Modify: `packages/infrastructure/src/asset-use-cases.test.ts` (update test)

**Step 1: Update the existing test**

In `packages/infrastructure/src/asset-use-cases.test.ts`, update the test for status updates:

Add imports:

```typescript
import { createInMemoryStatusChangeEventRepository } from "./in-memory-status-change-event-repository.js";
import type { StatusChangeEventId } from "@ipms/shared";
```

Update the `beforeEach` and test:

```typescript
describe("asset use cases", () => {
  let repo: ReturnType<typeof createInMemoryAssetRepository>;
  let eventRepo: ReturnType<typeof createInMemoryStatusChangeEventRepository>;

  beforeEach(() => {
    repo = createInMemoryAssetRepository();
    eventRepo = createInMemoryStatusChangeEventRepository();
  });

  // ... keep existing tests unchanged except:

  it("updates asset status", async () => {
    const create = createAssetUseCase(repo);
    const update = updateAssetStatusUseCase(repo, eventRepo);

    await create(validInput);
    const result = await update(ASSET_ID, ORG_ID, "filed", "Alex Chen");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("filed");
    }
  });

  it("creates a status change event on status update", async () => {
    const create = createAssetUseCase(repo);
    const update = updateAssetStatusUseCase(repo, eventRepo);

    await create(validInput);
    await update(ASSET_ID, ORG_ID, "filed", "Alex Chen");

    const events = await eventRepo.findByAssetId(ASSET_ID, ORG_ID);
    expect(events).toHaveLength(1);
    expect(events[0].fromStatus).toBe("draft");
    expect(events[0].toStatus).toBe("filed");
    expect(events[0].changedBy).toBe("Alex Chen");
  });
```

**Step 2: Run test to verify it fails**

Run: `pnpm vitest run packages/infrastructure/src/asset-use-cases.test.ts`
Expected: FAIL — signature mismatch.

**Step 3: Update the use case implementation**

In `packages/application/src/use-cases/asset.ts`, update the imports and function:

Add to imports:

```typescript
import { createStatusChangeEvent } from "@ipms/domain";
import type { StatusChangeEventRepository } from "../ports.js";
import crypto from "node:crypto";
```

Replace `updateAssetStatusUseCase`:

```typescript
export function updateAssetStatusUseCase(repo: AssetRepository, eventRepo: StatusChangeEventRepository) {
  return async (
    id: AssetId,
    orgId: OrganizationId,
    newStatus: AssetStatus,
    changedBy: string,
  ): Promise<Result<IPAsset>> => {
    const asset = await repo.findById(id, orgId);
    if (!asset) return err("Asset not found");

    const result = updateAssetStatus(asset, newStatus);
    if (!result.ok) return result;

    const eventResult = createStatusChangeEvent({
      id: crypto.randomUUID() as import("@ipms/shared").StatusChangeEventId,
      assetId: id,
      fromStatus: asset.status,
      toStatus: newStatus,
      changedBy,
      organizationId: orgId,
    });

    await repo.save(result.value);
    if (eventResult.ok) {
      await eventRepo.save(eventResult.value);
    }

    return result;
  };
}
```

**Step 4: Run test to verify it passes**

Run: `pnpm vitest run packages/infrastructure/src/asset-use-cases.test.ts`
Expected: PASS (6 tests — 5 existing + 1 new).

**Step 5: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 6: Commit**

```bash
git add packages/application/src/use-cases/asset.ts packages/infrastructure/src/asset-use-cases.test.ts
git commit -m "feat(application): emit StatusChangeEvent on asset status update"
```

---

### Task 9: Wire new use cases in web app server layer

**Files:**
- Modify: `apps/web/src/lib/server/repositories.ts` (add event repo)
- Modify: `apps/web/src/lib/server/use-cases.ts` (wire new use cases, update updateAssetStatus)
- Modify: `apps/web/src/routes/api/assets/[id]/+server.ts` (pass changedBy)

**Step 1: Add event repository**

In `apps/web/src/lib/server/repositories.ts`, add:

```typescript
import {
  createInMemoryAssetRepository,
  createInMemoryDeadlineRepository,
  createInMemoryDocumentRepository,
  createInMemoryPortfolioRepository,
  createInMemoryStatusChangeEventRepository,
} from "@ipms/infrastructure";

export const assetRepo = createInMemoryAssetRepository();
export const deadlineRepo = createInMemoryDeadlineRepository();
export const documentRepo = createInMemoryDocumentRepository();
export const portfolioRepo = createInMemoryPortfolioRepository();
export const statusChangeEventRepo = createInMemoryStatusChangeEventRepository();
```

**Step 2: Wire new use cases**

In `apps/web/src/lib/server/use-cases.ts`, add:

```typescript
import {
  createAssetUseCase,
  getAssetUseCase,
  listAssetsUseCase,
  listAssetsFilteredUseCase,
  updateAssetStatusUseCase,
  deleteAssetUseCase,
  createDeadlineUseCase,
  listDeadlinesByAssetUseCase,
  completeDeadlineUseCase,
  createPortfolioUseCase,
  getPortfolioUseCase,
  listPortfoliosUseCase,
  addAssetToPortfolioUseCase,
  removeAssetFromPortfolioUseCase,
  deletePortfolioUseCase,
  createDocumentUseCase,
  updateDocumentStatusUseCase,
  deleteDocumentUseCase,
  computePortfolioMetricsUseCase,
  computeDeadlineMetricsUseCase,
  getAssetTimelineUseCase,
} from "@ipms/application";
import { assetRepo, deadlineRepo, documentRepo, portfolioRepo, statusChangeEventRepo } from "./repositories.js";

export const createAsset = createAssetUseCase(assetRepo);
export const getAsset = getAssetUseCase(assetRepo);
export const listAssets = listAssetsUseCase(assetRepo);
export const listAssetsFiltered = listAssetsFilteredUseCase(assetRepo);
export const updateAssetStatus = updateAssetStatusUseCase(assetRepo, statusChangeEventRepo);
export const deleteAsset = deleteAssetUseCase(assetRepo);

export const createDeadline = createDeadlineUseCase(deadlineRepo);
export const listDeadlinesByAsset = listDeadlinesByAssetUseCase(deadlineRepo);
export const completeDeadline = completeDeadlineUseCase(deadlineRepo);

export const createPortfolio = createPortfolioUseCase(portfolioRepo);
export const getPortfolio = getPortfolioUseCase(portfolioRepo);
export const listPortfolios = listPortfoliosUseCase(portfolioRepo);
export const addAssetToPortfolio = addAssetToPortfolioUseCase(portfolioRepo);
export const removeAssetFromPortfolio = removeAssetFromPortfolioUseCase(portfolioRepo);
export const deletePortfolio = deletePortfolioUseCase(portfolioRepo);

export const createDocument = createDocumentUseCase(documentRepo);
export const updateDocumentStatus = updateDocumentStatusUseCase(documentRepo);
export const deleteDocument = deleteDocumentUseCase(documentRepo);

export const computePortfolioMetrics = computePortfolioMetricsUseCase(assetRepo);
export const computeDeadlineMetrics = computeDeadlineMetricsUseCase(deadlineRepo);
export const getAssetTimeline = getAssetTimelineUseCase(statusChangeEventRepo);
```

**Step 3: Update the PUT handler to pass changedBy**

In `apps/web/src/routes/api/assets/[id]/+server.ts`, update the PUT handler:

```typescript
export const PUT: RequestHandler = async ({ params, request }) => {
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const body = await request.json();
  const changedBy = body.changedBy ?? "system";
  const result = await updateAssetStatus(idResult.value, DEFAULT_ORG_ID, body.status, changedBy);
  return resultToResponse(result);
};
```

**Step 4: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass.

**Step 5: Commit**

```bash
git add apps/web/src/lib/server/repositories.ts apps/web/src/lib/server/use-cases.ts apps/web/src/routes/api/assets/\[id\]/+server.ts
git commit -m "feat(web): wire analytics, timeline, and filtered listing use cases"
```

---

### Task 10: Add analytics and timeline API routes

**Files:**
- Create: `apps/web/src/routes/api/analytics/portfolio/+server.ts`
- Create: `apps/web/src/routes/api/analytics/deadlines/+server.ts`
- Create: `apps/web/src/routes/api/assets/[id]/timeline/+server.ts`

**Step 1: Create portfolio metrics API route**

Create `apps/web/src/routes/api/analytics/portfolio/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { computePortfolioMetrics } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";

export const GET: RequestHandler = async () => {
  const result = await computePortfolioMetrics(DEFAULT_ORG_ID, new Date());
  return resultToResponse(result);
};
```

**Step 2: Create deadline metrics API route**

Create `apps/web/src/routes/api/analytics/deadlines/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { computeDeadlineMetrics } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";

export const GET: RequestHandler = async () => {
  const result = await computeDeadlineMetrics(DEFAULT_ORG_ID, new Date());
  return resultToResponse(result);
};
```

**Step 3: Create timeline API route**

Create `apps/web/src/routes/api/assets/[id]/timeline/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { getAssetTimeline } from "$lib/server/use-cases";
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const GET: RequestHandler = async ({ params }) => {
  const idResult = parseAssetId(params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getAssetTimeline(idResult.value, DEFAULT_ORG_ID);
  return resultToResponse(result);
};
```

**Step 4: Run the dev server to verify routes compile**

Run: `cd apps/web && pnpm build 2>&1 | tail -5`
Expected: Build succeeds without errors.

**Step 5: Commit**

```bash
git add apps/web/src/routes/api/analytics/ apps/web/src/routes/api/assets/\[id\]/timeline/
git commit -m "feat(web): add analytics and timeline API routes"
```

---

### Task 11: Add analytics and timeline feature modules

**Files:**
- Create: `apps/web/src/features/analytics/data.ts`
- Create: `apps/web/src/features/analytics/helpers.ts`
- Create: `apps/web/src/features/timeline/data.ts`
- Create: `apps/web/src/features/timeline/helpers.ts`

**Step 1: Create analytics data module**

Create `apps/web/src/features/analytics/data.ts`:

```typescript
import type { PortfolioMetrics, DeadlineMetrics } from "@ipms/domain";

export async function fetchPortfolioMetrics(): Promise<PortfolioMetrics> {
  const res = await fetch("/api/analytics/portfolio");
  return res.json();
}

export async function fetchDeadlineMetrics(): Promise<DeadlineMetrics> {
  const res = await fetch("/api/analytics/deadlines");
  return res.json();
}
```

**Step 2: Create analytics helpers**

Create `apps/web/src/features/analytics/helpers.ts`:

```typescript
export function formatRate(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function computeHealthScore(granted: number, total: number, abandoned: number): number {
  const nonAbandoned = total - abandoned;
  if (nonAbandoned === 0) return 0;
  return Math.round((granted / nonAbandoned) * 100);
}

export function healthLabel(score: number): string {
  if (score >= 80) return "Healthy";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Needs Attention";
  return "At Risk";
}
```

**Step 3: Create timeline data module**

Create `apps/web/src/features/timeline/data.ts`:

```typescript
export interface TimelineEvent {
  id: string;
  assetId: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
  changedBy: string;
}

export async function fetchAssetTimeline(assetId: string): Promise<TimelineEvent[]> {
  const res = await fetch(`/api/assets/${assetId}/timeline`);
  return res.json();
}
```

**Step 4: Create timeline helpers**

Create `apps/web/src/features/timeline/helpers.ts`:

```typescript
import { statusConfig } from "../assets/helpers";

export function formatTimelineEntry(fromStatus: string | null, toStatus: string): string {
  if (!fromStatus) {
    return `Created as ${statusConfig[toStatus]?.label ?? toStatus}`;
  }
  return `${statusConfig[fromStatus]?.label ?? fromStatus} → ${statusConfig[toStatus]?.label ?? toStatus}`;
}

export function formatTimelineDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
```

**Step 5: Commit**

```bash
git add apps/web/src/features/analytics/ apps/web/src/features/timeline/
git commit -m "feat(web): add analytics and timeline feature modules"
```

---

### Task 12: Replace hardcoded dashboard with computed data

**Files:**
- Modify: `apps/web/src/routes/+page.svelte` (rewrite to use API data)

**Step 1: Rewrite the dashboard page**

Replace `apps/web/src/routes/+page.svelte` with a version that fetches data from the API routes. The page should:

- On mount, fetch `/api/analytics/portfolio` and `/api/analytics/deadlines`
- Also fetch `/api/assets` for the recent assets table (sort by updatedAt, limit 5)
- Fetch `/api/analytics/deadlines` for the sidebar
- Compute health score from portfolio metrics using `computeHealthScore`
- Show loading states while fetching
- Keep the same visual layout and TailwindCSS styling as the current page

The dashboard page currently uses hardcoded `stats`, `deadlines`, `recentAssets` arrays. Replace these with reactive `$state` variables populated via `onMount` fetch calls.

Key data mappings:
- Stats cards: `metrics.totalAssets`, `metrics.byStatus.granted`, `metrics.expiringWithin90Days`
- Recent assets table: fetched from `/api/assets`, sorted by updatedAt descending, take first 5
- Deadline sidebar: `deadlineMetrics.overdue`, `deadlineMetrics.upcoming`, `deadlineMetrics.completed`
- Portfolio health: `computeHealthScore(metrics.byStatus.granted, metrics.totalAssets, metrics.byStatus.abandoned)`

**Step 2: Verify manually**

Run: `cd apps/web && pnpm dev`
Open browser at `http://localhost:5173`
Expected: Dashboard loads (stats will be zeros since in-memory repos start empty — this is correct for now).

**Step 3: Commit**

```bash
git add apps/web/src/routes/+page.svelte
git commit -m "feat(web): replace hardcoded dashboard with computed analytics data"
```

---

### Task 13: Add advanced filtering to assets page

**Files:**
- Modify: `apps/web/src/routes/assets/+page.svelte` (add filter bar, fetch from API)

**Step 1: Enhance the assets page**

Update `apps/web/src/routes/assets/+page.svelte` to:

- Fetch assets from `/api/assets` on mount instead of importing hardcoded data
- Add a search input that filters by title (client-side via `filterAssets` from `@ipms/domain`)
- Add jurisdiction dropdown (populated from unique jurisdictions in fetched data)
- Add owner dropdown (populated from unique owners in fetched data)
- Use the `filterAssets` pure function imported from `@ipms/domain` for client-side filtering
- Keep existing type filter pills
- Add column sorting (click table headers to sort by that column)

The existing `activeFilter` pill logic for type filtering should be integrated into the `AssetFilter` object.

**Step 2: Verify manually**

Run: `cd apps/web && pnpm dev`
Navigate to `/assets`
Expected: Page loads, filters work (data will come from API — initially empty until seed data is added).

**Step 3: Commit**

```bash
git add apps/web/src/routes/assets/+page.svelte
git commit -m "feat(web): add advanced filtering and search to assets page"
```

---

### Task 14: Add timeline section to asset detail page

**Files:**
- Modify: `apps/web/src/routes/assets/[id]/+page.svelte` (add timeline section)

**Step 1: Add timeline section**

In `apps/web/src/routes/assets/[id]/+page.svelte`, add after the Status Transitions section and before the Danger Zone:

- Import `fetchAssetTimeline` from `features/timeline/data`
- Import `formatTimelineEntry`, `formatTimelineDate` from `features/timeline/helpers`
- On mount, fetch timeline events for the current asset
- Render a chronological list showing each status change with:
  - Status transition label (e.g., "Draft → Filed")
  - Date and time
  - Changed by (person name)
  - Visual timeline line connecting events

**Step 2: Verify manually**

Run: `cd apps/web && pnpm dev`
Navigate to `/assets/1`
Expected: Timeline section appears (empty until status changes are made via API).

**Step 3: Commit**

```bash
git add apps/web/src/routes/assets/\[id\]/+page.svelte
git commit -m "feat(web): add status change timeline to asset detail page"
```

---

### Task 15: Add seed data for development

**Files:**
- Create: `apps/web/src/lib/server/seed.ts`
- Modify: `apps/web/src/lib/server/repositories.ts` (call seed on import)

**Step 1: Create seed data module**

Create `apps/web/src/lib/server/seed.ts` that:

- Imports the repositories from `./repositories.js`
- Uses the existing `createAsset`, `createDeadline`, `createDocument`, `createPortfolio` domain functions
- Creates ~10 assets with varied types, statuses, jurisdictions (matching the current mock data in `features/assets/data.ts`)
- Creates ~14 deadlines (matching `features/deadlines/data.ts`)
- Creates a few documents and portfolios
- Creates StatusChangeEvents for assets that are not in draft (simulating their history)
- Saves everything to the in-memory repositories
- Exports a `seedData()` async function

**Step 2: Call seed on startup**

In `apps/web/src/lib/server/repositories.ts`, after creating all repos, import and call:

```typescript
import { seedData } from "./seed.js";
seedData();
```

**Step 3: Verify manually**

Run: `cd apps/web && pnpm dev`
Expected: Dashboard shows real computed stats. Assets page shows seeded assets. Deadlines page shows seeded deadlines.

**Step 4: Commit**

```bash
git add apps/web/src/lib/server/seed.ts apps/web/src/lib/server/repositories.ts
git commit -m "feat(web): add seed data for development with realistic IP assets"
```

---

### Task 16: Update documentation

**Files:**
- Modify: `docs/domain-model.md` (add StatusChangeEvent entity, AssetFilter value object)
- Modify: `docs/architecture.md` (mention analytics functions in domain layer)
- Modify: `docs/roadmap.md` (check off completed Phase 2 items)

**Step 1: Update domain-model.md**

Add StatusChangeEvent entity table after Portfolio. Add AssetFilter to Value Objects table.

**Step 2: Update architecture.md**

Add a note about the analytics subfolder in the domain layer containing pure metric computation functions.

**Step 3: Update roadmap.md**

Mark completed items:
- [x] Portfolio dashboard with asset counts by status, type, and jurisdiction
- [x] Deadline compliance tracking (overdue, upcoming, completed rates)
- [x] Asset timeline view (status change history)
- [x] Advanced filtering and search across assets

**Step 4: Commit**

```bash
git add docs/domain-model.md docs/architecture.md docs/roadmap.md
git commit -m "docs: update domain model, architecture, and roadmap for Phase 2"
```

---

### Task 17: Final verification

**Step 1: Run all tests**

Run: `pnpm vitest run`
Expected: All tests pass (~110-120 total).

**Step 2: Build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 3: Manual smoke test**

Run: `cd apps/web && pnpm dev`
Verify:
- Dashboard shows computed stats from seed data
- Assets page filters work (type pills, search, jurisdiction, owner)
- Asset detail page shows timeline
- API endpoints return data: `/api/analytics/portfolio`, `/api/analytics/deadlines`, `/api/assets/{id}/timeline`

**Step 4: Final commit if any fixes needed**

---

## Task Dependency Summary

```
Task 1 (shared: branded type)
  └─> Task 2 (domain: StatusChangeEvent)
       └─> Task 6 (application/infra: repository port)
            └─> Task 8 (application: emit events on status update)
                 └─> Task 9 (web: wire use cases)
                      └─> Task 10 (web: API routes)

Task 3 (domain: filterAssets) ─── independent, can run in parallel with Task 2
Task 4 (domain: portfolio metrics) ─── independent, can run in parallel
Task 5 (domain: deadline metrics) ─── depends on Task 4 (shares analytics/index.ts)

Task 7 (application: analytics + timeline use cases) ─── depends on Tasks 2, 4, 5, 6
Task 11 (web: feature modules) ─── depends on Task 10
Task 12 (web: dashboard) ─── depends on Tasks 10, 11
Task 13 (web: filtering) ─── depends on Task 3, 10
Task 14 (web: timeline) ─── depends on Tasks 10, 11
Task 15 (web: seed data) ─── depends on Task 9
Task 16 (docs) ─── depends on all code tasks
Task 17 (verification) ─── depends on everything
```
