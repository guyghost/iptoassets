# Phase 3a: Auth, Users & Organizations — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Auth.js authentication with Google + Microsoft OAuth, domain User/Organization/Membership entities, and protect all API routes with session-based auth — replacing the hardcoded `DEFAULT_ORG_ID`.

**Architecture:** Auth.js handles OAuth and sessions (its own tables via Drizzle adapter). Domain entities User, Organization, Membership follow existing FC&IS patterns: branded types in shared, pure domain functions, ports in application, in-memory + PostgreSQL implementations in infrastructure. A `requireAuth` helper replaces `DEFAULT_ORG_ID` in all API routes.

**Tech Stack:** Auth.js (`@auth/sveltekit`), Drizzle ORM, PostgreSQL, SvelteKit, Vitest

**Design doc:** `docs/plans/2026-03-10-phase3a-auth-users-design.md`

---

### Task 1: Add branded types UserId and MembershipId

**Files:**
- Modify: `packages/shared/src/brand.ts`
- Modify: `packages/shared/src/validation.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/validation.test.ts`

**Step 1: Write failing tests for parseUserId and parseMembershipId**

Add to `packages/shared/src/validation.test.ts`:

```typescript
describe("parseUserId", () => {
  it("accepts valid UUID", () => {
    const result = parseUserId("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toEqual({ ok: true, value: "550e8400-e29b-41d4-a716-446655440000" });
  });

  it("rejects invalid UUID", () => {
    const result = parseUserId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid UserId: must be UUID format" });
  });
});

describe("parseMembershipId", () => {
  it("accepts valid UUID", () => {
    const result = parseMembershipId("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toEqual({ ok: true, value: "550e8400-e29b-41d4-a716-446655440000" });
  });

  it("rejects invalid UUID", () => {
    const result = parseMembershipId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid MembershipId: must be UUID format" });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test -- packages/shared/src/validation.test.ts`
Expected: FAIL — `parseUserId` and `parseMembershipId` not found

**Step 3: Add branded types and validators**

In `packages/shared/src/brand.ts`, add after line 10:

```typescript
export type UserId = Brand<string, "UserId">;
export type MembershipId = Brand<string, "MembershipId">;
```

In `packages/shared/src/validation.ts`, add the imports for `UserId` and `MembershipId`, then add:

```typescript
export function parseUserId(input: string): Result<UserId> {
  return UUID_RE.test(input)
    ? ok(input as UserId)
    : err("Invalid UserId: must be UUID format");
}

export function parseMembershipId(input: string): Result<MembershipId> {
  return UUID_RE.test(input)
    ? ok(input as MembershipId)
    : err("Invalid MembershipId: must be UUID format");
}
```

In `packages/shared/src/index.ts`, add to the brand exports: `UserId, MembershipId`. Add to the validation exports: `parseUserId, parseMembershipId`.

**Step 4: Run tests to verify they pass**

Run: `pnpm test -- packages/shared/src/validation.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add UserId and MembershipId branded types"
```

---

### Task 2: Add domain entities and creation functions

**Files:**
- Create: `packages/domain/src/user.ts`
- Create: `packages/domain/src/organization.ts`
- Create: `packages/domain/src/membership.ts`
- Modify: `packages/domain/src/entities.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/user.test.ts`
- Test: `packages/domain/src/organization.test.ts`
- Test: `packages/domain/src/membership.test.ts`

**Step 1: Add entity interfaces to `packages/domain/src/entities.ts`**

Add the import for `UserId, MembershipId` from `@ipms/shared`, then add:

```typescript
export type MemberRole = "owner" | "member";

export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly authProviderId: string;
  readonly createdAt: Date;
}

export interface Organization {
  readonly id: OrganizationId;
  readonly name: string;
  readonly ownerId: UserId;
  readonly createdAt: Date;
}

export interface Membership {
  readonly id: MembershipId;
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly role: MemberRole;
  readonly joinedAt: Date;
}
```

**Step 2: Write failing tests for createUser**

Create `packages/domain/src/user.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createUser } from "./user.js";
import type { UserId } from "@ipms/shared";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000" as UserId;

describe("createUser", () => {
  it("creates a user with valid input", () => {
    const result = createUser({
      id: USER_ID,
      email: "alice@example.com",
      name: "Alice Smith",
      avatarUrl: "https://example.com/avatar.png",
      authProviderId: "google-123",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.email).toBe("alice@example.com");
      expect(result.value.name).toBe("Alice Smith");
      expect(result.value.authProviderId).toBe("google-123");
    }
  });

  it("rejects empty email", () => {
    const result = createUser({
      id: USER_ID,
      email: "  ",
      name: "Alice",
      avatarUrl: null,
      authProviderId: "google-123",
    });
    expect(result).toEqual({ ok: false, error: "User email cannot be empty" });
  });

  it("rejects empty name", () => {
    const result = createUser({
      id: USER_ID,
      email: "alice@example.com",
      name: "  ",
      avatarUrl: null,
      authProviderId: "google-123",
    });
    expect(result).toEqual({ ok: false, error: "User name cannot be empty" });
  });

  it("rejects empty authProviderId", () => {
    const result = createUser({
      id: USER_ID,
      email: "alice@example.com",
      name: "Alice",
      avatarUrl: null,
      authProviderId: "",
    });
    expect(result).toEqual({ ok: false, error: "Auth provider ID cannot be empty" });
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `pnpm test -- packages/domain/src/user.test.ts`
Expected: FAIL

**Step 4: Implement createUser**

Create `packages/domain/src/user.ts`:

```typescript
import type { UserId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { User } from "./entities.js";

export interface CreateUserInput {
  readonly id: UserId;
  readonly email: string;
  readonly name: string;
  readonly avatarUrl: string | null;
  readonly authProviderId: string;
}

export function createUser(input: CreateUserInput): Result<User> {
  if (!input.email.trim()) {
    return err("User email cannot be empty");
  }
  if (!input.name.trim()) {
    return err("User name cannot be empty");
  }
  if (!input.authProviderId.trim()) {
    return err("Auth provider ID cannot be empty");
  }

  return ok({
    id: input.id,
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    avatarUrl: input.avatarUrl,
    authProviderId: input.authProviderId,
    createdAt: new Date(),
  });
}
```

**Step 5: Run tests to verify they pass**

Run: `pnpm test -- packages/domain/src/user.test.ts`
Expected: PASS

**Step 6: Write failing tests for createOrganization**

Create `packages/domain/src/organization.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createOrganization } from "./organization.js";
import type { OrganizationId, UserId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const OWNER_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;

describe("createOrganization", () => {
  it("creates an organization with valid input", () => {
    const result = createOrganization({
      id: ORG_ID,
      name: "Acme Corp",
      ownerId: OWNER_ID,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Acme Corp");
      expect(result.value.ownerId).toBe(OWNER_ID);
    }
  });

  it("rejects empty name", () => {
    const result = createOrganization({
      id: ORG_ID,
      name: "  ",
      ownerId: OWNER_ID,
    });
    expect(result).toEqual({ ok: false, error: "Organization name cannot be empty" });
  });
});
```

**Step 7: Implement createOrganization**

Create `packages/domain/src/organization.ts`:

```typescript
import type { OrganizationId, UserId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Organization } from "./entities.js";

export interface CreateOrganizationInput {
  readonly id: OrganizationId;
  readonly name: string;
  readonly ownerId: UserId;
}

export function createOrganization(input: CreateOrganizationInput): Result<Organization> {
  if (!input.name.trim()) {
    return err("Organization name cannot be empty");
  }

  return ok({
    id: input.id,
    name: input.name.trim(),
    ownerId: input.ownerId,
    createdAt: new Date(),
  });
}
```

**Step 8: Run tests**

Run: `pnpm test -- packages/domain/src/organization.test.ts`
Expected: PASS

**Step 9: Write failing tests for createMembership**

Create `packages/domain/src/membership.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createMembership } from "./membership.js";
import type { MembershipId, UserId, OrganizationId } from "@ipms/shared";

const MEMBERSHIP_ID = "550e8400-e29b-41d4-a716-446655440000" as MembershipId;
const USER_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;
const ORG_ID = "770e8400-e29b-41d4-a716-446655440000" as OrganizationId;

describe("createMembership", () => {
  it("creates a membership with valid input", () => {
    const result = createMembership({
      id: MEMBERSHIP_ID,
      userId: USER_ID,
      organizationId: ORG_ID,
      role: "owner",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.userId).toBe(USER_ID);
      expect(result.value.organizationId).toBe(ORG_ID);
      expect(result.value.role).toBe("owner");
    }
  });

  it("creates a member role", () => {
    const result = createMembership({
      id: MEMBERSHIP_ID,
      userId: USER_ID,
      organizationId: ORG_ID,
      role: "member",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.role).toBe("member");
    }
  });
});
```

**Step 10: Implement createMembership**

Create `packages/domain/src/membership.ts`:

```typescript
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
```

**Step 11: Update domain index**

In `packages/domain/src/index.ts`, add:

```typescript
export type { User, Organization, Membership, MemberRole } from "./entities.js";

export { createUser } from "./user.js";
export type { CreateUserInput } from "./user.js";

export { createOrganization } from "./organization.js";
export type { CreateOrganizationInput } from "./organization.js";

export { createMembership } from "./membership.js";
export type { CreateMembershipInput } from "./membership.js";
```

**Step 12: Run all domain tests**

Run: `pnpm test -- packages/domain/`
Expected: ALL PASS

**Step 13: Commit**

```bash
git add packages/domain/
git commit -m "feat(domain): add User, Organization, and Membership entities"
```

---

### Task 3: Add repository ports

**Files:**
- Modify: `packages/application/src/ports.ts`
- Modify: `packages/application/src/index.ts`

**Step 1: Add port interfaces**

In `packages/application/src/ports.ts`, add the imports for `UserId, MembershipId` from `@ipms/shared` and `User, Organization, Membership` from `@ipms/domain`, then add:

```typescript
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  findByAuthProviderId(authProviderId: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface OrganizationRepository {
  findById(id: OrganizationId): Promise<Organization | null>;
  findByOwnerId(ownerId: UserId): Promise<readonly Organization[]>;
  save(org: Organization): Promise<void>;
}

export interface MembershipRepository {
  findByUserId(userId: UserId): Promise<readonly Membership[]>;
  findByOrganizationId(orgId: OrganizationId): Promise<readonly Membership[]>;
  findByUserAndOrg(userId: UserId, orgId: OrganizationId): Promise<Membership | null>;
  save(membership: Membership): Promise<void>;
}
```

**Step 2: Export from index**

In `packages/application/src/index.ts`, add:

```typescript
export type { UserRepository, OrganizationRepository, MembershipRepository } from "./ports.js";
```

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add packages/application/
git commit -m "feat(application): add User, Organization, and Membership repository ports"
```

---

### Task 4: Add auth use cases

**Files:**
- Create: `packages/application/src/use-cases/auth.ts`
- Modify: `packages/application/src/index.ts`
- Test: `packages/infrastructure/src/auth-use-cases.test.ts`

**Step 1: Write failing tests**

Create `packages/infrastructure/src/auth-use-cases.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import {
  signInOrRegisterUseCase,
  createOrganizationUseCase,
  listUserOrganizationsUseCase,
} from "@ipms/application";
import { createInMemoryUserRepository } from "./in-memory-user-repository.js";
import { createInMemoryOrganizationRepository } from "./in-memory-organization-repository.js";
import { createInMemoryMembershipRepository } from "./in-memory-membership-repository.js";
import type { UserId, OrganizationId, MembershipId } from "@ipms/shared";

const USER_ID = "550e8400-e29b-41d4-a716-446655440000" as UserId;
const ORG_ID = "660e8400-e29b-41d4-a716-446655440000" as OrganizationId;

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
    const result = await createOrg({
      name: "Acme Corp",
      ownerId: USER_ID,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.name).toBe("Acme Corp");
      expect(result.value.ownerId).toBe(USER_ID);
    }

    const memberships = await memberRepo.findByUserId(USER_ID);
    expect(memberships).toHaveLength(1);
    expect(memberships[0].role).toBe("owner");
  });

  it("rejects empty organization name", async () => {
    const result = await createOrg({
      name: "  ",
      ownerId: USER_ID,
    });
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
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test -- packages/infrastructure/src/auth-use-cases.test.ts`
Expected: FAIL — modules not found

**Step 3: Implement use cases**

Create `packages/application/src/use-cases/auth.ts`:

```typescript
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
```

**Step 4: Export from application index**

In `packages/application/src/index.ts`, add:

```typescript
export {
  signInOrRegisterUseCase,
  createOrganizationUseCase,
  listUserOrganizationsUseCase,
} from "./use-cases/auth.js";
```

**Step 5: Implement in-memory repositories (needed for tests — see Task 5)**

These are needed before tests pass. Proceed to Task 5 steps 1-3, then return here.

**Step 6: Run tests**

Run: `pnpm test -- packages/infrastructure/src/auth-use-cases.test.ts`
Expected: ALL PASS

**Step 7: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 8: Commit**

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat(application): add auth use cases — signIn, createOrg, listUserOrgs"
```

---

### Task 5: Add in-memory repository implementations

**Files:**
- Create: `packages/infrastructure/src/in-memory-user-repository.ts`
- Create: `packages/infrastructure/src/in-memory-organization-repository.ts`
- Create: `packages/infrastructure/src/in-memory-membership-repository.ts`
- Modify: `packages/infrastructure/src/index.ts`

**Step 1: Implement in-memory UserRepository**

Create `packages/infrastructure/src/in-memory-user-repository.ts`:

```typescript
import type { UserId } from "@ipms/shared";
import type { User } from "@ipms/domain";
import type { UserRepository } from "@ipms/application";

export function createInMemoryUserRepository(): UserRepository {
  const store = new Map<string, User>();

  return {
    async findById(id) {
      return store.get(id) ?? null;
    },

    async findByAuthProviderId(authProviderId) {
      return [...store.values()].find((u) => u.authProviderId === authProviderId) ?? null;
    },

    async findByEmail(email) {
      return [...store.values()].find((u) => u.email === email) ?? null;
    },

    async save(user) {
      store.set(user.id, user);
    },
  };
}
```

**Step 2: Implement in-memory OrganizationRepository**

Create `packages/infrastructure/src/in-memory-organization-repository.ts`:

```typescript
import type { OrganizationId, UserId } from "@ipms/shared";
import type { Organization } from "@ipms/domain";
import type { OrganizationRepository } from "@ipms/application";

export function createInMemoryOrganizationRepository(): OrganizationRepository {
  const store = new Map<string, Organization>();

  return {
    async findById(id) {
      return store.get(id) ?? null;
    },

    async findByOwnerId(ownerId) {
      return [...store.values()].filter((o) => o.ownerId === ownerId);
    },

    async save(org) {
      store.set(org.id, org);
    },
  };
}
```

**Step 3: Implement in-memory MembershipRepository**

Create `packages/infrastructure/src/in-memory-membership-repository.ts`:

```typescript
import type { UserId, OrganizationId } from "@ipms/shared";
import type { Membership } from "@ipms/domain";
import type { MembershipRepository } from "@ipms/application";

export function createInMemoryMembershipRepository(): MembershipRepository {
  const store = new Map<string, Membership>();

  return {
    async findByUserId(userId) {
      return [...store.values()].filter((m) => m.userId === userId);
    },

    async findByOrganizationId(orgId) {
      return [...store.values()].filter((m) => m.organizationId === orgId);
    },

    async findByUserAndOrg(userId, orgId) {
      return [...store.values()].find(
        (m) => m.userId === userId && m.organizationId === orgId,
      ) ?? null;
    },

    async save(membership) {
      store.set(membership.id, membership);
    },
  };
}
```

**Step 4: Export from infrastructure index**

In `packages/infrastructure/src/index.ts`, add:

```typescript
export { createInMemoryUserRepository } from "./in-memory-user-repository.js";
export { createInMemoryOrganizationRepository } from "./in-memory-organization-repository.js";
export { createInMemoryMembershipRepository } from "./in-memory-membership-repository.js";
```

**Step 5: Commit (if not already committed with Task 4)**

```bash
git add packages/infrastructure/
git commit -m "feat(infrastructure): add in-memory User, Organization, Membership repositories"
```

---

### Task 6: Add PostgreSQL schema and repositories

**Files:**
- Modify: `packages/infrastructure/src/postgres/schema.ts`
- Create: `packages/infrastructure/src/postgres/pg-user-repository.ts`
- Create: `packages/infrastructure/src/postgres/pg-organization-repository.ts`
- Create: `packages/infrastructure/src/postgres/pg-membership-repository.ts`
- Modify: `packages/infrastructure/src/postgres/index.ts`

**Step 1: Add tables to Drizzle schema**

In `packages/infrastructure/src/postgres/schema.ts`, add after existing table definitions:

```typescript
import { uniqueIndex } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  authProviderId: text("auth_provider_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("users_email_idx").on(table.email),
  uniqueIndex("users_auth_provider_id_idx").on(table.authProviderId),
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  role: text("role").notNull(),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
}, (table) => [
  uniqueIndex("memberships_user_org_idx").on(table.userId, table.organizationId),
  index("memberships_user_id_idx").on(table.userId),
  index("memberships_organization_id_idx").on(table.organizationId),
]);
```

**Step 2: Implement PostgreSQL UserRepository**

Create `packages/infrastructure/src/postgres/pg-user-repository.ts`:

```typescript
import { eq } from "drizzle-orm";
import type { UserId } from "@ipms/shared";
import type { User } from "@ipms/domain";
import type { UserRepository } from "@ipms/application";
import { users } from "./schema.js";
import type { Database } from "./connection.js";

type UserRow = typeof users.$inferSelect;

function toEntity(row: UserRow): User {
  return {
    id: row.id as UserId,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatarUrl,
    authProviderId: row.authProviderId,
    createdAt: row.createdAt,
  };
}

export function createPgUserRepository(db: Database): UserRepository {
  return {
    async findById(id) {
      const rows = await db.select().from(users).where(eq(users.id, id));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findByAuthProviderId(authProviderId) {
      const rows = await db.select().from(users)
        .where(eq(users.authProviderId, authProviderId));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findByEmail(email) {
      const rows = await db.select().from(users).where(eq(users.email, email));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async save(user) {
      await db.insert(users).values({
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        authProviderId: user.authProviderId,
        createdAt: user.createdAt,
      }).onConflictDoUpdate({
        target: users.id,
        set: {
          email: user.email,
          name: user.name,
          avatarUrl: user.avatarUrl,
        },
      });
    },
  };
}
```

**Step 3: Implement PostgreSQL OrganizationRepository**

Create `packages/infrastructure/src/postgres/pg-organization-repository.ts`:

```typescript
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
    async findById(id) {
      const rows = await db.select().from(organizations)
        .where(eq(organizations.id, id));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async findByOwnerId(ownerId) {
      const rows = await db.select().from(organizations)
        .where(eq(organizations.ownerId, ownerId));
      return rows.map(toEntity);
    },

    async save(org) {
      await db.insert(organizations).values({
        id: org.id,
        name: org.name,
        ownerId: org.ownerId,
        createdAt: org.createdAt,
      }).onConflictDoUpdate({
        target: organizations.id,
        set: { name: org.name },
      });
    },
  };
}
```

**Step 4: Implement PostgreSQL MembershipRepository**

Create `packages/infrastructure/src/postgres/pg-membership-repository.ts`:

```typescript
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
      const rows = await db.select().from(memberships)
        .where(eq(memberships.userId, userId));
      return rows.map(toEntity);
    },

    async findByOrganizationId(orgId) {
      const rows = await db.select().from(memberships)
        .where(eq(memberships.organizationId, orgId));
      return rows.map(toEntity);
    },

    async findByUserAndOrg(userId, orgId) {
      const rows = await db.select().from(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.organizationId, orgId)));
      return rows[0] ? toEntity(rows[0]) : null;
    },

    async save(membership) {
      await db.insert(memberships).values({
        id: membership.id,
        userId: membership.userId,
        organizationId: membership.organizationId,
        role: membership.role,
        joinedAt: membership.joinedAt,
      }).onConflictDoUpdate({
        target: memberships.id,
        set: { role: membership.role },
      });
    },
  };
}
```

**Step 5: Export from postgres index**

In `packages/infrastructure/src/postgres/index.ts`, add:

```typescript
export { createPgUserRepository } from "./pg-user-repository.js";
export { createPgOrganizationRepository } from "./pg-organization-repository.js";
export { createPgMembershipRepository } from "./pg-membership-repository.js";
```

**Step 6: Generate Drizzle migration**

Run: `cd packages/infrastructure && pnpm db:generate`
Expected: New migration file created in `packages/infrastructure/drizzle/`

**Step 7: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 8: Commit**

```bash
git add packages/infrastructure/
git commit -m "feat(infrastructure): add PostgreSQL schema and repos for User, Organization, Membership"
```

---

### Task 7: Install and configure Auth.js

**Files:**
- Modify: `apps/web/package.json` (add `@auth/sveltekit` dependency)
- Create: `apps/web/src/auth.ts`
- Create: `apps/web/src/hooks.server.ts`
- Modify: `apps/web/src/lib/server/repositories.ts`
- Modify: `apps/web/src/lib/server/use-cases.ts`
- Modify: `apps/web/src/lib/server/api-utils.ts`

**Step 1: Install Auth.js**

Run: `pnpm --filter @ipms/web add @auth/sveltekit @auth/drizzle-adapter`

**Step 2: Create Auth.js config**

Create `apps/web/src/auth.ts`:

```typescript
import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import MicrosoftEntraId from "@auth/sveltekit/providers/microsoft-entra-id";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { env } from "$env/dynamic/private";
import type { UserId, OrganizationId } from "@ipms/shared";

// Auth.js manages its own tables via DrizzleAdapter.
// On sign-in, we sync the Auth.js user to our domain User via signInOrRegister use case.
// The session is enriched with our domain userId and activeOrganizationId.

export const { handle, signIn, signOut } = SvelteKitAuth(async () => {
  // Lazy-import to avoid circular deps with repository setup
  const { signInOrRegister, listUserOrganizations } = await import("$lib/server/use-cases");

  return {
    providers: [
      Google({
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
      }),
      MicrosoftEntraId({
        clientId: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
        issuer: env.MICROSOFT_ISSUER,
      }),
    ],
    callbacks: {
      async signIn({ user, account }) {
        if (!account || !user.email || !user.name) return false;

        const result = await signInOrRegister({
          authProviderId: `${account.provider}:${account.providerAccountId}`,
          email: user.email,
          name: user.name,
          avatarUrl: user.image ?? null,
        });

        return result.ok;
      },
      async session({ session, user }) {
        // Resolve our domain user from Auth.js user
        const { userRepo } = await import("$lib/server/repositories");
        const domainUser = await userRepo.findByAuthProviderId(
          // Auth.js user.id is the provider account id
          session.user?.email
            ? (await userRepo.findByEmail(session.user.email))?.id ?? ""
            : "",
        );

        if (domainUser) {
          (session as any).userId = domainUser.id;

          // Find active org (first org for now)
          const orgsResult = await listUserOrganizations(domainUser.id);
          if (orgsResult.ok && orgsResult.value.length > 0) {
            (session as any).activeOrganizationId = orgsResult.value[0].id;
          }
        }

        return session;
      },
    },
    trustHost: true,
  };
});
```

> **Note:** The Auth.js callback wiring above is a starting point. The exact shape of the callbacks depends on the Auth.js adapter being used and may need adjustment during implementation. The key contract is: (1) signIn callback calls `signInOrRegister` use case, (2) session callback enriches with `userId` and `activeOrganizationId`.

**Step 3: Create hooks.server.ts**

Create `apps/web/src/hooks.server.ts`:

```typescript
import { handle as authHandle } from "./auth";
import { redirect, type Handle } from "@sveltejs/kit";
import { sequence } from "@sveltejs/kit/hooks";

const protectRoutes: Handle = async ({ event, resolve }) => {
  // Public routes — no auth required
  if (
    event.url.pathname.startsWith("/auth") ||
    event.url.pathname === "/" ||
    event.url.pathname.startsWith("/api/auth")
  ) {
    return resolve(event);
  }

  const session = await event.locals.auth();
  if (!session?.user) {
    throw redirect(303, "/auth/signin");
  }

  return resolve(event);
};

export const handle = sequence(authHandle, protectRoutes);
```

**Step 4: Update api-utils.ts — replace DEFAULT_ORG_ID with requireAuth**

Replace `apps/web/src/lib/server/api-utils.ts` with:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import type { Result, UserId, OrganizationId } from "@ipms/shared";
import { ok, err } from "@ipms/shared";

export function resultToResponse<T>(result: Result<T>, status = 200) {
  if (result.ok) {
    return json(result.value, { status });
  }
  return json({ error: result.error }, { status: 400 });
}

export interface AuthContext {
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
}

export async function requireAuth(event: RequestEvent): Promise<Result<AuthContext>> {
  const session = await event.locals.auth();
  if (!session?.user) {
    return err("Not authenticated");
  }

  const userId = (session as any).userId as UserId | undefined;
  const organizationId = (session as any).activeOrganizationId as OrganizationId | undefined;

  if (!userId) return err("Not authenticated");
  if (!organizationId) return err("No organization selected");

  return ok({ userId, organizationId });
}

export function unauthorizedResponse(error: string) {
  return json({ error }, { status: 401 });
}
```

**Step 5: Update repositories.ts — add new repos**

In `apps/web/src/lib/server/repositories.ts`, add the new repository imports and initializations following the existing pattern. Add `userRepo`, `orgRepo`, `memberRepo` in both the PostgreSQL and in-memory branches. Export them.

**Step 6: Update use-cases.ts — wire auth use cases**

In `apps/web/src/lib/server/use-cases.ts`, add:

```typescript
import {
  signInOrRegisterUseCase,
  createOrganizationUseCase,
  listUserOrganizationsUseCase,
} from "@ipms/application";
import { userRepo, orgRepo, memberRepo } from "./repositories.js";

export const signInOrRegister = signInOrRegisterUseCase(userRepo);
export const createOrg = createOrganizationUseCase(orgRepo, memberRepo);
export const listUserOrganizations = listUserOrganizationsUseCase(orgRepo, memberRepo);
```

**Step 7: Run typecheck**

Run: `pnpm typecheck`
Expected: May have type issues with Auth.js session types — fix as needed

**Step 8: Commit**

```bash
git add apps/web/
git commit -m "feat(web): configure Auth.js with Google and Microsoft providers"
```

---

### Task 8: Migrate all API routes to use requireAuth

**Files:**
- Modify: `apps/web/src/routes/api/assets/+server.ts`
- Modify: `apps/web/src/routes/api/assets/[id]/+server.ts`
- Modify: `apps/web/src/routes/api/assets/[id]/deadlines/+server.ts`
- Modify: `apps/web/src/routes/api/assets/[id]/timeline/+server.ts`
- Modify: `apps/web/src/routes/api/assets/bulk/status/+server.ts`
- Modify: `apps/web/src/routes/api/assets/bulk/portfolio/+server.ts`
- Modify: `apps/web/src/routes/api/documents/+server.ts`
- Modify: `apps/web/src/routes/api/documents/[id]/+server.ts`
- Modify: `apps/web/src/routes/api/portfolios/+server.ts`
- Modify: `apps/web/src/routes/api/portfolios/[id]/+server.ts`
- Modify: `apps/web/src/routes/api/analytics/portfolio/+server.ts`
- Modify: `apps/web/src/routes/api/analytics/deadlines/+server.ts`
- Modify: `apps/web/src/routes/api/export/assets.csv/+server.ts`

**Step 1: Migrate assets routes**

In every API route file, apply this pattern:

Replace:
```typescript
import { resultToResponse, DEFAULT_ORG_ID } from "$lib/server/api-utils";
```

With:
```typescript
import { resultToResponse, requireAuth, unauthorizedResponse } from "$lib/server/api-utils";
```

Replace every handler that uses `DEFAULT_ORG_ID`:

Before:
```typescript
export const GET: RequestHandler = async () => {
  const result = await listAssets(DEFAULT_ORG_ID);
  return resultToResponse(result);
};
```

After:
```typescript
export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const result = await listAssets(auth.value.organizationId);
  return resultToResponse(result);
};
```

Apply this to **all 13 route files**. Each handler in each file gets the same treatment:
1. Add `event` parameter
2. Call `requireAuth(event)` at top
3. Return 401 if not authenticated
4. Replace `DEFAULT_ORG_ID` with `auth.value.organizationId`

For routes that use `changedBy` (like asset status update), replace hardcoded values with `auth.value.userId`.

**Step 2: Remove DEFAULT_ORG_ID export from api-utils.ts**

It should already be removed from Task 7 Step 4. Verify no imports remain.

**Step 3: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS — no remaining references to `DEFAULT_ORG_ID`

**Step 4: Verify no references to DEFAULT_ORG_ID remain**

Run: `grep -r "DEFAULT_ORG_ID" apps/web/src/`
Expected: No results

**Step 5: Commit**

```bash
git add apps/web/
git commit -m "feat(web): migrate all API routes from DEFAULT_ORG_ID to requireAuth"
```

---

### Task 9: Add auth API routes and sign-in page

**Files:**
- Create: `apps/web/src/routes/auth/signin/+page.svelte`
- Create: `apps/web/src/routes/auth/signin/+page.server.ts`
- Create: `apps/web/src/routes/app/onboarding/+page.svelte`
- Create: `apps/web/src/routes/app/onboarding/+page.server.ts`
- Create: `apps/web/src/routes/api/organizations/+server.ts`

**Step 1: Create sign-in page**

Create `apps/web/src/routes/auth/signin/+page.server.ts`:

```typescript
import { signIn } from "../../../auth";
import type { Actions } from "./$types";

export const actions: Actions = {
  google: async (event) => {
    await signIn("google", { redirectTo: "/app" }, event);
  },
  microsoft: async (event) => {
    await signIn("microsoft-entra-id", { redirectTo: "/app" }, event);
  },
};
```

Create `apps/web/src/routes/auth/signin/+page.svelte`:

```svelte
<script>
  import { enhance } from "$app/forms";
</script>

<div class="signin-container">
  <h1>Sign in to IPMS</h1>
  <p>Intellectual Property Management System</p>

  <div class="providers">
    <form method="POST" action="?/google" use:enhance>
      <button type="submit">Sign in with Google</button>
    </form>

    <form method="POST" action="?/microsoft" use:enhance>
      <button type="submit">Sign in with Microsoft</button>
    </form>
  </div>
</div>
```

**Step 2: Create onboarding page (create org)**

Create `apps/web/src/routes/app/onboarding/+page.server.ts`:

```typescript
import { redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { createOrg, listUserOrganizations } from "$lib/server/use-cases";
import type { UserId } from "@ipms/shared";

export const load: PageServerLoad = async (event) => {
  const session = await event.locals.auth();
  const userId = (session as any)?.userId as UserId | undefined;
  if (!userId) throw redirect(303, "/auth/signin");

  // If user already has orgs, skip onboarding
  const orgsResult = await listUserOrganizations(userId);
  if (orgsResult.ok && orgsResult.value.length > 0) {
    throw redirect(303, "/app");
  }
};

export const actions: Actions = {
  default: async (event) => {
    const session = await event.locals.auth();
    const userId = (session as any)?.userId as UserId | undefined;
    if (!userId) throw redirect(303, "/auth/signin");

    const formData = await event.request.formData();
    const name = formData.get("name") as string;

    const result = await createOrg({ name, ownerId: userId });
    if (!result.ok) {
      return { error: result.error };
    }

    throw redirect(303, "/app");
  },
};
```

Create `apps/web/src/routes/app/onboarding/+page.svelte`:

```svelte
<script>
  import { enhance } from "$app/forms";

  let { form } = $props();
</script>

<div class="onboarding-container">
  <h1>Create your organization</h1>
  <p>Set up your organization to start managing intellectual property.</p>

  <form method="POST" use:enhance>
    <label for="name">Organization name</label>
    <input id="name" name="name" type="text" required placeholder="e.g. Acme Corp" />

    {#if form?.error}
      <p class="error">{form.error}</p>
    {/if}

    <button type="submit">Create organization</button>
  </form>
</div>
```

**Step 3: Create organizations API route**

Create `apps/web/src/routes/api/organizations/+server.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createOrg, listUserOrganizations } from "$lib/server/use-cases";
import { requireAuth, unauthorizedResponse, resultToResponse } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const result = await listUserOrganizations(auth.value.userId);
  return resultToResponse(result);
};

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const body = await event.request.json();
  const result = await createOrg({
    name: body.name,
    ownerId: auth.value.userId,
  });

  return resultToResponse(result, 201);
};
```

**Step 4: Commit**

```bash
git add apps/web/src/routes/
git commit -m "feat(web): add sign-in page, onboarding flow, and organizations API"
```

---

### Task 10: Run full test suite and final verification

**Step 1: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Verify no DEFAULT_ORG_ID references remain**

Run: `grep -r "DEFAULT_ORG_ID" packages/ apps/`
Expected: No results

**Step 4: Update roadmap**

In `docs/roadmap.md`, under Phase 3, mark completed items:

```markdown
- [x] Authentication (OAuth 2.0 / OIDC)
- [x] User management and profiles
- [x] Organization/tenant management
```

**Step 5: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: mark Phase 3a items complete in roadmap"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Branded types UserId, MembershipId | `packages/shared/` |
| 2 | Domain entities + creation functions | `packages/domain/` |
| 3 | Repository port interfaces | `packages/application/src/ports.ts` |
| 4 | Auth use cases (signIn, createOrg, listOrgs) | `packages/application/src/use-cases/auth.ts` |
| 5 | In-memory repository implementations | `packages/infrastructure/src/` |
| 6 | PostgreSQL schema + repository implementations | `packages/infrastructure/src/postgres/` |
| 7 | Auth.js config + hooks + api-utils refactor | `apps/web/src/` |
| 8 | Migrate all 13 API routes to requireAuth | `apps/web/src/routes/api/` |
| 9 | Sign-in page + onboarding + organizations API | `apps/web/src/routes/` |
| 10 | Full test suite + final verification | all |
