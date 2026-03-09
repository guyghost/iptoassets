import { eq, and, asc } from "drizzle-orm";
import type { AssetId, StatusChangeEventId, OrganizationId, AssetStatus } from "@ipms/shared";
import type { StatusChangeEvent } from "@ipms/domain";
import type { StatusChangeEventRepository } from "@ipms/application";
import { statusChangeEvents } from "./schema.js";
import type { Database } from "./connection.js";

type StatusChangeEventRow = typeof statusChangeEvents.$inferSelect;

function toEntity(row: StatusChangeEventRow): StatusChangeEvent {
  return {
    id: row.id as StatusChangeEventId,
    assetId: row.assetId as AssetId,
    fromStatus: row.fromStatus as AssetStatus | null,
    toStatus: row.toStatus as AssetStatus,
    changedAt: row.changedAt,
    changedBy: row.changedBy,
    organizationId: row.organizationId as OrganizationId,
  };
}

export function createPgStatusChangeEventRepository(db: Database): StatusChangeEventRepository {
  return {
    async findByAssetId(assetId, orgId) {
      const rows = await db.select().from(statusChangeEvents)
        .where(and(eq(statusChangeEvents.assetId, assetId), eq(statusChangeEvents.organizationId, orgId)))
        .orderBy(asc(statusChangeEvents.changedAt));
      return rows.map(toEntity);
    },

    async findAll(orgId) {
      const rows = await db.select().from(statusChangeEvents)
        .where(eq(statusChangeEvents.organizationId, orgId));
      return rows.map(toEntity);
    },

    async save(event) {
      await db.insert(statusChangeEvents).values({
        id: event.id,
        assetId: event.assetId,
        fromStatus: event.fromStatus,
        toStatus: event.toStatus,
        changedAt: event.changedAt,
        changedBy: event.changedBy,
        organizationId: event.organizationId,
      }).onConflictDoUpdate({
        target: statusChangeEvents.id,
        set: {
          assetId: event.assetId,
          fromStatus: event.fromStatus,
          toStatus: event.toStatus,
          changedAt: event.changedAt,
          changedBy: event.changedBy,
        },
      });
    },
  };
}
