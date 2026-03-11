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
