# Phase 3b: RBAC, Audit Logging, Notifications & Invitations

## Overview

Add role-based access control, audit logging, in-app notifications, and a member invitation system to IPMS. Builds on Phase 3a (auth, users, organizations).

## Decisions

- **RBAC model:** 4 hierarchical roles (Viewer < Attorney < Manager < Admin)
- **Audit logging:** Action-level (not field-level), logged in use cases after side effects
- **Notifications:** In-app only (no email for now), triggered by deadline and document events
- **Invitations:** Stored in DB, auto-accepted on OAuth sign-in by matching email

---

## 1. RBAC

### Roles (hierarchical)

```
Viewer < Attorney < Manager < Admin
```

Each level inherits all permissions of the level below.

### Permission Matrix

| Action | Viewer | Attorney | Manager | Admin |
|--------|--------|----------|---------|-------|
| View assets, deadlines, docs, portfolios | x | x | x | x |
| View analytics/dashboard | x | x | x | x |
| Create/modify assets | | x | x | x |
| Create/modify deadlines | | x | x | x |
| Submit/modify documents | | x | x | x |
| Change asset status | | x | x | x |
| Create/modify portfolios | | | x | x |
| Bulk operations | | | x | x |
| Export CSV | | | x | x |
| View audit log | | | x | x |
| Invite members | | | | x |
| Change roles | | | | x |
| Remove members | | | | x |
| Modify organization | | | | x |

### Implementation

Extend `MemberRole` from `"owner" | "member"` to `"admin" | "manager" | "attorney" | "viewer"`. Existing `owner` memberships become `admin`.

Pure domain function:
```typescript
hasPermission(role: MemberRole, action: PermissionAction): boolean
```

Encodes the matrix above. Hierarchical: if Manager can do it, Admin can too.

`AuthContext` enriched with `role` (resolved from Membership in Auth.js session callback).

API routes check permissions after `requireAuth`:
```typescript
const auth = await requireAuth(event);
if (!auth.ok) return unauthorizedResponse(auth.error);
if (!hasPermission(auth.value.role, "asset:create")) return forbiddenResponse();
```

### Migration

Database migration to update existing memberships: `role = 'owner'` becomes `role = 'admin'`.

---

## 2. Audit Logging

### Entity

```typescript
AuditEvent {
  id: AuditEventId
  organizationId: OrganizationId
  actorId: UserId
  action: AuditAction
  entityType: "asset" | "deadline" | "document" | "portfolio" | "membership"
  entityId: string
  metadata: Record<string, string> | null
  timestamp: Date
}
```

### Audited Actions

```
asset:create, asset:update-status, asset:delete
deadline:create, deadline:complete
document:create, document:update-status, document:delete
portfolio:create, portfolio:add-asset, portfolio:remove-asset, portfolio:delete
membership:invite, membership:change-role, membership:remove
```

### Where Logging Happens

In use cases, after the side effect succeeds. `AuditEventRepository` injected as an additional parameter to use cases that need logging. Same pattern as `StatusChangeEventRepository` in `updateAssetStatusUseCase`.

`StatusChangeEvent` remains unchanged -- it is a domain-specific timeline model. `AuditEvent` is cross-cutting (who did what on any entity).

### API

`GET /api/audit` -- list audit events for the org. Filterable by `entityType`, `actorId`, date range. Accessible to Manager and Admin roles.

---

## 3. Notifications (In-App)

### Entity

```typescript
Notification {
  id: NotificationId
  organizationId: OrganizationId
  recipientId: UserId
  type: NotificationType
  title: string
  message: string
  entityType: "asset" | "deadline" | "document" | "portfolio"
  entityId: string
  read: boolean
  createdAt: Date
}
```

### Notification Types

| Type | Trigger | Recipients |
|------|---------|------------|
| `deadline:upcoming` | Deadline due within 7 days | All org members |
| `deadline:overdue` | Deadline past due date | All org members |
| `document:review` | Document submitted for review | Attorneys+ in org |
| `document:approved` | Document approved | Document creator |
| `document:rejected` | Document rejected | Document creator |

### Generation

- **Documents:** Created in use cases at the moment of status change.
- **Deadlines:** Created by a `checkDeadlineNotifications` use case, called via API route (triggered on dashboard load or periodically). No server-side cron needed for MVP.

### API

- `GET /api/notifications` -- list notifications for authenticated user (unread first)
- `PUT /api/notifications/[id]/read` -- mark as read
- `PUT /api/notifications/read-all` -- mark all as read

Accessible to all roles (each user sees only their own notifications).

---

## 4. Invitations

### Entity

```typescript
Invitation {
  id: InvitationId
  organizationId: OrganizationId
  invitedByUserId: UserId
  email: string
  role: MemberRole
  status: "pending" | "accepted" | "expired"
  createdAt: Date
  expiresAt: Date
}
```

### Flow

1. Admin creates invitation via `POST /api/invitations` (email + role)
2. Invitation stored in DB with status `pending`, expires in 7 days
3. When a user signs in via OAuth, the `signIn` callback checks for pending invitations matching their email
4. If found: creates Membership with the invitation's role, marks invitation `accepted`
5. If not found and no existing membership: onboarding page (create org)

No email sent (consistent with in-app only). Admin shares the link manually. Email notifications will be added when an email service is integrated.

### API

- `POST /api/invitations` -- create invitation (Admin only)
- `GET /api/invitations` -- list org invitations (Admin only)
- `DELETE /api/invitations/[id]` -- cancel invitation (Admin only)

---

## New Branded Types (shared)

```
AuditEventId    = Brand<string, "AuditEventId">
NotificationId  = Brand<string, "NotificationId">
InvitationId    = Brand<string, "InvitationId">
```

## New Ports (application)

```
AuditEventRepository
NotificationRepository
InvitationRepository
```

## Changes to Existing Code

- `MemberRole` changes from `"owner" | "member"` to `"admin" | "manager" | "attorney" | "viewer"`
- Existing use cases receive `AuditEventRepository` as additional parameter
- Auth.js `signIn` callback extended to check pending invitations
- Auth.js `session` callback enriched with `role`
- All API routes get permission checks after `requireAuth`
- `AuthContext` gains `role: MemberRole` field
- Database migration: rename `role = 'owner'` to `role = 'admin'` in memberships table

## Out of Scope

- Email notifications (deferred to Phase 3c)
- Field-level audit diffs
- Custom permission sets
- Auto-join by email domain
