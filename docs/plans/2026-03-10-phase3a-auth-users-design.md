# Phase 3a: Authentication, Users & Organizations

## Overview

Add authentication, user management, and organization creation to IPMS. This replaces the hardcoded `DEFAULT_ORG_ID` with real user sessions and org-scoped data access.

## Decisions

- **Auth library:** Auth.js (SvelteKit integration)
- **OAuth providers:** Google + Microsoft (Entra ID)
- **Session storage:** PostgreSQL via Drizzle adapter
- **Architecture:** Auth.js handles OAuth/sessions only; User, Organization, and Membership live in the domain layer following existing patterns (branded types, Result, ports & adapters)

## Domain Model

### New Branded Types (shared)

```
UserId       = Brand<string, "UserId">
MembershipId = Brand<string, "MembershipId">
```

`OrganizationId` already exists.

### New Entities (domain)

```typescript
User {
  id: UserId
  email: string
  name: string
  avatarUrl: string | null
  authProviderId: string    // link to Auth.js user id
  createdAt: Date
}

Organization {
  id: OrganizationId
  name: string
  ownerId: UserId
  createdAt: Date
}

Membership {
  id: MembershipId
  userId: UserId
  organizationId: OrganizationId
  role: "owner" | "member"
  joinedAt: Date
}
```

### Domain Functions (pure)

- `createUser(input) -> Result<User>`
- `createOrganization(input) -> Result<Organization>`
- `createMembership(input) -> Result<Membership>`

## Ports (application)

```typescript
UserRepository {
  findById(id: UserId): Promise<User | null>
  findByAuthProviderId(authProviderId: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
}

OrganizationRepository {
  findById(id: OrganizationId): Promise<Organization | null>
  findByOwnerId(ownerId: UserId): Promise<readonly Organization[]>
  save(org: Organization): Promise<void>
}

MembershipRepository {
  findByUserId(userId: UserId): Promise<readonly Membership[]>
  findByOrganizationId(orgId: OrganizationId): Promise<readonly Membership[]>
  findByUserAndOrg(userId: UserId, orgId: OrganizationId): Promise<Membership | null>
  save(membership: Membership): Promise<void>
}
```

## Use Cases (application)

- **signInOrRegisterUseCase** -- Called by Auth.js signIn callback. Finds user by `authProviderId`; if not found, creates a new User via domain function and persists it.
- **createOrganizationUseCase** -- Creates an Organization and a Membership with role `owner` in one operation.
- **listUserOrganizationsUseCase** -- Returns all organizations the user belongs to (via memberships).
- **getActiveOrganizationUseCase** -- Resolves the active org from the session's `activeOrganizationId`.

## Auth.js Integration (web)

### Configuration

File: `apps/web/src/auth.ts`

- Drizzle adapter for PostgreSQL (manages `auth_*` tables)
- Google provider + Microsoft Entra ID provider
- `callbacks.signIn`: calls `signInOrRegisterUseCase` to sync domain User
- `callbacks.session`: enriches session with `userId` (branded) and `activeOrganizationId`

### Auth.js Tables (managed by adapter)

```
auth_users
auth_accounts
auth_sessions
auth_verification_tokens
```

### Sign-in Flow

```
User clicks "Sign in with Google/Microsoft"
  -> Auth.js OAuth flow
  -> signIn callback: signInOrRegisterUseCase
    -> User exists by authProviderId? return it
    -> Otherwise: createUser() -> save to DB
  -> session callback: attach userId + activeOrgId
  -> Redirect to /app
    -> No org? -> "Create your organization" page
    -> Has org? -> dashboard (orgId from session)
```

### Active Organization

Stored in the Auth.js session as `activeOrganizationId`. Updated when the user creates or selects an org.

## Route Protection (web)

### requireAuth Helper

```typescript
async function requireAuth(event: RequestEvent): Promise<Result<AuthContext>> {
  const session = await event.locals.auth()
  if (!session?.user?.id) return err("Not authenticated")
  if (!session.activeOrganizationId) return err("No organization selected")
  return ok({
    userId: session.user.id as UserId,
    organizationId: session.activeOrganizationId as OrganizationId
  })
}
```

### API Route Migration

Every existing API route replaces `DEFAULT_ORG_ID` with `auth.value.organizationId` from `requireAuth`. Unauthenticated requests get 401.

### Page Protection

`hooks.server.ts` protects all `/app/*` routes. Public pages (landing, login) remain accessible. Unauthenticated users are redirected to `/auth/signin`.

## Database Schema

### Domain Tables (new)

```sql
users
  id              UUID PK
  email           TEXT UNIQUE NOT NULL
  name            TEXT NOT NULL
  avatar_url      TEXT NULL
  auth_provider_id TEXT UNIQUE NOT NULL
  created_at      TIMESTAMP DEFAULT now()

organizations
  id              UUID PK
  name            TEXT NOT NULL
  owner_id        UUID NOT NULL -> FK users.id
  created_at      TIMESTAMP DEFAULT now()

memberships
  id              UUID PK
  user_id         UUID NOT NULL -> FK users.id
  organization_id UUID NOT NULL -> FK organizations.id
  role            TEXT NOT NULL ('owner' | 'member')
  joined_at       TIMESTAMP DEFAULT now()
  UNIQUE(user_id, organization_id)
```

### Indexes

- `users.email` (unique)
- `users.auth_provider_id` (unique)
- `memberships(user_id)`
- `memberships(organization_id)`

### Migration

Single Drizzle migration adding Auth.js tables + domain tables. Existing tables unchanged (already have `organization_id`).

## What Does NOT Change

- Existing entities: Asset, Deadline, Document, Portfolio, StatusChangeEvent
- Existing use cases and domain functions
- XState state machines
- Repository port signatures (already take `orgId`)

## Out of Scope (deferred to 3b)

- Granular RBAC (Admin, Manager, Attorney, Viewer)
- Email invitation system
- Multi-org switcher
- Auto-join by email domain
