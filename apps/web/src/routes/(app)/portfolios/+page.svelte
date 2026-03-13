<svelte:head>
  <title>Portfolios - IPMS</title>
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { truncate } from "../../../features/portfolios/helpers";

  interface Portfolio {
    id: string;
    name: string;
    description: string;
    assetIds: string[];
    owner: string;
    organizationId: string;
  }

  let portfolios = $state<Portfolio[]>([]);
  let loading = $state(true);
  let searchQuery = $state("");

  // Modal state
  let showModal = $state(false);
  let newName = $state("");
  let newDescription = $state("");
  let creating = $state(false);
  let error = $state("");

  onMount(async () => {
    try {
      const res = await fetch("/api/portfolios");
      if (res.ok) {
        portfolios = await res.json();
      }
    } catch {
      // Gracefully handle
    } finally {
      loading = false;
    }
  });

  const filtered = $derived(
    portfolios.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function openModal() {
    newName = "";
    newDescription = "";
    error = "";
    showModal = true;
  }

  function closeModal() {
    showModal = false;
  }

  async function handleCreate() {
    if (!newName.trim()) {
      error = "Portfolio name is required";
      return;
    }
    creating = true;
    error = "";
    try {
      const res = await fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          name: newName.trim(),
          description: newDescription.trim(),
          owner: $page.data.user.name,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        portfolios = [...portfolios, created];
        closeModal();
      } else {
        const data = await res.json().catch(() => null);
        error = data?.error ?? "Failed to create portfolio";
      }
    } catch {
      error = "Network error. Please try again.";
    } finally {
      creating = false;
    }
  }
</script>

<div class="min-h-screen bg-[#f7f7f8]">
  <div class="mx-auto max-w-[1400px] px-6 py-8">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Portfolios</h1>
        <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Organize and manage your intellectual property collections</p>
      </div>
      <button
        onclick={openModal}
        class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
        New Portfolio
      </button>
    </div>

    <!-- Search -->
    <div class="mt-6 max-w-md">
      <div class="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-white px-4 py-2.5 shadow-sm">
        <svg class="h-5 w-5 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <input
          type="text"
          placeholder="Search portfolios..."
          class="w-full bg-transparent text-sm text-[var(--color-neutral-800)] outline-none placeholder:text-[var(--color-neutral-400)]"
          bind:value={searchQuery}
        />
      </div>
    </div>

    <!-- Portfolio Grid -->
    {#if loading}
      <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each [0, 1, 2] as _}
          <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
            <div class="skeleton h-10 w-10 !rounded-lg"></div>
            <div class="skeleton mt-4 h-5 w-40"></div>
            <div class="skeleton mt-2 h-4 w-full"></div>
            <div class="skeleton mt-1 h-4 w-3/4"></div>
            <div class="mt-5 flex items-center justify-between border-t border-[var(--border-color)] pt-4">
              <div class="skeleton h-4 w-20"></div>
              <div class="skeleton h-4 w-24"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if filtered.length > 0}
      <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {#each filtered as portfolio}
          <a
            href="/portfolios/{portfolio.id}"
            class="group rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm transition-all hover:border-[var(--color-primary-200)] hover:shadow-md"
          >
            <div class="flex items-start justify-between">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
                <svg class="h-5 w-5 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
              </div>
              <svg class="h-5 w-5 text-[var(--color-neutral-300)] transition-colors group-hover:text-[var(--color-primary-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
            </div>

            <h3 class="mt-4 text-base font-semibold text-[var(--color-neutral-900)] group-hover:text-[var(--color-primary-700)]">
              {portfolio.name}
            </h3>
            <p class="mt-1.5 text-sm leading-relaxed text-[var(--color-neutral-500)]">
              {truncate(portfolio.description, 100)}
            </p>

            <div class="mt-5 flex items-center justify-between border-t border-[var(--border-color)] pt-4">
              <div class="flex items-center gap-1.5">
                <svg class="h-4 w-4 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                <span class="text-sm font-medium text-[var(--color-neutral-700)]">{portfolio.assetIds.length} assets</span>
              </div>
              <div class="flex items-center gap-1.5">
                <svg class="h-4 w-4 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                <span class="text-sm text-[var(--color-neutral-500)]">{portfolio.owner}</span>
              </div>
            </div>
          </a>
        {/each}
      </div>
    {:else}
      <!-- Empty State -->
      <div class="mt-12 flex flex-col items-center justify-center rounded-2xl border border-[var(--border-color)] bg-white py-16 shadow-sm">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-neutral-100)]">
          <svg class="h-7 w-7 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
        </div>
        <h3 class="mt-4 text-base font-semibold text-[var(--color-neutral-900)]">No portfolios found</h3>
        <p class="mt-1 text-sm text-[var(--color-neutral-500)]">
          {#if searchQuery}
            No portfolios match your search. Try a different query.
          {:else}
            Get started by creating your first portfolio.
          {/if}
        </p>
        {#if !searchQuery}
          <button
            onclick={openModal}
            class="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]"
          >
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Create Portfolio
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>

<!-- Create Portfolio Modal -->
{#if showModal}
  <div class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- Backdrop -->
    <button
      class="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onclick={closeModal}
      aria-label="Close modal"
    ></button>

    <!-- Modal -->
    <div class="relative w-full max-w-lg rounded-2xl border border-[var(--border-color)] bg-white p-8 shadow-xl">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-[var(--color-neutral-900)]">New Portfolio</h2>
        <button
          onclick={closeModal}
          class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-neutral-400)] transition-colors hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-600)]"
          aria-label="Close"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <form
        onsubmit={(e) => { e.preventDefault(); handleCreate(); }}
        class="mt-6 flex flex-col gap-5"
      >
        <div>
          <label for="portfolio-name" class="block text-sm font-medium text-[var(--color-neutral-700)]">Name</label>
          <input
            id="portfolio-name"
            type="text"
            bind:value={newName}
            placeholder="e.g. Core Patents"
            class="mt-1.5 w-full rounded-xl border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm text-[var(--color-neutral-800)] outline-none transition-colors placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
          />
        </div>

        <div>
          <label for="portfolio-description" class="block text-sm font-medium text-[var(--color-neutral-700)]">Description</label>
          <textarea
            id="portfolio-description"
            bind:value={newDescription}
            placeholder="Describe what this portfolio contains..."
            rows="3"
            class="mt-1.5 w-full resize-none rounded-xl border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm text-[var(--color-neutral-800)] outline-none transition-colors placeholder:text-[var(--color-neutral-400)] focus:border-[var(--color-primary-400)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
          ></textarea>
        </div>

        {#if error}
          <p class="text-sm text-red-600">{error}</p>
        {/if}

        <div class="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onclick={closeModal}
            class="rounded-xl border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-600)] transition-colors hover:bg-[var(--color-neutral-50)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)] disabled:opacity-50"
          >
            {#if creating}
              Creating...
            {:else}
              Create Portfolio
            {/if}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
