import { describe, it, expect } from "vitest";
import { createOrganization } from "./organization.js";
import type { OrganizationId, UserId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const OWNER_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;

describe("createOrganization", () => {
  it("creates an organization with valid input", () => {
    const result = createOrganization({ id: ORG_ID, name: "Acme Corp", ownerId: OWNER_ID });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Acme Corp");
      expect(result.value.ownerId).toBe(OWNER_ID);
    }
  });

  it("rejects empty name", () => {
    const result = createOrganization({ id: ORG_ID, name: "  ", ownerId: OWNER_ID });
    expect(result).toEqual({ ok: false, error: "Organization name cannot be empty" });
  });
});
