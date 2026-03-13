# Mobile UX Premium Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a premium mobile experience with bottom tab bar navigation, swipeable cards, glass effects, and spring animations — without breaking the existing desktop UI.

**Architecture:** Progressive enhancement via Tailwind responsive breakpoints. New mobile-only components (`md:hidden`) sit alongside desktop patterns (`hidden md:flex`). Shared design tokens and animations in `packages/design-system`, new UI components in `packages/ui`, swipe action in `apps/web/src/lib/animations`.

**Tech Stack:** Svelte 5, SvelteKit 2, Tailwind CSS 4, CSS custom properties, touch events API

---

### Task 1: Design System — New Tokens

**Files:**
- Modify: `packages/design-system/src/tokens.css`

**Step 1: Add new tokens to tokens.css**

Add these new CSS custom properties inside the existing `:root` block, after the existing `--breakpoint-xl` line:

```css
  /* Mobile layout */
  --space-safe-bottom: env(safe-area-inset-bottom, 0px);
  --header-height: 3.5rem;
  --tab-bar-height: 4rem;

  /* Premium shadows (multi-layer) */
  --shadow-card: 0 1px 3px rgb(0 0 0 / 0.04), 0 4px 12px rgb(0 0 0 / 0.03);
  --shadow-card-hover: 0 2px 8px rgb(0 0 0 / 0.06), 0 8px 24px rgb(0 0 0 / 0.04);
  --shadow-elevated: 0 4px 16px rgb(0 0 0 / 0.08), 0 12px 40px rgb(0 0 0 / 0.06);

  /* Glass effect */
  --backdrop-blur: 20px;
  --glass-bg: rgb(255 255 255 / 0.8);
  --glass-bg-dark: rgb(255 255 255 / 0.9);

  /* Spring easing curves */
  --ease-spring: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);

  /* Animation durations */
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;

  /* Touch */
  --touch-target-min: 44px;
```

**Step 2: Verify the app builds**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add packages/design-system/src/tokens.css
git commit -m "feat: add mobile, premium shadow, glass, and animation tokens"
```

---

### Task 2: Design System — New Animations

**Files:**
- Modify: `packages/design-system/src/animations.css`

**Step 1: Add new keyframes and utility classes**

Append after the existing `.border-beam::before` rule (end of file):

```css
/* === Mobile Card Enter (staggered) === */
@keyframes card-enter-mobile {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-card-enter-mobile {
  opacity: 0;
  animation: card-enter-mobile 400ms var(--ease-spring, cubic-bezier(0.22, 1, 0.36, 1)) forwards;
}

/* === Bottom Sheet Slide Up === */
@keyframes sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.animate-sheet-up {
  animation: sheet-up var(--duration-normal, 300ms) var(--ease-spring, cubic-bezier(0.22, 1, 0.36, 1)) both;
}

/* === Tab Tap Feedback === */
@keyframes tab-tap {
  0% { transform: scale(1); }
  50% { transform: scale(0.85); }
  100% { transform: scale(1); }
}

.animate-tab-tap {
  animation: tab-tap var(--duration-fast, 150ms) var(--ease-bounce, cubic-bezier(0.34, 1.56, 0.64, 1));
}

/* === Fade In (overlays) === */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fade-in var(--duration-normal, 300ms) var(--ease-smooth, cubic-bezier(0.4, 0, 0.2, 1)) both;
}

/* === Pull-to-Refresh Spin === */
@keyframes pull-spin {
  to { transform: rotate(360deg); }
}

.animate-pull-spin {
  animation: pull-spin 800ms linear infinite;
}

/* === Scrollbar Hide Utility === */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
```

**Step 2: Verify the app builds**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 3: Commit**

```bash
git add packages/design-system/src/animations.css
git commit -m "feat: add mobile card, sheet, tab-tap, fade, and pull-spin animations"
```

---

### Task 3: GlassBar Atom Component

**Files:**
- Create: `packages/ui/src/atoms/GlassBar.svelte`
- Modify: `packages/ui/src/index.ts`

**Step 1: Create GlassBar component**

```svelte
<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  interface Props extends HTMLAttributes<HTMLDivElement> {
    position?: "top" | "bottom";
    children: Snippet;
  }

  let { position = "top", children, class: className = "", ...rest }: Props = $props();
</script>

<div
  class="backdrop-blur-[var(--backdrop-blur)] bg-[var(--glass-bg)] {position === 'top' ? 'border-b' : 'border-t'} border-[var(--border-color)] {className}"
  {...rest}
>
  {@render children()}
</div>
```

**Step 2: Export from index.ts**

Add this line after the `UserAvatar` export in `packages/ui/src/index.ts`:

```ts
export { default as GlassBar } from "./atoms/GlassBar.svelte";
```

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add packages/ui/src/atoms/GlassBar.svelte packages/ui/src/index.ts
git commit -m "feat: add GlassBar atom component for backdrop-blur containers"
```

---

### Task 4: BottomSheet Organism Component

**Files:**
- Create: `packages/ui/src/organisms/BottomSheet.svelte`
- Modify: `packages/ui/src/index.ts`

**Step 1: Create BottomSheet component**

```svelte
<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    open: boolean;
    onclose: () => void;
    children: Snippet;
  }

  let { open, onclose, children }: Props = $props();

  let visible = $state(false);

  $effect(() => {
    if (open) {
      // Trigger animation on next frame
      requestAnimationFrame(() => { visible = true; });
    } else {
      visible = false;
    }
  });

  function handleOverlayClick() {
    visible = false;
    setTimeout(onclose, 300);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") handleOverlayClick();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-50 bg-black/30 transition-opacity duration-300 {visible ? 'opacity-100' : 'opacity-0'}"
    onclick={handleOverlayClick}
    onkeydown={handleKeydown}
  ></div>

  <div
    class="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[var(--glass-bg-dark)] shadow-[var(--shadow-elevated)] backdrop-blur-[var(--backdrop-blur)] transition-transform duration-300 {visible ? 'translate-y-0' : 'translate-y-full'}"
    style="transition-timing-function: var(--ease-spring);"
  >
    <!-- Grab handle -->
    <div class="flex justify-center pt-3 pb-1">
      <div class="h-1 w-10 rounded-full bg-[var(--color-neutral-300)]"></div>
    </div>

    <div class="px-4 pb-[calc(1rem+var(--space-safe-bottom))]">
      {@render children()}
    </div>
  </div>
{/if}
```

**Step 2: Export from index.ts**

Add after the `PageHeader` export:

```ts
export { default as BottomSheet } from "./organisms/BottomSheet.svelte";
```

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add packages/ui/src/organisms/BottomSheet.svelte packages/ui/src/index.ts
git commit -m "feat: add BottomSheet organism with glass effect and spring animation"
```

---

### Task 5: BottomTabBar Organism Component

**Files:**
- Create: `packages/ui/src/organisms/BottomTabBar.svelte`
- Modify: `packages/ui/src/index.ts`

**Step 1: Create BottomTabBar component**

```svelte
<script lang="ts">
  interface TabItem {
    href: string;
    label: string;
    icon: "home" | "assets" | "deadlines" | "portfolios" | "more";
  }

  interface Props {
    items: TabItem[];
    currentPath: string;
    onmoretap?: () => void;
  }

  let { items, currentPath, onmoretap }: Props = $props();

  function isActive(href: string): boolean {
    if (href === "/dashboard") return currentPath === "/dashboard" || currentPath === "/";
    return currentPath.startsWith(href);
  }

  let tappedIndex = $state<number | null>(null);

  function handleTap(index: number, item: TabItem) {
    tappedIndex = index;
    setTimeout(() => { tappedIndex = null; }, 150);
    if (item.icon === "more" && onmoretap) {
      onmoretap();
    }
  }
</script>

<nav class="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border-color)] bg-[var(--glass-bg)] backdrop-blur-[var(--backdrop-blur)] md:hidden" style="padding-bottom: env(safe-area-inset-bottom, 0px);">
  <div class="flex h-16 items-stretch justify-around">
    {#each items as item, i}
      {#if item.icon === "more"}
        <button
          class="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-150 {tappedIndex === i ? 'animate-tab-tap' : ''} text-[var(--color-neutral-400)]"
          onclick={() => handleTap(i, item)}
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>
          <span class="text-[10px] font-medium">{item.label}</span>
        </button>
      {:else}
        <a
          href={item.href}
          class="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-150 {tappedIndex === i ? 'animate-tab-tap' : ''} {isActive(item.href) ? 'text-[var(--color-primary-600)]' : 'text-[var(--color-neutral-400)]'}"
          onclick={() => handleTap(i, item)}
        >
          {#if item.icon === "home"}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
          {:else if item.icon === "assets"}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
          {:else if item.icon === "deadlines"}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          {:else if item.icon === "portfolios"}
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
          {/if}
          <span class="text-[10px] font-medium">{item.label}</span>
        </a>
      {/if}
    {/each}
  </div>
</nav>
```

**Step 2: Export from index.ts**

Add after the `BottomSheet` export:

```ts
export { default as BottomTabBar } from "./organisms/BottomTabBar.svelte";
```

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add packages/ui/src/organisms/BottomTabBar.svelte packages/ui/src/index.ts
git commit -m "feat: add BottomTabBar organism with glass effect and tap animation"
```

---

### Task 6: Swipeable Svelte Action

**Files:**
- Create: `apps/web/src/lib/animations/swipeable.ts`
- Modify: `apps/web/src/lib/animations/index.ts`

**Step 1: Create the swipeable action**

```ts
interface SwipeableOptions {
  threshold?: number;
  maxSwipe?: number;
  onreveal?: () => void;
  onhide?: () => void;
}

export function swipeable(node: HTMLElement, options: SwipeableOptions = {}) {
  const threshold = options.threshold ?? 80;
  const maxSwipe = options.maxSwipe ?? 160;

  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isSwiping = false;
  let isRevealed = false;
  let directionLocked = false;
  let isHorizontal = false;

  function rubberBand(x: number): number {
    if (x <= threshold) return x;
    const overshoot = x - threshold;
    return threshold + overshoot * 0.3;
  }

  function setTransform(x: number) {
    const content = node.querySelector("[data-swipe-content]") as HTMLElement | null;
    if (content) {
      content.style.transform = `translateX(${-x}px)`;
      content.style.transition = isSwiping ? "none" : `transform 300ms var(--ease-spring, cubic-bezier(0.22, 1, 0.36, 1))`;
    }
  }

  function handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    startX = touch.clientX;
    startY = touch.clientY;
    isSwiping = true;
    directionLocked = false;
    isHorizontal = false;
  }

  function handleTouchMove(e: TouchEvent) {
    if (!isSwiping) return;
    const touch = e.touches[0];
    const diffX = startX - touch.clientX;
    const diffY = touch.clientY - startY;

    // Lock direction after 10px of movement
    if (!directionLocked && (Math.abs(diffX) > 10 || Math.abs(diffY) > 10)) {
      directionLocked = true;
      isHorizontal = Math.abs(diffX) > Math.abs(diffY);
    }

    if (!isHorizontal) return;

    e.preventDefault();

    if (isRevealed) {
      // If revealed, allow swiping back (negative diffX means swiping right)
      currentX = Math.max(0, threshold + diffX);
    } else {
      currentX = Math.max(0, diffX);
    }

    setTransform(rubberBand(currentX));
  }

  function handleTouchEnd() {
    isSwiping = false;
    if (!isHorizontal) return;

    if (currentX >= threshold && !isRevealed) {
      isRevealed = true;
      setTransform(threshold);
      options.onreveal?.();
    } else if (currentX < threshold / 2 && isRevealed) {
      isRevealed = false;
      setTransform(0);
      options.onhide?.();
    } else if (isRevealed) {
      setTransform(threshold);
    } else {
      setTransform(0);
    }
    currentX = 0;
  }

  // Close when tapping outside
  function handleDocumentTouch(e: TouchEvent) {
    if (isRevealed && !node.contains(e.target as Node)) {
      isRevealed = false;
      setTransform(0);
      options.onhide?.();
    }
  }

  node.addEventListener("touchstart", handleTouchStart, { passive: true });
  node.addEventListener("touchmove", handleTouchMove, { passive: false });
  node.addEventListener("touchend", handleTouchEnd, { passive: true });
  document.addEventListener("touchstart", handleDocumentTouch, { passive: true });

  return {
    destroy() {
      node.removeEventListener("touchstart", handleTouchStart);
      node.removeEventListener("touchmove", handleTouchMove);
      node.removeEventListener("touchend", handleTouchEnd);
      document.removeEventListener("touchstart", handleDocumentTouch);
    },
  };
}
```

**Step 2: Export from index.ts**

Add to `apps/web/src/lib/animations/index.ts`:

```ts
export { swipeable } from "./swipeable";
```

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add apps/web/src/lib/animations/swipeable.ts apps/web/src/lib/animations/index.ts
git commit -m "feat: add swipeable Svelte action with rubber band effect"
```

---

### Task 7: SwipeableCard Molecule Component

**Files:**
- Create: `packages/ui/src/molecules/SwipeableCard.svelte`
- Modify: `packages/ui/src/index.ts`

**Step 1: Create SwipeableCard component**

```svelte
<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    href?: string;
    actions?: Snippet;
    children: Snippet;
    class?: string;
  }

  let { href, actions, children, class: className = "" }: Props = $props();
</script>

<div class="relative overflow-hidden rounded-xl {className}">
  <!-- Action buttons revealed on swipe -->
  {#if actions}
    <div class="absolute inset-y-0 right-0 flex items-stretch">
      {@render actions()}
    </div>
  {/if}

  <!-- Main content -->
  {#if href}
    <a
      {href}
      data-swipe-content
      class="relative block border border-[var(--border-color)] bg-white p-4 shadow-[var(--shadow-card)] transition-shadow active:shadow-[var(--shadow-card-hover)] active:scale-[0.97] rounded-xl"
      style="transition-timing-function: var(--ease-spring);"
    >
      {@render children()}
    </a>
  {:else}
    <div
      data-swipe-content
      class="relative border border-[var(--border-color)] bg-white p-4 shadow-[var(--shadow-card)] transition-shadow active:shadow-[var(--shadow-card-hover)] active:scale-[0.97] rounded-xl"
      style="transition-timing-function: var(--ease-spring);"
    >
      {@render children()}
    </div>
  {/if}
</div>
```

**Step 2: Export from index.ts**

Add after the `StatCard` export:

```ts
export { default as SwipeableCard } from "./molecules/SwipeableCard.svelte";
```

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add packages/ui/src/molecules/SwipeableCard.svelte packages/ui/src/index.ts
git commit -m "feat: add SwipeableCard molecule with active press feedback"
```

---

### Task 8: App Layout — Mobile Header + Tab Bar + Bottom Sheet

This is the main integration task. We modify the app layout to show the mobile header and bottom tab bar on small screens, while keeping the desktop nav unchanged.

**Files:**
- Modify: `apps/web/src/routes/(app)/+layout.svelte`

**Step 1: Read the current layout file**

Read `apps/web/src/routes/(app)/+layout.svelte` to get the latest version before editing.

**Step 2: Update the layout**

Replace the entire file with the following. Key changes marked with `MOBILE:` comments:

```svelte
<script lang="ts">
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { NavActions, BottomTabBar, BottomSheet } from "@ipms/ui";
  import ProfileDropdown from "../../features/profile/ProfileDropdown.svelte";
  import NotificationPanel from "../../features/notifications/NotificationPanel.svelte";

  let { children } = $props();

  const data = $derived($page.data);
  const currentPath = $derived($page.url.pathname);

  const userInitials = $derived(
    (data.user?.name ?? "")
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );

  let profileOpen = $state(false);
  let notificationsOpen = $state(false);

  // MOBILE: Bottom sheet state for "More" tab
  let moreSheetOpen = $state(false);

  const navItems = [
    { href: "/dashboard", label: "Home", icon: "home" },
    { href: "/assets", label: "Assets", icon: "assets" },
    { href: "/portfolios", label: "Portfolios", icon: "portfolios" },
    { href: "/deadlines", label: "Deadlines", icon: "deadlines" },
    { href: "/renewal-decisions", label: "Renewals", icon: "renewals" },
    { href: "/documents", label: "Documents", icon: "documents" },
  ];

  // MOBILE: Tab bar items (subset of navItems)
  const tabItems = [
    { href: "/dashboard", label: "Home", icon: "home" as const },
    { href: "/assets", label: "Assets", icon: "assets" as const },
    { href: "/deadlines", label: "Deadlines", icon: "deadlines" as const },
    { href: "/portfolios", label: "Portfolios", icon: "portfolios" as const },
    { href: "/more", label: "More", icon: "more" as const },
  ];

  // MOBILE: "More" sheet navigation items
  const moreItems = [
    { href: "/renewal-decisions", label: "Renewals", icon: "renewals" },
    { href: "/documents", label: "Documents", icon: "documents" },
    { href: "/settings", label: "Settings", icon: "settings" },
  ];

  function handleMoreNavigation(href: string) {
    moreSheetOpen = false;
    goto(href);
  }
</script>

<div class="min-h-screen bg-[#f7f7f8]">
  <!-- Top Navigation -->
  <nav class="sticky top-0 z-40 border-b border-[var(--border-color)] bg-white md:bg-white backdrop-blur-[var(--backdrop-blur)] md:backdrop-blur-none" style="background-color: var(--glass-bg);">
    <div class="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:px-6">
      <!-- Left: Logo + Org -->
      <div class="flex items-center gap-3">
        <a href="/dashboard" class="flex items-center gap-2">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary-600)] text-sm font-bold text-white">IP</span>
        </a>
        <div class="flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-[var(--color-neutral-50)] cursor-pointer">
          <span class="text-sm font-semibold text-[var(--color-neutral-800)]">{data.organizationName}</span>
          <svg class="h-3.5 w-3.5 text-[var(--color-neutral-400)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7"/></svg>
        </div>
      </div>

      <!-- Center: Nav Links (MOBILE: hidden on mobile) -->
      <div class="hidden md:flex items-center gap-1 rounded-full bg-[var(--color-neutral-50)] p-1">
        {#each navItems as item}
          <a
            href={item.href}
            class="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium text-[var(--color-neutral-500)] transition-colors hover:text-[var(--color-neutral-800)] [&.active]:bg-white [&.active]:text-[var(--color-neutral-900)] [&.active]:shadow-sm"
          >
            {#if item.icon === "home"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>
            {:else if item.icon === "assets"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/></svg>
            {:else if item.icon === "portfolios"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>
            {:else if item.icon === "deadlines"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            {:else if item.icon === "renewals"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>
            {:else if item.icon === "documents"}
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
            {/if}
            {item.label}
          </a>
        {/each}
      </div>

      <!-- Right: Actions -->
      <div class="relative">
        <NavActions
          userInitials={userInitials}
          notificationCount={3}
          onsettingsclick={() => goto('/settings')}
          onnotificationsclick={() => {
            notificationsOpen = !notificationsOpen;
            profileOpen = false;
          }}
          onprofileclick={() => {
            profileOpen = !profileOpen;
            notificationsOpen = false;
          }}
        />
        <ProfileDropdown
          userName={data.user?.name ?? ""}
          userEmail={data.user?.email ?? ""}
          {userInitials}
          open={profileOpen}
          onclose={() => (profileOpen = false)}
        />
      </div>
    </div>
  </nav>

  <!-- Notification slide-over -->
  <NotificationPanel
    open={notificationsOpen}
    onclose={() => (notificationsOpen = false)}
  />

  <!-- Content (MOBILE: add bottom padding for tab bar) -->
  <main class="animate-page-enter pb-20 md:pb-0">
    {@render children()}
  </main>

  <!-- MOBILE: Bottom Tab Bar -->
  <BottomTabBar
    items={tabItems}
    {currentPath}
    onmoretap={() => { moreSheetOpen = true; }}
  />

  <!-- MOBILE: "More" Bottom Sheet -->
  <BottomSheet open={moreSheetOpen} onclose={() => { moreSheetOpen = false; }}>
    <div class="flex flex-col gap-1 py-2">
      {#each moreItems as item}
        <button
          class="flex items-center gap-3 rounded-xl px-4 min-h-[var(--touch-target-min)] text-left transition-colors hover:bg-[var(--color-neutral-50)] active:bg-[var(--color-neutral-100)] active:scale-[0.98]"
          style="transition-timing-function: var(--ease-spring);"
          onclick={() => handleMoreNavigation(item.href)}
        >
          {#if item.icon === "renewals"}
            <svg class="h-5 w-5 text-[var(--color-neutral-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"/></svg>
          {:else if item.icon === "documents"}
            <svg class="h-5 w-5 text-[var(--color-neutral-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>
          {:else if item.icon === "settings"}
            <svg class="h-5 w-5 text-[var(--color-neutral-500)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z"/><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
          {/if}
          <span class="text-sm font-medium text-[var(--color-neutral-700)]">{item.label}</span>
          <svg class="ml-auto h-4 w-4 text-[var(--color-neutral-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
        </button>
      {/each}
    </div>
  </BottomSheet>
</div>
```

**Step 3: Verify the app builds and renders**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds. On desktop (>768px), layout looks identical to before. On mobile (<768px), the nav pills are hidden, bottom tab bar appears, and header is simplified with glass effect.

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(app\)/+layout.svelte
git commit -m "feat: add mobile bottom tab bar, glass header, and More bottom sheet"
```

---

### Task 9: Dashboard — Mobile Layout Adaptations

**Files:**
- Modify: `apps/web/src/routes/(app)/dashboard/+page.svelte`

**Step 1: Read the current dashboard file**

Read `apps/web/src/routes/(app)/dashboard/+page.svelte` to get the latest version.

**Step 2: Apply mobile-responsive changes**

The following targeted changes are needed (apply each change to the existing code, do NOT rewrite the entire file):

**Change A — Global padding:** Replace all `px-6` with `px-4 md:px-6` in the dashboard page. There are two occurrences:
- Line ~230: `<div class="mx-auto max-w-[1400px] px-6 pt-8">` → `px-4 md:px-6`
- Line ~307: `<div class="mx-auto max-w-[1400px] px-6 pb-12">` → `px-4 md:px-6`

**Change B — Filter pills horizontal scroll:** Around line ~240, change the type chips container:
```html
<!-- Before -->
<div class="flex flex-wrap items-center gap-1.5">
<!-- After -->
<div class="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
```

**Change C — Grid layout with mobile ordering:** Around line ~308, change the main grid:
```html
<!-- Before -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
<!-- After -->
<div class="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
```
No change to the grid itself, but add `order-` classes to the children:

- Asset tracker card (~line 311): add `order-2 lg:order-1`
- Portfolio health card (~line 349): add `order-1 lg:order-2`
- Recent assets card (~line 401): add `order-4 lg:order-3`
- For you today card (~line 465): add `order-3 lg:order-4`

**Change D — Stats text sizes responsive:** Around line ~319, the stats grid `grid-cols-3`:
```html
<!-- Before -->
<div class="mt-5 grid grid-cols-3 gap-4">
<!-- After -->
<div class="mt-5 grid grid-cols-3 gap-2 md:gap-4">
```

And in the stat cards (around lines ~330-334), make text responsive:
```html
<!-- Before -->
<div ... class="rounded-xl border px-5 py-4 ...">
<!-- After -->
<div ... class="rounded-xl border px-3 py-3 md:px-5 md:py-4 ...">
```

```html
<!-- Before -->
<p class="mt-1 text-3xl font-bold ...">
<!-- After -->
<p class="mt-1 text-2xl md:text-3xl font-bold ...">
```

**Change E — For You Today touch targets:** Around line ~496, the deadline items:
```html
<!-- Before -->
<div class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0">
<!-- After -->
<div class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0 min-h-[var(--touch-target-min)]">
```

And the Review button:
```html
<!-- Before -->
<button class="rounded-full border border-[var(--border-color)] px-3 py-1 text-xs ...">
<!-- After -->
<button class="rounded-full border border-[var(--border-color)] px-4 py-2 md:px-3 md:py-1 text-xs ...">
```

**Change F — Recent assets mobile view:** Around line ~413, after the existing `<table>` opening and before `</table>`, wrap the entire table in a `hidden md:block` container and add a mobile-only list above it:

Replace the entire table section (from `<div class="mt-4">` to its closing `</div>`) with:

```svelte
        <div class="mt-4">
          <!-- Mobile: compact list -->
          <div class="flex flex-col md:hidden">
            {#if loading}
              {#each [0, 1, 2, 3, 4] as _}
                <div class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0">
                  <div>
                    <div class="skeleton h-4 w-40"></div>
                    <div class="skeleton mt-1.5 h-3 w-28"></div>
                  </div>
                  <div class="skeleton h-4 w-4"></div>
                </div>
              {/each}
            {:else if recentAssets.length === 0}
              <div class="py-8 text-center text-sm text-[var(--color-neutral-400)]">No assets yet</div>
            {:else}
              {#each recentAssets as asset}
                <a href="/assets/{asset.id}" class="flex items-center justify-between border-b border-[var(--border-color)] py-3 last:border-0 min-h-[var(--touch-target-min)] active:bg-[var(--color-neutral-50)] transition-colors">
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-medium text-[var(--color-neutral-900)]">{cleanTitle(asset.title)}</p>
                    <div class="mt-0.5 flex items-center gap-2 text-xs text-[var(--color-neutral-400)]">
                      <span>{countryFlag(asset.jurisdiction.code)}</span>
                      <span>{typeLabels[asset.type] ?? asset.type}</span>
                      <span class="text-[var(--color-neutral-200)]">·</span>
                      {#if statusConfig[asset.status]}
                        <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium {statusConfig[asset.status].bg} {statusConfig[asset.status].text}">{statusConfig[asset.status].label}</span>
                      {/if}
                      <span class="ml-auto">{formatDate(asset.updatedAt)}</span>
                    </div>
                  </div>
                  <svg class="ml-2 h-4 w-4 flex-shrink-0 text-[var(--color-neutral-300)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path d="M8.25 4.5l7.5 7.5-7.5 7.5"/></svg>
                </a>
              {/each}
            {/if}
          </div>

          <!-- Desktop: table -->
          <div class="hidden md:block">
            <table class="w-full">
              <!-- (keep the existing table thead/tbody exactly as-is) -->
```

Then close with the matching `</table></div></div>`. Keep the existing `<table>` markup unchanged inside the `hidden md:block` wrapper.

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(app\)/dashboard/+page.svelte
git commit -m "feat: responsive dashboard with mobile ordering, compact lists, and touch targets"
```

---

### Task 10: Assets Page — Mobile Adaptations

**Files:**
- Modify: `apps/web/src/routes/(app)/assets/+page.svelte`

**Step 1: Read the current file**

Read `apps/web/src/routes/(app)/assets/+page.svelte` to get the latest version.

**Step 2: Apply mobile-responsive changes**

**Change A — Global padding:** Replace `px-6` with `px-4 md:px-6` in the outer container (~line 509).

**Change B — Header layout:** Around line ~512, change the header from `flex items-center justify-between` to a stacked layout on mobile:

```html
<!-- Before -->
<div class="flex items-center justify-between">
  <div>
    <h1 ...>IP Assets</h1>
    <p ...>Manage your intellectual property portfolio</p>
  </div>
  <div class="flex items-center gap-3">
    <!-- Import, Export, New Asset buttons -->
  </div>
</div>
<!-- After -->
<div>
  <div>
    <h1 ...>IP Assets</h1>
    <p ...>Manage your intellectual property portfolio</p>
  </div>
  <div class="mt-4 flex items-center gap-2 md:mt-0 md:absolute md:right-6 md:top-8">
    <!-- ... buttons ... -->
  </div>
</div>
```

Actually, simpler approach — just make the header wrap on mobile:

```html
<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
```

And for the buttons row, hide "Export CSV" text on mobile:
- Export CSV button: add `hidden md:inline-flex` to the button
- Add a small icon-only overflow button visible only on mobile:

After the "New Asset" button, add:

```svelte
<button
  onclick={exportCSV}
  class="inline-flex md:hidden items-center justify-center rounded-lg border border-[var(--border-color)] bg-white p-2.5 text-[var(--color-neutral-700)] shadow-sm hover:bg-[var(--color-neutral-50)]"
  aria-label="Export CSV"
>
  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
</button>
```

**Change C — Filter pills horizontal scroll:** Around line ~555:
```html
<!-- Before -->
<div class="mt-4 flex items-center gap-2">
<!-- After -->
<div class="mt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
```

**Change D — Dropdown filters responsive:**
```html
<!-- Before -->
<div class="mt-4 flex items-center gap-4">
<!-- After -->
<div class="mt-4 grid grid-cols-2 gap-2 md:flex md:items-center md:gap-4">
```

**Change E — Stats grid:**
```html
<!-- Before -->
<div class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
<!-- After -->
<div class="mt-5 grid grid-cols-2 gap-2 md:gap-4 sm:grid-cols-5">
```

**Change F — Mobile card view for assets:** After the existing table `<div class="mt-4 overflow-x-auto">` (~line 669), wrap it in `hidden md:block` and add a mobile card list above:

```svelte
<!-- Mobile: card view -->
<div class="mt-4 flex flex-col gap-3 md:hidden">
  {#each sortedAssets as asset, i}
    <a
      href="/assets/{asset.id}"
      class="block rounded-xl border border-[var(--border-color)] bg-white p-4 shadow-[var(--shadow-card)] active:shadow-[var(--shadow-card-hover)] active:scale-[0.97] transition-all animate-card-enter-mobile"
      style="animation-delay: {i * 80}ms; transition-timing-function: var(--ease-spring);"
    >
      <p class="truncate text-sm font-medium text-[var(--color-neutral-900)]">{cleanTitle(asset.title)}</p>
      <div class="mt-1.5 flex items-center gap-2 text-xs text-[var(--color-neutral-500)]">
        <span>{countryFlag(asset.jurisdiction.code)}</span>
        <span>{typeLabels[asset.type] ?? asset.type}</span>
        <span class="text-[var(--color-neutral-200)]">·</span>
        <span class="inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium {statusConfig[asset.status].bg} {statusConfig[asset.status].text}">{statusConfig[asset.status].label}</span>
      </div>
      <div class="mt-2 flex items-center justify-between text-xs text-[var(--color-neutral-400)]">
        <span>{asset.owner}</span>
        <span>{formatDate(asset.filingDate || asset.createdAt)}</span>
      </div>
    </a>
  {/each}
</div>

<!-- Desktop: table view -->
<div class="mt-4 hidden overflow-x-auto md:block">
```

**Change G — Bulk action bar responsive:** Around line ~714, simplify for mobile:
```html
<!-- Before -->
<div class="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-2xl ...">
<!-- After -->
<div class="fixed bottom-20 md:bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 md:gap-4 rounded-2xl ... max-w-[calc(100vw-2rem)]">
```

Hide the portfolio section on mobile and show only status:
- The `<!-- Add to Portfolio -->` section: add `hidden md:flex` to its outer `<div class="flex items-center gap-2">`
- The divider before it: add `hidden md:block`

**Change H — Drawer as bottom sheet on mobile:** Around line ~768, change the panel:
```html
<!-- Before -->
<div class="fixed inset-y-0 right-0 z-50 w-full max-w-md transform bg-white shadow-xl transition-transform duration-300 ease-out ...">
<!-- After -->
<div class="fixed inset-x-0 bottom-0 md:inset-y-0 md:inset-x-auto md:right-0 z-50 w-full max-w-md transform bg-white shadow-xl transition-transform duration-300 rounded-t-2xl md:rounded-none {drawerVisible ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}" style="transition-timing-function: var(--ease-spring);">
```

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(app\)/assets/+page.svelte
git commit -m "feat: responsive assets page with mobile cards, stacked header, and bottom sheet drawer"
```

---

### Task 11: Portfolios Page — Mobile Adaptations

**Files:**
- Modify: `apps/web/src/routes/(app)/portfolios/+page.svelte`

**Step 1: Read the current file**

Read `apps/web/src/routes/(app)/portfolios/+page.svelte`.

**Step 2: Apply changes**

**Change A — Padding:** Replace all `px-6` with `px-4 md:px-6`.

**Change B — Header stacking on mobile:** If header uses `flex items-center justify-between`, change to `flex flex-col gap-4 md:flex-row md:items-center md:justify-between`.

**Change C — Active press feedback on cards:** Find the portfolio card elements (likely `<a>` or `<div>` with `rounded-2xl`) and add:
```
active:scale-[0.97] transition-transform
```
with `style="transition-timing-function: var(--ease-spring);"`.

**Change D — Card shadows:** Replace `shadow-sm` with `shadow-[var(--shadow-card)]` on portfolio cards.

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(app\)/portfolios/+page.svelte
git commit -m "feat: responsive portfolios page with touch feedback and premium shadows"
```

---

### Task 12: Deadlines Page — Mobile Adaptations

**Files:**
- Modify: `apps/web/src/routes/(app)/deadlines/+page.svelte`

**Step 1: Read the current file**

Read `apps/web/src/routes/(app)/deadlines/+page.svelte`.

**Step 2: Apply changes**

**Change A — Padding:** Replace `px-6` with `px-4 md:px-6`.

**Change B — Stats grid responsive:** If using `grid grid-cols-2 gap-4 lg:grid-cols-4`, add `gap-2 md:gap-4`.

**Change C — Touch targets:** Add `min-h-[var(--touch-target-min)]` to deadline list items.

**Change D — Card shadows:** Replace `shadow-sm` with `shadow-[var(--shadow-card)]` on cards.

**Change E — Active feedback:** Add `active:scale-[0.97] transition-transform` with spring easing to interactive cards/items.

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(app\)/deadlines/+page.svelte
git commit -m "feat: responsive deadlines page with touch targets and premium shadows"
```

---

### Task 13: Renewal Decisions Page — Mobile Adaptations

**Files:**
- Modify: `apps/web/src/routes/(app)/renewal-decisions/+page.svelte`

**Step 1: Read the current file**

Read `apps/web/src/routes/(app)/renewal-decisions/+page.svelte`.

**Step 2: Apply changes**

**Change A — Padding:** Replace `px-6` with `px-4 md:px-6`.

**Change B — Stats grid responsive:** Add responsive gap `gap-2 md:gap-4`.

**Change C — Decision items responsive:** Add `flex-col md:flex-row` to decision item layouts if they're horizontal.

**Change D — Touch targets and shadows:** Same pattern as other pages — `min-h-[var(--touch-target-min)]`, `shadow-[var(--shadow-card)]`, `active:scale-[0.97]`.

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(app\)/renewal-decisions/+page.svelte
git commit -m "feat: responsive renewal decisions page with mobile adaptations"
```

---

### Task 14: Documents Page — Mobile Adaptations

**Files:**
- Modify: `apps/web/src/routes/(app)/documents/+page.svelte`

**Step 1: Read the current file**

Read `apps/web/src/routes/(app)/documents/+page.svelte`.

**Step 2: Apply changes**

**Change A — Padding:** Replace `px-6` with `px-4 md:px-6`.

**Change B — Stats grid:** Change `grid grid-cols-4` to `grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4`.

**Change C — Header stacking:** Same pattern: `flex flex-col gap-4 md:flex-row md:items-center md:justify-between`.

**Change D — Touch targets and shadows:** Same pattern as other pages.

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(app\)/documents/+page.svelte
git commit -m "feat: responsive documents page with 2-column mobile grid"
```

---

### Task 15: Settings Page — Mobile Adaptations

**Files:**
- Modify: `apps/web/src/routes/(app)/settings/+page.svelte`

**Step 1: Read the current file**

Read `apps/web/src/routes/(app)/settings/+page.svelte`.

**Step 2: Apply changes**

**Change A — Padding:** Replace `px-6` with `px-4 md:px-6`.

**Change B — Sidebar layout:** Change `grid grid-cols-[220px_1fr] gap-8` to `flex flex-col gap-6 md:grid md:grid-cols-[220px_1fr] md:gap-8`.

On mobile, the sidebar navigation becomes a horizontal scrollable tab bar:
- Add `overflow-x-auto scrollbar-hide flex md:flex-col` to the sidebar nav container.

**Change C — Touch targets:** Add `min-h-[var(--touch-target-min)]` to settings nav items and form controls.

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(app\)/settings/+page.svelte
git commit -m "feat: responsive settings page with stacked mobile layout"
```

---

### Task 16: Asset Detail Page — Mobile Adaptations

**Files:**
- Modify: `apps/web/src/routes/(app)/assets/[id]/+page.svelte`

**Step 1: Read the current file**

Read `apps/web/src/routes/(app)/assets/[id]/+page.svelte`.

**Step 2: Apply changes**

**Change A — Padding:** Replace `px-6` with `px-4 md:px-6`.

**Change B — Info grids:** All `grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3` are already mobile-responsive. No change needed here.

**Change C — Table scroll hint:** Tables already have `overflow-x-auto`. Add visual scroll hint on mobile by adding to the table container:
```html
<div class="relative overflow-x-auto">
  <!-- existing table -->
</div>
```

**Change D — Header actions:** If actions (edit/delete) are inline in header, wrap with `flex flex-col gap-3 md:flex-row md:items-center md:justify-between`.

**Change E — Card shadows:** Replace `shadow-sm` with `shadow-[var(--shadow-card)]`.

**Step 3: Verify build**

Run: `cd apps/web && pnpm build`

**Step 4: Commit**

```bash
git add apps/web/src/routes/\(app\)/assets/\[id\]/+page.svelte
git commit -m "feat: responsive asset detail page with mobile-friendly layout"
```

---

### Task 17: Final Verification and Visual QA

**Step 1: Run full build**

Run: `cd apps/web && pnpm build`
Expected: Build succeeds with no errors.

**Step 2: Run dev server and test**

Run: `cd apps/web && pnpm dev`

Test in browser at various widths:
- **Desktop (1200px+):** Everything looks identical to before. No regressions.
- **Tablet (768px-1024px):** Transition point. Desktop nav visible, tab bar hidden.
- **Mobile (375px):** Bottom tab bar visible, glass header, cards instead of tables, proper touch targets.
- **iPhone safe area:** Bottom tab bar has safe area padding.

**Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final mobile UX adjustments and polish"
```
