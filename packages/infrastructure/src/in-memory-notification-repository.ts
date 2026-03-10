import type { NotificationId, UserId, OrganizationId } from "@ipms/shared";
import type { Notification } from "@ipms/domain";
import type { NotificationRepository } from "@ipms/application";

export function createInMemoryNotificationRepository(): NotificationRepository {
  const store = new Map<string, Notification>();

  return {
    async findByRecipientId(recipientId, orgId) {
      return [...store.values()]
        .filter((n) => n.recipientId === recipientId && n.organizationId === orgId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    async findById(id, recipientId) {
      const n = store.get(id);
      return n && n.recipientId === recipientId ? n : null;
    },
    async save(notification) { store.set(notification.id, notification); },
    async markAllRead(recipientId, orgId) {
      for (const [key, n] of store) {
        if (n.recipientId === recipientId && n.organizationId === orgId && !n.read) {
          store.set(key, { ...n, read: true });
        }
      }
    },
  };
}
