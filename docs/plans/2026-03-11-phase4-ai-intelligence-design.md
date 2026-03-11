# Phase 4: AI Intelligence

## Overview

Add AI-powered features to IPMS: natural language search, document classification, patent analysis, prior art search, and deadline risk prediction. Delivered in 4 sub-phases.

## Decisions

- **AI provider:** Claude API (Anthropic SDK) for reasoning/analysis
- **Embeddings:** Voyage AI (`voyage-3`) for semantic search
- **Vector storage:** pgvector extension on existing PostgreSQL
- **Patent office:** USPTO PatentsView API only (MVP)
- **Deadline risk:** Pure heuristics (no ML/AI)

## Sub-phases

| Sub-phase | Features | Dependencies |
|-----------|----------|-------------|
| **4a** | Natural language search (pgvector + Voyage) + Document classification (Claude) | Foundation |
| **4b** | Patent claim analysis + Patentability assessment (Claude) | 4a (AIService port) |
| **4c** | Automated prior art search (USPTO + Claude) | 4a + 4b |
| **4d** | Deadline risk prediction (heuristics) | Independent |

---

## Phase 4a: Search & Classification

### 1. AI Ports

```typescript
export interface AIService {
  complete(systemPrompt: string, userPrompt: string): Promise<string>;
}

export interface EmbeddingService {
  embed(texts: string[]): Promise<number[][]>;
}
```

Implementations:
- `createClaudeAIService(apiKey)` — Anthropic SDK
- `createVoyageEmbeddingService(apiKey)` — Voyage SDK
- `createNoOpAIService()` / `createNoOpEmbeddingService()` — tests/dev

### 2. Natural Language Search

**Indexation:**
- `indexAssetEmbeddingUseCase` — generates embedding from `title + type + jurisdiction + status + owner`, stores in `asset_embeddings`
- `reindexAllAssetsUseCase` — batch reindex for initial setup

**Search:**
- `searchAssetsUseCase(orgId, query)` — embeds query, cosine similarity search via pgvector, returns matching assets

**AssetEmbeddingRepository port:**
```typescript
export interface AssetEmbeddingRepository {
  save(assetId: AssetId, orgId: OrganizationId, embedding: number[]): Promise<void>;
  searchByVector(orgId: OrganizationId, embedding: number[], limit: number): Promise<readonly AssetId[]>;
  deleteByAssetId(assetId: AssetId): Promise<void>;
}
```

**PostgreSQL:**
- Extension: `pgvector`
- Table: `asset_embeddings(asset_id uuid PK, organization_id uuid, embedding vector(1024))`
- Search: `ORDER BY embedding <=> $query LIMIT 20`

### 3. Document Classification

**Entity change:** Add `tags: readonly string[]` to `Document` (default `[]`).

**Use case:** `classifyDocumentUseCase(docId, orgId)`:
- Fetches document + associated asset
- Sends to Claude: document name, type, asset title
- Parses response into 3-5 tags
- Updates document tags

**Not automatic at creation** — manual action via API to keep user control.

**Migration:** Add `tags text[] default '{}'` column to documents table.

### 4. API Routes

| Route | Method | Permission | Description |
|-------|--------|------------|-------------|
| `/api/search` | GET | `asset:read` | Natural language search (`?q=...`) |
| `/api/admin/reindex` | POST | `org:manage` | Batch reindex all asset embeddings |
| `/api/documents/[id]/classify` | POST | `document:update-status` | Classify document with AI |

### 5. Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | No | Claude API key. No-op if absent |
| `VOYAGE_API_KEY` | No | Voyage embedding API key. No-op if absent |

### 6. New Dependencies

- `@anthropic-ai/sdk` (infrastructure)
- `voyageai` (infrastructure)
- pgvector PostgreSQL extension

---

## Phase 4b: Patent Analysis (future)

- `analyzeClaimsUseCase` — Claude analyzes patent claims for strength/weaknesses
- `assessPatentabilityUseCase` — Claude evaluates patentability from invention disclosure
- New API routes for analysis results

## Phase 4c: Prior Art Search (future)

- USPTO PatentsView API integration
- `searchPriorArtUseCase` — queries USPTO, Claude analyzes relevance
- Results stored and linked to assets

## Phase 4d: Deadline Risk Prediction (future)

- Pure domain heuristics: workload, history, proximity, concurrent deadlines
- `computeDeadlineRiskUseCase` — returns risk score per deadline
- No AI/ML needed

---

## Changes to Existing Code (Phase 4a)

- `Document` entity gains `tags: readonly string[]`
- `createDocument` domain function sets `tags: []`
- Documents table migration adds `tags` column
- PG document repository maps `tags` field
- `repositories.ts` wires `AIService`, `EmbeddingService`, `AssetEmbeddingRepository`
- `use-cases.ts` wires new use cases

## Out of Scope (Phase 4a)

- Automatic classification on document creation
- Patent claim analysis (4b)
- Prior art search (4c)
- Deadline risk prediction (4d)
- Caching of AI responses
- Streaming AI responses
