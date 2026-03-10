import { eq, and, desc } from "drizzle-orm";
import type { NotificationId, OrganizationId, UserId } from "@ipms/shared";
import type { Notification, NotificationType, EntityType } from "@ipms/domain";
import type { NotificationRepository } from "@ipms/application";
import { notifications } from "./schema.js";
import type { Database } from "./connection.js";

type NotificationRow = typeof notifications.$inferSelect;

function toEntity(row: NotificationRow): Notification {
  return {
    id: row.id as NotificationId,
    organizationId: row.organizationId as OrganizationId,
    recipientId: row.recipientId as UserId,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    entityType: row.entityType as EntityType,
    entityId: row.entityId,
    read: row.read,
    createdAt: row.createdAt,
  };
}

export function createPgNotificationRepository(db: Database): NotificationRepository {
  return {
    async findByRecipientId(recipientId, orgId) {
      const rows = await db.select().from(notifications)
        .where(and(eq(notifications.recipientId, recipientId), eq(notifications.organizationId, orgId)))
        .orderBy(desc(notifications.createdAt));
      return rows.map(toEntity);
    },

    async findById(id, recipientId) {
      const rows = await db.select().from(notifications)
        .where(and(eq(notifications.id, id), eq(notifications.recipientId, recipientId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async save(notification) {
      await db.insert(notifications).values({
        id: notification.id,
        organizationId: notification.organizationId,
        recipientId: notification.recipientId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        entityType: notification.entityType,
        entityId: notification.entityId,
        read: notification.read,
        createdAt: notification.createdAt,
      }).onConflictDoUpdate({
        target: notifications.id,
        set: {
          read: notification.read,
        },
      });
    },

    async markAllRead(recipientId, orgId) {
      await db.update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.recipientId, recipientId), eq(notifications.organizationId, orgId)));
    },
  };
}
