import type { NotificationId, OrganizationId, UserId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Notification, NotificationType, EntityType } from "./entities.js";

export interface CreateNotificationInput {
  readonly id: NotificationId;
  readonly organizationId: OrganizationId;
  readonly recipientId: UserId;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly entityType: EntityType;
  readonly entityId: string;
}

export function createNotification(input: CreateNotificationInput): Result<Notification> {
  if (!input.title.trim()) return err("Notification title cannot be empty");
  if (!input.message.trim()) return err("Notification message cannot be empty");
  return ok({ ...input, title: input.title.trim(), message: input.message.trim(), read: false, createdAt: new Date() });
}

export function markNotificationRead(notification: Notification): Notification {
  return { ...notification, read: true };
}
