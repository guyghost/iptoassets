import type { OrganizationId } from "@ipms/shared";
import type { RenewalDecision } from "@ipms/domain";
import type { RenewalDecisionRepository } from "@ipms/application";

export function createInMemoryRenewalDecisionRepository(): RenewalDecisionRepository {
  const store = new Map<string, RenewalDecision>();

  const key = (id: string, orgId: OrganizationId) => `${orgId}:${id}`;

  return {
    async findById(id, orgId) {
      return store.get(key(id, orgId)) ?? null;
    },

    async findByDeadlineId(deadlineId, orgId) {
      return [...store.values()].find(
        (d) => d.deadlineId === deadlineId && d.organizationId === orgId,
      ) ?? null;
    },

    async findAll(orgId) {
      return [...store.values()].filter((d) => d.organizationId === orgId);
    },

    async findByAssetId(assetId, orgId) {
      return [...store.values()].filter(
        (d) => d.assetId === assetId && d.organizationId === orgId,
      );
    },

    async save(decision) {
      store.set(key(decision.id, decision.organizationId), decision);
    },

    async saveMany(decisions) {
      for (const decision of decisions) {
        store.set(key(decision.id, decision.organizationId), decision);
      }
    },
  };
}
