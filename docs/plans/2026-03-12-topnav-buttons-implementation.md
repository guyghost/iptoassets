# Top Nav Buttons Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the settings, notifications, and profile buttons in the top nav functional — settings navigates to `/settings`, notifications opens a slide-over panel with mock data, profile opens a dropdown with user info and sign out.

**Architecture:** NavActions (packages/ui) becomes event-driven via callback props. Behavioral logic (navigation, auth, panel toggling) lives in the app layout. New feature components (NotificationPanel, ProfileDropdown) live in apps/web/src/features/.

**Tech Stack:** Svelte 5 (runes), SvelteKit, Better Auth (signOut), Tailwind CSS

---

### Task 1: Make NavActions emit click events

**Files:**
- Modify: `packages/ui/src/molecules/NavActions.svelte`

**Step 1: Update NavActions to accept and forward click callbacks**

Replace the full content of `packages/ui/src/molecules/NavActions.svelte`:

```svelte
<script lang="ts">
  import IconButton from "../atoms/IconButton.svelte";
  import UserAvatar from "../atoms/UserAvatar.svelte";

  interface Props {
    userInitials?: string;
    notificationCount?: number;
    onsettingsclick?: () => void;
    onnotificationsclick?: () => void;
    onprofileclick?: () => void;
  }

  let {
    userInitials = "AG",
    notificationCount = 0,
    onsettingsclick,
    onnotificationsclick,
    onprofileclick,
  }: Props = $props();
</script>

<div class="flex items-center gap-2" data-testid="nav-actions">
  <IconButton
    icon="settings"
    aria-label="Settings"
    data-testid="nav-settings"
    onclick={onsettingsclick}
  />

  <div class="relative">
    <IconButton
      icon="bell"
      aria-label="Notifications"
      data-testid="nav-notifications"
      onclick={onnotificationsclick}
    />
    {#if notificationCount > 0}
      <span
        class="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-danger-500)] text-[10px] font-bold text-white pointer-events-none"
        aria-label="{notificationCount} notifications"
      >
        {notificationCount > 9 ? "9+" : notificationCount}
      </span>
    {/if}
  </div>

  <div class="ml-1">
    <UserAvatar initials={userInitials} onclick={onprofileclick} />
  </div>
</div>
```

**Step 2: Update UserAvatar to forward onclick**

Read `packages/ui/src/atoms/UserAvatar.svelte`. The component already renders a `<button>`, but it doesn't accept an `onclick` prop explicitly. Since it doesn't use `...rest` spread, add onclick to the props:

```svelte
<script lang="ts">
  type Size = "sm" | "md" | "lg";

  interface Props {
    initials: string;
    size?: Size;
    class?: string;
    onclick?: () => void;
  }

  let { initials, size = "md", class: className = "", onclick }: Props = $props();

  const sizeClasses: Record<Size, string> = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
  };
</script>

<button
  class="flex items-center justify-center rounded-full bg-[var(--color-primary-100)] font-semibold text-[var(--color-primary-700)] cursor-pointer transition-colors hover:bg-[var(--color-primary-200)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] {sizeClasses[size]} {className}"
  aria-label="User menu"
  data-testid="user-avatar"
  {onclick}
>
  {initials}
</button>
```

**Step 3: Commit**

```bash
git add packages/ui/src/molecules/NavActions.svelte packages/ui/src/atoms/UserAvatar.svelte
git commit -m "feat: add click event callbacks to NavActions and UserAvatar"
```

---

### Task 2: Create ProfileDropdown component

**Files:**
- Create: `apps/web/src/features/profile/ProfileDropdown.svelte`

**Step 1: Create the ProfileDropdown component**

```svelte
<script lang="ts">
  import { authClient } from "$lib/auth-client";
  import { goto } from "$app/navigation";

  interface Props {
    userName: string;
    userEmail: string;
    userInitials: string;
    open: boolean;
    onclose: () => void;
  }

  let { userName, userEmail, userInitials, open, onclose }: Props = $props();

  async function handleSignOut() {
    await authClient.signOut();
    goto("/login");
  }
</script>

{#if open}
  <!-- Backdrop -->
  <button
    class="fixed inset-0 z-40"
    aria-label="Close menu"
    onclick={onclose}
    tabindex="-1"
  ></button>

  <!-- Dropdown -->
  <div class="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-[var(--border-color)] bg-white py-2 shadow-lg">
    <!-- User info -->
    <div class="flex items-center gap-3 px-4 py-3">
      <span class="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-sm font-semibold text-[var(--color-primary-700)]">
        {userInitials}
      </span>
      <div class="min-w-0">
        <p class="truncate text-sm font-semibold text-[var(--color-neutral-900)]">{userName}</p>
        <p class="truncate text-xs text-[var(--color-neutral-500)]">{userEmail}</p>
      </div>
    </div>

    <div class="mx-3 my-1 border-t border-[var(--border-color)]"></div>

    <!-- Links -->
    <a
      href="/settings"
      class="flex items-center gap-3 px-4 py-2 text-sm text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]"
      onclick={onclose}
    >
      <svg class="h-4 w-4 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
      Profile
    </a>

    <button
      class="flex w-full items-center gap-3 px-4 py-2 text-sm text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]"
      onclick={handleSignOut}
    >
      <svg class="h-4 w-4 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"/></svg>
      Sign out
    </button>
  </div>
{/if}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/profile/ProfileDropdown.svelte
git commit -m "feat: add ProfileDropdown component with sign out"
```

---

### Task 3: Create NotificationPanel slide-over component

**Files:**
- Create: `apps/web/src/features/notifications/NotificationPanel.svelte`

**Step 1: Create the NotificationPanel component with mock data**

```svelte
<script lang="ts">
  interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    read: boolean;
    type: "deadline" | "status" | "review";
  }

  interface Props {
    open: boolean;
    onclose: () => void;
  }

  let { open, onclose }: Props = $props();

  let notifications = $state<Notification[]>([
    {
      id: "1",
      title: "Patent renewal due",
      description: "US-2024-001234 renewal deadline in 7 days",
      time: "2 hours ago",
      read: false,
      type: "deadline",
    },
    {
      id: "2",
      title: "Status changed to Granted",
      description: "EP-2023-005678 has been granted by EPO",
      time: "5 hours ago",
      read: false,
      type: "status",
    },
    {
      id: "3",
      title: "Document review requested",
      description: "Filing application for TM-2024-009012 needs your review",
      time: "1 day ago",
      read: true,
      type: "review",
    },
    {
      id: "4",
      title: "Office action response overdue",
      description: "US-2023-003456 response was due 2 days ago",
      time: "2 days ago",
      read: true,
      type: "deadline",
    },
    {
      id: "5",
      title: "New asset filed",
      description: "CN-2024-007890 has been filed with CNIPA",
      time: "3 days ago",
      read: true,
      type: "status",
    },
  ]);

  const unreadCount = $derived(notifications.filter((n) => !n.read).length);

  function markAsRead(id: string) {
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
  }

  function dismiss(id: string) {
    notifications = notifications.filter((n) => n.id !== id);
  }

  function markAllAsRead() {
    notifications = notifications.map((n) => ({ ...n, read: true }));
  }

  const typeIcons: Record<string, { bg: string; text: string }> = {
    deadline: { bg: "bg-amber-100", text: "text-amber-600" },
    status: { bg: "bg-emerald-100", text: "text-emerald-600" },
    review: { bg: "bg-blue-100", text: "text-blue-600" },
  };
</script>

{#if open}
  <!-- Backdrop -->
  <button
    class="fixed inset-0 z-40 bg-black/20 transition-opacity"
    aria-label="Close notifications"
    onclick={onclose}
    tabindex="-1"
  ></button>

  <!-- Slide-over panel -->
  <div class="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-[var(--border-color)] bg-white shadow-xl">
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[var(--border-color)] px-5 py-4">
      <div class="flex items-center gap-2">
        <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Notifications</h2>
        {#if unreadCount > 0}
          <span class="flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-primary-500)] px-1.5 text-[11px] font-bold text-white">
            {unreadCount}
          </span>
        {/if}
      </div>
      <div class="flex items-center gap-2">
        {#if unreadCount > 0}
          <button
            class="text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
            onclick={markAllAsRead}
          >
            Mark all read
          </button>
        {/if}
        <button
          class="flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-600)]"
          aria-label="Close"
          onclick={onclose}
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>

    <!-- Notification list -->
    <div class="flex-1 overflow-y-auto">
      {#if notifications.length === 0}
        <div class="flex flex-col items-center justify-center py-16 text-center">
          <svg class="h-10 w-10 text-[var(--color-neutral-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
          <p class="mt-3 text-sm text-[var(--color-neutral-500)]">No notifications</p>
        </div>
      {:else}
        {#each notifications as notification (notification.id)}
          <div
            class="flex items-start gap-3 border-b border-[var(--border-color)] px-5 py-4 transition-colors {notification.read ? '' : 'bg-[var(--color-primary-50)]/30'}"
          >
            <!-- Type icon -->
            <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg {typeIcons[notification.type]?.bg ?? 'bg-gray-100'} {typeIcons[notification.type]?.text ?? 'text-gray-600'}">
              {#if notification.type === "deadline"}
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {:else if notification.type === "status"}
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {:else}
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
              {/if}
            </div>

            <!-- Content -->
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm font-medium text-[var(--color-neutral-900)] {notification.read ? '' : 'font-semibold'}">
                  {notification.title}
                </p>
                <button
                  class="shrink-0 text-[var(--color-neutral-300)] hover:text-[var(--color-neutral-500)]"
                  aria-label="Dismiss"
                  onclick={() => dismiss(notification.id)}
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
              </div>
              <p class="mt-0.5 text-xs text-[var(--color-neutral-500)]">{notification.description}</p>
              <div class="mt-1.5 flex items-center gap-3">
                <span class="text-[11px] text-[var(--color-neutral-400)]">{notification.time}</span>
                {#if !notification.read}
                  <button
                    class="text-[11px] font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]"
                    onclick={() => markAsRead(notification.id)}
                  >
                    Mark as read
                  </button>
                {/if}
              </div>
            </div>

            <!-- Unread dot -->
            {#if !notification.read}
              <div class="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary-500)]"></div>
            {/if}
          </div>
        {/each}
      {/if}
    </div>
  </div>
{/if}
```

**Step 2: Commit**

```bash
git add apps/web/src/features/notifications/NotificationPanel.svelte
git commit -m "feat: add NotificationPanel slide-over with mock data"
```

---

### Task 4: Create Settings page

**Files:**
- Create: `apps/web/src/routes/(app)/settings/+page.svelte`

**Step 1: Create the settings page with placeholder sections**

```svelte
<svelte:head>
  <title>Settings - IPMS</title>
</svelte:head>

<script lang="ts">
  import { page } from "$app/stores";

  const data = $derived($page.data);

  let activeSection = $state("general");

  const sections = [
    { id: "general", label: "General", icon: "settings" },
    { id: "notifications", label: "Notifications", icon: "bell" },
    { id: "organization", label: "Organization", icon: "building" },
  ];
</script>

<div class="mx-auto max-w-[1400px] px-6 py-8">
  <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Settings</h1>
  <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Manage your account and preferences</p>

  <div class="mt-8 grid grid-cols-[220px_1fr] gap-8">
    <!-- Sidebar -->
    <nav class="flex flex-col gap-1">
      {#each sections as section}
        <button
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors {activeSection === section.id
            ? 'bg-[var(--color-primary-50)] text-[var(--color-primary-700)]'
            : 'text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-800)]'}"
          onclick={() => (activeSection = section.id)}
        >
          {#if section.icon === "settings"}
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {:else if section.icon === "bell"}
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"/></svg>
          {:else}
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/></svg>
          {/if}
          {section.label}
        </button>
      {/each}
    </nav>

    <!-- Content -->
    <div class="rounded-2xl border border-[var(--border-color)] bg-white p-8 shadow-sm">
      {#if activeSection === "general"}
        <h2 class="text-lg font-semibold text-[var(--color-neutral-900)]">General</h2>
        <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Manage your account settings</p>

        <div class="mt-6 space-y-6">
          <div>
            <label class="block text-sm font-medium text-[var(--color-neutral-700)]" for="name">Display name</label>
            <input
              id="name"
              type="text"
              value={data.user?.name ?? ""}
              disabled
              class="mt-1.5 w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--color-neutral-50)] px-3 py-2 text-sm text-[var(--color-neutral-500)]"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--color-neutral-700)]" for="email">Email</label>
            <input
              id="email"
              type="email"
              value={data.user?.email ?? ""}
              disabled
              class="mt-1.5 w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--color-neutral-50)] px-3 py-2 text-sm text-[var(--color-neutral-500)]"
            />
          </div>
        </div>
      {:else if activeSection === "notifications"}
        <h2 class="text-lg font-semibold text-[var(--color-neutral-900)]">Notifications</h2>
        <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Choose what you want to be notified about</p>

        <div class="mt-6 space-y-4">
          {#each [
            { label: "Deadline reminders", description: "Get notified when deadlines are approaching" },
            { label: "Status changes", description: "Get notified when asset statuses change" },
            { label: "Document reviews", description: "Get notified when documents need your review" },
            { label: "Email notifications", description: "Receive notifications via email" },
          ] as pref}
            <div class="flex items-center justify-between rounded-lg border border-[var(--border-color)] px-4 py-3">
              <div>
                <p class="text-sm font-medium text-[var(--color-neutral-800)]">{pref.label}</p>
                <p class="text-xs text-[var(--color-neutral-500)]">{pref.description}</p>
              </div>
              <div class="h-6 w-10 rounded-full bg-[var(--color-primary-500)] p-0.5 cursor-pointer">
                <div class="h-5 w-5 translate-x-4 rounded-full bg-white shadow-sm transition-transform"></div>
              </div>
            </div>
          {/each}
        </div>
      {:else if activeSection === "organization"}
        <h2 class="text-lg font-semibold text-[var(--color-neutral-900)]">Organization</h2>
        <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Manage your organization settings</p>

        <div class="mt-6 space-y-6">
          <div>
            <label class="block text-sm font-medium text-[var(--color-neutral-700)]" for="org-name">Organization name</label>
            <input
              id="org-name"
              type="text"
              value="Melvin Corp"
              disabled
              class="mt-1.5 w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--color-neutral-50)] px-3 py-2 text-sm text-[var(--color-neutral-500)]"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--color-neutral-700)]" for="role">Your role</label>
            <input
              id="role"
              type="text"
              value="Admin"
              disabled
              class="mt-1.5 w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--color-neutral-50)] px-3 py-2 text-sm text-[var(--color-neutral-500)]"
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/\(app\)/settings/+page.svelte
git commit -m "feat: add settings page with placeholder sections"
```

---

### Task 5: Wire everything up in the app layout

**Files:**
- Modify: `apps/web/src/routes/(app)/+layout.svelte`

**Step 1: Update the app layout to integrate all three buttons**

Replace the full content of `apps/web/src/routes/(app)/+layout.svelte`:

```svelte
<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { NavActions } from "@ipms/ui";
  import ProfileDropdown from "../../features/profile/ProfileDropdown.svelte";
  import NotificationPanel from "../../features/notifications/NotificationPanel.svelte";

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

  let profileOpen = $state(false);
  let notificationsOpen = $state(false);

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
      <div class="relative">
        <NavActions
          userInitials={userInitials}
          notificationCount={3}
          onsettingsclick={() => goto('/settings')}
          onnotificationsclick={() => {
            notificationsOpen = !notificationsOpen;
            profileOpen = false;
          }}
          onprofileclick={() => {
            profileOpen = !profileOpen;
            notificationsOpen = false;
          }}
        />
        <ProfileDropdown
          userName={data.user?.name ?? ""}
          userEmail={data.user?.email ?? ""}
          {userInitials}
          open={profileOpen}
          onclose={() => (profileOpen = false)}
        />
      </div>
    </div>
  </nav>

  <!-- Notification slide-over -->
  <NotificationPanel
    open={notificationsOpen}
    onclose={() => (notificationsOpen = false)}
  />

  <!-- Content -->
  <main>
    {@render children()}
  </main>
</div>
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/\(app\)/+layout.svelte
git commit -m "feat: wire up topnav buttons — settings, notifications, profile"
```

---

### Task 6: Verify everything works

**Step 1: Run typecheck**

Run: `pnpm typecheck`
Expected: No errors

**Step 2: Run tests**

Run: `pnpm test`
Expected: All existing tests pass

**Step 3: Run dev server and manually verify**

Run: `pnpm dev`
Verify:
- Clicking settings gear navigates to `/settings`
- Settings page shows 3 sections (General, Notifications, Organization)
- Clicking bell opens slide-over panel from the right with 5 mock notifications
- Can mark as read, dismiss, close panel
- Clicking avatar opens dropdown with user info
- Sign out button logs out and redirects to `/login`
- Opening one panel/dropdown closes the other
