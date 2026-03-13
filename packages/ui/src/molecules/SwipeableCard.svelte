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
  {#if actions}
    <div class="absolute inset-y-0 right-0 flex items-stretch">
      {@render actions()}
    </div>
  {/if}

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
