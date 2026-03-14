<script lang="ts">
  import FadeIn from "./FadeIn.svelte";
</script>

<section id="features" class="bg-[#f8fafc] py-24">
  <div class="mx-auto max-w-[1200px] px-6">
    <FadeIn class="text-center">
      <h2 class="text-3xl font-semibold tracking-[-0.015em] text-[#0f172a] sm:text-4xl">
        Everything you need to manage IP, nothing you don't
      </h2>
    </FadeIn>

    <div class="mt-20 space-y-16">
      <!-- Feature 1: Portfolio Overview (text left, visual right) -->
      <FadeIn>
        <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h3 class="text-2xl font-semibold text-[#0f172a]">Your entire portfolio at a glance</h3>
            <p class="mt-4 text-base leading-relaxed text-[#475569]">
              See every asset across jurisdictions, types, and statuses. Advanced filters and bulk actions make managing hundreds of assets feel effortless.
            </p>
          </div>
          <div class="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="rounded-full bg-[#2563eb] px-3 py-1 text-xs font-medium text-white">All types</span>
              <span class="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-medium text-[#475569]">Patents</span>
              <span class="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-medium text-[#475569]">Trademarks</span>
              <span class="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-medium text-[#475569]">Designs</span>
            </div>
            <div class="space-y-2">
              {#each [
                { name: "EP1234567 — Valve Assembly", type: "Patent", status: "Active", statusColor: "bg-[#dcfce7] text-[#15803d]" },
                { name: "US5678 — CloudSync", type: "Trademark", status: "Pending", statusColor: "bg-[#fef9c3] text-[#a16207]" },
                { name: "FR9012 — Interface Layout", type: "Design", status: "Filed", statusColor: "bg-[#dbeafe] text-[#1d4ed8]" },
              ] as row}
                <div class="flex items-center justify-between rounded-lg border border-[#f1f5f9] px-3 py-2">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="shrink-0 rounded bg-[#f1f5f9] px-1.5 py-0.5 font-mono text-[10px] text-[#64748b]">{row.type}</span>
                    <span class="text-sm text-[#334155] truncate">{row.name}</span>
                  </div>
                  <span class="shrink-0 rounded-full {row.statusColor} px-2 py-0.5 text-xs font-medium">{row.status}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </FadeIn>

      <!-- Feature 2: Deadline Tracking (visual left, text right) -->
      <FadeIn>
        <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div class="order-2 lg:order-1 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <div class="space-y-3">
              {#each [
                { date: "Mar 18", label: "EP1234567 — Renewal fee due", urgency: "bg-[#fef2f2] border-[#fecaca] text-[#b91c1c]" },
                { date: "Mar 25", label: "US5678 — Office action response", urgency: "bg-[#fffbeb] border-[#fde68a] text-[#92400e]" },
                { date: "Apr 02", label: "FR9012 — Filing deadline", urgency: "bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]" },
                { date: "Apr 15", label: "EP9876543 — Annual fee", urgency: "bg-[#f0fdf4] border-[#bbf7d0] text-[#166534]" },
              ] as item}
                <div class="flex items-center gap-3 rounded-lg border {item.urgency} px-3 py-2.5">
                  <span class="shrink-0 font-mono text-xs font-medium">{item.date}</span>
                  <span class="text-sm">{item.label}</span>
                </div>
              {/each}
            </div>
          </div>
          <div class="order-1 lg:order-2">
            <h3 class="text-2xl font-semibold text-[#0f172a]">Deadlines that don't slip through</h3>
            <p class="mt-4 text-base leading-relaxed text-[#475569]">
              Automatic deadline detection from legal status data. Calendar view, risk scoring, and configurable alerts keep your team ahead of every deadline.
            </p>
          </div>
        </div>
      </FadeIn>

      <!-- Feature 3: Document Management (text left, visual right) -->
      <FadeIn>
        <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <h3 class="text-2xl font-semibold text-[#0f172a]">Every document, instantly findable</h3>
            <p class="mt-4 text-base leading-relaxed text-[#475569]">
              Upload, classify, and link documents to assets automatically. AI-powered classification saves hours of manual sorting.
            </p>
          </div>
          <div class="rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <div class="grid grid-cols-2 gap-3">
              {#each [
                { name: "Grant Certificate", type: "PDF", tag: "Official" },
                { name: "Priority Document", type: "PDF", tag: "Filing" },
                { name: "Claims Analysis", type: "DOCX", tag: "Internal" },
                { name: "Search Report", type: "PDF", tag: "Prior Art" },
              ] as doc}
                <div class="rounded-lg border border-[#e2e8f0] p-3">
                  <div class="flex items-center gap-2">
                    <div class="flex h-8 w-8 items-center justify-center rounded bg-[#eff6ff]">
                      <span class="font-mono text-[10px] font-medium text-[#2563eb]">{doc.type}</span>
                    </div>
                    <span class="text-sm font-medium text-[#334155] truncate">{doc.name}</span>
                  </div>
                  <span class="mt-2 inline-block rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-medium text-[#64748b]">{doc.tag}</span>
                </div>
              {/each}
            </div>
          </div>
        </div>
      </FadeIn>

      <!-- Feature 4: Analytics (visual left, text right) -->
      <FadeIn>
        <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div class="order-2 lg:order-1 rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-sm">
            <p class="text-xs font-medium text-[#94a3b8] mb-3">Assets by jurisdiction</p>
            <div class="flex items-end gap-2 h-28">
              {#each [
                { label: "EP", height: "75%" },
                { label: "US", height: "100%" },
                { label: "FR", height: "45%" },
                { label: "DE", height: "60%" },
                { label: "JP", height: "35%" },
                { label: "CN", height: "50%" },
              ] as bar}
                <div class="flex flex-1 flex-col items-center gap-1">
                  <div class="w-full rounded-t bg-[#2563eb] opacity-80" style="height: {bar.height};"></div>
                  <span class="font-mono text-[10px] text-[#94a3b8]">{bar.label}</span>
                </div>
              {/each}
            </div>
            <div class="mt-4 grid grid-cols-3 gap-3">
              <div class="text-center">
                <p class="text-lg font-semibold text-[#0f172a]">127</p>
                <p class="text-[10px] text-[#94a3b8]">Total Assets</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-semibold text-[#0f172a]">6</p>
                <p class="text-[10px] text-[#94a3b8]">Jurisdictions</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-semibold text-[#22c55e]">+12%</p>
                <p class="text-[10px] text-[#94a3b8]">YoY Growth</p>
              </div>
            </div>
          </div>
          <div class="order-1 lg:order-2">
            <h3 class="text-2xl font-semibold text-[#0f172a]">Insights that drive decisions</h3>
            <p class="mt-4 text-base leading-relaxed text-[#475569]">
              Track portfolio costs, renewal rates, and asset distribution across jurisdictions. Export reports for board presentations or budget reviews.
            </p>
          </div>
        </div>
      </FadeIn>
    </div>
  </div>
</section>
