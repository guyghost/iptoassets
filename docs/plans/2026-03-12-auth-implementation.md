# Auth Flow Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix authentication flow by separating public/authenticated layouts via SvelteKit route groups, fixing login buttons, and adding proper redirects.

**Architecture:** SvelteKit route groups `(public)` and `(app)` with separate layouts. Root `/` redirects based on auth state. Middleware updated to match new structure.

**Tech Stack:** SvelteKit 2, Better Auth 1.5, Svelte 5 runes

---

### Task 1: Strip root layout to CSS-only

**Files:**
- Modify: `apps/web/src/routes/+layout.svelte`

**Step 1: Replace root layout with minimal version**

Replace the entire content of `apps/web/src/routes/+layout.svelte` with:

```svelte
<script>
  import "../app.css";
  let { children } = $props();
</script>

{@render children()}
```

This removes the navbar from the root layout. All pages will temporarily lose their navbar until Task 3 adds it back in the `(app)` group.

**Step 2: Verify the app still starts**

Run: `cd apps/web && pnpm dev`

Open `http://localhost:5173/login` — it should render the login form without any navbar.

**Step 3: Commit**

```bash
git add apps/web/src/routes/+layout.svelte
git commit -m "refactor: strip root layout to CSS-only import"
```

---

### Task 2: Create `(public)` route group and move login

**Files:**
- Create: `apps/web/src/routes/(public)/+layout.svelte`
- Move: `apps/web/src/routes/login/` → `apps/web/src/routes/(public)/login/`

**Step 1: Create the public layout**

Create `apps/web/src/routes/(public)/+layout.svelte`:

```svelte
<script>
  let { children } = $props();
</script>

{@render children()}
```

**Step 2: Move login folder**

```bash
mkdir -p apps/web/src/routes/\(public\)
mv apps/web/src/routes/login apps/web/src/routes/\(public\)/login
```

**Step 3: Verify login page still works**

Run: `cd apps/web && pnpm dev`

Open `http://localhost:5173/login` — login page should render identically (no navbar, just the form). The route path `/login` stays the same because `(public)` is a group (invisible in URL).

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(public\)/
git add -u  # stages the deletion of old login/ files
git commit -m "refactor: move login into (public) route group"
```

---

### Task 3: Create `(app)` route group with navbar layout

**Files:**
- Create: `apps/web/src/routes/(app)/+layout.server.ts`
- Create: `apps/web/src/routes/(app)/+layout.svelte`
- Move: `apps/web/src/routes/assets/` → `apps/web/src/routes/(app)/assets/`
- Move: `apps/web/src/routes/portfolios/` → `apps/web/src/routes/(app)/portfolios/`
- Move: `apps/web/src/routes/deadlines/` → `apps/web/src/routes/(app)/deadlines/`
- Move: `apps/web/src/routes/documents/` → `apps/web/src/routes/(app)/documents/`
- Move: `apps/web/src/routes/app/onboarding/` → `apps/web/src/routes/(app)/onboarding/`

**Step 1: Create `(app)/+layout.server.ts`**

This loads user/session data for all authenticated pages:

```ts
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async (event) => {
  const user = event.locals.betterAuthUser;
  if (!user) {
    throw redirect(303, "/login");
  }

  return {
    user: {
      id: event.locals.userId,
      name: user.name,
      email: user.email,
      avatarUrl: user.image ?? null,
    },
    role: event.locals.role ?? "viewer",
    organizationId: event.locals.activeOrganizationId,
  };
};
```

**Step 2: Create `(app)/+layout.svelte`**

This is the navbar layout (moved from the old root layout), updated to use real user data:

```svelte
<script lang="ts">
  import { page } from "$app/stores";
  import { NavActions } from "@ipms/ui";
  let { children } = $props();

  const data = $derived($page.data);

  const userInitials = $derived(
    (data.user?.name ?? "")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );

  const navItems = [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/assets", label: "Assets", icon: "assets" },
    { href: "/portfolios", label: "Portfolios", icon: "portfolios" },
    { href: "/deadlines", label: "Deadlines", icon: "deadlines" },
    { href: "/documents", label: "Documents", icon: "documents" },
  ];
</script>

<div class="min-h-screen bg-[#f7f7f8]">
  <!-- Top Navigation -->
  <nav class="bg-white border-b border-[var(--border-color)]">
    <div class="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">
      <!-- Left: Logo + Org -->
      <div class="flex items-center gap-3">
        <a href="/dashboard" class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-600)] text-sm font-bold text-white">IP</span>
        </a>
        <div class="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-[var(--color-neutral-50)] cursor-pointer">
          <span class="text-sm font-semibold text-[var(--color-neutral-800)]">Melvin Corp</span>
          <svg class="h-3.5 w-3.5 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>

      <!-- Center: Nav Links -->
      <div class="flex items-center gap-1 rounded-full bg-[var(--color-neutral-50)] p-1">
        {#each navItems as item}
          <a
            href={item.href}
            class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-[var(--color-neutral-500)] transition-colors hover:text-[var(--color-neutral-800)] [&.active]:bg-white [&.active]:text-[var(--color-neutral-900)] [&.active]:shadow-sm"
          >
            {#if item.icon === "home"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
            {:else if item.icon === "assets"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            {:else if item.icon === "portfolios"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
            {:else if item.icon === "deadlines"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {:else if item.icon === "documents"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
            {/if}
            {item.label}
          </a>
        {/each}
      </div>

      <!-- Right: Actions -->
      <NavActions userInitials={userInitials} notificationCount={3} />
    </div>
  </nav>

  <!-- Content -->
  <main>
    {@render children()}
  </main>
</div>
```

**Step 3: Move page folders into `(app)`**

```bash
mkdir -p apps/web/src/routes/\(app\)
mv apps/web/src/routes/assets apps/web/src/routes/\(app\)/assets
mv apps/web/src/routes/portfolios apps/web/src/routes/\(app\)/portfolios
mv apps/web/src/routes/deadlines apps/web/src/routes/\(app\)/deadlines
mv apps/web/src/routes/documents apps/web/src/routes/\(app\)/documents
mv apps/web/src/routes/app/onboarding apps/web/src/routes/\(app\)/onboarding
rmdir apps/web/src/routes/app  # remove empty directory
```

**Step 4: Verify authenticated pages render with navbar**

Run: `cd apps/web && pnpm dev`

Open `http://localhost:5173/assets` — should show navbar + assets page (or redirect to `/login` if not authenticated). The URL paths `/assets`, `/portfolios`, etc. remain unchanged.

**Step 5: Commit**

```bash
git add apps/web/src/routes/\(app\)/
git add -u
git commit -m "refactor: create (app) route group with navbar layout and user data"
```

---

### Task 4: Create dashboard page and root redirect

**Files:**
- Create: `apps/web/src/routes/(app)/dashboard/+page.svelte`
- Modify: `apps/web/src/routes/+page.svelte` (replace with empty placeholder)
- Create: `apps/web/src/routes/+page.server.ts` (root redirect)

**Step 1: Move dashboard content**

Create `apps/web/src/routes/(app)/dashboard/+page.svelte` with the full content of the current `apps/web/src/routes/+page.svelte` (the dashboard with hero section, asset tracker, deadlines, portfolio health). Copy it exactly as-is.

**Step 2: Replace root `+page.svelte` with empty placeholder**

Replace `apps/web/src/routes/+page.svelte` with:

```svelte
<!-- Redirect handled by +page.server.ts -->
```

**Step 3: Create root redirect `+page.server.ts`**

Create `apps/web/src/routes/+page.server.ts`:

```ts
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  if (event.locals.betterAuthUser) {
    throw redirect(303, "/dashboard");
  }
  throw redirect(303, "/login");
};
```

**Step 4: Verify redirects**

- Open `http://localhost:5173/` not logged in → should redirect to `/login`
- Open `http://localhost:5173/` logged in → should redirect to `/dashboard`
- Open `http://localhost:5173/dashboard` → should show the dashboard with navbar

**Step 5: Commit**

```bash
git add apps/web/src/routes/\(app\)/dashboard/
git add apps/web/src/routes/+page.svelte
git add apps/web/src/routes/+page.server.ts
git commit -m "feat: add dashboard page and root redirect based on auth state"
```

---

### Task 5: Update middleware `protectRoutes`

**Files:**
- Modify: `apps/web/src/hooks.server.ts`

**Step 1: Update `protectRoutes` in `hooks.server.ts`**

Replace the `protectRoutes` function (lines 43-58) with:

```ts
const protectRoutes: Handle = async ({ event, resolve }) => {
  const isPublicRoute =
    event.url.pathname.startsWith("/api/auth") ||
    event.url.pathname.startsWith("/api/cron") ||
    event.url.pathname === "/";

  if (isPublicRoute) {
    return resolve(event);
  }

  // Redirect authenticated users away from login
  if (event.url.pathname.startsWith("/login") && event.locals.betterAuthUser) {
    throw redirect(303, "/dashboard");
  }

  // Allow login page for unauthenticated users
  if (event.url.pathname.startsWith("/login")) {
    return resolve(event);
  }

  // All other routes require authentication
  if (!event.locals.betterAuthUser) {
    throw redirect(303, "/login");
  }

  return resolve(event);
};
```

Key changes:
- `/` stays public (its `+page.server.ts` handles the redirect logic)
- `/login` is public for unauthenticated users, redirects to `/dashboard` for authenticated users
- All other routes require authentication

**Step 2: Verify middleware behavior**

- Not logged in, visit `/assets` → redirect to `/login`
- Not logged in, visit `/login` → see login page
- Logged in, visit `/login` → redirect to `/dashboard`
- Logged in, visit `/dashboard` → see dashboard

**Step 3: Commit**

```bash
git add apps/web/src/hooks.server.ts
git commit -m "fix: update protectRoutes middleware for new route structure"
```

---

### Task 6: Fix login buttons

**Files:**
- Modify: `apps/web/src/routes/(public)/login/+page.svelte`

**Step 1: Update login page with error handling and loading state**

Replace the entire content of `(public)/login/+page.svelte` with:

```svelte
<script lang="ts">
  import { page } from "$app/stores";
  import { authClient } from "$lib/auth-client";

  const hasGoogle = $derived(($page.data as any)?.hasGoogle ?? false);
  const hasMicrosoft = $derived(($page.data as any)?.hasMicrosoft ?? false);
  const hasOAuthProviders = $derived(hasGoogle || hasMicrosoft);

  let loading = $state(false);
  let error = $state("");

  async function signInWithGoogle() {
    loading = true;
    error = "";
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
    if (result.error) {
      error = result.error.message ?? "Failed to sign in with Google";
      loading = false;
    }
  }

  async function signInWithMicrosoft() {
    loading = true;
    error = "";
    const result = await authClient.signIn.social({
      provider: "microsoft",
      callbackURL: "/dashboard",
    });
    if (result.error) {
      error = result.error.message ?? "Failed to sign in with Microsoft";
      loading = false;
    }
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
  <div class="w-full max-w-sm space-y-6 rounded-2xl border border-[var(--border-color)] bg-white p-8 shadow-sm">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Sign in to IPMS</h1>
      <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Intellectual Property Management System</p>
    </div>

    {#if error}
      <div class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
        {error}
      </div>
    {/if}

    <div class="space-y-3">
      {#if hasOAuthProviders}
        {#if hasGoogle}
          <button
            onclick={signInWithGoogle}
            type="button"
            disabled={loading}
            class="w-full rounded-lg border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] shadow-sm hover:bg-[var(--color-neutral-50)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecting..." : "Sign in with Google"}
          </button>
        {/if}

        {#if hasMicrosoft}
          <button
            onclick={signInWithMicrosoft}
            type="button"
            disabled={loading}
            class="w-full rounded-lg border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] shadow-sm hover:bg-[var(--color-neutral-50)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Redirecting..." : "Sign in with Microsoft"}
          </button>
        {/if}
      {:else}
        <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          No authentication providers configured. Set GOOGLE_CLIENT_ID or MICROSOFT_CLIENT_ID environment variables.
        </div>
      {/if}
    </div>
  </div>
</div>
```

**Step 2: Verify login page**

- Open `http://localhost:5173/login`
- Buttons should show, no navbar visible
- Click a button → should show "Redirecting..." and attempt OAuth redirect
- If env vars aren't set, should show the "No authentication providers configured" warning

**Step 3: Commit**

```bash
git add apps/web/src/routes/\(public\)/login/+page.svelte
git commit -m "fix: add error handling and loading state to login buttons"
```

---

### Task 7: Update onboarding redirects

**Files:**
- Modify: `apps/web/src/routes/(app)/onboarding/+page.server.ts`

**Step 1: Update redirect targets in onboarding**

The onboarding page currently redirects to `/app` after org creation. Update it to redirect to `/dashboard`:

In `(app)/onboarding/+page.server.ts`, change line 11:
```ts
// Before:
throw redirect(303, "/app");
// After:
throw redirect(303, "/dashboard");
```

And change line 28:
```ts
// Before:
throw redirect(303, "/app");
// After:
throw redirect(303, "/dashboard");
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/\(app\)/onboarding/+page.server.ts
git commit -m "fix: update onboarding redirects to /dashboard"
```

---

### Task 8: Smoke test full flow

**No files to change — verification only.**

**Step 1: Start dev server**

```bash
cd apps/web && pnpm dev
```

**Step 2: Test unauthenticated flow**

1. Open `http://localhost:5173/` → should redirect to `/login`
2. Open `http://localhost:5173/login` → should show login form, NO navbar
3. Open `http://localhost:5173/assets` → should redirect to `/login`
4. Open `http://localhost:5173/dashboard` → should redirect to `/login`
5. Open `http://localhost:5173/portfolios` → should redirect to `/login`

**Step 3: Test authenticated flow (if OAuth is configured)**

1. Sign in via OAuth → should redirect to `/dashboard`
2. `http://localhost:5173/` → should redirect to `/dashboard`
3. `http://localhost:5173/login` → should redirect to `/dashboard`
4. `http://localhost:5173/dashboard` → should show dashboard with navbar
5. `http://localhost:5173/assets` → should show assets page with navbar
6. Navbar should show real user initials (not "AG")

**Step 4: Check build**

```bash
cd apps/web && pnpm build
```

Ensure no TypeScript or build errors.
