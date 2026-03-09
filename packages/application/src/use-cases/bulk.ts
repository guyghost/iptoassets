import type { AssetId, AssetStatus, OrganizationId, StatusChangeEventId, PortfolioId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { BulkOperationResult } from "@ipms/domain";
import { bulkValidateStatusTransition, updateAssetStatus, createStatusChangeEvent, addAssetToPortfolio } from "@ipms/domain";
import type { AssetRepository, StatusChangeEventRepository, PortfolioRepository } from "../ports.js";

export function bulkUpdateAssetStatusUseCase(repo: AssetRepository, eventRepo: StatusChangeEventRepository) {
  return async (
    ids: readonly AssetId[],
    orgId: OrganizationId,
    newStatus: AssetStatus,
    changedBy: string,
  ): Promise<Result<BulkOperationResult>> => {
    const assets = await Promise.all(ids.map((id) => repo.findById(id, orgId)));
    const found = assets.filter((a): a is NonNullable<typeof a> => a !== null);

    const { valid, errors: validationErrors } = bulkValidateStatusTransition(found, newStatus);

    const errors: { id: string; reason: string }[] = [];

    // Add not-found errors
    for (const id of ids) {
      if (!found.some((a) => a.id === id)) {
        errors.push({ id, reason: "Asset not found" });
      }
    }

    // Add validation errors
    for (const { asset, reason } of validationErrors) {
      errors.push({ id: asset.id, reason });
    }

    // Apply valid transitions
    for (const asset of valid) {
      const result = updateAssetStatus(asset, newStatus);
      if (result.ok) {
        await repo.save(result.value);
        const eventResult = createStatusChangeEvent({
          id: crypto.randomUUID() as StatusChangeEventId,
          assetId: asset.id,
          fromStatus: asset.status,
          toStatus: newStatus,
          changedBy,
          organizationId: orgId,
        });
        if (eventResult.ok) {
          await eventRepo.save(eventResult.value);
        }
      }
    }

    return ok({
      succeeded: valid.length,
      failed: errors.length,
      errors,
    });
  };
}

export function bulkAddAssetsToPortfolioUseCase(portfolioRepo: PortfolioRepository) {
  return async (
    portfolioId: PortfolioId,
    assetIds: readonly AssetId[],
    orgId: OrganizationId,
  ): Promise<Result<BulkOperationResult>> => {
    const portfolio = await portfolioRepo.findById(portfolioId, orgId);
    if (!portfolio) return err("Portfolio not found");

    const errors: { id: string; reason: string }[] = [];
    let current = portfolio;
    let succeeded = 0;

    for (const assetId of assetIds) {
      const result = addAssetToPortfolio(current, assetId);
      if (result.ok) {
        current = result.value;
        succeeded++;
      } else {
        errors.push({ id: assetId, reason: result.error });
      }
    }

    await portfolioRepo.save(current);

    return ok({
      succeeded,
      failed: errors.length,
      errors,
    });
  };
}
