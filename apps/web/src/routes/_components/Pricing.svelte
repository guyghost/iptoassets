<script lang="ts">
  import FadeIn from "./FadeIn.svelte";

  const plans = [
    {
      name: "Free",
      price: "0",
      period: "",
      description: "For solo inventors and small portfolios",
      features: [
        "Up to 50 assets",
        "1 user",
        "Basic deadline alerts",
        "1 GB document storage",
        "Basic analytics",
        "Community support",
      ],
      cta: "Get started",
      highlighted: false,
    },
    {
      name: "Pro",
      price: "49",
      period: "/mo",
      description: "For growing teams managing IP portfolios",
      features: [
        "Unlimited assets",
        "Up to 10 users",
        "Smart alerts + Risk scoring",
        "25 GB document storage",
        "Advanced analytics",
        "Priority email support",
      ],
      cta: "Start free trial",
      highlighted: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For organizations with complex IP needs",
      features: [
        "Unlimited assets",
        "Unlimited users",
        "Custom SLA",
        "Unlimited storage",
        "Custom reports",
        "Dedicated CSM",
      ],
      cta: "Contact sales",
      highlighted: false,
    },
  ];
</script>

<section id="pricing" class="bg-[#f8fafc] py-24">
  <div class="mx-auto max-w-[1200px] px-6">
    <FadeIn class="text-center">
      <h2 class="text-3xl font-semibold tracking-[-0.015em] text-[#0f172a] sm:text-4xl">
        Simple, transparent pricing
      </h2>
      <p class="mt-4 text-lg text-[#475569]">
        Start free. Upgrade when you need more.
      </p>
    </FadeIn>

    <div class="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
      {#each plans as plan, i}
        <FadeIn delay={i * 100}>
          <div
            class="relative flex flex-col rounded-xl border bg-white p-8 {plan.highlighted ? 'border-[#2563eb] border-2 shadow-md' : 'border-[#e2e8f0]'}"
          >
            {#if plan.highlighted}
              <div class="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#2563eb] px-3 py-1 text-xs font-semibold text-white">
                Most popular
              </div>
            {/if}

            <p class="font-mono text-sm font-medium uppercase tracking-[0.05em] text-[#94a3b8]">
              {plan.name}
            </p>

            <div class="mt-4 flex items-baseline gap-1">
              {#if plan.price === "Custom"}
                <span class="text-4xl font-semibold text-[#0f172a]">Custom</span>
              {:else}
                <span class="font-mono text-4xl font-semibold text-[#0f172a]">&euro;{plan.price}</span>
                {#if plan.period}
                  <span class="text-base text-[#94a3b8]">{plan.period}</span>
                {/if}
              {/if}
            </div>

            <p class="mt-2 text-sm text-[#475569]">{plan.description}</p>

            <ul class="mt-8 flex-1 space-y-3">
              {#each plan.features as feature}
                <li class="flex items-start gap-2.5">
                  <svg class="mt-0.5 h-4 w-4 shrink-0 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M4.5 12.75l6 6 9-13.5"/></svg>
                  <span class="text-sm text-[#475569]">{feature}</span>
                </li>
              {/each}
            </ul>

            <a
              href={plan.highlighted ? "/login" : plan.price === "Custom" ? "mailto:contact@iptoassets.com" : "/login"}
              class="mt-8 block rounded-md py-3 text-center text-sm font-semibold transition-colors {plan.highlighted ? 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]' : 'border border-[#e2e8f0] text-[#0f172a] hover:bg-[#f8fafc]'}"
            >
              {plan.cta}
            </a>
          </div>
        </FadeIn>
      {/each}
    </div>
  </div>
</section>
