# Dashboard Filter Chips Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Connect filter chips on the dashboard to server-side filtering so all dashboard sections update when a filter is selected.

**Architecture:** Add optional query params (`type`, `status`, `jurisdiction`) to the 3 existing dashboard API endpoints. The use cases pre-filter data before computing metrics. The dashboard re-fetches all endpoints when a filter chip changes.

**Tech Stack:** SvelteKit, Svelte 5 ($state/$derived/$effect), TypeScript, Vitest

---

### Task 1: Add filtered portfolio metrics use case

**Files:**
- Modify: `packages/application/src/use-cases/analytics.ts:6-11`
- Test: `packages/domain/src/analytics/portfolio-metrics.test.ts`

**Step 1: Write a test for filtered portfolio metrics**

In `packages/domain/src/analytics/portfolio-metrics.test.ts`, add:

```typescript
it("computes metrics for a filtered subset of assets", () => {
  const assets = [
    makeAsset({ type: "patent", status: "granted" }),
    makeAsset({ type: "trademark", status: "filed" }),
    makeAsset({ type: "patent", status: "filed" }),
  ];
  const patentsOnly = assets.filter((a) => a.type === "patent");
  const metrics = computePortfolioMetrics(patentsOnly, new Date("2026-03-09"));
  expect(metrics.totalAssets).toBe(2);
  expect(metrics.byType.patent).toBe(2);
  expect(metrics.byType.trademark).toBe(0);
});
```

**Step 2: Run test to verify it passes**

Run: `cd packages/domain && npx vitest run src/analytics/portfolio-metrics.test.ts`
Expected: PASS (the domain function already works on any array subset — this confirms the approach)

**Step 3: Update `computePortfolioMetricsUseCase` to accept optional filter**

In `packages/application/src/use-cases/analytics.ts`, modify:

```typescript
import type { OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import { type PortfolioMetrics, computePortfolioMetrics, type DeadlineMetrics, computeDeadlineMetrics, type AssetFilter, filterAssets } from "@ipms/domain";
import type { AssetRepository, DeadlineRepository } from "../ports.js";

export function computePortfolioMetricsUseCase(repo: AssetRepository) {
  return async (orgId: OrganizationId, now: Date, filter?: AssetFilter): Promise<Result<PortfolioMetrics>> => {
    const allAssets = await repo.findAll(orgId);
    const assets = filter ? filterAssets(allAssets, filter) : allAssets;
    return ok(computePortfolioMetrics(assets, now));
  };
}
```

**Step 4: Update `computeDeadlineMetricsUseCase` to accept optional filter**

Deadlines need to be filtered by their associated asset's properties. Add `AssetRepository` dependency:

```typescript
export function computeDeadlineMetricsUseCase(deadlineRepo: DeadlineRepository, assetRepo?: AssetRepository) {
  return async (orgId: OrganizationId, now: Date, filter?: AssetFilter): Promise<Result<DeadlineMetrics>> => {
    const deadlines = await deadlineRepo.findAll(orgId);
    if (filter && assetRepo) {
      const allAssets = await assetRepo.findAll(orgId);
      const filtered = filterAssets(allAssets, filter);
      const assetIds = new Set(filtered.map((a) => a.id));
      return ok(computeDeadlineMetrics(deadlines.filter((d) => assetIds.has(d.assetId)), now));
    }
    return ok(computeDeadlineMetrics(deadlines, now));
  };
}
```

**Step 5: Update the use-case wiring in the web app**

In `apps/web/src/lib/server/use-cases.ts`, update the deadline metrics wiring to pass both repos:

```typescript
export const computeDeadlineMetrics = computeDeadlineMetricsUseCase(deadlineRepo, assetRepo);
```

**Step 6: Run existing tests to confirm no regressions**

Run: `cd packages/domain && npx vitest run`
Run: `cd packages/application && npx vitest run`
Expected: All PASS

**Step 7: Commit**

```bash
git add packages/application/src/use-cases/analytics.ts packages/domain/src/analytics/portfolio-metrics.test.ts apps/web/src/lib/server/use-cases.ts
git commit -m "feat: add optional filter param to portfolio and deadline metrics use cases"
```

---

### Task 2: Update API endpoints to accept filter query params

**Files:**
- Modify: `apps/web/src/routes/api/analytics/portfolio/+server.ts`
- Modify: `apps/web/src/routes/api/analytics/deadlines/+server.ts`
- Modify: `apps/web/src/routes/api/assets/+server.ts`

**Step 1: Create a shared helper to parse filter query params**

Create `apps/web/src/lib/server/parse-filter-params.ts`:

```typescript
import type { AssetFilter } from "@ipms/domain";
import type { AssetStatus, IPType } from "@ipms/shared";
import { IP_TYPES, ASSET_STATUSES } from "@ipms/shared";

export function parseFilterParams(url: URL): AssetFilter | undefined {
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const jurisdiction = url.searchParams.get("jurisdiction");

  if (!type && !status && !jurisdiction) return undefined;

  const filter: AssetFilter = {};
  if (type && (IP_TYPES as readonly string[]).includes(type)) {
    (filter as { type?: IPType[] }).type = [type as IPType];
  }
  if (status && (ASSET_STATUSES as readonly string[]).includes(status)) {
    (filter as { status?: AssetStatus[] }).status = [status as AssetStatus];
  }
  if (jurisdiction) {
    (filter as { jurisdiction?: string }).jurisdiction = jurisdiction;
  }
  return filter;
}
```

**Step 2: Update portfolio endpoint**

In `apps/web/src/routes/api/analytics/portfolio/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { computePortfolioMetrics } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseFilterParams } from "$lib/server/parse-filter-params";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const filter = parseFilterParams(event.url);
  const result = await computePortfolioMetrics(auth.value.organizationId, new Date(), filter);
  return resultToResponse(result);
};
```

**Step 3: Update deadlines endpoint**

In `apps/web/src/routes/api/analytics/deadlines/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { computeDeadlineMetrics } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseFilterParams } from "$lib/server/parse-filter-params";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "deadline:read");
  if (forbidden) return forbidden;

  const filter = parseFilterParams(event.url);
  const result = await computeDeadlineMetrics(auth.value.organizationId, new Date(), filter);
  return resultToResponse(result);
};
```

**Step 4: Update assets endpoint**

In `apps/web/src/routes/api/assets/+server.ts`, update the GET handler to use `listAssetsFiltered` when params are present:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { listAssets, listAssetsFiltered, createAsset } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";
import type { AssetStatus } from "@ipms/shared";
import { assetRepo } from "$lib/server/repositories";
import { parseFilterParams } from "$lib/server/parse-filter-params";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const filter = parseFilterParams(event.url);
  const result = filter
    ? await listAssetsFiltered(auth.value.organizationId, filter)
    : await listAssets(auth.value.organizationId);
  return resultToResponse(result);
};
```

**Step 5: Verify the app builds**

Run: `cd apps/web && npx svelte-kit sync && npx tsc --noEmit`
Expected: No type errors

**Step 6: Commit**

```bash
git add apps/web/src/lib/server/parse-filter-params.ts apps/web/src/routes/api/analytics/portfolio/+server.ts apps/web/src/routes/api/analytics/deadlines/+server.ts apps/web/src/routes/api/assets/+server.ts
git commit -m "feat: add filter query params to dashboard API endpoints"
```

---

### Task 3: Update dashboard UI with 3 filter chip rows and reactive fetching

**Files:**
- Modify: `apps/web/src/routes/(app)/dashboard/+page.svelte`

**Step 1: Replace filter state and chip definitions**

Replace lines 10-17 of `+page.svelte` with:

```svelte
let activeType = $state("all");
let activeStatus = $state("all");
let activeJurisdiction = $state("all");

const typeFilters = [
  { id: "all", label: "All" },
  { id: "patent", label: "Patents" },
  { id: "trademark", label: "Trademarks" },
  { id: "copyright", label: "Copyrights" },
  { id: "design-right", label: "Design Rights" },
];

const statusFilters = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "filed", label: "Filed" },
  { id: "published", label: "Published" },
  { id: "granted", label: "Granted" },
  { id: "expired", label: "Expired" },
  { id: "abandoned", label: "Abandoned" },
];
```

**Step 2: Add jurisdiction chips derived from assets + fetch helper**

After the existing `loading` state declaration, add:

```typescript
let allAssets = $state<Asset[]>([]);

const jurisdictionFilters = $derived(() => {
  const seen = new Map<string, string>();
  for (const a of allAssets) {
    if (!seen.has(a.jurisdiction.code)) {
      seen.set(a.jurisdiction.code, a.jurisdiction.name);
    }
  }
  return [
    { id: "all", label: "All" },
    ...[...seen.entries()].map(([code, name]) => ({
      id: code,
      label: `${countryFlag(code)} ${code}`,
    })),
  ];
});

function buildFilterParams(): string {
  const params = new URLSearchParams();
  if (activeType !== "all") params.set("type", activeType);
  if (activeStatus !== "all") params.set("status", activeStatus);
  if (activeJurisdiction !== "all") params.set("jurisdiction", activeJurisdiction);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function fetchDashboardData() {
  loading = true;
  try {
    const qs = buildFilterParams();
    const [portfolioRes, deadlinesRes, assetsRes] = await Promise.all([
      fetch(`/api/analytics/portfolio${qs}`),
      fetch(`/api/analytics/deadlines${qs}`),
      fetch(`/api/assets${qs}`),
    ]);

    if (portfolioRes.ok) portfolioMetrics = await portfolioRes.json();
    if (deadlinesRes.ok) deadlineMetrics = await deadlinesRes.json();
    if (assetsRes.ok) assets = await assetsRes.json();
  } catch {
    // Gracefully handle fetch errors
  } finally {
    loading = false;
  }
}
```

**Step 3: Replace `onMount` and add `$effect` for filter changes**

Replace the existing `onMount` block with:

```typescript
onMount(async () => {
  try {
    const res = await fetch("/api/assets");
    if (res.ok) allAssets = await res.json();
  } catch {
    // Gracefully handle
  }
  await fetchDashboardData();
});

$effect(() => {
  // Track these reactive values
  activeType;
  activeStatus;
  activeJurisdiction;
  // Skip the initial mount fetch (handled by onMount)
  if (allAssets.length === 0 && activeType === "all" && activeStatus === "all" && activeJurisdiction === "all") return;
  fetchDashboardData();
});
```

**Step 4: Replace the filter pills HTML**

Replace the "Filter Pills" section (lines 176-188) with:

```svelte
<!-- Filter Chips -->
<div class="mt-5 flex flex-col gap-2">
  <!-- Type -->
  <div class="flex items-center gap-2">
    <span class="w-20 text-xs font-medium text-[var(--color-neutral-400)]">Type</span>
    <div class="flex flex-wrap items-center gap-1.5">
      {#each typeFilters as filter}
        <button
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {activeType === filter.id
            ? 'border-[var(--color-neutral-900)] bg-white text-[var(--color-neutral-900)] shadow-sm'
            : 'border-[var(--border-color)] bg-white/60 text-[var(--color-neutral-500)] hover:bg-white hover:text-[var(--color-neutral-700)]'}"
          onclick={() => (activeType = filter.id)}
        >
          {filter.label}
        </button>
      {/each}
    </div>
  </div>
  <!-- Status -->
  <div class="flex items-center gap-2">
    <span class="w-20 text-xs font-medium text-[var(--color-neutral-400)]">Status</span>
    <div class="flex flex-wrap items-center gap-1.5">
      {#each statusFilters as filter}
        <button
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {activeStatus === filter.id
            ? 'border-[var(--color-neutral-900)] bg-white text-[var(--color-neutral-900)] shadow-sm'
            : 'border-[var(--border-color)] bg-white/60 text-[var(--color-neutral-500)] hover:bg-white hover:text-[var(--color-neutral-700)]'}"
          onclick={() => (activeStatus = filter.id)}
        >
          {filter.label}
        </button>
      {/each}
    </div>
  </div>
  <!-- Jurisdiction -->
  <div class="flex items-center gap-2">
    <span class="w-20 text-xs font-medium text-[var(--color-neutral-400)]">Region</span>
    <div class="flex flex-wrap items-center gap-1.5">
      {#each jurisdictionFilters() as filter}
        <button
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {activeJurisdiction === filter.id
            ? 'border-[var(--color-neutral-900)] bg-white text-[var(--color-neutral-900)] shadow-sm'
            : 'border-[var(--border-color)] bg-white/60 text-[var(--color-neutral-500)] hover:bg-white hover:text-[var(--color-neutral-700)]'}"
          onclick={() => (activeJurisdiction = filter.id)}
        >
          {filter.label}
        </button>
      {/each}
    </div>
  </div>
</div>
```

**Step 5: Verify the app runs and filters work**

Run: `cd apps/web && npm run dev`
Manual test: Click filter chips, verify all dashboard sections update.

**Step 6: Commit**

```bash
git add apps/web/src/routes/\(app\)/dashboard/+page.svelte
git commit -m "feat: connect dashboard filter chips to server-side filtering"
```

---

### Task 4: Manual QA & edge cases

**Step 1: Test with no assets**
- Verify dashboard shows placeholders when filters match zero assets
- Verify jurisdiction chips show only "All" when no assets exist

**Step 2: Test filter combinations**
- Select a type, then a status → both should apply (AND)
- Reset one filter to "All" → should only apply the other
- Reset all to "All" → should show full unfiltered view

**Step 3: Test jurisdiction chip updates**
- Jurisdiction chips should reflect the full (unfiltered) set of jurisdictions, not the currently filtered set

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address edge cases in dashboard filter chips"
```
