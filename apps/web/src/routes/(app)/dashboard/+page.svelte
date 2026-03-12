<svelte:head>
  <title>IPMS - Intellectual Property Management System</title>
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";
  import { computeHealthScore, healthLabel } from "../../../features/analytics/helpers";
  import { statusConfig, typeLabels, formatDate, cleanTitle } from "../../../features/assets/helpers";

  let activeFilter = $state("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "patents", label: "Patents" },
    { id: "trademarks", label: "Trademarks" },
    { id: "copyrights", label: "Copyrights" },
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

  onMount(async () => {
    try {
      const [portfolioRes, deadlinesRes, assetsRes] = await Promise.all([
        fetch("/api/analytics/portfolio"),
        fetch("/api/analytics/deadlines"),
        fetch("/api/assets"),
      ]);

      if (portfolioRes.ok) {
        portfolioMetrics = await portfolioRes.json();
      }
      if (deadlinesRes.ok) {
        deadlineMetrics = await deadlinesRes.json();
      }
      if (assetsRes.ok) {
        assets = await assetsRes.json();
      }
    } catch {
      // Gracefully handle fetch errors - dashboard will show loading placeholders
    } finally {
      loading = false;
    }
  });
</script>

<!-- Hero Section -->
<div class="bg-gradient-to-b from-[#f0ecff] to-[#f7f7f8] pb-6">
  <div class="mx-auto max-w-[1400px] px-6 pt-8">
    <!-- Page Header -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Dashboard</h1>
      <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Overview of your intellectual property portfolio</p>
    </div>

    <!-- Filter Pills -->
    <div class="mt-5 flex items-center gap-2">
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
    <div class="mt-5 max-w-2xl">
      <div class="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-white px-4 py-2.5 shadow-sm">
        <svg class="h-5 w-5 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/></svg>
        <input type="text" placeholder="Search for assets, portfolios, deadlines or documents..." class="w-full bg-transparent text-sm text-[var(--color-neutral-800)] outline-none placeholder:text-[var(--color-neutral-400)]" />
        <button aria-label="Clear search" class="text-[var(--color-neutral-300)] hover:text-[var(--color-neutral-500)]">
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
              {#if loading}
                <tr>
                  <td colspan="5" class="py-8 text-center text-sm text-[var(--color-neutral-400)]">{"\u2014"}</td>
                </tr>
              {:else if recentAssets.length === 0}
                <tr>
                  <td colspan="5" class="py-8 text-center text-sm text-[var(--color-neutral-400)]">No assets yet</td>
                </tr>
              {:else}
                {#each recentAssets as asset}
                  <tr class="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--color-neutral-50)]">
                    <td class="py-3.5">
                      <a href="/assets/{asset.id}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)]">{cleanTitle(asset.title)}</a>
                    </td>
                    <td class="py-3.5 text-sm text-[var(--color-neutral-500)]">{typeLabels[asset.type] ?? asset.type}</td>
                    <td class="py-3.5">
                      <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">{asset.jurisdiction.code}</span>
                    </td>
                    <td class="py-3.5">
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
          {#if loading}
            <div class="py-4 text-center text-sm text-[var(--color-neutral-400)]">{"\u2014"}</div>
          {:else if deadlines.length === 0}
            <div class="py-4 text-center text-sm text-[var(--color-neutral-400)]">No overdue deadlines</div>
          {:else}
            {#each deadlines as deadline}
              <div class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0">
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
                <button class="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-800)]">
                  Review
                </button>
              </div>
            {/each}
          {/if}
        </div>
      </div>

      <!-- Portfolio Overview -->
      <div class="rounded-2xl border border-[var(--border-color)] bg-[#2d1b69] p-6 shadow-sm">
        <div class="flex items-center justify-between">
          <h2 class="text-base font-semibold text-white">Portfolio health</h2>
          <span class="text-2xl font-bold {healthColor}">{loading ? "\u2014" : `${healthScore}%`}</span>
        </div>
        <p class="mt-0.5 text-right text-xs uppercase tracking-wider {healthColorMuted}">{loading ? "" : healthLabelText.toLowerCase()}</p>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-gradient-to-r {healthBarFrom} {healthBarTo}" style="width: {loading ? 0 : healthScore}%"></div>
        </div>
        <div class="mt-4 grid grid-cols-3 gap-3">
          <div class="text-center">
            <p class="text-lg font-bold text-white">{portfolioMetrics ? portfolioMetrics.byStatus.granted ?? 0 : "\u2014"}</p>
            <p class="text-xs text-white/50">Granted</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-white">{portfolioMetrics ? pendingCount : "\u2014"}</p>
            <p class="text-xs text-white/50">Pending</p>
          </div>
          <div class="text-center">
            <p class="text-lg font-bold text-white">{portfolioMetrics ? portfolioMetrics.expiringWithin90Days : "\u2014"}</p>
            <p class="text-xs text-amber-400">Expiring</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
