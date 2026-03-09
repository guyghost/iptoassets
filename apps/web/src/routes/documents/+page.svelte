<svelte:head>
  <title>Documents - IPMS</title>
</svelte:head>

<script lang="ts">
  import { documents, assetNames } from "../../features/documents/data";
  import { statusFilters, typeConfig, statusConfig } from "../../features/documents/helpers";

  let activeFilter = $state("all");

  let filteredDocuments = $derived(
    activeFilter === "all"
      ? documents
      : documents.filter((d) => d.status === activeFilter)
  );

  const totalDocuments = documents.length;
  const pendingReview = documents.filter((d) => d.status === "under-review").length;
  const approvedCount = documents.filter((d) => d.status === "approved").length;
  const rejectedCount = documents.filter((d) => d.status === "rejected").length;
</script>

<div class="min-h-screen bg-[#f7f7f8]">
  <div class="mx-auto max-w-[1400px] px-6 py-8">

    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
          <svg class="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
        </div>
        <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">Documents</h1>
      </div>
      <button class="flex items-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-700)]">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/></svg>
        Upload Document
      </button>
    </div>

    <!-- Filter Tabs -->
    <div class="mt-6 flex items-center gap-2">
      {#each statusFilters as filter}
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

    <!-- Stats Row -->
    <div class="mt-6 grid grid-cols-4 gap-4">
      <div class="rounded-2xl border border-[var(--border-color)] bg-white px-5 py-4 shadow-sm">
        <p class="text-sm text-[var(--color-neutral-500)]">Total documents</p>
        <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{totalDocuments}</p>
        <p class="mt-1 text-xs text-[var(--color-neutral-400)]">across all assets</p>
      </div>
      <div class="rounded-2xl border border-amber-200 bg-amber-50/50 px-5 py-4 shadow-sm">
        <p class="text-sm font-medium text-amber-600">Pending review</p>
        <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{pendingReview}</p>
        <p class="mt-1 text-xs text-amber-500">awaiting action</p>
      </div>
      <div class="rounded-2xl border border-emerald-200 bg-emerald-50/50 px-5 py-4 shadow-sm">
        <p class="text-sm font-medium text-emerald-600">Approved</p>
        <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{approvedCount}</p>
        <p class="mt-1 text-xs text-emerald-500">fully reviewed</p>
      </div>
      <div class="rounded-2xl border border-red-200 bg-red-50/50 px-5 py-4 shadow-sm">
        <p class="text-sm font-medium text-red-600">Rejected</p>
        <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{rejectedCount}</p>
        <p class="mt-1 text-xs text-red-500">needs revision</p>
      </div>
    </div>

    <!-- Documents Table -->
    <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
          <svg class="h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H6m12 10.5H6a2.25 2.25 0 01-2.25-2.25V6.375c0-1.036.84-1.875 1.875-1.875h3.659"/></svg>
        </div>
        <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">All documents</h2>
        <span class="ml-1 text-sm text-[var(--color-neutral-400)]">({filteredDocuments.length})</span>
      </div>

      {#if filteredDocuments.length === 0}
        <!-- Empty State -->
        <div class="flex flex-col items-center justify-center py-16">
          <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-neutral-100)]">
            <svg class="h-8 w-8 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9.75m3 0h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm-3 3h.008v.008H9.75v-.008z"/></svg>
          </div>
          <p class="mt-4 text-sm font-medium text-[var(--color-neutral-700)]">No documents found</p>
          <p class="mt-1 text-sm text-[var(--color-neutral-400)]">There are no documents matching the selected filter.</p>
        </div>
      {:else}
        <div class="mt-4">
          <table class="w-full">
            <thead>
              <tr class="border-b border-[var(--border-color)]">
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Name</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Type</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Associated Asset</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Status</th>
                <th class="pb-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Upload Date</th>
                <th class="pb-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each filteredDocuments as doc}
                <tr class="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--color-neutral-50)]">
                  <td class="py-3.5">
                    <div class="flex items-center gap-2.5">
                      <svg class="h-4 w-4 shrink-0 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
                      <span class="text-sm font-medium text-[var(--color-neutral-900)]">{doc.name}</span>
                    </div>
                  </td>
                  <td class="py-3.5">
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {typeConfig[doc.type].bg} {typeConfig[doc.type].text}">
                      {typeConfig[doc.type].label}
                    </span>
                  </td>
                  <td class="py-3.5">
                    <a href="/assets/{doc.assetId}" class="text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]">
                      {assetNames[doc.assetId] ?? "Unknown Asset"}
                    </a>
                  </td>
                  <td class="py-3.5">
                    <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium {statusConfig[doc.status].bg} {statusConfig[doc.status].text}">
                      {statusConfig[doc.status].label}
                    </span>
                  </td>
                  <td class="py-3.5 text-sm text-[var(--color-neutral-400)]">{doc.uploadedAt}</td>
                  <td class="py-3.5 text-right">
                    <div class="flex items-center justify-end gap-2">
                      <button class="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-800)]">
                        Review
                      </button>
                      <button class="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs font-medium text-[var(--color-neutral-600)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--color-neutral-800)]">
                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </div>

  </div>
</div>
