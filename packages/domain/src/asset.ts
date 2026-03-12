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
  readonly metadata?: Record<string, unknown> | null;
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
    metadata: input.metadata ?? null,
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

export interface AssetFilter {
  readonly status?: AssetStatus[];
  readonly type?: IPType[];
  readonly jurisdiction?: string;
  readonly owner?: string;
  readonly search?: string;
  readonly dateFrom?: Date;
  readonly dateTo?: Date;
}

export function bulkValidateStatusTransition(
  assets: readonly IPAsset[],
  newStatus: AssetStatus,
): { valid: IPAsset[]; errors: { asset: IPAsset; reason: string }[] } {
  const valid: IPAsset[] = [];
  const errors: { asset: IPAsset; reason: string }[] = [];

  for (const asset of assets) {
    const result = validateStatusTransition(asset.status, newStatus);
    if (result.ok) {
      valid.push(asset);
    } else {
      errors.push({ asset, reason: result.error });
    }
  }

  return { valid, errors };
}

/**
 * Fuzzy match: every character of the query must appear in order in the target,
 * but not necessarily contiguously. Case-insensitive.
 * e.g. "ptnt" matches "Patent Application for Widget"
 */
function fuzzyMatch(query: string, target: string): boolean {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function filterAssets(assets: readonly IPAsset[], filter: AssetFilter): IPAsset[] {
  return assets.filter((asset) => {
    if (filter.status && filter.status.length > 0 && !filter.status.includes(asset.status)) {
      return false;
    }
    if (filter.type && filter.type.length > 0 && !filter.type.includes(asset.type)) {
      return false;
    }
    if (filter.jurisdiction && asset.jurisdiction.code !== filter.jurisdiction) {
      return false;
    }
    if (filter.owner && asset.owner !== filter.owner) {
      return false;
    }
    if (filter.search && !fuzzyMatch(filter.search, asset.title)) {
      return false;
    }
    if (filter.dateFrom || filter.dateTo) {
      const date = asset.filingDate;
      if (!date) return false;
      if (filter.dateFrom && date < filter.dateFrom) return false;
      if (filter.dateTo && date > filter.dateTo) return false;
    }
    return true;
  });
}
