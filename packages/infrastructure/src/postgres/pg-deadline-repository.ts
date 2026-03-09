import { eq, and } from "drizzle-orm";
import type { AssetId, DeadlineId, OrganizationId, DeadlineType } from "@ipms/shared";
import type { Deadline } from "@ipms/domain";
import type { DeadlineRepository } from "@ipms/application";
import { deadlines } from "./schema.js";
import type { Database } from "./connection.js";

type DeadlineRow = typeof deadlines.$inferSelect;

function toEntity(row: DeadlineRow): Deadline {
  return {
    id: row.id as DeadlineId,
    assetId: row.assetId as AssetId,
    type: row.type as DeadlineType,
    title: row.title,
    dueDate: row.dueDate,
    completed: row.completed,
    organizationId: row.organizationId as OrganizationId,
  };
}

export function createPgDeadlineRepository(db: Database): DeadlineRepository {
  return {
    async findById(id, orgId) {
      const rows = await db.select().from(deadlines)
        .where(and(eq(deadlines.id, id), eq(deadlines.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findByAssetId(assetId, orgId) {
      const rows = await db.select().from(deadlines)
        .where(and(eq(deadlines.assetId, assetId), eq(deadlines.organizationId, orgId)));
      return rows.map(toEntity);
    },

    async findAll(orgId) {
      const rows = await db.select().from(deadlines)
        .where(eq(deadlines.organizationId, orgId));
      return rows.map(toEntity);
    },

    async save(deadline) {
      await db.insert(deadlines).values({
        id: deadline.id,
        assetId: deadline.assetId,
        type: deadline.type,
        title: deadline.title,
        dueDate: deadline.dueDate,
        completed: deadline.completed,
        organizationId: deadline.organizationId,
      }).onConflictDoUpdate({
        target: deadlines.id,
        set: {
          assetId: deadline.assetId,
          type: deadline.type,
          title: deadline.title,
          dueDate: deadline.dueDate,
          completed: deadline.completed,
        },
      });
    },

    async delete(id, orgId) {
      const result = await db.delete(deadlines)
        .where(and(eq(deadlines.id, id), eq(deadlines.organizationId, orgId)));
      return (result.rowCount ?? 0) > 0;
    },
  };
}
