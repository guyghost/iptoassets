<svelte:head>
  <title>{asset.title} - IP Assets - IPMS</title>
</svelte:head>

<script lang="ts">
  import { page } from "$app/stores";
  import { assetsMap } from "../../../features/assets/data";
  import { statusConfig, typeLabels, statusTransitions, transitionButtonColors, formatDate } from "../../../features/assets/helpers";
  import { fetchAssetTimeline, type TimelineEvent } from "../../../features/timeline/data";
  import { formatTimelineEntry, formatTimelineDate } from "../../../features/timeline/helpers";

  let assetId = $derived($page.params.id);
  let asset = $derived(assetsMap[assetId] ?? {
    id: assetId,
    title: "Unknown Asset",
    type: "patent",
    jurisdiction: { code: "--", name: "Unknown" },
    status: "draft",
    filingDate: "",
    expirationDate: "",
    owner: "Unknown",
    organizationId: "",
    createdAt: "",
    updatedAt: "",
  });

  let transitions = $derived(statusTransitions[asset.status] ?? []);

  let timelineEvents: TimelineEvent[] = $state([]);

  const timelineDotColors: Record<string, string> = {
    draft: "bg-[var(--color-neutral-400)]",
    filed: "bg-blue-500",
    published: "bg-indigo-500",
    granted: "bg-emerald-500",
    expired: "bg-amber-500",
    abandoned: "bg-red-500",
  };

  $effect(() => {
    const id = assetId;
    fetchAssetTimeline(id).then((events) => {
      timelineEvents = events;
    }).catch(() => {
      timelineEvents = [];
    });
  });
</script>

<div class="min-h-screen bg-[#f7f7f8]">
  <div class="mx-auto max-w-[1400px] px-6 py-8">

    <!-- Back Link -->
    <a href="/assets" class="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-neutral-500)] hover:text-[var(--color-primary-600)] transition-colors">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
      Back to Assets
    </a>

    <!-- Page Header -->
    <div class="mt-4 flex items-start justify-between">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">{asset.title}</h1>
        <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statusConfig[asset.status].bg} {statusConfig[asset.status].text}">
          {statusConfig[asset.status].label}
        </span>
      </div>
    </div>

    <!-- Info Grid -->
    <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-50)]">
          <svg class="h-4.5 w-4.5 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>
        </div>
        <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Asset Details</h2>
      </div>

      <div class="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Type</p>
          <p class="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">{typeLabels[asset.type] ?? asset.type}</p>
        </div>
        <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Jurisdiction</p>
          <p class="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">
            <span class="mr-1.5 inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-medium text-[var(--color-neutral-600)]">{asset.jurisdiction.code}</span>
            {asset.jurisdiction.name}
          </p>
        </div>
        <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Owner</p>
          <p class="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">{asset.owner}</p>
        </div>
        <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Filing Date</p>
          <p class="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">{formatDate(asset.filingDate)}</p>
        </div>
        <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Expiration Date</p>
          <p class="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">{formatDate(asset.expirationDate)}</p>
        </div>
        <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Status</p>
          <p class="mt-2">
            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statusConfig[asset.status].bg} {statusConfig[asset.status].text}">
              {statusConfig[asset.status].label}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Status Transitions -->
    {#if transitions.length > 0}
      <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <svg class="h-4.5 w-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
          </div>
          <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Status Transitions</h2>
        </div>
        <p class="mt-2 text-sm text-[var(--color-neutral-500)]">
          Move this asset from <span class="font-medium text-[var(--color-neutral-700)]">{statusConfig[asset.status].label}</span> to a new status.
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          {#each transitions as target}
            <button class="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-sm transition-colors {transitionButtonColors[target] ?? 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-200)]'}">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
              Move to {statusConfig[target].label}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Status Timeline -->
    <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50">
          <svg class="h-4.5 w-4.5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        </div>
        <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Status Timeline</h2>
      </div>

      {#if timelineEvents.length === 0}
        <p class="mt-4 text-sm text-[var(--color-neutral-500)]">No status changes recorded yet.</p>
      {:else}
        <div class="mt-5 space-y-0">
          {#each timelineEvents as event, i}
            <div class="relative flex gap-4">
              <!-- Timeline line and dot -->
              <div class="flex flex-col items-center">
                <div class="h-3 w-3 rounded-full {timelineDotColors[event.toStatus] ?? 'bg-[var(--color-neutral-400)]'} ring-4 ring-white z-10"></div>
                {#if i < timelineEvents.length - 1}
                  <div class="w-0.5 flex-1 bg-[var(--color-neutral-200)]"></div>
                {/if}
              </div>
              <!-- Event content -->
              <div class="pb-6">
                <p class="text-sm font-medium text-[var(--color-neutral-900)]">{formatTimelineEntry(event.fromStatus, event.toStatus)}</p>
                <p class="mt-0.5 text-xs text-[var(--color-neutral-500)]">
                  {formatTimelineDate(event.changedAt)}
                  <span class="text-[var(--color-neutral-400)]">by {event.changedBy}</span>
                </p>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    <!-- Danger Zone -->
    <div class="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50">
          <svg class="h-4.5 w-4.5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
        </div>
        <h2 class="text-base font-semibold text-red-900">Danger Zone</h2>
      </div>
      <p class="mt-2 text-sm text-[var(--color-neutral-500)]">
        Permanently delete this asset. This action cannot be undone.
      </p>
      <div class="mt-4">
        <button class="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-sm transition-colors hover:bg-red-50">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
          Delete Asset
        </button>
      </div>
    </div>

  </div>
</div>
