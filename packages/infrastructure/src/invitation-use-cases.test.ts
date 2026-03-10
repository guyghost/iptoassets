import { describe, it, expect, beforeEach } from "vitest";
import { createInvitationUseCase, listInvitationsUseCase, deleteInvitationUseCase, acceptPendingInvitationsUseCase } from "@ipms/application";
import { createInMemoryInvitationRepository } from "./in-memory-invitation-repository.js";
import { createInMemoryMembershipRepository } from "./in-memory-membership-repository.js";
import type { OrganizationId, UserId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const ADMIN_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;
const NEW_USER_ID = "770e8400-e29b-41d4-a716-446655440000" as UserId;

describe("invitation use cases", () => {
  let invRepo: ReturnType<typeof createInMemoryInvitationRepository>;
  let memberRepo: ReturnType<typeof createInMemoryMembershipRepository>;

  beforeEach(() => {
    invRepo = createInMemoryInvitationRepository();
    memberRepo = createInMemoryMembershipRepository();
  });

  it("creates and lists invitations", async () => {
    const create = createInvitationUseCase(invRepo);
    await create({ organizationId: ORG_ID, invitedByUserId: ADMIN_ID, email: "bob@example.com", role: "attorney" });

    const list = listInvitationsUseCase(invRepo);
    const result = await list(ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });

  it("deletes an invitation", async () => {
    const create = createInvitationUseCase(invRepo);
    const created = await create({ organizationId: ORG_ID, invitedByUserId: ADMIN_ID, email: "bob@example.com", role: "attorney" });

    if (created.ok) {
      const del = deleteInvitationUseCase(invRepo);
      const result = await del(created.value.id, ORG_ID);
      expect(result.ok).toBe(true);
    }
  });

  it("accepts pending invitations on sign-in", async () => {
    const create = createInvitationUseCase(invRepo);
    await create({ organizationId: ORG_ID, invitedByUserId: ADMIN_ID, email: "bob@example.com", role: "attorney" });

    const accept = acceptPendingInvitationsUseCase(invRepo, memberRepo);
    const result = await accept("bob@example.com", NEW_USER_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toBe(1);

    const memberships = await memberRepo.findByUserId(NEW_USER_ID);
    expect(memberships).toHaveLength(1);
    expect(memberships[0].role).toBe("attorney");
  });
});
