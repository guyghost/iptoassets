import type { AssetId, OrganizationId, PortfolioId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Portfolio } from "./entities.js";

export interface CreatePortfolioInput {
  readonly id: PortfolioId;
  readonly name: string;
  readonly description: string;
  readonly owner: string;
  readonly organizationId: OrganizationId;
}

export function createPortfolio(input: CreatePortfolioInput): Result<Portfolio> {
  if (!input.name.trim()) {
    return err("Portfolio name cannot be empty");
  }
  if (!input.owner.trim()) {
    return err("Portfolio owner cannot be empty");
  }

  return ok({
    id: input.id,
    name: input.name.trim(),
    description: input.description.trim(),
    assetIds: [],
    owner: input.owner.trim(),
    organizationId: input.organizationId,
  });
}

export function addAssetToPortfolio(
  portfolio: Portfolio,
  assetId: AssetId,
): Result<Portfolio> {
  if (portfolio.assetIds.includes(assetId)) {
    return err("Asset is already in this portfolio");
  }
  return ok({
    ...portfolio,
    assetIds: [...portfolio.assetIds, assetId],
  });
}

export function removeAssetFromPortfolio(
  portfolio: Portfolio,
  assetId: AssetId,
): Result<Portfolio> {
  if (!portfolio.assetIds.includes(assetId)) {
    return err("Asset is not in this portfolio");
  }
  return ok({
    ...portfolio,
    assetIds: portfolio.assetIds.filter((id) => id !== assetId),
  });
}
