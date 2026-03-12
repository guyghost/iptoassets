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
          <span class="text-sm font-semibold text-[var(--color-neutral-800)]">{data.organizationName}</span>
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
