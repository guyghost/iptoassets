import type { InvitationId, OrganizationId, UserId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Invitation, MemberRole } from "./entities.js";

export interface CreateInvitationInput {
  readonly id: InvitationId;
  readonly organizationId: OrganizationId;
  readonly invitedByUserId: UserId;
  readonly email: string;
  readonly role: MemberRole;
}

export function createInvitation(input: CreateInvitationInput): Result<Invitation> {
  if (!input.email.trim()) return err("Invitation email cannot be empty");
  const now = new Date();
  return ok({
    id: input.id,
    organizationId: input.organizationId,
    invitedByUserId: input.invitedByUserId,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status: "pending",
    createdAt: now,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  });
}

export function acceptInvitation(invitation: Invitation): Result<Invitation> {
  if (invitation.status !== "pending") return err("Invitation is not pending");
  if (invitation.expiresAt < new Date()) return err("Invitation has expired");
  return ok({ ...invitation, status: "accepted" });
}
