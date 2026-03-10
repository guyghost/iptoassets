import { describe, it, expect } from "vitest";
import { createAuditEvent } from "./audit-event.js";
import type { AuditEventId, OrganizationId, UserId } from "@ipms/shared";

describe("createAuditEvent", () => {
  it("creates an audit event", () => {
    const result = createAuditEvent({
      id: "550e8400-e29b-41d4-a716-446655440000" as AuditEventId,
      organizationId: "660e8400-e29b-41d4-a716-446655440000" as OrganizationId,
      actorId: "770e8400-e29b-41d4-a716-446655440000" as UserId,
      action: "asset:create",
      entityType: "asset",
      entityId: "880e8400-e29b-41d4-a716-446655440000",
      metadata: { title: "New Patent" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.action).toBe("asset:create");
      expect(result.value.metadata).toEqual({ title: "New Patent" });
    }
  });
});
