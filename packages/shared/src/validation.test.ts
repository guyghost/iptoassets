import { describe, it, expect } from "vitest";
import {
  parseAssetId,
  parseDeadlineId,
  parseDocumentId,
  parsePortfolioId,
  parseOrganizationId,
  parseUserId,
  parseMembershipId,
  parseAuditEventId,
  parseNotificationId,
  parseInvitationId,
  parseRenewalFeeId,
  parseRenewalDecisionId,
} from "./validation.js";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("parseAssetId", () => {
  it("accepts a valid UUID", () => {
    const result = parseAssetId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });

  it("rejects an invalid string", () => {
    const result = parseAssetId("not-a-uuid");
    expect(result.ok).toBe(false);
  });

  it("rejects an empty string", () => {
    const result = parseAssetId("");
    expect(result.ok).toBe(false);
  });
});

describe("parseDeadlineId", () => {
  it("accepts a valid UUID", () => {
    expect(parseDeadlineId(VALID_UUID).ok).toBe(true);
  });
});

describe("parseDocumentId", () => {
  it("accepts a valid UUID", () => {
    expect(parseDocumentId(VALID_UUID).ok).toBe(true);
  });
});

describe("parsePortfolioId", () => {
  it("accepts a valid UUID", () => {
    expect(parsePortfolioId(VALID_UUID).ok).toBe(true);
  });
});

describe("parseOrganizationId", () => {
  it("accepts a valid UUID", () => {
    expect(parseOrganizationId(VALID_UUID).ok).toBe(true);
  });
});

describe("parseUserId", () => {
  it("accepts valid UUID", () => {
    const result = parseUserId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });
  it("rejects invalid UUID", () => {
    const result = parseUserId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid UserId: must be UUID format" });
  });
});

describe("parseMembershipId", () => {
  it("accepts valid UUID", () => {
    const result = parseMembershipId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });
  it("rejects invalid UUID", () => {
    const result = parseMembershipId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid MembershipId: must be UUID format" });
  });
});

describe("parseAuditEventId", () => {
  it("accepts valid UUID", () => {
    const result = parseAuditEventId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });
  it("rejects invalid UUID", () => {
    const result = parseAuditEventId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid AuditEventId: must be UUID format" });
  });
});

describe("parseNotificationId", () => {
  it("accepts valid UUID", () => {
    const result = parseNotificationId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });
  it("rejects invalid UUID", () => {
    const result = parseNotificationId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid NotificationId: must be UUID format" });
  });
});

describe("parseInvitationId", () => {
  it("accepts valid UUID", () => {
    const result = parseInvitationId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });
  it("rejects invalid UUID", () => {
    const result = parseInvitationId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid InvitationId: must be UUID format" });
  });
});

describe("parseRenewalFeeId", () => {
  it("accepts valid UUID", () => {
    const result = parseRenewalFeeId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });
  it("rejects invalid UUID", () => {
    const result = parseRenewalFeeId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid RenewalFeeId: must be UUID format" });
  });
});

describe("parseRenewalDecisionId", () => {
  it("accepts valid UUID", () => {
    const result = parseRenewalDecisionId(VALID_UUID);
    expect(result).toEqual({ ok: true, value: VALID_UUID });
  });
  it("rejects invalid UUID", () => {
    const result = parseRenewalDecisionId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid RenewalDecisionId: must be UUID format" });
  });
});
