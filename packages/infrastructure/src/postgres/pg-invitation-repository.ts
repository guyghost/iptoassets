import { eq, and } from "drizzle-orm";
import type { InvitationId, OrganizationId, UserId } from "@ipms/shared";
import type { Invitation, MemberRole, InvitationStatus } from "@ipms/domain";
import type { InvitationRepository } from "@ipms/application";
import { invitations } from "./schema.js";
import type { Database } from "./connection.js";

type InvitationRow = typeof invitations.$inferSelect;

function toEntity(row: InvitationRow): Invitation {
  return {
    id: row.id as InvitationId,
    organizationId: row.organizationId as OrganizationId,
    invitedByUserId: row.invitedByUserId as UserId,
    email: row.email,
    role: row.role as MemberRole,
    status: row.status as InvitationStatus,
    createdAt: row.createdAt,
    expiresAt: row.expiresAt,
  };
}

export function createPgInvitationRepository(db: Database): InvitationRepository {
  return {
    async findById(id, orgId) {
      const rows = await db.select().from(invitations)
        .where(and(eq(invitations.id, id), eq(invitations.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findByEmail(email) {
      const rows = await db.select().from(invitations)
        .where(and(eq(invitations.email, email), eq(invitations.status, "pending")));
      return rows.map(toEntity);
    },

    async findByOrganizationId(orgId) {
      const rows = await db.select().from(invitations)
        .where(eq(invitations.organizationId, orgId));
      return rows.map(toEntity);
    },

    async save(invitation) {
      await db.insert(invitations).values({
        id: invitation.id,
        organizationId: invitation.organizationId,
        invitedByUserId: invitation.invitedByUserId,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
      }).onConflictDoUpdate({
        target: invitations.id,
        set: {
          status: invitation.status,
          role: invitation.role,
        },
      });
    },

    async delete(id, orgId) {
      const result = await db.delete(invitations)
        .where(and(eq(invitations.id, id), eq(invitations.organizationId, orgId)));
      return (result.rowCount ?? 0) > 0;
    },
  };
}
