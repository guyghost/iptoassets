<script>
  import { enhance } from "$app/forms";

  let { form } = $props();
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="w-full max-w-sm space-y-6">
    <h1 class="text-2xl font-bold">Create your organization</h1>
    <p class="text-gray-600">
      Set up your organization to start managing intellectual property.
    </p>

    <form method="POST" use:enhance class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium">Organization name</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Acme Corp"
          class="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
        />
      </div>

      {#if form?.error}
        <p class="text-sm text-red-600">{form.error}</p>
      {/if}

      <button
        type="submit"
        class="w-full rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        Create organization
      </button>
    </form>
  </div>
</div>
