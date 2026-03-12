# Dashboard Filter Chips Design

## Summary

Add interactive filter chips to the dashboard page that filter all displayed data (Asset Tracker stats, Recent Assets table, For You Today deadlines, Portfolio Health) server-side via query params on existing API endpoints.

## UI Design

Three rows of single-select filter chips in the hero section:

1. **Type**: All | Patents | Trademarks | Copyrights | Design Rights
2. **Status**: All | Draft | Filed | Published | Granted | Expired | Abandoned
3. **Jurisdiction**: All | dynamic chips from user's assets (with country flag emoji)

- Single-select per category, "All" = no filter for that dimension
- Filters combine with AND across categories
- Existing chip styling preserved (rounded-full, border, active state with shadow)

## Data Flow

```
Chip click → activeFilter state change
  → re-fetch 3 endpoints with query params (?type=patent&status=granted&jurisdiction=US)
  → server filters assets/deadlines before computing metrics
  → dashboard updates reactively
```

## Server Changes

### `/api/analytics/portfolio` endpoint
- Read optional query params: `type`, `status`, `jurisdiction`
- Pass filters to use case which filters assets before `computePortfolioMetrics()`

### `/api/analytics/deadlines` endpoint
- Read optional query params: `type`, `status`, `jurisdiction`
- Filter deadlines by joining through asset's type/status/jurisdiction

### `/api/assets` endpoint
- Read optional query params: `type`, `status`, `jurisdiction`
- Filter assets before returning (reuse existing `listAssetsFiltered` or filter in use case)

## Client Changes (Dashboard)

### State
- `activeType = "all"`, `activeStatus = "all"`, `activeJurisdiction = "all"`
- `availableJurisdictions` derived from initial asset fetch

### Reactivity
- `$effect` watches filter state changes → re-fetches all 3 endpoints with query params
- Initial load fetches unfiltered data (same as current behavior)

## Key Decisions

- **Server-side filtering**: metrics are recalculated on filtered subsets for accuracy
- **Single-select per category**: simpler UX, one click = one fetch
- **Dynamic jurisdiction chips**: only shows jurisdictions present in user's portfolio
- **No debounce needed**: discrete chip clicks, not continuous input
