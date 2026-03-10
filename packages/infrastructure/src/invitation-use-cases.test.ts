import { describe, it, expect, beforeEach } from "vitest";
import { createInvitationUseCase, listInvitationsUseCase, deleteInvitationUseCase, acceptPendingInvitationsUseCase } from "@ipms/application";
import { createInMemoryInvitationRepository } from "./in-memory-invitation-repository.js";
import { createInMemoryMembershipRepository } from "./in-memory-membership-repository.js";
import { createInMemoryOrganizationRepository } from "./in-memory-organization-repository.js";
import { createInMemoryUserRepository } from "./in-memory-user-repository.js";
import { createNoOpEmailService } from "./noop-email-service.js";
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
    const create = createInvitationUseCase(invRepo, createNoOpEmailService(), createInMemoryOrganizationRepository(), createInMemoryUserRepository());
    await create({ organizationId: ORG_ID, invitedByUserId: ADMIN_ID, email: "bob@example.com", role: "attorney" });

    const list = listInvitationsUseCase(invRepo);
    const result = await list(ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });

  it("deletes an invitation", async () => {
    const create = createInvitationUseCase(invRepo, createNoOpEmailService(), createInMemoryOrganizationRepository(), createInMemoryUserRepository());
    const created = await create({ organizationId: ORG_ID, invitedByUserId: ADMIN_ID, email: "bob@example.com", role: "attorney" });

    if (created.ok) {
      const del = deleteInvitationUseCase(invRepo);
      const result = await del(created.value.id, ORG_ID);
      expect(result.ok).toBe(true);
    }
  });

  it("accepts pending invitations on sign-in", async () => {
    const create = createInvitationUseCase(invRepo, createNoOpEmailService(), createInMemoryOrganizationRepository(), createInMemoryUserRepository());
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

describe("createInvitationUseCase with email", () => {
  it("sends invitation email", async () => {
    const invRepo = createInMemoryInvitationRepository();
    const orgRepo = createInMemoryOrganizationRepository();
    const userRepo = createInMemoryUserRepository();
    const sentEmails: Array<{ to: string; subject: string }> = [];
    const emailService = {
      async send(to: string, subject: string, _html: string) {
        sentEmails.push({ to, subject });
      },
    };

    await orgRepo.save({
      id: ORG_ID,
      name: "Acme Corp",
      ownerId: ADMIN_ID,
      createdAt: new Date(),
    });
    await userRepo.save({
      id: ADMIN_ID,
      email: "admin@example.com",
      name: "Admin Alice",
      avatarUrl: null,
      authProviderId: "google:admin",
      createdAt: new Date(),
    });

    const create = createInvitationUseCase(invRepo, emailService, orgRepo, userRepo);
    const result = await create({ organizationId: ORG_ID, invitedByUserId: ADMIN_ID, email: "bob@example.com", role: "attorney" });

    expect(result.ok).toBe(true);
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toBe("bob@example.com");
    expect(sentEmails[0].subject).toContain("Acme Corp");
  });
});
