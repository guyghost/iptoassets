import type { AssetId, AssetStatus, OrganizationId, StatusChangeEventId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import { type IPAsset, type CreateAssetInput, createAsset, updateAssetStatus, type AssetFilter, filterAssets, createStatusChangeEvent } from "@ipms/domain";
import type { AssetRepository, StatusChangeEventRepository } from "../ports.js";

export function createAssetUseCase(repo: AssetRepository) {
  return async (
    input: CreateAssetInput,
  ): Promise<Result<IPAsset>> => {
    const result = createAsset(input);
    if (!result.ok) return result;
    await repo.save(result.value);
    return result;
  };
}

export function getAssetUseCase(repo: AssetRepository) {
  return async (
    id: AssetId,
    orgId: OrganizationId,
  ): Promise<Result<IPAsset>> => {
    const asset = await repo.findById(id, orgId);
    if (!asset) return err("Asset not found");
    return ok(asset);
  };
}

export function listAssetsUseCase(repo: AssetRepository) {
  return async (
    orgId: OrganizationId,
  ): Promise<Result<readonly IPAsset[]>> => {
    const assets = await repo.findAll(orgId);
    return ok(assets);
  };
}

export function updateAssetStatusUseCase(repo: AssetRepository, eventRepo: StatusChangeEventRepository) {
  return async (
    id: AssetId,
    orgId: OrganizationId,
    newStatus: AssetStatus,
    changedBy: string,
  ): Promise<Result<IPAsset>> => {
    const asset = await repo.findById(id, orgId);
    if (!asset) return err("Asset not found");

    const result = updateAssetStatus(asset, newStatus);
    if (!result.ok) return result;

    const eventResult = createStatusChangeEvent({
      id: crypto.randomUUID() as StatusChangeEventId,
      assetId: id,
      fromStatus: asset.status,
      toStatus: newStatus,
      changedBy,
      organizationId: orgId,
    });

    await repo.save(result.value);
    if (eventResult.ok) {
      await eventRepo.save(eventResult.value);
    }

    return result;
  };
}

export function deleteAssetUseCase(repo: AssetRepository) {
  return async (
    id: AssetId,
    orgId: OrganizationId,
  ): Promise<Result<true>> => {
    const deleted = await repo.delete(id, orgId);
    if (!deleted) return err("Asset not found");
    return ok(true);
  };
}

export function listAssetsFilteredUseCase(repo: AssetRepository) {
  return async (
    orgId: OrganizationId,
    filter: AssetFilter,
  ): Promise<Result<readonly IPAsset[]>> => {
    const assets = await repo.findAll(orgId);
    return ok(filterAssets(assets, filter));
  };
}
