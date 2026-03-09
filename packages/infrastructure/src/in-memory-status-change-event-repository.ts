import type { AssetId, OrganizationId } from "@ipms/shared";
import type { StatusChangeEvent } from "@ipms/domain";
import type { StatusChangeEventRepository } from "@ipms/application";

export function createInMemoryStatusChangeEventRepository(): StatusChangeEventRepository {
  const store = new Map<string, StatusChangeEvent>();

  return {
    async findByAssetId(assetId, orgId) {
      return [...store.values()]
        .filter((e) => e.assetId === assetId && e.organizationId === orgId)
        .sort((a, b) => a.changedAt.getTime() - b.changedAt.getTime());
    },

    async findAll(orgId) {
      return [...store.values()].filter((e) => e.organizationId === orgId);
    },

    async save(event) {
      store.set(`${event.organizationId}:${event.id}`, event);
    },
  };
}
