import { describe, it, expect } from "vitest";
import { createMembership } from "./membership.js";
import type { MembershipId, UserId, OrganizationId } from "@ipms/shared";

const MEMBERSHIP_ID = "550e8400-e29b-41d4-a716-446655440000" as MembershipId;
const USER_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;
const ORG_ID = "770e8400-e29b-41d4-a716-446655440000" as OrganizationId;

describe("createMembership", () => {
  it("creates a membership with valid input", () => {
    const result = createMembership({ id: MEMBERSHIP_ID, userId: USER_ID, organizationId: ORG_ID, role: "owner" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.userId).toBe(USER_ID);
      expect(result.value.organizationId).toBe(ORG_ID);
      expect(result.value.role).toBe("owner");
    }
  });

  it("creates a member role", () => {
    const result = createMembership({ id: MEMBERSHIP_ID, userId: USER_ID, organizationId: ORG_ID, role: "member" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.role).toBe("member");
    }
  });
});
