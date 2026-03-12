# Auth Flow Redesign

## Problem

Three issues with the current authentication flow:

1. **Navbar visible on login page** - Single root `+layout.svelte` renders the navbar on all routes including `/login`
2. **`/` accessible without auth** - Middleware allows `/` as public, but the page is a full dashboard calling protected APIs
3. **Login buttons don't work** - `authClient.signIn.social()` fails silently with no error handling or loading state

## Solution: SvelteKit Route Groups

### New Route Structure

```
routes/
+layout.svelte              # root: import CSS + {@render children()} only
+page.server.ts             # redirect: / -> /login or /dashboard
+page.svelte                # empty (never rendered, server redirect)

(public)/
  +layout.svelte            # minimal layout, no navbar
  login/
    +page.svelte            # OAuth form (existing)
    +page.server.ts         # loads hasGoogle/hasMicrosoft (existing)

(app)/
  +layout.svelte            # navbar + NavActions (current root layout content)
  +layout.server.ts         # loads session/user data for all child pages
  dashboard/+page.svelte    # dashboard (current root +page.svelte content)
  assets/                   # moved as-is
  portfolios/               # moved as-is
  deadlines/                # moved as-is
  documents/                # moved as-is
  app/onboarding/           # moved from routes/app/onboarding

api/                        # stays outside groups
```

### Redirect Logic

**`/` root `+page.server.ts`:**
- Authenticated -> redirect `/dashboard`
- Not authenticated -> redirect `/login`

**`hooks.server.ts` `protectRoutes` updated:**
- Public routes: `/api/auth/*`, `/login`, `/api/cron/*`
- Remove `/` from public list (handled by its own `+page.server.ts`)
- Authenticated user accessing `/login` -> redirect `/dashboard`
- Any other route without session -> redirect `/login`

### Login Button Fix

- Add error handling to `authClient.signIn.social()` calls
- Add loading state to prevent double-clicks
- Show error message if OAuth fails
- Update `callbackURL` from `/assets` to `/dashboard`

### App Layout Data

`(app)/+layout.server.ts` exposes to child pages:

```ts
{
  user: { id, name, email, avatarUrl },
  role: "viewer" | "attorney" | "manager" | "admin",
  organizationId: string,
}
```

`(app)/+layout.svelte` uses this data to:
- Display real user initials in NavActions (replacing hardcoded "AG")
- Display real organization name (replacing hardcoded "Melvin Corp")

### What Stays the Same

- `hooks.server.ts` `authHandler` middleware (session enrichment)
- RBAC system (`requirePermission`, role hierarchy)
- All API routes
- All page content (assets, portfolios, deadlines, documents)
- Better Auth server config (`auth.ts`)
- Auth client creation (`auth-client.ts`)
