<svelte:head>
  <title>IP Assets - IPMS</title>
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";
  import { filterAssets, type AssetFilter, type IPAsset } from "@ipms/domain";
  import { statusConfig, typeLabels, filters, formatDate } from "../../features/assets/helpers";

  // --- State ---
  let assets = $state<IPAsset[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // Filter state
  let activeTypeFilter = $state("all");
  let searchQuery = $state("");
  let selectedJurisdiction = $state("");
  let selectedOwner = $state("");

  // Sort state
  let sortColumn = $state<string>("title");
  let sortDirection = $state<"asc" | "desc">("asc");

  // --- Derived ---
  let jurisdictions = $derived(
    [...new Set(assets.map((a) => a.jurisdiction.code))].sort()
  );

  let owners = $derived(
    [...new Set(assets.map((a) => a.owner))].sort()
  );

  let assetFilter = $derived<AssetFilter>({
    type: activeTypeFilter === "all" ? undefined : [activeTypeFilter as any],
    search: searchQuery || undefined,
    jurisdiction: selectedJurisdiction || undefined,
    owner: selectedOwner || undefined,
  });

  let filteredAssets = $derived(filterAssets(assets, assetFilter));

  let sortedAssets = $derived.by(() => {
    const sorted = [...filteredAssets];
    sorted.sort((a, b) => {
      let aVal: string;
      let bVal: string;
      switch (sortColumn) {
        case "title":
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        case "jurisdiction":
          aVal = a.jurisdiction.code;
          bVal = b.jurisdiction.code;
          break;
        case "status":
          aVal = a.status;
          bVal = b.status;
          break;
        case "owner":
          aVal = a.owner.toLowerCase();
          bVal = b.owner.toLowerCase();
          break;
        case "date":
          aVal = (a.filingDate ?? a.createdAt ?? "").toString();
          bVal = (b.filingDate ?? b.createdAt ?? "").toString();
          break;
        default:
          aVal = "";
          bVal = "";
      }
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  });

  // Stats from filtered data
  let totalCount = $derived(filteredAssets.length);
  let draftCount = $derived(filteredAssets.filter((a) => a.status === "draft").length);
  let filedCount = $derived(filteredAssets.filter((a) => a.status === "filed").length);
  let grantedCount = $derived(filteredAssets.filter((a) => a.status === "granted").length);
  let expiredCount = $derived(filteredAssets.filter((a) => a.status === "expired").length);

  function toggleSort(column: string) {
    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }
  }

  function sortIndicator(column: string): string {
    if (sortColumn !== column) return "";
    return sortDirection === "asc" ? " \u2191" : " \u2193";
  }

  onMount(async () => {
    try {
      const res = await fetch("/api/assets");
      if (!res.ok) {
        error = "Failed to load assets";
        return;
      }
      const data = await res.json();
      // Parse date strings back into Date objects for filterAssets compatibility
      assets = data.map((a: any) => ({
        ...a,
        filingDate: a.filingDate ? new Date(a.filingDate) : null,
        expirationDate: a.expirationDate ? new Date(a.expirationDate) : null,
        createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
        updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
      }));
    } catch (e) {
      error = "Failed to load assets";
    } finally {
      loading = false;
    }
  });
</script>

<div class="min-h-screen bg-[#f7f7f8]">
  <div class="mx-auto max-w-[1400px] px-6 py-8">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">IP Assets</h1>
        <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Manage your intellectual property portfolio</p>
      </div>
      <button class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-700)] transition-colors">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
        New Asset
      </button>
    </div>

    <!-- Search Input -->
    <div class="mt-6">
      <input
        type="text"
        placeholder="Search assets by title..."
        class="w-full rounded-lg border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] transition-colors"
        bind:value={searchQuery}
      />
    </div>

    <!-- Filter Pills -->
    <div class="mt-4 flex items-center gap-2">
      {#each filters as filter}
        <button
          class="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors {activeTypeFilter === filter.id
            ? 'border-[var(--color-neutral-900)] bg-white text-[var(--color-neutral-900)] shadow-sm'
            : 'border-[var(--border-color)] bg-white/60 text-[var(--color-neutral-500)] hover:bg-white hover:text-[var(--color-neutral-700)]'}"
          onclick={() => (activeTypeFilter = filter.id)}
        >
          {filter.label}
        </button>
      {/each}
    </div>

    <!-- Dropdown Filters -->
    <div class="mt-4 flex items-center gap-4">
      <select
        class="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm text-[var(--color-neutral-700)] outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] transition-colors"
        bind:value={selectedJurisdiction}
      >
        <option value="">All Jurisdictions</option>
        {#each jurisdictions as code}
          <option value={code}>{code}</option>
        {/each}
      </select>
      <select
        class="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2 text-sm text-[var(--color-neutral-700)] outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)] transition-colors"
        bind:value={selectedOwner}
      >
        <option value="">All Owners</option>
        {#each owners as owner}
          <option value={owner}>{owner}</option>
        {/each}
      </select>
    </div>

    {#if loading}
      <!-- Loading State -->
      <div class="mt-6 flex items-center justify-center py-20">
        <div class="flex flex-col items-center gap-3">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-neutral-300)] border-t-[var(--color-primary-600)]"></div>
          <p class="text-sm text-[var(--color-neutral-500)]">Loading assets...</p>
        </div>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p class="text-sm text-red-600">{error}</p>
      </div>
    {:else}
      <!-- Stats Row -->
      <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
            <svg class="h-4.5 w-4.5 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
          </div>
          <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Overview</h2>
        </div>

        <div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
            <p class="text-sm text-[var(--color-neutral-500)]">Total</p>
            <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{totalCount}</p>
          </div>
          <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
            <p class="text-sm text-[var(--color-neutral-500)]">Draft</p>
            <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{draftCount}</p>
          </div>
          <div class="rounded-xl border border-blue-200 bg-blue-50/50 px-5 py-4">
            <p class="text-sm font-medium text-blue-600">Filed</p>
            <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{filedCount}</p>
          </div>
          <div class="rounded-xl border border-emerald-200 bg-emerald-50/50 px-5 py-4">
            <p class="text-sm font-medium text-emerald-600">Granted</p>
            <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{grantedCount}</p>
          </div>
          <div class="rounded-xl border border-amber-200 bg-amber-50/50 px-5 py-4">
            <p class="text-sm font-medium text-amber-600">Expired</p>
            <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{expiredCount}</p>
          </div>
        </div>
      </div>

      <!-- Assets Table -->
      <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <svg class="h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          </div>
          <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Assets</h2>
          <span class="ml-1 text-sm text-[var(--color-neutral-400)]">({filteredAssets.length})</span>
        </div>

        {#if sortedAssets.length === 0}
          <!-- Empty State -->
          <div class="mt-8 flex flex-col items-center justify-center py-12">
            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-neutral-100)]">
              <svg class="h-8 w-8 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 3H9.75m0-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            </div>
            <h3 class="mt-4 text-base font-semibold text-[var(--color-neutral-900)]">No assets found</h3>
            <p class="mt-1 text-sm text-[var(--color-neutral-500)]">No assets match the current filters. Try adjusting your search or filters.</p>
          </div>
        {:else}
          <div class="mt-4 overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-[var(--border-color)]">
                  <th class="cursor-pointer select-none pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]" onclick={() => toggleSort("title")}>Name{sortIndicator("title")}</th>
                  <th class="cursor-pointer select-none pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]" onclick={() => toggleSort("type")}>Type{sortIndicator("type")}</th>
                  <th class="cursor-pointer select-none pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]" onclick={() => toggleSort("jurisdiction")}>Jurisdiction{sortIndicator("jurisdiction")}</th>
                  <th class="cursor-pointer select-none pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]" onclick={() => toggleSort("status")}>Status{sortIndicator("status")}</th>
                  <th class="cursor-pointer select-none pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]" onclick={() => toggleSort("owner")}>Owner{sortIndicator("owner")}</th>
                  <th class="cursor-pointer select-none pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]" onclick={() => toggleSort("date")}>Date{sortIndicator("date")}</th>
                </tr>
              </thead>
              <tbody>
                {#each sortedAssets as asset}
                  <tr class="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--color-neutral-50)]">
                    <td class="py-3.5">
                      <a href="/assets/{asset.id}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)]">{asset.title}</a>
                    </td>
                    <td class="py-3.5 text-sm text-[var(--color-neutral-500)]">{typeLabels[asset.type] ?? asset.type}</td>
                    <td class="py-3.5">
                      <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">{asset.jurisdiction.code}</span>
                    </td>
                    <td class="py-3.5">
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusConfig[asset.status].bg} {statusConfig[asset.status].text}">{statusConfig[asset.status].label}</span>
                    </td>
                    <td class="py-3.5 text-sm text-[var(--color-neutral-500)]">{asset.owner}</td>
                    <td class="py-3.5 text-right text-sm text-[var(--color-neutral-400)]">{formatDate(asset.filingDate || asset.createdAt)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
