<svelte:head>
  <title>IPMS - Intellectual Property Management System</title>
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";
  import { computeHealthScore, healthLabel } from "../../../features/analytics/helpers";
  import { statusConfig, typeLabels, formatDate, cleanTitle, countryFlag } from "../../../features/assets/helpers";
  import { countUp, flashlight, inView } from "$lib/animations";

  let activeType = $state("all");
  let activeStatus = $state("all");
  let activeJurisdiction = $state("all");
  let searchQuery = $state("");
  let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

  const typeFilters = [
    { id: "all", label: "All" },
    { id: "patent", label: "Patents" },
    { id: "trademark", label: "Trademarks" },
    { id: "copyright", label: "Copyrights" },
    { id: "design-right", label: "Design Rights" },
  ];

  const statusFilters = [
    { id: "all", label: "All" },
    { id: "draft", label: "Draft" },
    { id: "filed", label: "Filed" },
    { id: "published", label: "Published" },
    { id: "granted", label: "Granted" },
    { id: "expired", label: "Expired" },
    { id: "abandoned", label: "Abandoned" },
  ];

  interface PortfolioMetrics {
    totalAssets: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byJurisdiction: { code: string; name: string; count: number }[];
    expiringWithin90Days: number;
  }

  interface DeadlineMetrics {
    total: number;
    overdue: number;
    upcoming: number;
    completed: number;
    completionRate: number;
    overdueByType: Record<string, number>;
  }

  interface Asset {
    id: string;
    title: string;
    type: string;
    jurisdiction: { code: string; name: string };
    status: string;
    filingDate: string | null;
    expirationDate: string | null;
    owner: string;
    createdAt: string;
    updatedAt: string;
  }

  let portfolioMetrics = $state<PortfolioMetrics | null>(null);
  let deadlineMetrics = $state<DeadlineMetrics | null>(null);
  let assets = $state<Asset[]>([]);
  let loading = $state(true);
  let allAssets = $state<Asset[]>([]);

  const jurisdictionFilters = $derived((() => {
    const seen = new Map<string, string>();
    for (const a of allAssets) {
      if (!seen.has(a.jurisdiction.code)) {
        seen.set(a.jurisdiction.code, a.jurisdiction.name);
      }
    }
    return [
      { id: "all", label: "All" },
      ...[...seen.entries()].map(([code]) => ({
        id: code,
        label: `${countryFlag(code)} ${code}`,
      })),
    ];
  })());

  function buildFilterParams(): string {
    const params = new URLSearchParams();
    if (activeType !== "all") params.set("type", activeType);
    if (activeStatus !== "all") params.set("status", activeStatus);
    if (activeJurisdiction !== "all") params.set("jurisdiction", activeJurisdiction);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  async function fetchDashboardData() {
    loading = true;
    try {
      const qs = buildFilterParams();
      const [portfolioRes, deadlinesRes, assetsRes] = await Promise.all([
        fetch(`/api/analytics/portfolio${qs}`),
        fetch(`/api/analytics/deadlines${qs}`),
        fetch(`/api/assets${qs}`),
      ]);

      if (portfolioRes.ok) portfolioMetrics = await portfolioRes.json();
      if (deadlinesRes.ok) deadlineMetrics = await deadlinesRes.json();
      if (assetsRes.ok) assets = await assetsRes.json();
    } catch {
      // Gracefully handle fetch errors
    } finally {
      loading = false;
    }
  }

  const recentAssets = $derived(
    [...assets]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  );

  const stats = $derived([
    {
      label: "Active assets",
      value: portfolioMetrics ? String(portfolioMetrics.totalAssets) : "\u2014",
      sub: portfolioMetrics ? `${portfolioMetrics.byStatus.filed ?? 0} filed` : "\u2014",
      accent: false,
    },
    {
      label: "Granted",
      value: portfolioMetrics ? String(portfolioMetrics.byStatus.granted ?? 0) : "\u2014",
      sub: portfolioMetrics ? `${portfolioMetrics.byStatus.published ?? 0} pending grant` : "\u2014",
      accent: false,
    },
    {
      label: "Expiring soon",
      value: portfolioMetrics ? String(portfolioMetrics.expiringWithin90Days) : "\u2014",
      sub: "within 90 days",
      accent: true,
    },
  ]);

  const deadlines = $derived((() => {
    if (!deadlineMetrics) return [];
    const typeMap: Record<string, { title: string; type: string }> = {
      renewal: { title: "Patent renewals", type: "renewal" },
      response: { title: "Office action responses", type: "response" },
      filing: { title: "Filing deadlines", type: "filing" },
      review: { title: "Document reviews", type: "review" },
      custom: { title: "Custom deadlines", type: "custom" },
    };
    return Object.entries(deadlineMetrics.overdueByType)
      .filter(([, count]) => count > 0)
      .map(([type, count], i) => ({
        id: i + 1,
        title: typeMap[type]?.title ?? type,
        count,
        type: typeMap[type]?.type ?? type,
      }));
  })());

  const healthScore = $derived(
    portfolioMetrics
      ? computeHealthScore(
          portfolioMetrics.byStatus.granted ?? 0,
          portfolioMetrics.totalAssets,
          portfolioMetrics.byStatus.abandoned ?? 0
        )
      : 0
  );

  const healthLabelText = $derived(healthLabel(healthScore));

  const healthColor = $derived(
    healthScore >= 80 ? "text-emerald-400" : healthScore >= 60 ? "text-yellow-400" : "text-red-400"
  );

  const healthColorMuted = $derived(
    healthScore >= 80 ? "text-emerald-400/70" : healthScore >= 60 ? "text-yellow-400/70" : "text-red-400/70"
  );

  const healthBarFrom = $derived(
    healthScore >= 80 ? "from-emerald-400" : healthScore >= 60 ? "from-yellow-400" : "from-red-400"
  );

  const healthBarTo = $derived(
    healthScore >= 80 ? "to-emerald-300" : healthScore >= 60 ? "to-yellow-300" : "to-red-300"
  );

  const pendingCount = $derived(
    portfolioMetrics
      ? (portfolioMetrics.byStatus.filed ?? 0) + (portfolioMetrics.byStatus.published ?? 0)
      : 0
  );

  const typeColors: Record<string, string> = {
    renewal: "bg-amber-100 text-amber-600",
    response: "bg-red-100 text-red-600",
    filing: "bg-blue-100 text-blue-600",
    review: "bg-purple-100 text-purple-600",
    custom: "bg-gray-100 text-gray-600",
  };

  let initialized = $state(false);

  onMount(async () => {
    try {
      const res = await fetch("/api/assets");
      if (res.ok) allAssets = await res.json();
    } catch {
      // Gracefully handle
    }
    await fetchDashboardData();
    initialized = true;
  });

  $effect(() => {
    // Track these reactive values to trigger re-fetch
    activeType;
    activeStatus;
    activeJurisdiction;
    if (!initialized) return;
    fetchDashboardData();
  });
</script>

<!-- Hero Section -->
<div class="bg-gradient-to-b from-[#f0ecff] to-[#f7f7f8] pb-6">
  <div class="mx-auto max-w-[1400px] px-4 md:px-6 pt-8">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Dashboard</h1>
      <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Overview of your intellectual property portfolio</p>
    </div>

    <!-- Filters -->
    <div class="mt-5 flex flex-wrap items-center gap-3">
      <!-- Type Chips -->
      <div class="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
        {#each typeFilters as filter}
          <button
            class="rounded-full border px-3 py-1 text-xs font-medium transition-colors {activeType === filter.id
              ? 'border-[var(--color-neutral-900)] bg-white text-[var(--color-neutral-900)] shadow-sm'
              : 'border-[var(--border-color)] bg-white/60 text-[var(--color-neutral-500)] hover:bg-white hover:text-[var(--color-neutral-700)]'}"
            onclick={() => (activeType = filter.id)}
          >
            {filter.label}
          </button>
        {/each}
      </div>

      <div class="h-4 w-px bg-[var(--border-color)]"></div>

      <!-- Status Dropdown -->
      <select
        class="rounded-full border border-[var(--border-color)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-neutral-600)] shadow-sm outline-none transition-colors hover:border-[var(--color-neutral-400)] focus:border-[var(--color-neutral-900)]"
        bind:value={activeStatus}
      >
        {#each statusFilters as filter}
          <option value={filter.id}>{filter.id === "all" ? "All statuses" : filter.label}</option>
        {/each}
      </select>

      <!-- Jurisdiction Dropdown -->
      <select
        class="rounded-full border border-[var(--border-color)] bg-white px-3 py-1 text-xs font-medium text-[var(--color-neutral-600)] shadow-sm outline-none transition-colors hover:border-[var(--color-neutral-400)] focus:border-[var(--color-neutral-900)]"
        bind:value={activeJurisdiction}
      >
        {#each jurisdictionFilters as filter}
          <option value={filter.id}>{filter.id === "all" ? "All regions" : filter.label}</option>
        {/each}
      </select>
    </div>

    <!-- Search Bar -->
    <div class="mt-5 max-w-2xl">
      <div class="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-white px-4 py-2.5 shadow-sm">
        <svg class="h-5 w-5 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <input
          type="text"
          placeholder="Search for assets, portfolios, deadlines or documents..."
          class="w-full bg-transparent text-sm text-[var(--color-neutral-800)] outline-none placeholder:text-[var(--color-neutral-400)]"
          bind:value={searchQuery}
          oninput={() => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
              if (initialized) fetchDashboardData();
            }, 300);
          }}
        />
        {#if searchQuery}
          <button
            aria-label="Clear search"
            class="text-[var(--color-neutral-300)] hover:text-[var(--color-neutral-500)]"
            onclick={() => { searchQuery = ""; if (initialized) fetchDashboardData(); }}
          >
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        {/if}
      </div>
    </div>
  </div>
</div>

<!-- Dashboard Content -->
<div class="mx-auto max-w-[1400px] px-4 md:px-6 pb-12">
  <div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">

    <!-- Asset Tracker -->
    <div use:inView={{ delay: 0 }} use:flashlight class="order-2 lg:order-1 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
          <svg class="h-4.5 w-4.5 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
        </div>
        <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Asset tracker</h2>
      </div>

      <div class="mt-5 grid grid-cols-3 gap-2 md:gap-4">
        {#if loading}
          {#each [0, 1, 2] as _}
            <div class="rounded-xl border border-[var(--border-color)] px-3 py-3 lg:px-5 lg:py-4">
              <div class="skeleton h-4 w-20"></div>
              <div class="skeleton mt-2 h-8 w-16"></div>
              <div class="skeleton mt-2 h-3 w-14"></div>
            </div>
          {/each}
        {:else}
          {#each stats as stat, i}
            <div
              use:inView={{ delay: i * 80 }}
              class="rounded-xl border px-3 py-3 lg:px-5 lg:py-4 {stat.accent ? 'border-amber-200 bg-amber-50/50' : 'border-[var(--border-color)]'}"
            >
              <p class="text-sm {stat.accent ? 'font-medium text-amber-600' : 'text-[var(--color-neutral-500)]'}">{stat.label}</p>
              <p class="mt-1 text-2xl lg:text-3xl font-bold text-[var(--color-neutral-900)]">
                {#if stat.value !== "\u2014"}
                  <span use:countUp={parseInt(stat.value)}></span>
                {:else}
                  {stat.value}
                {/if}
              </p>
              <p class="mt-1 text-xs text-[var(--color-neutral-400)]">{stat.sub}</p>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <!-- Portfolio Health -->
    <div use:inView={{ delay: 0 }} use:flashlight class="order-1 lg:order-2 rounded-2xl border border-[var(--border-color)] bg-[#2d1b69] p-6 shadow-sm">
      <div class="flex h-full flex-col">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-white">Portfolio health</h2>
          {#if loading}
            <div class="skeleton-dark h-7 w-12"></div>
          {:else}
            <span class="text-2xl font-bold {healthColor}">{healthScore}%</span>
          {/if}
        </div>
        {#if !loading}
          <p class="mt-0.5 text-right text-xs uppercase tracking-wider {healthColorMuted}">{healthLabelText.toLowerCase()}</p>
        {/if}
        <div class="mt-auto pt-4">
          <div class="h-2 overflow-hidden rounded-full bg-white/10">
            {#if loading}
              <div class="skeleton-dark h-full w-full rounded-full"></div>
            {:else}
              <div class="animate-gauge-fill h-full rounded-full bg-gradient-to-r {healthBarFrom} {healthBarTo}" style="width: {healthScore}%"></div>
            {/if}
          </div>
          <div class="mt-4 grid grid-cols-3 gap-3">
            <div class="text-center">
              {#if loading}
                <div class="skeleton-dark mx-auto h-5 w-8"></div>
              {:else}
                <p class="text-lg font-bold text-white">{portfolioMetrics?.byStatus.granted ?? 0}</p>
              {/if}
              <p class="text-xs text-white/50">Granted</p>
            </div>
            <div class="text-center">
              {#if loading}
                <div class="skeleton-dark mx-auto h-5 w-8"></div>
              {:else}
                <p class="text-lg font-bold text-white">{pendingCount}</p>
              {/if}
              <p class="text-xs text-white/50">Pending</p>
            </div>
            <div class="text-center">
              {#if loading}
                <div class="skeleton-dark mx-auto h-5 w-8"></div>
              {:else}
                <p class="text-lg font-bold text-white">{portfolioMetrics?.expiringWithin90Days ?? 0}</p>
              {/if}
              <p class="text-xs text-amber-400">Expiring</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Assets -->
    <div use:inView={{ delay: 100 }} use:flashlight class="order-4 lg:order-3 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
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
          <!-- Mobile: compact list -->
          <div class="flex flex-col lg:hidden">
            {#if loading}
              {#each [0, 1, 2, 3, 4] as _}
                <div class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0">
                  <div>
                    <div class="skeleton h-4 w-40"></div>
                    <div class="skeleton mt-1.5 h-3 w-28"></div>
                  </div>
                  <div class="skeleton h-4 w-4"></div>
                </div>
              {/each}
            {:else if recentAssets.length === 0}
              <div class="py-8 text-center text-sm text-[var(--color-neutral-400)]">No assets yet</div>
            {:else}
              {#each recentAssets as asset}
                <a href="/assets/{asset.id}" class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0 min-h-[var(--touch-target-min)] active:bg-[var(--color-neutral-50)] transition-colors">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-[var(--color-neutral-900)]">{cleanTitle(asset.title)}</p>
                    <div class="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-neutral-400)]">
                      <span>{countryFlag(asset.jurisdiction.code)}</span>
                      <span>{typeLabels[asset.type] ?? asset.type}</span>
                      <span class="text-[var(--color-neutral-200)]">·</span>
                      {#if statusConfig[asset.status]}
                        <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium {statusConfig[asset.status].bg} {statusConfig[asset.status].text}">{statusConfig[asset.status].label}</span>
                      {/if}
                      <span class="ml-auto">{formatDate(asset.updatedAt)}</span>
                    </div>
                  </div>
                  <svg class="ml-2 h-4 w-4 flex-shrink-0 text-[var(--color-neutral-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
                </a>
              {/each}
            {/if}
          </div>
          <!-- Desktop: table -->
          <div class="hidden lg:block">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[var(--border-color)]">
                <th class="w-[40%] pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Name</th>
                <th class="w-[15%] pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Type</th>
                <th class="w-[10%] pb-3 text-center text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Jurisdiction</th>
                <th class="w-[15%] pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Status</th>
                <th class="w-[20%] pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Date</th>
              </tr>
            </thead>
            <tbody>
              {#if loading}
                {#each [0, 1, 2, 3, 4] as _}
                  <tr class="border-b border-[var(--border-color)] last:border-0">
                    <td class="py-3.5 pr-4"><div class="skeleton h-4 w-40"></div></td>
                    <td class="py-3.5 pr-4"><div class="skeleton h-4 w-16"></div></td>
                    <td class="py-3.5 text-center"><div class="skeleton mx-auto h-5 w-5 !rounded-full"></div></td>
                    <td class="py-3.5 pr-4"><div class="skeleton h-5 w-16 !rounded-full"></div></td>
                    <td class="py-3.5 text-right"><div class="skeleton ml-auto h-4 w-20"></div></td>
                  </tr>
                {/each}
              {:else if recentAssets.length === 0}
                <tr>
                  <td colspan="5" class="py-8 text-center text-sm text-[var(--color-neutral-400)]">No assets yet</td>
                </tr>
              {:else}
                {#each recentAssets as asset}
                  <tr use:flashlight class="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--color-neutral-50)]">
                    <td class="py-3.5 pr-4">
                      <a href="/assets/{asset.id}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)]">{cleanTitle(asset.title)}</a>
                    </td>
                    <td class="py-3.5 pr-4 text-sm text-[var(--color-neutral-500)]">{typeLabels[asset.type] ?? asset.type}</td>
                    <td class="py-3.5 text-center">
                      <span class="text-base leading-none" title={asset.jurisdiction.code}>{countryFlag(asset.jurisdiction.code)}</span>
                    </td>
                    <td class="py-3.5 pr-4">
                      {#if statusConfig[asset.status]}
                        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusConfig[asset.status].bg} {statusConfig[asset.status].text}">{statusConfig[asset.status].label}</span>
                      {:else}
                        <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)]">{asset.status}</span>
                      {/if}
                    </td>
                    <td class="py-3.5 text-right text-sm text-[var(--color-neutral-400)]">{formatDate(asset.updatedAt)}</td>
                  </tr>
                {/each}
              {/if}
            </tbody>
          </table>
          </div>
        </div>
      </div>

    <!-- For You Today -->
    <div use:inView={{ delay: 100 }} use:flashlight class="order-3 lg:order-4 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
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
          {#if loading}
            {#each [0, 1, 2] as _}
              <div class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0 min-h-[var(--touch-target-min)]">
                <div class="flex items-center gap-3">
                  <div class="skeleton h-9 w-9 !rounded-xl"></div>
                  <div class="skeleton h-4 w-32"></div>
                </div>
                <div class="skeleton h-6 w-14 !rounded-full"></div>
              </div>
            {/each}
          {:else if deadlines.length === 0}
            <div class="py-4 text-center text-sm text-[var(--color-neutral-400)]">No overdue deadlines</div>
          {:else}
            {#each deadlines as deadline}
              <div class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0 min-h-[var(--touch-target-min)]">
                <div class="flex items-center gap-3">
                  <div class="relative">
                    <div class="flex h-9 w-9 items-center justify-center rounded-xl {typeColors[deadline.type] ?? 'bg-gray-100 text-gray-600'}">
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
                <button class="rounded-full border border-[var(--border-color)] px-4 py-2 lg:px-3 lg:py-1 text-xs font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-800)]">
                  Review
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>
  </div>
</div>
