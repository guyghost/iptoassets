import type { AssetId, PortfolioId, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import { type Portfolio, type CreatePortfolioInput, createPortfolio, addAssetToPortfolio, removeAssetFromPortfolio } from "@ipms/domain";
import type { PortfolioRepository } from "../ports.js";

export function createPortfolioUseCase(repo: PortfolioRepository) {
  return async (
    input: CreatePortfolioInput,
  ): Promise<Result<Portfolio>> => {
    const result = createPortfolio(input);
    if (!result.ok) return result;
    await repo.save(result.value);
    return result;
  };
}

export function getPortfolioUseCase(repo: PortfolioRepository) {
  return async (
    id: PortfolioId,
    orgId: OrganizationId,
  ): Promise<Result<Portfolio>> => {
    const portfolio = await repo.findById(id, orgId);
    if (!portfolio) return err("Portfolio not found");
    return ok(portfolio);
  };
}

export function listPortfoliosUseCase(repo: PortfolioRepository) {
  return async (
    orgId: OrganizationId,
  ): Promise<Result<readonly Portfolio[]>> => {
    const portfolios = await repo.findAll(orgId);
    return ok(portfolios);
  };
}

export function addAssetToPortfolioUseCase(repo: PortfolioRepository) {
  return async (
    portfolioId: PortfolioId,
    orgId: OrganizationId,
    assetId: AssetId,
  ): Promise<Result<Portfolio>> => {
    const portfolio = await repo.findById(portfolioId, orgId);
    if (!portfolio) return err("Portfolio not found");

    const result = addAssetToPortfolio(portfolio, assetId);
    if (!result.ok) return result;

    await repo.save(result.value);
    return result;
  };
}

export function removeAssetFromPortfolioUseCase(repo: PortfolioRepository) {
  return async (
    portfolioId: PortfolioId,
    orgId: OrganizationId,
    assetId: AssetId,
  ): Promise<Result<Portfolio>> => {
    const portfolio = await repo.findById(portfolioId, orgId);
    if (!portfolio) return err("Portfolio not found");

    const result = removeAssetFromPortfolio(portfolio, assetId);
    if (!result.ok) return result;

    await repo.save(result.value);
    return result;
  };
}

export function deletePortfolioUseCase(repo: PortfolioRepository) {
  return async (
    id: PortfolioId,
    orgId: OrganizationId,
  ): Promise<Result<true>> => {
    const deleted = await repo.delete(id, orgId);
    if (!deleted) return err("Portfolio not found");
    return ok(true);
  };
}
