<svelte:head>
  <title>Renewal Decisions - IPMS</title>
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";

  let decisions = $state<any[]>([]);
  let loading = $state(true);
  let activeFilter = $state("all");

  const filters = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "renew", label: "Renewed" },
    { id: "abandon", label: "Abandoned" },
  ];

  onMount(async () => {
    try {
      // Auto-generate pending decisions first
      await fetch("/api/renewal-decisions/generate", { method: "POST" });
      // Then fetch all decisions
      const res = await fetch("/api/renewal-decisions");
      if (res.ok) {
        decisions = await res.json();
      }
    } catch {
      // Gracefully handle
    } finally {
      loading = false;
    }
  });

  // Derived groups
  let pendingItems = $derived(decisions.filter(d => d.decision === "pending"));
  let renewedItems = $derived(decisions.filter(d => d.decision === "renew"));
  let abandonedItems = $derived(decisions.filter(d => d.decision === "abandon"));

  // Stats
  let totalCostPending = $derived(pendingItems.reduce((sum, d) => sum + (d.estimatedCost ?? 0), 0));
  let totalSaved = $derived(abandonedItems.reduce((sum, d) => sum + (d.estimatedCost ?? 0), 0));

  // Filtered list (for non-"all" views)
  let filteredDecisions = $derived.by(() => {
    switch (activeFilter) {
      case "pending": return pendingItems;
      case "renew": return renewedItems;
      case "abandon": return abandonedItems;
      default: return decisions;
    }
  });

  // Helpers
  function formatCost(amount: number): string {
    return new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  }

  function getScoreColor(score: number): { bg: string; text: string } {
    if (score >= 67) return { bg: "bg-emerald-100", text: "text-emerald-700" };
    if (score >= 34) return { bg: "bg-amber-100", text: "text-amber-700" };
    return { bg: "bg-red-100", text: "text-red-700" };
  }

  function getRecommendation(score: number): { text: string; color: string } {
    if (score >= 67) return { text: "Renew recommended", color: "text-emerald-600" };
    if (score >= 34) return { text: "Review recommended", color: "text-amber-600" };
    return { text: "Abandon recommended", color: "text-red-600" };
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  async function handleDecision(id: string, decision: "renew" | "abandon") {
    const res = await fetch(`/api/renewal-decisions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (res.ok) {
      const refreshRes = await fetch("/api/renewal-decisions");
      if (refreshRes.ok) decisions = await refreshRes.json();
    }
  }
</script>

<!-- Page Header -->
<div class="bg-gradient-to-b from-[#f0ecff] to-[#f7f7f8] pb-6">
  <div class="mx-auto max-w-[1400px] px-6 pt-8">
    <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Renewal Decisions</h1>
    <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Review, renew, or abandon your IP assets based on renewal scores</p>

    <!-- Filter Tabs -->
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
  </div>
</div>

<!-- Dashboard Content -->
<div class="mx-auto max-w-[1400px] px-6 pb-12">

  {#if loading}
    <!-- Loading Skeleton -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {#each Array(4) as _}
        <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <div class="flex items-center gap-2.5">
            <div class="h-8 w-8 animate-pulse rounded-lg bg-[var(--color-neutral-100)]"></div>
            <div class="h-4 w-24 animate-pulse rounded bg-[var(--color-neutral-100)]"></div>
          </div>
          <div class="mt-3 h-8 w-16 animate-pulse rounded bg-[var(--color-neutral-100)]"></div>
          <div class="mt-2 h-3 w-32 animate-pulse rounded bg-[var(--color-neutral-100)]"></div>
        </div>
      {/each}
    </div>
    <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
      {#each Array(3) as _}
        <div class="flex items-center gap-4 border-b border-[var(--border-color)] py-3.5 last:border-b-0 pl-4">
          <div class="flex-1">
            <div class="h-4 w-48 animate-pulse rounded bg-[var(--color-neutral-100)]"></div>
            <div class="mt-2 h-3 w-32 animate-pulse rounded bg-[var(--color-neutral-100)]"></div>
          </div>
          <div class="h-6 w-20 animate-pulse rounded bg-[var(--color-neutral-100)]"></div>
        </div>
      {/each}
    </div>
  {:else}

    <!-- Summary Stats Row -->
    <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <div class="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-sm font-medium text-amber-600">Pending</p>
        </div>
        <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{pendingItems.length}</p>
        <p class="mt-1 text-xs text-[var(--color-neutral-400)]">awaiting decision</p>
      </div>

      <div class="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
            <svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>
          </div>
          <p class="text-sm font-medium text-red-600">Total Cost Pending</p>
        </div>
        <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{formatCost(totalCostPending)} EUR</p>
        <p class="mt-1 text-xs text-[var(--color-neutral-400)]">estimated renewal costs</p>
      </div>

      <div class="rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
            <svg class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-sm font-medium text-emerald-600">Renewed</p>
        </div>
        <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{renewedItems.length}</p>
        <p class="mt-1 text-xs text-[var(--color-neutral-400)]">assets renewed</p>
      </div>

      <div class="rounded-2xl border border-indigo-200 bg-white p-6 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
            <svg class="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-sm font-medium text-indigo-600">Saved</p>
        </div>
        <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{formatCost(totalSaved)} EUR</p>
        <p class="mt-1 text-xs text-[var(--color-neutral-400)]">costs avoided by abandoning</p>
      </div>
    </div>

    <!-- Decision Lists -->
    <div class="mt-6 flex flex-col gap-6">

      {#if activeFilter === "all"}
        <!-- Grouped View -->

        <!-- Pending Section -->
        {#if pendingItems.length > 0}
          <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
                <svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Pending Decisions</h2>
              <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{pendingItems.length}</span>
            </div>

            <div class="mt-4 flex flex-col">
              {#each pendingItems as item}
                {@const scoreColor = getScoreColor(item.score ?? 0)}
                {@const recommendation = getRecommendation(item.score ?? 0)}
                <div class="flex items-start gap-4 border-b border-[var(--border-color)] py-4 last:border-b-0 border-l-2 border-l-amber-400 pl-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <a href="/assets/{item.assetId}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)] hover:underline">{item.assetTitle ?? "Untitled Asset"}</a>
                      {#if item.assetJurisdiction}
                        <span class="inline-flex flex-shrink-0 items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{item.assetJurisdiction}</span>
                      {/if}
                      {#if item.renewalYear}
                        <span class="inline-flex flex-shrink-0 items-center rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">Year {item.renewalYear}</span>
                      {/if}
                      <span class="inline-flex flex-shrink-0 items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{formatCost(item.estimatedCost ?? 0)} EUR</span>
                    </div>
                    <div class="mt-1.5 flex items-center gap-3 text-xs text-[var(--color-neutral-400)]">
                      <span>{item.deadlineTitle ?? "Renewal"}</span>
                      {#if item.deadlineDueDate}
                        <span>-</span>
                        <span>Due {formatDate(item.deadlineDueDate)}</span>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold {scoreColor.bg} {scoreColor.text}">{item.score ?? 0}</span>
                    <span class="text-xs font-medium {recommendation.color}">{recommendation.text}</span>
                    <button
                      onclick={() => handleDecision(item.id, "renew")}
                      class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                    >
                      Renew
                    </button>
                    <button
                      onclick={() => handleDecision(item.id, "abandon")}
                      class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      Abandon
                    </button>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Renewed Section -->
        {#if renewedItems.length > 0}
          <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                <svg class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Renewed</h2>
              <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{renewedItems.length}</span>
            </div>

            <div class="mt-4 flex flex-col">
              {#each renewedItems as item}
                {@const scoreColor = getScoreColor(item.score ?? 0)}
                <div class="flex items-start gap-4 border-b border-[var(--border-color)] py-4 last:border-b-0 border-l-2 border-l-emerald-400 pl-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <a href="/assets/{item.assetId}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)] hover:underline">{item.assetTitle ?? "Untitled Asset"}</a>
                      {#if item.assetJurisdiction}
                        <span class="inline-flex flex-shrink-0 items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{item.assetJurisdiction}</span>
                      {/if}
                      {#if item.renewalYear}
                        <span class="inline-flex flex-shrink-0 items-center rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">Year {item.renewalYear}</span>
                      {/if}
                      <span class="inline-flex flex-shrink-0 items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{formatCost(item.estimatedCost ?? 0)} EUR</span>
                    </div>
                    <div class="mt-1.5 flex items-center gap-3 text-xs text-[var(--color-neutral-400)]">
                      <span>{item.deadlineTitle ?? "Renewal"}</span>
                      {#if item.deadlineDueDate}
                        <span>-</span>
                        <span>Due {formatDate(item.deadlineDueDate)}</span>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold {scoreColor.bg} {scoreColor.text}">{item.score ?? 0}</span>
                    <span class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Renewed</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Abandoned Section -->
        {#if abandonedItems.length > 0}
          <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-neutral-100)]">
                <svg class="h-4 w-4 text-[var(--color-neutral-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
              </div>
              <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Abandoned</h2>
              <span class="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">{abandonedItems.length}</span>
            </div>

            <div class="mt-4 flex flex-col">
              {#each abandonedItems as item}
                {@const scoreColor = getScoreColor(item.score ?? 0)}
                <div class="flex items-start gap-4 border-b border-[var(--border-color)] py-4 last:border-b-0 border-l-2 border-l-[var(--color-neutral-300)] pl-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <a href="/assets/{item.assetId}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)] hover:underline">{item.assetTitle ?? "Untitled Asset"}</a>
                      {#if item.assetJurisdiction}
                        <span class="inline-flex flex-shrink-0 items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{item.assetJurisdiction}</span>
                      {/if}
                      {#if item.renewalYear}
                        <span class="inline-flex flex-shrink-0 items-center rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">Year {item.renewalYear}</span>
                      {/if}
                      <span class="inline-flex flex-shrink-0 items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{formatCost(item.estimatedCost ?? 0)} EUR</span>
                    </div>
                    <div class="mt-1.5 flex items-center gap-3 text-xs text-[var(--color-neutral-400)]">
                      <span>{item.deadlineTitle ?? "Renewal"}</span>
                      {#if item.deadlineDueDate}
                        <span>-</span>
                        <span>Due {formatDate(item.deadlineDueDate)}</span>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold {scoreColor.bg} {scoreColor.text}">{item.score ?? 0}</span>
                    <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Abandoned</span>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <!-- Empty state when all groups are empty -->
        {#if pendingItems.length === 0 && renewedItems.length === 0 && abandonedItems.length === 0}
          <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
            <div class="flex flex-col items-center justify-center py-8 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-neutral-100)]">
                <svg class="h-6 w-6 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p class="mt-3 text-sm font-medium text-[var(--color-neutral-600)]">No renewal decisions found</p>
              <p class="mt-1 text-xs text-[var(--color-neutral-400)]">Generate them by creating renewal-type deadlines.</p>
            </div>
          </div>
        {/if}

      {:else}
        <!-- Filtered View (flat list) -->
        <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
              <svg class="h-4 w-4 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">
              {filters.find(f => f.id === activeFilter)?.label} decisions
            </h2>
            <span class="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">{filteredDecisions.length}</span>
          </div>

          {#if filteredDecisions.length === 0}
            <div class="mt-8 flex flex-col items-center justify-center py-8 text-center">
              <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-neutral-100)]">
                <svg class="h-6 w-6 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <p class="mt-3 text-sm font-medium text-[var(--color-neutral-600)]">No decisions found</p>
              <p class="mt-1 text-xs text-[var(--color-neutral-400)]">Nothing matches this filter right now</p>
            </div>
          {:else}
            <div class="mt-4 flex flex-col">
              {#each filteredDecisions as item}
                {@const scoreColor = getScoreColor(item.score ?? 0)}
                {@const recommendation = getRecommendation(item.score ?? 0)}
                {@const borderColor = item.decision === "pending" ? "border-l-amber-400" : item.decision === "renew" ? "border-l-emerald-400" : "border-l-[var(--color-neutral-300)]"}
                <div class="flex items-start gap-4 border-b border-[var(--border-color)] py-4 last:border-b-0 border-l-2 pl-4 {borderColor}">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                      <a href="/assets/{item.assetId}" class="text-sm font-medium text-[var(--color-neutral-900)] hover:text-[var(--color-primary-600)] hover:underline">{item.assetTitle ?? "Untitled Asset"}</a>
                      {#if item.assetJurisdiction}
                        <span class="inline-flex flex-shrink-0 items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{item.assetJurisdiction}</span>
                      {/if}
                      {#if item.renewalYear}
                        <span class="inline-flex flex-shrink-0 items-center rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">Year {item.renewalYear}</span>
                      {/if}
                      <span class="inline-flex flex-shrink-0 items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700">{formatCost(item.estimatedCost ?? 0)} EUR</span>
                    </div>
                    <div class="mt-1.5 flex items-center gap-3 text-xs text-[var(--color-neutral-400)]">
                      <span>{item.deadlineTitle ?? "Renewal"}</span>
                      {#if item.deadlineDueDate}
                        <span>-</span>
                        <span>Due {formatDate(item.deadlineDueDate)}</span>
                      {/if}
                    </div>
                  </div>
                  <div class="flex items-center gap-3 flex-shrink-0">
                    <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold {scoreColor.bg} {scoreColor.text}">{item.score ?? 0}</span>
                    {#if item.decision === "pending"}
                      <span class="text-xs font-medium {recommendation.color}">{recommendation.text}</span>
                      <button
                        onclick={() => handleDecision(item.id, "renew")}
                        class="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        Renew
                      </button>
                      <button
                        onclick={() => handleDecision(item.id, "abandon")}
                        class="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        Abandon
                      </button>
                    {:else if item.decision === "renew"}
                      <span class="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">Renewed</span>
                    {:else}
                      <span class="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">Abandoned</span>
                    {/if}
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {/if}
</div>
