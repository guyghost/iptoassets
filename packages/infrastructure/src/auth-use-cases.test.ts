import { describe, it, expect, beforeEach } from "vitest";
import { signInOrRegisterUseCase, createOrganizationUseCase, listUserOrganizationsUseCase } from "@ipms/application";
import { createInMemoryUserRepository } from "./in-memory-user-repository.js";
import { createInMemoryOrganizationRepository } from "./in-memory-organization-repository.js";
import { createInMemoryMembershipRepository } from "./in-memory-membership-repository.js";
import type { UserId } from "@ipms/shared";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000" as UserId;

describe("signInOrRegisterUseCase", () => {
  let userRepo: ReturnType<typeof createInMemoryUserRepository>;
  let signInOrRegister: ReturnType<typeof signInOrRegisterUseCase>;

  beforeEach(() => {
    userRepo = createInMemoryUserRepository();
    signInOrRegister = signInOrRegisterUseCase(userRepo);
  });

  it("creates a new user on first sign-in", async () => {
    const result = await signInOrRegister({
      authProviderId: "google-123",
      email: "alice@example.com",
      name: "Alice Smith",
      avatarUrl: null,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("alice@example.com");
      expect(result.value.authProviderId).toBe("google-123");
    }
  });

  it("returns existing user on subsequent sign-in", async () => {
    const first = await signInOrRegister({
      authProviderId: "google-123",
      email: "alice@example.com",
      name: "Alice Smith",
      avatarUrl: null,
    });
    const second = await signInOrRegister({
      authProviderId: "google-123",
      email: "alice@example.com",
      name: "Alice Updated",
      avatarUrl: null,
    });
    expect(second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.value.id).toBe(first.value.id);
    }
  });
});

describe("createOrganizationUseCase", () => {
  let orgRepo: ReturnType<typeof createInMemoryOrganizationRepository>;
  let memberRepo: ReturnType<typeof createInMemoryMembershipRepository>;
  let createOrg: ReturnType<typeof createOrganizationUseCase>;

  beforeEach(() => {
    orgRepo = createInMemoryOrganizationRepository();
    memberRepo = createInMemoryMembershipRepository();
    createOrg = createOrganizationUseCase(orgRepo, memberRepo);
  });

  it("creates an organization with owner membership", async () => {
    const result = await createOrg({ name: "Acme Corp", ownerId: USER_ID });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Acme Corp");
      expect(result.value.ownerId).toBe(USER_ID);
    }
    const memberships = await memberRepo.findByUserId(USER_ID);
    expect(memberships).toHaveLength(1);
    expect(memberships[0].role).toBe("admin");
  });

  it("rejects empty organization name", async () => {
    const result = await createOrg({ name: "  ", ownerId: USER_ID });
    expect(result).toEqual({ ok: false, error: "Organization name cannot be empty" });
  });
});

describe("listUserOrganizationsUseCase", () => {
  let orgRepo: ReturnType<typeof createInMemoryOrganizationRepository>;
  let memberRepo: ReturnType<typeof createInMemoryMembershipRepository>;

  beforeEach(() => {
    orgRepo = createInMemoryOrganizationRepository();
    memberRepo = createInMemoryMembershipRepository();
  });

  it("lists organizations for a user", async () => {
    const createOrg = createOrganizationUseCase(orgRepo, memberRepo);
    await createOrg({ name: "Acme Corp", ownerId: USER_ID });
    await createOrg({ name: "Beta Inc", ownerId: USER_ID });

    const listOrgs = listUserOrganizationsUseCase(orgRepo, memberRepo);
    const result = await listOrgs(USER_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
    }
  });

  it("returns empty array for user with no organizations", async () => {
    const listOrgs = listUserOrganizationsUseCase(orgRepo, memberRepo);
    const result = await listOrgs(USER_ID);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(0);
    }
  });
});
