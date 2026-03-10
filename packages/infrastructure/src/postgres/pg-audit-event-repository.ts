import { eq, and, desc } from "drizzle-orm";
import type { AuditEventId, OrganizationId, UserId } from "@ipms/shared";
import type { AuditEvent, AuditAction, EntityType } from "@ipms/domain";
import type { AuditEventRepository } from "@ipms/application";
import { auditEvents } from "./schema.js";
import type { Database } from "./connection.js";

type AuditEventRow = typeof auditEvents.$inferSelect;

function toEntity(row: AuditEventRow): AuditEvent {
  return {
    id: row.id as AuditEventId,
    organizationId: row.organizationId as OrganizationId,
    actorId: row.actorId as UserId,
    action: row.action as AuditAction,
    entityType: row.entityType as EntityType,
    entityId: row.entityId,
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
    timestamp: row.timestamp,
  };
}

export function createPgAuditEventRepository(db: Database): AuditEventRepository {
  return {
    async findByOrganizationId(orgId, options) {
      const conditions = [eq(auditEvents.organizationId, orgId)];
      if (options?.entityType) conditions.push(eq(auditEvents.entityType, options.entityType));
      if (options?.actorId) conditions.push(eq(auditEvents.actorId, options.actorId));

      let query = db.select().from(auditEvents)
        .where(and(...conditions))
        .orderBy(desc(auditEvents.timestamp));

      if (options?.limit) {
        query = query.limit(options.limit) as typeof query;
      }

      const rows = await query;
      return rows.map(toEntity);
    },

    async save(event) {
      await db.insert(auditEvents).values({
        id: event.id,
        organizationId: event.organizationId,
        actorId: event.actorId,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        timestamp: event.timestamp,
      }).onConflictDoUpdate({
        target: auditEvents.id,
        set: {
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        },
      });
    },
  };
}
