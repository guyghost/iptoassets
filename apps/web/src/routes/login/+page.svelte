<script lang="ts">
  import { page } from "$app/stores";
  import { enhance } from "$app/forms";

  let email = $state("dev@ipms.local");

  const hasOAuthProviders = $derived(
    ($page.data as any)?.hasOAuthProviders ?? false
  );
</script>

<div class="flex min-h-screen items-center justify-center bg-[#f7f7f8]">
  <div class="w-full max-w-sm space-y-6 rounded-2xl border border-[var(--border-color)] bg-white p-8 shadow-sm">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Sign in to IPMS</h1>
      <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Intellectual Property Management System</p>
    </div>

    <div class="space-y-3">
      {#if hasOAuthProviders}
        <form method="POST" use:enhance>
          <input type="hidden" name="providerId" value="google" />
          <input type="hidden" name="redirectTo" value="/assets" />
          <button
            type="submit"
            class="w-full rounded-lg border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] shadow-sm hover:bg-[var(--color-neutral-50)] transition-colors"
          >
            Sign in with Google
          </button>
        </form>

        <form method="POST" use:enhance>
          <input type="hidden" name="providerId" value="microsoft-entra-id" />
          <input type="hidden" name="redirectTo" value="/assets" />
          <button
            type="submit"
            class="w-full rounded-lg border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] shadow-sm hover:bg-[var(--color-neutral-50)] transition-colors"
          >
            Sign in with Microsoft
          </button>
        </form>
      {:else}
        <!-- Dev login -->
        <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Development mode — no OAuth providers configured
        </div>

        <form method="POST" use:enhance>
          <input type="hidden" name="providerId" value="dev-login" />
          <input type="hidden" name="redirectTo" value="/assets" />

          <div class="flex flex-col gap-1.5">
            <label for="dev-email" class="text-sm font-medium text-[var(--color-neutral-700)]">Email</label>
            <input
              id="dev-email"
              type="email"
              name="email"
              bind:value={email}
              class="rounded-lg border border-[var(--border-color)] px-3 py-2.5 text-sm text-[var(--color-neutral-900)] outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
            />
          </div>

          <button
            type="submit"
            class="mt-3 w-full rounded-lg bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-700)] transition-colors"
          >
            Sign in
          </button>
        </form>
      {/if}
    </div>
  </div>
</div>
