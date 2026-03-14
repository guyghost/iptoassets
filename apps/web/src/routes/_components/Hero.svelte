<script lang="ts">
  import DashboardMockup from "./DashboardMockup.svelte";
</script>

<section class="relative min-h-screen flex items-center pt-16 bg-[#f8fafc]">
  <div class="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[55%_45%] lg:gap-16 lg:py-0">
    <div>
      <p class="font-mono text-xs font-medium uppercase tracking-[0.1em] text-[#2563eb]">
        IP Portfolio Management
      </p>
      <h1 class="mt-4 text-4xl font-semibold tracking-[-0.02em] text-[#0f172a] sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
        Track, protect, and grow your intellectual property
      </h1>
      <p class="mt-6 max-w-lg text-lg leading-relaxed text-[#475569]">
        The modern platform for patent and trademark management. Monitor deadlines, analyze portfolios, and make smarter renewal decisions — all in one place.
      </p>
      <div class="mt-8 flex flex-wrap items-center gap-4">
        <a
          href="/login"
          class="rounded-md bg-[#2563eb] px-7 py-3 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
        >
          Start for free
        </a>
        <a
          href="#features"
          class="rounded-md border border-[#e2e8f0] bg-white px-7 py-3 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
        >
          See how it works
        </a>
      </div>
      <p class="mt-4 text-sm text-[#94a3b8]">
        No credit card required &middot; Free for up to 50 assets
      </p>
    </div>

    <div class="hidden lg:block">
      <DashboardMockup />
    </div>
  </div>
</section>
