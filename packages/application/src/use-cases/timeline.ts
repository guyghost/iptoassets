import type { AssetId, OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { StatusChangeEvent } from "@ipms/domain";
import type { StatusChangeEventRepository } from "../ports.js";

export function getAssetTimelineUseCase(repo: StatusChangeEventRepository) {
  return async (
    assetId: AssetId,
    orgId: OrganizationId,
  ): Promise<Result<readonly StatusChangeEvent[]>> => {
    const events = await repo.findByAssetId(assetId, orgId);
    return ok(events);
  };
}
