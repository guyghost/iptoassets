# Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a premium landing page for iptoassets that replaces the root route redirect, showing unauthenticated users a marketing page with hero, benefits, features, testimonials, pricing, and footer sections.

**Architecture:** Single-page landing built as `+page.svelte` at the root route with section components in `_components/`. Uses Geist fonts scoped to the landing page only. Scroll animations via IntersectionObserver in a `FadeIn.svelte` wrapper. CSS-only product mockups (no images). Root `+page.server.ts` modified to only redirect authenticated users.

**Tech Stack:** SvelteKit, Svelte 5, Tailwind CSS v4, Geist Sans/Mono fonts via @fontsource

---

### Task 1: Install Geist Fonts

**Files:**
- Modify: `apps/web/package.json`

**Step 1: Install font packages**

Run:
```bash
cd apps/web && pnpm add @fontsource-variable/geist-sans @fontsource-variable/geist-mono
```

**Step 2: Verify installation**

Run:
```bash
ls node_modules/@fontsource-variable/geist-sans/index.css && ls node_modules/@fontsource-variable/geist-mono/index.css
```
Expected: both files exist

**Step 3: Commit**

```bash
git add apps/web/package.json apps/web/pnpm-lock.yaml ../../pnpm-lock.yaml
git commit -m "chore: add Geist Sans and Geist Mono font packages"
```

---

### Task 2: Modify Root Route (Server)

**Files:**
- Modify: `apps/web/src/routes/+page.server.ts`

**Step 1: Update the server load function**

Replace the entire file with:

```typescript
import { redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  if (event.locals.betterAuthUser) {
    throw redirect(303, "/dashboard");
  }
};
```

This removes the redirect to `/login` for unauthenticated users, letting them see the landing page instead.

**Step 2: Verify the app still builds**

Run:
```bash
cd apps/web && pnpm build
```
Expected: build succeeds (the page will be empty for now since `+page.svelte` is just a comment)

**Step 3: Commit**

```bash
git add apps/web/src/routes/+page.server.ts
git commit -m "feat: allow unauthenticated users to see root route"
```

---

### Task 3: FadeIn Scroll Animation Wrapper

**Files:**
- Create: `apps/web/src/routes/_components/FadeIn.svelte`

**Step 1: Create the FadeIn component**

This component uses IntersectionObserver to trigger a fade-in + slide-up animation when elements scroll into view.

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  let { children, delay = 0, class: className = "" } = $props();

  let element: HTMLDivElement;
  let visible = $state(false);

  onMount(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          visible = true;
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(element);
    return () => observer.disconnect();
  });
</script>

<div
  bind:this={element}
  class={className}
  style="opacity: {visible ? 1 : 0}; transform: translateY({visible ? 0 : 20}px); transition: opacity 500ms ease-out {delay}ms, transform 500ms ease-out {delay}ms;"
>
  {@render children()}
</div>
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_components/FadeIn.svelte
git commit -m "feat: add FadeIn scroll animation wrapper component"
```

---

### Task 4: Landing Page Navbar

**Files:**
- Create: `apps/web/src/routes/_components/LandingNavbar.svelte`

**Step 1: Create the navbar component**

```svelte
<script lang="ts">
  import { onMount } from "svelte";

  let scrolled = $state(false);

  onMount(() => {
    function handleScroll() {
      scrolled = window.scrollY > 10;
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  });
</script>

<nav
  class="fixed top-0 left-0 right-0 z-50 transition-[border-color,background-color] duration-300"
  style="background-color: {scrolled ? 'rgba(255,255,255,0.9)' : 'transparent'}; backdrop-filter: {scrolled ? 'blur(12px)' : 'none'}; border-bottom: 1px solid {scrolled ? '#e2e8f0' : 'transparent'};"
>
  <div class="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-6">
    <!-- Logo -->
    <a href="/" class="font-mono text-lg font-semibold text-[#0f172a]">
      iptoassets
    </a>

    <!-- Right side -->
    <div class="flex items-center gap-6">
      <a href="#features" class="hidden text-sm font-medium text-[#475569] hover:text-[#0f172a] transition-colors sm:block">
        Features
      </a>
      <a href="#pricing" class="hidden text-sm font-medium text-[#475569] hover:text-[#0f172a] transition-colors sm:block">
        Pricing
      </a>
      <a href="/login" class="text-sm font-medium text-[#475569] hover:text-[#0f172a] transition-colors">
        Sign in
      </a>
      <a
        href="/login"
        class="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
      >
        Get Started
      </a>
    </div>
  </div>
</nav>
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_components/LandingNavbar.svelte
git commit -m "feat: add landing page sticky navbar"
```

---

### Task 5: Dashboard Mockup (CSS-only)

**Files:**
- Create: `apps/web/src/routes/_components/DashboardMockup.svelte`

**Step 1: Create the CSS dashboard mockup**

This is a pure HTML/CSS stylized mini-dashboard that represents the product. No real data, no images.

```svelte
<div class="relative">
  <!-- Dot grid pattern behind -->
  <div
    class="absolute -inset-8 -z-10 opacity-[0.4]"
    style="background-image: radial-gradient(circle, #cbd5e1 1px, transparent 1px); background-size: 24px 24px;"
  ></div>

  <!-- Dashboard card -->
  <div
    class="rounded-xl border border-[#e2e8f0] bg-white shadow-[0_4px_16px_rgb(0_0_0/0.08),0_12px_40px_rgb(0_0_0/0.06)] overflow-hidden"
    style="transform: perspective(1200px) rotateY(-4deg);"
  >
    <!-- Fake titlebar -->
    <div class="flex items-center gap-2 border-b border-[#e2e8f0] px-4 py-3">
      <div class="flex gap-1.5">
        <div class="h-2.5 w-2.5 rounded-full bg-[#ef4444]"></div>
        <div class="h-2.5 w-2.5 rounded-full bg-[#f59e0b]"></div>
        <div class="h-2.5 w-2.5 rounded-full bg-[#22c55e]"></div>
      </div>
      <div class="ml-2 h-5 w-48 rounded bg-[#f1f5f9]"></div>
    </div>

    <div class="p-5 space-y-4">
      <!-- Stat cards row -->
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
          <p class="font-mono text-xs text-[#94a3b8]">Assets</p>
          <p class="mt-1 text-xl font-semibold text-[#0f172a]">127</p>
        </div>
        <div class="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
          <p class="font-mono text-xs text-[#94a3b8]">Deadlines</p>
          <p class="mt-1 text-xl font-semibold text-[#0f172a]">12</p>
        </div>
        <div class="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
          <p class="font-mono text-xs text-[#94a3b8]">Renewal Rate</p>
          <p class="mt-1 text-xl font-semibold text-[#0f172a]">94%</p>
        </div>
      </div>

      <!-- Mini data table -->
      <div class="rounded-lg border border-[#e2e8f0] overflow-hidden">
        <div class="grid grid-cols-[1fr_auto] gap-4 border-b border-[#e2e8f0] bg-[#f8fafc] px-4 py-2">
          <span class="text-xs font-medium text-[#94a3b8]">Asset</span>
          <span class="text-xs font-medium text-[#94a3b8]">Status</span>
        </div>
        <div class="grid grid-cols-[1fr_auto] gap-4 items-center border-b border-[#f1f5f9] px-4 py-2.5">
          <span class="text-sm text-[#334155] truncate">Patent EP1234567 — Valve Assembly</span>
          <span class="rounded-full bg-[#dcfce7] px-2 py-0.5 text-xs font-medium text-[#15803d]">Active</span>
        </div>
        <div class="grid grid-cols-[1fr_auto] gap-4 items-center border-b border-[#f1f5f9] px-4 py-2.5">
          <span class="text-sm text-[#334155] truncate">Trademark US5678 — CloudSync</span>
          <span class="rounded-full bg-[#fef9c3] px-2 py-0.5 text-xs font-medium text-[#a16207]">Pending</span>
        </div>
        <div class="grid grid-cols-[1fr_auto] gap-4 items-center px-4 py-2.5">
          <span class="text-sm text-[#334155] truncate">Design FR9012 — Interface Layout</span>
          <span class="rounded-full bg-[#dbeafe] px-2 py-0.5 text-xs font-medium text-[#1d4ed8]">Filed</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_components/DashboardMockup.svelte
git commit -m "feat: add CSS-only dashboard mockup for landing hero"
```

---

### Task 6: Hero Section

**Files:**
- Create: `apps/web/src/routes/_components/Hero.svelte`

**Step 1: Create the hero section**

```svelte
<script lang="ts">
  import DashboardMockup from "./DashboardMockup.svelte";
</script>

<section class="relative min-h-screen flex items-center pt-16 bg-[#f8fafc]">
  <div class="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-12 px-6 py-16 lg:grid-cols-[55%_45%] lg:gap-16 lg:py-0">
    <!-- Text -->
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

    <!-- Mockup -->
    <div class="hidden lg:block">
      <DashboardMockup />
    </div>
  </div>
</section>
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_components/Hero.svelte
git commit -m "feat: add landing page hero section"
```

---

### Task 7: Benefits Section

**Files:**
- Create: `apps/web/src/routes/_components/Benefits.svelte`

**Step 1: Create the benefits section**

Uses 4 cards with SVG line icons. Each icon is a simple inline SVG.

```svelte
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
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_components/Benefits.svelte
git commit -m "feat: add landing page benefits section"
```

---

### Task 8: Features Section with Mini Mockups

**Files:**
- Create: `apps/web/src/routes/_components/Features.svelte`

**Step 1: Create the features section**

Each feature row alternates text/visual placement. CSS-only mini mockups for each feature.

```svelte
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
            <!-- Mini filter chips -->
            <div class="flex flex-wrap gap-2 mb-4">
              <span class="rounded-full bg-[#2563eb] px-3 py-1 text-xs font-medium text-white">All types</span>
              <span class="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-medium text-[#475569]">Patents</span>
              <span class="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-medium text-[#475569]">Trademarks</span>
              <span class="rounded-full border border-[#e2e8f0] px-3 py-1 text-xs font-medium text-[#475569]">Designs</span>
            </div>
            <!-- Mini rows -->
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
            <!-- Mini timeline -->
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
            <!-- Mini bar chart -->
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
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_components/Features.svelte
git commit -m "feat: add landing page features section with CSS mockups"
```

---

### Task 9: Testimonials Section

**Files:**
- Create: `apps/web/src/routes/_components/Testimonials.svelte`

**Step 1: Create the testimonials section**

```svelte
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
            <span class="text-4xl font-serif leading-none text-[#2563eb] opacity-20">"</span>
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

    <!-- Trusted by logos placeholder -->
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
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_components/Testimonials.svelte
git commit -m "feat: add landing page testimonials section"
```

---

### Task 10: Pricing Section

**Files:**
- Create: `apps/web/src/routes/_components/Pricing.svelte`

**Step 1: Create the pricing section**

```svelte
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
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_components/Pricing.svelte
git commit -m "feat: add landing page pricing section"
```

---

### Task 11: Footer Section

**Files:**
- Create: `apps/web/src/routes/_components/LandingFooter.svelte`

**Step 1: Create the footer**

```svelte
<footer class="bg-[#0f172a] py-16">
  <div class="mx-auto max-w-[1200px] px-6">
    <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
      <!-- Brand -->
      <div class="col-span-2 md:col-span-1">
        <span class="font-mono text-lg font-semibold text-white">iptoassets</span>
        <p class="mt-3 text-sm leading-relaxed text-[#94a3b8]">
          The modern platform for intellectual property management.
        </p>
      </div>

      <!-- Product -->
      <div>
        <p class="text-sm font-semibold text-white">Product</p>
        <ul class="mt-4 space-y-2.5">
          <li><a href="#features" class="text-sm text-[#94a3b8] hover:text-white transition-colors">Features</a></li>
          <li><a href="#pricing" class="text-sm text-[#94a3b8] hover:text-white transition-colors">Pricing</a></li>
          <li><a href="#" class="text-sm text-[#94a3b8] hover:text-white transition-colors">Changelog</a></li>
          <li><a href="#" class="text-sm text-[#94a3b8] hover:text-white transition-colors">Roadmap</a></li>
        </ul>
      </div>

      <!-- Company -->
      <div>
        <p class="text-sm font-semibold text-white">Company</p>
        <ul class="mt-4 space-y-2.5">
          <li><a href="#" class="text-sm text-[#94a3b8] hover:text-white transition-colors">About</a></li>
          <li><a href="#" class="text-sm text-[#94a3b8] hover:text-white transition-colors">Blog</a></li>
          <li><a href="#" class="text-sm text-[#94a3b8] hover:text-white transition-colors">Careers</a></li>
          <li><a href="#" class="text-sm text-[#94a3b8] hover:text-white transition-colors">Contact</a></li>
        </ul>
      </div>

      <!-- Legal -->
      <div>
        <p class="text-sm font-semibold text-white">Legal</p>
        <ul class="mt-4 space-y-2.5">
          <li><a href="#" class="text-sm text-[#94a3b8] hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="#" class="text-sm text-[#94a3b8] hover:text-white transition-colors">Terms of Service</a></li>
          <li><a href="#" class="text-sm text-[#94a3b8] hover:text-white transition-colors">GDPR</a></li>
        </ul>
      </div>
    </div>

    <!-- Bottom bar -->
    <div class="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#1e293b] pt-8 sm:flex-row">
      <p class="text-sm text-[#64748b]">&copy; 2026 iptoassets. All rights reserved.</p>
      <div class="flex items-center gap-4">
        <!-- LinkedIn -->
        <a href="#" class="text-[#64748b] hover:text-white transition-colors" aria-label="LinkedIn">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        </a>
        <!-- X / Twitter -->
        <a href="#" class="text-[#64748b] hover:text-white transition-colors" aria-label="X">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/_components/LandingFooter.svelte
git commit -m "feat: add landing page footer"
```

---

### Task 12: Assemble Landing Page

**Files:**
- Modify: `apps/web/src/routes/+page.svelte`

**Step 1: Replace the page with the full landing page assembly**

Replace the entire file content with:

```svelte
<script lang="ts">
  import "@fontsource-variable/geist-sans";
  import "@fontsource-variable/geist-mono";

  import LandingNavbar from "./_components/LandingNavbar.svelte";
  import Hero from "./_components/Hero.svelte";
  import Benefits from "./_components/Benefits.svelte";
  import Features from "./_components/Features.svelte";
  import Testimonials from "./_components/Testimonials.svelte";
  import Pricing from "./_components/Pricing.svelte";
  import LandingFooter from "./_components/LandingFooter.svelte";
</script>

<svelte:head>
  <title>iptoassets — Modern IP Portfolio Management</title>
  <meta name="description" content="Track, protect, and grow your intellectual property. The modern platform for patent and trademark management." />
</svelte:head>

<div style="font-family: 'Geist Sans Variable', ui-sans-serif, system-ui, sans-serif;">
  <LandingNavbar />
  <Hero />
  <Benefits />
  <Features />
  <Testimonials />
  <Pricing />
  <LandingFooter />
</div>
```

**Step 2: Update the font-mono utility for landing page**

The `font-mono` class in Tailwind needs to resolve to Geist Mono within the landing page context. Since the landing page wraps everything in a div with `font-family: 'Geist Sans Variable'`, add a `<style>` block to scope `font-mono`:

Append to the file:

```svelte
<style>
  div :global(.font-mono) {
    font-family: "Geist Mono Variable", ui-monospace, monospace;
  }
</style>
```

**Step 3: Build and verify**

Run:
```bash
cd apps/web && pnpm build
```
Expected: build succeeds

**Step 4: Commit**

```bash
git add apps/web/src/routes/+page.svelte
git commit -m "feat: assemble landing page with all sections"
```

---

### Task 13: Visual QA and Polish

**Step 1: Run dev server**

Run:
```bash
cd apps/web && pnpm dev
```

**Step 2: Open in browser and verify**

Open `http://localhost:5173` (or whatever port). Check:
- Navbar is sticky and shows border on scroll
- Hero section is full viewport height with mockup on right
- Benefits section has 4 cards in a row on desktop
- Features section alternates text/visual sides
- Testimonials show 3 cards with avatars
- Pricing shows 3 plans with Pro highlighted
- Footer has 4 columns and social links
- Scroll animations fire correctly
- Responsive: check at mobile (375px) and tablet (768px) widths
- Font: Geist Sans renders for all text, Geist Mono for accents
- Authenticated users still redirect to /dashboard

**Step 3: Fix any issues found during QA**

Address layout, spacing, or responsive issues.

**Step 4: Final commit**

```bash
git add -A
git commit -m "fix: landing page visual polish and responsive adjustments"
```
