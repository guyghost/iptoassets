import type { Organization } from "@ipms/domain";
import type { OrganizationRepository } from "@ipms/application";

export function createInMemoryOrganizationRepository(): OrganizationRepository {
  const store = new Map<string, Organization>();

  return {
    async findAll() {
      return [...store.values()];
    },

    async findById(id) {
      return store.get(id) ?? null;
    },

    async findByOwnerId(ownerId) {
      return [...store.values()].filter((o) => o.ownerId === ownerId);
    },

    async save(org) {
      store.set(org.id, org);
    },
  };
}
