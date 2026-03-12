import type { OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import { type PortfolioMetrics, computePortfolioMetrics, type DeadlineMetrics, computeDeadlineMetrics, type AssetFilter, filterAssets } from "@ipms/domain";
import type { AssetRepository, DeadlineRepository } from "../ports.js";

export function computePortfolioMetricsUseCase(repo: AssetRepository) {
  return async (orgId: OrganizationId, now: Date, filter?: AssetFilter): Promise<Result<PortfolioMetrics>> => {
    const allAssets = await repo.findAll(orgId);
    const assets = filter ? filterAssets(allAssets, filter) : allAssets;
    return ok(computePortfolioMetrics(assets, now));
  };
}

export function computeDeadlineMetricsUseCase(repo: DeadlineRepository, assetRepo?: AssetRepository) {
  return async (orgId: OrganizationId, now: Date, filter?: AssetFilter): Promise<Result<DeadlineMetrics>> => {
    const allDeadlines = await repo.findAll(orgId);
    if (filter && assetRepo) {
      const allAssets = await assetRepo.findAll(orgId);
      const filtered = filterAssets(allAssets, filter);
      const assetIds = new Set(filtered.map((a) => a.id));
      const deadlines = allDeadlines.filter((d) => assetIds.has(d.assetId));
      return ok(computeDeadlineMetrics(deadlines, now));
    }
    return ok(computeDeadlineMetrics(allDeadlines, now));
  };
}
