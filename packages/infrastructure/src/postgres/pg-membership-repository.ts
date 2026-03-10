import { eq, and } from "drizzle-orm";
import type { UserId, OrganizationId, MembershipId } from "@ipms/shared";
import type { Membership, MemberRole } from "@ipms/domain";
import type { MembershipRepository } from "@ipms/application";
import { memberships } from "./schema.js";
import type { Database } from "./connection.js";

type MembershipRow = typeof memberships.$inferSelect;

function toEntity(row: MembershipRow): Membership {
  return {
    id: row.id as MembershipId,
    userId: row.userId as UserId,
    organizationId: row.organizationId as OrganizationId,
    role: row.role as MemberRole,
    joinedAt: row.joinedAt,
  };
}

export function createPgMembershipRepository(db: Database): MembershipRepository {
  return {
    async findByUserId(userId) {
      const rows = await db.select().from(memberships).where(eq(memberships.userId, userId));
      return rows.map(toEntity);
    },
    async findByOrganizationId(orgId) {
      const rows = await db.select().from(memberships).where(eq(memberships.organizationId, orgId));
      return rows.map(toEntity);
    },
    async findByUserAndOrg(userId, orgId) {
      const rows = await db.select().from(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },
    async save(membership) {
      await db.insert(memberships).values({
        id: membership.id, userId: membership.userId,
        organizationId: membership.organizationId, role: membership.role, joinedAt: membership.joinedAt,
      }).onConflictDoUpdate({ target: memberships.id, set: { role: membership.role } });
    },
  };
}
