<script lang="ts">
  import { parseLegalActions, type ParsedLegalActions, type LegalMember, type LegalMemberState, type LegalEvent } from "./parse-legal-actions";

  interface Props {
    metadata: Record<string, unknown>;
  }
  let { metadata }: Props = $props();

  let parsed = $derived<ParsedLegalActions>(
    (metadata.parsedLegalActions as ParsedLegalActions)
      ?? parseLegalActions(String(metadata.legalActions ?? ""))
  );

  // Accordion state: which members are expanded
  let expandedMembers = $state<Set<string>>(new Set());
  let expandedMemberStates = $state<Set<string>>(new Set());
  let showAllEvents = $state<Set<string>>(new Set());

  function toggleMember(id: string) {
    const next = new Set(expandedMembers);
    if (next.has(id)) next.delete(id); else next.add(id);
    expandedMembers = next;
  }

  function toggleMemberState(key: string) {
    const next = new Set(expandedMemberStates);
    if (next.has(key)) next.delete(key); else next.add(key);
    expandedMemberStates = next;
  }

  function toggleShowAll(key: string) {
    const next = new Set(showAllEvents);
    if (next.has(key)) next.delete(key); else next.add(key);
    showAllEvents = next;
  }

  // Status badge colors
  function statusBadgeClasses(state: string, status: string): string {
    if (state === "DEAD" || status === "LAPSED" || status === "REVOKED") {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (status === "GRANTED") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (state === "ALIVE") return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-[var(--color-neutral-100)] text-[var(--color-neutral-600)] border-[var(--border-color)]";
  }

  // Event group colors
  const groupDotColor: Record<string, string> = {
    "Examination events": "bg-blue-500",
    "Entry into national phase": "bg-indigo-500",
    "Designated states": "bg-purple-500",
    "Payment or non-payment notifications Restitution or restoration": "bg-emerald-500",
    "Event indicating In Force": "bg-green-500",
    "Event indicating Not In Force": "bg-red-500",
    "Administrative notifications": "bg-[var(--color-neutral-400)]",
    "Classification modifications Corrections": "bg-amber-500",
    "Corrections": "bg-amber-500",
  };

  function getDotColor(group: string): string {
    for (const [key, color] of Object.entries(groupDotColor)) {
      if (group.includes(key) || key.includes(group)) return color;
    }
    return "bg-[var(--color-neutral-400)]";
  }

  // Noise groups to hide by default
  const noiseGroups = new Set([
    "Administrative notifications",
    "Classification modifications Corrections",
    "Corrections",
  ]);

  function isNoise(event: LegalEvent): boolean {
    return noiseGroups.has(event.group) || event.group.includes("Administrative") || event.group.includes("Classification");
  }

  function splitEvents(events: LegalEvent[]): { visible: LegalEvent[]; hidden: LegalEvent[] } {
    const visible: LegalEvent[] = [];
    const hidden: LegalEvent[] = [];
    for (const e of events) {
      if (isNoise(e)) hidden.push(e);
      else visible.push(e);
    }
    return { visible, hidden };
  }

  function formatDate(d: string | null): string {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    } catch {
      return d;
    }
  }
</script>

{#if parsed.members.length > 0}
<div class="mt-6 rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
  <div class="flex items-center gap-2.5">
    <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
      <svg class="h-4.5 w-4.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"/></svg>
    </div>
    <h2 class="text-base font-semibold text-[var(--color-neutral-900)]">Legal Status</h2>
  </div>

  <!-- Summary badges -->
  <div class="mt-4 flex flex-wrap gap-2">
    {#each parsed.members as member}
      <button
        onclick={() => toggleMember(member.id)}
        class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors hover:shadow-sm {statusBadgeClasses(member.legalState, member.status)}"
      >
        <span class="font-bold">{member.country}</span>
        <span class="text-[10px] opacity-70">{member.legalState}</span>
        <span>{member.status}</span>
      </button>
    {/each}
  </div>

  <!-- Accordion -->
  <div class="mt-5 space-y-3">
    {#each parsed.members as member}
      {@const isExpanded = expandedMembers.has(member.id)}
      <div class="rounded-xl border border-[var(--border-color)] overflow-hidden">
        <!-- Accordion header -->
        <button
          onclick={() => toggleMember(member.id)}
          class="flex w-full items-center justify-between px-5 py-3.5 text-left hover:bg-[var(--color-neutral-50)] transition-colors"
        >
          <div class="flex items-center gap-3">
            <span class="inline-flex items-center justify-center rounded bg-[var(--color-neutral-100)] px-2 py-0.5 text-xs font-bold text-[var(--color-neutral-700)]">{member.country}</span>
            <span class="text-sm font-medium text-[var(--color-neutral-900)]">{member.id}</span>
            <span class="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium {statusBadgeClasses(member.legalState, member.status)}">
              {member.status}
            </span>
          </div>
          <div class="flex items-center gap-3">
            {#if member.expiryDate}
              <span class="text-xs text-[var(--color-neutral-500)]">Expires {formatDate(member.expiryDate)}</span>
            {/if}
            <svg class="h-4 w-4 text-[var(--color-neutral-400)] transition-transform {isExpanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
          </div>
        </button>

        {#if isExpanded}
          <div class="border-t border-[var(--border-color)] px-5 py-4 bg-[var(--color-neutral-50)]/50">

            <!-- Member states -->
            {#if member.memberStates.length > 0}
              <div class="mb-4">
                <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] mb-2">Jurisdictions</p>
                <div class="space-y-2">
                  {#each member.memberStates as ms}
                    {@const msKey = `${member.id}:${ms.id}`}
                    {@const msExpanded = expandedMemberStates.has(msKey)}
                    <div class="rounded-lg border border-[var(--border-color)] bg-white">
                      <button
                        onclick={() => toggleMemberState(msKey)}
                        class="flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-[var(--color-neutral-50)] transition-colors"
                      >
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-bold text-[var(--color-neutral-600)]">{ms.country}</span>
                          <span class="text-xs text-[var(--color-neutral-500)]">{ms.id}</span>
                          <span class="inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px] font-medium {statusBadgeClasses(ms.legalState, ms.status)}">
                            {ms.status}
                          </span>
                        </div>
                        <div class="flex items-center gap-2">
                          {#if ms.expiryDate}
                            <span class="text-[10px] text-[var(--color-neutral-400)]">{formatDate(ms.expiryDate)}</span>
                          {/if}
                          <svg class="h-3 w-3 text-[var(--color-neutral-400)] transition-transform {msExpanded ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19.5 8.25l-7.5 7.5-7.5-7.5"/></svg>
                        </div>
                      </button>
                      {#if msExpanded && ms.events.length > 0}
                        {@const msSplit = splitEvents(ms.events)}
                        {@const msShowAll = showAllEvents.has(msKey)}
                        {@const msDisplayEvents = msShowAll ? ms.events : msSplit.visible}
                        <div class="border-t border-[var(--border-color)] px-4 py-3">
                          <div class="space-y-0">
                            {#each msDisplayEvents as event, i}
                              <div class="relative flex gap-3">
                                <div class="flex flex-col items-center">
                                  <div class="h-2 w-2 rounded-full {getDotColor(event.group)} ring-2 ring-white z-10 mt-1.5"></div>
                                  {#if i < msDisplayEvents.length - 1}
                                    <div class="w-0.5 flex-1 bg-[var(--color-neutral-200)]"></div>
                                  {/if}
                                </div>
                                <div class="pb-3 min-w-0">
                                  <div class="flex items-center gap-2">
                                    <span class="text-[10px] text-[var(--color-neutral-400)] font-mono">{event.date}</span>
                                    <span class="text-[10px] text-[var(--color-neutral-400)]">{event.code}</span>
                                  </div>
                                  <p class="text-xs text-[var(--color-neutral-700)] truncate">{event.description || event.group}</p>
                                </div>
                              </div>
                            {/each}
                          </div>
                          {#if !msShowAll && msSplit.hidden.length > 0}
                            <button onclick={() => toggleShowAll(msKey)} class="mt-1 text-[10px] text-[var(--color-primary-600)] hover:underline">
                              Show {msSplit.hidden.length} more events
                            </button>
                          {:else if msShowAll && msSplit.hidden.length > 0}
                            <button onclick={() => toggleShowAll(msKey)} class="mt-1 text-[10px] text-[var(--color-primary-600)] hover:underline">
                              Hide minor events
                            </button>
                          {/if}
                        </div>
                      {/if}
                    </div>
                  {/each}
                </div>
              </div>
            {/if}

            <!-- Events timeline -->
            {#if member.events.length > 0}
              {@const split = splitEvents(member.events)}
              {@const memberShowAll = showAllEvents.has(member.id)}
              {@const displayEvents = memberShowAll ? member.events : split.visible}
              <div>
                <p class="text-xs font-medium uppercase tracking-wider text-[var(--color-neutral-400)] mb-3">Event Timeline</p>
                <div class="space-y-0">
                  {#each displayEvents as event, i}
                    <div class="relative flex gap-3">
                      <div class="flex flex-col items-center">
                        <div class="h-2.5 w-2.5 rounded-full {getDotColor(event.group)} ring-2 ring-white z-10 mt-1"></div>
                        {#if i < displayEvents.length - 1}
                          <div class="w-0.5 flex-1 bg-[var(--color-neutral-200)]"></div>
                        {/if}
                      </div>
                      <div class="pb-4 min-w-0 flex-1">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-xs text-[var(--color-neutral-500)] font-mono">{event.date}</span>
                          <span class="inline-flex items-center rounded bg-[var(--color-neutral-100)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-neutral-500)]">{event.code}</span>
                          {#if event.indicator === "Pos"}
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Positive"></span>
                          {:else if event.indicator === "Neg"}
                            <span class="h-1.5 w-1.5 rounded-full bg-red-500" title="Negative"></span>
                          {/if}
                        </div>
                        <p class="mt-0.5 text-sm text-[var(--color-neutral-800)]">{event.description || event.group}</p>
                        {#if event.group && event.description}
                          <p class="text-[10px] text-[var(--color-neutral-400)]">{event.group}</p>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
                {#if !memberShowAll && split.hidden.length > 0}
                  <button onclick={() => toggleShowAll(member.id)} class="text-xs text-[var(--color-primary-600)] hover:underline">
                    Show {split.hidden.length} more events
                  </button>
                {:else if memberShowAll && split.hidden.length > 0}
                  <button onclick={() => toggleShowAll(member.id)} class="text-xs text-[var(--color-primary-600)] hover:underline">
                    Hide minor events
                  </button>
                {/if}
              </div>
            {:else}
              <p class="text-xs text-[var(--color-neutral-500)]">No events recorded.</p>
            {/if}

          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
{/if}
