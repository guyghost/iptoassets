import type { MembershipId, UserId, OrganizationId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { Membership, MemberRole } from "./entities.js";

export interface CreateMembershipInput {
  readonly id: MembershipId;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly role: MemberRole;
}

export function createMembership(input: CreateMembershipInput): Result<Membership> {
  return ok({
    id: input.id,
    userId: input.userId,
    organizationId: input.organizationId,
    role: input.role,
    joinedAt: new Date(),
  });
}
