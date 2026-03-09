# Phase 2: Portfolio Analytics & Advanced Filtering — Design

## Decisions

- In-memory repositories with seed data (no PostgreSQL yet)
- Analytics as pure domain functions (Approach A — in `packages/domain`)
- StatusChangeEvent as a separate entity (not embedded in IPAsset)
- Client-side filtering with typed filter params object
- Replace hardcoded dashboard with computed analytics data
- Scope: portfolio metrics, deadline metrics, asset timeline, advanced filtering
- Deferred: bulk operations, CSV/PDF export, PostgreSQL, database migrations

## New Domain Entities

### StatusChangeEvent

```typescript
interface StatusChangeEvent {
  readonly id: StatusChangeEventId;
  readonly assetId: AssetId;
  readonly fromStatus: AssetStatus | null; // null for initial creation
  readonly toStatus: AssetStatus;
  readonly changedAt: Date;
  readonly changedBy: string;
  readonly organizationId: OrganizationId;
}
```

Pure function: `createStatusChangeEvent(input): Result<StatusChangeEvent>`

### AssetFilter

```typescript
interface AssetFilter {
  readonly status?: AssetStatus[];
  readonly type?: IPType[];
  readonly jurisdiction?: string;
  readonly owner?: string;
  readonly search?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}
```

Pure function: `filterAssets(assets: IPAsset[], filter: AssetFilter): IPAsset[]`

## Analytics Functions

Located in `packages/domain/src/analytics/`.

### Portfolio Metrics

```typescript
interface PortfolioMetrics {
  readonly totalAssets: number;
  readonly byStatus: Record<AssetStatus, number>;
  readonly byType: Record<IPType, number>;
  readonly byJurisdiction: { code: string; name: string; count: number }[];
  readonly expiringWithin90Days: number;
}

function computePortfolioMetrics(assets: IPAsset[]): PortfolioMetrics
```

### Deadline Metrics

```typescript
interface DeadlineMetrics {
  readonly total: number;
  readonly overdue: number;
  readonly upcoming: number;
  readonly completed: number;
  readonly completionRate: number;
  readonly overdueByType: Record<DeadlineType, number>;
}

function computeDeadlineMetrics(deadlines: Deadline[], now: Date): DeadlineMetrics
```

All analytics functions are pure — `now: Date` is passed as a parameter.

## Repository & Application Layer

### New port

```typescript
interface StatusChangeEventRepository {
  findByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<readonly StatusChangeEvent[]>;
  findAll(orgId: OrganizationId): Promise<readonly StatusChangeEvent[]>;
  save(event: StatusChangeEvent): Promise<void>;
}
```

### New in-memory implementation

`packages/infrastructure/src/in-memory-status-change-event-repository.ts`

### Modified use case

`updateAssetStatusUseCase` gains a second repository parameter (`StatusChangeEventRepository`) and creates a `StatusChangeEvent` on each successful status transition.

### New use cases

- `computePortfolioMetricsUseCase(assetRepo)` — fetches assets, calls `computePortfolioMetrics()`
- `computeDeadlineMetricsUseCase(deadlineRepo)` — fetches deadlines, calls `computeDeadlineMetrics()`
- `getAssetTimelineUseCase(eventRepo)` — fetches status change events for an asset
- `listAssetsFilteredUseCase(assetRepo)` — fetches all assets, applies `filterAssets()`

## UI Changes

### Dashboard (`/`)

Replaces hardcoded data with computed analytics:

- Stats cards: fed by `PortfolioMetrics`
- Recent assets table: actual asset data sorted by `updatedAt`
- Deadline sidebar: fed by `DeadlineMetrics` + upcoming deadlines
- Portfolio health card: computed health score (granted / total non-abandoned)

### Assets page (`/assets`)

- Filter bar: jurisdiction dropdown, owner dropdown, date range
- Search input filters on title
- Client-side filtering via `filterAssets()`
- Column sorting

### Asset detail (`/assets/[id]`)

- Timeline section showing `StatusChangeEvent` history
- Chronological list: `fromStatus → toStatus` with date and changedBy

### New feature modules

```
features/analytics/   — data.ts, helpers.ts
features/timeline/    — data.ts, helpers.ts
```

### New API routes

```
GET /api/analytics/portfolio     → PortfolioMetrics
GET /api/analytics/deadlines     → DeadlineMetrics
GET /api/assets/[id]/timeline    → StatusChangeEvent[]
```

## Testing

### Domain (pure unit tests)

- `analytics/portfolio-metrics.test.ts` — asset distributions, edge cases
- `analytics/deadline-metrics.test.ts` — overdue/upcoming/completed, boundaries
- `asset.test.ts` — `filterAssets` per field and combinations
- `status-change-event.test.ts` — creation validation

### Application (integration)

- `analytics-use-cases.test.ts` — wiring verification
- `update-asset-status.test.ts` — status change emits event

### E2E (Playwright)

- `analytics.spec.ts` — dashboard loads computed stats
- `assets.spec.ts` — filtering works

Estimated: ~30-40 new tests.

## Files Changed Summary

| Layer | Change |
|-------|--------|
| shared | Add `StatusChangeEventId` branded type |
| domain | Add `StatusChangeEvent` entity + create function |
| domain | Add `AssetFilter` + `filterAssets()` |
| domain | Add `analytics/portfolio-metrics.ts` |
| domain | Add `analytics/deadline-metrics.ts` |
| application | Add `StatusChangeEventRepository` port |
| application | Add analytics, timeline, filtered listing use cases |
| application | Modify `updateAssetStatusUseCase` to emit events |
| infrastructure | Add `InMemoryStatusChangeEventRepository` |
| apps/web | Add API routes for analytics and timeline |
| apps/web | Replace hardcoded dashboard with computed data |
| apps/web | Add filter bar to assets page |
| apps/web | Add timeline to asset detail page |
| apps/web | Add `features/analytics/` and `features/timeline/` |
| tests | ~30-40 new tests |
| docs | Update domain-model.md, architecture.md, roadmap.md |
