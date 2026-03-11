# Phase 4c + 4d: Prior Art Search & Deadline Risk — Design

## Phase 4c: Prior Art Search

### Overview

Automated prior art search using USPTO PatentsView API + Claude for relevance analysis. Results are stored and linked to assets for later consultation.

### Decisions

- **Patent office:** USPTO PatentsView API only (free, no API key)
- **Relevance analysis:** Claude evaluates each patent's relevance (score 1-10 + reasoning)
- **Storage:** New `PriorArtResult` entity stored in database
- **Search context:** User can optionally provide keywords; falls back to asset title/metadata

### New Types

```typescript
// @ipms/shared
export type PriorArtResultId = Brand<string, "PriorArtResultId">;

// @ipms/domain
export interface PriorArtResult {
  readonly id: PriorArtResultId;
  readonly assetId: AssetId;
  readonly organizationId: OrganizationId;
  readonly patentNumber: string;
  readonly title: string;
  readonly abstractText: string;
  readonly relevanceScore: number; // 1-10
  readonly relevanceReasoning: string;
  readonly source: "uspto";
  readonly searchedAt: Date;
}
```

### New Ports

```typescript
export interface PatentSearchService {
  search(query: string, limit: number): Promise<readonly { patentNumber: string; title: string; abstractText: string }[]>;
}

export interface PriorArtResultRepository {
  save(result: PriorArtResult): Promise<void>;
  findByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<readonly PriorArtResult[]>;
  deleteByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<void>;
}
```

### Implementations

- `createUSPTOPatentSearchService()` — calls PatentsView API
- `createNoOpPatentSearchService()` — returns empty results for tests/dev
- In-memory + PostgreSQL `PriorArtResultRepository`

### Use Cases

- `searchPriorArtUseCase(assetRepo, patentSearchService, aiService, priorArtRepo)` — fetches asset, queries USPTO, sends results to Claude for relevance scoring, stores results
- `listPriorArtUseCase(priorArtRepo)` — returns stored results for an asset

### API Routes

| Route | Method | Permission | Body | Response |
|-------|--------|------------|------|----------|
| `/api/assets/[id]/prior-art` | POST | `asset:read` | `{ keywords?: string }` | `PriorArtResult[]` |
| `/api/assets/[id]/prior-art` | GET | `asset:read` | — | `PriorArtResult[]` |

### Changes to Existing Code

- New branded type + parse function in shared
- New entity in domain
- New ports in application
- New implementations in infrastructure
- New migration: `prior_art_results` table
- Wire in web app

---

## Phase 4d: Deadline Risk Prediction

### Overview

Pure heuristic-based deadline risk scoring. Computed on-the-fly, no storage needed.

### Decisions

- **Approach:** Pure domain heuristics (no AI/ML)
- **Storage:** None — calculated at request time
- **Scoring:** 1-10 scale based on multiple factors

### New Types

```typescript
// @ipms/domain
export interface DeadlineRisk {
  readonly deadlineId: DeadlineId;
  readonly score: number; // 1-10
  readonly factors: readonly string[];
}
```

### Heuristics

- **Completed:** score = 0, no factors
- **Overdue:** score = 10, factor "Deadline is overdue"
- **Proximity:** closer deadline = higher score (7 days = 8, 14 days = 6, 30 days = 4, 60 days = 2, else 1)
- **Concurrent deadlines:** multiple deadlines within same 7-day window increase score (+1 per concurrent deadline, capped at 10)

### Use Case

- `computeDeadlineRiskUseCase(deadlineRepo)` — takes `(orgId)`, returns `Result<readonly DeadlineRisk[]>`

### API Route

| Route | Method | Permission | Response |
|-------|--------|------------|----------|
| `/api/deadline-risks` | GET | `asset:read` | `DeadlineRisk[]` |

### Changes to Existing Code

- New type in domain entities
- New pure function in domain
- New use case in application
- New route in web app
- No new ports, repos, or migrations
