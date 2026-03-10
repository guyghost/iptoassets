import type { InvitationId, OrganizationId, UserId, MembershipId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Invitation, MemberRole } from "@ipms/domain";
import { createInvitation, acceptInvitation, createMembership } from "@ipms/domain";
import type { InvitationRepository, MembershipRepository } from "../ports.js";

export interface CreateInvitationUseCaseInput {
  readonly organizationId: OrganizationId;
  readonly invitedByUserId: UserId;
  readonly email: string;
  readonly role: MemberRole;
}

export function createInvitationUseCase(repo: InvitationRepository) {
  return async (input: CreateInvitationUseCaseInput): Promise<Result<Invitation>> => {
    const result = createInvitation({
      id: crypto.randomUUID() as InvitationId,
      organizationId: input.organizationId,
      invitedByUserId: input.invitedByUserId,
      email: input.email,
      role: input.role,
    });
    if (!result.ok) return result;
    await repo.save(result.value);
    return result;
  };
}

export function listInvitationsUseCase(repo: InvitationRepository) {
  return async (orgId: OrganizationId): Promise<Result<readonly Invitation[]>> => {
    const invitations = await repo.findByOrganizationId(orgId);
    return ok(invitations);
  };
}

export function deleteInvitationUseCase(repo: InvitationRepository) {
  return async (id: InvitationId, orgId: OrganizationId): Promise<Result<true>> => {
    const deleted = await repo.delete(id, orgId);
    if (!deleted) return err("Invitation not found");
    return ok(true);
  };
}

export function acceptPendingInvitationsUseCase(
  invitationRepo: InvitationRepository,
  memberRepo: MembershipRepository,
) {
  return async (email: string, userId: UserId): Promise<Result<number>> => {
    const invitations = await invitationRepo.findByEmail(email);
    let accepted = 0;

    for (const invitation of invitations) {
      const result = acceptInvitation(invitation);
      if (!result.ok) continue;

      const existing = await memberRepo.findByUserAndOrg(userId, invitation.organizationId);
      if (existing) continue;

      const memberResult = createMembership({
        id: crypto.randomUUID() as MembershipId,
        userId,
        organizationId: invitation.organizationId,
        role: invitation.role,
      });

      if (memberResult.ok) {
        await memberRepo.save(memberResult.value);
        await invitationRepo.save(result.value);
        accepted++;
      }
    }

    return ok(accepted);
  };
}
