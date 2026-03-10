import { eq } from "drizzle-orm";
import type { OrganizationId, UserId } from "@ipms/shared";
import type { Organization } from "@ipms/domain";
import type { OrganizationRepository } from "@ipms/application";
import { organizations } from "./schema.js";
import type { Database } from "./connection.js";

type OrgRow = typeof organizations.$inferSelect;

function toEntity(row: OrgRow): Organization {
  return {
    id: row.id as OrganizationId,
    name: row.name,
    ownerId: row.ownerId as UserId,
    createdAt: row.createdAt,
  };
}

export function createPgOrganizationRepository(db: Database): OrganizationRepository {
  return {
    async findAll() {
      const rows = await db.select().from(organizations);
      return rows.map(toEntity);
    },
    async findById(id) {
      const rows = await db.select().from(organizations).where(eq(organizations.id, id));
      return rows[0] ? toEntity(rows[0]) : null;
    },
    async findByOwnerId(ownerId) {
      const rows = await db.select().from(organizations).where(eq(organizations.ownerId, ownerId));
      return rows.map(toEntity);
    },
    async save(org) {
      await db.insert(organizations).values({
        id: org.id, name: org.name, ownerId: org.ownerId, createdAt: org.createdAt,
      }).onConflictDoUpdate({ target: organizations.id, set: { name: org.name } });
    },
  };
}
