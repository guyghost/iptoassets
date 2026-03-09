import type { OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import { type PortfolioMetrics, computePortfolioMetrics, type DeadlineMetrics, computeDeadlineMetrics } from "@ipms/domain";
import type { AssetRepository, DeadlineRepository } from "../ports.js";

export function computePortfolioMetricsUseCase(repo: AssetRepository) {
  return async (orgId: OrganizationId, now: Date): Promise<Result<PortfolioMetrics>> => {
    const assets = await repo.findAll(orgId);
    return ok(computePortfolioMetrics(assets, now));
  };
}

export function computeDeadlineMetricsUseCase(repo: DeadlineRepository) {
  return async (orgId: OrganizationId, now: Date): Promise<Result<DeadlineMetrics>> => {
    const deadlines = await repo.findAll(orgId);
    return ok(computeDeadlineMetrics(deadlines, now));
  };
}
