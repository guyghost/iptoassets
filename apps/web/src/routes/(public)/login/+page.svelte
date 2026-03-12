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
