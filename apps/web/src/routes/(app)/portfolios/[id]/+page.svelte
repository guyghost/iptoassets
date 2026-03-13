<svelte:head>
  <title>{portfolio ? portfolio.name : "Portfolio"} - Portfolios - IPMS</title>
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { statusConfig, typeLabels, formatDate, countryFlag } from "../../../../features/assets/helpers";

  interface Portfolio {
    id: string;
    name: string;
    description: string;
    assetIds: string[];
    owner: string;
    organizationId: string;
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

  let portfolio = $state<Portfolio | null>(null);
  let assets = $state<Asset[]>([]);
  let loading = $state(true);
  let showDeleteConfirm = $state(false);
  let deleting = $state(false);
  let financials = $state<any>(null);
  let projections = $state<any[]>([]);
  let financialsLoading = $state(true);

  const portfolioId = $derived($page.params.id);

  const portfolioAssets = $derived(
    portfolio ? assets.filter((a) => portfolio.assetIds.includes(a.id)) : []
  );

  const assetsByType = $derived(
    portfolioAssets.reduce<Record<string, number>>((acc, a) => {
      const label = typeLabels[a.type] ?? a.type;
      acc[label] = (acc[label] ?? 0) + 1;
      return acc;
    }, {})
  );

  const typeColorConfig: Record<string, { bg: string; text: string }> = {
    Patent: { bg: "bg-blue-50", text: "text-blue-700" },
    Trademark: { bg: "bg-purple-50", text: "text-purple-700" },
    Copyright: { bg: "bg-amber-50", text: "text-amber-700" },
    "Design Right": { bg: "bg-teal-50", text: "text-teal-700" },
  };

  onMount(async () => {
    try {
      const [portfolioRes, assetsRes] = await Promise.all([
        fetch(`/api/portfolios/${portfolioId}`),
        fetch("/api/assets"),
      ]);
      if (portfolioRes.ok) portfolio = await portfolioRes.json();
      if (assetsRes.ok) assets = await assetsRes.json();
    } catch {
      // Gracefully handle
    } finally {
      loading = false;
    }

    try {
      const [finRes, projRes] = await Promise.all([
        fetch(`/api/portfolios/${portfolioId}/financials`),
        fetch(`/api/portfolios/${portfolioId}/projections?years=5`),
      ]);
      if (finRes.ok) financials = await finRes.json();
      if (projRes.ok) projections = await projRes.json();
    } catch {
      // Gracefully handle
    } finally {
      financialsLoading = false;
    }
  });

  function formatCost(amount: number): string {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }

  async function handleDelete() {
    deleting = true;
    try {
      const res = await fetch(`/api/portfolios/${portfolioId}`, { method: "DELETE" });
      if (res.ok) {
        goto("/portfolios");
      }
    } catch {
      // Gracefully handle
    } finally {
      deleting = false;
    }
  }
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

    {#if loading}
      <!-- Loading skeleton -->
      <div class="mt-4">
        <div class="flex items-center gap-3">
          <div class="skeleton h-10 w-10 !rounded-lg"></div>
          <div>
            <div class="skeleton h-7 w-56"></div>
            <div class="skeleton mt-1 h-4 w-32"></div>
          </div>
        </div>
        <div class="skeleton mt-3 h-4 w-96"></div>
      </div>

      <div class="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {#each [0, 1, 2] as _}
          <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
            <div class="skeleton h-4 w-24"></div>
            <div class="skeleton mt-3 h-8 w-12"></div>
          </div>
        {/each}
      </div>

      <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
        <div class="skeleton h-5 w-40"></div>
        <div class="mt-4 flex flex-col gap-3">
          {#each [0, 1, 2, 3] as _}
            <div class="skeleton h-12 w-full"></div>
          {/each}
        </div>
      </div>
    {:else if !portfolio}
      <div class="mt-12 flex flex-col items-center justify-center rounded-2xl border border-[var(--border-color)] bg-white py-16 shadow-sm">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-neutral-100)]">
          <svg class="h-7 w-7 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
        </div>
        <h3 class="mt-4 text-base font-semibold text-[var(--color-neutral-900)]">Portfolio not found</h3>
        <p class="mt-1 text-sm text-[var(--color-neutral-500)]">This portfolio doesn't exist or you don't have access.</p>
        <a href="/portfolios" class="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]">
          Back to Portfolios
        </a>
      </div>
    {:else}
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
          <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{portfolioAssets.length}</p>
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

        {#if portfolioAssets.length > 0}
          <div class="mt-4 overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-[var(--border-color)]">
                  <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Name</th>
                  <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Type</th>
                  <th class="pb-3 text-center text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Jurisdiction</th>
                  <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Status</th>
                  <th class="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Filing Date</th>
                </tr>
              </thead>
              <tbody>
                {#each portfolioAssets as asset}
                  <tr class="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--color-neutral-50)]">
                    <td class="py-3.5 pr-4">
                      <a href="/assets/{asset.id}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)]">{asset.title}</a>
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
                    <td class="py-3.5 text-right text-sm text-[var(--color-neutral-400)]">{asset.filingDate ? formatDate(asset.filingDate) : "\u2014"}</td>
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

      <!-- Portfolio Financials -->
      {#if financials}
      <div class="mt-8">
        <h2 class="text-lg font-semibold text-[var(--color-neutral-900)]">Portfolio Financials</h2>

        <!-- Stats cards row -->
        <div class="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <!-- Total Annual Cost -->
          <div class="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-emerald-600">Annual Cost</p>
            <p class="mt-2 text-2xl font-bold text-[var(--color-neutral-900)]">{formatCost(financials.totalAnnualCost)} EUR</p>
            <p class="mt-1 text-xs text-[var(--color-neutral-400)]">renewed this year</p>
          </div>

          <!-- Pending Cost -->
          <div class="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-amber-600">Pending</p>
            <p class="mt-2 text-2xl font-bold text-[var(--color-neutral-900)]">{formatCost(financials.totalPendingCost)} EUR</p>
            <p class="mt-1 text-xs text-[var(--color-neutral-400)]">{financials.pendingCount} decisions pending</p>
          </div>

          <!-- Decisions Made -->
          <div class="rounded-2xl border border-[var(--border-color)] bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-[var(--color-neutral-600)]">Decisions</p>
            <p class="mt-2 text-2xl font-bold text-[var(--color-neutral-900)]">{financials.renewedCount + financials.abandonedCount}</p>
            <p class="mt-1 text-xs text-[var(--color-neutral-400)]">{financials.renewedCount} renewed, {financials.abandonedCount} abandoned</p>
          </div>

          <!-- Savings -->
          <div class="rounded-2xl border border-indigo-200 bg-white p-5 shadow-sm">
            <p class="text-sm font-medium text-indigo-600">Savings</p>
            <p class="mt-2 text-2xl font-bold text-[var(--color-neutral-900)]">{formatCost(financials.savedByAbandoning)} EUR</p>
            <p class="mt-1 text-xs text-[var(--color-neutral-400)]">by abandoning low-value patents</p>
          </div>
        </div>

        <!-- Jurisdiction Breakdown -->
        {#if Object.keys(financials.costByJurisdiction).length > 0}
        <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h3 class="text-base font-semibold text-[var(--color-neutral-900)]">Cost by Jurisdiction</h3>
          <div class="mt-4 flex flex-col gap-3">
            {#each Object.entries(financials.costByJurisdiction).sort((a, b) => (b[1] as number) - (a[1] as number)) as [jurisdiction, cost]}
              {@const total = financials.totalAnnualCost + financials.totalPendingCost}
              {@const percentage = total > 0 ? ((cost as number) / total * 100) : 0}
              <div class="flex items-center gap-3">
                <span class="w-8 text-sm font-medium text-[var(--color-neutral-700)]">{jurisdiction}</span>
                <div class="flex-1 h-6 bg-[var(--color-neutral-100)] rounded-full overflow-hidden">
                  <div class="h-full bg-[var(--color-primary-500)] rounded-full transition-all" style="width: {percentage}%"></div>
                </div>
                <span class="w-24 text-right text-sm font-medium text-[var(--color-neutral-700)]">{formatCost(cost as number)} EUR</span>
                <span class="w-12 text-right text-xs text-[var(--color-neutral-400)]">{percentage.toFixed(0)}%</span>
              </div>
            {/each}
          </div>
        </div>
        {/if}

        <!-- Cost Projections -->
        {#if projections.length > 0}
        <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <h3 class="text-base font-semibold text-[var(--color-neutral-900)]">5-Year Cost Projection</h3>
          <div class="mt-4">
            <div class="flex flex-col gap-2">
              {#each projections as proj}
                {@const maxCost = Math.max(...projections.map(p => p.totalCost), 1)}
                {@const barWidth = (proj.totalCost / maxCost) * 100}
                <div class="flex items-center gap-3">
                  <span class="w-12 text-sm font-medium text-[var(--color-neutral-700)]">{proj.year}</span>
                  <div class="flex-1 h-8 bg-[var(--color-neutral-100)] rounded-lg overflow-hidden">
                    <div class="h-full bg-gradient-to-r from-[var(--color-primary-400)] to-[var(--color-primary-600)] rounded-lg transition-all" style="width: {barWidth}%"></div>
                  </div>
                  <span class="w-28 text-right text-sm font-bold text-[var(--color-neutral-900)]">{formatCost(proj.totalCost)} EUR</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
        {/if}
      </div>
      {/if}

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
              <button
                disabled={deleting}
                class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                onclick={handleDelete}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
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
    {/if}
  </div>
</div>
