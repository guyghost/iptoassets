# Patent Renewal Decisions & Financial Data — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add financial data layer for patent renewal decisions with fee schedules, composite scoring, dedicated UI, and portfolio analytics.

**Architecture:** Extends existing FC&IS architecture. New domain entities (`RenewalFee`, `RenewalDecision`) with pure function scoring, repository ports/adapters (Postgres + in-memory), use cases, API endpoints, and Svelte 5 UI pages. Follows existing branded-type, Result monad, and drizzle-orm patterns exactly.

**Tech Stack:** TypeScript, @ipms/shared (branded types), @ipms/domain (pure functions), @ipms/application (use cases + ports), @ipms/infrastructure (drizzle-orm Postgres + in-memory), SvelteKit (API routes + pages), Vitest, Tailwind CSS.

---

## Task 1: Add branded types for RenewalFee and RenewalDecision

**Files:**
- Modify: `packages/shared/src/brand.ts`
- Modify: `packages/shared/src/validation.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/validation.test.ts`

**Step 1: Add branded types**

In `packages/shared/src/brand.ts`, add after line 12 (`PriorArtResultId`):

```typescript
export type RenewalFeeId = Brand<string, "RenewalFeeId">;
export type RenewalDecisionId = Brand<string, "RenewalDecisionId">;
```

**Step 2: Add parse functions**

In `packages/shared/src/validation.ts`, add after `parsePriorArtResultId`:

```typescript
export function parseRenewalFeeId(input: string): Result<RenewalFeeId> {
  return UUID_RE.test(input)
    ? ok(input as RenewalFeeId)
    : err("Invalid RenewalFeeId: must be UUID format");
}

export function parseRenewalDecisionId(input: string): Result<RenewalDecisionId> {
  return UUID_RE.test(input)
    ? ok(input as RenewalDecisionId)
    : err("Invalid RenewalDecisionId: must be UUID format");
}
```

Add the imports for `RenewalFeeId` and `RenewalDecisionId` from `"./brand.js"`.

**Step 3: Export from index**

In `packages/shared/src/index.ts`, add to the brand type exports:

```typescript
export type { RenewalFeeId, RenewalDecisionId } from "./brand.js";
```

Add to the validation exports:

```typescript
export { parseRenewalFeeId, parseRenewalDecisionId } from "./validation.js";
```

**Step 4: Add tests**

In `packages/shared/src/validation.test.ts`, add:

```typescript
import { parseRenewalFeeId, parseRenewalDecisionId } from "./validation.js";

describe("parseRenewalFeeId", () => {
  it("accepts valid UUID", () => {
    const result = parseRenewalFeeId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });
  it("rejects invalid UUID", () => {
    const result = parseRenewalFeeId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid RenewalFeeId: must be UUID format" });
  });
});

describe("parseRenewalDecisionId", () => {
  it("accepts valid UUID", () => {
    const result = parseRenewalDecisionId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });
  it("rejects invalid UUID", () => {
    const result = parseRenewalDecisionId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid RenewalDecisionId: must be UUID format" });
  });
});
```

**Step 5: Run tests**

Run: `cd packages/shared && pnpm test`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add packages/shared/src/brand.ts packages/shared/src/validation.ts packages/shared/src/index.ts packages/shared/src/validation.test.ts
git commit -m "feat: add RenewalFeeId and RenewalDecisionId branded types"
```

---

## Task 2: Add domain entities (RenewalFee, RenewalDecision, DecisionStatus)

**Files:**
- Modify: `packages/domain/src/entities.ts`
- Modify: `packages/domain/src/index.ts`

**Step 1: Add entities to entities.ts**

In `packages/domain/src/entities.ts`, add the import for new branded types:

```typescript
import type { RenewalFeeId, RenewalDecisionId } from "@ipms/shared";
```

Add after `PriorArtResult` interface:

```typescript
export const DECISION_STATUSES = ["pending", "renew", "abandon"] as const;
export type DecisionStatus = (typeof DECISION_STATUSES)[number];

export interface ScoreBreakdown {
  readonly costScore: number;
  readonly citationScore: number;
  readonly coverageScore: number;
  readonly ageScore: number;
}

export interface RenewalFee {
  readonly id: RenewalFeeId;
  readonly jurisdictionCode: string;
  readonly year: number;
  readonly officialFee: number;
  readonly typicalAgentFee: number | null;
  readonly currency: string;
  readonly officialFeeLocal: number;
  readonly updatedAt: Date;
}

export interface RenewalDecision {
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
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
```

**Step 2: Export from domain index**

In `packages/domain/src/index.ts`, add to the entities exports (line 3 area):

```typescript
export type { RenewalFee, RenewalDecision, ScoreBreakdown, DecisionStatus } from "./entities.js";
export { DECISION_STATUSES } from "./entities.js";
```

**Step 3: Commit**

```bash
git add packages/domain/src/entities.ts packages/domain/src/index.ts
git commit -m "feat: add RenewalFee and RenewalDecision domain entities"
```

---

## Task 3: Implement renewal score pure function with TDD

**Files:**
- Create: `packages/domain/src/renewal-score.ts`
- Create: `packages/domain/src/renewal-score.test.ts`
- Modify: `packages/domain/src/index.ts`

**Step 1: Write failing tests**

Create `packages/domain/src/renewal-score.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeRenewalScore } from "./renewal-score.js";

describe("computeRenewalScore", () => {
  const baseParams = {
    renewalCost: 1000,
    portfolioAvgCost: 1000,
    citingPatentsCount: 5,
    jurisdictionCount: 3,
    patentAgeYears: 10,
    maxPatentAge: 20,
  };

  it("returns a score between 0 and 100", () => {
    const result = computeRenewalScore(baseParams);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns a breakdown with four components summing to the score", () => {
    const result = computeRenewalScore(baseParams);
    const { costScore, citationScore, coverageScore, ageScore } = result.breakdown;
    expect(costScore + citationScore + coverageScore + ageScore).toBe(result.score);
  });

  it("each component is between 0 and 25", () => {
    const result = computeRenewalScore(baseParams);
    const { costScore, citationScore, coverageScore, ageScore } = result.breakdown;
    for (const s of [costScore, citationScore, coverageScore, ageScore]) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(25);
    }
  });

  it("gives higher costScore when cost is below average", () => {
    const cheap = computeRenewalScore({ ...baseParams, renewalCost: 200 });
    const expensive = computeRenewalScore({ ...baseParams, renewalCost: 3000 });
    expect(cheap.breakdown.costScore).toBeGreaterThan(expensive.breakdown.costScore);
  });

  it("gives higher citationScore with more citations", () => {
    const many = computeRenewalScore({ ...baseParams, citingPatentsCount: 20 });
    const few = computeRenewalScore({ ...baseParams, citingPatentsCount: 0 });
    expect(many.breakdown.citationScore).toBeGreaterThan(few.breakdown.citationScore);
  });

  it("gives higher coverageScore with more jurisdictions", () => {
    const wide = computeRenewalScore({ ...baseParams, jurisdictionCount: 10 });
    const narrow = computeRenewalScore({ ...baseParams, jurisdictionCount: 1 });
    expect(wide.breakdown.coverageScore).toBeGreaterThan(narrow.breakdown.coverageScore);
  });

  it("gives higher ageScore to younger patents", () => {
    const young = computeRenewalScore({ ...baseParams, patentAgeYears: 2 });
    const old = computeRenewalScore({ ...baseParams, patentAgeYears: 19 });
    expect(young.breakdown.ageScore).toBeGreaterThan(old.breakdown.ageScore);
  });

  it("handles zero portfolioAvgCost gracefully", () => {
    const result = computeRenewalScore({ ...baseParams, portfolioAvgCost: 0 });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });

  it("handles zero maxPatentAge gracefully", () => {
    const result = computeRenewalScore({ ...baseParams, maxPatentAge: 0 });
    expect(result.score).toBeGreaterThanOrEqual(0);
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd packages/domain && pnpm test -- renewal-score`
Expected: FAIL — module not found

**Step 3: Implement the score function**

Create `packages/domain/src/renewal-score.ts`:

```typescript
import type { ScoreBreakdown } from "./entities.js";

export interface RenewalScoreInput {
  readonly renewalCost: number;
  readonly portfolioAvgCost: number;
  readonly citingPatentsCount: number;
  readonly jurisdictionCount: number;
  readonly patentAgeYears: number;
  readonly maxPatentAge: number;
}

export function computeRenewalScore(params: RenewalScoreInput): {
  score: number;
  breakdown: ScoreBreakdown;
} {
  const costScore = computeCostScore(params.renewalCost, params.portfolioAvgCost);
  const citationScore = computeCitationScore(params.citingPatentsCount);
  const coverageScore = computeCoverageScore(params.jurisdictionCount);
  const ageScore = computeAgeScore(params.patentAgeYears, params.maxPatentAge);

  const breakdown: ScoreBreakdown = { costScore, citationScore, coverageScore, ageScore };
  const score = costScore + citationScore + coverageScore + ageScore;

  return { score, breakdown };
}

function computeCostScore(cost: number, avgCost: number): number {
  if (avgCost <= 0) return 13; // middle score when no reference
  const ratio = cost / avgCost;
  // ratio 0 → 25, ratio 1 → 13, ratio 2+ → 0
  const raw = 25 * (1 - Math.min(ratio, 2) / 2);
  return Math.round(Math.max(0, Math.min(25, raw)));
}

function computeCitationScore(count: number): number {
  // 0 citations → 0, 10+ citations → 25 (linear)
  const raw = 25 * Math.min(count, 10) / 10;
  return Math.round(Math.max(0, Math.min(25, raw)));
}

function computeCoverageScore(jurisdictionCount: number): number {
  // 1 jurisdiction → 3, 8+ → 25 (linear)
  const raw = 25 * Math.min(jurisdictionCount, 8) / 8;
  return Math.round(Math.max(0, Math.min(25, raw)));
}

function computeAgeScore(ageYears: number, maxAge: number): number {
  if (maxAge <= 0) return 13; // middle score when no reference
  // age 0 → 25, maxAge → 0 (linear)
  const remainingLife = Math.max(0, maxAge - ageYears);
  const raw = 25 * remainingLife / maxAge;
  return Math.round(Math.max(0, Math.min(25, raw)));
}
```

**Step 4: Export from domain index**

In `packages/domain/src/index.ts`, add:

```typescript
export { computeRenewalScore } from "./renewal-score.js";
export type { RenewalScoreInput } from "./renewal-score.js";
```

**Step 5: Run tests to verify they pass**

Run: `cd packages/domain && pnpm test -- renewal-score`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add packages/domain/src/renewal-score.ts packages/domain/src/renewal-score.test.ts packages/domain/src/index.ts
git commit -m "feat: add computeRenewalScore pure function with tests"
```

---

## Task 4: Add database schema for renewal_fees and renewal_decisions

**Files:**
- Modify: `packages/infrastructure/src/postgres/schema.ts`

**Step 1: Add tables to schema**

In `packages/infrastructure/src/postgres/schema.ts`, add imports for `integer`, `numeric` from `drizzle-orm/pg-core` (update the existing import line).

Add after `priorArtResults` table definition:

```typescript
export const renewalFees = pgTable("renewal_fees", {
  id: uuid("id").primaryKey(),
  jurisdictionCode: text("jurisdiction_code").notNull(),
  year: integer("year").notNull(),
  officialFee: numeric("official_fee", { precision: 12, scale: 2 }).notNull(),
  typicalAgentFee: numeric("typical_agent_fee", { precision: 12, scale: 2 }),
  currency: text("currency").notNull(),
  officialFeeLocal: numeric("official_fee_local", { precision: 12, scale: 2 }).notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("renewal_fees_jurisdiction_year_idx").on(table.jurisdictionCode, table.year),
]);

export const renewalDecisions = pgTable("renewal_decisions", {
  id: uuid("id").primaryKey(),
  deadlineId: uuid("deadline_id").notNull().references(() => deadlines.id),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  organizationId: uuid("organization_id").notNull(),
  estimatedCost: numeric("estimated_cost", { precision: 12, scale: 2 }).notNull(),
  costOverride: numeric("cost_override", { precision: 12, scale: 2 }),
  score: numeric("score", { precision: 5, scale: 2 }).notNull(),
  scoreBreakdown: jsonb("score_breakdown").notNull(),
  decision: text("decision").notNull().default("pending"),
  decidedBy: text("decided_by"),
  decidedAt: timestamp("decided_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("renewal_decisions_organization_id_idx").on(table.organizationId),
  index("renewal_decisions_deadline_id_idx").on(table.deadlineId),
  index("renewal_decisions_asset_id_idx").on(table.assetId),
  uniqueIndex("renewal_decisions_deadline_id_unique").on(table.deadlineId),
]);
```

**Step 2: Push schema to database**

Run: `cd packages/infrastructure && pnpm drizzle-kit push`

If drizzle-kit push is not available, use the app's migration approach. Check `package.json` for the correct command:

Run: `grep -r "drizzle" packages/infrastructure/package.json`

**Step 3: Commit**

```bash
git add packages/infrastructure/src/postgres/schema.ts
git commit -m "feat: add renewal_fees and renewal_decisions database tables"
```

---

## Task 5: Add repository ports (interfaces)

**Files:**
- Modify: `packages/application/src/ports.ts`
- Modify: `packages/application/src/index.ts`

**Step 1: Add repository interfaces**

In `packages/application/src/ports.ts`, add imports:

```typescript
import type { RenewalFeeId, RenewalDecisionId } from "@ipms/shared";
import type { RenewalFee, RenewalDecision } from "@ipms/domain";
```

Add after `PriorArtResultRepository`:

```typescript
export interface RenewalFeeRepository {
  findByJurisdiction(jurisdictionCode: string): Promise<readonly RenewalFee[]>;
  findByJurisdictionAndYear(jurisdictionCode: string, year: number): Promise<RenewalFee | null>;
  findAll(): Promise<readonly RenewalFee[]>;
  save(fee: RenewalFee): Promise<void>;
  saveMany(fees: readonly RenewalFee[]): Promise<void>;
}

export interface RenewalDecisionRepository {
  findById(id: RenewalDecisionId, orgId: OrganizationId): Promise<RenewalDecision | null>;
  findByDeadlineId(deadlineId: DeadlineId, orgId: OrganizationId): Promise<RenewalDecision | null>;
  findAll(orgId: OrganizationId): Promise<readonly RenewalDecision[]>;
  findByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<readonly RenewalDecision[]>;
  save(decision: RenewalDecision): Promise<void>;
  saveMany(decisions: readonly RenewalDecision[]): Promise<void>;
}
```

**Step 2: Export from application index**

In `packages/application/src/index.ts`, add to the port type exports:

```typescript
export type { RenewalFeeRepository, RenewalDecisionRepository } from "./ports.js";
```

**Step 3: Commit**

```bash
git add packages/application/src/ports.ts packages/application/src/index.ts
git commit -m "feat: add RenewalFee and RenewalDecision repository ports"
```

---

## Task 6: Implement Postgres repositories

**Files:**
- Create: `packages/infrastructure/src/postgres/pg-renewal-fee-repository.ts`
- Create: `packages/infrastructure/src/postgres/pg-renewal-decision-repository.ts`
- Modify: `packages/infrastructure/src/postgres/index.ts`

**Step 1: Implement RenewalFee Postgres repository**

Create `packages/infrastructure/src/postgres/pg-renewal-fee-repository.ts`:

```typescript
import { eq, and } from "drizzle-orm";
import type { RenewalFeeId } from "@ipms/shared";
import type { RenewalFee } from "@ipms/domain";
import type { RenewalFeeRepository } from "@ipms/application";
import { renewalFees } from "./schema.js";
import type { Database } from "./connection.js";

type RenewalFeeRow = typeof renewalFees.$inferSelect;

function toEntity(row: RenewalFeeRow): RenewalFee {
  return {
    id: row.id as RenewalFeeId,
    jurisdictionCode: row.jurisdictionCode,
    year: row.year,
    officialFee: Number(row.officialFee),
    typicalAgentFee: row.typicalAgentFee ? Number(row.typicalAgentFee) : null,
    currency: row.currency,
    officialFeeLocal: Number(row.officialFeeLocal),
    updatedAt: row.updatedAt,
  };
}

export function createPgRenewalFeeRepository(db: Database): RenewalFeeRepository {
  return {
    async findByJurisdiction(jurisdictionCode) {
      const rows = await db.select().from(renewalFees)
        .where(eq(renewalFees.jurisdictionCode, jurisdictionCode));
      return rows.map(toEntity);
    },

    async findByJurisdictionAndYear(jurisdictionCode, year) {
      const rows = await db.select().from(renewalFees)
        .where(and(eq(renewalFees.jurisdictionCode, jurisdictionCode), eq(renewalFees.year, year)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findAll() {
      const rows = await db.select().from(renewalFees);
      return rows.map(toEntity);
    },

    async save(fee) {
      await db.insert(renewalFees).values({
        id: fee.id,
        jurisdictionCode: fee.jurisdictionCode,
        year: fee.year,
        officialFee: String(fee.officialFee),
        typicalAgentFee: fee.typicalAgentFee != null ? String(fee.typicalAgentFee) : null,
        currency: fee.currency,
        officialFeeLocal: String(fee.officialFeeLocal),
        updatedAt: fee.updatedAt,
      }).onConflictDoUpdate({
        target: renewalFees.id,
        set: {
          officialFee: String(fee.officialFee),
          typicalAgentFee: fee.typicalAgentFee != null ? String(fee.typicalAgentFee) : null,
          officialFeeLocal: String(fee.officialFeeLocal),
          updatedAt: fee.updatedAt,
        },
      });
    },

    async saveMany(fees) {
      for (const fee of fees) {
        await this.save(fee);
      }
    },
  };
}
```

**Step 2: Implement RenewalDecision Postgres repository**

Create `packages/infrastructure/src/postgres/pg-renewal-decision-repository.ts`:

```typescript
import { eq, and } from "drizzle-orm";
import type { AssetId, DeadlineId, OrganizationId, RenewalDecisionId } from "@ipms/shared";
import type { RenewalDecision, DecisionStatus, ScoreBreakdown } from "@ipms/domain";
import type { RenewalDecisionRepository } from "@ipms/application";
import { renewalDecisions } from "./schema.js";
import type { Database } from "./connection.js";

type RenewalDecisionRow = typeof renewalDecisions.$inferSelect;

function toEntity(row: RenewalDecisionRow): RenewalDecision {
  return {
    id: row.id as RenewalDecisionId,
    deadlineId: row.deadlineId as DeadlineId,
    assetId: row.assetId as AssetId,
    organizationId: row.organizationId as OrganizationId,
    estimatedCost: Number(row.estimatedCost),
    costOverride: row.costOverride ? Number(row.costOverride) : null,
    score: Number(row.score),
    scoreBreakdown: row.scoreBreakdown as ScoreBreakdown,
    decision: row.decision as DecisionStatus,
    decidedBy: row.decidedBy,
    decidedAt: row.decidedAt,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function createPgRenewalDecisionRepository(db: Database): RenewalDecisionRepository {
  return {
    async findById(id, orgId) {
      const rows = await db.select().from(renewalDecisions)
        .where(and(eq(renewalDecisions.id, id), eq(renewalDecisions.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findByDeadlineId(deadlineId, orgId) {
      const rows = await db.select().from(renewalDecisions)
        .where(and(eq(renewalDecisions.deadlineId, deadlineId), eq(renewalDecisions.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findAll(orgId) {
      const rows = await db.select().from(renewalDecisions)
        .where(eq(renewalDecisions.organizationId, orgId));
      return rows.map(toEntity);
    },

    async findByAssetId(assetId, orgId) {
      const rows = await db.select().from(renewalDecisions)
        .where(and(eq(renewalDecisions.assetId, assetId), eq(renewalDecisions.organizationId, orgId)));
      return rows.map(toEntity);
    },

    async save(decision) {
      await db.insert(renewalDecisions).values({
        id: decision.id,
        deadlineId: decision.deadlineId,
        assetId: decision.assetId,
        organizationId: decision.organizationId,
        estimatedCost: String(decision.estimatedCost),
        costOverride: decision.costOverride != null ? String(decision.costOverride) : null,
        score: String(decision.score),
        scoreBreakdown: decision.scoreBreakdown,
        decision: decision.decision,
        decidedBy: decision.decidedBy,
        decidedAt: decision.decidedAt,
        notes: decision.notes,
      }).onConflictDoUpdate({
        target: renewalDecisions.id,
        set: {
          estimatedCost: String(decision.estimatedCost),
          costOverride: decision.costOverride != null ? String(decision.costOverride) : null,
          score: String(decision.score),
          scoreBreakdown: decision.scoreBreakdown,
          decision: decision.decision,
          decidedBy: decision.decidedBy,
          decidedAt: decision.decidedAt,
          notes: decision.notes,
          updatedAt: new Date(),
        },
      });
    },

    async saveMany(decisions) {
      for (const decision of decisions) {
        await this.save(decision);
      }
    },
  };
}
```

**Step 3: Export from postgres index**

In `packages/infrastructure/src/postgres/index.ts`, add:

```typescript
export { createPgRenewalFeeRepository } from "./pg-renewal-fee-repository.js";
export { createPgRenewalDecisionRepository } from "./pg-renewal-decision-repository.js";
```

**Step 4: Commit**

```bash
git add packages/infrastructure/src/postgres/pg-renewal-fee-repository.ts packages/infrastructure/src/postgres/pg-renewal-decision-repository.ts packages/infrastructure/src/postgres/index.ts
git commit -m "feat: add Postgres repositories for renewal fees and decisions"
```

---

## Task 7: Implement in-memory repositories

**Files:**
- Create: `packages/infrastructure/src/in-memory-renewal-fee-repository.ts`
- Create: `packages/infrastructure/src/in-memory-renewal-decision-repository.ts`
- Modify: `packages/infrastructure/src/index.ts`

**Step 1: In-memory RenewalFee repository**

Create `packages/infrastructure/src/in-memory-renewal-fee-repository.ts`:

```typescript
import type { RenewalFee } from "@ipms/domain";
import type { RenewalFeeRepository } from "@ipms/application";

export function createInMemoryRenewalFeeRepository(): RenewalFeeRepository {
  const store = new Map<string, RenewalFee>();

  return {
    async findByJurisdiction(jurisdictionCode) {
      return [...store.values()].filter((f) => f.jurisdictionCode === jurisdictionCode);
    },

    async findByJurisdictionAndYear(jurisdictionCode, year) {
      return [...store.values()].find(
        (f) => f.jurisdictionCode === jurisdictionCode && f.year === year,
      ) ?? null;
    },

    async findAll() {
      return [...store.values()];
    },

    async save(fee) {
      store.set(fee.id, fee);
    },

    async saveMany(fees) {
      for (const fee of fees) {
        store.set(fee.id, fee);
      }
    },
  };
}
```

**Step 2: In-memory RenewalDecision repository**

Create `packages/infrastructure/src/in-memory-renewal-decision-repository.ts`:

```typescript
import type { AssetId, DeadlineId, OrganizationId } from "@ipms/shared";
import type { RenewalDecision } from "@ipms/domain";
import type { RenewalDecisionRepository } from "@ipms/application";

export function createInMemoryRenewalDecisionRepository(): RenewalDecisionRepository {
  const store = new Map<string, RenewalDecision>();

  const key = (id: string, orgId: OrganizationId) => `${orgId}:${id}`;

  return {
    async findById(id, orgId) {
      return store.get(key(id, orgId)) ?? null;
    },

    async findByDeadlineId(deadlineId, orgId) {
      return [...store.values()].find(
        (d) => d.deadlineId === deadlineId && d.organizationId === orgId,
      ) ?? null;
    },

    async findAll(orgId) {
      return [...store.values()].filter((d) => d.organizationId === orgId);
    },

    async findByAssetId(assetId, orgId) {
      return [...store.values()].filter(
        (d) => d.assetId === assetId && d.organizationId === orgId,
      );
    },

    async save(decision) {
      store.set(key(decision.id, decision.organizationId), decision);
    },

    async saveMany(decisions) {
      for (const decision of decisions) {
        store.set(key(decision.id, decision.organizationId), decision);
      }
    },
  };
}
```

**Step 3: Export from infrastructure index**

In `packages/infrastructure/src/index.ts`, add:

```typescript
export { createInMemoryRenewalFeeRepository } from "./in-memory-renewal-fee-repository.js";
export { createInMemoryRenewalDecisionRepository } from "./in-memory-renewal-decision-repository.js";
```

**Step 4: Commit**

```bash
git add packages/infrastructure/src/in-memory-renewal-fee-repository.ts packages/infrastructure/src/in-memory-renewal-decision-repository.ts packages/infrastructure/src/index.ts
git commit -m "feat: add in-memory repositories for renewal fees and decisions"
```

---

## Task 8: Add RBAC permissions for renewal features

**Files:**
- Modify: `packages/domain/src/rbac.ts`

**Step 1: Add permissions**

In `packages/domain/src/rbac.ts`, add to `PERMISSION_ACTIONS` array:

```typescript
"renewal-fee:read", "renewal-fee:write",
"renewal-decision:read", "renewal-decision:write",
```

Add to `MIN_ROLE_FOR_ACTION`:

```typescript
"renewal-fee:read": "viewer",
"renewal-fee:write": "admin",
"renewal-decision:read": "viewer",
"renewal-decision:write": "attorney",
```

**Step 2: Commit**

```bash
git add packages/domain/src/rbac.ts
git commit -m "feat: add RBAC permissions for renewal fees and decisions"
```

---

## Task 9: Implement use cases

**Files:**
- Create: `packages/application/src/use-cases/renewal-decision.ts`
- Modify: `packages/application/src/index.ts`

**Step 1: Implement use cases**

Create `packages/application/src/use-cases/renewal-decision.ts`:

```typescript
import type { AssetId, DeadlineId, OrganizationId, RenewalDecisionId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { RenewalDecision, RenewalFee, DecisionStatus, IPAsset, Deadline } from "@ipms/domain";
import { computeRenewalScore } from "@ipms/domain";
import type { AssetRepository, DeadlineRepository, RenewalFeeRepository, RenewalDecisionRepository } from "../ports.js";

export interface RenewalDecisionWithAsset extends RenewalDecision {
  readonly assetTitle: string;
  readonly assetJurisdiction: string;
  readonly deadlineTitle: string;
  readonly deadlineDueDate: Date;
}

export function listRenewalDecisionsUseCase(
  decisionRepo: RenewalDecisionRepository,
  assetRepo: AssetRepository,
  deadlineRepo: DeadlineRepository,
) {
  return async (orgId: OrganizationId): Promise<Result<readonly RenewalDecisionWithAsset[]>> => {
    const [decisions, assets, deadlines] = await Promise.all([
      decisionRepo.findAll(orgId),
      assetRepo.findAll(orgId),
      deadlineRepo.findAll(orgId),
    ]);

    const assetMap = new Map(assets.map((a) => [a.id, a]));
    const deadlineMap = new Map(deadlines.map((d) => [d.id, d]));

    const enriched = decisions.map((d) => {
      const asset = assetMap.get(d.assetId);
      const deadline = deadlineMap.get(d.deadlineId);
      return {
        ...d,
        assetTitle: asset?.title ?? "Unknown asset",
        assetJurisdiction: asset?.jurisdiction.code ?? "??",
        deadlineTitle: deadline?.title ?? "Unknown deadline",
        deadlineDueDate: deadline?.dueDate ?? new Date(),
      };
    });

    return ok(enriched);
  };
}

export function getRenewalDecisionUseCase(decisionRepo: RenewalDecisionRepository) {
  return async (id: RenewalDecisionId, orgId: OrganizationId): Promise<Result<RenewalDecision>> => {
    const decision = await decisionRepo.findById(id, orgId);
    if (!decision) return err("Renewal decision not found");
    return ok(decision);
  };
}

export function makeRenewalDecisionUseCase(decisionRepo: RenewalDecisionRepository) {
  return async (
    id: RenewalDecisionId,
    orgId: OrganizationId,
    decision: "renew" | "abandon",
    decidedBy: string,
    notes: string | null,
  ): Promise<Result<RenewalDecision>> => {
    const existing = await decisionRepo.findById(id, orgId);
    if (!existing) return err("Renewal decision not found");

    const updated: RenewalDecision = {
      ...existing,
      decision,
      decidedBy,
      decidedAt: new Date(),
      notes,
      updatedAt: new Date(),
    };

    await decisionRepo.save(updated);
    return ok(updated);
  };
}

function computeMaintenanceYear(filingDate: Date | null, dueDate: Date): number {
  if (!filingDate) return 4; // default to year 4
  const diffYears = (dueDate.getFullYear() - filingDate.getFullYear());
  return Math.max(3, Math.min(20, diffYears));
}

function countCitingPatents(metadata: Record<string, unknown> | null): number {
  if (!metadata) return 0;
  const citing = metadata.citingPatents;
  return Array.isArray(citing) ? citing.length : 0;
}

function countJurisdictions(metadata: Record<string, unknown> | null): number {
  if (!metadata) return 1;
  const pubs = metadata.publications;
  if (!Array.isArray(pubs)) return 1;
  const countries = new Set(pubs.map((p: Record<string, unknown>) => p.country).filter(Boolean));
  return Math.max(1, countries.size);
}

export function generateRenewalDecisionsUseCase(
  deadlineRepo: DeadlineRepository,
  assetRepo: AssetRepository,
  feeRepo: RenewalFeeRepository,
  decisionRepo: RenewalDecisionRepository,
) {
  return async (orgId: OrganizationId): Promise<Result<readonly RenewalDecision[]>> => {
    const [deadlines, assets, existingDecisions, allFees] = await Promise.all([
      deadlineRepo.findAll(orgId),
      assetRepo.findAll(orgId),
      decisionRepo.findAll(orgId),
      feeRepo.findAll(),
    ]);

    const renewalDeadlines = deadlines.filter((d) => d.type === "renewal" && !d.completed);
    const existingDeadlineIds = new Set(existingDecisions.map((d) => d.deadlineId));
    const newDeadlines = renewalDeadlines.filter((d) => !existingDeadlineIds.has(d.id));

    if (newDeadlines.length === 0) return ok([]);

    const assetMap = new Map(assets.map((a) => [a.id, a]));

    // Compute portfolio average cost for the score
    const allCosts = allFees.map((f) => f.officialFee + (f.typicalAgentFee ?? 0));
    const portfolioAvgCost = allCosts.length > 0
      ? allCosts.reduce((sum, c) => sum + c, 0) / allCosts.length
      : 1000;

    const created: RenewalDecision[] = [];

    for (const deadline of newDeadlines) {
      const asset = assetMap.get(deadline.assetId);
      if (!asset) continue;

      const maintenanceYear = computeMaintenanceYear(asset.filingDate, deadline.dueDate);
      const fee = await feeRepo.findByJurisdictionAndYear(asset.jurisdiction.code, maintenanceYear);

      const officialFee = fee?.officialFee ?? 0;
      const agentFee = fee?.typicalAgentFee ?? 0;
      const estimatedCost = officialFee + agentFee;

      const patentAgeYears = asset.filingDate
        ? Math.max(0, new Date().getFullYear() - asset.filingDate.getFullYear())
        : 10;

      const { score, breakdown } = computeRenewalScore({
        renewalCost: estimatedCost,
        portfolioAvgCost,
        citingPatentsCount: countCitingPatents(asset.metadata),
        jurisdictionCount: countJurisdictions(asset.metadata),
        patentAgeYears,
        maxPatentAge: 20,
      });

      const decision: RenewalDecision = {
        id: crypto.randomUUID() as RenewalDecisionId,
        deadlineId: deadline.id,
        assetId: deadline.assetId,
        organizationId: orgId,
        estimatedCost,
        costOverride: null,
        score,
        scoreBreakdown: breakdown,
        decision: "pending",
        decidedBy: null,
        decidedAt: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      created.push(decision);
    }

    if (created.length > 0) {
      await decisionRepo.saveMany(created);
    }

    return ok(created);
  };
}

export interface PortfolioFinancials {
  readonly totalAnnualCost: number;
  readonly totalPendingCost: number;
  readonly renewedCount: number;
  readonly abandonedCount: number;
  readonly pendingCount: number;
  readonly savedByAbandoning: number;
  readonly costByJurisdiction: Record<string, number>;
  readonly decisions: readonly RenewalDecisionWithAsset[];
}

export function getPortfolioFinancialsUseCase(
  portfolioRepo: import("../ports.js").PortfolioRepository,
  assetRepo: AssetRepository,
  decisionRepo: RenewalDecisionRepository,
  deadlineRepo: DeadlineRepository,
) {
  return async (portfolioId: import("@ipms/shared").PortfolioId, orgId: OrganizationId): Promise<Result<PortfolioFinancials>> => {
    const portfolio = await portfolioRepo.findById(portfolioId, orgId);
    if (!portfolio) return err("Portfolio not found");

    const [allDecisions, allAssets, allDeadlines] = await Promise.all([
      decisionRepo.findAll(orgId),
      assetRepo.findAll(orgId),
      deadlineRepo.findAll(orgId),
    ]);

    const portfolioAssetIds = new Set(portfolio.assetIds);
    const decisions = allDecisions.filter((d) => portfolioAssetIds.has(d.assetId));
    const assetMap = new Map(allAssets.map((a) => [a.id, a]));
    const deadlineMap = new Map(allDeadlines.map((d) => [d.id, d]));

    const enrichedDecisions: RenewalDecisionWithAsset[] = decisions.map((d) => {
      const asset = assetMap.get(d.assetId);
      const deadline = deadlineMap.get(d.deadlineId);
      return {
        ...d,
        assetTitle: asset?.title ?? "Unknown",
        assetJurisdiction: asset?.jurisdiction.code ?? "??",
        deadlineTitle: deadline?.title ?? "Unknown",
        deadlineDueDate: deadline?.dueDate ?? new Date(),
      };
    });

    const costByJurisdiction: Record<string, number> = {};
    let totalAnnualCost = 0;
    let totalPendingCost = 0;
    let savedByAbandoning = 0;

    for (const d of decisions) {
      const cost = d.costOverride ?? d.estimatedCost;
      const jurisdiction = assetMap.get(d.assetId)?.jurisdiction.code ?? "Other";

      if (d.decision === "renew") {
        totalAnnualCost += cost;
        costByJurisdiction[jurisdiction] = (costByJurisdiction[jurisdiction] ?? 0) + cost;
      } else if (d.decision === "pending") {
        totalPendingCost += cost;
        costByJurisdiction[jurisdiction] = (costByJurisdiction[jurisdiction] ?? 0) + cost;
      } else if (d.decision === "abandon") {
        savedByAbandoning += cost;
      }
    }

    return ok({
      totalAnnualCost,
      totalPendingCost,
      renewedCount: decisions.filter((d) => d.decision === "renew").length,
      abandonedCount: decisions.filter((d) => d.decision === "abandon").length,
      pendingCount: decisions.filter((d) => d.decision === "pending").length,
      savedByAbandoning,
      costByJurisdiction,
      decisions: enrichedDecisions,
    });
  };
}

export interface CostProjection {
  readonly year: number;
  readonly totalCost: number;
  readonly byJurisdiction: Record<string, number>;
}

export function projectPortfolioCostsUseCase(
  portfolioRepo: import("../ports.js").PortfolioRepository,
  assetRepo: AssetRepository,
  feeRepo: RenewalFeeRepository,
) {
  return async (
    portfolioId: import("@ipms/shared").PortfolioId,
    orgId: OrganizationId,
    years: number = 5,
  ): Promise<Result<readonly CostProjection[]>> => {
    const portfolio = await portfolioRepo.findById(portfolioId, orgId);
    if (!portfolio) return err("Portfolio not found");

    const allAssets = await assetRepo.findAll(orgId);
    const portfolioAssets = allAssets.filter((a) => portfolio.assetIds.includes(a.id));
    const activeAssets = portfolioAssets.filter((a) => a.status === "granted" || a.status === "filed" || a.status === "published");

    const currentYear = new Date().getFullYear();
    const projections: CostProjection[] = [];

    for (let y = 0; y < years; y++) {
      const projYear = currentYear + y;
      const byJurisdiction: Record<string, number> = {};
      let totalCost = 0;

      for (const asset of activeAssets) {
        const filingYear = asset.filingDate?.getFullYear() ?? currentYear;
        const maintenanceYear = Math.max(3, projYear - filingYear);
        if (maintenanceYear > 20) continue; // expired

        const fee = await feeRepo.findByJurisdictionAndYear(asset.jurisdiction.code, maintenanceYear);
        const cost = (fee?.officialFee ?? 0) + (fee?.typicalAgentFee ?? 0);

        totalCost += cost;
        byJurisdiction[asset.jurisdiction.code] = (byJurisdiction[asset.jurisdiction.code] ?? 0) + cost;
      }

      projections.push({ year: projYear, totalCost, byJurisdiction });
    }

    return ok(projections);
  };
}
```

**Step 2: Export from application index**

In `packages/application/src/index.ts`, add:

```typescript
export {
  listRenewalDecisionsUseCase,
  getRenewalDecisionUseCase,
  makeRenewalDecisionUseCase,
  generateRenewalDecisionsUseCase,
  getPortfolioFinancialsUseCase,
  projectPortfolioCostsUseCase,
} from "./use-cases/renewal-decision.js";
export type { RenewalDecisionWithAsset, PortfolioFinancials, CostProjection } from "./use-cases/renewal-decision.js";
```

**Step 3: Commit**

```bash
git add packages/application/src/use-cases/renewal-decision.ts packages/application/src/index.ts
git commit -m "feat: add renewal decision use cases (generate, decide, financials, projections)"
```

---

## Task 10: Wire repositories and use cases in SvelteKit

**Files:**
- Modify: `apps/web/src/lib/server/repositories.ts`
- Modify: `apps/web/src/lib/server/use-cases.ts`

**Step 1: Add repositories to repositories.ts**

Add new variables after `priorArtResultRepo`:

```typescript
import type { RenewalFeeRepository, RenewalDecisionRepository } from "@ipms/application";

let renewalFeeRepo: RenewalFeeRepository;
let renewalDecisionRepo: RenewalDecisionRepository;
```

In the `if (env.DATABASE_URL)` block, add to the postgres import:

```typescript
const { createPgRenewalFeeRepository, createPgRenewalDecisionRepository } = await import("@ipms/infrastructure/postgres");
renewalFeeRepo = createPgRenewalFeeRepository(db);
renewalDecisionRepo = createPgRenewalDecisionRepository(db);
```

In the `else` (in-memory) block, add:

```typescript
const { createInMemoryRenewalFeeRepository, createInMemoryRenewalDecisionRepository } = await import("@ipms/infrastructure");
renewalFeeRepo = createInMemoryRenewalFeeRepository();
renewalDecisionRepo = createInMemoryRenewalDecisionRepository();
```

Add to the export statement: `renewalFeeRepo, renewalDecisionRepo`.

**Step 2: Add use cases to use-cases.ts**

Import the new use case factories and wire them:

```typescript
import {
  listRenewalDecisionsUseCase,
  getRenewalDecisionUseCase,
  makeRenewalDecisionUseCase,
  generateRenewalDecisionsUseCase,
  getPortfolioFinancialsUseCase,
  projectPortfolioCostsUseCase,
} from "@ipms/application";
import { renewalFeeRepo, renewalDecisionRepo } from "./repositories.js";

export const listRenewalDecisions = listRenewalDecisionsUseCase(renewalDecisionRepo, assetRepo, deadlineRepo);
export const getRenewalDecision = getRenewalDecisionUseCase(renewalDecisionRepo);
export const makeRenewalDecision = makeRenewalDecisionUseCase(renewalDecisionRepo);
export const generateRenewalDecisions = generateRenewalDecisionsUseCase(deadlineRepo, assetRepo, renewalFeeRepo, renewalDecisionRepo);
export const getPortfolioFinancials = getPortfolioFinancialsUseCase(portfolioRepo, assetRepo, renewalDecisionRepo, deadlineRepo);
export const projectPortfolioCosts = projectPortfolioCostsUseCase(portfolioRepo, assetRepo, renewalFeeRepo);
```

**Step 3: Commit**

```bash
git add apps/web/src/lib/server/repositories.ts apps/web/src/lib/server/use-cases.ts
git commit -m "feat: wire renewal repositories and use cases in SvelteKit"
```

---

## Task 11: Create API endpoints

**Files:**
- Create: `apps/web/src/routes/api/renewal-fees/+server.ts`
- Create: `apps/web/src/routes/api/renewal-decisions/+server.ts`
- Create: `apps/web/src/routes/api/renewal-decisions/[id]/+server.ts`
- Create: `apps/web/src/routes/api/renewal-decisions/generate/+server.ts`
- Create: `apps/web/src/routes/api/portfolios/[id]/financials/+server.ts`
- Create: `apps/web/src/routes/api/portfolios/[id]/projections/+server.ts`

**Step 1: Renewal fees endpoint**

Create `apps/web/src/routes/api/renewal-fees/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { renewalFeeRepo } from "$lib/server/repositories";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-fee:read");
  if (forbidden) return forbidden;

  const jurisdiction = event.url.searchParams.get("jurisdiction");
  const fees = jurisdiction
    ? await renewalFeeRepo.findByJurisdiction(jurisdiction)
    : await renewalFeeRepo.findAll();

  return json(fees);
};
```

**Step 2: Renewal decisions list endpoint**

Create `apps/web/src/routes/api/renewal-decisions/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission, resultToResponse } from "$lib/server/api-utils";
import { listRenewalDecisions } from "$lib/server/use-cases";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-decision:read");
  if (forbidden) return forbidden;

  const result = await listRenewalDecisions(auth.value.organizationId);
  return resultToResponse(result);
};
```

**Step 3: Renewal decision detail + PATCH**

Create `apps/web/src/routes/api/renewal-decisions/[id]/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission, resultToResponse } from "$lib/server/api-utils";
import { getRenewalDecision, makeRenewalDecision } from "$lib/server/use-cases";
import { parseRenewalDecisionId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-decision:read");
  if (forbidden) return forbidden;

  const idResult = parseRenewalDecisionId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getRenewalDecision(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};

export const PATCH: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-decision:write");
  if (forbidden) return forbidden;

  const idResult = parseRenewalDecisionId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const body = await event.request.json();
  const { decision, notes } = body;

  if (decision !== "renew" && decision !== "abandon") {
    return json({ error: "Decision must be 'renew' or 'abandon'" }, { status: 400 });
  }

  const result = await makeRenewalDecision(
    idResult.value,
    auth.value.organizationId,
    decision,
    auth.value.userId,
    notes ?? null,
  );

  return resultToResponse(result);
};
```

**Step 4: Generate endpoint**

Create `apps/web/src/routes/api/renewal-decisions/generate/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission, resultToResponse } from "$lib/server/api-utils";
import { generateRenewalDecisions } from "$lib/server/use-cases";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "renewal-decision:write");
  if (forbidden) return forbidden;

  const result = await generateRenewalDecisions(auth.value.organizationId);
  return resultToResponse(result);
};
```

**Step 5: Portfolio financials endpoint**

Create `apps/web/src/routes/api/portfolios/[id]/financials/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission, resultToResponse } from "$lib/server/api-utils";
import { getPortfolioFinancials } from "$lib/server/use-cases";
import { parsePortfolioId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "portfolio:read");
  if (forbidden) return forbidden;

  const idResult = parsePortfolioId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await getPortfolioFinancials(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};
```

**Step 6: Portfolio projections endpoint**

Create `apps/web/src/routes/api/portfolios/[id]/projections/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { requireAuth, unauthorizedResponse, requirePermission, resultToResponse } from "$lib/server/api-utils";
import { projectPortfolioCosts } from "$lib/server/use-cases";
import { parsePortfolioId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "portfolio:read");
  if (forbidden) return forbidden;

  const idResult = parsePortfolioId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const years = Number(event.url.searchParams.get("years") ?? "5");
  const result = await projectPortfolioCosts(idResult.value, auth.value.organizationId, years);
  return resultToResponse(result);
};
```

**Step 7: Commit**

```bash
git add apps/web/src/routes/api/renewal-fees/ apps/web/src/routes/api/renewal-decisions/ apps/web/src/routes/api/portfolios/\[id\]/financials/ apps/web/src/routes/api/portfolios/\[id\]/projections/
git commit -m "feat: add API endpoints for renewal fees, decisions, and portfolio financials"
```

---

## Task 12: Seed renewal fee data

**Files:**
- Create: `apps/web/src/lib/server/renewal-fee-seed.ts`
- Modify: `apps/web/src/lib/server/seed.ts`

**Step 1: Create fee schedule seed data**

Create `apps/web/src/lib/server/renewal-fee-seed.ts` with official fee schedules for 20+ jurisdictions. This is a large data file — see the design doc for jurisdiction list. Include fees for years 3-20 per jurisdiction with real approximate values.

Example structure:

```typescript
import type { RenewalFeeId } from "@ipms/shared";
import type { RenewalFee } from "@ipms/domain";

interface FeeEntry {
  jurisdictionCode: string;
  currency: string;
  fees: Record<number, { official: number; agent: number; officialLocal: number }>;
}

const FEE_SCHEDULES: FeeEntry[] = [
  {
    jurisdictionCode: "EP",
    currency: "EUR",
    fees: {
      3: { official: 470, agent: 150, officialLocal: 470 },
      4: { official: 585, agent: 150, officialLocal: 585 },
      5: { official: 810, agent: 150, officialLocal: 810 },
      6: { official: 925, agent: 150, officialLocal: 925 },
      7: { official: 1040, agent: 150, officialLocal: 1040 },
      8: { official: 1155, agent: 150, officialLocal: 1155 },
      9: { official: 1270, agent: 150, officialLocal: 1270 },
      10: { official: 1575, agent: 150, officialLocal: 1575 },
      // ... through year 20
    },
  },
  // US, JP, CN, KR, FR, DE, GB, NL, IT, ES, CH, AU, CA, BR, IN, SE, AT, BE, DK, FI, IE, PL, PT
];

export function generateRenewalFees(): RenewalFee[] {
  const fees: RenewalFee[] = [];
  const now = new Date();

  for (const schedule of FEE_SCHEDULES) {
    for (const [year, entry] of Object.entries(schedule.fees)) {
      fees.push({
        id: crypto.randomUUID() as RenewalFeeId,
        jurisdictionCode: schedule.jurisdictionCode,
        year: Number(year),
        officialFee: entry.official,
        typicalAgentFee: entry.agent,
        currency: schedule.currency,
        officialFeeLocal: entry.officialLocal,
        updatedAt: now,
      });
    }
  }

  return fees;
}
```

**Step 2: Call from seed.ts**

In `apps/web/src/lib/server/seed.ts`, add a call to seed renewal fees when the table is empty. Import `renewalFeeRepo` from repositories and call `saveMany`.

**Step 3: Commit**

```bash
git add apps/web/src/lib/server/renewal-fee-seed.ts apps/web/src/lib/server/seed.ts
git commit -m "feat: seed renewal fee schedules for 20+ jurisdictions"
```

---

## Task 13: Create `/renewal-decisions` page

**Files:**
- Create: `apps/web/src/routes/(app)/renewal-decisions/+page.svelte`

This is the main renewal decisions page with:
- Stats cards (Total pending, Total cost pending, Renewed this year, Saved by abandoning)
- Filters (score, jurisdiction, status)
- Table with all renewal decisions
- Expand row for score breakdown + action buttons
- Batch decision support

Follow the exact same patterns as `/deadlines` page for layout, stats cards, loading skeletons, and data fetching via `onMount` + `fetch("/api/renewal-decisions")`.

**Step 1: Create the page**

The page calls `POST /api/renewal-decisions/generate` on mount to auto-generate decisions, then `GET /api/renewal-decisions` to list them. Each row shows patent title, jurisdiction, estimated cost, score gauge, decision status, and action buttons.

**Step 2: Commit**

```bash
git add "apps/web/src/routes/(app)/renewal-decisions/+page.svelte"
git commit -m "feat: add /renewal-decisions page with filters, scores, and batch actions"
```

---

## Task 14: Enrich `/deadlines` page for renewal rows

**Files:**
- Modify: `apps/web/src/routes/(app)/deadlines/+page.svelte`

**Step 1: Fetch renewal decisions alongside deadlines**

On mount, also fetch `GET /api/renewal-decisions` and create a `Map<deadlineId, RenewalDecision>`. For each renewal-type deadline, display:
- Cost badge next to the type pill
- Small score indicator (colored dot)
- Decision status pill (Pending/Renewed/Abandoned)
- Quick "Renew" / "Abandon" buttons (PATCH to `/api/renewal-decisions/[id]`)

Non-renewal deadlines remain untouched.

**Step 2: Commit**

```bash
git add "apps/web/src/routes/(app)/deadlines/+page.svelte"
git commit -m "feat: enrich renewal deadlines with cost, score, and decision actions"
```

---

## Task 15: Add financial dashboard to `/portfolios/[id]`

**Files:**
- Modify: `apps/web/src/routes/(app)/portfolios/[id]/+page.svelte`

**Step 1: Add financials section**

Fetch `GET /api/portfolios/[id]/financials` and `GET /api/portfolios/[id]/projections?years=5` on mount. Display:
- Total annual cost card
- Cost by jurisdiction (simple horizontal bars, no chart library needed)
- Projection table (year × total cost)
- Cost vs Value list (sorted by score, highlighting low-score high-cost)
- Savings card

Use Tailwind CSS for all visualizations (colored bars, progress indicators). No external chart library needed for v1.

**Step 2: Commit**

```bash
git add "apps/web/src/routes/(app)/portfolios/[id]/+page.svelte"
git commit -m "feat: add portfolio financial dashboard with projections"
```

---

## Task 16: Add navigation link

**Files:**
- Modify: the sidebar/nav component (find the nav with links to /deadlines, /portfolios, etc.)

**Step 1: Add "Renewal Decisions" link**

Add a nav item pointing to `/renewal-decisions` with an appropriate icon, placed after "Deadlines" in the navigation.

**Step 2: Commit**

```bash
git commit -m "feat: add renewal decisions link to sidebar navigation"
```

---

## Task 17: Final integration test

**Step 1: Start the dev server**

Run: `pnpm dev`

**Step 2: Verify all pages work**

1. Navigate to `/deadlines` — renewal rows should show cost + score
2. Navigate to `/renewal-decisions` — should list pending decisions with scores
3. Make a decision (renew/abandon) — should update
4. Navigate to `/portfolios/[id]` — financials section should appear
5. Check `/api/renewal-fees` — should return fee data

**Step 3: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: patent renewal decisions with financial data — complete"
git push
```
