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
