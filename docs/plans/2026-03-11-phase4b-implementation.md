# Phase 4b: Patent Analysis — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add AI-powered patent claim analysis and patentability assessment via Claude API, returning structured JSON results.

**Architecture:** Two stateless use cases reusing the existing `AIService` port. User submits text via request body, Claude analyzes and returns structured JSON. No new storage, repos, or migrations — just domain types, use cases, wiring, and API routes.

**Tech Stack:** Existing `AIService` (Claude API), Vitest, SvelteKit

**Design doc:** `docs/plans/2026-03-11-phase4b-patent-analysis-design.md`

---

### Task 1: Add ClaimAnalysis and PatentabilityAssessment domain types

**Files:**
- Modify: `packages/domain/src/entities.ts`
- Modify: `packages/domain/src/index.ts`

**Step 1: Add types to entities.ts**

At the end of `packages/domain/src/entities.ts`, add:

```typescript
export interface ClaimAnalysisEntry {
  readonly number: number;
  readonly summary: string;
  readonly strength: "strong" | "moderate" | "weak";
  readonly issues: readonly string[];
}

export interface ClaimAnalysis {
  readonly overallScore: number;
  readonly claims: readonly ClaimAnalysisEntry[];
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly recommendations: readonly string[];
}

export interface PatentabilityAssessment {
  readonly overallScore: number;
  readonly novelty: { readonly score: number; readonly reasoning: string };
  readonly nonObviousness: { readonly score: number; readonly reasoning: string };
  readonly utility: { readonly score: number; readonly reasoning: string };
  readonly risks: readonly string[];
  readonly recommendations: readonly string[];
}
```

**Step 2: Export from domain index.ts**

In `packages/domain/src/index.ts`, add to the existing type exports at the top:

```typescript
export type { ClaimAnalysis, ClaimAnalysisEntry, PatentabilityAssessment } from "./entities.js";
```

**Step 3: Verify**

Run: `pnpm test`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add packages/domain/
git commit -m "feat(domain): add ClaimAnalysis and PatentabilityAssessment types"
```

---

### Task 2: Add analyzeClaimsUseCase

**Files:**
- Create: `packages/application/src/use-cases/patent-analysis.ts`
- Modify: `packages/application/src/index.ts`
- Create: `packages/infrastructure/src/patent-analysis-use-cases.test.ts`

**Step 1: Create the use case**

Create `packages/application/src/use-cases/patent-analysis.ts`:

```typescript
import type { AssetId, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { ClaimAnalysis } from "@ipms/domain";
import type { AssetRepository, AIService } from "../ports.js";

const CLAIMS_SYSTEM_PROMPT = `You are an expert patent attorney analyzing patent claims. Given the patent context and claims text, analyze each claim for strength and issues.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "overallScore": <number 1-10>,
  "claims": [
    {
      "number": <claim number>,
      "summary": "<one sentence summary>",
      "strength": "<strong|moderate|weak>",
      "issues": ["<issue 1>", "<issue 2>"]
    }
  ],
  "strengths": ["<strength 1>", "<strength 2>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`;

export function analyzeClaimsUseCase(
  assetRepo: AssetRepository,
  aiService: AIService,
) {
  return async (assetId: AssetId, orgId: OrganizationId, claimsText: string): Promise<Result<ClaimAnalysis>> => {
    const asset = await assetRepo.findById(assetId, orgId);
    if (!asset) return err("Asset not found");

    let response: string;
    try {
      response = await aiService.complete(
        CLAIMS_SYSTEM_PROMPT,
        `Patent: "${asset.title}"\nType: ${asset.type}\nJurisdiction: ${asset.jurisdiction.code} (${asset.jurisdiction.name})\n\nClaims:\n${claimsText}`,
      );
    } catch {
      return err("AI service unavailable");
    }

    try {
      const parsed = JSON.parse(response);
      const analysis: ClaimAnalysis = {
        overallScore: Number(parsed.overallScore) || 0,
        claims: Array.isArray(parsed.claims)
          ? parsed.claims.map((c: Record<string, unknown>) => ({
              number: Number(c.number) || 0,
              summary: String(c.summary ?? ""),
              strength: ["strong", "moderate", "weak"].includes(c.strength as string) ? c.strength as "strong" | "moderate" | "weak" : "moderate",
              issues: Array.isArray(c.issues) ? c.issues.filter((i: unknown): i is string => typeof i === "string") : [],
            }))
          : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.filter((s: unknown): s is string => typeof s === "string") : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.filter((s: unknown): s is string => typeof s === "string") : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.filter((s: unknown): s is string => typeof s === "string") : [],
      };
      return ok(analysis);
    } catch {
      return err("Failed to parse AI response");
    }
  };
}
```

**Step 2: Export from application index.ts**

In `packages/application/src/index.ts`, add:

```typescript
export { analyzeClaimsUseCase } from "./use-cases/patent-analysis.js";
```

**Step 3: Write tests**

Create `packages/infrastructure/src/patent-analysis-use-cases.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { analyzeClaimsUseCase } from "@ipms/application";
import { createInMemoryAssetRepository } from "./in-memory-asset-repository.js";
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

describe("analyzeClaimsUseCase", () => {
  it("analyzes claims and returns structured result", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = {
      async complete() {
        return JSON.stringify({
          overallScore: 7,
          claims: [
            { number: 1, summary: "Main method claim", strength: "strong", issues: [] },
            { number: 2, summary: "Dependent claim", strength: "moderate", issues: ["Too broad"] },
          ],
          strengths: ["Novel approach"],
          weaknesses: ["Claim 2 too broad"],
          recommendations: ["Narrow claim 2"],
        });
      },
    };

    const analyze = analyzeClaimsUseCase(assetRepo, aiService);
    const result = await analyze(ASSET_ID, ORG_ID, "1. A method for...\n2. The method of claim 1...");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallScore).toBe(7);
      expect(result.value.claims).toHaveLength(2);
      expect(result.value.claims[0].strength).toBe("strong");
      expect(result.value.strengths).toEqual(["Novel approach"]);
      expect(result.value.recommendations).toEqual(["Narrow claim 2"]);
    }
  });

  it("returns error for non-existent asset", async () => {
    const assetRepo = createInMemoryAssetRepository();
    const aiService = { async complete() { return ""; } };

    const analyze = analyzeClaimsUseCase(assetRepo, aiService);
    const result = await analyze(ASSET_ID, ORG_ID, "claims text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Asset not found");
  });

  it("handles malformed AI response", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = { async complete() { return "not json"; } };

    const analyze = analyzeClaimsUseCase(assetRepo, aiService);
    const result = await analyze(ASSET_ID, ORG_ID, "claims text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Failed to parse AI response");
  });

  it("handles AI service failure", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = { async complete() { throw new Error("API down"); } };

    const analyze = analyzeClaimsUseCase(assetRepo, aiService);
    const result = await analyze(ASSET_ID, ORG_ID, "claims text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("AI service unavailable");
  });
});
```

**Step 4: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add analyzeClaimsUseCase with tests"
```

---

### Task 3: Add assessPatentabilityUseCase

**Files:**
- Modify: `packages/application/src/use-cases/patent-analysis.ts`
- Modify: `packages/application/src/index.ts`
- Modify: `packages/infrastructure/src/patent-analysis-use-cases.test.ts`

**Step 1: Add the use case**

In `packages/application/src/use-cases/patent-analysis.ts`, add after the existing imports and before `analyzeClaimsUseCase`:

Add import for `PatentabilityAssessment`:
```typescript
import type { ClaimAnalysis, PatentabilityAssessment } from "@ipms/domain";
```

Then add after `analyzeClaimsUseCase`:

```typescript
const PATENTABILITY_SYSTEM_PROMPT = `You are an expert patent attorney assessing patentability of an invention. Given the patent context and invention disclosure, evaluate patentability across three criteria: novelty, non-obviousness, and utility.

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "overallScore": <number 1-10>,
  "novelty": { "score": <number 1-10>, "reasoning": "<explanation>" },
  "nonObviousness": { "score": <number 1-10>, "reasoning": "<explanation>" },
  "utility": { "score": <number 1-10>, "reasoning": "<explanation>" },
  "risks": ["<risk 1>", "<risk 2>"],
  "recommendations": ["<recommendation 1>", "<recommendation 2>"]
}`;

export function assessPatentabilityUseCase(
  assetRepo: AssetRepository,
  aiService: AIService,
) {
  return async (assetId: AssetId, orgId: OrganizationId, disclosureText: string): Promise<Result<PatentabilityAssessment>> => {
    const asset = await assetRepo.findById(assetId, orgId);
    if (!asset) return err("Asset not found");

    let response: string;
    try {
      response = await aiService.complete(
        PATENTABILITY_SYSTEM_PROMPT,
        `Patent: "${asset.title}"\nType: ${asset.type}\nJurisdiction: ${asset.jurisdiction.code} (${asset.jurisdiction.name})\n\nInvention Disclosure:\n${disclosureText}`,
      );
    } catch {
      return err("AI service unavailable");
    }

    try {
      const parsed = JSON.parse(response);
      const parseScoreSection = (section: Record<string, unknown> | undefined) => ({
        score: Number(section?.score) || 0,
        reasoning: String(section?.reasoning ?? ""),
      });
      const assessment: PatentabilityAssessment = {
        overallScore: Number(parsed.overallScore) || 0,
        novelty: parseScoreSection(parsed.novelty),
        nonObviousness: parseScoreSection(parsed.nonObviousness),
        utility: parseScoreSection(parsed.utility),
        risks: Array.isArray(parsed.risks) ? parsed.risks.filter((s: unknown): s is string => typeof s === "string") : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.filter((s: unknown): s is string => typeof s === "string") : [],
      };
      return ok(assessment);
    } catch {
      return err("Failed to parse AI response");
    }
  };
}
```

**Step 2: Export from application index.ts**

Update the existing export to include:

```typescript
export { analyzeClaimsUseCase, assessPatentabilityUseCase } from "./use-cases/patent-analysis.js";
```

**Step 3: Add tests**

Append to `packages/infrastructure/src/patent-analysis-use-cases.test.ts`:

```typescript
import { assessPatentabilityUseCase } from "@ipms/application";

describe("assessPatentabilityUseCase", () => {
  it("assesses patentability and returns structured result", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = {
      async complete() {
        return JSON.stringify({
          overallScore: 8,
          novelty: { score: 9, reasoning: "Highly novel approach" },
          nonObviousness: { score: 7, reasoning: "Some prior art exists" },
          utility: { score: 8, reasoning: "Clear practical application" },
          risks: ["Similar prior art in adjacent field"],
          recommendations: ["Conduct prior art search"],
        });
      },
    };

    const assess = assessPatentabilityUseCase(assetRepo, aiService);
    const result = await assess(ASSET_ID, ORG_ID, "This invention relates to...");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.overallScore).toBe(8);
      expect(result.value.novelty.score).toBe(9);
      expect(result.value.nonObviousness.reasoning).toBe("Some prior art exists");
      expect(result.value.risks).toEqual(["Similar prior art in adjacent field"]);
    }
  });

  it("returns error for non-existent asset", async () => {
    const assetRepo = createInMemoryAssetRepository();
    const aiService = { async complete() { return ""; } };

    const assess = assessPatentabilityUseCase(assetRepo, aiService);
    const result = await assess(ASSET_ID, ORG_ID, "disclosure text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Asset not found");
  });

  it("handles malformed AI response", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = { async complete() { return "invalid"; } };

    const assess = assessPatentabilityUseCase(assetRepo, aiService);
    const result = await assess(ASSET_ID, ORG_ID, "disclosure text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("Failed to parse AI response");
  });

  it("handles AI service failure", async () => {
    const assetRepo = createInMemoryAssetRepository();
    await assetRepo.save(ASSET);

    const aiService = { async complete() { throw new Error("API down"); } };

    const assess = assessPatentabilityUseCase(assetRepo, aiService);
    const result = await assess(ASSET_ID, ORG_ID, "disclosure text");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("AI service unavailable");
  });
});
```

**Step 4: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add assessPatentabilityUseCase with tests"
```

---

### Task 4: Wire use cases and add API routes

**Files:**
- Modify: `apps/web/src/lib/server/use-cases.ts`
- Create: `apps/web/src/routes/api/assets/[id]/analyze-claims/+server.ts`
- Create: `apps/web/src/routes/api/assets/[id]/assess-patentability/+server.ts`

**Step 1: Wire use cases**

In `apps/web/src/lib/server/use-cases.ts`, add to the import from `@ipms/application`:

```typescript
analyzeClaimsUseCase,
assessPatentabilityUseCase,
```

Add wirings at the end:

```typescript
export const analyzeClaims = analyzeClaimsUseCase(assetRepo, aiService);
export const assessPatentability = assessPatentabilityUseCase(assetRepo, aiService);
```

**Step 2: Create analyze-claims route**

Create `apps/web/src/routes/api/assets/[id]/analyze-claims/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { analyzeClaims } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const idResult = parseAssetId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const body = await event.request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return json({ error: "text is required" }, { status: 400 });

  const result = await analyzeClaims(idResult.value, auth.value.organizationId, text);
  return resultToResponse(result);
};
```

**Step 3: Create assess-patentability route**

Create `apps/web/src/routes/api/assets/[id]/assess-patentability/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { assessPatentability } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseAssetId } from "@ipms/shared";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const idResult = parseAssetId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const body = await event.request.json();
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) return json({ error: "text is required" }, { status: 400 });

  const result = await assessPatentability(idResult.value, auth.value.organizationId, text);
  return resultToResponse(result);
};
```

**Step 4: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add apps/web/
git commit -m "feat(web): add analyze-claims and assess-patentability API routes"
```

---

### Task 5: Update roadmap

**Files:**
- Modify: `docs/roadmap.md`

**Step 1: Update roadmap**

In `docs/roadmap.md`, under Phase 4, mark completed items:

```markdown
- [x] Patent claim analysis and strength scoring
- [x] Patentability assessment from invention disclosures
```

**Step 2: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: mark Phase 4b items complete in roadmap"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Domain types (`ClaimAnalysis`, `PatentabilityAssessment`) | `packages/domain/src/entities.ts` |
| 2 | `analyzeClaimsUseCase` + 4 tests | `packages/application/src/use-cases/patent-analysis.ts` |
| 3 | `assessPatentabilityUseCase` + 4 tests | same file |
| 4 | Wire use cases + 2 API routes | `apps/web/` |
| 5 | Roadmap update | `docs/roadmap.md` |
