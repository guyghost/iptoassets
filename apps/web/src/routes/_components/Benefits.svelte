<script lang="ts">
  import FadeIn from "./FadeIn.svelte";

  const benefits = [
    {
      title: "Centralized portfolio",
      description: "All your patents, trademarks, and designs in one structured view. Filter, search, and export in seconds.",
      icon: "folder",
    },
    {
      title: "Deadline intelligence",
      description: "Never miss a renewal or filing deadline. Smart alerts surface what needs attention before it's too late.",
      icon: "clock",
    },
    {
      title: "Actionable analytics",
      description: "Understand portfolio composition, cost trends, and renewal patterns at a glance with built-in dashboards.",
      icon: "chart",
    },
    {
      title: "Team collaboration",
      description: "Invite colleagues, assign roles, and share portfolio views. Everyone stays aligned without email chains.",
      icon: "users",
    },
  ];
</script>

<section class="bg-white py-24">
  <div class="mx-auto max-w-[1200px] px-6">
    <FadeIn class="text-center">
      <h2 class="text-3xl font-semibold tracking-[-0.015em] text-[#0f172a] sm:text-4xl">
        Why teams choose iptoassets
      </h2>
      <p class="mt-4 text-lg text-[#475569]">
        Built for IP professionals who need clarity, not complexity.
      </p>
    </FadeIn>

    <div class="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {#each benefits as benefit, i}
        <FadeIn delay={i * 100}>
          <div class="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-6">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[#eff6ff]">
              {#if benefit.icon === "folder"}
                <svg class="h-6 w-6 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
              {:else if benefit.icon === "clock"}
                <svg class="h-6 w-6 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              {:else if benefit.icon === "chart"}
                <svg class="h-6 w-6 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/></svg>
              {:else if benefit.icon === "users"}
                <svg class="h-6 w-6 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/></svg>
              {/if}
            </div>
            <h3 class="mt-4 text-base font-semibold text-[#0f172a]">{benefit.title}</h3>
            <p class="mt-2 text-sm leading-relaxed text-[#475569]">{benefit.description}</p>
          </div>
        </FadeIn>
      {/each}
    </div>
  </div>
</section>
