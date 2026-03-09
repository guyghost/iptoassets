import type {
  AssetId,
  DeadlineId,
  DocumentId,
  OrganizationId,
  PortfolioId,
  StatusChangeEventId,
} from "./brand.js";
import { type Result, ok, err } from "./result.js";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseAssetId(input: string): Result<AssetId> {
  return UUID_RE.test(input)
    ? ok(input as AssetId)
    : err("Invalid AssetId: must be UUID format");
}

export function parseDeadlineId(input: string): Result<DeadlineId> {
  return UUID_RE.test(input)
    ? ok(input as DeadlineId)
    : err("Invalid DeadlineId: must be UUID format");
}

export function parseDocumentId(input: string): Result<DocumentId> {
  return UUID_RE.test(input)
    ? ok(input as DocumentId)
    : err("Invalid DocumentId: must be UUID format");
}

export function parsePortfolioId(input: string): Result<PortfolioId> {
  return UUID_RE.test(input)
    ? ok(input as PortfolioId)
    : err("Invalid PortfolioId: must be UUID format");
}

export function parseOrganizationId(input: string): Result<OrganizationId> {
  return UUID_RE.test(input)
    ? ok(input as OrganizationId)
    : err("Invalid OrganizationId: must be UUID format");
}

export function parseStatusChangeEventId(input: string): Result<StatusChangeEventId> {
  return UUID_RE.test(input)
    ? ok(input as StatusChangeEventId)
    : err("Invalid StatusChangeEventId: must be UUID format");
}
