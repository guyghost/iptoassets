import { describe, it, expect, beforeEach } from "vitest";
import { listNotificationsUseCase, markNotificationReadUseCase, markAllNotificationsReadUseCase, checkDeadlineNotificationsUseCase } from "@ipms/application";
import { createInMemoryNotificationRepository } from "./in-memory-notification-repository.js";
import { createInMemoryDeadlineRepository } from "./in-memory-deadline-repository.js";
import { createInMemoryMembershipRepository } from "./in-memory-membership-repository.js";
import { createInMemoryUserRepository } from "./in-memory-user-repository.js";
import { createNotification } from "@ipms/domain";
import type { NotificationId, OrganizationId, UserId, DeadlineId, AssetId, MembershipId } from "@ipms/shared";

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

describe("checkDeadlineNotifications with email", () => {
  it("sends emails for overdue deadlines", async () => {
    const deadlineRepo = createInMemoryDeadlineRepository();
    const notifRepo = createInMemoryNotificationRepository();
    const memRepo = createInMemoryMembershipRepository();
    const userRepo = createInMemoryUserRepository();
    const sentEmails: Array<{ to: string; subject: string }> = [];
    const emailService = {
      async send(to: string, subject: string, _html: string) {
        sentEmails.push({ to, subject });
      },
    };

    await userRepo.save({
      id: USER_ID,
      email: "alice@example.com",
      name: "Alice",
      avatarUrl: null,
      authProviderId: "google:123",
      createdAt: new Date(),
    });

    await memRepo.save({
      id: "990e8400-e29b-41d4-a716-446655440000" as MembershipId,
      userId: USER_ID,
      organizationId: ORG_ID,
      role: "attorney",
      joinedAt: new Date(),
    });

    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await deadlineRepo.save({
      id: "aae84000-e29b-41d4-a716-446655440000" as DeadlineId,
      assetId: "880e8400-e29b-41d4-a716-446655440000" as AssetId,
      type: "filing",
      title: "File patent",
      dueDate: pastDate,
      completed: false,
      organizationId: ORG_ID,
    });

    const check = checkDeadlineNotificationsUseCase(deadlineRepo, notifRepo, memRepo, emailService, userRepo);
    const result = await check(ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(1);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("alice@example.com");
    expect(sentEmails[0].subject).toContain("overdue");
  });
});
