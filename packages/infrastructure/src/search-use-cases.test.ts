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
