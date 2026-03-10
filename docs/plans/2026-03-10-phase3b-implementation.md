# Phase 3b: RBAC, Audit Logging, Notifications & Invitations — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add role-based access control (4 hierarchical roles), action-level audit logging, in-app notifications (deadlines + documents), and a member invitation system.

**Architecture:** Extends existing FC&IS patterns. RBAC is a pure domain function `hasPermission(role, action)` checked in API routes. Audit events and notifications are new entities with full port/repo/use-case stacks. Invitations integrate into the Auth.js signIn callback. `MemberRole` changes from `"owner" | "member"` to `"admin" | "manager" | "attorney" | "viewer"`.

**Tech Stack:** Same as Phase 3a — TypeScript, Drizzle ORM, PostgreSQL, SvelteKit, Vitest

**Design doc:** `docs/plans/2026-03-10-phase3b-rbac-audit-notifications-design.md`

---

### Task 1: Add new branded types

**Files:**
- Modify: `packages/shared/src/brand.ts`
- Modify: `packages/shared/src/validation.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/validation.test.ts`

**Step 1: Write failing tests**

Add to `packages/shared/src/validation.test.ts`:

```typescript
import { parseAuditEventId, parseNotificationId, parseInvitationId } from "./validation.js";

describe("parseAuditEventId", () => {
  it("accepts valid UUID", () => {
    const result = parseAuditEventId("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toEqual({ ok: true, value: "550e8400-e29b-41d4-a716-446655440000" });
  });
  it("rejects invalid UUID", () => {
    const result = parseAuditEventId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid AuditEventId: must be UUID format" });
  });
});

describe("parseNotificationId", () => {
  it("accepts valid UUID", () => {
    const result = parseNotificationId("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toEqual({ ok: true, value: "550e8400-e29b-41d4-a716-446655440000" });
  });
  it("rejects invalid UUID", () => {
    const result = parseNotificationId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid NotificationId: must be UUID format" });
  });
});

describe("parseInvitationId", () => {
  it("accepts valid UUID", () => {
    const result = parseInvitationId("550e8400-e29b-41d4-a716-446655440000");
    expect(result).toEqual({ ok: true, value: "550e8400-e29b-41d4-a716-446655440000" });
  });
  it("rejects invalid UUID", () => {
    const result = parseInvitationId("not-a-uuid");
    expect(result).toEqual({ ok: false, error: "Invalid InvitationId: must be UUID format" });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `pnpm test -- packages/shared/src/validation.test.ts`

**Step 3: Implement**

In `packages/shared/src/brand.ts`, add after `MembershipId`:

```typescript
export type AuditEventId = Brand<string, "AuditEventId">;
export type NotificationId = Brand<string, "NotificationId">;
export type InvitationId = Brand<string, "InvitationId">;
```

In `packages/shared/src/validation.ts`, add imports for the new types and add:

```typescript
export function parseAuditEventId(input: string): Result<AuditEventId> {
  return UUID_RE.test(input)
    ? ok(input as AuditEventId)
    : err("Invalid AuditEventId: must be UUID format");
}

export function parseNotificationId(input: string): Result<NotificationId> {
  return UUID_RE.test(input)
    ? ok(input as NotificationId)
    : err("Invalid NotificationId: must be UUID format");
}

export function parseInvitationId(input: string): Result<InvitationId> {
  return UUID_RE.test(input)
    ? ok(input as InvitationId)
    : err("Invalid InvitationId: must be UUID format");
}
```

In `packages/shared/src/index.ts`, add the new types to the brand export and the new parsers to the validation export.

**Step 4: Run tests**

Run: `pnpm test -- packages/shared/src/validation.test.ts`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add packages/shared/
git commit -m "feat(shared): add AuditEventId, NotificationId, InvitationId branded types"
```

---

### Task 2: Update MemberRole and add RBAC domain functions

**Files:**
- Modify: `packages/domain/src/entities.ts`
- Create: `packages/domain/src/rbac.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/rbac.test.ts`

**Step 1: Update MemberRole in entities.ts**

Change line 78 in `packages/domain/src/entities.ts`:

```typescript
// Before
export type MemberRole = "owner" | "member";

// After
export const MEMBER_ROLES = ["viewer", "attorney", "manager", "admin"] as const;
export type MemberRole = (typeof MEMBER_ROLES)[number];
```

**Step 2: Write failing tests for RBAC**

Create `packages/domain/src/rbac.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hasPermission, ROLE_HIERARCHY, type PermissionAction } from "./rbac.js";

describe("ROLE_HIERARCHY", () => {
  it("ranks viewer lowest", () => {
    expect(ROLE_HIERARCHY.viewer).toBeLessThan(ROLE_HIERARCHY.attorney);
  });
  it("ranks admin highest", () => {
    expect(ROLE_HIERARCHY.admin).toBeGreaterThan(ROLE_HIERARCHY.manager);
  });
});

describe("hasPermission", () => {
  // Viewer: read only
  it("viewer can view assets", () => {
    expect(hasPermission("viewer", "asset:read")).toBe(true);
  });
  it("viewer cannot create assets", () => {
    expect(hasPermission("viewer", "asset:create")).toBe(false);
  });
  it("viewer cannot manage org", () => {
    expect(hasPermission("viewer", "org:manage")).toBe(false);
  });

  // Attorney: viewer + create/modify
  it("attorney can create assets", () => {
    expect(hasPermission("attorney", "asset:create")).toBe(true);
  });
  it("attorney can modify documents", () => {
    expect(hasPermission("attorney", "document:create")).toBe(true);
  });
  it("attorney cannot create portfolios", () => {
    expect(hasPermission("attorney", "portfolio:create")).toBe(false);
  });

  // Manager: attorney + portfolios, bulk, export, audit
  it("manager can create portfolios", () => {
    expect(hasPermission("manager", "portfolio:create")).toBe(true);
  });
  it("manager can bulk operate", () => {
    expect(hasPermission("manager", "bulk:operate")).toBe(true);
  });
  it("manager can export", () => {
    expect(hasPermission("manager", "export:csv")).toBe(true);
  });
  it("manager can view audit log", () => {
    expect(hasPermission("manager", "audit:read")).toBe(true);
  });
  it("manager cannot invite members", () => {
    expect(hasPermission("manager", "member:invite")).toBe(false);
  });

  // Admin: all
  it("admin can invite members", () => {
    expect(hasPermission("admin", "member:invite")).toBe(true);
  });
  it("admin can change roles", () => {
    expect(hasPermission("admin", "member:change-role")).toBe(true);
  });
  it("admin can manage org", () => {
    expect(hasPermission("admin", "org:manage")).toBe(true);
  });
});
```

**Step 3: Run tests to verify they fail**

Run: `pnpm test -- packages/domain/src/rbac.test.ts`

**Step 4: Implement RBAC**

Create `packages/domain/src/rbac.ts`:

```typescript
import type { MemberRole } from "./entities.js";

export const ROLE_HIERARCHY: Record<MemberRole, number> = {
  viewer: 0,
  attorney: 1,
  manager: 2,
  admin: 3,
};

export const PERMISSION_ACTIONS = [
  "asset:read",
  "asset:create",
  "asset:update-status",
  "asset:delete",
  "deadline:read",
  "deadline:create",
  "deadline:complete",
  "document:read",
  "document:create",
  "document:update-status",
  "document:delete",
  "portfolio:read",
  "portfolio:create",
  "portfolio:modify",
  "portfolio:delete",
  "bulk:operate",
  "export:csv",
  "audit:read",
  "member:invite",
  "member:change-role",
  "member:remove",
  "org:manage",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

const MIN_ROLE_FOR_ACTION: Record<PermissionAction, MemberRole> = {
  // Viewer level
  "asset:read": "viewer",
  "deadline:read": "viewer",
  "document:read": "viewer",
  "portfolio:read": "viewer",
  // Attorney level
  "asset:create": "attorney",
  "asset:update-status": "attorney",
  "asset:delete": "attorney",
  "deadline:create": "attorney",
  "deadline:complete": "attorney",
  "document:create": "attorney",
  "document:update-status": "attorney",
  "document:delete": "attorney",
  // Manager level
  "portfolio:create": "manager",
  "portfolio:modify": "manager",
  "portfolio:delete": "manager",
  "bulk:operate": "manager",
  "export:csv": "manager",
  "audit:read": "manager",
  // Admin level
  "member:invite": "admin",
  "member:change-role": "admin",
  "member:remove": "admin",
  "org:manage": "admin",
};

export function hasPermission(role: MemberRole, action: PermissionAction): boolean {
  const requiredLevel = ROLE_HIERARCHY[MIN_ROLE_FOR_ACTION[action]];
  const userLevel = ROLE_HIERARCHY[role];
  return userLevel >= requiredLevel;
}
```

**Step 5: Update domain index**

In `packages/domain/src/index.ts`, add:

```typescript
export { hasPermission, ROLE_HIERARCHY, PERMISSION_ACTIONS } from "./rbac.js";
export type { PermissionAction } from "./rbac.js";
export { MEMBER_ROLES } from "./entities.js";
```

**Step 6: Run tests**

Run: `pnpm test -- packages/domain/src/rbac.test.ts`
Expected: ALL PASS

**Step 7: Run all tests** (check MemberRole change doesn't break existing tests)

Run: `pnpm test`
Expected: ALL PASS. Note: the `createMembership` tests use `"owner"` role which is no longer valid. They must be updated to use `"admin"`. Similarly, auth-use-cases.test.ts creates memberships with `"owner"`. Update these tests to use `"admin"`.

If tests fail due to `"owner"` role, update:
- `packages/domain/src/membership.test.ts`: change `"owner"` to `"admin"`
- `packages/infrastructure/src/auth-use-cases.test.ts`: check for `"admin"` instead of `"owner"`
- `packages/application/src/use-cases/auth.ts`: change `role: "owner"` to `role: "admin"` in `createOrganizationUseCase`

**Step 8: Commit**

```bash
git add packages/domain/ packages/application/ packages/infrastructure/
git commit -m "feat(domain): add RBAC with hierarchical roles and permission matrix"
```

---

### Task 3: Add AuditEvent, Notification, Invitation entities

**Files:**
- Modify: `packages/domain/src/entities.ts`
- Create: `packages/domain/src/audit-event.ts`
- Create: `packages/domain/src/notification.ts`
- Create: `packages/domain/src/invitation.ts`
- Modify: `packages/domain/src/index.ts`
- Test: `packages/domain/src/audit-event.test.ts`
- Test: `packages/domain/src/notification.test.ts`
- Test: `packages/domain/src/invitation.test.ts`

**Step 1: Add entity interfaces to entities.ts**

Add imports for `AuditEventId, NotificationId, InvitationId` from `@ipms/shared`, then add:

```typescript
export const AUDIT_ACTIONS = [
  "asset:create", "asset:update-status", "asset:delete",
  "deadline:create", "deadline:complete",
  "document:create", "document:update-status", "document:delete",
  "portfolio:create", "portfolio:add-asset", "portfolio:remove-asset", "portfolio:delete",
  "membership:invite", "membership:change-role", "membership:remove",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const ENTITY_TYPES = ["asset", "deadline", "document", "portfolio", "membership"] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface AuditEvent {
  readonly id: AuditEventId;
  readonly organizationId: OrganizationId;
  readonly actorId: UserId;
  readonly action: AuditAction;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly metadata: Record<string, string> | null;
  readonly timestamp: Date;
}

export const NOTIFICATION_TYPES = [
  "deadline:upcoming", "deadline:overdue",
  "document:review", "document:approved", "document:rejected",
] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export interface Notification {
  readonly id: NotificationId;
  readonly organizationId: OrganizationId;
  readonly recipientId: UserId;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly read: boolean;
  readonly createdAt: Date;
}

export const INVITATION_STATUSES = ["pending", "accepted", "expired"] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export interface Invitation {
  readonly id: InvitationId;
  readonly organizationId: OrganizationId;
  readonly invitedByUserId: UserId;
  readonly email: string;
  readonly role: MemberRole;
  readonly status: InvitationStatus;
  readonly createdAt: Date;
  readonly expiresAt: Date;
}
```

**Step 2: Create domain functions with tests (TDD)**

Create `packages/domain/src/audit-event.ts`:

```typescript
import type { AuditEventId, OrganizationId, UserId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { AuditEvent, AuditAction, EntityType } from "./entities.js";

export interface CreateAuditEventInput {
  readonly id: AuditEventId;
  readonly organizationId: OrganizationId;
  readonly actorId: UserId;
  readonly action: AuditAction;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly metadata: Record<string, string> | null;
}

export function createAuditEvent(input: CreateAuditEventInput): Result<AuditEvent> {
  return ok({
    ...input,
    timestamp: new Date(),
  });
}
```

Create `packages/domain/src/audit-event.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createAuditEvent } from "./audit-event.js";
import type { AuditEventId, OrganizationId, UserId } from "@ipms/shared";

describe("createAuditEvent", () => {
  it("creates an audit event", () => {
    const result = createAuditEvent({
      id: "550e8400-e29b-41d4-a716-446655440000" as AuditEventId,
      organizationId: "660e8400-e29b-41d4-a716-446655440000" as OrganizationId,
      actorId: "770e8400-e29b-41d4-a716-446655440000" as UserId,
      action: "asset:create",
      entityType: "asset",
      entityId: "880e8400-e29b-41d4-a716-446655440000",
      metadata: { title: "New Patent" },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.action).toBe("asset:create");
      expect(result.value.entityType).toBe("asset");
      expect(result.value.metadata).toEqual({ title: "New Patent" });
    }
  });
});
```

Create `packages/domain/src/notification.ts`:

```typescript
import type { NotificationId, OrganizationId, UserId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Notification, NotificationType, EntityType } from "./entities.js";

export interface CreateNotificationInput {
  readonly id: NotificationId;
  readonly organizationId: OrganizationId;
  readonly recipientId: UserId;
  readonly type: NotificationType;
  readonly title: string;
  readonly message: string;
  readonly entityType: EntityType;
  readonly entityId: string;
}

export function createNotification(input: CreateNotificationInput): Result<Notification> {
  if (!input.title.trim()) return err("Notification title cannot be empty");
  if (!input.message.trim()) return err("Notification message cannot be empty");

  return ok({
    ...input,
    title: input.title.trim(),
    message: input.message.trim(),
    read: false,
    createdAt: new Date(),
  });
}

export function markNotificationRead(notification: Notification): Notification {
  return { ...notification, read: true };
}
```

Create `packages/domain/src/notification.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createNotification, markNotificationRead } from "./notification.js";
import type { NotificationId, OrganizationId, UserId } from "@ipms/shared";

const INPUT = {
  id: "550e8400-e29b-41d4-a716-446655440000" as NotificationId,
  organizationId: "660e8400-e29b-41d4-a716-446655440000" as OrganizationId,
  recipientId: "770e8400-e29b-41d4-a716-446655440000" as UserId,
  type: "deadline:upcoming" as const,
  title: "Deadline approaching",
  message: "Patent renewal due in 7 days",
  entityType: "deadline" as const,
  entityId: "880e8400-e29b-41d4-a716-446655440000",
};

describe("createNotification", () => {
  it("creates a notification", () => {
    const result = createNotification(INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.read).toBe(false);
      expect(result.value.type).toBe("deadline:upcoming");
    }
  });
  it("rejects empty title", () => {
    expect(createNotification({ ...INPUT, title: "  " })).toEqual({ ok: false, error: "Notification title cannot be empty" });
  });
  it("rejects empty message", () => {
    expect(createNotification({ ...INPUT, message: "" })).toEqual({ ok: false, error: "Notification message cannot be empty" });
  });
});

describe("markNotificationRead", () => {
  it("marks as read", () => {
    const result = createNotification(INPUT);
    if (result.ok) {
      const read = markNotificationRead(result.value);
      expect(read.read).toBe(true);
    }
  });
});
```

Create `packages/domain/src/invitation.ts`:

```typescript
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

const INVITATION_EXPIRY_DAYS = 7;

export function createInvitation(input: CreateInvitationInput): Result<Invitation> {
  if (!input.email.trim()) return err("Invitation email cannot be empty");

  const now = new Date();
  const expiresAt = new Date(now.getTime() + INVITATION_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  return ok({
    id: input.id,
    organizationId: input.organizationId,
    invitedByUserId: input.invitedByUserId,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    status: "pending",
    createdAt: now,
    expiresAt,
  });
}

export function acceptInvitation(invitation: Invitation): Result<Invitation> {
  if (invitation.status !== "pending") return err("Invitation is not pending");
  if (invitation.expiresAt < new Date()) return err("Invitation has expired");
  return ok({ ...invitation, status: "accepted" });
}
```

Create `packages/domain/src/invitation.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createInvitation, acceptInvitation } from "./invitation.js";
import type { InvitationId, OrganizationId, UserId } from "@ipms/shared";

const INPUT = {
  id: "550e8400-e29b-41d4-a716-446655440000" as InvitationId,
  organizationId: "660e8400-e29b-41d4-a716-446655440000" as OrganizationId,
  invitedByUserId: "770e8400-e29b-41d4-a716-446655440000" as UserId,
  email: "bob@example.com",
  role: "attorney" as const,
};

describe("createInvitation", () => {
  it("creates an invitation with 7 day expiry", () => {
    const result = createInvitation(INPUT);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("pending");
      expect(result.value.email).toBe("bob@example.com");
      const daysDiff = (result.value.expiresAt.getTime() - result.value.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      expect(daysDiff).toBeCloseTo(7, 0);
    }
  });
  it("rejects empty email", () => {
    expect(createInvitation({ ...INPUT, email: "  " })).toEqual({ ok: false, error: "Invitation email cannot be empty" });
  });
});

describe("acceptInvitation", () => {
  it("accepts a pending invitation", () => {
    const created = createInvitation(INPUT);
    if (created.ok) {
      const accepted = acceptInvitation(created.value);
      expect(accepted.ok).toBe(true);
      if (accepted.ok) expect(accepted.value.status).toBe("accepted");
    }
  });
  it("rejects already accepted invitation", () => {
    const created = createInvitation(INPUT);
    if (created.ok) {
      const accepted = acceptInvitation(created.value);
      if (accepted.ok) {
        expect(acceptInvitation(accepted.value)).toEqual({ ok: false, error: "Invitation is not pending" });
      }
    }
  });
});
```

**Step 3: Update domain index**

Add to `packages/domain/src/index.ts`:

```typescript
export type { AuditEvent, AuditAction, EntityType, Notification, NotificationType, Invitation, InvitationStatus } from "./entities.js";
export { AUDIT_ACTIONS, ENTITY_TYPES, NOTIFICATION_TYPES, INVITATION_STATUSES } from "./entities.js";

export { createAuditEvent } from "./audit-event.js";
export type { CreateAuditEventInput } from "./audit-event.js";

export { createNotification, markNotificationRead } from "./notification.js";
export type { CreateNotificationInput } from "./notification.js";

export { createInvitation, acceptInvitation } from "./invitation.js";
export type { CreateInvitationInput } from "./invitation.js";
```

**Step 4: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add packages/domain/
git commit -m "feat(domain): add AuditEvent, Notification, and Invitation entities"
```

---

### Task 4: Add repository ports for new entities

**Files:**
- Modify: `packages/application/src/ports.ts`
- Modify: `packages/application/src/index.ts`

**Step 1: Add port interfaces**

In `packages/application/src/ports.ts`, add imports for `AuditEventId, NotificationId, InvitationId` from `@ipms/shared` and `AuditEvent, Notification, Invitation` from `@ipms/domain`. Then add:

```typescript
export interface AuditEventRepository {
  findByOrganizationId(orgId: OrganizationId, options?: { entityType?: string; actorId?: UserId; limit?: number }): Promise<readonly AuditEvent[]>;
  save(event: AuditEvent): Promise<void>;
}

export interface NotificationRepository {
  findByRecipientId(recipientId: UserId, orgId: OrganizationId): Promise<readonly Notification[]>;
  findById(id: NotificationId, recipientId: UserId): Promise<Notification | null>;
  save(notification: Notification): Promise<void>;
  markAllRead(recipientId: UserId, orgId: OrganizationId): Promise<void>;
}

export interface InvitationRepository {
  findById(id: InvitationId, orgId: OrganizationId): Promise<Invitation | null>;
  findByEmail(email: string): Promise<readonly Invitation[]>;
  findByOrganizationId(orgId: OrganizationId): Promise<readonly Invitation[]>;
  save(invitation: Invitation): Promise<void>;
  delete(id: InvitationId, orgId: OrganizationId): Promise<boolean>;
}
```

**Step 2: Export from index**

Add to `packages/application/src/index.ts`:

```typescript
export type { AuditEventRepository, NotificationRepository, InvitationRepository } from "./ports.js";
```

**Step 3: Verify**

Run: `pnpm typecheck`

**Step 4: Commit**

```bash
git add packages/application/
git commit -m "feat(application): add AuditEvent, Notification, Invitation repository ports"
```

---

### Task 5: Add in-memory repositories for new entities

**Files:**
- Create: `packages/infrastructure/src/in-memory-audit-event-repository.ts`
- Create: `packages/infrastructure/src/in-memory-notification-repository.ts`
- Create: `packages/infrastructure/src/in-memory-invitation-repository.ts`
- Modify: `packages/infrastructure/src/index.ts`

**Step 1: Implement in-memory AuditEventRepository**

Create `packages/infrastructure/src/in-memory-audit-event-repository.ts`:

```typescript
import type { UserId, OrganizationId } from "@ipms/shared";
import type { AuditEvent } from "@ipms/domain";
import type { AuditEventRepository } from "@ipms/application";

export function createInMemoryAuditEventRepository(): AuditEventRepository {
  const store: AuditEvent[] = [];

  return {
    async findByOrganizationId(orgId, options) {
      let events = store.filter((e) => e.organizationId === orgId);
      if (options?.entityType) events = events.filter((e) => e.entityType === options.entityType);
      if (options?.actorId) events = events.filter((e) => e.actorId === options.actorId);
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      if (options?.limit) events = events.slice(0, options.limit);
      return events;
    },
    async save(event) { store.push(event); },
  };
}
```

**Step 2: Implement in-memory NotificationRepository**

Create `packages/infrastructure/src/in-memory-notification-repository.ts`:

```typescript
import type { NotificationId, UserId, OrganizationId } from "@ipms/shared";
import type { Notification } from "@ipms/domain";
import type { NotificationRepository } from "@ipms/application";

export function createInMemoryNotificationRepository(): NotificationRepository {
  const store = new Map<string, Notification>();

  return {
    async findByRecipientId(recipientId, orgId) {
      return [...store.values()]
        .filter((n) => n.recipientId === recipientId && n.organizationId === orgId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    },
    async findById(id, recipientId) {
      const n = store.get(id);
      return n && n.recipientId === recipientId ? n : null;
    },
    async save(notification) { store.set(notification.id, notification); },
    async markAllRead(recipientId, orgId) {
      for (const [key, n] of store) {
        if (n.recipientId === recipientId && n.organizationId === orgId && !n.read) {
          store.set(key, { ...n, read: true });
        }
      }
    },
  };
}
```

**Step 3: Implement in-memory InvitationRepository**

Create `packages/infrastructure/src/in-memory-invitation-repository.ts`:

```typescript
import type { InvitationId, OrganizationId } from "@ipms/shared";
import type { Invitation } from "@ipms/domain";
import type { InvitationRepository } from "@ipms/application";

export function createInMemoryInvitationRepository(): InvitationRepository {
  const store = new Map<string, Invitation>();

  return {
    async findById(id, orgId) {
      const inv = store.get(id);
      return inv && inv.organizationId === orgId ? inv : null;
    },
    async findByEmail(email) {
      return [...store.values()].filter((i) => i.email === email && i.status === "pending");
    },
    async findByOrganizationId(orgId) {
      return [...store.values()].filter((i) => i.organizationId === orgId);
    },
    async save(invitation) { store.set(invitation.id, invitation); },
    async delete(id, orgId) {
      const inv = store.get(id);
      if (inv && inv.organizationId === orgId) { store.delete(id); return true; }
      return false;
    },
  };
}
```

**Step 4: Export from index**

In `packages/infrastructure/src/index.ts`, add:

```typescript
export { createInMemoryAuditEventRepository } from "./in-memory-audit-event-repository.js";
export { createInMemoryNotificationRepository } from "./in-memory-notification-repository.js";
export { createInMemoryInvitationRepository } from "./in-memory-invitation-repository.js";
```

**Step 5: Commit**

```bash
git add packages/infrastructure/src/in-memory-*.ts packages/infrastructure/src/index.ts
git commit -m "feat(infrastructure): add in-memory AuditEvent, Notification, Invitation repositories"
```

---

### Task 6: Add use cases for audit, notifications, and invitations

**Files:**
- Create: `packages/application/src/use-cases/audit.ts`
- Create: `packages/application/src/use-cases/notification.ts`
- Create: `packages/application/src/use-cases/invitation.ts`
- Modify: `packages/application/src/index.ts`
- Test: `packages/infrastructure/src/audit-use-cases.test.ts`
- Test: `packages/infrastructure/src/notification-use-cases.test.ts`
- Test: `packages/infrastructure/src/invitation-use-cases.test.ts`

**Step 1: Create audit use cases**

Create `packages/application/src/use-cases/audit.ts`:

```typescript
import type { AuditEventId, OrganizationId, UserId, Result } from "@ipms/shared";
import { ok } from "@ipms/shared";
import type { AuditEvent, AuditAction, EntityType } from "@ipms/domain";
import { createAuditEvent } from "@ipms/domain";
import type { AuditEventRepository } from "../ports.js";

export interface LogAuditInput {
  readonly organizationId: OrganizationId;
  readonly actorId: UserId;
  readonly action: AuditAction;
  readonly entityType: EntityType;
  readonly entityId: string;
  readonly metadata?: Record<string, string> | null;
}

export function logAuditEventUseCase(repo: AuditEventRepository) {
  return async (input: LogAuditInput): Promise<Result<AuditEvent>> => {
    const result = createAuditEvent({
      id: crypto.randomUUID() as AuditEventId,
      organizationId: input.organizationId,
      actorId: input.actorId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? null,
    });
    if (!result.ok) return result;
    await repo.save(result.value);
    return result;
  };
}

export function listAuditEventsUseCase(repo: AuditEventRepository) {
  return async (
    orgId: OrganizationId,
    options?: { entityType?: string; actorId?: UserId; limit?: number },
  ): Promise<Result<readonly AuditEvent[]>> => {
    const events = await repo.findByOrganizationId(orgId, options);
    return ok(events);
  };
}
```

**Step 2: Create notification use cases**

Create `packages/application/src/use-cases/notification.ts`:

```typescript
import type { NotificationId, OrganizationId, UserId, Result } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { Notification } from "@ipms/domain";
import { createNotification, markNotificationRead } from "@ipms/domain";
import type { NotificationRepository, MembershipRepository, DeadlineRepository } from "../ports.js";

export function listNotificationsUseCase(repo: NotificationRepository) {
  return async (recipientId: UserId, orgId: OrganizationId): Promise<Result<readonly Notification[]>> => {
    const notifications = await repo.findByRecipientId(recipientId, orgId);
    return ok(notifications);
  };
}

export function markNotificationReadUseCase(repo: NotificationRepository) {
  return async (id: NotificationId, recipientId: UserId): Promise<Result<Notification>> => {
    const notification = await repo.findById(id, recipientId);
    if (!notification) return err("Notification not found");
    const updated = markNotificationRead(notification);
    await repo.save(updated);
    return ok(updated);
  };
}

export function markAllNotificationsReadUseCase(repo: NotificationRepository) {
  return async (recipientId: UserId, orgId: OrganizationId): Promise<Result<true>> => {
    await repo.markAllRead(recipientId, orgId);
    return ok(true);
  };
}

export function checkDeadlineNotificationsUseCase(
  deadlineRepo: DeadlineRepository,
  notificationRepo: NotificationRepository,
  memberRepo: MembershipRepository,
) {
  return async (orgId: OrganizationId): Promise<Result<number>> => {
    const deadlines = await deadlineRepo.findAll(orgId);
    const members = await memberRepo.findByOrganizationId(orgId);
    const now = new Date();
    const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    let count = 0;

    for (const deadline of deadlines) {
      if (deadline.completed) continue;

      const isOverdue = deadline.dueDate < now;
      const isUpcoming = !isOverdue && deadline.dueDate <= sevenDays;

      if (!isOverdue && !isUpcoming) continue;

      for (const member of members) {
        const type = isOverdue ? "deadline:overdue" as const : "deadline:upcoming" as const;
        const result = createNotification({
          id: crypto.randomUUID() as NotificationId,
          organizationId: orgId,
          recipientId: member.userId,
          type,
          title: isOverdue ? `Deadline overdue: ${deadline.title}` : `Deadline approaching: ${deadline.title}`,
          message: isOverdue
            ? `Deadline "${deadline.title}" was due on ${deadline.dueDate.toISOString().split("T")[0]}`
            : `Deadline "${deadline.title}" is due on ${deadline.dueDate.toISOString().split("T")[0]}`,
          entityType: "deadline",
          entityId: deadline.id,
        });
        if (result.ok) {
          await notificationRepo.save(result.value);
          count++;
        }
      }
    }

    return ok(count);
  };
}
```

**Step 3: Create invitation use cases**

Create `packages/application/src/use-cases/invitation.ts`:

```typescript
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
```

**Step 4: Export from application index**

Add to `packages/application/src/index.ts`:

```typescript
export { logAuditEventUseCase, listAuditEventsUseCase } from "./use-cases/audit.js";
export type { LogAuditInput } from "./use-cases/audit.js";

export {
  listNotificationsUseCase,
  markNotificationReadUseCase,
  markAllNotificationsReadUseCase,
  checkDeadlineNotificationsUseCase,
} from "./use-cases/notification.js";

export {
  createInvitationUseCase,
  listInvitationsUseCase,
  deleteInvitationUseCase,
  acceptPendingInvitationsUseCase,
} from "./use-cases/invitation.js";
```

**Step 5: Write tests**

Create `packages/infrastructure/src/audit-use-cases.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { logAuditEventUseCase, listAuditEventsUseCase } from "@ipms/application";
import { createInMemoryAuditEventRepository } from "./in-memory-audit-event-repository.js";
import type { OrganizationId, UserId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const USER_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;

describe("audit use cases", () => {
  let repo: ReturnType<typeof createInMemoryAuditEventRepository>;

  beforeEach(() => { repo = createInMemoryAuditEventRepository(); });

  it("logs and lists audit events", async () => {
    const log = logAuditEventUseCase(repo);
    await log({ organizationId: ORG_ID, actorId: USER_ID, action: "asset:create", entityType: "asset", entityId: "123" });
    await log({ organizationId: ORG_ID, actorId: USER_ID, action: "asset:delete", entityType: "asset", entityId: "456" });

    const list = listAuditEventsUseCase(repo);
    const result = await list(ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(2);
  });

  it("filters by entityType", async () => {
    const log = logAuditEventUseCase(repo);
    await log({ organizationId: ORG_ID, actorId: USER_ID, action: "asset:create", entityType: "asset", entityId: "1" });
    await log({ organizationId: ORG_ID, actorId: USER_ID, action: "document:create", entityType: "document", entityId: "2" });

    const list = listAuditEventsUseCase(repo);
    const result = await list(ORG_ID, { entityType: "document" });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });
});
```

Create `packages/infrastructure/src/notification-use-cases.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { listNotificationsUseCase, markNotificationReadUseCase, markAllNotificationsReadUseCase } from "@ipms/application";
import { createInMemoryNotificationRepository } from "./in-memory-notification-repository.js";
import { createNotification } from "@ipms/domain";
import type { NotificationId, OrganizationId, UserId } from "@ipms/shared";

const ORG_ID = "550e8400-e29b-41d4-a716-446655440000" as OrganizationId;
const USER_ID = "660e8400-e29b-41d4-a716-446655440000" as UserId;

function makeNotification(id: string) {
  return createNotification({
    id: id as NotificationId,
    organizationId: ORG_ID,
    recipientId: USER_ID,
    type: "deadline:upcoming",
    title: "Test",
    message: "Test message",
    entityType: "deadline",
    entityId: "aaa",
  });
}

describe("notification use cases", () => {
  let repo: ReturnType<typeof createInMemoryNotificationRepository>;

  beforeEach(() => { repo = createInMemoryNotificationRepository(); });

  it("lists notifications for user", async () => {
    const n = makeNotification("550e8400-e29b-41d4-a716-446655440001");
    if (n.ok) await repo.save(n.value);

    const list = listNotificationsUseCase(repo);
    const result = await list(USER_ID, ORG_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value).toHaveLength(1);
  });

  it("marks notification as read", async () => {
    const nId = "550e8400-e29b-41d4-a716-446655440001" as NotificationId;
    const n = makeNotification(nId);
    if (n.ok) await repo.save(n.value);

    const markRead = markNotificationReadUseCase(repo);
    const result = await markRead(nId, USER_ID);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.read).toBe(true);
  });

  it("marks all as read", async () => {
    const n1 = makeNotification("550e8400-e29b-41d4-a716-446655440001");
    const n2 = makeNotification("550e8400-e29b-41d4-a716-446655440002");
    if (n1.ok) await repo.save(n1.value);
    if (n2.ok) await repo.save(n2.value);

    const markAll = markAllNotificationsReadUseCase(repo);
    await markAll(USER_ID, ORG_ID);

    const list = listNotificationsUseCase(repo);
    const result = await list(USER_ID, ORG_ID);
    if (result.ok) {
      expect(result.value.every((n) => n.read)).toBe(true);
    }
  });
});
```

Create `packages/infrastructure/src/invitation-use-cases.test.ts`:

```typescript
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
```

**Step 6: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add packages/application/ packages/infrastructure/
git commit -m "feat: add audit, notification, and invitation use cases with tests"
```

---

### Task 7: Add PostgreSQL schema and repositories for new entities

**Files:**
- Modify: `packages/infrastructure/src/postgres/schema.ts`
- Create: `packages/infrastructure/src/postgres/pg-audit-event-repository.ts`
- Create: `packages/infrastructure/src/postgres/pg-notification-repository.ts`
- Create: `packages/infrastructure/src/postgres/pg-invitation-repository.ts`
- Modify: `packages/infrastructure/src/postgres/index.ts`

**Step 1: Add tables to schema.ts**

Add after existing tables in `packages/infrastructure/src/postgres/schema.ts`:

```typescript
export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  actorId: uuid("actor_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  metadata: text("metadata"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => [
  index("audit_events_organization_id_idx").on(table.organizationId),
  index("audit_events_entity_type_idx").on(table.organizationId, table.entityType),
  index("audit_events_actor_id_idx").on(table.actorId),
]);

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  recipientId: uuid("recipient_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("notifications_recipient_id_idx").on(table.recipientId, table.organizationId),
]);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey(),
  organizationId: uuid("organization_id").notNull().references(() => organizations.id),
  invitedByUserId: uuid("invited_by_user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  role: text("role").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
}, (table) => [
  index("invitations_email_idx").on(table.email),
  index("invitations_organization_id_idx").on(table.organizationId),
]);
```

**Step 2: Create PostgreSQL repositories**

Follow the exact same pattern as existing pg repos (`pg-asset-repository.ts`). Each file has:
- Type alias from `$inferSelect`
- `toEntity()` mapper with branded type casts
- Factory function returning the interface implementation
- `onConflictDoUpdate` for save (upsert)

For `auditEvents`, store `metadata` as JSON string (serialize/deserialize in toEntity/save).

For `notifications`, `markAllRead` uses a bulk update: `db.update(notifications).set({ read: true }).where(and(eq(...), eq(...)))`.

**Step 3: Export from postgres/index.ts**

Add:
```typescript
export { createPgAuditEventRepository } from "./pg-audit-event-repository.js";
export { createPgNotificationRepository } from "./pg-notification-repository.js";
export { createPgInvitationRepository } from "./pg-invitation-repository.js";
```

**Step 4: Generate migration**

Run: `cd /Users/guy/Developer/melvin/iptoassets/packages/infrastructure && npx drizzle-kit generate`

**Step 5: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 6: Commit**

```bash
git add packages/infrastructure/
git commit -m "feat(infrastructure): add PostgreSQL schema and repos for audit, notifications, invitations"
```

---

### Task 8: Update AuthContext with role and add permission helpers to web layer

**Files:**
- Modify: `apps/web/src/lib/server/api-utils.ts`
- Modify: `apps/web/src/auth.ts`
- Modify: `apps/web/src/lib/server/repositories.ts`
- Modify: `apps/web/src/lib/server/use-cases.ts`

**Step 1: Update AuthContext and add permission helpers**

Read and modify `apps/web/src/lib/server/api-utils.ts`:

```typescript
import { json } from "@sveltejs/kit";
import type { RequestEvent } from "@sveltejs/kit";
import type { Result, UserId, OrganizationId } from "@ipms/shared";
import { ok, err } from "@ipms/shared";
import type { MemberRole, PermissionAction } from "@ipms/domain";
import { hasPermission } from "@ipms/domain";

export function resultToResponse<T>(result: Result<T>, status = 200) {
  if (result.ok) {
    return json(result.value, { status });
  }
  return json({ error: result.error }, { status: 400 });
}

export interface AuthContext {
  readonly userId: UserId;
  readonly organizationId: OrganizationId;
  readonly role: MemberRole;
}

export async function requireAuth(event: RequestEvent): Promise<Result<AuthContext>> {
  const session = await event.locals.auth();
  if (!session?.user) return err("Not authenticated");

  const userId = (session as any).userId as UserId | undefined;
  const organizationId = (session as any).activeOrganizationId as OrganizationId | undefined;
  const role = (session as any).role as MemberRole | undefined;

  if (!userId) return err("Not authenticated");
  if (!organizationId) return err("No organization selected");
  if (!role) return err("No role assigned");

  return ok({ userId, organizationId, role });
}

export function unauthorizedResponse(error: string) {
  return json({ error }, { status: 401 });
}

export function forbiddenResponse() {
  return json({ error: "Forbidden" }, { status: 403 });
}

export function requirePermission(auth: AuthContext, action: PermissionAction): Response | null {
  if (!hasPermission(auth.role, action)) return forbiddenResponse();
  return null;
}
```

**Step 2: Update Auth.js session callback to include role**

Read and modify `apps/web/src/auth.ts`. In the session callback, after finding the domain user, also look up their membership to get the role:

```typescript
async session({ session }) {
  if (!session.user?.email) return session;

  const domainUser = await userRepo.findByEmail(session.user.email);
  if (domainUser) {
    (session as any).userId = domainUser.id;

    const orgsResult = await listUserOrganizations(domainUser.id);
    if (orgsResult.ok && orgsResult.value.length > 0) {
      (session as any).activeOrganizationId = orgsResult.value[0].id;

      // Get role from membership
      const membership = await memberRepo.findByUserAndOrg(domainUser.id, orgsResult.value[0].id);
      if (membership) {
        (session as any).role = membership.role;
      }
    }
  }

  return session;
},
```

Also update the signIn callback to call `acceptPendingInvitations` after sign-in:

```typescript
async signIn({ user, account }) {
  if (!account || !user.email || !user.name) return false;

  const result = await signInOrRegister({
    authProviderId: `${account.provider}:${account.providerAccountId}`,
    email: user.email,
    name: user.name,
    avatarUrl: user.image ?? null,
  });

  if (result.ok) {
    // Accept any pending invitations for this email
    await acceptPendingInvitations(user.email, result.value.id);
  }

  return result.ok;
},
```

Make sure to import `acceptPendingInvitations` and `memberRepo` in the lazy import block.

**Step 3: Wire new repos and use cases**

Update `apps/web/src/lib/server/repositories.ts` — add `auditEventRepo`, `notificationRepo`, `invitationRepo` in both branches.

Update `apps/web/src/lib/server/use-cases.ts` — wire all new use cases.

**Step 4: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 5: Commit**

```bash
git add apps/web/src/
git commit -m "feat(web): add role to AuthContext, wire new repos and use cases"
```

---

### Task 9: Add permission checks to all API routes

**Files:**
- Modify: All 13 existing API route files + organizations route
- Pattern: After `requireAuth`, add `requirePermission` check

**Step 1: Add permission checks**

For each route, add the appropriate permission check after `requireAuth`. Pattern:

```typescript
export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const forbidden = requirePermission(auth.value, "asset:create");
  if (forbidden) return forbidden;

  // ... rest of handler
};
```

Apply these permission mappings:

| Route | Method | Permission |
|-------|--------|------------|
| `assets` | GET | `asset:read` |
| `assets` | POST | `asset:create` |
| `assets/[id]` | GET | `asset:read` |
| `assets/[id]` | PUT | `asset:update-status` |
| `assets/[id]` | DELETE | `asset:delete` |
| `assets/[id]/deadlines` | GET | `deadline:read` |
| `assets/[id]/deadlines` | POST | `deadline:create` |
| `assets/[id]/timeline` | GET | `asset:read` |
| `assets/bulk/status` | POST | `bulk:operate` |
| `assets/bulk/portfolio` | POST | `bulk:operate` |
| `documents` | GET | `document:read` |
| `documents` | POST | `document:create` |
| `documents/[id]` | PUT | `document:update-status` |
| `documents/[id]` | DELETE | `document:delete` |
| `portfolios` | GET | `portfolio:read` |
| `portfolios` | POST | `portfolio:create` |
| `portfolios/[id]` | GET | `portfolio:read` |
| `portfolios/[id]` | PUT | `portfolio:modify` |
| `portfolios/[id]` | DELETE | `portfolio:delete` |
| `analytics/*` | GET | `asset:read` |
| `export/assets.csv` | GET | `export:csv` |

**Step 2: Verify and commit**

Run: `pnpm test`

```bash
git add apps/web/src/routes/api/
git commit -m "feat(web): add RBAC permission checks to all API routes"
```

---

### Task 10: Add new API routes (audit, notifications, invitations)

**Files:**
- Create: `apps/web/src/routes/api/audit/+server.ts`
- Create: `apps/web/src/routes/api/notifications/+server.ts`
- Create: `apps/web/src/routes/api/notifications/[id]/read/+server.ts`
- Create: `apps/web/src/routes/api/notifications/read-all/+server.ts`
- Create: `apps/web/src/routes/api/invitations/+server.ts`
- Create: `apps/web/src/routes/api/invitations/[id]/+server.ts`

**Step 1: Create audit route**

```typescript
// apps/web/src/routes/api/audit/+server.ts
import type { RequestHandler } from "./$types";
import { listAuditEvents } from "$lib/server/use-cases";
import { resultToResponse, requireAuth, unauthorizedResponse, requirePermission } from "$lib/server/api-utils";

export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "audit:read");
  if (forbidden) return forbidden;

  const { url } = event;
  const entityType = url.searchParams.get("entityType") ?? undefined;
  const limit = url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : undefined;

  const result = await listAuditEvents(auth.value.organizationId, { entityType, limit });
  return resultToResponse(result);
};
```

**Step 2: Create notification routes**

```typescript
// apps/web/src/routes/api/notifications/+server.ts
export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const result = await listNotifications(auth.value.userId, auth.value.organizationId);
  return resultToResponse(result);
};
```

```typescript
// apps/web/src/routes/api/notifications/[id]/read/+server.ts
export const PUT: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const idResult = parseNotificationId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await markNotificationRead(idResult.value, auth.value.userId);
  return resultToResponse(result);
};
```

```typescript
// apps/web/src/routes/api/notifications/read-all/+server.ts
export const PUT: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);

  const result = await markAllNotificationsRead(auth.value.userId, auth.value.organizationId);
  return resultToResponse(result);
};
```

**Step 3: Create invitation routes**

```typescript
// apps/web/src/routes/api/invitations/+server.ts
export const GET: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "member:invite");
  if (forbidden) return forbidden;

  const result = await listInvitations(auth.value.organizationId);
  return resultToResponse(result);
};

export const POST: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "member:invite");
  if (forbidden) return forbidden;

  const body = await event.request.json();
  const result = await createInvitation({
    organizationId: auth.value.organizationId,
    invitedByUserId: auth.value.userId,
    email: body.email,
    role: body.role,
  });
  return resultToResponse(result, 201);
};
```

```typescript
// apps/web/src/routes/api/invitations/[id]/+server.ts
export const DELETE: RequestHandler = async (event) => {
  const auth = await requireAuth(event);
  if (!auth.ok) return unauthorizedResponse(auth.error);
  const forbidden = requirePermission(auth.value, "member:invite");
  if (forbidden) return forbidden;

  const idResult = parseInvitationId(event.params.id);
  if (!idResult.ok) return json({ error: idResult.error }, { status: 400 });

  const result = await deleteInvitation(idResult.value, auth.value.organizationId);
  return resultToResponse(result);
};
```

**Step 4: Run all tests and commit**

Run: `pnpm test`

```bash
git add apps/web/src/routes/api/
git commit -m "feat(web): add audit, notifications, and invitations API routes"
```

---

### Task 11: Run full test suite and final verification

**Step 1: Run all tests**

Run: `pnpm test`
Expected: ALL PASS

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: PASS

**Step 3: Update roadmap**

In `docs/roadmap.md`, under Phase 3, mark completed items:

```markdown
- [x] Role-based access control (Admin, Manager, Attorney, Viewer)
- [x] Audit logging (who changed what, when)
- [x] In-app notification center
```

Leave unchecked:
```markdown
- [ ] Email notifications for deadlines and review requests
```

**Step 4: Commit**

```bash
git add docs/roadmap.md
git commit -m "docs: mark Phase 3b items complete in roadmap"
```

---

## Summary

| Task | Description | Key Files |
|------|-------------|-----------|
| 1 | Branded types AuditEventId, NotificationId, InvitationId | `packages/shared/` |
| 2 | RBAC: MemberRole update + hasPermission function | `packages/domain/src/rbac.ts` |
| 3 | AuditEvent, Notification, Invitation entities + domain functions | `packages/domain/` |
| 4 | Repository port interfaces for new entities | `packages/application/src/ports.ts` |
| 5 | In-memory repository implementations | `packages/infrastructure/src/` |
| 6 | Use cases: audit, notification, invitation | `packages/application/src/use-cases/` |
| 7 | PostgreSQL schema + repos + migration | `packages/infrastructure/src/postgres/` |
| 8 | AuthContext with role, permission helpers, rewire repos/use-cases | `apps/web/src/` |
| 9 | Permission checks on all existing API routes | `apps/web/src/routes/api/` |
| 10 | New API routes: audit, notifications, invitations | `apps/web/src/routes/api/` |
| 11 | Final verification + roadmap update | all |
