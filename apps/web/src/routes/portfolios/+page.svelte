<svelte:head>
  <title>Portfolios - IPMS</title>
</svelte:head>

<script lang="ts">
  const portfolios: Array<{
    id: string;
    name: string;
    description: string;
    assetIds: string[];
    owner: string;
    organizationId: string;
  }> = [
    {
      id: "p1",
      name: "Core Patents",
      description: "Strategic patent portfolio covering our foundational technologies including neural interfaces, quantum computing architectures, and advanced display systems.",
      assetIds: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "a11", "a12"],
      owner: "Alex Chen",
      organizationId: "org1",
    },
    {
      id: "p2",
      name: "Brand Assets",
      description: "Trademark registrations and brand identity assets across key markets including US, EU, and APAC regions.",
      assetIds: ["a20", "a21", "a22", "a23", "a24"],
      owner: "Maria Lopez",
      organizationId: "org1",
    },
    {
      id: "p3",
      name: "Software Copyrights",
      description: "Copyright registrations for proprietary software, training datasets, and documentation materials.",
      assetIds: ["a30", "a31", "a32"],
      owner: "James Park",
      organizationId: "org1",
    },
    {
      id: "p4",
      name: "Licensing Portfolio",
      description: "Assets available for out-licensing or currently under licensing agreements with third parties.",
      assetIds: ["a1", "a4", "a7", "a10", "a20", "a21", "a30"],
      owner: "Sarah Kim",
      organizationId: "org1",
    },
    {
      id: "p5",
      name: "APAC Filings",
      description: "Regional portfolio covering all intellectual property filings across Asia-Pacific jurisdictions including Japan, Korea, China, and Australia.",
      assetIds: ["a40", "a41", "a42", "a43", "a44", "a45", "a46", "a47", "a48"],
      owner: "Wei Zhang",
      organizationId: "org1",
    },
    {
      id: "p6",
      name: "R&D Pipeline",
      description: "Emerging inventions and provisional patent applications from the research and development team.",
      assetIds: ["a50", "a51"],
      owner: "Alex Chen",
      organizationId: "org1",
    },
  ];

  let searchQuery = $state("");

  const filtered = $derived(
    portfolios.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trimEnd() + "...";
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
      <button class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]">
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
    {#if filtered.length > 0}
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
          <button class="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
            Create Portfolio
          </button>
        {/if}
      </div>
    {/if}
  </div>
</div>
