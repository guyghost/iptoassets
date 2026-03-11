# Phase 4a: AI Search & Classification — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add natural language search across assets (pgvector + Voyage embeddings) and AI-powered document classification (Claude API).

**Architecture:** Two new ports (`AIService`, `EmbeddingService`) with Claude/Voyage implementations in infrastructure. pgvector for vector storage. Document entity gains `tags` field. Search flow: embed query -> cosine similarity -> return assets. Classification flow: send doc context to Claude -> parse tags -> update document.

**Tech Stack:** Anthropic SDK, Voyage AI SDK, pgvector, Drizzle ORM, Vitest

**Design doc:** `docs/plans/2026-03-11-phase4-ai-intelligence-design.md`

---

### Task 1: Add `tags` field to Document entity

**Files:**
- Modify: `packages/domain/src/entities.ts`
- Modify: `packages/domain/src/document.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/document.test.ts`

**Step 1: Update Document interface**

In `packages/domain/src/entities.ts`, add `tags` to the `Document` interface:

```typescript
export interface Document {
  readonly id: DocumentId;
  readonly assetId: AssetId;
  readonly name: string;
  readonly type: DocumentType;
  readonly url: string;
  readonly uploadedAt: Date;
  readonly status: DocumentStatus;
  readonly organizationId: OrganizationId;
  readonly tags: readonly string[];
}
```

**Step 2: Update createDocument to set tags**

In `packages/domain/src/document.ts`, update the return value in `createDocument`:

```typescript
return ok({
  id: input.id,
  assetId: input.assetId,
  name: input.name.trim(),
  type: input.type,
  url: input.url.trim(),
  uploadedAt: new Date(),
  status: "uploaded" as const,
  organizationId: input.organizationId,
  tags: [],
});
```

**Step 3: Add updateDocumentTags function**

In `packages/domain/src/document.ts`, add:

```typescript
export function updateDocumentTags(doc: Document, tags: readonly string[]): Result<Document> {
  return ok({ ...doc, tags });
}
```

Export from `packages/domain/src/index.ts`:

```typescript
export { createDocument, updateDocumentStatus, updateDocumentTags } from "./document.js";
```

**Step 4: Write test for updateDocumentTags**

Add to `packages/domain/src/document.test.ts`:

```typescript
import { updateDocumentTags } from "./document.js";

describe("updateDocumentTags", () => {
  it("updates document tags", () => {
    const doc = {
      id: "550e8400-e29b-41d4-a716-446655440000" as DocumentId,
      assetId: "660e8400-e29b-41d4-a716-446655440000" as AssetId,
      name: "Test",
      type: "claim" as const,
      url: "https://example.com",
      uploadedAt: new Date(),
      status: "uploaded" as const,
      organizationId: "770e8400-e29b-41d4-a716-446655440000" as OrganizationId,
      tags: [] as readonly string[],
    };
    const result = updateDocumentTags(doc, ["patent", "claims", "draft"]);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.tags).toEqual(["patent", "claims", "draft"]);
  });
});
```

**Step 5: Fix existing tests and code**

Existing tests that create `Document` objects (in test files and in-memory repos) don't include `tags`. Since the interface now requires it, you need to add `tags: []` to every `Document` literal in:
- `packages/domain/src/document.test.ts` (existing test fixtures)
- `packages/infrastructure/src/document-use-cases.test.ts` (the `UPLOADED_DOC` constant)
- Any other test files creating Document objects

Also update:
- `packages/infrastructure/src/in-memory-document-repository.ts` — no changes needed (stores whatever Document is given)
- `packages/infrastructure/src/postgres/pg-document-repository.ts` — update `toEntity` to include `tags`:
  ```typescript
  tags: row.tags ?? [],
  ```
  And update `save` to include `tags` in both insert and upsert.

**Step 6: Run all tests**

Run: `pnpm test`
Expected: ALL PASS (may need to fix Document literals missing `tags`)

**Step 7: Commit**

```bash
git add packages/domain/ packages/infrastructure/
git commit -m "feat(domain): add tags field to Document entity"
```

---

### Task 2: Add AIService and EmbeddingService ports

**Files:**
- Modify: `packages/application/src/ports.ts`
- Modify: `packages/application/src/index.ts`

**Step 1: Add port interfaces**

In `packages/application/src/ports.ts`, add at the end:

```typescript
export interface AIService {
  complete(systemPrompt: string, userPrompt: string): Promise<string>;
}

export interface EmbeddingService {
  embed(texts: string[]): Promise<number[][]>;
}

export interface AssetEmbeddingRepository {
  save(assetId: AssetId, orgId: OrganizationId, embedding: number[]): Promise<void>;
  searchByVector(orgId: OrganizationId, embedding: number[], limit: number): Promise<readonly AssetId[]>;
  deleteByAssetId(assetId: AssetId): Promise<void>;
}
```

**Step 2: Export from index**

In `packages/application/src/index.ts`, add:

```typescript
export type { AIService, EmbeddingService, AssetEmbeddingRepository } from "./ports.js";
```

**Step 3: Verify**

Run: `pnpm test`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add packages/application/
git commit -m "feat(application): add AIService, EmbeddingService, AssetEmbeddingRepository ports"
```

---

### Task 3: Add no-op and AI service implementations

**Files:**
- Create: `packages/infrastructure/src/noop-ai-service.ts`
- Create: `packages/infrastructure/src/noop-embedding-service.ts`
- Create: `packages/infrastructure/src/claude-ai-service.ts`
- Create: `packages/infrastructure/src/voyage-embedding-service.ts`
- Create: `packages/infrastructure/src/in-memory-asset-embedding-repository.ts`
- Modify: `packages/infrastructure/src/index.ts`

**Step 1: Install dependencies**

Run: `cd /Users/guy/Developer/melvin/iptoassets/packages/infrastructure && pnpm add @anthropic-ai/sdk voyageai`

**Step 2: Create no-op services**

Create `packages/infrastructure/src/noop-ai-service.ts`:

```typescript
import type { AIService } from "@ipms/application";

export function createNoOpAIService(): AIService {
  return {
    async complete() { return ""; },
  };
}
```

Create `packages/infrastructure/src/noop-embedding-service.ts`:

```typescript
import type { EmbeddingService } from "@ipms/application";

export function createNoOpEmbeddingService(): EmbeddingService {
  return {
    async embed(texts) { return texts.map(() => new Array(1024).fill(0)); },
  };
}
```

**Step 3: Create Claude AI service**

Create `packages/infrastructure/src/claude-ai-service.ts`:

```typescript
import Anthropic from "@anthropic-ai/sdk";
import type { AIService } from "@ipms/application";

export function createClaudeAIService(apiKey: string): AIService {
  const client = new Anthropic({ apiKey });

  return {
    async complete(systemPrompt, userPrompt) {
      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
      const block = response.content[0];
      return block.type === "text" ? block.text : "";
    },
  };
}
```

**Step 4: Create Voyage embedding service**

Create `packages/infrastructure/src/voyage-embedding-service.ts`:

```typescript
import { VoyageAIClient } from "voyageai";
import type { EmbeddingService } from "@ipms/application";

export function createVoyageEmbeddingService(apiKey: string): EmbeddingService {
  const client = new VoyageAIClient({ apiKey });

  return {
    async embed(texts) {
      const result = await client.embed({
        input: texts,
        model: "voyage-3",
      });
      return result.data!.map((d) => d.embedding!);
    },
  };
}
```

**Step 5: Create in-memory asset embedding repository**

Create `packages/infrastructure/src/in-memory-asset-embedding-repository.ts`:

```typescript
import type { AssetId, OrganizationId } from "@ipms/shared";
import type { AssetEmbeddingRepository } from "@ipms/application";

export function createInMemoryAssetEmbeddingRepository(): AssetEmbeddingRepository {
  const store = new Map<string, { orgId: OrganizationId; embedding: number[] }>();

  function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
  }

  return {
    async save(assetId, orgId, embedding) {
      store.set(assetId, { orgId, embedding });
    },
    async searchByVector(orgId, embedding, limit) {
      const results = [...store.entries()]
        .filter(([, v]) => v.orgId === orgId)
        .map(([id, v]) => ({ id: id as AssetId, score: cosineSimilarity(v.embedding, embedding) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      return results.map((r) => r.id);
    },
    async deleteByAssetId(assetId) {
      store.delete(assetId);
    },
  };
}
```

**Step 6: Export from index**

In `packages/infrastructure/src/index.ts`, add:

```typescript
export { createNoOpAIService } from "./noop-ai-service.js";
export { createNoOpEmbeddingService } from "./noop-embedding-service.js";
export { createClaudeAIService } from "./claude-ai-service.js";
export { createVoyageEmbeddingService } from "./voyage-embedding-service.js";
export { createInMemoryAssetEmbeddingRepository } from "./in-memory-asset-embedding-repository.js";
```

**Step 7: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/infrastructure/
git commit -m "feat(infrastructure): add Claude, Voyage, and no-op AI service implementations"
```

---

### Task 4: Add search and indexing use cases

**Files:**
- Create: `packages/application/src/use-cases/search.ts`
- Modify: `packages/application/src/index.ts`
- Create: `packages/infrastructure/src/search-use-cases.test.ts`

**Step 1: Create search use cases**

Create `packages/application/src/use-cases/search.ts`:

```typescript
import type { AssetId, OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { IPAsset } from "@ipms/domain";
import type { AssetRepository, AssetEmbeddingRepository, EmbeddingService } from "../ports.js";

function assetToText(asset: IPAsset): string {
  return `${asset.title} ${asset.type} ${asset.jurisdiction.code} ${asset.jurisdiction.name} ${asset.status} ${asset.owner}`;
}

export function indexAssetEmbeddingUseCase(
  assetRepo: AssetRepository,
  embeddingRepo: AssetEmbeddingRepository,
  embeddingService: EmbeddingService,
) {
  return async (assetId: AssetId, orgId: OrganizationId): Promise<Result<true>> => {
    const asset = await assetRepo.findById(assetId, orgId);
    if (!asset) return { ok: false, error: "Asset not found" };

    const text = assetToText(asset);
    const [embedding] = await embeddingService.embed([text]);
    await embeddingRepo.save(assetId, orgId, embedding);
    return ok(true);
  };
}

export function reindexAllAssetsUseCase(
  assetRepo: AssetRepository,
  embeddingRepo: AssetEmbeddingRepository,
  embeddingService: EmbeddingService,
) {
  return async (orgId: OrganizationId): Promise<Result<number>> => {
    const assets = await assetRepo.findAll(orgId);
    if (assets.length === 0) return ok(0);

    const texts = assets.map(assetToText);
    const embeddings = await embeddingService.embed(texts);

    for (let i = 0; i < assets.length; i++) {
      await embeddingRepo.save(assets[i].id, orgId, embeddings[i]);
    }

    return ok(assets.length);
  };
}

export function searchAssetsUseCase(
  assetRepo: AssetRepository,
  embeddingRepo: AssetEmbeddingRepository,
  embeddingService: EmbeddingService,
) {
  return async (orgId: OrganizationId, query: string, limit = 20): Promise<Result<readonly IPAsset[]>> => {
    const [queryEmbedding] = await embeddingService.embed([query]);
    const assetIds = await embeddingRepo.searchByVector(orgId, queryEmbedding, limit);

    const assets: IPAsset[] = [];
    for (const id of assetIds) {
      const asset = await assetRepo.findById(id, orgId);
      if (asset) assets.push(asset);
    }

    return ok(assets);
  };
}
```

**Step 2: Export from index**

In `packages/application/src/index.ts`, add:

```typescript
export {
  indexAssetEmbeddingUseCase,
  reindexAllAssetsUseCase,
  searchAssetsUseCase,
} from "./use-cases/search.js";
```

**Step 3: Write tests**

Create `packages/infrastructure/src/search-use-cases.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { indexAssetEmbeddingUseCase, reindexAllAssetsUseCase, searchAssetsUseCase } from "@ipms/application";
import { createInMemoryAssetRepository } from "./in-memory-asset-repository.js";
import { createInMemoryAssetEmbeddingRepository } from "./in-memory-asset-embedding-repository.js";
import { createNoOpEmbeddingService } from "./noop-embedding-service.js";
import type { AssetId, OrganizationId } from "@ipms/shared";
import type { IPAsset } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;

function makeAsset(id: string, title: string): IPAsset {
  return {
    id: id as AssetId,
    title,
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
}

describe("search use cases", () => {
  let assetRepo: ReturnType<typeof createInMemoryAssetRepository>;
  let embeddingRepo: ReturnType<typeof createInMemoryAssetEmbeddingRepository>;
  let embeddingService: ReturnType<typeof createNoOpEmbeddingService>;

  beforeEach(() => {
    assetRepo = createInMemoryAssetRepository();
    embeddingRepo = createInMemoryAssetEmbeddingRepository();
    embeddingService = createNoOpEmbeddingService();
  });

  it("indexes an asset embedding", async () => {
    const asset = makeAsset("aae84000-e29b-41d4-a716-446655440001", "Quantum Computing Patent");
    await assetRepo.save(asset);

    const index = indexAssetEmbeddingUseCase(assetRepo, embeddingRepo, embeddingService);
    const result = await index(asset.id, ORG_ID);
    expect(result.ok).toBe(true);
  });

  it("reindexes all assets", async () => {
    await assetRepo.save(makeAsset("aae84000-e29b-41d4-a716-446655440001", "Patent A"));
    await assetRepo.save(makeAsset("aae84000-e29b-41d4-a716-446655440002", "Patent B"));

    const reindex = reindexAllAssetsUseCase(assetRepo, embeddingRepo, embeddingService);
    const result = await reindex(ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(2);
  });

  it("searches assets by query", async () => {
    const asset = makeAsset("aae84000-e29b-41d4-a716-446655440001", "Quantum Computing Patent");
    await assetRepo.save(asset);

    const reindex = reindexAllAssetsUseCase(assetRepo, embeddingRepo, embeddingService);
    await reindex(ORG_ID);

    const search = searchAssetsUseCase(assetRepo, embeddingRepo, embeddingService);
    const result = await search(ORG_ID, "quantum");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.length).toBeGreaterThanOrEqual(1);
  });
});
```

**Step 4: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add search and indexing use cases with tests"
```

---

### Task 5: Add document classification use case

**Files:**
- Create: `packages/application/src/use-cases/classify.ts`
- Modify: `packages/application/src/index.ts`
- Create: `packages/infrastructure/src/classify-use-cases.test.ts`

**Step 1: Create classification use case**

Create `packages/application/src/use-cases/classify.ts`:

```typescript
import type { DocumentId, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Document } from "@ipms/domain";
import { updateDocumentTags } from "@ipms/domain";
import type { DocumentRepository, AssetRepository, AIService } from "../ports.js";

export function classifyDocumentUseCase(
  docRepo: DocumentRepository,
  assetRepo: AssetRepository,
  aiService: AIService,
) {
  return async (docId: DocumentId, orgId: OrganizationId): Promise<Result<Document>> => {
    const doc = await docRepo.findById(docId, orgId);
    if (!doc) return err("Document not found");

    const asset = await assetRepo.findById(doc.assetId, orgId);
    const assetTitle = asset ? asset.title : "Unknown";

    const response = await aiService.complete(
      "You are an IP document classifier. Given a document name, type, and its associated patent/asset title, suggest 3-5 classification tags. Return ONLY a JSON array of lowercase strings, nothing else. Example: [\"patent\", \"claims\", \"draft\"]",
      `Document name: "${doc.name}"\nDocument type: ${doc.type}\nAsset: "${assetTitle}"`,
    );

    let tags: string[];
    try {
      tags = JSON.parse(response);
      if (!Array.isArray(tags)) tags = [];
      tags = tags.filter((t): t is string => typeof t === "string").map((t) => t.toLowerCase().trim()).filter(Boolean);
    } catch {
      tags = [];
    }

    const result = updateDocumentTags(doc, tags);
    if (!result.ok) return result;

    await docRepo.save(result.value);
    return result;
  };
}
```

**Step 2: Export from index**

In `packages/application/src/index.ts`, add:

```typescript
export { classifyDocumentUseCase } from "./use-cases/classify.js";
```

**Step 3: Write tests**

Create `packages/infrastructure/src/classify-use-cases.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { classifyDocumentUseCase } from "@ipms/application";
import { createInMemoryDocumentRepository } from "./in-memory-document-repository.js";
import { createInMemoryAssetRepository } from "./in-memory-asset-repository.js";
import type { DocumentId, AssetId, OrganizationId } from "@ipms/shared";
import type { Document, IPAsset } from "@ipms/domain";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const DOC_ID = "660e8400-e29b-41d4-a716-446655440000" as DocumentId;
const ASSET_ID = "770e8400-e29b-41d4-a716-446655440000" as AssetId;

describe("classifyDocumentUseCase", () => {
  it("classifies a document with AI-suggested tags", async () => {
    const docRepo = createInMemoryDocumentRepository();
    const assetRepo = createInMemoryAssetRepository();
    const aiService = {
      async complete() { return '["patent", "claims", "filing"]'; },
    };

    const doc: Document = {
      id: DOC_ID,
      assetId: ASSET_ID,
      name: "Claims Draft v2",
      type: "claim",
      url: "https://example.com/doc.pdf",
      uploadedAt: new Date(),
      status: "uploaded",
      organizationId: ORG_ID,
      tags: [],
    };
    await docRepo.save(doc);

    const asset: IPAsset = {
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
    await assetRepo.save(asset);

    const classify = classifyDocumentUseCase(docRepo, assetRepo, aiService);
    const result = await classify(DOC_ID, ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tags).toEqual(["patent", "claims", "filing"]);
    }
  });

  it("handles malformed AI response gracefully", async () => {
    const docRepo = createInMemoryDocumentRepository();
    const assetRepo = createInMemoryAssetRepository();
    const aiService = {
      async complete() { return "not valid json"; },
    };

    const doc: Document = {
      id: DOC_ID,
      assetId: ASSET_ID,
      name: "Test Doc",
      type: "claim",
      url: "https://example.com",
      uploadedAt: new Date(),
      status: "uploaded",
      organizationId: ORG_ID,
      tags: [],
    };
    await docRepo.save(doc);

    const classify = classifyDocumentUseCase(docRepo, assetRepo, aiService);
    const result = await classify(DOC_ID, ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.tags).toEqual([]);
    }
  });
});
```

**Step 4: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add document classification use case with tests"
```

---

### Task 6: Add PostgreSQL asset_embeddings table and repository + document tags migration

**Files:**
- Modify: `packages/infrastructure/src/postgres/schema.ts`
- Create: `packages/infrastructure/src/postgres/pg-asset-embedding-repository.ts`
- Modify: `packages/infrastructure/src/postgres/pg-document-repository.ts`
- Modify: `packages/infrastructure/src/postgres/index.ts`

**Step 1: Add asset_embeddings table to schema**

In `packages/infrastructure/src/postgres/schema.ts`, add:

```typescript
import { pgTable, uuid, text, timestamp, boolean, primaryKey, index, uniqueIndex, customType } from "drizzle-orm/pg-core";

const vector = customType<{ data: string }>({
  dataType() {
    return "vector(1024)";
  },
});

export const assetEmbeddings = pgTable("asset_embeddings", {
  assetId: uuid("asset_id").primaryKey().references(() => assets.id),
  organizationId: uuid("organization_id").notNull(),
  embedding: vector("embedding").notNull(),
}, (table) => [
  index("asset_embeddings_organization_id_idx").on(table.organizationId),
]);
```

Also add `tags` column to existing `documents` table:

```typescript
// In the documents table definition, add:
tags: text("tags").array().notNull().default([]),
```

Note: Drizzle uses `.array()` for PostgreSQL arrays. Check the exact Drizzle API — it may be `text("tags").array().default(sql`'{}'`)`.

**Step 2: Update pg-document-repository.ts**

Update `toEntity` to include `tags`:

```typescript
function toEntity(row: DocumentRow): Document {
  return {
    id: row.id as DocumentId,
    assetId: row.assetId as AssetId,
    name: row.name,
    type: row.type as DocumentType,
    url: row.url,
    uploadedAt: row.uploadedAt,
    status: row.status as DocumentStatus,
    organizationId: row.organizationId as OrganizationId,
    tags: row.tags ?? [],
  };
}
```

Update `save` to include `tags` in both insert values and onConflictDoUpdate set:

```typescript
// In values:
tags: doc.tags as string[],

// In set:
tags: doc.tags as string[],
```

**Step 3: Create pg-asset-embedding-repository.ts**

Create `packages/infrastructure/src/postgres/pg-asset-embedding-repository.ts`:

```typescript
import { eq, and, sql } from "drizzle-orm";
import type { AssetId, OrganizationId } from "@ipms/shared";
import type { AssetEmbeddingRepository } from "@ipms/application";
import { assetEmbeddings } from "./schema.js";
import type { Database } from "./connection.js";

export function createPgAssetEmbeddingRepository(db: Database): AssetEmbeddingRepository {
  return {
    async save(assetId, orgId, embedding) {
      const vectorStr = `[${embedding.join(",")}]`;
      await db.insert(assetEmbeddings).values({
        assetId,
        organizationId: orgId,
        embedding: vectorStr,
      }).onConflictDoUpdate({
        target: assetEmbeddings.assetId,
        set: {
          embedding: vectorStr,
          organizationId: orgId,
        },
      });
    },

    async searchByVector(orgId, embedding, limit) {
      const vectorStr = `[${embedding.join(",")}]`;
      const rows = await db.select({ assetId: assetEmbeddings.assetId })
        .from(assetEmbeddings)
        .where(eq(assetEmbeddings.organizationId, orgId))
        .orderBy(sql`embedding <=> ${vectorStr}::vector`)
        .limit(limit);
      return rows.map((r) => r.assetId as AssetId);
    },

    async deleteByAssetId(assetId) {
      await db.delete(assetEmbeddings).where(eq(assetEmbeddings.assetId, assetId));
    },
  };
}
```

**Step 4: Export from postgres/index.ts**

Add:

```typescript
export { createPgAssetEmbeddingRepository } from "./pg-asset-embedding-repository.js";
```

**Step 5: Generate migration**

Run: `cd /Users/guy/Developer/melvin/iptoassets/packages/infrastructure && npx drizzle-kit generate`

IMPORTANT: The generated migration will NOT include `CREATE EXTENSION vector`. You need to manually prepend this to the generated SQL file:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Add this as the first line of the generated migration file.

**Step 6: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add packages/infrastructure/
git commit -m "feat(infrastructure): add pgvector asset_embeddings table and document tags column"
```

---

### Task 7: Wire AI services and new use cases in web app

**Files:**
- Modify: `apps/web/src/lib/server/repositories.ts`
- Modify: `apps/web/src/lib/server/use-cases.ts`

**Step 1: Wire AI services in repositories.ts**

Add type imports:

```typescript
import type { ..., AIService, EmbeddingService, AssetEmbeddingRepository } from "@ipms/application";
```

Add declarations:

```typescript
let aiService: AIService;
let embeddingService: EmbeddingService;
let assetEmbeddingRepo: AssetEmbeddingRepository;
```

In the PG branch, after existing repo init:

```typescript
if (env.ANTHROPIC_API_KEY) {
  const { createClaudeAIService } = await import("@ipms/infrastructure");
  aiService = createClaudeAIService(env.ANTHROPIC_API_KEY);
} else {
  const { createNoOpAIService } = await import("@ipms/infrastructure");
  aiService = createNoOpAIService();
}

if (env.VOYAGE_API_KEY) {
  const { createVoyageEmbeddingService } = await import("@ipms/infrastructure");
  embeddingService = createVoyageEmbeddingService(env.VOYAGE_API_KEY);
} else {
  const { createNoOpEmbeddingService } = await import("@ipms/infrastructure");
  embeddingService = createNoOpEmbeddingService();
}

const { createPgAssetEmbeddingRepository } = await import("@ipms/infrastructure/postgres");
assetEmbeddingRepo = createPgAssetEmbeddingRepository(db);
```

In the in-memory branch:

```typescript
const { createNoOpAIService: createNoOpAI, createNoOpEmbeddingService: createNoOpEmbed, createInMemoryAssetEmbeddingRepository } = await import("@ipms/infrastructure");
aiService = createNoOpAI();
embeddingService = createNoOpEmbed();
assetEmbeddingRepo = createInMemoryAssetEmbeddingRepository();
```

Add to export statement: `aiService, embeddingService, assetEmbeddingRepo`

**Step 2: Wire use cases in use-cases.ts**

Add imports:

```typescript
import {
  ...,
  indexAssetEmbeddingUseCase,
  reindexAllAssetsUseCase,
  searchAssetsUseCase,
  classifyDocumentUseCase,
} from "@ipms/application";
import { ..., aiService, embeddingService, assetEmbeddingRepo } from "./repositories.js";
```

Add wirings:

```typescript
export const indexAssetEmbedding = indexAssetEmbeddingUseCase(assetRepo, assetEmbeddingRepo, embeddingService);
export const reindexAllAssets = reindexAllAssetsUseCase(assetRepo, assetEmbeddingRepo, embeddingService);
export const searchAssets = searchAssetsUseCase(assetRepo, assetEmbeddingRepo, embeddingService);
export const classifyDocument = classifyDocumentUseCase(documentRepo, assetRepo, aiService);
```

**Step 3: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add apps/web/src/lib/server/
git commit -m "feat(web): wire AI services and new use cases"
```

---

### Task 8: Add API routes for search, reindex, and classify

**Files:**
- Create: `apps/web/src/routes/api/search/+server.ts`
- Create: `apps/web/src/routes/api/admin/reindex/+server.ts`
- Create: `apps/web/src/routes/api/documents/[id]/classify/+server.ts`

**Step 1: Create search route**

Create `apps/web/src/routes/api/search/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { searchAssets } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "asset:read");
  if (forbidden) return forbidden;

  const query = event.url.searchParams.get("q") ?? "";
  if (!query.trim()) return resultToResponse({ ok: true, value: [] });

  const limit = event.url.searchParams.has("limit") ? Number(event.url.searchParams.get("limit")) : 20;
  const result = await searchAssets(auth.value.organizationId, query, limit);
  return resultToResponse(result);
};
```

**Step 2: Create admin reindex route**

Create `apps/web/src/routes/api/admin/reindex/+server.ts`:

```typescript
import type { RequestHandler } from "./$types";
import { reindexAllAssets } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "org:manage");
  if (forbidden) return forbidden;

  const result = await reindexAllAssets(auth.value.organizationId);
  return resultToResponse(result);
};
```

**Step 3: Create document classify route**

Create `apps/web/src/routes/api/documents/[id]/classify/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { classifyDocument } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";
import { parseDocumentId } from "@ipms/shared";

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "document:update-status");
  if (forbidden) return forbidden;

  const idResult = parseDocumentId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await classifyDocument(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};
```

**Step 4: Run tests and commit**

Run: `pnpm test`
Expected: ALL PASS

```bash
git add apps/web/src/routes/api/
git commit -m "feat(web): add search, reindex, and classify API routes"
```

---

### Task 9: Update .env.example and roadmap

**Files:**
- Modify: `.env.example`
- Modify: `docs/roadmap.md`

**Step 1: Update .env.example**

Add:

```
# AI (Claude + Voyage) — optional, no-op if absent
ANTHROPIC_API_KEY=
VOYAGE_API_KEY=
```

**Step 2: Update roadmap**

In `docs/roadmap.md`, under Phase 4, mark completed items:

```markdown
- [x] Document classification and auto-tagging
- [x] Natural language search across portfolio
```

**Step 3: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 4: Commit**

```bash
git add .env.example docs/roadmap.md
git commit -m "docs: update env example and mark Phase 4a items complete"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Add `tags` to Document entity | `packages/domain/` |
| 2 | AIService, EmbeddingService, AssetEmbeddingRepository ports | `packages/application/src/ports.ts` |
| 3 | Claude, Voyage, no-op implementations + in-memory embedding repo | `packages/infrastructure/src/` |
| 4 | Search and indexing use cases + tests | `packages/application/src/use-cases/search.ts` |
| 5 | Document classification use case + tests | `packages/application/src/use-cases/classify.ts` |
| 6 | pgvector table + document tags migration + PG repos | `packages/infrastructure/src/postgres/` |
| 7 | Wire AI services in web app | `apps/web/src/lib/server/` |
| 8 | API routes: search, reindex, classify | `apps/web/src/routes/api/` |
| 9 | env.example + roadmap update | docs |
