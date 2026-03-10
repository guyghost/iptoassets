<script>
  import { enhance } from "$app/forms";
</script>

<div class="flex min-h-screen items-center justify-center">
  <div class="w-full max-w-sm space-y-6 text-center">
    <h1 class="text-2xl font-bold">Sign in to IPMS</h1>
    <p class="text-gray-600">Intellectual Property Management System</p>

    <div class="space-y-3">
      <form method="POST" use:enhance>
        <input type="hidden" name="providerId" value="google" />
        <input type="hidden" name="redirectTo" value="/app" />
        <button
          type="submit"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Sign in with Google
        </button>
      </form>

      <form method="POST" use:enhance>
        <input type="hidden" name="providerId" value="microsoft-entra-id" />
        <input type="hidden" name="redirectTo" value="/app" />
        <button
          type="submit"
          class="w-full rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Sign in with Microsoft
        </button>
      </form>
    </div>
  </div>
</div>
