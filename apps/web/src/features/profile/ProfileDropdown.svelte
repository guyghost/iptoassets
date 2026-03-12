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
