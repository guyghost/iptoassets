import type { AssetId, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
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
    if (!asset) return err("Asset not found");

    const text = assetToText(asset);
    let embedding: number[];
    try {
      [embedding] = await embeddingService.embed([text]);
    } catch {
      return err("Embedding service unavailable");
    }
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
    let embeddings: number[][];
    try {
      embeddings = await embeddingService.embed(texts);
    } catch {
      return err("Embedding service unavailable");
    }

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
    let queryEmbedding: number[];
    try {
      [queryEmbedding] = await embeddingService.embed([query]);
    } catch {
      return err("Embedding service unavailable");
    }
    const assetIds = await embeddingRepo.searchByVector(orgId, queryEmbedding, limit);

    const assets: IPAsset[] = [];
    for (const id of assetIds) {
      const asset = await assetRepo.findById(id, orgId);
      if (asset) assets.push(asset);
    }

    return ok(assets);
  };
}
