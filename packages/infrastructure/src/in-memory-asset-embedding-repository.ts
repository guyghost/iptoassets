import type { AssetId, OrganizationId } from "@ipms/shared";
import type { AssetEmbeddingRepository } from "@ipms/application";

export function createInMemoryAssetEmbeddingRepository(): AssetEmbeddingRepository {
  const store = new Map<
    string,
    { orgId: OrganizationId; embedding: number[] }
  >();

  function cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0,
      magA = 0,
      magB = 0;
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
        .map(([id, v]) => ({
          id: id as AssetId,
          score: cosineSimilarity(v.embedding, embedding),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
      return results.map((r) => r.id);
    },
    async deleteByAssetId(assetId) {
      store.delete(assetId);
    },
  };
}
