import type { AssetId, OrganizationId } from "@ipms/shared";
import type { IPAsset } from "@ipms/domain";
import type { AssetRepository } from "@ipms/application";

export function createInMemoryAssetRepository(): AssetRepository {
  const store = new Map<string, IPAsset>();

  const key = (id: AssetId, orgId: OrganizationId) => `${orgId}:${id}`;

  return {
    async findById(id, orgId) {
      return store.get(key(id, orgId)) ?? null;
    },

    async findAll(orgId) {
      return [...store.values()].filter((a) => a.organizationId === orgId);
    },

    async save(asset) {
      store.set(key(asset.id, asset.organizationId), asset);
    },

    async delete(id, orgId) {
      return store.delete(key(id, orgId));
    },
  };
}
