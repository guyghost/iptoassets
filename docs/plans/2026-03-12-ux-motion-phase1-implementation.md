# UX/Motion Phase 1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add functional animations and loading states to the IPMS dashboard — skeleton loading, KPI staggered entrance with count-up, health gauge animation, flashlight hover, and page transitions.

**Architecture:** Create reusable Svelte actions (`use:countUp`, `use:flashlight`, `use:inView`) in a shared `$lib/animations/` directory. Define all `@keyframes` in a central CSS file imported once. Apply actions and CSS classes to existing dashboard components with minimal HTML changes.

**Tech Stack:** Svelte 5 (actions, $state), Tailwind CSS 4, CSS @keyframes, IntersectionObserver API

---

### Task 1: Create animations CSS file with all @keyframes

**Files:**
- Create: `packages/design-system/src/animations.css`
- Modify: `apps/web/src/app.css`

**Step 1: Create the animations CSS file**

Create `packages/design-system/src/animations.css`:

```css
/* === Skeleton Loading === */
@keyframes skeleton-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
  border-radius: 0.5rem;
}

.skeleton-dark {
  background: linear-gradient(90deg, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite linear;
  border-radius: 0.5rem;
}

/* === Staggered Card Entrance === */
@keyframes card-enter {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-card-enter {
  opacity: 0;
  animation: card-enter 400ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* === Health Gauge Fill === */
@keyframes gauge-fill {
  from { width: 0%; }
}

.animate-gauge-fill {
  animation: gauge-fill 800ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* === Page Entrance === */
@keyframes page-enter {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-page-enter {
  animation: page-enter 250ms ease-out both;
}

/* === Status Flash === */
@keyframes status-flash {
  0% { box-shadow: 0 0 0 0 rgb(34 197 94 / 0.4); }
  70% { box-shadow: 0 0 0 8px rgb(34 197 94 / 0); }
  100% { box-shadow: 0 0 0 8px rgb(34 197 94 / 0); }
}

.animate-status-flash {
  animation: status-flash 400ms ease-out;
}

/* === Flashlight Card Effect === */
.flashlight-card {
  position: relative;
  overflow: hidden;
}

.flashlight-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    300px circle at var(--flash-x, 50%) var(--flash-y, 50%),
    rgb(59 130 246 / 0.04),
    transparent 70%
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity 300ms;
  border-radius: inherit;
}

.flashlight-card:hover::after {
  opacity: 1;
}

/* === Border Beam === */
@keyframes border-beam-travel {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.border-beam {
  position: relative;
  overflow: hidden;
}

.border-beam::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  padding: 1.5px;
  background: linear-gradient(90deg, transparent 20%, var(--color-primary-400) 50%, transparent 80%);
  background-size: 200% 100%;
  animation: border-beam-travel 3s linear infinite;
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}
```

**Step 2: Import in app.css**

Modify `apps/web/src/app.css` to:

```css
@import "tailwindcss";
@import "@ipms/design-system/tokens.css";
@import "@ipms/design-system/animations.css";
```

**Step 3: Verify the app builds**

Run: `cd apps/web && npm run dev -- --host 2>&1 | head -10`
Expected: Server starts without CSS import errors. Kill after confirming.

**Step 4: Commit**

```bash
git add packages/design-system/src/animations.css apps/web/src/app.css
git commit -m "feat: add animations CSS with skeleton, card-enter, gauge-fill, flashlight, border-beam"
```

---

### Task 2: Create Svelte actions (countUp, flashlight, inView)

**Files:**
- Create: `apps/web/src/lib/animations/count-up.ts`
- Create: `apps/web/src/lib/animations/flashlight.ts`
- Create: `apps/web/src/lib/animations/in-view.ts`
- Create: `apps/web/src/lib/animations/index.ts`

**Step 1: Create countUp action**

Create `apps/web/src/lib/animations/count-up.ts`:

```typescript
export function countUp(node: HTMLElement, target: number) {
  let animationId: number;

  function animate(newTarget: number) {
    cancelAnimationFrame(animationId);
    if (newTarget === 0 || isNaN(newTarget)) {
      node.textContent = String(newTarget || 0);
      return;
    }
    const duration = 600;
    const startTime = performance.now();
    const startValue = 0;

    function update(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(startValue + (newTarget - startValue) * eased));
      if (progress < 1) animationId = requestAnimationFrame(update);
    }

    animationId = requestAnimationFrame(update);
  }

  animate(target);

  return {
    update(newTarget: number) {
      animate(newTarget);
    },
    destroy() {
      cancelAnimationFrame(animationId);
    },
  };
}
```

**Step 2: Create flashlight action**

Create `apps/web/src/lib/animations/flashlight.ts`:

```typescript
export function flashlight(node: HTMLElement) {
  function handleMove(e: MouseEvent) {
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--flash-x", `${e.clientX - rect.left}px`);
    node.style.setProperty("--flash-y", `${e.clientY - rect.top}px`);
  }

  node.classList.add("flashlight-card");
  node.addEventListener("mousemove", handleMove);

  return {
    destroy() {
      node.removeEventListener("mousemove", handleMove);
      node.classList.remove("flashlight-card");
    },
  };
}
```

**Step 3: Create inView action**

Create `apps/web/src/lib/animations/in-view.ts`:

```typescript
export function inView(
  node: HTMLElement,
  options?: { class?: string; delay?: number; once?: boolean },
) {
  const className = options?.class ?? "animate-card-enter";
  const delay = options?.delay ?? 0;
  const once = options?.once ?? true;

  node.style.opacity = "0";

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          setTimeout(() => {
            node.style.opacity = "";
            node.classList.add(className);
          }, delay);
          if (once) observer.unobserve(node);
        }
      }
    },
    { threshold: 0.1 },
  );

  observer.observe(node);

  return {
    destroy() {
      observer.disconnect();
    },
  };
}
```

**Step 4: Create barrel export**

Create `apps/web/src/lib/animations/index.ts`:

```typescript
export { countUp } from "./count-up.js";
export { flashlight } from "./flashlight.js";
export { inView } from "./in-view.js";
```

**Step 5: Verify types**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep animations`
Expected: No errors from the animations directory.

**Step 6: Commit**

```bash
git add apps/web/src/lib/animations/
git commit -m "feat: add Svelte actions for countUp, flashlight, and inView animations"
```

---

### Task 3: Add skeleton loading to dashboard

**Files:**
- Modify: `apps/web/src/routes/(app)/dashboard/+page.svelte`

This task replaces the current `"---"` loading placeholders with proper skeleton blocks.

**Step 1: Replace the Asset Tracker loading state**

Find the KPI stats grid (around line 301-309). Replace the `{stat.value}` display with a skeleton when loading.

Replace this block:
```svelte
<div class="mt-5 grid grid-cols-3 gap-4">
  {#each stats as stat}
    <div class="rounded-xl border px-5 py-4 {stat.accent ? 'border-amber-200 bg-amber-50/50' : 'border-[var(--border-color)]'}">
      <p class="text-sm {stat.accent ? 'font-medium text-amber-600' : 'text-[var(--color-neutral-500)]'}">{stat.label}</p>
      <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{stat.value}</p>
      <p class="mt-1 text-xs text-[var(--color-neutral-400)]">{stat.sub}</p>
    </div>
  {/each}
</div>
```

With:
```svelte
<div class="mt-5 grid grid-cols-3 gap-4">
  {#if loading}
    {#each [0, 1, 2] as i}
      <div class="rounded-xl border border-[var(--border-color)] px-5 py-4">
        <div class="skeleton h-4 w-20"></div>
        <div class="skeleton mt-2 h-8 w-16"></div>
        <div class="skeleton mt-2 h-3 w-14"></div>
      </div>
    {/each}
  {:else}
    {#each stats as stat}
      <div class="rounded-xl border px-5 py-4 {stat.accent ? 'border-amber-200 bg-amber-50/50' : 'border-[var(--border-color)]'}">
        <p class="text-sm {stat.accent ? 'font-medium text-amber-600' : 'text-[var(--color-neutral-500)]'}">{stat.label}</p>
        <p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{stat.value}</p>
        <p class="mt-1 text-xs text-[var(--color-neutral-400)]">{stat.sub}</p>
      </div>
    {/each}
  {/if}
</div>
```

**Step 2: Replace the Recent Assets loading state**

Find the table loading (around line 336-339). Replace the single "---" row with skeleton rows.

Replace:
```svelte
{#if loading}
  <tr>
    <td colspan="5" class="py-8 text-center text-sm text-[var(--color-neutral-400)]">{"\u2014"}</td>
  </tr>
```

With:
```svelte
{#if loading}
  {#each [0, 1, 2, 3, 4] as _}
    <tr class="border-b border-[var(--border-color)] last:border-0">
      <td class="py-3.5 pr-4"><div class="skeleton h-4 w-40"></div></td>
      <td class="py-3.5 pr-4"><div class="skeleton h-4 w-16"></div></td>
      <td class="py-3.5 text-center"><div class="skeleton mx-auto h-5 w-5 rounded-full"></div></td>
      <td class="py-3.5 pr-4"><div class="skeleton h-5 w-16 rounded-full"></div></td>
      <td class="py-3.5 text-right"><div class="skeleton ml-auto h-4 w-20"></div></td>
    </tr>
  {/each}
```

**Step 3: Replace the For You Today loading state**

Find the deadlines loading (around line 391-392). Replace the single "---" with skeleton items.

Replace:
```svelte
{#if loading}
  <div class="py-4 text-center text-sm text-[var(--color-neutral-400)]">{"\u2014"}</div>
```

With:
```svelte
{#if loading}
  {#each [0, 1, 2] as _}
    <div class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0">
      <div class="flex items-center gap-3">
        <div class="skeleton h-9 w-9 rounded-xl"></div>
        <div class="skeleton h-4 w-32"></div>
      </div>
      <div class="skeleton h-6 w-14 rounded-full"></div>
    </div>
  {/each}
```

**Step 4: Replace the Portfolio Health loading with skeleton-dark**

Find the health card (around line 427-450). Wrap the numeric content in loading checks.

Replace the health score display:
```svelte
<span class="text-2xl font-bold {healthColor}">{loading ? "\u2014" : `${healthScore}%`}</span>
```

With:
```svelte
{#if loading}
  <div class="skeleton-dark h-7 w-12"></div>
{:else}
  <span class="text-2xl font-bold {healthColor}">{healthScore}%</span>
{/if}
```

Replace the health label:
```svelte
<p class="mt-0.5 text-right text-xs uppercase tracking-wider {healthColorMuted}">{loading ? "" : healthLabelText.toLowerCase()}</p>
```

With:
```svelte
{#if !loading}
  <p class="mt-0.5 text-right text-xs uppercase tracking-wider {healthColorMuted}">{healthLabelText.toLowerCase()}</p>
{/if}
```

Replace the health bar `style`:
```svelte
<div class="h-full rounded-full bg-gradient-to-r {healthBarFrom} {healthBarTo}" style="width: {loading ? 0 : healthScore}%"></div>
```

With:
```svelte
{#if loading}
  <div class="skeleton-dark h-full w-full rounded-full"></div>
{:else}
  <div class="animate-gauge-fill h-full rounded-full bg-gradient-to-r {healthBarFrom} {healthBarTo}" style="width: {healthScore}%"></div>
{/if}
```

Replace the 3-stat grid values at bottom of health card. For each of the 3 divs:

Replace:
```svelte
<p class="text-lg font-bold text-white">{portfolioMetrics ? portfolioMetrics.byStatus.granted ?? 0 : "\u2014"}</p>
```

With:
```svelte
{#if loading}
  <div class="skeleton-dark mx-auto h-5 w-8"></div>
{:else}
  <p class="text-lg font-bold text-white">{portfolioMetrics?.byStatus.granted ?? 0}</p>
{/if}
```

Do the same for `pendingCount` and `expiringWithin90Days`.

**Step 5: Verify visually**

Run: `cd apps/web && npm run dev`
Open dashboard. The loading state should show gray shimmer blocks instead of "---".

**Step 6: Commit**

```bash
git add apps/web/src/routes/\(app\)/dashboard/+page.svelte
git commit -m "feat: add skeleton loading states to dashboard"
```

---

### Task 4: Add KPI staggered entrance and count-up to dashboard

**Files:**
- Modify: `apps/web/src/routes/(app)/dashboard/+page.svelte`

**Step 1: Import the actions**

At the top of the `<script>` block (after the existing imports on line 8), add:

```typescript
import { countUp, inView } from "$lib/animations";
```

**Step 2: Add inView with stagger to KPI stat cards**

In the loaded stats `{#each}` block, add `use:inView` to each card div. Replace:

```svelte
{#each stats as stat}
  <div class="rounded-xl border px-5 py-4 {stat.accent ? 'border-amber-200 bg-amber-50/50' : 'border-[var(--border-color)]'}">
```

With:

```svelte
{#each stats as stat, i}
  <div
    use:inView={{ delay: i * 80 }}
    class="rounded-xl border px-5 py-4 {stat.accent ? 'border-amber-200 bg-amber-50/50' : 'border-[var(--border-color)]'}"
  >
```

**Step 3: Add count-up to KPI values**

Replace the stat value display:

```svelte
<p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">{stat.value}</p>
```

With:

```svelte
<p class="mt-1 text-3xl font-bold text-[var(--color-neutral-900)]">
  {#if stat.value !== "\u2014"}
    <span use:countUp={parseInt(stat.value)}></span>
  {:else}
    {stat.value}
  {/if}
</p>
```

**Step 4: Add inView to the main cards (Asset Tracker, Recent Assets, For You Today, Portfolio Health)**

Add `use:inView` to the four main card containers:

For Asset Tracker card (around line 293):
```svelte
<div use:inView={{ delay: 0 }} class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
```

For Recent Assets card (around line 313):
```svelte
<div use:inView={{ delay: 100 }} class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
```

For For You Today card (around line 375):
```svelte
<div use:inView={{ delay: 0 }} class="rounded-2xl border border-[var(--border-color)] bg-white p-6 shadow-sm">
```

For Portfolio Health card (around line 427):
```svelte
<div use:inView={{ delay: 100 }} class="rounded-2xl border border-[var(--border-color)] bg-[#2d1b69] p-6 shadow-sm">
```

**Step 5: Verify visually**

Run: `cd apps/web && npm run dev`
Open dashboard. Cards should animate in with a subtle slide-up. KPI numbers should count up from 0.

**Step 6: Commit**

```bash
git add apps/web/src/routes/\(app\)/dashboard/+page.svelte
git commit -m "feat: add KPI staggered entrance and count-up animations to dashboard"
```

---

### Task 5: Add flashlight hover to dashboard cards and table rows

**Files:**
- Modify: `apps/web/src/routes/(app)/dashboard/+page.svelte`

**Step 1: Import flashlight**

Update the import (already added `countUp` and `inView` in Task 4):

```typescript
import { countUp, flashlight, inView } from "$lib/animations";
```

**Step 2: Add flashlight to main cards**

Add `use:flashlight` to the four main card divs (the same ones that got `use:inView` in Task 4). Both actions can coexist on the same element:

```svelte
<div use:inView={{ delay: 0 }} use:flashlight class="rounded-2xl border ...">
```

Apply to: Asset Tracker, Recent Assets, For You Today, Portfolio Health.

**Step 3: Add flashlight to recent asset table rows**

In the recent assets `{#each}` loop, add `use:flashlight` to the `<tr>`:

```svelte
{#each recentAssets as asset}
  <tr use:flashlight class="border-b border-[var(--border-color)] last:border-0 hover:bg-[var(--color-neutral-50)]">
```

**Step 4: Verify visually**

Run: `cd apps/web && npm run dev`
Hover over dashboard cards — a very subtle blue radial glow should follow the cursor.

**Step 5: Commit**

```bash
git add apps/web/src/routes/\(app\)/dashboard/+page.svelte
git commit -m "feat: add flashlight hover effect to dashboard cards and table rows"
```

---

### Task 6: Add page entrance animation

**Files:**
- Modify: `apps/web/src/routes/(app)/+layout.svelte`

**Step 1: Add page entrance animation to main content**

In `apps/web/src/routes/(app)/+layout.svelte`, find:

```svelte
  <!-- Content -->
  <main>
    {@render children()}
  </main>
```

Replace with:

```svelte
  <!-- Content -->
  <main class="animate-page-enter">
    {@render children()}
  </main>
```

**Step 2: Verify visually**

Navigate between pages. Each page should have a subtle 250ms fade + slide-up on entry.

**Step 3: Commit**

```bash
git add apps/web/src/routes/\(app\)/+layout.svelte
git commit -m "feat: add page entrance animation to app layout"
```

---

### Task 7: Final verification and cleanup

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All 209 tests pass (animations are CSS/actions only, no logic changes).

**Step 2: Run type check**

Run: `cd apps/web && npx tsc --noEmit 2>&1 | grep -v "portfolios" | grep "error" | head -5`
Expected: No new type errors.

**Step 3: Visual QA checklist**

Open `http://localhost:5173/dashboard` and verify:
- [ ] Loading state shows skeleton shimmer blocks (not "---")
- [ ] KPI cards animate in with stagger (left to right)
- [ ] KPI numbers count up from 0
- [ ] Health bar fills with animation
- [ ] Health card shows skeleton-dark while loading
- [ ] Hovering over cards shows subtle blue flashlight
- [ ] Hovering over table rows shows flashlight
- [ ] Navigating away and back shows page entrance animation
- [ ] No layout shifts during loading/animation transitions
- [ ] Animations respect `prefers-reduced-motion` (they use CSS, browser handles this)

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: address visual QA issues in dashboard animations"
```
