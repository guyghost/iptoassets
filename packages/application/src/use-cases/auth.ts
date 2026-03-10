import type { UserId, OrganizationId, MembershipId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { User, Organization } from "@ipms/domain";
import { createUser, createOrganization, createMembership } from "@ipms/domain";
import type { UserRepository, OrganizationRepository, MembershipRepository } from "../ports.js";

export interface SignInInput {
  readonly authProviderId: string;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
}

export function signInOrRegisterUseCase(userRepo: UserRepository) {
  return async (input: SignInInput): Promise<Result<User>> => {
    const existing = await userRepo.findByAuthProviderId(input.authProviderId);
    if (existing) return ok(existing);

    const result = createUser({
      id: crypto.randomUUID() as UserId,
      email: input.email,
      name: input.name,
      avatarUrl: input.avatarUrl,
      authProviderId: input.authProviderId,
    });
    if (!result.ok) return result;
    await userRepo.save(result.value);
    return result;
  };
}

export interface CreateOrgInput {
  readonly name: string;
  readonly ownerId: UserId;
}

export function createOrganizationUseCase(
  orgRepo: OrganizationRepository,
  memberRepo: MembershipRepository,
) {
  return async (input: CreateOrgInput): Promise<Result<Organization>> => {
    const orgResult = createOrganization({
      id: crypto.randomUUID() as OrganizationId,
      name: input.name,
      ownerId: input.ownerId,
    });
    if (!orgResult.ok) return orgResult;

    const memberResult = createMembership({
      id: crypto.randomUUID() as MembershipId,
      userId: input.ownerId,
      organizationId: orgResult.value.id,
      role: "owner",
    });
    if (!memberResult.ok) return err(memberResult.error);

    await orgRepo.save(orgResult.value);
    await memberRepo.save(memberResult.value);
    return orgResult;
  };
}

export function listUserOrganizationsUseCase(
  orgRepo: OrganizationRepository,
  memberRepo: MembershipRepository,
) {
  return async (userId: UserId): Promise<Result<readonly Organization[]>> => {
    const memberships = await memberRepo.findByUserId(userId);
    const orgs = await Promise.all(
      memberships.map((m) => orgRepo.findById(m.organizationId)),
    );
    return ok(orgs.filter((o): o is Organization => o !== null));
  };
}
