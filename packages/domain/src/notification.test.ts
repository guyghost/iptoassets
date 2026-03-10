import { describe, it, expect } from "vitest";
import { createNotification, markNotificationRead } from "./notification.js";
import type { NotificationId, OrganizationId, UserId } from "@ipms/shared";

const INPUT = {
  id: "550e8400-e29b-41d4-a716-446655440000" as NotificationId,
  organizationId: "660e8400-e29b-41d4-a716-446655440000" as OrganizationId,
  recipientId: "770e8400-e29b-41d4-a716-446655440000" as UserId,
  type: "deadline:upcoming" as const,
  title: "Deadline approaching",
  message: "Patent renewal due in 7 days",
  entityType: "deadline" as const,
  entityId: "880e8400-e29b-41d4-a716-446655440000",
};

describe("createNotification", () => {
  it("creates a notification", () => {
    const r = createNotification(INPUT);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.read).toBe(false);
      expect(r.value.type).toBe("deadline:upcoming");
    }
  });
  it("rejects empty title", () => {
    expect(createNotification({ ...INPUT, title: "  " })).toEqual({ ok: false, error: "Notification title cannot be empty" });
  });
  it("rejects empty message", () => {
    expect(createNotification({ ...INPUT, message: "" })).toEqual({ ok: false, error: "Notification message cannot be empty" });
  });
});

describe("markNotificationRead", () => {
  it("marks as read", () => {
    const r = createNotification(INPUT);
    if (r.ok) {
      expect(markNotificationRead(r.value).read).toBe(true);
    }
  });
});
