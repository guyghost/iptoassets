import type { AssetId, AssetStatus, IPType, Jurisdiction, OrganizationId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { IPAsset } from "./entities.js";

export interface CreateAssetInput {
  readonly id: AssetId;
  readonly title: string;
  readonly type: IPType;
  readonly jurisdiction: Jurisdiction;
  readonly owner: string;
  readonly organizationId: OrganizationId;
}

export function createAsset(input: CreateAssetInput): Result<IPAsset> {
  if (!input.title.trim()) {
    return err("Asset title cannot be empty");
  }
  if (!input.owner.trim()) {
    return err("Asset owner cannot be empty");
  }
  if (!input.jurisdiction.code.trim() || !input.jurisdiction.name.trim()) {
    return err("Jurisdiction code and name are required");
  }

  const now = new Date();
  return ok({
    id: input.id,
    title: input.title.trim(),
    type: input.type,
    jurisdiction: input.jurisdiction,
    status: "draft" as const,
    filingDate: null,
    expirationDate: null,
    owner: input.owner.trim(),
    organizationId: input.organizationId,
    createdAt: now,
    updatedAt: now,
  });
}

const VALID_TRANSITIONS: Record<AssetStatus, readonly AssetStatus[]> = {
  draft: ["filed", "abandoned"],
  filed: ["published", "granted", "abandoned"],
  published: ["granted", "abandoned"],
  granted: ["expired"],
  expired: [],
  abandoned: [],
};

export function validateStatusTransition(
  from: AssetStatus,
  to: AssetStatus,
): Result<true> {
  if (VALID_TRANSITIONS[from].includes(to)) {
    return ok(true);
  }
  return err(`Invalid status transition: ${from} -> ${to}`);
}

export function updateAssetStatus(
  asset: IPAsset,
  newStatus: AssetStatus,
): Result<IPAsset> {
  const validation = validateStatusTransition(asset.status, newStatus);
  if (!validation.ok) return validation;

  return ok({
    ...asset,
    status: newStatus,
    updatedAt: new Date(),
  });
}
