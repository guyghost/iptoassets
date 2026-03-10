import type { Membership } from "@ipms/domain";
import type { MembershipRepository } from "@ipms/application";

export function createInMemoryMembershipRepository(): MembershipRepository {
  const store = new Map<string, Membership>();

  return {
    async findByUserId(userId) {
      return [...store.values()].filter((m) => m.userId === userId);
    },

    async findByOrganizationId(orgId) {
      return [...store.values()].filter((m) => m.organizationId === orgId);
    },

    async findByUserAndOrg(userId, orgId) {
      return [...store.values()].find((m) => m.userId === userId && m.organizationId === orgId) ?? null;
    },

    async save(membership) {
      store.set(membership.id, membership);
    },
  };
}
