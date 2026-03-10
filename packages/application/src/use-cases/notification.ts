import type { NotificationId, OrganizationId, UserId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Notification, DeadlineEmailData } from "@ipms/domain";
import { createNotification, markNotificationRead, renderEmailTemplate } from "@ipms/domain";
import type { NotificationRepository, MembershipRepository, DeadlineRepository, EmailService, UserRepository } from "../ports.js";

export function listNotificationsUseCase(repo: NotificationRepository) {
  return async (recipientId: UserId, orgId: OrganizationId): Promise<Result<readonly Notification[]>> => {
    const notifications = await repo.findByRecipientId(recipientId, orgId);
    return ok(notifications);
  };
}

export function markNotificationReadUseCase(repo: NotificationRepository) {
  return async (id: NotificationId, recipientId: UserId): Promise<Result<Notification>> => {
    const notification = await repo.findById(id, recipientId);
    if (!notification) return err("Notification not found");
    const updated = markNotificationRead(notification);
    await repo.save(updated);
    return ok(updated);
  };
}

export function markAllNotificationsReadUseCase(repo: NotificationRepository) {
  return async (recipientId: UserId, orgId: OrganizationId): Promise<Result<true>> => {
    await repo.markAllRead(recipientId, orgId);
    return ok(true);
  };
}

export function checkDeadlineNotificationsUseCase(
  deadlineRepo: DeadlineRepository,
  notificationRepo: NotificationRepository,
  memberRepo: MembershipRepository,
  emailService: EmailService,
  userRepo: UserRepository,
) {
  return async (orgId: OrganizationId): Promise<Result<number>> => {
    const deadlines = await deadlineRepo.findAll(orgId);
    const members = await memberRepo.findByOrganizationId(orgId);
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let count = 0;

    for (const deadline of deadlines) {
      if (deadline.completed) continue;

      const isOverdue = deadline.dueDate < now;
      const isUpcoming = !isOverdue && deadline.dueDate <= sevenDays;

      if (!isOverdue && !isUpcoming) continue;

      for (const member of members) {
        const type = isOverdue ? "deadline:overdue" as const : "deadline:upcoming" as const;
        const result = createNotification({
          id: crypto.randomUUID() as NotificationId,
          organizationId: orgId,
          recipientId: member.userId,
          type,
          title: isOverdue ? `Deadline overdue: ${deadline.title}` : `Deadline approaching: ${deadline.title}`,
          message: isOverdue
            ? `Deadline "${deadline.title}" was due on ${deadline.dueDate.toISOString().split("T")[0]}`
            : `Deadline "${deadline.title}" is due on ${deadline.dueDate.toISOString().split("T")[0]}`,
          entityType: "deadline",
          entityId: deadline.id,
        });
        if (result.ok) {
          await notificationRepo.save(result.value);
          count++;
          try {
            const user = await userRepo.findById(member.userId);
            if (user) {
              const email = renderEmailTemplate(type, {
                title: deadline.title,
                dueDate: deadline.dueDate.toISOString().split("T")[0],
                assetTitle: deadline.assetId,
                appUrl: "",
              } as DeadlineEmailData);
              await emailService.send(user.email, email.subject, email.html);
            }
          } catch {
            // Email failure is non-blocking
          }
        }
      }
    }

    return ok(count);
  };
}
