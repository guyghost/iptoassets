import type { AssetFilter } from "@ipms/domain";
import type { AssetStatus, IPType } from "@ipms/shared";
import { IP_TYPES, ASSET_STATUSES } from "@ipms/shared";

export function parseFilterParams(url: URL): AssetFilter | undefined {
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const jurisdiction = url.searchParams.get("jurisdiction");

  if (!type && !status && !jurisdiction) return undefined;

  const filter: AssetFilter = {};
  if (type && (IP_TYPES as readonly string[]).includes(type)) {
    (filter as { type?: IPType[] }).type = [type as IPType];
  }
  if (status && (ASSET_STATUSES as readonly string[]).includes(status)) {
    (filter as { status?: AssetStatus[] }).status = [status as AssetStatus];
  }
  if (jurisdiction) {
    (filter as { jurisdiction?: string }).jurisdiction = jurisdiction;
  }
  return filter;
}
