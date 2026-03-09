<svelte:head>
  <title>{asset.title} - IP Assets - IPMS</title>
</svelte:head>

<script lang="ts">
  import { page } from "$app/stores";

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-[var(--color-neutral-100)]", text: "text-[var(--color-neutral-600)]", label: "Draft" },
    filed: { bg: "bg-blue-50", text: "text-blue-700", label: "Filed" },
    published: { bg: "bg-indigo-50", text: "text-indigo-700", label: "Published" },
    granted: { bg: "bg-emerald-50", text: "text-emerald-700", label: "Granted" },
    expired: { bg: "bg-amber-50", text: "text-amber-700", label: "Expired" },
    abandoned: { bg: "bg-red-50", text: "text-red-700", label: "Abandoned" },
  };

  const typeLabels: Record<string, string> = {
    patent: "Patent",
    trademark: "Trademark",
    copyright: "Copyright",
    "design-right": "Design Right",
  };

  // Status transitions: from -> possible next statuses
  const statusTransitions: Record<string, string[]> = {
    draft: ["filed"],
    filed: ["published", "abandoned"],
    published: ["granted", "abandoned"],
    granted: ["expired"],
    expired: [],
    abandoned: [],
  };

  interface Asset {
    id: string;
    title: string;
    type: string;
    jurisdiction: { code: string; name: string };
    status: string;
    filingDate: string;
    expirationDate: string;
    owner: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
  }

  const assetsMap: Record<string, Asset> = {
    "1": { id: "1", title: "Neural Interface Patent", type: "patent", jurisdiction: { code: "US", name: "United States" }, status: "filed", filingDate: "2026-01-15", expirationDate: "2046-01-15", owner: "Alex Chen", organizationId: "org-1", createdAt: "2026-01-10", updatedAt: "2026-03-05" },
    "2": { id: "2", title: "Quantum Logo Mark", type: "trademark", jurisdiction: { code: "EU", name: "European Union" }, status: "granted", filingDate: "2025-06-20", expirationDate: "2035-06-20", owner: "Sarah Kim", organizationId: "org-1", createdAt: "2025-06-18", updatedAt: "2026-03-03" },
    "3": { id: "3", title: "AI Training Dataset", type: "copyright", jurisdiction: { code: "US", name: "United States" }, status: "draft", filingDate: "", expirationDate: "", owner: "Alex Chen", organizationId: "org-1", createdAt: "2026-03-01", updatedAt: "2026-03-01" },
    "4": { id: "4", title: "Holographic Display", type: "patent", jurisdiction: { code: "JP", name: "Japan" }, status: "published", filingDate: "2025-09-10", expirationDate: "2045-09-10", owner: "Takeshi Yamamoto", organizationId: "org-1", createdAt: "2025-09-08", updatedAt: "2026-02-28" },
    "5": { id: "5", title: "BioSync Wearable Design", type: "design-right", jurisdiction: { code: "GB", name: "United Kingdom" }, status: "granted", filingDate: "2025-03-12", expirationDate: "2040-03-12", owner: "Emma Watson", organizationId: "org-1", createdAt: "2025-03-10", updatedAt: "2026-01-15" },
    "6": { id: "6", title: "SmartGrid Energy Patent", type: "patent", jurisdiction: { code: "DE", name: "Germany" }, status: "expired", filingDate: "2006-04-22", expirationDate: "2026-04-22", owner: "Hans Mueller", organizationId: "org-1", createdAt: "2006-04-20", updatedAt: "2026-02-01" },
    "7": { id: "7", title: "EcoFlow Brand Identity", type: "trademark", jurisdiction: { code: "US", name: "United States" }, status: "filed", filingDate: "2026-02-10", expirationDate: "2036-02-10", owner: "Sarah Kim", organizationId: "org-1", createdAt: "2026-02-08", updatedAt: "2026-02-28" },
    "8": { id: "8", title: "Adaptive UI Framework", type: "copyright", jurisdiction: { code: "EU", name: "European Union" }, status: "granted", filingDate: "2025-11-05", expirationDate: "2095-11-05", owner: "Alex Chen", organizationId: "org-1", createdAt: "2025-11-03", updatedAt: "2026-01-20" },
    "9": { id: "9", title: "NanoFilter Membrane", type: "patent", jurisdiction: { code: "CN", name: "China" }, status: "abandoned", filingDate: "2024-08-15", expirationDate: "", owner: "Li Wei", organizationId: "org-1", createdAt: "2024-08-12", updatedAt: "2025-12-01" },
    "10": { id: "10", title: "AeroLens Optics Design", type: "design-right", jurisdiction: { code: "KR", name: "South Korea" }, status: "filed", filingDate: "2026-01-28", expirationDate: "2041-01-28", owner: "Ji-Hoon Park", organizationId: "org-1", createdAt: "2026-01-25", updatedAt: "2026-03-02" },
  };

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

  function formatDate(dateStr: string): string {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const transitionButtonColors: Record<string, string> = {
    filed: "bg-blue-600 hover:bg-blue-700 text-white",
    published: "bg-indigo-600 hover:bg-indigo-700 text-white",
    granted: "bg-emerald-600 hover:bg-emerald-700 text-white",
    expired: "bg-amber-600 hover:bg-amber-700 text-white",
    abandoned: "bg-red-100 hover:bg-red-200 text-red-700",
  };
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
