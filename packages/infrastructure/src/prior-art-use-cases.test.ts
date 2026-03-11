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
