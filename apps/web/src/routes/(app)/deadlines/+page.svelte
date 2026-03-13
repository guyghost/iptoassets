<svelte:head>
  <title>Deadlines - IPMS</title>
</svelte:head>

<script lang="ts">
  import { onMount } from "svelte";
  import { filters, typeColors, getDaysUntil, getRelativeDate, isOverdue, isDueThisWeek, isDueThisMonth, formatDate, type DeadlineItem } from "../../../features/deadlines/helpers";

  let activeFilter = $state("all");
  let deadlines = $state<DeadlineItem[]>([]);
  let loading = $state(true);

  onMount(async () => {
    try {
      const res = await fetch("/api/deadlines");
      if (res.ok) {
        const data = await res.json();
        deadlines = data.map((d: any) => ({
          ...d,
          dueDate: typeof d.dueDate === "string" ? d.dueDate : new Date(d.dueDate).toISOString().split("T")[0],
        }));
      }
    } catch {
      // Gracefully handle
    } finally {
      loading = false;
    }
  });

  let overdueItems = $derived(deadlines.filter(d => isOverdue(d)));
  let weekItems = $derived(deadlines.filter(d => isDueThisWeek(d)));
  let monthItems = $derived(deadlines.filter(d => isDueThisMonth(d)));
  let completedItems = $derived(deadlines.filter(d => d.completed));

  let upcomingItems = $derived(
    deadlines.filter(d => !d.completed && getDaysUntil(d.dueDate) > 6)
  );

  let filteredDeadlines = $derived.by(() => {
    switch (activeFilter) {
      case "overdue": return overdueItems;
      case "week": return weekItems;
      case "month": return monthItems;
      case "completed": return completedItems;
      default: return deadlines;
    }
  });

  // For grouped view (only in "all" filter)
  let groupedOverdue = $derived(
    activeFilter === "all" ? overdueItems.sort((a, b) => getDaysUntil(a.dueDate) - getDaysUntil(b.dueDate)) : []
  );
  let groupedWeek = $derived(
    activeFilter === "all" ? weekItems.sort((a, b) => getDaysUntil(a.dueDate) - getDaysUntil(b.dueDate)) : []
  );
  let groupedUpcoming = $derived(
    activeFilter === "all" ? upcomingItems.sort((a, b) => getDaysUntil(a.dueDate) - getDaysUntil(b.dueDate)) : []
  );
  let groupedCompleted = $derived(
    activeFilter === "all" ? completedItems : []
  );

  async function toggleComplete(id: string) {
    deadlines = deadlines.map(d => d.id === id ? { ...d, completed: !d.completed } : d);
    try {
      await fetch(`/api/deadlines`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Revert on failure
      deadlines = deadlines.map(d => d.id === id ? { ...d, completed: !d.completed } : d);
    }
  }
</script>

<!-- Page Header -->
<div class="bg-gradient-to-b from-[#f0ecff] to-[#f7f7f8] pb-6">
  <div class="mx-auto max-w-[1400px] px-6 pt-8">
    <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Deadlines</h1>
    <p class="mt-1 text-sm text-[var(--color-neutral-500)]">Track and manage all your intellectual property deadlines</p>

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

  <!-- Summary Stats Row -->
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
    <div class="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
          <svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
        </div>
        <p class="text-sm font-medium text-red-600">Overdue</p>
      </div>
      <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{overdueItems.length}</p>
      <p class="mt-1 text-xs text-[var(--color-neutral-400)]">require immediate attention</p>
    </div>

    <div class="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
          <svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <p class="text-sm font-medium text-amber-600">Due this week</p>
      </div>
      <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{weekItems.length}</p>
      <p class="mt-1 text-xs text-[var(--color-neutral-400)]">next 7 days</p>
    </div>

    <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
          <svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
        </div>
        <p class="text-sm font-medium text-[var(--color-neutral-600)]">Due this month</p>
      </div>
      <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{monthItems.length}</p>
      <p class="mt-1 text-xs text-[var(--color-neutral-400)]">this month</p>
    </div>

    <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
          <svg class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <p class="text-sm font-medium text-emerald-600">Completed</p>
      </div>
      <p class="mt-3 text-3xl font-bold text-[var(--color-neutral-900)]">{completedItems.length}</p>
      <p class="mt-1 text-xs text-[var(--color-neutral-400)]">deadlines met</p>
    </div>
  </div>

  <!-- Deadline Lists -->
  <div class="mt-6 flex flex-col gap-6">

    {#if activeFilter === "all"}
      <!-- Grouped View -->

      <!-- Overdue Section -->
      {#if groupedOverdue.length > 0}
        <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
              <svg class="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Overdue</h2>
            <span class="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{groupedOverdue.length}</span>
          </div>

          <div class="mt-4 flex flex-col">
            {#each groupedOverdue as deadline}
              <div class="flex items-center gap-4 border-b border-[var(--border-color)] py-3.5 last:border-0 border-l-2 border-l-red-400 pl-4 {deadline.completed ? 'opacity-50' : ''}">
                <button
                  aria-label="Toggle complete"
                  class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors {deadline.completed ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-400)]'}"
                  onclick={() => toggleComplete(deadline.id)}
                >
                  {#if deadline.completed}
                    <svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
                  {/if}
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-[var(--color-neutral-900)] {deadline.completed ? 'line-through text-[var(--color-neutral-400)]' : ''}">{deadline.title}</span>
                    <span class="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium {typeColors[deadline.type].bg} {typeColors[deadline.type].text}">{typeColors[deadline.type].label}</span>
                  </div>
                  <div class="mt-1 flex items-center gap-3 text-xs text-[var(--color-neutral-400)]">
                    <span>{deadline.assetName}</span>
                    <span>-</span>
                    <span>{formatDate(deadline.dueDate)}</span>
                  </div>
                </div>
                <span class="flex-shrink-0 text-sm font-medium text-red-600">{getRelativeDate(deadline.dueDate)}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Due This Week Section -->
      {#if groupedWeek.length > 0}
        <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <svg class="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Due this week</h2>
            <span class="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{groupedWeek.length}</span>
          </div>

          <div class="mt-4 flex flex-col">
            {#each groupedWeek as deadline}
              <div class="flex items-center gap-4 border-b border-[var(--border-color)] py-3.5 last:border-0 border-l-2 border-l-amber-400 pl-4 {deadline.completed ? 'opacity-50' : ''}">
                <button
                  aria-label="Toggle complete"
                  class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors {deadline.completed ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-400)]'}"
                  onclick={() => toggleComplete(deadline.id)}
                >
                  {#if deadline.completed}
                    <svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
                  {/if}
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-[var(--color-neutral-900)] {deadline.completed ? 'line-through text-[var(--color-neutral-400)]' : ''}">{deadline.title}</span>
                    <span class="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium {typeColors[deadline.type].bg} {typeColors[deadline.type].text}">{typeColors[deadline.type].label}</span>
                  </div>
                  <div class="mt-1 flex items-center gap-3 text-xs text-[var(--color-neutral-400)]">
                    <span>{deadline.assetName}</span>
                    <span>-</span>
                    <span>{formatDate(deadline.dueDate)}</span>
                  </div>
                </div>
                <span class="flex-shrink-0 text-sm font-medium text-amber-600">{getRelativeDate(deadline.dueDate)}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Upcoming Section -->
      {#if groupedUpcoming.length > 0}
        <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <svg class="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Upcoming</h2>
            <span class="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{groupedUpcoming.length}</span>
          </div>

          <div class="mt-4 flex flex-col">
            {#each groupedUpcoming as deadline}
              <div class="flex items-center gap-4 border-b border-[var(--border-color)] py-3.5 last:border-0 pl-4 {deadline.completed ? 'opacity-50' : ''}">
                <button
                  aria-label="Toggle complete"
                  class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors {deadline.completed ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-400)]'}"
                  onclick={() => toggleComplete(deadline.id)}
                >
                  {#if deadline.completed}
                    <svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
                  {/if}
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-[var(--color-neutral-900)] {deadline.completed ? 'line-through text-[var(--color-neutral-400)]' : ''}">{deadline.title}</span>
                    <span class="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium {typeColors[deadline.type].bg} {typeColors[deadline.type].text}">{typeColors[deadline.type].label}</span>
                  </div>
                  <div class="mt-1 flex items-center gap-3 text-xs text-[var(--color-neutral-400)]">
                    <span>{deadline.assetName}</span>
                    <span>-</span>
                    <span>{formatDate(deadline.dueDate)}</span>
                  </div>
                </div>
                <span class="flex-shrink-0 text-sm font-medium text-[var(--color-neutral-500)]">{getRelativeDate(deadline.dueDate)}</span>
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Completed Section -->
      {#if groupedCompleted.length > 0}
        <div class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
              <svg class="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Completed</h2>
            <span class="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{groupedCompleted.length}</span>
          </div>

          <div class="mt-4 flex flex-col">
            {#each groupedCompleted as deadline}
              <div class="flex items-center gap-4 border-b border-[var(--border-color)] py-3.5 last:border-0 pl-4 opacity-50">
                <button
                  aria-label="Toggle complete"
                  class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 border-emerald-500 bg-emerald-500 transition-colors"
                  onclick={() => toggleComplete(deadline.id)}
                >
                  <svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium line-through text-[var(--color-neutral-400)]">{deadline.title}</span>
                    <span class="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium {typeColors[deadline.type].bg} {typeColors[deadline.type].text}">{typeColors[deadline.type].label}</span>
                  </div>
                  <div class="mt-1 flex items-center gap-3 text-xs text-[var(--color-neutral-400)]">
                    <span>{deadline.assetName}</span>
                    <span>-</span>
                    <span>{formatDate(deadline.dueDate)}</span>
                  </div>
                </div>
                <span class="flex-shrink-0 text-sm font-medium text-[var(--color-neutral-400)]">{getRelativeDate(deadline.dueDate)}</span>
              </div>
            {/each}
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
            {filters.find(f => f.id === activeFilter)?.label} deadlines
          </h2>
          <span class="rounded-full bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">{filteredDeadlines.length}</span>
        </div>

        {#if filteredDeadlines.length === 0}
          <div class="mt-8 flex flex-col items-center justify-center py-8 text-center">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-neutral-100)]">
              <svg class="h-6 w-6 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="mt-3 text-sm font-medium text-[var(--color-neutral-600)]">No deadlines found</p>
            <p class="mt-1 text-xs text-[var(--color-neutral-400)]">Nothing matches this filter right now</p>
          </div>
        {:else}
          <div class="mt-4 flex flex-col">
            {#each filteredDeadlines as deadline}
              {@const days = getDaysUntil(deadline.dueDate)}
              {@const borderColor = deadline.completed ? '' : days < 0 ? 'border-l-2 border-l-red-400' : days <= 6 ? 'border-l-2 border-l-amber-400' : ''}
              {@const dateColor = deadline.completed ? 'text-[var(--color-neutral-400)]' : days < 0 ? 'text-red-600' : days <= 6 ? 'text-amber-600' : 'text-[var(--color-neutral-500)]'}
              <div class="flex items-center gap-4 border-b border-[var(--border-color)] py-3.5 last:border-0 pl-4 {borderColor} {deadline.completed ? 'opacity-50' : ''}">
                <button
                  aria-label="Toggle complete"
                  class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-colors {deadline.completed ? 'border-emerald-500 bg-emerald-500' : 'border-[var(--color-neutral-300)] hover:border-[var(--color-neutral-400)]'}"
                  onclick={() => toggleComplete(deadline.id)}
                >
                  {#if deadline.completed}
                    <svg class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
                  {/if}
                </button>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="text-sm font-medium {deadline.completed ? 'line-through text-[var(--color-neutral-400)]' : 'text-[var(--color-neutral-900)]'}">{deadline.title}</span>
                    <span class="inline-flex flex-shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium {typeColors[deadline.type].bg} {typeColors[deadline.type].text}">{typeColors[deadline.type].label}</span>
                  </div>
                  <div class="mt-1 flex items-center gap-3 text-xs text-[var(--color-neutral-400)]">
                    <span>{deadline.assetName}</span>
                    <span>-</span>
                    <span>{formatDate(deadline.dueDate)}</span>
                  </div>
                </div>
                <span class="flex-shrink-0 text-sm font-medium {dateColor}">{getRelativeDate(deadline.dueDate)}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
