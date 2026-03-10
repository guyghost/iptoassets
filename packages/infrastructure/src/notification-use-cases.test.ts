import { describe, it, expect, beforeEach } from "vitest";
import { listNotificationsUseCase, markNotificationReadUseCase, markAllNotificationsReadUseCase } from "@ipms/application";
import { createInMemoryNotificationRepository } from "./in-memory-notification-repository.js";
import { createNotification } from "@ipms/domain";
import type { NotificationId, OrganizationId, UserId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const USER_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;

function makeNotification(id: string) {
  return createNotification({
    id: id as NotificationId,
    organizationId: ORG_ID,
    recipientId: USER_ID,
    type: "deadline:upcoming",
    title: "Test",
    message: "Test message",
    entityType: "deadline",
    entityId: "aaa",
  });
}

describe("notification use cases", () => {
  let repo: ReturnType<typeof createInMemoryNotificationRepository>;

  beforeEach(() => { repo = createInMemoryNotificationRepository(); });

  it("lists notifications for user", async () => {
    const n = makeNotification("550e8400-e29b-41d4-a716-446655440001");
    if (n.ok) await repo.save(n.value);

    const list = listNotificationsUseCase(repo);
    const result = await list(USER_ID, ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });

  it("marks notification as read", async () => {
    const nId = "550e8400-e29b-41d4-a716-446655440001" as NotificationId;
    const n = makeNotification(nId);
    if (n.ok) await repo.save(n.value);

    const markRead = markNotificationReadUseCase(repo);
    const result = await markRead(nId, USER_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.read).toBe(true);
  });

  it("marks all as read", async () => {
    const n1 = makeNotification("550e8400-e29b-41d4-a716-446655440001");
    const n2 = makeNotification("550e8400-e29b-41d4-a716-446655440002");
    if (n1.ok) await repo.save(n1.value);
    if (n2.ok) await repo.save(n2.value);

    const markAll = markAllNotificationsReadUseCase(repo);
    await markAll(USER_ID, ORG_ID);

    const list = listNotificationsUseCase(repo);
    const result = await list(USER_ID, ORG_ID);
    if (result.ok) {
      expect(result.value.every((n) => n.read)).toBe(true);
    }
  });
});
