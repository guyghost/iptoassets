<svelte:head>
  <title>{portfolio.name} - Portfolios - IPMS</title>
</svelte:head>

<script lang="ts">
  import { page } from "$app/stores";

  const portfolioId = $derived($page.params.id);

  const portfolio = $derived(
    mockPortfolios.find((p) => p.id === portfolioId) ?? mockPortfolios[0]
  );

  const assets = $derived(
    mockAssets.filter((a) => portfolio.assetIds.includes(a.id))
  );

  const assetsByType = $derived(
    assets.reduce<Record<string, number>>((acc, a) => {
      acc[a.type] = (acc[a.type] ?? 0) + 1;
      return acc;
    }, {})
  );

  let showDeleteConfirm = $state(false);

  const mockPortfolios = [
    {
      id: "p1",
      name: "Core Patents",
      description: "Strategic patent portfolio covering our foundational technologies including neural interfaces, quantum computing architectures, and advanced display systems. This portfolio represents the company's most valuable IP assets and is central to our competitive positioning.",
      assetIds: ["a1", "a2", "a3", "a4", "a5", "a6", "a7", "a8", "a9", "a10", "a11", "a12"],
      owner: "Alex Chen",
      organizationId: "org1",
    },
    {
      id: "p2",
      name: "Brand Assets",
      description: "Trademark registrations and brand identity assets across key markets including US, EU, and APAC regions. Covers primary brand marks, product names, and logo registrations.",
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

  const mockAssets = [
    { id: "a1", title: "Neural Interface Patent", type: "Patent", jurisdiction: "US", status: "Granted", filingDate: "Jan 15, 2024" },
    { id: "a2", title: "Quantum Gate Architecture", type: "Patent", jurisdiction: "US", status: "Filed", filingDate: "Mar 22, 2024" },
    { id: "a3", title: "Holographic Display Method", type: "Patent", jurisdiction: "JP", status: "Published", filingDate: "May 10, 2024" },
    { id: "a4", title: "AI Training Optimization", type: "Patent", jurisdiction: "EU", status: "Granted", filingDate: "Jul 3, 2024" },
    { id: "a5", title: "Secure Data Pipeline", type: "Patent", jurisdiction: "US", status: "Filed", filingDate: "Aug 18, 2024" },
    { id: "a6", title: "Edge Computing Protocol", type: "Patent", jurisdiction: "KR", status: "Draft", filingDate: "Sep 5, 2024" },
    { id: "a7", title: "Biometric Auth System", type: "Patent", jurisdiction: "US", status: "Granted", filingDate: "Oct 12, 2024" },
    { id: "a8", title: "Natural Language Processor", type: "Patent", jurisdiction: "CN", status: "Filed", filingDate: "Nov 20, 2024" },
    { id: "a9", title: "Wireless Charging Module", type: "Patent", jurisdiction: "US", status: "Published", filingDate: "Dec 1, 2024" },
    { id: "a10", title: "Autonomous Navigation", type: "Patent", jurisdiction: "DE", status: "Filed", filingDate: "Jan 8, 2025" },
    { id: "a11", title: "Sensor Fusion Algorithm", type: "Patent", jurisdiction: "US", status: "Draft", filingDate: "Feb 14, 2025" },
    { id: "a12", title: "Cloud Orchestration", type: "Patent", jurisdiction: "US", status: "Granted", filingDate: "Mar 1, 2025" },
    { id: "a20", title: "Quantum Logo Mark", type: "Trademark", jurisdiction: "US", status: "Granted", filingDate: "Feb 10, 2024" },
    { id: "a21", title: "NeuraLink Word Mark", type: "Trademark", jurisdiction: "EU", status: "Granted", filingDate: "Apr 5, 2024" },
    { id: "a22", title: "QBit Brand Identity", type: "Trademark", jurisdiction: "JP", status: "Filed", filingDate: "Jun 18, 2024" },
    { id: "a23", title: "Holo Display Mark", type: "Trademark", jurisdiction: "US", status: "Published", filingDate: "Aug 22, 2024" },
    { id: "a24", title: "CloudSync Logo", type: "Trademark", jurisdiction: "AU", status: "Draft", filingDate: "Oct 30, 2024" },
    { id: "a30", title: "AI Training Dataset", type: "Copyright", jurisdiction: "US", status: "Granted", filingDate: "Mar 12, 2024" },
    { id: "a31", title: "Platform Source Code", type: "Copyright", jurisdiction: "US", status: "Granted", filingDate: "May 20, 2024" },
    { id: "a32", title: "Technical Documentation", type: "Copyright", jurisdiction: "US", status: "Filed", filingDate: "Jul 15, 2024" },
    { id: "a40", title: "Robotics Control System", type: "Patent", jurisdiction: "JP", status: "Filed", filingDate: "Jan 20, 2025" },
    { id: "a41", title: "Smart Grid Patent", type: "Patent", jurisdiction: "KR", status: "Granted", filingDate: "Feb 8, 2025" },
    { id: "a42", title: "AR Display Technology", type: "Patent", jurisdiction: "CN", status: "Filed", filingDate: "Mar 15, 2025" },
    { id: "a43", title: "Voice Recognition Engine", type: "Patent", jurisdiction: "JP", status: "Published", filingDate: "Apr 2, 2025" },
    { id: "a44", title: "Battery Optimization", type: "Patent", jurisdiction: "AU", status: "Filed", filingDate: "May 10, 2025" },
    { id: "a45", title: "Data Compression Method", type: "Patent", jurisdiction: "KR", status: "Draft", filingDate: "Jun 22, 2025" },
    { id: "a46", title: "Haptic Feedback Device", type: "Patent", jurisdiction: "JP", status: "Granted", filingDate: "Jul 30, 2025" },
    { id: "a47", title: "Network Security Protocol", type: "Patent", jurisdiction: "CN", status: "Filed", filingDate: "Aug 15, 2025" },
    { id: "a48", title: "Image Processing Chip", type: "Patent", jurisdiction: "AU", status: "Published", filingDate: "Sep 5, 2025" },
    { id: "a50", title: "Quantum Error Correction", type: "Patent", jurisdiction: "US", status: "Draft", filingDate: "Jan 5, 2026" },
    { id: "a51", title: "Neural Mesh Interface v2", type: "Patent", jurisdiction: "US", status: "Draft", filingDate: "Feb 18, 2026" },
  ];

  const statusConfig: Record<string, { bg: string; text: string }> = {
    Draft: { bg: "bg-[var(--color-neutral-100)]", text: "text-[var(--color-neutral-600)]" },
    Filed: { bg: "bg-blue-50", text: "text-blue-700" },
    Published: { bg: "bg-indigo-50", text: "text-indigo-700" },
    Granted: { bg: "bg-emerald-50", text: "text-emerald-700" },
  };

  const typeColorConfig: Record<string, { bg: string; text: string }> = {
    Patent: { bg: "bg-blue-50", text: "text-blue-700" },
    Trademark: { bg: "bg-purple-50", text: "text-purple-700" },
    Copyright: { bg: "bg-amber-50", text: "text-amber-700" },
  };
</script>

<div class="min-h-screen bg-[#f7f7f8]">
  <div class="mx-auto max-w-[1400px] px-6 py-8">
    <!-- Back Link -->
    <a
      href="/portfolios"
      class="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-neutral-500)] transition-colors hover:text-[var(--color-primary-600)]"
    >
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
      Back to Portfolios
    </a>

    <!-- Header -->
    <div class="mt-4 flex items-start justify-between">
      <div>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
            <svg class="h-5 w-5 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">{portfolio.name}</h1>
            <p class="mt-0.5 text-sm text-[var(--color-neutral-500)]">Owned by {portfolio.owner}</p>
          </div>
        </div>
        <p class="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-neutral-600)]">{portfolio.description}</p>
      </div>
      <button class="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
        Add Asset
      </button>
    </div>

    <!-- Stats -->
    <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Total Assets -->
      <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
            <svg class="h-4.5 w-4.5 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          </div>
          <span class="text-sm text-[var(--color-neutral-500)]">Total Assets</span>
        </div>
        <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{assets.length}</p>
      </div>

      <!-- Assets by Type -->
      {#each Object.entries(assetsByType) as [type, count]}
        <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg {typeColorConfig[type]?.bg ?? 'bg-gray-50'}">
              {#if type === "Patent"}
                <svg class="h-4.5 w-4.5 {typeColorConfig[type]?.text ?? 'text-gray-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5"/></svg>
              {:else if type === "Trademark"}
                <svg class="h-4.5 w-4.5 {typeColorConfig[type]?.text ?? 'text-gray-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path d="M6 6h.008v.008H6V6z"/></svg>
              {:else}
                <svg class="h-4.5 w-4.5 {typeColorConfig[type]?.text ?? 'text-gray-600'}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
              {/if}
            </div>
            <span class="text-sm text-[var(--color-neutral-500)]">{type}s</span>
          </div>
          <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{count}</p>
        </div>
      {/each}
    </div>

    <!-- Asset Table -->
    <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <svg class="h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
        </div>
        <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Assets in portfolio</h2>
      </div>

      {#if assets.length > 0}
        <div class="mt-4 overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[var(--border-color)]">
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Name</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Type</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Jurisdiction</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Status</th>
                <th class="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Filing Date</th>
              </tr>
            </thead>
            <tbody>
              {#each assets as asset}
                <tr class="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--color-neutral-50)]">
                  <td class="py-3.5">
                    <a href="/assets/{asset.id}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)]">{asset.title}</a>
                  </td>
                  <td class="py-3.5">
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {typeColorConfig[asset.type]?.bg ?? 'bg-gray-50'} {typeColorConfig[asset.type]?.text ?? 'text-gray-700'}">{asset.type}</span>
                  </td>
                  <td class="py-3.5">
                    <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">{asset.jurisdiction}</span>
                  </td>
                  <td class="py-3.5">
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusConfig[asset.status]?.bg ?? 'bg-gray-50'} {statusConfig[asset.status]?.text ?? 'text-gray-700'}">{asset.status}</span>
                  </td>
                  <td class="py-3.5 text-right text-sm text-[var(--color-neutral-400)]">{asset.filingDate}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {:else}
        <div class="mt-6 flex flex-col items-center py-10">
          <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-neutral-100)]">
            <svg class="h-6 w-6 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          </div>
          <p class="mt-3 text-sm font-medium text-[var(--color-neutral-600)]">No assets in this portfolio</p>
          <p class="mt-1 text-sm text-[var(--color-neutral-400)]">Add assets to start tracking them here.</p>
        </div>
      {/if}
    </div>

    <!-- Danger Zone -->
    <div class="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
          <svg class="h-4.5 w-4.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
        </div>
        <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Danger zone</h2>
      </div>

      <div class="mt-4 flex items-center justify-between rounded-xl border border-red-100 bg-red-50/50 px-5 py-4">
        <div>
          <p class="text-sm font-medium text-[var(--color-neutral-900)]">Delete this portfolio</p>
          <p class="mt-0.5 text-sm text-[var(--color-neutral-500)]">This action cannot be undone. Assets will not be deleted.</p>
        </div>
        {#if showDeleteConfirm}
          <div class="flex items-center gap-2">
            <button
              class="rounded-lg border border-[var(--border-color)] bg-white px-3 py-1.5 text-sm font-medium text-[var(--color-neutral-600)] transition-colors hover:bg-[var(--color-neutral-50)]"
              onclick={() => (showDeleteConfirm = false)}
            >
              Cancel
            </button>
            <button class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700">
              Confirm Delete
            </button>
          </div>
        {:else}
          <button
            class="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            onclick={() => (showDeleteConfirm = true)}
          >
            Delete Portfolio
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>
