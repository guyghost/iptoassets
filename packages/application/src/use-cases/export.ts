import type { OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import { type AssetFilter, filterAssets, assetsToCSVRows, csvRowsToString } from "@ipms/domain";
import type { AssetRepository } from "../ports.js";

export function exportAssetsCSVUseCase(repo: AssetRepository) {
  return async (orgId: OrganizationId, filter?: AssetFilter): Promise<Result<string>> => {
    const allAssets = await repo.findAll(orgId);
    const assets = filter ? filterAssets(allAssets, filter) : allAssets;
    const rows = assetsToCSVRows(assets);
    return ok(csvRowsToString(rows));
  };
}
