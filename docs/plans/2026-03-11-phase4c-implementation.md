# Phase 4c: Prior Art Search — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add automated prior art search using USPTO PatentsView API + Claude relevance analysis, with persistent storage of results.

**Architecture:** New `PatentSearchService` port with USPTO implementation. New `PriorArtResultRepository` port with in-memory and PG implementations. Use case orchestrates: query USPTO → Claude analyzes relevance → store results. New branded type, entity, migration.

**Tech Stack:** USPTO PatentsView API (free, no key), Anthropic SDK (existing), Drizzle ORM, Vitest

**Design doc:** `docs/plans/2026-03-11-phase4cd-design.md`

---

### Task 1: Add PriorArtResultId branded type

**Files:**
- Modify: `packages/shared/src/brand.ts`
- Modify: `packages/shared/src/validation.ts`
- Modify: `packages/shared/src/index.ts`

**Step 1: Add branded type**

In `packages/shared/src/brand.ts`, add:

```typescript
export type PriorArtResultId = Brand<string, "PriorArtResultId">;
```

**Step 2: Add parse function**

In `packages/shared/src/validation.ts`, add the import and function:

```typescript
// Add to imports:
import type { ..., PriorArtResultId } from "./brand.js";

// Add function:
export function parsePriorArtResultId(input: string): Result<PriorArtResultId> {
  return UUID_RE.test(input)
    ? ok(input as PriorArtResultId)
    : err("Invalid PriorArtResultId: must be UUID format");
}
```

**Step 3: Export from index**

In `packages/shared/src/index.ts`, add:

```typescript
export type { ..., PriorArtResultId } from "./brand.js";
// and in the validation exports:
export { ..., parsePriorArtResultId } from "./validation.js";
```

**Step 4: Verify and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/shared/
git commit -m "feat(shared): add PriorArtResultId branded type"
```

---

### Task 2: Add PriorArtResult entity

**Files:**
- Modify: `packages/domain/src/entities.ts`
- Modify: `packages/domain/src/index.ts`

**Step 1: Add entity**

In `packages/domain/src/entities.ts`, add at the end:

```typescript
export interface PriorArtResult {
  readonly id: PriorArtResultId;
  readonly assetId: AssetId;
  readonly organizationId: OrganizationId;
  readonly patentNumber: string;
  readonly title: string;
  readonly abstractText: string;
  readonly relevanceScore: number;
  readonly relevanceReasoning: string;
  readonly source: "uspto";
  readonly searchedAt: Date;
}
```

Add the import for `PriorArtResultId` at the top of entities.ts.

**Step 2: Export from domain index.ts**

```typescript
export type { PriorArtResult } from "./entities.js";
```

**Step 3: Verify and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/domain/
git commit -m "feat(domain): add PriorArtResult entity"
```

---

### Task 3: Add PatentSearchService and PriorArtResultRepository ports

**Files:**
- Modify: `packages/application/src/ports.ts`
- Modify: `packages/application/src/index.ts`

**Step 1: Add ports**

In `packages/application/src/ports.ts`, add at the end:

```typescript
export interface PatentSearchResult {
  readonly patentNumber: string;
  readonly title: string;
  readonly abstractText: string;
}

export interface PatentSearchService {
  search(query: string, limit: number): Promise<readonly PatentSearchResult[]>;
}

export interface PriorArtResultRepository {
  save(result: PriorArtResult): Promise<void>;
  findByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<readonly PriorArtResult[]>;
  deleteByAssetId(assetId: AssetId, orgId: OrganizationId): Promise<void>;
}
```

Add the import for `PriorArtResult` from `@ipms/domain` and `PriorArtResultId` from `@ipms/shared` at the top of ports.ts.

**Step 2: Export from index**

In `packages/application/src/index.ts`, add:

```typescript
export type { PatentSearchService, PatentSearchResult, PriorArtResultRepository } from "./ports.js";
```

**Step 3: Verify and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/application/
git commit -m "feat(application): add PatentSearchService and PriorArtResultRepository ports"
```

---

### Task 4: Add USPTO and no-op PatentSearchService implementations + in-memory repo

**Files:**
- Create: `packages/infrastructure/src/noop-patent-search-service.ts`
- Create: `packages/infrastructure/src/uspto-patent-search-service.ts`
- Create: `packages/infrastructure/src/in-memory-prior-art-result-repository.ts`
- Modify: `packages/infrastructure/src/index.ts`

**Step 1: Create no-op service**

Create `packages/infrastructure/src/noop-patent-search-service.ts`:

```typescript
import type { PatentSearchService } from "@ipms/application";

export function createNoOpPatentSearchService(): PatentSearchService {
  return {
    async search() { return []; },
  };
}
```

**Step 2: Create USPTO service**

Create `packages/infrastructure/src/uspto-patent-search-service.ts`:

```typescript
import type { PatentSearchService, PatentSearchResult } from "@ipms/application";

export function createUSPTOPatentSearchService(): PatentSearchService {
  return {
    async search(query, limit) {
      const url = new URL("https://api.patentsview.org/patents/query");
      const body = {
        q: { _text_any: { patent_abstract: query } },
        f: ["patent_number", "patent_title", "patent_abstract"],
        o: { per_page: limit },
      };

      let response: Response;
      try {
        response = await fetch("https://api.patentsview.org/patents/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch {
        return [];
      }

      if (!response.ok) return [];

      let data: Record<string, unknown>;
      try {
        data = await response.json() as Record<string, unknown>;
      } catch {
        return [];
      }

      const patents = Array.isArray(data.patents) ? data.patents : [];
      return patents
        .filter((p: unknown): p is Record<string, string> => p !== null && typeof p === "object")
        .map((p): PatentSearchResult => ({
          patentNumber: String(p.patent_number ?? ""),
          title: String(p.patent_title ?? ""),
          abstractText: String(p.patent_abstract ?? ""),
        }))
        .filter((p) => p.patentNumber && p.title);
    },
  };
}
```

**Step 3: Create in-memory repo**

Create `packages/infrastructure/src/in-memory-prior-art-result-repository.ts`:

```typescript
import type { AssetId, OrganizationId } from "@ipms/shared";
import type { PriorArtResult } from "@ipms/domain";
import type { PriorArtResultRepository } from "@ipms/application";

export function createInMemoryPriorArtResultRepository(): PriorArtResultRepository {
  const store = new Map<string, PriorArtResult>();

  return {
    async save(result) {
      store.set(result.id, result);
    },
    async findByAssetId(assetId, orgId) {
      return [...store.values()].filter((r) => r.assetId === assetId && r.organizationId === orgId);
    },
    async deleteByAssetId(assetId, orgId) {
      for (const [id, r] of store) {
        if (r.assetId === assetId && r.organizationId === orgId) store.delete(id);
      }
    },
  };
}
```

**Step 4: Export from index**

In `packages/infrastructure/src/index.ts`, add:

```typescript
export { createNoOpPatentSearchService } from "./noop-patent-search-service.js";
export { createUSPTOPatentSearchService } from "./uspto-patent-search-service.js";
export { createInMemoryPriorArtResultRepository } from "./in-memory-prior-art-result-repository.js";
```

**Step 5: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/infrastructure/
git commit -m "feat(infrastructure): add USPTO patent search service and in-memory prior art repo"
```

---

### Task 5: Add searchPriorArt and listPriorArt use cases

**Files:**
- Create: `packages/application/src/use-cases/prior-art.ts`
- Modify: `packages/application/src/index.ts`
- Create: `packages/infrastructure/src/prior-art-use-cases.test.ts`

**Step 1: Create use cases**

Create `packages/application/src/use-cases/prior-art.ts`:

```typescript
import type { AssetId, OrganizationId, PriorArtResultId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { PriorArtResult } from "@ipms/domain";
import type { AssetRepository, PatentSearchService, AIService, PriorArtResultRepository } from "../ports.js";
import crypto from "node:crypto";

const RELEVANCE_SYSTEM_PROMPT = `You are an expert patent attorney evaluating prior art relevance. Given a target patent/invention and a prior art patent, assess its relevance.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "relevanceScore": <number 1-10>,
  "reasoning": "<brief explanation of relevance>"
}`;

export function searchPriorArtUseCase(
  assetRepo: AssetRepository,
  patentSearchService: PatentSearchService,
  aiService: AIService,
  priorArtRepo: PriorArtResultRepository,
) {
  return async (assetId: AssetId, orgId: OrganizationId, keywords?: string): Promise<Result<readonly PriorArtResult[]>> => {
    const asset = await assetRepo.findById(assetId, orgId);
    if (!asset) return err("Asset not found");

    const query = keywords?.trim() || `${asset.title} ${asset.type}`;
    let patents: Awaited<ReturnType<PatentSearchService["search"]>>;
    try {
      patents = await patentSearchService.search(query, 10);
    } catch {
      return err("Patent search service unavailable");
    }

    if (patents.length === 0) return ok([]);

    // Delete previous results for this asset
    await priorArtRepo.deleteByAssetId(assetId, orgId);

    const results: PriorArtResult[] = [];
    for (const patent of patents) {
      let relevanceScore = 5;
      let relevanceReasoning = "Analysis unavailable";

      try {
        const response = await aiService.complete(
          RELEVANCE_SYSTEM_PROMPT,
          `Target patent: "${asset.title}" (${asset.type}, ${asset.jurisdiction.code})\n\nPrior art patent: "${patent.title}"\nPatent number: ${patent.patentNumber}\nAbstract: ${patent.abstractText}`,
        );
        const parsed = JSON.parse(response);
        relevanceScore = Number(parsed.relevanceScore) || 5;
        relevanceReasoning = String(parsed.reasoning ?? "Analysis unavailable");
      } catch {
        // Use defaults if AI fails for this patent
      }

      const result: PriorArtResult = {
        id: crypto.randomUUID() as PriorArtResultId,
        assetId,
        organizationId: orgId,
        patentNumber: patent.patentNumber,
        title: patent.title,
        abstractText: patent.abstractText,
        relevanceScore,
        relevanceReasoning,
        source: "uspto",
        searchedAt: new Date(),
      };
      await priorArtRepo.save(result);
      results.push(result);
    }

    return ok(results);
  };
}

export function listPriorArtUseCase(priorArtRepo: PriorArtResultRepository) {
  return async (assetId: AssetId, orgId: OrganizationId): Promise<Result<readonly PriorArtResult[]>> => {
    const results = await priorArtRepo.findByAssetId(assetId, orgId);
    return ok(results);
  };
}
```

**Step 2: Export from application index.ts**

In `packages/application/src/index.ts`, add:

```typescript
export { searchPriorArtUseCase, listPriorArtUseCase } from "./use-cases/prior-art.js";
```

**Step 3: Write tests**

Create `packages/infrastructure/src/prior-art-use-cases.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { searchPriorArtUseCase, listPriorArtUseCase } from "@ipms/application";
import { createInMemoryAssetRepository } from "./in-memory-asset-repository.js";
import { createInMemoryPriorArtResultRepository } from "./in-memory-prior-art-result-repository.js";
import { createNoOpPatentSearchService } from "./noop-patent-search-service.js";
import type { AssetId, OrganizationId } from "@ipms/shared";
import type { IPAsset } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ASSET_ID = "770e8400-e29b-41d4-a716-446655440000" as AssetId;

const ASSET: IPAsset = {
  id: ASSET_ID,
  title: "Quantum Computing Patent",
  type: "patent",
  jurisdiction: { code: "US", name: "United States" },
  status: "filed",
  filingDate: null,
  expirationDate: null,
  owner: "Acme",
  organizationId: ORG_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("searchPriorArtUseCase", () => {
  it("searches and stores prior art results", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const patentSearch = {
      async search() {
        return [
          { patentNumber: "US1234567", title: "Quantum Method", abstractText: "A method for quantum..." },
          { patentNumber: "US7654321", title: "Computing System", abstractText: "A system for..." },
        ];
      },
    };
    const aiService = {
      async complete() { return '{"relevanceScore": 7, "reasoning": "Highly relevant"}'; },
    };
    const priorArtRepo = createInMemoryPriorArtResultRepository();

    const search = searchPriorArtUseCase(assetRepo, patentSearch, aiService, priorArtRepo);
    const result = await search(ASSET_ID, ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value[0].patentNumber).toBe("US1234567");
      expect(result.value[0].relevanceScore).toBe(7);
      expect(result.value[0].source).toBe("uspto");
    }
  });

  it("returns error for non-existent asset", async () => {
    const assetRepo = createInMemoryAssetRepository();
    const patentSearch = createNoOpPatentSearchService();
    const aiService = { async complete() { return ""; } };
    const priorArtRepo = createInMemoryPriorArtResultRepository();

    const search = searchPriorArtUseCase(assetRepo, patentSearch, aiService, priorArtRepo);
    const result = await search(ASSET_ID, ORG_ID);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Asset not found");
  });

  it("returns empty array when no patents found", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const patentSearch = createNoOpPatentSearchService();
    const aiService = { async complete() { return ""; } };
    const priorArtRepo = createInMemoryPriorArtResultRepository();

    const search = searchPriorArtUseCase(assetRepo, patentSearch, aiService, priorArtRepo);
    const result = await search(ASSET_ID, ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(0);
  });

  it("uses default relevance when AI fails", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const patentSearch = {
      async search() {
        return [{ patentNumber: "US1234567", title: "Test Patent", abstractText: "Abstract" }];
      },
    };
    const aiService = { async complete() { throw new Error("AI down"); } };
    const priorArtRepo = createInMemoryPriorArtResultRepository();

    const search = searchPriorArtUseCase(assetRepo, patentSearch, aiService, priorArtRepo);
    const result = await search(ASSET_ID, ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0].relevanceScore).toBe(5);
      expect(result.value[0].relevanceReasoning).toBe("Analysis unavailable");
    }
  });
});

describe("listPriorArtUseCase", () => {
  it("lists stored prior art results for an asset", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const patentSearch = {
      async search() {
        return [{ patentNumber: "US1234567", title: "Test", abstractText: "Abstract" }];
      },
    };
    const aiService = { async complete() { return '{"relevanceScore": 8, "reasoning": "Relevant"}'; } };
    const priorArtRepo = createInMemoryPriorArtResultRepository();

    const search = searchPriorArtUseCase(assetRepo, patentSearch, aiService, priorArtRepo);
    await search(ASSET_ID, ORG_ID);

    const list = listPriorArtUseCase(priorArtRepo);
    const result = await list(ASSET_ID, ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });
});
```

**Step 4: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add prior art search and list use cases with tests"
```

---

### Task 6: Add PostgreSQL prior_art_results table and repository

**Files:**
- Modify: `packages/infrastructure/src/postgres/schema.ts`
- Create: `packages/infrastructure/src/postgres/pg-prior-art-result-repository.ts`
- Modify: `packages/infrastructure/src/postgres/index.ts`

**Step 1: Add table to schema**

In `packages/infrastructure/src/postgres/schema.ts`, add:

```typescript
export const priorArtResults = pgTable("prior_art_results", {
  id: uuid("id").primaryKey(),
  assetId: uuid("asset_id").notNull().references(() => assets.id),
  organizationId: uuid("organization_id").notNull(),
  patentNumber: text("patent_number").notNull(),
  title: text("title").notNull(),
  abstractText: text("abstract_text").notNull(),
  relevanceScore: text("relevance_score").notNull(),
  relevanceReasoning: text("relevance_reasoning").notNull(),
  source: text("source").notNull().default("uspto"),
  searchedAt: timestamp("searched_at").notNull().defaultNow(),
}, (table) => [
  index("prior_art_results_asset_id_idx").on(table.assetId, table.organizationId),
]);
```

Note: `relevanceScore` is stored as text to keep the schema simple (Drizzle maps it; we parse as number in the repository).

**Step 2: Create PG repository**

Create `packages/infrastructure/src/postgres/pg-prior-art-result-repository.ts`:

```typescript
import { eq, and } from "drizzle-orm";
import type { AssetId, OrganizationId, PriorArtResultId } from "@ipms/shared";
import type { PriorArtResult } from "@ipms/domain";
import type { PriorArtResultRepository } from "@ipms/application";
import { priorArtResults } from "./schema.js";
import type { Database } from "./connection.js";

export function createPgPriorArtResultRepository(db: Database): PriorArtResultRepository {
  return {
    async save(result) {
      await db.insert(priorArtResults).values({
        id: result.id,
        assetId: result.assetId,
        organizationId: result.organizationId,
        patentNumber: result.patentNumber,
        title: result.title,
        abstractText: result.abstractText,
        relevanceScore: String(result.relevanceScore),
        relevanceReasoning: result.relevanceReasoning,
        source: result.source,
        searchedAt: result.searchedAt,
      }).onConflictDoUpdate({
        target: priorArtResults.id,
        set: {
          relevanceScore: String(result.relevanceScore),
          relevanceReasoning: result.relevanceReasoning,
        },
      });
    },

    async findByAssetId(assetId, orgId) {
      const rows = await db.select().from(priorArtResults)
        .where(and(
          eq(priorArtResults.assetId, assetId),
          eq(priorArtResults.organizationId, orgId),
        ));
      return rows.map((row): PriorArtResult => ({
        id: row.id as PriorArtResultId,
        assetId: row.assetId as AssetId,
        organizationId: row.organizationId as OrganizationId,
        patentNumber: row.patentNumber,
        title: row.title,
        abstractText: row.abstractText,
        relevanceScore: Number(row.relevanceScore) || 0,
        relevanceReasoning: row.relevanceReasoning,
        source: row.source as "uspto",
        searchedAt: row.searchedAt,
      }));
    },

    async deleteByAssetId(assetId, orgId) {
      await db.delete(priorArtResults).where(and(
        eq(priorArtResults.assetId, assetId),
        eq(priorArtResults.organizationId, orgId),
      ));
    },
  };
}
```

**Step 3: Export from postgres/index.ts**

Add:

```typescript
export { createPgPriorArtResultRepository } from "./pg-prior-art-result-repository.js";
```

**Step 4: Generate migration**

Run: `cd /Users/guy/Developer/melvin/iptoassets/packages/infrastructure && npx drizzle-kit generate`

**Step 5: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/infrastructure/
git commit -m "feat(infrastructure): add prior_art_results table and PG repository"
```

---

### Task 7: Wire services and add API routes

**Files:**
- Modify: `apps/web/src/lib/server/repositories.ts`
- Modify: `apps/web/src/lib/server/use-cases.ts`
- Create: `apps/web/src/routes/api/assets/[id]/prior-art/+server.ts`

**Step 1: Wire repos and services in repositories.ts**

Add type imports:

```typescript
import type { ..., PatentSearchService, PriorArtResultRepository } from "@ipms/application";
```

Add declarations:

```typescript
let patentSearchService: PatentSearchService;
let priorArtResultRepo: PriorArtResultRepository;
```

In the PG branch:

```typescript
const { createUSPTOPatentSearchService } = await import("@ipms/infrastructure");
patentSearchService = createUSPTOPatentSearchService();

const { createPgPriorArtResultRepository } = await import("@ipms/infrastructure/postgres");
priorArtResultRepo = createPgPriorArtResultRepository(db);
```

In the in-memory branch:

```typescript
const { createNoOpPatentSearchService, createInMemoryPriorArtResultRepository: createInMemoryPriorArt } = await import("@ipms/infrastructure");
patentSearchService = createNoOpPatentSearchService();
priorArtResultRepo = createInMemoryPriorArt();
```

Add to export: `patentSearchService, priorArtResultRepo`

**Step 2: Wire use cases**

In `apps/web/src/lib/server/use-cases.ts`, add imports:

```typescript
searchPriorArtUseCase,
listPriorArtUseCase,
```

And from repositories:

```typescript
import { ..., patentSearchService, priorArtResultRepo } from "./repositories.js";
```

Add wirings:

```typescript
export const searchPriorArt = searchPriorArtUseCase(assetRepo, patentSearchService, aiService, priorArtResultRepo);
export const listPriorArt = listPriorArtUseCase(priorArtResultRepo);
```

**Step 3: Create API route**

Create `apps/web/src/routes/api/assets/[id]/prior-art/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { searchPriorArt, listPriorArt } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const idResult = parseAssetId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await listPriorArt(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const idResult = parseAssetId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  let keywords: string | undefined;
  try {
    const body = await event.request.json();
    if (typeof body.keywords === "string" && body.keywords.trim()) {
      keywords = body.keywords.trim();
    }
  } catch {
    // No body or invalid JSON — that's fine, keywords are optional
  }

  const result = await searchPriorArt(idResult.value, auth.value.organizationId, keywords);
  return resultToResponse(result);
};
```

**Step 4: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add apps/web/
git commit -m "feat(web): wire prior art services and add API routes"
```

---

### Task 8: Update roadmap

**Files:**
- Modify: `docs/roadmap.md`

**Step 1: Mark items complete**

In `docs/roadmap.md`, change:

```markdown
- [x] Automated prior art search
- [x] Integration with patent office APIs (USPTO, EPO, WIPO)
```

**Step 2: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: mark Phase 4c prior art search complete in roadmap"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | PriorArtResultId branded type | `packages/shared/` |
| 2 | PriorArtResult entity | `packages/domain/src/entities.ts` |
| 3 | PatentSearchService + PriorArtResultRepository ports | `packages/application/src/ports.ts` |
| 4 | USPTO + no-op implementations + in-memory repo | `packages/infrastructure/src/` |
| 5 | searchPriorArt + listPriorArt use cases + 5 tests | `packages/application/src/use-cases/prior-art.ts` |
| 6 | PG table + repository + migration | `packages/infrastructure/src/postgres/` |
| 7 | Wire services + 2 API routes (GET + POST) | `apps/web/` |
| 8 | Roadmap update | `docs/roadmap.md` |
