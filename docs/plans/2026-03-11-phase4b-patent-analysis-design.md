# Phase 4b: Patent Analysis — Design

## Overview

Add AI-powered patent analysis to IPMS: claim strength analysis and patentability assessment. Both are stateless (no storage), reusing the `AIService` port from Phase 4a.

## Decisions

- **Input:** User-provided text (pasted in request body). No PDF parsing or document URL fetching.
- **Output:** Structured JSON parsed from Claude response, with error fallback.
- **Storage:** None. Results returned directly, not persisted.
- **AI provider:** Reuses existing `AIService` port (Claude API).

## Domain Types

```typescript
export interface ClaimAnalysis {
  readonly overallScore: number; // 1-10
  readonly claims: readonly {
    readonly number: number;
    readonly summary: string;
    readonly strength: "strong" | "moderate" | "weak";
    readonly issues: readonly string[];
  }[];
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  readonly recommendations: readonly string[];
}

export interface PatentabilityAssessment {
  readonly overallScore: number; // 1-10
  readonly novelty: { readonly score: number; readonly reasoning: string };
  readonly nonObviousness: { readonly score: number; readonly reasoning: string };
  readonly utility: { readonly score: number; readonly reasoning: string };
  readonly risks: readonly string[];
  readonly recommendations: readonly string[];
}
```

## Use Cases

### analyzeClaimsUseCase

- **Factory params:** `(assetRepo, aiService)`
- **Call params:** `(assetId, orgId, claimsText)`
- **Returns:** `Result<ClaimAnalysis>`
- **Flow:** Fetch asset for context (title, type, jurisdiction) → send claims text + context to Claude with structured JSON prompt → parse response → return

### assessPatentabilityUseCase

- **Factory params:** `(assetRepo, aiService)`
- **Call params:** `(assetId, orgId, disclosureText)`
- **Returns:** `Result<PatentabilityAssessment>`
- **Flow:** Fetch asset for context → send disclosure text + context to Claude with structured JSON prompt → parse response → return

Both use cases wrap `aiService.complete()` in try/catch and return `err("AI service unavailable")` on failure. Malformed JSON returns `err("Failed to parse AI response")`.

## API Routes

| Route | Method | Permission | Body | Response |
|-------|--------|------------|------|----------|
| `/api/assets/[id]/analyze-claims` | POST | `asset:read` | `{ text: string }` | `ClaimAnalysis` |
| `/api/assets/[id]/assess-patentability` | POST | `asset:read` | `{ text: string }` | `PatentabilityAssessment` |

## Changes to Existing Code

- `entities.ts` gains `ClaimAnalysis` and `PatentabilityAssessment` interfaces
- `domain/index.ts` exports the new types
- `use-cases.ts` wires the two new use cases
- No new ports, repos, or migrations

## Out of Scope

- PDF/document URL parsing
- Storing analysis results
- Analysis history
- Comparison between analyses
