<svelte:head>
  <title>IPMS - Intellectual Property Management System</title>
</svelte:head>

<script lang="ts">
  let activeFilter = $state("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "patents", label: "Patents" },
    { id: "trademarks", label: "Trademarks" },
    { id: "copyrights", label: "Copyrights" },
  ];

  const stats = [
    { label: "Active assets", value: "128", sub: "12 filed this month", accent: false },
    { label: "Granted", value: "84", sub: "3 pending grant", accent: false },
    { label: "Expiring soon", value: "7", sub: "within 90 days", accent: true },
  ];

  const deadlines = [
    { id: 1, title: "Patent renewals", count: 4, type: "renewal" },
    { id: 2, title: "Office action responses", count: 2, type: "response" },
    { id: 3, title: "Filing deadlines", count: 3, type: "filing" },
    { id: 4, title: "Document reviews", count: 5, type: "review" },
    { id: 5, title: "Portfolio reviews", count: 1, type: "review" },
  ];

  const recentAssets = [
    { id: "1", title: "Neural Interface Patent", type: "Patent", jurisdiction: "US", status: "filed", date: "Mar 5, 2026" },
    { id: "2", title: "Quantum Logo Mark", type: "Trademark", jurisdiction: "EU", status: "granted", date: "Mar 3, 2026" },
    { id: "3", title: "AI Training Dataset", type: "Copyright", jurisdiction: "US", status: "draft", date: "Mar 1, 2026" },
    { id: "4", title: "Holographic Display", type: "Patent", jurisdiction: "JP", status: "published", date: "Feb 28, 2026" },
  ];

  const typeColors: Record<string, string> = {
    renewal: "bg-amber-100 text-amber-600",
    response: "bg-red-100 text-red-600",
    filing: "bg-blue-100 text-blue-600",
    review: "bg-purple-100 text-purple-600",
  };

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-[var(--color-neutral-100)]", text: "text-[var(--color-neutral-600)]", label: "Draft" },
    filed: { bg: "bg-blue-50", text: "text-blue-700", label: "Filed" },
    published: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Published" },
    granted: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Granted" },
    expired: { bg: "bg-amber-50", text: "text-amber-700", label: "Expired" },
    abandoned: { bg: "bg-red-50", text: "text-red-700", label: "Abandoned" },
  };
</script>

<!-- Hero Section -->
<div class="bg-gradient-to-b from-[#f0ecff] to-[#f7f7f8] pb-6">
  <div class="mx-auto max-w-[1400px] px-6 pt-8">
    <!-- Greeting -->
    <h1 class="text-center text-2xl font-bold text-[var(--color-neutral-900)]">
      Good afternoon, Alex
    </h1>

    <!-- Filter Pills -->
    <div class="mt-5 flex items-center justify-center gap-2">
      {#each filters as filter}
        <button
          class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors {activeFilter === filter.id
            ? 'border-[var(--color-neutral-900)] bg-white text-[var(--color-neutral-900)] shadow-sm'
            : 'border-[var(--border-color)] bg-white/60 text-[var(--color-neutral-500)] hover:bg-white hover:text-[var(--color-neutral-700)]'}"
          onclick={() => (activeFilter = filter.id)}
        >
          {filter.label}
        </button>
      {/each}
    </div>

    <!-- Search Bar -->
    <div class="mx-auto mt-5 max-w-2xl">
      <div class="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-white px-4 py-2.5 shadow-sm">
        <svg class="h-5 w-5 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <input type="text" placeholder="Search for assets, portfolios, deadlines or documents..." class="w-full bg-transparent text-sm text-[var(--color-neutral-800)] outline-none placeholder:text-[var(--color-neutral-400)]" />
        <button class="text-[var(--color-neutral-300)] hover:text-[var(--color-neutral-500)]">
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Dashboard Content -->
<div class="mx-auto max-w-[1400px] px-6 pb-12">
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">

    <!-- Left Column -->
    <div class="flex flex-col gap-6">

      <!-- Asset Tracker -->
      <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
            <svg class="h-4.5 w-4.5 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
          </div>
          <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Asset tracker</h2>
        </div>

        <div class="mt-5 grid grid-cols-3 gap-4">
          {#each stats as stat}
            <div class="rounded-xl border px-5 py-4 {stat.accent ? 'border-amber-200 bg-amber-50/50' : 'border-[var(--border-color)]'}">
              <p class="text-sm {stat.accent ? 'font-medium text-amber-600' : 'text-[var(--color-neutral-500)]'}">{stat.label}</p>
              <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{stat.value}</p>
              <p class="mt-1 text-xs text-[var(--color-neutral-400)]">{stat.sub}</p>
            </div>
          {/each}
        </div>
      </div>

      <!-- Recent Assets -->
      <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <svg class="h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Recent assets</h2>
          </div>
          <a href="/assets" class="text-sm font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]">View all</a>
        </div>

        <div class="mt-4">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[var(--border-color)]">
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Name</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Type</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Jurisdiction</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Status</th>
                <th class="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Date</th>
              </tr>
            </thead>
            <tbody>
              {#each recentAssets as asset}
                <tr class="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--color-neutral-50)]">
                  <td class="py-3.5">
                    <a href="/assets/{asset.id}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)]">{asset.title}</a>
                  </td>
                  <td class="py-3.5 text-sm text-[var(--color-neutral-500)]">{asset.type}</td>
                  <td class="py-3.5">
                    <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">{asset.jurisdiction}</span>
                  </td>
                  <td class="py-3.5">
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusConfig[asset.status].bg} {statusConfig[asset.status].text}">{statusConfig[asset.status].label}</span>
                  </td>
                  <td class="py-3.5 text-right text-sm text-[var(--color-neutral-400)]">{asset.date}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Right Column -->
    <div class="flex flex-col gap-6">

      <!-- For You Today -->
      <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <svg class="h-4.5 w-4.5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">For you today</h2>
          </div>
          <button class="flex items-center gap-1 rounded-full border border-[var(--border-color)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)]">
            Manage
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
        <p class="mt-1 text-xs text-[var(--color-neutral-400)]">To-dos that require your attention</p>

        <div class="mt-4 flex flex-col">
          {#each deadlines as deadline}
            <div class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <div class="flex h-9 w-9 items-center justify-center rounded-xl {typeColors[deadline.type]}">
                    {#if deadline.type === "renewal"}
                      <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"/></svg>
                    {:else if deadline.type === "response"}
                      <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                    {:else if deadline.type === "filing"}
                      <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                    {:else}
                      <svg class="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
                    {/if}
                  </div>
                  <span class="absolute -right-1.5 -top-1.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-[var(--color-primary-500)] text-[10px] font-bold text-white">
                    {deadline.count}
                  </span>
                </div>
                <span class="text-sm font-medium text-[var(--color-neutral-800)]">{deadline.title}</span>
              </div>
              <button class="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-800)]">
                Review
              </button>
            </div>
          {/each}
        </div>
      </div>

      <!-- Portfolio Overview -->
      <div class="rounded-2xl border border-[var(--border-color)] bg-[#2d1b69] p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-white">Portfolio health</h2>
          <span class="text-2xl font-bold text-emerald-400">92%</span>
        </div>
        <p class="mt-0.5 text-right text-xs uppercase tracking-wider text-emerald-400/70">healthy</p>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div class="h-full w-[92%] rounded-full bg-gradient-to-r from-emerald-400 to-emerald-300"></div>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-lg font-bold text-white">84</p>
            <p class="text-xs text-white/50">Granted</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-white">37</p>
            <p class="text-xs text-white/50">Pending</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-white">7</p>
            <p class="text-xs text-amber-400">Expiring</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
