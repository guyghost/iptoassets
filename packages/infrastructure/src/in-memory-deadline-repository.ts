import type { AssetId, DeadlineId, OrganizationId } from "@ipms/shared";
import type { Deadline } from "@ipms/domain";
import type { DeadlineRepository } from "@ipms/application";

export function createInMemoryDeadlineRepository(): DeadlineRepository {
  const store = new Map<string, Deadline>();

  const key = (id: DeadlineId, orgId: OrganizationId) => `${orgId}:${id}`;

  return {
    async findById(id, orgId) {
      return store.get(key(id, orgId)) ?? null;
    },

    async findByAssetId(assetId: AssetId, orgId: OrganizationId) {
      return [...store.values()].filter(
        (d) => d.assetId === assetId && d.organizationId === orgId,
      );
    },

    async findAll(orgId) {
      return [...store.values()].filter((d) => d.organizationId === orgId);
    },

    async save(deadline) {
      store.set(key(deadline.id, deadline.organizationId), deadline);
    },

    async delete(id, orgId) {
      return store.delete(key(id, orgId));
    },
  };
}
