import type { AssetId, AssetStatus, OrganizationId, StatusChangeEventId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { StatusChangeEvent } from "./entities.js";

export interface CreateStatusChangeEventInput {
  readonly id: StatusChangeEventId;
  readonly assetId: AssetId;
  readonly fromStatus: AssetStatus | null;
  readonly toStatus: AssetStatus;
  readonly changedBy: string;
  readonly organizationId: OrganizationId;
}

export function createStatusChangeEvent(input: CreateStatusChangeEventInput): Result<StatusChangeEvent> {
  if (!input.changedBy.trim()) {
    return err("changedBy cannot be empty");
  }

  return ok({
    id: input.id,
    assetId: input.assetId,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    changedAt: new Date(),
    changedBy: input.changedBy.trim(),
    organizationId: input.organizationId,
  });
}
