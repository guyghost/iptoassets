import type { AssetStatus, IPType } from "@ipms/shared";
import { ASSET_STATUSES, IP_TYPES } from "@ipms/shared";
import type { IPAsset } from "../entities.js";

export interface PortfolioMetrics {
  readonly totalAssets: number;
  readonly byStatus: Record<AssetStatus, number>;
  readonly byType: Record<IPType, number>;
  readonly byJurisdiction: readonly { readonly code: string; readonly name: string; readonly count: number }[];
  readonly expiringWithin90Days: number;
}

const MS_PER_DAY = 86_400_000;

export function computePortfolioMetrics(assets: readonly IPAsset[], now: Date): PortfolioMetrics {
  const byStatus = Object.fromEntries(ASSET_STATUSES.map((s) => [s, 0])) as Record<AssetStatus, number>;
  const byType = Object.fromEntries(IP_TYPES.map((t) => [t, 0])) as Record<IPType, number>;
  const jurisdictionMap = new Map<string, { name: string; count: number }>();
  let expiringWithin90Days = 0;

  const ninetyDaysFromNow = new Date(now.getTime() + 90 * MS_PER_DAY);

  for (const asset of assets) {
    byStatus[asset.status]++;
    byType[asset.type]++;

    const existing = jurisdictionMap.get(asset.jurisdiction.code);
    if (existing) {
      existing.count++;
    } else {
      jurisdictionMap.set(asset.jurisdiction.code, { name: asset.jurisdiction.name, count: 1 });
    }

    if (
      asset.expirationDate &&
      asset.expirationDate > now &&
      asset.expirationDate <= ninetyDaysFromNow &&
      asset.status !== "expired" &&
      asset.status !== "abandoned"
    ) {
      expiringWithin90Days++;
    }
  }

  const byJurisdiction = [...jurisdictionMap.entries()].map(([code, { name, count }]) => ({
    code,
    name,
    count,
  }));

  return {
    totalAssets: assets.length,
    byStatus,
    byType,
    byJurisdiction,
    expiringWithin90Days,
  };
}
