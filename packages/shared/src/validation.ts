import type {
  AssetId,
  AuditEventId,
  DeadlineId,
  DocumentId,
  InvitationId,
  MembershipId,
  NotificationId,
  OrganizationId,
  PriorArtResultId,
  PortfolioId,
  RenewalFeeId,
  RenewalDecisionId,
  StatusChangeEventId,
  UserId,
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

export function parseUserId(input: string): Result<UserId> {
  return UUID_RE.test(input)
    ? ok(input as UserId)
    : err("Invalid UserId: must be UUID format");
}

export function parseMembershipId(input: string): Result<MembershipId> {
  return UUID_RE.test(input)
    ? ok(input as MembershipId)
    : err("Invalid MembershipId: must be UUID format");
}

export function parseAuditEventId(input: string): Result<AuditEventId> {
  return UUID_RE.test(input)
    ? ok(input as AuditEventId)
    : err("Invalid AuditEventId: must be UUID format");
}

export function parseNotificationId(input: string): Result<NotificationId> {
  return UUID_RE.test(input)
    ? ok(input as NotificationId)
    : err("Invalid NotificationId: must be UUID format");
}

export function parseInvitationId(input: string): Result<InvitationId> {
  return UUID_RE.test(input)
    ? ok(input as InvitationId)
    : err("Invalid InvitationId: must be UUID format");
}

export function parsePriorArtResultId(input: string): Result<PriorArtResultId> {
  return UUID_RE.test(input)
    ? ok(input as PriorArtResultId)
    : err("Invalid PriorArtResultId: must be UUID format");
}

export function parseRenewalFeeId(input: string): Result<RenewalFeeId> {
  return UUID_RE.test(input)
    ? ok(input as RenewalFeeId)
    : err("Invalid RenewalFeeId: must be UUID format");
}

export function parseRenewalDecisionId(input: string): Result<RenewalDecisionId> {
  return UUID_RE.test(input)
    ? ok(input as RenewalDecisionId)
    : err("Invalid RenewalDecisionId: must be UUID format");
}
