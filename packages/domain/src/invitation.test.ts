import { describe, it, expect } from "vitest";
import { createInvitation, acceptInvitation } from "./invitation.js";
import type { InvitationId, OrganizationId, UserId } from "@ipms/shared";

const INPUT = {
  id: "550e8400-e29b-41d4-a716-446655440000" as InvitationId,
  organizationId: "660e8400-e29b-41d4-a716-446655440000" as OrganizationId,
  invitedByUserId: "770e8400-e29b-41d4-a716-446655440000" as UserId,
  email: "bob@example.com",
  role: "attorney" as const,
};

describe("createInvitation", () => {
  it("creates with 7 day expiry", () => {
    const r = createInvitation(INPUT);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.status).toBe("pending");
      const days = (r.value.expiresAt.getTime() - r.value.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(days).toBeCloseTo(7, 0);
    }
  });
  it("rejects empty email", () => {
    expect(createInvitation({ ...INPUT, email: "  " })).toEqual({ ok: false, error: "Invitation email cannot be empty" });
  });
});

describe("acceptInvitation", () => {
  it("accepts pending", () => {
    const c = createInvitation(INPUT);
    if (c.ok) {
      const a = acceptInvitation(c.value);
      expect(a.ok).toBe(true);
      if (a.ok) expect(a.value.status).toBe("accepted");
    }
  });
  it("rejects already accepted", () => {
    const c = createInvitation(INPUT);
    if (c.ok) {
      const a = acceptInvitation(c.value);
      if (a.ok) expect(acceptInvitation(a.value)).toEqual({ ok: false, error: "Invitation is not pending" });
    }
  });
});
