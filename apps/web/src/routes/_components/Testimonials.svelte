<script lang="ts">
  import FadeIn from "./FadeIn.svelte";

  const testimonials = [
    {
      quote: "We went from spreadsheet chaos to complete visibility in a week.",
      initials: "SM",
      name: "S.M.",
      role: "Head of IP, Biotech Company",
      color: "bg-[#dbeafe] text-[#1d4ed8]",
    },
    {
      quote: "The deadline alerts alone saved us from a costly lapse. This tool pays for itself.",
      initials: "AR",
      name: "A.R.",
      role: "Patent Attorney, Law Firm",
      color: "bg-[#dcfce7] text-[#15803d]",
    },
    {
      quote: "Finally, an IP tool that doesn't feel like it was designed in 2005.",
      initials: "LK",
      name: "L.K.",
      role: "Innovation Director, Electronics Group",
      color: "bg-[#fef9c3] text-[#a16207]",
    },
  ];
</script>

<section class="bg-white py-24">
  <div class="mx-auto max-w-[1200px] px-6">
    <FadeIn class="text-center">
      <h2 class="text-3xl font-semibold tracking-[-0.015em] text-[#0f172a] sm:text-4xl">
        Trusted by IP professionals
      </h2>
    </FadeIn>

    <div class="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
      {#each testimonials as t, i}
        <FadeIn delay={i * 100}>
          <div class="rounded-lg border border-[#e2e8f0] bg-white p-6 shadow-sm">
            <span class="text-4xl font-serif leading-none text-[#2563eb] opacity-20">&ldquo;</span>
            <p class="mt-2 text-base italic leading-relaxed text-[#334155]">
              {t.quote}
            </p>
            <div class="mt-6 border-t border-[#e2e8f0] pt-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full {t.color} text-sm font-semibold">
                  {t.initials}
                </div>
                <div>
                  <p class="text-sm font-semibold text-[#0f172a]">{t.name}</p>
                  <p class="text-sm text-[#94a3b8]">{t.role}</p>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      {/each}
    </div>

    <FadeIn>
      <div class="mt-16 text-center">
        <p class="text-sm font-medium text-[#94a3b8]">Trusted by teams at</p>
        <div class="mt-6 flex items-center justify-center gap-8">
          {#each Array(5) as _}
            <div class="h-8 w-24 rounded bg-[#e2e8f0] opacity-40"></div>
          {/each}
        </div>
      </div>
    </FadeIn>
  </div>
</section>
