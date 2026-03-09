import type { PortfolioId, OrganizationId } from "@ipms/shared";
import type { Portfolio } from "@ipms/domain";
import type { PortfolioRepository } from "@ipms/application";

export function createInMemoryPortfolioRepository(): PortfolioRepository {
  const store = new Map<string, Portfolio>();

  const key = (id: PortfolioId, orgId: OrganizationId) => `${orgId}:${id}`;

  return {
    async findById(id, orgId) {
      return store.get(key(id, orgId)) ?? null;
    },

    async findAll(orgId) {
      return [...store.values()].filter((p) => p.organizationId === orgId);
    },

    async save(portfolio) {
      store.set(key(portfolio.id, portfolio.organizationId), portfolio);
    },

    async delete(id, orgId) {
      return store.delete(key(id, orgId));
    },
  };
}
