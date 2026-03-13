import { eq, and, inArray } from "drizzle-orm";
import type { AssetId, PortfolioId, OrganizationId } from "@ipms/shared";
import type { Portfolio } from "@ipms/domain";
import type { PortfolioRepository } from "@ipms/application";
import { portfolios, portfolioAssets } from "./schema.js";
import type { Database } from "./connection.js";

type PortfolioRow = typeof portfolios.$inferSelect;

function toEntity(row: PortfolioRow, assetIds: readonly AssetId[]): Portfolio {
  return {
    id: row.id as PortfolioId,
    name: row.name,
    description: row.description,
    assetIds,
    owner: row.owner,
    organizationId: row.organizationId as OrganizationId,
  };
}

export function createPgPortfolioRepository(db: Database): PortfolioRepository {
  return {
    async findById(id, orgId) {
      const rows = await db.select().from(portfolios)
        .where(and(eq(portfolios.id, id), eq(portfolios.organizationId, orgId)));
      if (!rows[0]) return null;

      const assetRows = await db.select().from(portfolioAssets)
        .where(eq(portfolioAssets.portfolioId, id));
      const assetIds = assetRows.map((r) => r.assetId as AssetId);

      return toEntity(rows[0], assetIds);
    },

    async findAll(orgId) {
      const rows = await db.select().from(portfolios)
        .where(eq(portfolios.organizationId, orgId));
      if (rows.length === 0) return [];

      const portfolioIds = rows.map((r) => r.id);
      const assetRows = await db.select().from(portfolioAssets)
        .where(inArray(portfolioAssets.portfolioId, portfolioIds));

      const assetsByPortfolio = new Map<string, AssetId[]>();
      for (const ar of assetRows) {
        const list = assetsByPortfolio.get(ar.portfolioId) ?? [];
        list.push(ar.assetId as AssetId);
        assetsByPortfolio.set(ar.portfolioId, list);
      }

      return rows.map((row) => toEntity(row, assetsByPortfolio.get(row.id) ?? []));
    },

    async save(portfolio) {
      await db.insert(portfolios).values({
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        owner: portfolio.owner,
        organizationId: portfolio.organizationId,
      }).onConflictDoUpdate({
        target: portfolios.id,
        set: {
          name: portfolio.name,
          description: portfolio.description,
          owner: portfolio.owner,
        },
      });

      await db.delete(portfolioAssets)
        .where(eq(portfolioAssets.portfolioId, portfolio.id));

      if (portfolio.assetIds.length > 0) {
        await db.insert(portfolioAssets).values(
          portfolio.assetIds.map((assetId) => ({
            portfolioId: portfolio.id,
            assetId,
          })),
        );
      }
    },

    async delete(id, orgId) {
      await db.delete(portfolioAssets)
        .where(eq(portfolioAssets.portfolioId, id));

      const result = await db.delete(portfolios)
        .where(and(eq(portfolios.id, id), eq(portfolios.organizationId, orgId)));
      return (result.rowCount ?? 0) > 0;
    },
  };
}
