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

<div class="mx-auto max-w-[1400px] px-4 md:px-6 py-8">
  <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Settings</h1>
  <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Manage your account and preferences</p>

  <div class="mt-8 flex flex-col gap-6 lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
    <!-- Sidebar -->
    <nav class="flex flex-col gap-1">
      {#each sections as section}
        <button
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors min-h-[var(--touch-target-min)] {activeSection === section.id
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
    <div class="rounded-2xl border border-[var(--border-color)] bg-white p-8 shadow-[var(--shadow-card)]">
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
                <div class="h-5 w-5 translate-x-4 rounded-full bg-white shadow-[var(--shadow-card)] transition-transform"></div>
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
              value={data.organizationName}
              disabled
              class="mt-1.5 w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--color-neutral-50)] px-3 py-2 text-sm text-[var(--color-neutral-500)]"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-[var(--color-neutral-700)]" for="role">Your role</label>
            <input
              id="role"
              type="text"
              value={data.role}
              disabled
              class="mt-1.5 w-full max-w-md rounded-lg border border-[var(--border-color)] bg-[var(--color-neutral-50)] px-3 py-2 text-sm text-[var(--color-neutral-500)]"
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
