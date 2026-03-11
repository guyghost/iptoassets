<svelte:head>
  <title>IP Assets - IPMS</title>
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";
  import { filterAssets, type AssetFilter, type IPAsset } from "@ipms/domain";
  import { ASSET_STATUSES, IP_TYPES } from "@ipms/shared";
  import { statusConfig, typeLabels, filters, formatDate } from "../../features/assets/helpers";
  import * as XLSX from "xlsx";

  // --- State ---
  let assets = $state<IPAsset[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  // --- Drawer state ---
  let drawerOpen = $state(false);
  let drawerVisible = $state(false);
  let creating = $state(false);
  let createError = $state<string | null>(null);

  // Form fields
  let newTitle = $state("");
  let newType = $state<string>("patent");
  let newJurisdictionCode = $state("");
  let newJurisdictionName = $state("");
  let newOwner = $state("");

  function openDrawer() {
    drawerOpen = true;
    // Trigger animation on next frame
    requestAnimationFrame(() => { drawerVisible = true; });
  }

  function closeDrawer() {
    drawerVisible = false;
    setTimeout(() => {
      drawerOpen = false;
      resetForm();
    }, 300);
  }

  function resetForm() {
    newTitle = "";
    newType = "patent";
    newJurisdictionCode = "";
    newJurisdictionName = "";
    newOwner = "";
    createError = null;
  }

  async function handleCreate() {
    createError = null;
    if (!newTitle.trim() || !newJurisdictionCode.trim() || !newJurisdictionName.trim() || !newOwner.trim()) {
      createError = "All fields are required";
      return;
    }
    creating = true;
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: crypto.randomUUID(),
          title: newTitle.trim(),
          type: newType,
          jurisdiction: { code: newJurisdictionCode.trim().toUpperCase(), name: newJurisdictionName.trim() },
          owner: newOwner.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        createError = data.error ?? "Failed to create asset";
        return;
      }
      await fetchAssets();
      closeDrawer();
    } catch {
      createError = "Failed to create asset";
    } finally {
      creating = false;
    }
  }

  // --- Import state ---
  let importing = $state(false);
  let importMessage = $state<{ type: "success" | "error"; text: string } | null>(null);
  let fileInput: HTMLInputElement;

  function extractCountryFromTitle(title: string): { code: string; name: string } | null {
    const m = title.match(/\(([A-Z]{2})/);
    if (!m) return null;
    const code = m[1];
    const names: Record<string, string> = {
      WO: "WIPO", EP: "Europe", US: "United States", FR: "France", DE: "Germany",
      GB: "United Kingdom", JP: "Japan", CN: "China", KR: "South Korea", CA: "Canada",
      AU: "Australia", BR: "Brazil", IN: "India", RU: "Russia", MX: "Mexico",
      IL: "Israel", SG: "Singapore", TW: "Taiwan", NZ: "New Zealand", ZA: "South Africa",
    };
    return { code, name: names[code] ?? code };
  }

  function extractOwner(assignees: string): string {
    if (!assignees) return "Unknown";
    // Format: "COMPANY ([CC])" — take first assignee, strip country code
    const first = assignees.split("\n")[0].trim();
    return first.replace(/\s*\(\[.*?\]\)\s*$/, "").trim() || "Unknown";
  }

  async function handleImport() {
    const file = fileInput?.files?.[0];
    if (!file) return;

    importing = true;
    importMessage = null;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, any>>(ws);

      // Group by FAN ID — one asset per family
      const families = new Map<string, Record<string, any>>();
      for (const row of rows) {
        const fanId = String(row["Questel unique family ID (FAN)"] ?? "").trim();
        if (!fanId) continue;
        if (!families.has(fanId)) families.set(fanId, row);
      }

      let succeeded = 0;
      let failed = 0;
      for (const [, row] of families) {
        const title = String(row["English title"] ?? "").replace(/^\([^)]+\)\s*/, "").trim();
        if (!title) { failed++; continue; }

        const jurisdiction = extractCountryFromTitle(String(row["English title"] ?? ""))
          ?? { code: "WO", name: "WIPO" };
        const owner = extractOwner(String(row["Current assignees"] ?? ""));

        const res = await fetch("/api/assets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: crypto.randomUUID(),
            title,
            type: "patent",
            jurisdiction,
            owner,
          }),
        });
        if (res.ok) succeeded++;
        else failed++;
      }

      await fetchAssets();
      importMessage = { type: "success", text: `Imported ${succeeded} assets${failed > 0 ? `, ${failed} failed` : ""}` };
    } catch {
      importMessage = { type: "error", text: "Failed to parse file" };
    } finally {
      importing = false;
      if (fileInput) fileInput.value = "";
    }
  }

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

  // --- Selection state ---
  let selectedIds = $state(new Set<string>());
  let bulkMessage = $state<{ type: "success" | "error"; text: string } | null>(null);
  let bulkLoading = $state(false);

  // Portfolio state for bulk add
  let portfolios = $state<{ id: string; name: string }[]>([]);
  let portfoliosLoaded = $state(false);

  // Bulk action state
  let bulkStatusTarget = $state("");
  let bulkPortfolioTarget = $state("");

  let allSelected = $derived(sortedAssets.length > 0 && sortedAssets.every((a) => selectedIds.has(a.id)));

  function toggleSelectAll() {
    if (allSelected) {
      selectedIds = new Set();
    } else {
      selectedIds = new Set(sortedAssets.map((a) => a.id));
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    selectedIds = next;
  }

  async function fetchAssets() {
    const res = await fetch("/api/assets");
    if (!res.ok) return;
    const data = await res.json();
    assets = data.map((a: any) => ({
      ...a,
      filingDate: a.filingDate ? new Date(a.filingDate) : null,
      expirationDate: a.expirationDate ? new Date(a.expirationDate) : null,
      createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
      updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
    }));
  }

  async function loadPortfolios() {
    if (portfoliosLoaded) return;
    const res = await fetch("/api/portfolios");
    if (res.ok) {
      portfolios = await res.json();
      portfoliosLoaded = true;
    }
  }

  async function bulkChangeStatus() {
    if (!bulkStatusTarget || selectedIds.size === 0) return;
    bulkLoading = true;
    bulkMessage = null;
    try {
      const res = await fetch("/api/assets/bulk/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], status: bulkStatusTarget }),
      });
      const result = await res.json();
      if (!res.ok) {
        bulkMessage = { type: "error", text: result.error };
      } else {
        bulkMessage = { type: "success", text: `${result.succeeded} updated, ${result.failed} failed` };
        await fetchAssets();
        selectedIds = new Set();
        bulkStatusTarget = "";
      }
    } catch {
      bulkMessage = { type: "error", text: "Failed to update statuses" };
    } finally {
      bulkLoading = false;
    }
  }

  async function bulkAddToPortfolio() {
    if (!bulkPortfolioTarget || selectedIds.size === 0) return;
    bulkLoading = true;
    bulkMessage = null;
    try {
      const res = await fetch("/api/assets/bulk/portfolio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [...selectedIds], portfolioId: bulkPortfolioTarget }),
      });
      const result = await res.json();
      if (!res.ok) {
        bulkMessage = { type: "error", text: result.error };
      } else {
        bulkMessage = { type: "success", text: `${result.succeeded} added, ${result.failed} failed` };
        selectedIds = new Set();
        bulkPortfolioTarget = "";
      }
    } catch {
      bulkMessage = { type: "error", text: "Failed to add to portfolio" };
    } finally {
      bulkLoading = false;
    }
  }

  function exportCSV() {
    const params = new URLSearchParams();
    if (activeTypeFilter !== "all") params.append("type", activeTypeFilter);
    if (selectedJurisdiction) params.append("jurisdiction", selectedJurisdiction);
    if (selectedOwner) params.append("owner", selectedOwner);
    const queryString = params.toString();
    const url = `/api/export/assets.csv${queryString ? `?${queryString}` : ""}`;
    window.location.href = url;
  }

  onMount(async () => {
    try {
      await fetchAssets();
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
      <div class="flex items-center gap-3">
        <input type="file" accept=".xlsx,.xls,.csv" class="hidden" bind:this={fileInput} onchange={handleImport} />
        <button
          onclick={() => fileInput?.click()}
          disabled={importing}
          class="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] shadow-sm hover:bg-[var(--color-neutral-50)] transition-colors disabled:opacity-50"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
          {importing ? 'Importing...' : 'Import'}
        </button>
        <button
          onclick={exportCSV}
          class="inline-flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] shadow-sm hover:bg-[var(--color-neutral-50)] transition-colors"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Export CSV
        </button>
        <button
          onclick={openDrawer}
          class="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-700)] transition-colors"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 4.5v15m7.5-7.5h-15"/></svg>
          New Asset
        </button>
      </div>
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

      {#if bulkMessage}
        <div class="mt-4 rounded-lg px-4 py-2 text-sm {bulkMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">
          {bulkMessage.text}
        </div>
      {/if}

      {#if importMessage}
        <div class="mt-4 rounded-lg px-4 py-2 text-sm {importMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}">
          {importMessage.text}
        </div>
      {/if}

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
                  <th class="pb-3 w-10">
                    <input type="checkbox" checked={allSelected} onchange={toggleSelectAll} class="rounded border-[var(--border-color)]" />
                  </th>
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
                    <td class="py-3.5 w-10">
                      <input type="checkbox" checked={selectedIds.has(asset.id)} onchange={() => toggleSelect(asset.id)} class="rounded border-[var(--border-color)]" />
                    </td>
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
      {#if selectedIds.size > 0}
        <div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-white px-6 py-3 shadow-xl">
          <span class="text-sm font-medium text-[var(--color-neutral-700)]">{selectedIds.size} selected</span>

          <div class="h-6 w-px bg-[var(--border-color)]"></div>

          <!-- Change Status -->
          <div class="flex items-center gap-2">
            <select bind:value={bulkStatusTarget} class="rounded-lg border border-[var(--border-color)] bg-white px-3 py-1.5 text-sm">
              <option value="">Change status...</option>
              {#each ASSET_STATUSES as status}
                <option value={status}>{status}</option>
              {/each}
            </select>
            <button
              onclick={bulkChangeStatus}
              disabled={!bulkStatusTarget || bulkLoading}
              class="rounded-lg bg-[var(--color-primary-600)] px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-[var(--color-primary-700)]"
            >Apply</button>
          </div>

          <div class="h-6 w-px bg-[var(--border-color)]"></div>

          <!-- Add to Portfolio -->
          <div class="flex items-center gap-2">
            <select bind:value={bulkPortfolioTarget} onfocus={loadPortfolios} class="rounded-lg border border-[var(--border-color)] bg-white px-3 py-1.5 text-sm">
              <option value="">Add to portfolio...</option>
              {#each portfolios as portfolio}
                <option value={portfolio.id}>{portfolio.name}</option>
              {/each}
            </select>
            <button
              onclick={bulkAddToPortfolio}
              disabled={!bulkPortfolioTarget || bulkLoading}
              class="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-indigo-700"
            >Add</button>
          </div>

          <div class="h-6 w-px bg-[var(--border-color)]"></div>

          <button onclick={() => { selectedIds = new Set(); }} class="text-sm text-[var(--color-neutral-500)] hover:text-[var(--color-neutral-700)]">Clear</button>
        </div>
      {/if}
    {/if}
  </div>
</div>

<!-- Slide-over Drawer -->
{#if drawerOpen}
  <!-- Overlay -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 {drawerVisible ? 'opacity-100' : 'opacity-0'}"
    onclick={closeDrawer}
    onkeydown={(e) => { if (e.key === 'Escape') closeDrawer(); }}
  ></div>

  <!-- Panel -->
  <div
    class="fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-xl transition-transform duration-300 ease-out {drawerVisible ? 'translate-x-0' : 'translate-x-full'}"
  >
    <!-- Header -->
    <div class="flex items-center justify-between border-b border-[var(--border-color)] px-6 py-4">
      <h2 class="text-lg font-semibold text-[var(--color-neutral-900)]">New Asset</h2>
      <button aria-label="Close" onclick={closeDrawer} class="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-neutral-400)] hover:bg-[var(--color-neutral-100)] hover:text-[var(--color-neutral-600)]">
        <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    </div>

    <!-- Form -->
    <div class="flex flex-col gap-5 px-6 py-6">
      {#if createError}
        <div class="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{createError}</div>
      {/if}

      <div class="flex flex-col gap-1.5">
        <label for="asset-title" class="text-sm font-medium text-[var(--color-neutral-700)]">Title</label>
        <input
          id="asset-title"
          type="text"
          placeholder="e.g. Quantum Computing Method"
          bind:value={newTitle}
          class="rounded-lg border border-[var(--border-color)] px-3 py-2.5 text-sm text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="asset-type" class="text-sm font-medium text-[var(--color-neutral-700)]">Type</label>
        <select
          id="asset-type"
          bind:value={newType}
          class="rounded-lg border border-[var(--border-color)] bg-white px-3 py-2.5 text-sm text-[var(--color-neutral-900)] outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
        >
          {#each IP_TYPES as t}
            <option value={t}>{typeLabels[t] ?? t}</option>
          {/each}
        </select>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="flex flex-col gap-1.5">
          <label for="asset-jurisdiction-code" class="text-sm font-medium text-[var(--color-neutral-700)]">Jurisdiction Code</label>
          <input
            id="asset-jurisdiction-code"
            type="text"
            placeholder="e.g. US"
            bind:value={newJurisdictionCode}
            class="rounded-lg border border-[var(--border-color)] px-3 py-2.5 text-sm text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
          />
        </div>
        <div class="flex flex-col gap-1.5">
          <label for="asset-jurisdiction-name" class="text-sm font-medium text-[var(--color-neutral-700)]">Jurisdiction Name</label>
          <input
            id="asset-jurisdiction-name"
            type="text"
            placeholder="e.g. United States"
            bind:value={newJurisdictionName}
            class="rounded-lg border border-[var(--border-color)] px-3 py-2.5 text-sm text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
          />
        </div>
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="asset-owner" class="text-sm font-medium text-[var(--color-neutral-700)]">Owner</label>
        <input
          id="asset-owner"
          type="text"
          placeholder="e.g. Acme Corp"
          bind:value={newOwner}
          class="rounded-lg border border-[var(--border-color)] px-3 py-2.5 text-sm text-[var(--color-neutral-900)] placeholder-[var(--color-neutral-400)] outline-none focus:border-[var(--color-primary-400)] focus:ring-1 focus:ring-[var(--color-primary-400)]"
        />
      </div>
    </div>

    <!-- Footer -->
    <div class="absolute bottom-0 left-0 right-0 flex items-center justify-end gap-3 border-t border-[var(--border-color)] bg-white px-6 py-4">
      <button
        onclick={closeDrawer}
        class="rounded-lg border border-[var(--border-color)] bg-white px-4 py-2.5 text-sm font-medium text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-50)]"
      >Cancel</button>
      <button
        onclick={handleCreate}
        disabled={creating}
        class="rounded-lg bg-[var(--color-primary-600)] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-700)] disabled:opacity-50"
      >{creating ? 'Creating...' : 'Create Asset'}</button>
    </div>
  </div>
{/if}
