import type { UserId, OrganizationId } from "@ipms/shared";
import type { AuditEvent } from "@ipms/domain";
import type { AuditEventRepository } from "@ipms/application";

export function createInMemoryAuditEventRepository(): AuditEventRepository {
  const store: AuditEvent[] = [];

  return {
    async findByOrganizationId(orgId, options) {
      let events = store.filter((e) => e.organizationId === orgId);
      if (options?.entityType) events = events.filter((e) => e.entityType === options.entityType);
      if (options?.actorId) events = events.filter((e) => e.actorId === options.actorId);
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      if (options?.limit) events = events.slice(0, options.limit);
      return events;
    },
    async save(event) { store.push(event); },
  };
}
