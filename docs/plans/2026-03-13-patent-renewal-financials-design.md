# Patent Renewal Decisions & Financial Data

**Date:** 2026-03-13
**Status:** Approved

## Problem

Users need to decide whether to renew or abandon patents but have no financial data or decision-support tools. Renewal costs vary by jurisdiction and maintenance year, and there's no way to evaluate whether a patent is worth its renewal cost.

## Goals

- Let users quickly decide to renew or abandon patents with cost and value data
- Provide a built-in fee schedule (20+ jurisdictions) with manual override
- Compute a composite recommendation score (financial + strategic)
- Offer portfolio-level financial analytics and cost projections

## Approach

"Financial Layer" — add new domain entities, database tables, API endpoints, and UI surfaces that integrate into the existing FC&IS architecture.

---

## 1. Data Model

### Table: `renewal_fees` — Official fee schedule

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| jurisdiction_code | text | Country code (EP, US, FR, DE, JP, CN...) |
| year | int | Maintenance year (3, 4, 5... 20) |
| official_fee | decimal | Official fee in EUR |
| typical_agent_fee | decimal (nullable) | Average agent fee in EUR |
| currency | text | Original currency (USD, EUR, JPY...) |
| official_fee_local | decimal | Fee in local currency |
| updated_at | timestamp | Last schedule update |

Coverage: 20+ jurisdictions — EP, US, CN, JP, KR, FR, DE, GB, NL, IT, ES, CH, AU, CA, BR, IN, SE, AT, BE, DK, FI, IE, PL, PT.

### Table: `renewal_decisions` — Per-renewal decision record

| Column | Type | Description |
|--------|------|-------------|
| id | uuid PK | |
| deadline_id | uuid FK -> deadlines | The renewal deadline |
| asset_id | uuid FK -> assets | The patent |
| organization_id | uuid | Tenant |
| estimated_cost | decimal | Estimated cost (official + agent) |
| cost_override | decimal (nullable) | Manual override |
| score | decimal | Composite score 0-100 |
| score_breakdown | jsonb | `{costScore, citationScore, coverageScore, ageScore}` |
| decision | text | `pending` / `renew` / `abandon` |
| decided_by | text (nullable) | User who decided |
| decided_at | timestamp (nullable) | Decision timestamp |
| notes | text (nullable) | Free-form comment |
| created_at | timestamp | |
| updated_at | timestamp | |

### Domain Types

```typescript
// packages/domain/src/renewal-fee.ts
interface RenewalFee {
  readonly id: RenewalFeeId;
  readonly jurisdictionCode: string;
  readonly year: number;
  readonly officialFee: number;
  readonly typicalAgentFee: number | null;
  readonly currency: string;
  readonly officialFeeLocal: number;
}

// packages/domain/src/renewal-decision.ts
type DecisionStatus = "pending" | "renew" | "abandon";

interface ScoreBreakdown {
  readonly costScore: number;     // 0-25
  readonly citationScore: number; // 0-25
  readonly coverageScore: number; // 0-25
  readonly ageScore: number;      // 0-25
}

interface RenewalDecision {
  readonly id: RenewalDecisionId;
  readonly deadlineId: DeadlineId;
  readonly assetId: AssetId;
  readonly organizationId: OrganizationId;
  readonly estimatedCost: number;
  readonly costOverride: number | null;
  readonly score: number;
  readonly scoreBreakdown: ScoreBreakdown;
  readonly decision: DecisionStatus;
  readonly decidedBy: string | null;
  readonly decidedAt: Date | null;
  readonly notes: string | null;
}
```

### Pure Function — Composite Score

```typescript
// packages/domain/src/renewal-score.ts
function computeRenewalScore(params: {
  renewalCost: number;
  portfolioAvgCost: number;
  citingPatentsCount: number;
  jurisdictionCount: number;
  patentAgeYears: number;
  maxPatentAge: number; // typically 20
}): { score: number; breakdown: ScoreBreakdown }
```

Each criterion is worth 0-25 points, total 0-100. Higher score = stronger recommendation to renew.

- **costScore (0-25):** Lower cost relative to portfolio average = higher score
- **citationScore (0-25):** More citing patents = higher score
- **coverageScore (0-25):** More jurisdictions covered by the patent family = higher score
- **ageScore (0-25):** Younger patents score higher (more remaining life = more value)

---

## 2. API Endpoints

### Fee Schedule

| Method | Route | Description | Permission |
|--------|-------|-------------|------------|
| GET | `/api/renewal-fees?jurisdiction=EP` | List fees by jurisdiction | `renewal-fee:read` |
| PUT | `/api/renewal-fees` | Import/update schedule (admin) | `renewal-fee:write` |

### Renewal Decisions

| Method | Route | Description | Permission |
|--------|-------|-------------|------------|
| GET | `/api/renewal-decisions` | List all decisions (pending by default) | `renewal-decision:read` |
| GET | `/api/renewal-decisions/:id` | Decision detail with score breakdown | `renewal-decision:read` |
| PATCH | `/api/renewal-decisions/:id` | Make a decision (renew/abandon) + notes | `renewal-decision:write` |
| POST | `/api/renewal-decisions/generate` | Generate decisions for upcoming renewals | `renewal-decision:write` |

### Portfolio Financials

| Method | Route | Description | Permission |
|--------|-------|-------------|------------|
| GET | `/api/portfolios/:id/financials` | Financial dashboard data | `portfolio:read` |
| GET | `/api/portfolios/:id/projections?years=5` | Cost projection over N years | `portfolio:read` |

### Use Cases (Application Layer)

```
generateRenewalDecisionsUseCase(deadlineRepo, assetRepo, feeRepo, decisionRepo)
  For each upcoming "renewal" deadline without a decision:
    1. Look up fee schedule for jurisdiction + year
    2. Compute composite score
    3. Create RenewalDecision with status "pending"

makeRenewalDecisionUseCase(decisionRepo)
  Update decision, decidedBy, decidedAt, notes

getPortfolioFinancialsUseCase(portfolioRepo, assetRepo, decisionRepo, feeRepo)
  Aggregate: total cost, cost by jurisdiction, cost by type,
  decision history, renew/abandon ratio

projectPortfolioCostsUseCase(portfolioRepo, assetRepo, feeRepo)
  Project costs over N years based on fee schedule and active assets
```

---

## 3. UI Surfaces

### 3a — Enriched `/deadlines` page

Renewal-type deadlines gain:
- Estimated cost displayed next to the type badge (e.g. `1,575 EUR`)
- Score gauge (red 0-33, amber 34-66, green 67-100)
- Decision indicator pill: Pending / Renewed / Abandoned
- Quick action buttons: "Renew" / "Abandon" (only when pending)

Non-renewal deadlines remain unchanged.

### 3b — New `/renewal-decisions` page

**Header stats cards:**
- Total pending | Total cost pending | Renewed this year | Saved by abandoning

**Filters:**
- By score range (High / Medium / Low)
- By jurisdiction
- By cost range
- By status (Pending / Renew / Abandon)

**Main table:**

| Patent | Jurisdiction | Year | Est. Cost | Score | Recommendation | Decision | Actions |

Each row expands to a detail panel:
- Score breakdown (4 bars: Cost / Citations / Coverage / Age)
- Patent details (title, publications, dates)
- Past renewal history
- Notes field + Renew / Abandon buttons

**Batch decisions:**
- Checkbox per row
- Floating action bar: "Renew selected" / "Abandon selected"

### 3c — Financial dashboard in `/portfolios/[id]`

New section below existing assets:

**"Portfolio Financials" card:**
- Total annual cost — sum of current year renewals
- Projection chart — stacked bar chart over 5 years (cost by jurisdiction)
- Jurisdiction breakdown — donut chart (EP 35%, US 25%, JP 15%...)
- Type breakdown — patents vs trademarks vs designs
- Cost vs Value — scatter plot (x = cumulative cost, y = score) to identify expensive low-value patents (bottom-right quadrant = abandon candidates)
- Savings realized — total costs avoided from abandon decisions

---

## 4. Seed Data

Populate `renewal_fees` with official fee schedules for 20+ jurisdictions. Generate sample `renewal_decisions` for existing renewal deadlines in dev/demo environments.

---

## 5. Out of Scope (for now)

- Multi-currency real-time conversion (use fixed EUR rates in fee schedule)
- External API integration for live fee updates
- Multi-user approval workflow (keep single-user decisions)
- Invoice/payment tracking
- Automated renewal filing with patent offices
