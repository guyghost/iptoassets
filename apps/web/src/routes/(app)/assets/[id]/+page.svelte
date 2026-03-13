<script lang="ts">
  import { page } from "$app/stores";
  import { statusConfig, typeLabels, statusTransitions, transitionButtonColors, formatDate } from "../../../../features/assets/helpers";
  import { fetchAssetTimeline, type TimelineEvent } from "../../../../features/timeline/data";
  import { formatTimelineEntry, formatTimelineDate } from "../../../../features/timeline/helpers";
  import LegalStatus from "../../../../features/assets/LegalStatus.svelte";

  let assetId = $derived($page.params.id);

  let asset = $state<any>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  let transitions = $derived(asset ? (statusTransitions[asset.status] ?? []) : []);

  let timelineEvents: TimelineEvent[] = $state([]);

  const timelineDotColors: Record<string, string> = {
    draft: "bg-[var(--color-neutral-400)]",
    filed: "bg-blue-500",
    published: "bg-indigo-500",
    granted: "bg-emerald-500",
    expired: "bg-amber-500",
    abandoned: "bg-red-500",
  };

  // Metadata display labels
  const metadataLabels: Record<string, string> = {
    fanId: "Questel Family ID (FAN)",
    publicationDetails: "Publication Details",
    publicationNumbers: "Publication Numbers",
    assignees: "Assignees",
    standardizedAssignees: "Standardized Assignees",
    applicationData: "Application Data",
    priorityNumber: "Priority Number",
    priorityDate: "Priority Date",
    legalActions: "Legal Actions",
    grantDates: "Grant Dates",
    expectedExpiryDates: "Expected Expiry Dates",
    citingPatents: "Citing Patents",
    inventors: "Inventors",
    ipcClassification: "IPC Classification",
    cpcClassification: "CPC Classification",
  };

  // Fields to show as multi-line (contain \r\n separated data)
  const multiLineFields = new Set([
    "publicationDetails", "publicationNumbers", "legalActions",
    "inventors", "ipcClassification", "cpcClassification",
    "citingPatents", "assignees",
  ]);

  // Fields shown in prominent cards (top section)
  const prominentFields = new Set([
    "fanId", "priorityNumber", "priorityDate", "inventors", "standardizedAssignees",
  ]);

  // Fields with dedicated display sections (excluded from Additional Details)
  const dedicatedFields = new Set([
    "derivedStatus", "legalActions", "parsedLegalActions", "publications",
    "expiryDates", "grantDatesMap", "grantDates", "expectedExpiryDates",
    "applicationData", "publicationDetails", "publicationNumbers",
    "ipcClassification", "cpcClassification", "citingPatents",
  ]);

  // Clean title: extract text before first patent reference (for legacy data)
  function cleanTitle(raw: string): string {
    const idx = raw.search(/\([A-Z]{2}[\w\/-]+\)/);
    if (idx > 0) return raw.slice(0, idx).trim();
    return raw;
  }

  function parseMultiLine(val: string): string[] {
    return val.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  }

  // Date formatting for publication columns
  function formatShortDate(d: string | undefined): string | null {
    if (!d) return null;
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch { return d; }
  }

  // Expiry date helpers
  function getExpiryBadge(expiry: string | undefined): { label: string; classes: string } | null {
    if (!expiry) return null;
    const expiryDate = new Date(expiry);
    const now = new Date();
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    const formatted = formatShortDate(expiry)!;

    if (expiryDate < now) {
      return { label: `Expired ${formatted}`, classes: "bg-red-50 text-red-700 border-red-200" };
    }
    if (expiryDate < oneYearFromNow) {
      return { label: `Expiring ${formatted}`, classes: "bg-amber-50 text-amber-700 border-amber-200" };
    }
    return { label: formatted, classes: "bg-emerald-50 text-emerald-700 border-emerald-200" };
  }

  // Parse date from raw metadata on the fly (fallback for expiry/grant)
  function lookupDateFromMetadata(pubNumber: string, mapKey: string, rawKey: string): string | undefined {
    if (!asset?.metadata) return undefined;
    const map = asset.metadata[mapKey] as Record<string, string> | undefined;
    if (map?.[pubNumber]) return map[pubNumber];
    const raw = asset.metadata[rawKey] as string | undefined;
    if (!raw) return undefined;
    const regex = new RegExp(`\\(${pubNumber.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)\\s*(\\d{4}-\\d{2}-\\d{2})`);
    const match = raw.match(regex);
    return match?.[1];
  }

  function getPublicationExpiry(pubNumber: string): string | undefined {
    return lookupDateFromMetadata(pubNumber, "expiryDates", "expectedExpiryDates");
  }

  function getPublicationGrantDate(pubNumber: string): string | undefined {
    return lookupDateFromMetadata(pubNumber, "grantDatesMap", "grantDates");
  }

  // Parsed application data
  let applications = $derived.by((): { country: string; number: string; date: string; ref: string }[] => {
    const raw = String(asset?.metadata?.applicationData ?? "");
    if (!raw.trim()) return [];
    const results: { country: string; number: string; date: string; ref: string }[] = [];
    for (const line of raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
      const match = line.match(/^(\S+)\s+(\d{4}-\d{2}-\d{2})\s+\[([^\]]+)\]$/);
      if (!match) continue;
      const number = match[1]!;
      const country = number.match(/^([A-Z]{2})/)?.[1] ?? number.slice(0, 2);
      results.push({ country, number, date: match[2]!, ref: match[3]! });
    }
    return results;
  });

  // Publication events map: number → { kindCode, date } (prefer grant over application)
  let pubEventMap = $derived.by(() => {
    const raw = String(asset?.metadata?.publicationNumbers ?? asset?.metadata?.publicationDetails ?? "");
    if (!raw.trim()) return new Map<string, { kindCode: string; date: string }>();
    const map = new Map<string, { kindCode: string; date: string }>();
    for (const line of raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean)) {
      const match = line.match(/^(\S+)\s+([A-Z]\d?)\s+(\d{4}-\d{2}-\d{2})/);
      if (!match) continue;
      const num = match[1]!;
      const entry = { kindCode: match[2]!, date: match[3]! };
      const existing = map.get(num);
      if (!existing || entry.kindCode.startsWith('B') || (!existing.kindCode.startsWith('B') && entry.date > existing.date)) {
        map.set(num, entry);
      }
    }
    return map;
  });

  // Classification codes
  let ipcCodes = $derived.by(() => {
    const raw = String(asset?.metadata?.ipcClassification ?? "");
    return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  });

  let cpcCodes = $derived.by(() => {
    const raw = String(asset?.metadata?.cpcClassification ?? "");
    return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  });

  // Citing patents
  interface Citation { number: string; country: string; familyId: string; who: string; self: boolean; categories: string[] }
  let citations = $derived.by((): { citedPatent: string; citations: Citation[] } => {
    const raw = String(asset?.metadata?.citingPatents ?? "");
    if (!raw.trim()) return { citedPatent: "", citations: [] };
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let citedPatent = "";
    const cits: Citation[] = [];
    for (const line of lines) {
      const citedMatch = line.match(/^\(([^)]+)\)$/);
      if (citedMatch) { citedPatent = citedMatch[1]!; continue; }
      const parts = line.split(/\s+/);
      if (parts.length < 3) continue;
      const number = parts[0]!;
      const familyId = parts[1]!;
      const country = number.match(/^([A-Z]{2})/)?.[1] ?? "";
      let who = "";
      let self = false;
      const categories: string[] = [];
      for (const part of parts.slice(2)) {
        if (part.startsWith("WHO=")) who = part.slice(4);
        else if (part.startsWith("SELF=")) self = part.slice(5) === "Y";
        else if (part.startsWith("CAT=")) categories.push(part.slice(4));
      }
      cits.push({ number, country, familyId, who, self, categories });
    }
    return { citedPatent, citations: cits };
  });

  // Citation category labels
  const catLabels: Record<string, string> = {
    X: "Particularly relevant (alone)",
    Y: "Particularly relevant (combined)",
    A: "Technological background",
    D: "Cited in application",
  };

  // Publication sorting
  type PubSortField = "grantDate" | "country" | "pubDate" | "expiry" | "number";
  let pubSortField = $state<PubSortField>("grantDate");
  let pubSortAsc = $state(false);

  function togglePubSort(field: PubSortField) {
    if (pubSortField === field) {
      pubSortAsc = !pubSortAsc;
    } else {
      pubSortField = field;
      pubSortAsc = false;
    }
  }

  let sortedPublications = $derived.by(() => {
    const pubs = asset?.metadata?.publications as any[] | undefined;
    if (!pubs || pubs.length === 0) return [];
    const enriched = pubs.map((pub: any) => ({
      ...pub,
      _grantDate: pub.grantDate ?? getPublicationGrantDate(pub.number) ?? "",
      _expiry: pub.expiry ?? getPublicationExpiry(pub.number) ?? "",
      _pubDate: pubEventMap.get(pub.number)?.date ?? "",
    }));
    const dir = pubSortAsc ? 1 : -1;
    const key = pubSortField === "number" ? "number"
      : pubSortField === "country" ? "country"
      : pubSortField === "pubDate" ? "_pubDate"
      : pubSortField === "expiry" ? "_expiry"
      : "_grantDate";
    enriched.sort((a: any, b: any) => {
      const va = a[key] ?? "";
      const vb = b[key] ?? "";
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    });
    return enriched;
  });

  // Expiration summary derived from publications
  let expirationSummary = $derived.by(() => {
    const pubs = asset?.metadata?.publications as any[] | undefined;
    if (!pubs || pubs.length === 0) return { hasData: false, hasActive: false, expiredCount: 0, activeCount: 0, total: 0 } as const;

    const now = new Date();
    let expiredCount = 0;
    let activeCount = 0;
    let checkedCount = 0;

    for (const pub of pubs) {
      const expiry = pub.expiry ?? getPublicationExpiry(pub.number);
      if (!expiry) continue;
      checkedCount++;
      if (new Date(expiry) < now) {
        expiredCount++;
      } else {
        activeCount++;
      }
    }

    if (checkedCount === 0) return { hasData: false, hasActive: false, expiredCount: 0, activeCount: 0, total: pubs.length } as const;
    return { hasData: true, hasActive: activeCount > 0, expiredCount, activeCount, total: pubs.length } as const;
  });

  $effect(() => {
    const id = assetId;
    loading = true;
    error = null;
    fetch(`/api/assets/${id}`)
      .then(async (res) => {
        if (!res.ok) { error = "Asset not found"; return; }
        asset = await res.json();
      })
      .catch(() => { error = "Failed to load asset"; })
      .finally(() => { loading = false; });

    fetchAssetTimeline(id).then((events) => {
      timelineEvents = events;
    }).catch(() => {
      timelineEvents = [];
    });
  });
</script>

<svelte:head>
  <title>{asset ? cleanTitle(asset.title) : "Loading..."} - IP Assets - IPMS</title>
</svelte:head>

<div class="min-h-screen bg-[#f7f7f8]">
  <div class="mx-auto max-w-[1400px] px-4 md:px-6 py-8">

    <!-- Back Link -->
    <a href="/assets" class="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-neutral-500)] hover:text-[var(--color-primary-600)] transition-colors">
      <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>
      Back to Assets
    </a>

    {#if loading}
      <div class="mt-8 text-center text-sm text-[var(--color-neutral-500)]">Loading asset...</div>
    {:else if error}
      <div class="mt-8 text-center text-sm text-red-600">{error}</div>
    {:else if asset}

    <!-- Page Header -->
    <div class="mt-4">
      <h1 class="text-2xl font-bold text-[var(--color-neutral-900)]">{cleanTitle(asset.title)}</h1>
    </div>

    <!-- Info Grid -->
    <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-card)]">
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
          <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Expiration</p>
          <div class="mt-2 flex items-center gap-2">
            {#if expirationSummary.hasData}
              {#if expirationSummary.hasActive}
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-700">Active</span>
                {#if expirationSummary.expiredCount > 0}
                  <a href="#publications" class="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700" title="{expirationSummary.expiredCount} of {expirationSummary.total} publications expired">
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>
                    {expirationSummary.expiredCount}/{expirationSummary.total}
                  </a>
                {/if}
              {:else}
                <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-red-50 text-red-700">Expired</span>
                <a href="#publications" class="text-xs font-medium text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)]" title="See all publications">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"/></svg>
                </a>
              {/if}
            {:else}
              <span class="text-sm font-medium text-[var(--color-neutral-900)]">{formatDate(asset.expirationDate)}</span>
            {/if}
          </div>
        </div>
        <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
          <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Status</p>
          <p class="mt-2">
            <span class="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium {statusConfig[asset.status]?.bg} {statusConfig[asset.status]?.text}">
              {statusConfig[asset.status]?.label ?? asset.status}
            </span>
          </p>
        </div>
      </div>
    </div>

    <!-- Patent Metadata (prominent fields as cards) -->
    {#if asset.metadata}
      {@const prominent = Object.entries(asset.metadata).filter(([k, v]) => prominentFields.has(k) && v && String(v).trim())}
      {#if prominent.length > 0}
        <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50">
              <svg class="h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Patent Information</h2>
          </div>

          <div class="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {#each prominent as [key, value]}
              <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
                <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">{metadataLabels[key] ?? key}</p>
                {#if multiLineFields.has(key)}
                  <div class="mt-2 space-y-1">
                    {#each parseMultiLine(String(value)) as line}
                      <p class="text-sm text-[var(--color-neutral-900)]">{line}</p>
                    {/each}
                  </div>
                {:else}
                  <p class="mt-2 text-sm font-medium text-[var(--color-neutral-900)]">{value}</p>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}

      <!-- Applications table -->
      {#if applications.length > 0}
        <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
              <svg class="h-4.5 w-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Applications</h2>
            <span class="text-xs text-[var(--color-neutral-400)]">{applications.length} jurisdictions</span>
          </div>

          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--border-color)]">
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Country</th>
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Application Number</th>
                  <th class="pb-2 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Filing Date</th>
                </tr>
              </thead>
              <tbody>
                {#each applications as app}
                  <tr class="border-b border-[var(--border-color)] last:border-0">
                    <td class="py-2.5 pr-4">
                      <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-bold text-[var(--color-neutral-600)]">{app.country}</span>
                    </td>
                    <td class="py-2.5 pr-4 font-mono text-xs text-[var(--color-neutral-700)]">{app.number}</td>
                    <td class="py-2.5 text-xs text-[var(--color-neutral-700)]">{formatShortDate(app.date)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <!-- Publications table -->
      {#if sortedPublications.length > 0}
        <div id="publications" class="mt-6 scroll-mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50">
              <svg class="h-4.5 w-4.5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Publications</h2>
            <span class="text-xs text-[var(--color-neutral-400)]">{sortedPublications.length} members</span>
          </div>

          {#snippet sortIcon(field: PubSortField)}
            {#if pubSortField === field}
              <svg class="ml-1 inline h-3 w-3 text-[var(--color-primary-600)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                {#if pubSortAsc}
                  <path d="M4.5 15.75l7.5-7.5 7.5 7.5"/>
                {:else}
                  <path d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                {/if}
              </svg>
            {/if}
          {/snippet}

          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--border-color)]">
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] cursor-pointer select-none hover:text-[var(--color-neutral-600)] transition-colors" onclick={() => togglePubSort("country")}>Country{@render sortIcon("country")}</th>
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] cursor-pointer select-none hover:text-[var(--color-neutral-600)] transition-colors" onclick={() => togglePubSort("number")}>Publication Number{@render sortIcon("number")}</th>
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Kind</th>
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] cursor-pointer select-none hover:text-[var(--color-neutral-600)] transition-colors" onclick={() => togglePubSort("pubDate")}>Pub Date{@render sortIcon("pubDate")}</th>
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Title</th>
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] cursor-pointer select-none hover:text-[var(--color-neutral-600)] transition-colors" onclick={() => togglePubSort("grantDate")}>Grant Date{@render sortIcon("grantDate")}</th>
                  <th class="pb-2 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] cursor-pointer select-none hover:text-[var(--color-neutral-600)] transition-colors" onclick={() => togglePubSort("expiry")}>Expiry{@render sortIcon("expiry")}</th>
                </tr>
              </thead>
              <tbody>
                {#each sortedPublications as pub}
                  {@const expiry = pub._expiry || undefined}
                  {@const badge = getExpiryBadge(expiry)}
                  {@const grantDate = pub._grantDate || undefined}
                  {@const pubEvent = pubEventMap.get(pub.number)}
                  <tr class="border-b border-[var(--border-color)] last:border-0">
                    <td class="py-2.5 pr-4">
                      <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-bold text-[var(--color-neutral-600)]">{pub.country}</span>
                    </td>
                    <td class="py-2.5 pr-4 font-mono text-xs text-[var(--color-neutral-700)]">{pub.number}</td>
                    <td class="py-2.5 pr-4">
                      {#if pubEvent}
                        <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-[10px] font-mono font-medium text-[var(--color-neutral-600)]">{pubEvent.kindCode}</span>
                      {:else}
                        <span class="text-xs text-[var(--color-neutral-400)]">—</span>
                      {/if}
                    </td>
                    <td class="py-2.5 pr-4">
                      {#if pubEvent}
                        <span class="text-xs text-[var(--color-neutral-700)]">{formatShortDate(pubEvent.date)}</span>
                      {:else}
                        <span class="text-xs text-[var(--color-neutral-400)]">—</span>
                      {/if}
                    </td>
                    <td class="py-2.5 pr-4 text-[var(--color-neutral-700)]">{pub.title}</td>
                    <td class="py-2.5 pr-4">
                      {#if grantDate}
                        <span class="text-xs text-[var(--color-neutral-700)]">{formatShortDate(grantDate)}</span>
                      {:else}
                        <span class="text-xs text-[var(--color-neutral-400)]">—</span>
                      {/if}
                    </td>
                    <td class="py-2.5">
                      {#if badge}
                        <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium {badge.classes}">{badge.label}</span>
                      {:else}
                        <span class="text-xs text-[var(--color-neutral-400)]">—</span>
                      {/if}
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <!-- Classifications -->
      {#if ipcCodes.length > 0 || cpcCodes.length > 0}
        <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <svg class="h-4.5 w-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"/><path d="M6 6h.008v.008H6V6z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Classifications</h2>
          </div>

          {#if ipcCodes.length > 0}
            <div class="mt-4">
              <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] mb-2">IPC — International Classification</p>
              <div class="flex flex-wrap gap-1.5">
                {#each ipcCodes as code}
                  <span class="inline-flex items-center rounded-lg border border-[var(--border-color)] bg-[var(--color-neutral-50)] px-2.5 py-1 text-xs font-mono text-[var(--color-neutral-700)]">{code}</span>
                {/each}
              </div>
            </div>
          {/if}

          {#if cpcCodes.length > 0}
            <div class="mt-4">
              <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] mb-2">CPC — Cooperative Classification</p>
              <div class="flex flex-wrap gap-1.5">
                {#each cpcCodes as code}
                  <span class="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-mono text-indigo-700">{code}</span>
                {/each}
              </div>
            </div>
          {/if}
        </div>
      {/if}

      <!-- Citing Patents -->
      {#if citations.citations.length > 0}
        {@const examinerCits = citations.citations.filter(c => c.who === "Examiner")}
        {@const applicantCits = citations.citations.filter(c => c.who === "Applicant")}
        {@const selfCits = citations.citations.filter(c => c.self)}
        <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50">
              <svg class="h-4.5 w-4.5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.37a4.5 4.5 0 00-6.364-6.364L4.5 8.257"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Citing Patents</h2>
            <span class="text-xs text-[var(--color-neutral-400)]">{citations.citations.length} citations</span>
          </div>

          <!-- Summary badges -->
          <div class="mt-4 flex flex-wrap gap-3">
            <div class="rounded-xl border border-[var(--border-color)] px-4 py-3">
              <p class="text-xs text-[var(--color-neutral-500)]">Total</p>
              <p class="mt-1 text-2xl font-bold text-[var(--color-neutral-900)]">{citations.citations.length}</p>
            </div>
            <div class="rounded-xl border border-blue-200 bg-blue-50/50 px-4 py-3">
              <p class="text-xs font-medium text-blue-600">By Examiner</p>
              <p class="mt-1 text-2xl font-bold text-[var(--color-neutral-900)]">{examinerCits.length}</p>
            </div>
            <div class="rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-3">
              <p class="text-xs font-medium text-emerald-600">By Applicant</p>
              <p class="mt-1 text-2xl font-bold text-[var(--color-neutral-900)]">{applicantCits.length}</p>
            </div>
            <div class="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
              <p class="text-xs font-medium text-amber-600">Self-citations</p>
              <p class="mt-1 text-2xl font-bold text-[var(--color-neutral-900)]">{selfCits.length}</p>
            </div>
          </div>

          <!-- Citations table -->
          <div class="mt-4 overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-[var(--border-color)]">
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Country</th>
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Patent Number</th>
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Source</th>
                  <th class="pb-2 pr-4 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Self</th>
                  <th class="pb-2 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">Categories</th>
                </tr>
              </thead>
              <tbody>
                {#each citations.citations as cit}
                  <tr class="border-b border-[var(--border-color)] last:border-0">
                    <td class="py-2.5 pr-4">
                      <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-xs font-bold text-[var(--color-neutral-600)]">{cit.country}</span>
                    </td>
                    <td class="py-2.5 pr-4 font-mono text-xs text-[var(--color-neutral-700)]">{cit.number}</td>
                    <td class="py-2.5 pr-4">
                      <span class="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium {cit.who === 'Examiner' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">{cit.who}</span>
                    </td>
                    <td class="py-2.5 pr-4">
                      {#if cit.self}
                        <span class="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 border border-amber-200">Self</span>
                      {:else}
                        <span class="text-xs text-[var(--color-neutral-400)]">—</span>
                      {/if}
                    </td>
                    <td class="py-2.5">
                      <div class="flex gap-1">
                        {#each cit.categories as cat}
                          <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--color-neutral-600)]" title={catLabels[cat] ?? cat}>{cat}</span>
                        {/each}
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      {/if}

      <!-- Additional Details -->
      {@const detailed = Object.entries(asset.metadata).filter(([k, v]) => !prominentFields.has(k) && !dedicatedFields.has(k) && v && String(v).trim())}
      {#if detailed.length > 0}
        <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-card)]">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <svg class="h-4.5 w-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/></svg>
            </div>
            <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Additional Details</h2>
          </div>

          <div class="mt-5 space-y-5">
            {#each detailed as [key, value]}
              <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
                <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)]">{metadataLabels[key] ?? key}</p>
                {#if multiLineFields.has(key)}
                  <div class="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {#each parseMultiLine(String(value)) as line}
                      <p class="text-sm text-[var(--color-neutral-700)]">{line}</p>
                    {/each}
                  </div>
                {:else if key === "legalActions"}
                  <pre class="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-xs text-[var(--color-neutral-700)] font-mono leading-relaxed">{value}</pre>
                {:else}
                  <p class="mt-2 text-sm text-[var(--color-neutral-700)]">{value}</p>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    {/if}

    <!-- Legal Status (parsed from legal actions) -->
    {#if asset.metadata?.legalActions || asset.metadata?.parsedLegalActions}
      <LegalStatus metadata={asset.metadata} />
    {/if}

    <!-- Status Transitions -->
    {#if transitions.length > 0}
      <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
            <svg class="h-4.5 w-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"/></svg>
          </div>
          <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Status Transitions</h2>
        </div>
        <p class="mt-2 text-sm text-[var(--color-neutral-500)]">
          Move this asset from <span class="font-medium text-[var(--color-neutral-700)]">{statusConfig[asset.status]?.label}</span> to a new status.
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3">
          {#each transitions as target}
            <button class="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-[var(--shadow-card)] transition-colors {transitionButtonColors[target] ?? 'bg-[var(--color-neutral-100)] text-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-200)]'}">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/></svg>
              Move to {statusConfig[target]?.label}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Status Timeline -->
    <div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-[var(--shadow-card)]">
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
              <div class="flex flex-col items-center">
                <div class="h-3 w-3 rounded-full {timelineDotColors[event.toStatus] ?? 'bg-[var(--color-neutral-400)]'} ring-4 ring-white z-10"></div>
                {#if i < timelineEvents.length - 1}
                  <div class="w-0.5 flex-1 bg-[var(--color-neutral-200)]"></div>
                {/if}
              </div>
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
    <div class="mt-6 rounded-2xl border border-red-200 bg-white p-6 shadow-[var(--shadow-card)]">
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
        <button class="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2.5 text-sm font-medium text-red-700 shadow-[var(--shadow-card)] transition-colors hover:bg-red-50">
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/></svg>
          Delete Asset
        </button>
      </div>
    </div>

    {/if}
  </div>
</div>
